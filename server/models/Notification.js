const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  medicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medication' },
  title:     { type: String },
  body:      { type: String },
  type:      { type: String, enum: ['booking','reminder','report','prescription','general'], default: 'general' },
  read:      { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', NotificationSchema);
