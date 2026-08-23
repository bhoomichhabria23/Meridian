const mongoose = require('mongoose');

const MedicalEventSchema = new mongoose.Schema({
  patientId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  type:       { type: String, enum: ['prescription','report','medication','procedure','insight','appointment','diagnosis','allergy','update'], required: true },
  refId:      { type: mongoose.Schema.Types.ObjectId },
  refModel:   { type: String },
  title:      { type: String },
  description:{ type: String },
  details:    { type: mongoose.Schema.Types.Mixed, default: {} },
  date:       { type: Date, default: Date.now },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('MedicalEvent', MedicalEventSchema);
