const express = require("express");
const router = express.Router();
const axios = require("axios");

const Medication = require("../models/Medication");
const Patient = require("../models/Patient");
const Reminder = require("../models/Reminder");
const Notification = require("../models/Notification");
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
      const reminderDate = nextDoseDate(doseTime);
      await Reminder.create({
        userId: ownerId,
        title: `Take ${medication.name}`,
        type: "medication",
        date: reminderDate,
        description: `${medication.dosage}${medication.frequency ? `, ${medication.frequency}` : ""}`,
        priority: "medium",
      });
      await Notification.create({
        userId: ownerId,
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

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const medication = await Medication.findOneAndDelete({
      _id: req.params.id,
      patientId: req.user.id,
    });
    if (!medication) return res.status(404).json({ message: "Medication not found" });
    res.json({ message: "Medication deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete medication" });
  }
});

module.exports = router;