const express = require("express");
const Diagnosis = require("../models/Diagnosis");
const Allergy = require("../models/Allergy");
const Medication = require("../models/Medication");
const LabResult = require("../models/LabResult");
const AuditLog = require("../models/AuditLog");
const Patient = require("../models/Patient");
const mongoose = require("mongoose");
const { verifyToken } = require("../middleware/auth");
const SafetyEngine = require("../services/safetyEngine");

const router = express.Router();

// ==================== DIAGNOSES ====================

/**
 * GET /api/medical-records/diagnoses/:patientId
 * Get patient's diagnoses
 */
router.get(
  "/diagnoses/:patientId",
  verifyToken,
  async (req, res) => {
    try {
      const identity = String(req.params.patientId || "").trim();
      if (!identity || identity === "undefined" || identity === "null") {
        return res.status(400).json({
          success: false,
          message: "A valid patient identity is required",
          data: [],
        });
      }

      let patientUserId = null;
      let patientRecordId = null;
      if (mongoose.Types.ObjectId.isValid(identity)) {
        const patient = await Patient.findOne({
          $or: [{ _id: identity }, { userId: identity }],
        }).select("_id userId").lean();
        if (patient) {
          patientUserId = patient.userId;
          patientRecordId = patient._id;
        } else {
          patientUserId = identity;
        }
      } else {
        const user = await require("../models/User").findOne({ firebaseUid: identity }).select("_id").lean();
        if (user) {
          patientUserId = user._id;
          const patient = await Patient.findOne({ userId: user._id }).select("_id").lean();
          patientRecordId = patient?._id;
        }
      }
      if (!patientUserId) return res.status(200).json({ success: true, data: [] });

      const patientIds = [patientUserId, patientRecordId].filter(Boolean);
      const diagnoses = await Diagnosis.find({ patientId: { $in: patientIds } }).sort({ diagnosedDate: -1 });

      return res.status(200).json({
        success: true,
        data: diagnoses,
      });
    } catch (error) {
      console.error("Error fetching diagnoses:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch diagnoses",
      });
    }
  }
);

/**
 * POST /api/medical-records/diagnoses/:patientId
 * Add diagnosis for patient
 */
router.post(
  "/diagnoses/:patientId",
  verifyToken,
  async (req, res) => {
    try {
      const {
        condition,
        icdCode,
        diagnosedDate,
        status,
        severity,
        notes,
      } = req.body;

      if (!condition || !diagnosedDate) {
        return res.status(400).json({
          success: false,
          message:
            "Condition and diagnosed date are required",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(req.params.patientId)) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }
      const patient = await Patient.findOne({
        $or: [
          { _id: req.params.patientId },
          { userId: req.params.patientId },
        ],
      }).select("userId");
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      const diagnosis = await Diagnosis.create({
        patientId: patient.userId,
        doctorId: req.user.id,
        condition,
        icdCode,
        diagnosedDate,
        status: status || "active",
        severity: severity || "moderate",
        notes,
      });

      // Log audit
      await AuditLog.create({
        userId: req.user.id,
        role: req.user.role,
        action: "DIAGNOSIS_ADDED",
        entityType: "Diagnosis",
        entityId: diagnosis._id,
        targetUserId: patient.userId,
      });

      return res.status(201).json({
        success: true,
        message: "Diagnosis added successfully",
        data: diagnosis,
      });
    } catch (error) {
      console.error("Error adding diagnosis:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to add diagnosis",
      });
    }
  }
);

// ==================== ALLERGIES ====================

/**
 * GET /api/medical-records/allergies/:patientId
 * Get patient's allergies
 */
router.get(
  "/allergies/:patientId",
  verifyToken,
  async (req, res) => {
    try {
      const allergies = await Allergy.find({
        patientId: req.params.patientId,
      }).sort({ recordedDate: -1 });

      return res.status(200).json({
        success: true,
        data: allergies,
      });
    } catch (error) {
      console.error("Error fetching allergies:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch allergies",
      });
    }
  }
);

/**
 * POST /api/medical-records/allergies/:patientId
 * Add allergy for patient
 */
router.post(
  "/allergies/:patientId",
  verifyToken,
  async (req, res) => {
    try {
      const {
        allergen,
        reactionType,
        reaction,
        severity,
        recordedDate,
        notes,
      } = req.body;

      if (
        !allergen ||
        !reaction ||
        !reactionType
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Allergen, reaction type, and reaction are required",
        });
      }

      const allergy = await Allergy.create({
        patientId: req.params.patientId,
        allergen,
        reactionType,
        reaction,
        severity: severity || "moderate",
        recordedDate: recordedDate || new Date(),
        recordedBy: req.user.id,
        notes,
      });

      // Log audit
      await AuditLog.create({
        userId: req.user.id,
        role: req.user.role,
        action: "ALLERGY_ADDED",
        entityType: "Allergy",
        entityId: allergy._id,
        targetUserId: req.params.patientId,
      });

      return res.status(201).json({
        success: true,
        message: "Allergy recorded successfully",
        data: allergy,
      });
    } catch (error) {
      console.error("Error adding allergy:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to add allergy",
      });
    }
  }
);

// ==================== MEDICATIONS ====================

/**
 * GET /api/medical-records/medications/:patientId
 * Get patient's medications
 */
router.get(
  "/medications/:patientId",
  verifyToken,
  async (req, res) => {
    try {
      const medications = await Medication.find({
        patientId: req.params.patientId,
      }).sort({ startDate: -1 });

      return res.status(200).json({
        success: true,
        data: medications,
      });
    } catch (error) {
      console.error("Error fetching medications:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch medications",
      });
    }
  }
);

/**
 * POST /api/medical-records/medications/:patientId
 * Add medication for patient
 */
router.post(
  "/medications/:patientId",
  verifyToken,
  async (req, res) => {
    try {
      const {
        name,
        dosage,
        frequency,
        startDate,
        endDate,
        indication,
        prescribedBy,
        notes,
      } = req.body;

      if (!name || !dosage || !frequency) {
        return res.status(400).json({
          success: false,
          message:
            "Name, dosage, and frequency are required",
        });
      }

      const medication = await Medication.create({
        patientId: req.params.patientId,
        name,
        dosage,
        frequency,
        startDate: startDate || new Date(),
        endDate,
        indication,
        prescribedBy: prescribedBy || req.user.id,
        status: "active",
        notes,
      });

      // Log audit
      await AuditLog.create({
        userId: req.user.id,
        role: req.user.role,
        action: "MEDICATION_ADDED",
        entityType: "Medication",
        entityId: medication._id,
        targetUserId: req.params.patientId,
      });

      return res.status(201).json({
        success: true,
        message: "Medication added successfully",
        data: medication,
      });
    } catch (error) {
      console.error("Error adding medication:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to add medication",
      });
    }
  }
);

// ==================== LAB RESULTS ====================

/**
 * GET /api/medical-records/labs/:patientId
 * Get patient's lab results
 */
router.get(
  "/labs/:patientId",
  verifyToken,
  async (req, res) => {
    try {
      const labs = await LabResult.find({
        patientId: req.params.patientId,
      }).sort({ testDate: -1 });

      return res.status(200).json({
        success: true,
        data: labs,
      });
    } catch (error) {
      console.error("Error fetching lab results:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch lab results",
      });
    }
  }
);

/**
 * POST /api/medical-records/labs/:patientId
 * Add lab result for patient
 */
router.post(
  "/labs/:patientId",
  verifyToken,
  async (req, res) => {
    try {
      const {
        testName,
        testCode,
        testDate,
        results,
        laboratory,
        orderedBy,
        notes,
      } = req.body;

      if (!testName || !testDate) {
        return res.status(400).json({
          success: false,
          message: "Test name and date are required",
        });
      }

      const lab = await LabResult.create({
        patientId: req.params.patientId,
        testName,
        testCode,
        testDate,
        results: results || [],
        laboratory,
        orderedBy: orderedBy || req.user.id,
        notes,
      });

      const candidateDate = new Date(testDate);
      const windowStart = new Date(candidateDate);
      windowStart.setDate(windowStart.getDate() - 30);
      const windowEnd = new Date(candidateDate);
      windowEnd.setDate(windowEnd.getDate() + 30);
      const recentLabs = await LabResult.find({
        patientId: req.params.patientId,
        testDate: { $gte: windowStart, $lte: windowEnd},
        _id: { $ne: lab._id },
      }).lean();
      const duplicateMatches = SafetyEngine.findDuplicateTests(recentLabs, lab, 30);

      return res.status(201).json({
        success: true,
        message: "Lab result added successfully",
        data: lab,
        duplicateDetection: {
          detected: duplicateMatches.length > 0,
          matches: duplicateMatches.map(({ previous }) => ({
            labId: previous._id,
            testName: previous.testName,
            testDate: previous.testDate,
          })),
        },
      });
    } catch (error) {
      console.error("Error adding lab result:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to add lab result",
      });
    }
  }
);

module.exports = router;
