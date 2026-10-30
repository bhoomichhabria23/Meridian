const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const chatHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
      role: {
        type: String,
        enum: ["patient", "doctor", "receptionist"],
        default: "patient",
        index: true,
      },
    conversationId: {
      type: String,
      default: randomUUID,
      index: true,
    },

    messages: [
      {
        role: {
          type: String,
          enum: ["user", "assistant"],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    title: {
      type: String,
      default: "New Chat",
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  }
);

module.exports = mongoose.model("ChatHistory", chatHistorySchema);
