const express = require("express");
const router = express.Router();

const Prescription = require("../models/Prescription");
const Patient = require("../models/Patient");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const { createEvent } = require("../utils/medicalEvent");

router.post("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Only doctors can create prescriptions" });
    }

    const { patientId, diagnosis, medications, notes, validUntil } = req.body || {};
    if (!patientId || !diagnosis || !Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({ message: "Patient, diagnosis and at least one medication are required" });
    }

    const patient = await Patient.findById(patientId).select("userId");
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const prescription = await Prescription.create({
      patientId: patient.userId,
      doctorId: req.user.id,
      prescriptionId: `RX${Date.now()}${Math.floor(Math.random() * 1000)}`,
      date: new Date(),
      followUpDate: validUntil || undefined,
      diagnosis,
      medications: medications.map((medication) => ({
        name: medication.name,
        dosage: medication.dosage || medication.dose || "As directed",
        frequency: medication.frequency || "",
        timing: medication.timing || medication.instructions || "",
        duration: medication.duration || "",
      })),
      notes: notes || "",
    });
    await createEvent({
      patientId: patient._id,
      type: "prescription",
      refId: prescription._id,
      refModel: "Prescription",
      title: "Prescription created",
      description: diagnosis,
      createdBy: req.user.id,
    });

    res.status(201).json(prescription);
  } catch (error) {
    console.error("Prescription create error:", error);
    res.status(500).json({ message: "Failed to save prescription" });
  }
});

router.get(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const prescriptions =
        await Prescription.find({
          patientId: req.user.id,
        })
          .populate(
            "doctorId",
            "name specialization qualification profileImage"
          )
          .populate(
            "patientId",
            "name phone patientId"
          )
          .sort({
            date: -1,
          });

      const formatted =
        prescriptions.map((prescription) => ({
          _id: prescription._id,

          prescriptionId:
            prescription.prescriptionId,

          date: prescription.date,

          followUpDate:
            prescription.followUpDate,

          status: prescription.status,

          medications:
            prescription.medications,

          notes: prescription.notes,

          doctor: {
            name:
              prescription.doctorId?.name,

            specialization:
              prescription.doctorId
                ?.specialization,

            qualification:
              prescription.doctorId
                ?.qualification,

            image:
              prescription.doctorId
                ?.profileImage,
          },

          patient: {
            name:
              prescription.patientId?.name,

            patientId:
              prescription.patientId
                ?.patientId,

            phone:
              prescription.patientId?.phone,
          },

          activeMedicationCount:
            prescription.medications.filter(
              (medication) =>
                prescription.status ===
                "active"
            ).length,
        }));

      res.status(200).json(formatted);
    } catch (error) {
      console.error(
        "Prescription fetch error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch prescriptions",
      });
    }
  }
);

router.get(
  "/:id/download",
  authMiddleware,
  async (req, res) => {
    try {
      const prescription =
        await Prescription.findOne({
          _id: req.params.id,
          patientId: req.user.id,
        });

      if (!prescription) {
        return res.status(404).json({
          message:
            "Prescription not found",
        });
      }

      /*
        Later you can generate a PDF here
        using your preferred PDF library.
      */

      res.status(200).json({
        message:
          "Prescription available",
        prescription,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Unable to download prescription",
      });
    }
  }
);

router.get(
  "/:id/print",
  authMiddleware,
  async (req, res) => {
    try {
      const prescription =
        await Prescription.findOne({
          _id: req.params.id,
          patientId: req.user.id,
        });

      if (!prescription) {
        return res.status(404).json({
          message:
            "Prescription not found",
        });
      }

      res.status(200).json({
        prescription,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Unable to print prescription",
      });
    }
  }
);

module.exports = router;