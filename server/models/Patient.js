const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dateOfBirth:     { type: Date },
  gender:          { type: String, enum: ['male','female','other','prefer_not'] },
  bloodGroup:      { type: String, enum: ['A+','A-','B+','B-','O+','O-','AB+','AB-','unknown'], default: 'unknown' },
  allergies:       [{ type: String }],
  conditions:      [{
    name:        { type: String },
    diagnosedOn: { type: Date },
    notes:       { type: String }
  }],
  assignedDoctors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
  emergencyContact:{
    name:         { type: String },
    relationship: { type: String },
    phone:        { type: String }
  },
  address: { type: String, default: '' }
});

module.exports = mongoose.model('Patient', PatientSchema);
