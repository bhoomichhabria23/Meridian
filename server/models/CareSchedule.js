const mongoose = require("mongoose");

const careScheduleSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  testName: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, default: "" },
  intervalDays: { type: Number, required: true, min: 1, max: 3650 },
  nextDueDate: { type: Date, required: true },
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("CareSchedule", careScheduleSchema);
