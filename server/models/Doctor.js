const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  specialty:    { type: String },
  licenseNo:    { type: String, unique: true, sparse: true },
  hospital:     { type: String },
  department:   { type: String },
  workingHours: {
    start: { type: String, default: '10:00' },
    end:   { type: String, default: '19:00' },
    days:  [{ type: Number }]
  },
  slotDuration: { type: Number, default: 30 },
  patients:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }]
});

module.exports = mongoose.model('Doctor', DoctorSchema);
