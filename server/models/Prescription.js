const mongoose = require("mongoose");

const prescriptionAttachmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "attachment",
    },
    originalName: {
      type: String,
      default: "",
    },
    mimeType: {
      type: String,
      default: "application/octet-stream",
    },
    size: {
      type: Number,
      default: 0,
    },
    url: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["file", "text"],
      default: "file",
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const prescriptionMedicationSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
      },

      description: {
        type: String,
        default: "",
      },

      dosage: {
        type: String,
        required: true,
      },

      frequency: {
        type: String,
        default: "",
      },

      timing: {
        type: String,
        default: "",
      },

      duration: {
        type: String,
        default: "",
      },
    },
    { _id: true }
  );

const prescriptionSchema = new mongoose.Schema(
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

    prescriptionId: {
      type: String,
      unique: true,
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    followUpDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: [
        "active",
        "completed",
        "archived",
      ],
      default: "active",
    },

    diagnosis: {
      type: String,
      default: "",
    },

    medications: [
      prescriptionMedicationSchema,
    ],

    attachments: [
      prescriptionAttachmentSchema,
    ],

    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Prescription",
  prescriptionSchema
);