const mongoose = require("mongoose");

const medicationSchema = new mongoose.Schema(
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

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    condition: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      default: "Tablet",
    },

    dosage: {
      type: String,
      required: true,
    },

    food: {
      type: String,
      default: "As directed",
    },

    frequency: {
      type: String,
      default: "As needed",
    },

    timing: {
      type: String,
      default: "",
    },

    startDate: {
      type: Date,
    },

    endDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["active", "completed", "stopped"],
      default: "active",
    },

    stoppedReason: {
      type: String,
      default: "",
      trim: true,
    },

    stoppedAt: {
      type: Date,
    },

    stoppedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reminder: {
      type: Boolean,
      default: false,
    },

    nextDose: {
      type: String,
      default: "",
    },

    dosesToday: {
      type: Number,
      default: 0,
    },

    dosesTakenThisMonth: {
      type: Number,
      default: 0,
    },

    adherence: {
      type: Number,
      default: 0,
    },

    image: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Medication",
  medicationSchema
);