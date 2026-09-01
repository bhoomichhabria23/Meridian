const mongoose = require("mongoose");

const diagnosisSchema = new mongoose.Schema(
  {
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

    condition: {
      type: String,
      required: true,
    },

    icdCode: {
      type: String,
      default: null,
    },

    diagnosedDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "resolved", "chronic"],
      default: "active",
    },

    notes: String,

    severity: {
      type: String,
      enum: ["mild", "moderate", "severe"],
      default: "moderate",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
);

module.exports = mongoose.model("Diagnosis", diagnosisSchema);
