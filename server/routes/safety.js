const express = require("express");
const mongoose = require("mongoose");
const Prescription = require("../models/Prescription");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const SafetyAlert = require("../models/SafetyAlert");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const SafetyEngine = require("../services/safetyEngine");
const GroqService = require("../services/groqService");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.get("/patient/:patientId/current-alerts", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ success: false, message: "Only doctors can review patient safety alerts." });
    }

    const patientIdentity = String(req.params.patientId || "");
    const patient = mongoose.Types.ObjectId.isValid(patientIdentity)
      ? await Patient.findOne({ $or: [{ _id: patientIdentity }, { userId: patientIdentity }] }).select("_id userId assignedDoctors").lean()
      : null;
    if (!patient) return res.status(404).json({ success: false, message: "Patient not found." });

    const doctor = await Doctor.findOne({ userId: req.user.id }).select("_id").lean();
    if (!doctor) return res.status(403).json({ success: false, message: "Doctor profile not found." });
    const assigned = (patient.assignedDoctors || []).some((doctorId) => String(doctorId) === String(doctor._id));
    const hasCareAppointment = await Appointment.exists({
      doctorId: { $in: [doctor._id, req.user.id] },
      patientId: { $in: [patient._id, patient.userId] },
      status: { $in: ["pending", "confirmed", "completed"] },
    });
    if (!assigned && !hasCareAppointment) {
      return res.status(403).json({ success: false, message: "You are not authorized to review this patient's safety alerts." });
    }

    const analysis = await SafetyEngine.analyzePatientHistory(String(patient.userId));
    const alerts = [
      { _id: `red-flags-${patient._id}`, title: "Red-flag summary", status: analysis.status, alerts: analysis.alerts },
      { _id: `overdue-tests-${patient._id}`, title: "Overdue test reminders", status: "WARNING", alerts: analysis.overdueTests || [] },
      { _id: `duplicate-tests-${patient._id}`, title: "Duplicate test detection", status: "WARNING", alerts: analysis.duplicateTests || [] },
      { _id: `lab-trends-${patient._id}`, title: "Lab trend analysis", status: "WARNING", alerts: analysis.labTrends || [] },
    ].filter((group) => group.alerts.length > 0).map((group) => ({
      ...group,
      patientId: patient._id,
      createdAt: analysis.analyzedAt,
      reviewed: false,
    }));

    return res.json({ success: true, data: alerts });
  } catch (error) {
    console.error("Current patient safety analysis error:", error);
    return res.status(500).json({ success: false, message: "Unable to analyze the patient's current safety records." });
  }
});

router.post("/patient/:patientId/current-alerts/review", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "doctor") return res.status(403).json({ message: "Only doctors can review patient safety alerts." });
    const reason = String(req.body?.reason || "").trim();
    const action = String(req.body?.action || "acknowledged").trim();
    if (!reason) return res.status(400).json({ message: "A review reason is required." });
    const patient = await Patient.findById(req.params.patientId).select("userId assignedDoctors").lean();
    if (!patient) return res.status(404).json({ message: "Patient not found." });
    const doctor = await Doctor.findOne({ userId: req.user.id }).select("_id").lean();
    const assigned = doctor && (patient.assignedDoctors || []).some((doctorId) => String(doctorId) === String(doctor._id));
    const hasCareAppointment = await Appointment.exists({ doctorId: { $in: [doctor?._id, req.user.id] }, patientId: { $in: [patient._id, patient.userId] }, status: { $in: ["pending", "confirmed", "completed"] } });
    if (!assigned && !hasCareAppointment) return res.status(403).json({ message: "You are not authorized to review this patient's safety alerts." });
    await AuditLog.create({ userId: req.user.id, role: req.user.role, action: `SAFETY_ALERT_${action.toUpperCase()}`, entityType: "PatientSafetyAnalysis", entityId: patient._id, targetUserId: patient.userId, details: { alertId: req.body?.alertId || "current-analysis", reason } });
    res.json({ message: "Safety alert review recorded." });
  } catch (error) {
    console.error("Safety alert review error:", error);
    res.status(500).json({ message: "Unable to record safety alert review." });
  }
});

router.post("/medication-review", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Only doctors can request medication reviews" });
    }

    const { drugName, patientId } = req.body || {};
    if (!drugName || !patientId) {
      return res.status(400).json({ message: "Drug name and patient are required" });
    }

    const patient = await Patient.findById(patientId).select("age gender bloodGroup allergies conditions userId").populate("userId", "name").lean();
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const prescriptions = await Prescription.find({ patientId: patient.userId?._id || patient.userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("medications diagnosis")
      .lean();

    const activeMedications = prescriptions.flatMap((prescription) => (prescription.medications || []).map((medication) => ({
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
    })));

    const review = await GroqService.analyzeMedication(drugName, {
      age: patient.age,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      allergies: patient.allergies || [],
      conditions: patient.conditions || [],
      currentMedications: activeMedications,
    });

    res.json(review);
  } catch (error) {
    console.error("AI medication review error:", error);
    res.status(503).json({ message: "AI medication review is unavailable right now. Verify this medication with an authoritative clinical checker." });
  }
});

/**
 * GET /api/safety/patient/:patientId/alerts
 * Get all safety alerts for a patient
 */
router.get(
  "/patient/:patientId/alerts",
  verifyToken,
  async (req, res) => {
    try {
      const alerts = await SafetyAlert.find({
        patientId: req.params.patientId,
      })
        .populate("prescriptionId", "prescriptionId date")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      console.error("Error fetching alerts:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch alerts",
      });
    }
  }
);

/**
 * POST /api/safety/analyze
 * Analyze prescription for safety
 */
router.post("/analyze", verifyToken, async (req, res) => {
  try {
    const {
      patientId,
      prescriptionData,
    } = req.body;

    if (
      !patientId ||
      !prescriptionData
    ) {
      return res.status(400).json({
        success: false,
        message:
          "PatientId and prescription data are required",
      });
    }

    // Create prescription first
    const prescription = new Prescription({
      patientId,
      doctorId: req.user.id,
      prescriptionId: `PRE-${Date.now()}`,
      date: new Date(),
      medications: prescriptionData.medications ||
        [],
      indications:
        prescriptionData.indications || "",
      notes: prescriptionData.notes || "",
      status: "draft",
    });

    await prescription.save();

    // Run safety analysis
    const analysis =
      await SafetyEngine.analyzePrescription(
        patientId,
        prescription,
        req.user.id
      );

    // Create safety alert record
    const safetyAlert = new SafetyAlert({
      prescriptionId: prescription._id,
      patientId,
      doctorId: req.user.id,
      status: analysis.status,
      alerts: analysis.alerts,
    });

    await safetyAlert.save();

    // Update prescription with safety status
    prescription.safetyStatus = analysis.status;
    prescription.safetyAlertId = safetyAlert._id;
    await prescription.save();

    // Log audit
    await AuditLog.create({
      userId: req.user.id,
      role: req.user.role,
      action: "SAFETY_ANALYSIS_PERFORMED",
      entityType: "Prescription",
      entityId: prescription._id,
      targetUserId: patientId,
      details: {
        safetyStatus: analysis.status,
        alertCount: analysis.alerts.length,
      },
    });

    if (analysis.alerts.length > 0) {
      await AuditLog.create({
        userId: req.user.id,
        role: req.user.role,
        action: "SAFETY_ALERT_GENERATED",
        entityType: "SafetyAlert",
        entityId: safetyAlert._id,
        targetUserId: patientId,
        details: {
          alertCount: analysis.alerts.length,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Safety analysis completed",
      data: {
        prescription,
        safetyAlert,
        analysis,
      },
    });
  } catch (error) {
    console.error("Error analyzing prescription:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to analyze prescription",
      error: error.message,
    });
  }
});

/**
 * GET /api/safety/prescription/:prescriptionId
 * Get safety analysis for a prescription
 */
router.get(
  "/prescription/:prescriptionId",
  verifyToken,
  async (req, res) => {
    try {
      const safetyAlert = await SafetyAlert.findOne({
        prescriptionId: req.params.prescriptionId,
      }).populate(
        "prescriptionId patientId doctorId"
      );

      if (!safetyAlert) {
        return res.status(404).json({
          success: false,
          message: "Safety analysis not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: safetyAlert,
      });
    } catch (error) {
      console.error("Error fetching safety alert:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch safety analysis",
      });
    }
  }
);

/**
 * PUT /api/safety/prescription/:prescriptionId/review
 * Review and approve/reject prescription
 */
router.put(
  "/prescription/:prescriptionId/review",
  verifyToken,
  async (req, res) => {
    try {
      const {
        approved,
        reviewNotes,
      } = req.body;

      const safetyAlert =
        await SafetyAlert.findOne({
          prescriptionId: req.params.prescriptionId,
        });

      if (!safetyAlert) {
        return res.status(404).json({
          success: false,
          message: "Safety alert not found",
        });
      }

      // Update alert as reviewed
      safetyAlert.reviewed = true;
      safetyAlert.reviewedBy = req.user.id;
      safetyAlert.reviewedAt = new Date();
      safetyAlert.reviewNotes = reviewNotes;

      await safetyAlert.save();

      // Update prescription status
      const prescription = await Prescription.findById(
        req.params.prescriptionId
      );

      if (prescription) {
        prescription.status = approved
          ? "active"
          : "rejected";
        await prescription.save();
      }

      return res.status(200).json({
        success: true,
        message: approved
          ? "Prescription approved"
          : "Prescription rejected",
        data: safetyAlert,
      });
    } catch (error) {
      console.error("Error reviewing prescription:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to review prescription",
      });
    }
  }
);

/**
 * GET /api/safety/pending-reviews
 * Get all pending prescription reviews for doctor
 */
router.get("/pending-reviews", verifyToken, async (req, res) => {
  try {
    const alerts = await SafetyAlert.find({
      reviewed: false,
      status: {
        $in: ["WARNING", "HIGH_RISK"],
      },
    })
      .populate("prescriptionId patientId")
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error(
      "Error fetching pending reviews:",
      error
    );
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending reviews",
    });
  }
});

module.exports = router;
