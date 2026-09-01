const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
    },

    name: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      enum: ["patient", "doctor", "receptionist"],
      required: true,
    },

    specialization: {
      type: String,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);