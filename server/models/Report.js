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
        "completed",
        "pending",
      ],
      default: "pending",
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