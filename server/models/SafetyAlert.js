const mongoose = require("mongoose");

const safetyAlertSchema = new mongoose.Schema(
  {
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription",
      required: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["SAFE", "WARNING", "HIGH_RISK"],
      default: "SAFE",
    },

    alerts: [
      {
        type: {
          type: String,
          enum: [
            "allergy_conflict",
            "medication_interaction",
            "previous_medication_issue",
            "diagnosis_consideration",
            "lab_consideration",
            "duplicate_medication",
          ],
        },
        severity: {
          type: String,
          enum: ["LOW", "MEDIUM", "HIGH"],
        },
        message: String,
        evidence: String,
        recommendation: String,
        relevantRecord: {
          recordType: String, // 'allergy', 'medication', 'lab', etc.
          recordId: mongoose.Schema.Types.ObjectId,
          recordDetails: String,
        },
      },
    ],

    reviewed: {
      type: Boolean,
      default: false,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    reviewNotes: String,

    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
);

module.exports = mongoose.model("SafetyAlert", safetyAlertSchema);
