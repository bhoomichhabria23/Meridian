const mongoose = require("mongoose");

const medicationDoseSchema = new mongoose.Schema(
  {
    medicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medication",
      required: true,
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    scheduledFor: {
      type: Date,
      required: true,
    },
    takenAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

medicationDoseSchema.index({ medicationId: 1, scheduledFor: 1 }, { unique: true });

module.exports = mongoose.model("MedicationDose", medicationDoseSchema);
