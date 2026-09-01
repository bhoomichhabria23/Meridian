const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: ["patient", "doctor", "receptionist"],
      required: true,
    },

    action: {
      type: String,
      enum: [
        "LOGIN",
        "PATIENT_VIEWED",
        "MEDICAL_RECORD_VIEWED",
        "APPOINTMENT_CREATED",
        "APPOINTMENT_UPDATED",
        "DIAGNOSIS_ADDED",
        "ALLERGY_ADDED",
        "MEDICATION_ADDED",
        "PRESCRIPTION_CREATED",
        "SAFETY_ANALYSIS_PERFORMED",
        "SAFETY_ALERT_GENERATED",
        "CHATBOT_USED",
        "LOGOUT",
      ],
      required: true,
    },

    entityType: String,

    entityId: mongoose.Schema.Types.ObjectId,

    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    details: mongoose.Schema.Types.Mixed,

    ipAddress: String,

    userAgent: String,

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
