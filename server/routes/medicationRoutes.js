const express = require("express");
const router = express.Router();
const axios = require("axios");

const Medication = require("../models/Medication");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const Reminder = require("../models/Reminder");
const Notification = require("../models/Notification");
const MedicalEvent = require("../models/MedicalEvent");
const authMiddleware = require("../middleware/authMiddleware");
const { createEvent } = require("../utils/medicalEvent");

function nextDoseDate(doseTime) {
  const date = new Date();
  const [hours, minutes] = String(doseTime || "").split(":").map(Number);
  if (Number.isInteger(hours) && Number.isInteger(minutes)) {
    date.setHours(hours, minutes, 0, 0);
    if (date <= new Date()) date.setDate(date.getDate() + 1);
  } else {
    date.setHours(date.getHours() + 1, 0, 0, 0);
  }
  return date;
}

function dosesPerDay(frequency) {
  const value = String(frequency || "").toLowerCase();
  if (/(twice|2\s*(?:times|x)?)/.test(value)) return 2;
  if (/(thrice|three times|3\s*(?:times|x)?)/.test(value)) return 3;
  if (/(four times|4\s*(?:times|x)?)/.test(value)) return 4;
  return 1;
}

function reminderDates(startDate, endDate, frequency, doseTime) {
  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate ? new Date(endDate) : new Date(start);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  const count = dosesPerDay(frequency);
  const dates = [];
  const [hours, minutes] = String(doseTime || "09:00").split(":").map(Number);
  const firstHour = Number.isInteger(hours) ? hours : 9;
  const firstMinute = Number.isInteger(minutes) ? minutes : 0;

  for (const day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
    for (let dose = 0; dose < count; dose += 1) {
      const reminderDate = new Date(day);
      reminderDate.setHours(firstHour + Math.floor((dose * 24) / count), firstMinute, 0, 0);
      dates.push(reminderDate);
    }
  }
  return dates;
}

async function resolveRxCUI(name) {
  try {
    const response = await axios.get(`https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(name)}`);
    return response.data?.idGroup?.rxnormId?.[0] || null;
  } catch {
    return null;
  }
}

// GET patient's medications
router.get("/", authMiddleware, async (req, res) => {
  try {
    await Medication.updateMany(
      {
        patientId: req.user.id,
        status: "active",
        endDate: { $lt: new Date() },
      },
      { $set: { status: "completed" } },
    );
    const medications = await Medication.find({
      patientId: req.user.id,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json(medications);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch medications",
    });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { patientId, name, dosage, frequency, timing, doseTime, reminder, startDate, endDate, description, condition, type } = req.body || {};
    if (!name || !dosage) {
      return res.status(400).json({ message: "Medication name and dosage are required" });
    }

    const ownerId = req.user.role === "patient" ? req.user.id : patientId;
    if (!ownerId) return res.status(400).json({ message: "Patient is required" });

    const medication = await Medication.create({
      patientId: ownerId,
      doctorId: req.user.role === "doctor" ? req.user.id : undefined,
      name, dosage, frequency, timing, nextDose: doseTime || "", reminder: Boolean(reminder), startDate, endDate, description, condition, type,
    });
    if (Boolean(reminder)) {
      const dates = reminderDates(startDate, endDate, frequency, doseTime);
      const reminderDate = dates[0] || nextDoseDate(doseTime);
      await Reminder.insertMany((dates.length ? dates : [reminderDate]).map((date) => ({
          userId: ownerId,
          medicationId: medication._id,
          title: `Take ${medication.name}`,
          type: "medication",
          date,
          description: `${medication.dosage}${medication.frequency ? `, ${medication.frequency}` : ""}`,
          priority: "medium",
        })));
      await Notification.create({
        userId: ownerId,
        medicationId: medication._id,
        title: "Medication reminder enabled",
        body: `${medication.name} reminder set for ${reminderDate.toLocaleString()}.`,
        type: "reminder",
      });
    }
    const patient = await Patient.findOne({ $or: [{ _id: ownerId }, { userId: ownerId }] }).select("_id");
    if (patient) {
      await createEvent({
        patientId: patient._id,
        type: "medication",
        refId: medication._id,
        refModel: "Medication",
        title: `Medication added: ${medication.name}`,
        description: `${medication.dosage}${medication.frequency ? `, ${medication.frequency}` : ""}`,
        createdBy: req.user.id,
      });
    }

    res.status(201).json(medication);
  } catch (error) {
    console.error("Create medication error:", error);
    res.status(500).json({ message: error.message || "Failed to create medication" });
  }
});

router.get("/interactions", authMiddleware, async (req, res) => {
  try {
    const medications = await Medication.find({ patientId: req.user.id, status: "active" }).select("name");
    const resolved = [];
    for (const medication of medications) {
      const rxcui = await resolveRxCUI(medication.name);
      if (rxcui) resolved.push({ name: medication.name, rxcui });
    }
    const interactions = [];
    for (let first = 0; first < resolved.length; first += 1) {
      for (let second = first + 1; second < resolved.length; second += 1) {
        const response = await axios.get(`https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${resolved[first].rxcui}+${resolved[second].rxcui}`);
        const groups = response.data?.fullInteractionTypeGroup || [];
        groups.forEach((group) => (group.fullInteractionType || []).forEach((type) => (type.interactionPair || []).forEach((pair) => {
          interactions.push({ medicationA: resolved[first].name, medicationB: resolved[second].name, severity: /contraindicated|major/i.test(pair.description || "") ? "danger" : /moderate/i.test(pair.description || "") ? "caution" : "info", description: pair.description || "Known interaction reported by RxNav." });
        })));
      }
    }
    res.json({ count: interactions.length, interactions });
  } catch (error) {
    res.status(502).json({ message: "Unable to check medication interactions." });
  }
});

// MARK MEDICATION AS TAKEN
router.post(
  "/:id/take",
  authMiddleware,
  async (req, res) => {
    try {
      const medication =
        await Medication.findOne({
          _id: req.params.id,
          patientId: req.user.id,
        });

      if (!medication) {
        return res.status(404).json({
          message: "Medication not found",
        });
      }

      medication.dosesTakenThisMonth = Number(medication.dosesTakenThisMonth || 0) + 1;
      medication.dosesToday = Number(medication.dosesToday || 0) + 1;
      if (medication.endDate && medication.endDate <= new Date()) {
        medication.status = "completed";
      }

      await medication.save();

      res.status(200).json({
        message: "Medication marked as taken",
        medication,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to update medication",
      });
    }
  }
);

router.patch("/:id/stop", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Only the patient's doctor can stop a medication." });
    }
    const reason = String(req.body?.reason || "").trim();
    if (!reason) return res.status(400).json({ message: "A reason is required to stop this medication." });

    const doctor = await Doctor.findOne({ userId: req.user.id }).select("_id").lean();
    if (!doctor) return res.status(403).json({ message: "Doctor profile not found." });

    const medication = await Medication.findById(req.params.id);
    if (!medication) return res.status(404).json({ message: "Medication not found." });
    if (medication.status !== "active") {
      return res.status(409).json({ message: "Only active medications can be stopped." });
    }

    const patient = await Patient.findOne({
      $or: [
        { userId: medication.patientId },
        { _id: medication.patientId },
      ],
    }).select("_id userId assignedDoctors").lean();
    if (!patient) return res.status(404).json({ message: "Patient not found." });

    const doctorIds = [doctor._id, req.user.id];
    const patientIds = [patient._id, patient.userId, medication.patientId];
    const assigned = (patient.assignedDoctors || []).some((id) => String(id) === String(doctor._id));
    const hasCareAppointment = await Appointment.exists({
      doctorId: { $in: doctorIds },
      patientId: { $in: patientIds },
    });
    if (!assigned && !hasCareAppointment) {
      return res.status(403).json({ message: "You do not have a care relationship with this patient." });
    }

    medication.status = "stopped";
    medication.stoppedReason = reason;
    medication.stoppedAt = new Date();
    medication.stoppedBy = req.user.id;
    await medication.save();

    res.json({ message: "Medication stopped and reason recorded.", medication });
  } catch (error) {
    console.error("Stop medication error:", error);
    res.status(500).json({ message: "Unable to stop medication." });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const medication = await Medication.findOneAndDelete({
      _id: req.params.id,
      patientId: req.user.id,
    });
    if (!medication) return res.status(404).json({ message: "Medication not found" });

    await Promise.all([
      Reminder.deleteMany({ medicationId: medication._id }),
      Notification.deleteMany({ medicationId: medication._id }),
      MedicalEvent.deleteMany({ refModel: "Medication", refId: medication._id }),
    ]);

    res.json({ message: "Medication deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete medication" });
  }
});

module.exports = router;