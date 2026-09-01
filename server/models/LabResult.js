const mongoose = require("mongoose");

const labResultSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    testName: {
      type: String,
      required: true,
    },

    testCode: {
      type: String,
      default: null,
    },

    testDate: {
      type: Date,
      required: true,
    },

    results: [
      {
        parameter: String,
        value: String,
        unit: String,
        referenceRange: String,
        status: {
          type: String,
          enum: ["normal", "abnormal", "critical"],
          default: "normal",
        },
      },
    ],

    laboratory: {
      name: String,
      city: String,
    },

    orderedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    notes: String,

    attachments: [
      {
        fileName: String,
        fileUrl: String,
        uploadedAt: Date,
      },
    ],

    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
);

module.exports = mongoose.model("LabResult", labResultSchema);
