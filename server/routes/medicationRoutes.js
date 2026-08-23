const express = require("express");
const router = express.Router();

const Medication = require("../models/Medication");
const Patient = require("../models/Patient");
const authMiddleware = require("../middleware/authMiddleware");
const { createEvent } = require("../utils/medicalEvent");

// GET patient's medications
router.get("/", authMiddleware, async (req, res) => {
  try {
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
    const { patientId, name, dosage, frequency, timing, startDate, endDate, description, type } = req.body || {};
    if (!name || !dosage) {
      return res.status(400).json({ message: "Medication name and dosage are required" });
    }

    const ownerId = req.user.role === "patient" ? req.user.id : patientId;
    if (!ownerId) return res.status(400).json({ message: "Patient is required" });

    const medication = await Medication.create({
      patientId: ownerId,
      doctorId: req.user.role === "doctor" ? req.user.id : undefined,
      name, dosage, frequency, timing, startDate, endDate, description, type,
    });
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

module.exports = router;