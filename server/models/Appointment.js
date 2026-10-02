const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  patientId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor',  required: true },
  date:            { type: Date,   required: true },
  timeSlot:        { type: String, required: true },
  appointmentType: { type: String, default: 'Consultation' },
  department:      { type: String, default: '' },
  status:          { type: String, enum: ['pending','confirmed','completed','cancelled','rescheduled'], default: 'pending' },
  chiefComplaint:  { type: String },
  symptomDuration: {
    value: { type: Number },
    unit:  { type: String, enum: ['days','weeks','months'] }
  },
  bookedVia:       { type: String, enum: ['chatbot','reception','doctor'] },
  notes:           { type: String },
  createdAt:       { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
