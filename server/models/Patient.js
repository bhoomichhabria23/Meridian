const mongoose = require('mongoose');

const patientCode = () => `MRD-${Math.floor(100000 + Math.random() * 900000)}`;

const PatientSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientCode:     { type: String, unique: true, default: patientCode },
  age:             { type: Number, min: 0, max: 150 },
  height:          { type: Number, min: 0 },
  weight:          { type: Number, min: 0 },
  bmi:             { type: Number, min: 0 },
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
}, {
  timestamps: true
});

module.exports = mongoose.model('Patient', PatientSchema);
