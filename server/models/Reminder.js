const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  medicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medication' },
  title: { type: String, required: true, trim: true },
  type: { type: String, enum: ['medication', 'appointment', 'lab_test', 'follow_up', 'health_checkup'], default: 'health_checkup' },
  date: { type: Date, required: true },
  description: { type: String, default: '' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['active', 'completed', 'snoozed'], default: 'active' },
  snoozedUntil: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Reminder', ReminderSchema);
