const express = require("express");
const mongoose = require("mongoose");
const Prescription = require("../models/Prescription");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const Allergy = require("../models/Allergy");
const Medication = require("../models/Medication");
const Diagnosis = require("../models/Diagnosis");
const LabResult = require("../models/LabResult");
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

const buildPatientSafetyAlerts = async (patientId) => {
  const patientRecord = await Patient.findById(patientId).select("_id userId age gender").lean();
  const patientUserId = patientRecord?.userId || patientId;
  const patientAge = Number(patientRecord?.age || 0);

  const [allergies, activeMeds, diagnoses, labs] = await Promise.all([
    Allergy.find({ patientId: patientUserId, isActive: true }).lean(),
    Medication.find({ patientId: patientUserId, status: "active" }).lean(),
    Diagnosis.find({ patientId: patientUserId, status: { $in: ["active", "chronic"] } }).lean(),
    LabResult.find({ patientId: patientUserId }).sort({ testDate: -1 }).limit(10).lean(),
  ]);

  const generatedAlerts = [];
  const alertMap = new Map();

  const pushAlert = (status, item) => {
    const bucketKey = item.type + item.message;
    if (!alertMap.has(bucketKey)) {
      alertMap.set(bucketKey, {
        _id: new mongoose.Types.ObjectId(),
        patientId: patientUserId,
        status,
        alerts: [],
        createdAt: new Date(),
      });
    }
    const bucket = alertMap.get(bucketKey);
    bucket.alerts.push(item);
  };

  allergies.forEach((allergy) => {
    const allergen = String(allergy.allergen || "").toLowerCase();
    const relevantMeds = activeMeds.filter((med) => {
      const name = String(med.name || "").toLowerCase();
      return name.includes(allergen) || allergen.includes(name);
    });

    if (relevantMeds.length) {
      pushAlert("HIGH_RISK", {
        type: "allergy_conflict",
        severity: String(allergy.severity || "moderate").toUpperCase(),
        message: `Allergy conflict detected with ${allergy.allergen}`,
        evidence: `Patient is allergic to ${allergy.allergen} and is currently prescribed ${relevantMeds.map((med) => med.name).join(", ")}.`,
        recommendation: "Review the allergy history and consider an alternative medication before continuing.",
        relevantRecord: {
          recordType: "allergy",
          recordId: allergy._id,
          recordDetails: `${allergy.allergen} - ${allergy.reaction || allergy.reactionType || "allergic reaction"}`,
        },
      });
    }
  });

  const interactionRules = {
    warfarin: ["aspirin", "ibuprofen", "naproxen"],
    lisinopril: ["ibuprofen", "naproxen", "aspirin"],
    metformin: ["alcohol"],
  };

  for (let i = 0; i < activeMeds.length; i++) {
    const currentMed = activeMeds[i];
    for (let j = i + 1; j < activeMeds.length; j++) {
      const candidate = activeMeds[j];
      const currentName = String(currentMed.name || "").toLowerCase();
      const candidateName = String(candidate.name || "").toLowerCase();

      if (currentName === candidateName) {
        pushAlert("WARNING", {
          type: "duplicate_medication",
          severity: "MEDIUM",
          message: `Duplicate medication detected: ${currentMed.name}`,
          evidence: `${currentMed.name} is already active for this patient and appears again in the current medication list.`,
          recommendation: "Verify whether this duplicate is intentional before continuing the prescription.",
          relevantRecord: {
            recordType: "medication",
            recordId: currentMed._id,
            recordDetails: `${currentMed.name} - ${currentMed.dosage || ""}`,
          },
        });
      }

      Object.entries(interactionRules).forEach(([primary, mates]) => {
        if (currentName.includes(primary) && mates.some((mate) => candidateName.includes(mate))) {
          pushAlert("HIGH_RISK", {
            type: "medication_interaction",
            severity: "HIGH",
            message: `Potential interaction between ${currentMed.name} and ${candidate.name}`,
            evidence: `${currentMed.name} may interact with ${candidate.name} and increase the risk of adverse effects.`,
            recommendation: "Review the medication combination and consider safer alternatives or dose adjustment.",
            relevantRecord: {
              recordType: "medication",
              recordId: currentMed._id,
              recordDetails: `${currentMed.name} - ${candidate.name}`,
            },
          });
        }
      });
    }
  }

  diagnoses.forEach((diagnosis) => {
    const conditionName = String(diagnosis.condition || "").toLowerCase();
    const medWarnings = activeMeds.filter((med) => {
      const name = String(med.name || "").toLowerCase();
      return (name.includes("ibuprofen") || name.includes("naproxen") || name.includes("nsaid")) && (conditionName.includes("hypertension") || conditionName.includes("renal") || conditionName.includes("kidney"));
    });

    if (medWarnings.length) {
      pushAlert("WARNING", {
        type: "diagnosis_consideration",
        severity: "MEDIUM",
        message: `Medication review recommended for ${diagnosis.condition}`,
        evidence: `The patient has ${diagnosis.condition} as an active diagnosis, and the current medication list includes medication that may require caution.`,
        recommendation: "Review whether this prescription is appropriate for the patient’s diagnosis before confirming it.",
        relevantRecord: {
          recordType: "diagnosis",
          recordId: diagnosis._id,
          recordDetails: diagnosis.condition,
        },
      });
    }
  });

  labs.forEach((lab) => {
    (lab.results || []).forEach((result) => {
      if (["abnormal", "critical"].includes(result.status)) {
        pushAlert(result.status === "critical" ? "HIGH_RISK" : "WARNING", {
          type: "lab_consideration",
          severity: result.status === "critical" ? "HIGH" : "MEDIUM",
          message: `Abnormal lab value: ${result.parameter}`,
          evidence: `${result.parameter} is ${result.status} with value ${result.value} ${result.unit || ""}.`,
          recommendation: "Review the latest lab values and reassess the treatment plan before continuing this prescription.",
          relevantRecord: {
            recordType: "lab",
            recordId: lab._id,
            recordDetails: `${lab.testName || "Lab result"} - ${result.parameter}`,
          },
        });
      }

      const lowerParameter = String(result.parameter || "").toLowerCase();
      if (lowerParameter.includes("creatinine") && Number(result.value) > 1.4) {
        pushAlert("HIGH_RISK", {
          type: "renal_risk",
          severity: "HIGH",
          message: "Renal risk detected",
          evidence: `Creatinine is elevated at ${result.value} ${result.unit || ""}.`,
          recommendation: "Reassess renal function before continuing nephrotoxic or renally cleared medication.",
          relevantRecord: {
            recordType: "lab",
            recordId: lab._id,
            recordDetails: `${lab.testName || "Lab result"} - Creatinine`,
          },
        });
      }

      if (lowerParameter.includes("inr") && Number(result.value) > 3) {
        pushAlert("HIGH_RISK", {
          type: "inr_warning",
          severity: "HIGH",
          message: "High INR detected",
          evidence: `INR is elevated at ${result.value}.`,
          recommendation: "Review anticoagulation dosing and bleeding risk before continuing treatment.",
          relevantRecord: {
            recordType: "lab",
            recordId: lab._id,
            recordDetails: `${lab.testName || "Lab result"} - INR`,
          },
        });
      }
    });
  });

  const hasWarfarin = activeMeds.some((med) => String(med.name || "").toLowerCase().includes("warfarin"));
  if (hasWarfarin && patientAge >= 65) {
    pushAlert("WARNING", {
      type: "age_related_caution",
      severity: "MEDIUM",
      message: "Age-related anticoagulant caution",
      evidence: "The patient is 65 or older and is on warfarin, which raises bleeding risk.",
      recommendation: "Review anticoagulation monitoring, INR status, and bleeding risk factors before continuing.",
      relevantRecord: {
        recordType: "medication",
        recordId: activeMeds.find((med) => String(med.name || "").toLowerCase().includes("warfarin"))._id,
        recordDetails: "Warfarin monitoring",
      },
    });
  }

  const pregnancyRelated = activeMeds.some((med) => {
    const name = String(med.name || "").toLowerCase();
    return ["isotretinoin", "spironolactone", "methotrexate", "lisinopril", "warfarin"].some((medName) => name.includes(medName));
  });
  if (patientRecord?.gender === "female" && pregnancyRelated) {
    pushAlert("HIGH_RISK", {
      type: "pregnancy_contraindication",
      severity: "HIGH",
      message: "Pregnancy contraindication risk",
      evidence: "The patient is female and has a medication in the current list that may be contraindicated in pregnancy or may require specialist review.",
      recommendation: "Confirm pregnancy status and review safer alternatives before continuing therapy.",
      relevantRecord: {
        recordType: "medication",
        recordId: activeMeds.find((med) => ["isotretinoin", "spironolactone", "methotrexate", "lisinopril", "warfarin"].some((medName) => String(med.name || "").toLowerCase().includes(medName)))?._id,
        recordDetails: "Medication pregnancy risk review",
      },
    });
  }

  const hepaticRisk = activeMeds.some((med) => {
    const name = String(med.name || "").toLowerCase();
    return ["acetaminophen", "statin", "azole", "methotrexate"].some((medName) => name.includes(medName));
  });
  const hasLiverDiagnosis = diagnoses.some((diag) => String(diag.condition || "").toLowerCase().includes("liver") || String(diag.condition || "").toLowerCase().includes("hepatic"));
  if (hepaticRisk && hasLiverDiagnosis) {
    pushAlert("HIGH_RISK", {
      type: "hepatic_toxicity_risk",
      severity: "HIGH",
      message: "Hepatic toxicity risk",
      evidence: "The patient has liver-related diagnosis and is on medication that may increase hepatic toxicity risk.",
      recommendation: "Review liver function and reduce or avoid hepatotoxic medication when clinically appropriate.",
      relevantRecord: {
        recordType: "diagnosis",
        recordId: diagnoses.find((diag) => String(diag.condition || "").toLowerCase().includes("liver") || String(diag.condition || "").toLowerCase().includes("hepatic"))._id,
        recordDetails: "Liver-related diagnosis",
      },
    });
  }

  const cardiacRisk = activeMeds.some((med) => {
    const name = String(med.name || "").toLowerCase();
    return ["digoxin", "amiodarone", "lisinopril", "beta blocker", "metoprolol"].some((medName) => name.includes(medName));
  });
  const hasHeartDiagnosis = diagnoses.some((diag) => String(diag.condition || "").toLowerCase().includes("heart") || String(diag.condition || "").toLowerCase().includes("cardiac") || String(diag.condition || "").toLowerCase().includes("arrhythmia"));
  if (cardiacRisk && hasHeartDiagnosis) {
    pushAlert("WARNING", {
      type: "cardiac_risk",
      severity: "MEDIUM",
      message: "Cardiac monitoring recommended",
      evidence: "The patient has a cardiac condition and is on medication that requires ECG or rhythm monitoring.",
      recommendation: "Reassess dose, rhythm status, and contraindications before continuing this regimen.",
      relevantRecord: {
        recordType: "diagnosis",
        recordId: diagnoses.find((diag) => String(diag.condition || "").toLowerCase().includes("heart") || String(diag.condition || "").toLowerCase().includes("cardiac") || String(diag.condition || "").toLowerCase().includes("arrhythmia"))._id,
        recordDetails: "Cardiac diagnosis",
      },
    });
  }

  const kidneyRisk = activeMeds.some((med) => {
    const name = String(med.name || "").toLowerCase();
    return ["metformin", "lisinopril", "ibuprofen", "naproxen", "gentamicin"].some((medName) => name.includes(medName));
  });
  const hasRenalDiagnosis = diagnoses.some((diag) => String(diag.condition || "").toLowerCase().includes("kidney") || String(diag.condition || "").toLowerCase().includes("renal"));
  if ((kidneyRisk || labs.some((lab) => (lab.results || []).some((result) => String(result.parameter || "").toLowerCase().includes("creatinine") && Number(result.value) > 1.3))) && hasRenalDiagnosis) {
    pushAlert("HIGH_RISK", {
      type: "renal_dosing_caution",
      severity: "HIGH",
      message: "Renal dosing caution",
      evidence: "The patient has a renal diagnosis or elevated creatinine and is on a medication that may require dose adjustment.",
      recommendation: "Check creatinine clearance and adjust the dose or choose a safer alternative.",
      relevantRecord: {
        recordType: "diagnosis",
        recordId: diagnoses.find((diag) => String(diag.condition || "").toLowerCase().includes("kidney") || String(diag.condition || "").toLowerCase().includes("renal"))?._id,
        recordDetails: "Renal diagnosis",
      },
    });
  }

  const unfilledMedicationCount = activeMeds.filter((med) => (med.dosesTakenThisMonth || 0) === 0).length;
  if (unfilledMedicationCount > 0) {
    pushAlert("WARNING", {
      type: "adherence_issue",
      severity: "MEDIUM",
      message: "Medication adherence concern",
      evidence: `${unfilledMedicationCount} active medication record(s) have no doses logged for the current period.`,
      recommendation: "Review adherence and confirm whether the patient is taking the prescribed medication as directed.",
      relevantRecord: {
        recordType: "medication",
        recordId: activeMeds[0]?._id,
        recordDetails: `${unfilledMedicationCount} medication(s) with zero logged doses`,
      },
    });
  }

  return Array.from(alertMap.values()).sort((a, b) => {
    const order = { HIGH_RISK: 3, WARNING: 2, SAFE: 1 };
    return order[b.status] - order[a.status];
  });
};

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
      const storedAlerts = await SafetyAlert.find({
        patientId: req.params.patientId,
      })
        .populate("prescriptionId", "prescriptionId date")
        .sort({ createdAt: -1 })
        .lean();

      if (storedAlerts.length) {
        return res.status(200).json({
          success: true,
          data: storedAlerts,
        });
      }

      const generatedAlerts = await buildPatientSafetyAlerts(req.params.patientId);
      return res.status(200).json({
        success: true,
        data: generatedAlerts,
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
