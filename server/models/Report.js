const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reportId: {
      type: String,
      unique: true,
      required: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    uploadedByRole: {
      type: String,
      enum: ["patient", "doctor", "receptionist"],
      default: "patient",
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    testName: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      enum: [
        "lab",
        "imaging",
        "clinical",
        "cardiology",
        "pathology",
        "radiology",
        "other",
      ],
      default: "other",
    },

    status: {
      type: String,
      enum: [
        "normal",
        "abnormal",
        "critical",
        "completed",
        "pending",
      ],
      default: "pending",
    },

    reviewStatus: {
      type: String,
      enum: ["pending", "viewed", "reviewed"],
      default: "pending",
    },

    clinicalResult: {
      type: String,
      default: "",
      trim: true,
    },

    resultStatus: {
      type: String,
      enum: ["not_specified", "normal", "abnormal", "critical"],
      default: "not_specified",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reviewedAt: {
      type: Date,
    },

    date: {
      type: Date,
      default: Date.now,
    },

    labName: {
      type: String,
      default: "",
    },

    fileUrl: {
      type: String,
      default: "",
    },

    fileType: {
      type: String,
      default: "",
    },

    fileName: {
      type: String,
      default: "",
    },

    extractedText: {
      type: String,
      default: "",
    },

    aiSummary: {
      type: String,
      default: "",
    },

    ocrStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "not_applicable"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Report",
  reportSchema
);