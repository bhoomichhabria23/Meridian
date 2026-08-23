const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  specialty:    { type: String },
  licenseNo:    { type: String, unique: true },
  hospital:     { type: String },
  department:   { type: String },
  workingHours: {
    start: { type: String, default: '09:00' },
    end:   { type: String, default: '17:00' },
    days:  [{ type: Number }]
  },
  slotDuration: { type: Number, default: 20 },
  patients:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }]
});

module.exports = mongoose.model('Doctor', DoctorSchema);
