const mongoose = require("mongoose");

const allergySchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    allergen: {
      type: String,
      required: true,
    },

    reactionType: {
      type: String,
      required: true,
    },

    severity: {
      type: String,
      enum: ["mild", "moderate", "severe", "life-threatening"],
      default: "moderate",
    },

    reaction: {
      type: String,
      required: true,
    },

    recordedDate: {
      type: Date,
      required: true,
    },

    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    notes: String,

    isActive: {
      type: Boolean,
      default: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
);

module.exports = mongoose.model("Allergy", allergySchema);
