const express     = require('express');
const router      = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const Patient     = require('../models/Patient');
const Doctor      = require('../models/Doctor');
const User        = require('../models/User');
const { createEvent } = require('../utils/medicalEvent');
const { sendBookingConfirmation, sendCancellationNotice } = require('../utils/emailService');
const Notification = require('../models/Notification');

router.get('/', verifyToken, async (req, res) => {
  try {
    const query = {};

    if (req.user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ userId: req.user.id }).lean();
      if (!doctorProfile) {
        return res.status(404).json({ message: 'Doctor profile not found.' });
      }
      query.doctorId = doctorProfile._id;
    }

    if (req.user.role === 'patient') {
      const patientProfile = await Patient.findOne({ userId: req.user.id }).lean();
      if (patientProfile) {
        query.patientId = patientProfile._id;
      }
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    const appointments = await Appointment.find(query)
      .populate('doctorId', 'specialty userId')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email phone specialization' } })
      .sort({ date: -1 })
      .lean();

    const patientIds = appointments.map((appointment) => appointment.patientId).filter(Boolean);
    const patientsByIdentity = new Map();
    await Promise.all(patientIds.map(async (identity) => {
      const patient = await Patient.findById(identity)
        .populate('userId', 'name email phone')
        .lean();
      if (patient) {
        patientsByIdentity.set(String(identity), patient);
        return;
      }

      const user = await User.findById(identity).select('name email phone').lean();
      if (user) patientsByIdentity.set(String(identity), { userId: user });
    }));
    appointments.forEach((appointment) => {
      appointment.patientId = patientsByIdentity.get(String(appointment.patientId)) || null;
    });

    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { patientId, doctorId, date, timeSlot, appointmentType, department, chiefComplaint, symptomDuration, bookedVia, notes } = req.body || {};
    if (!patientId || !doctorId || !date || !timeSlot) {
      return res.status(400).json({ message: 'patientId, doctorId, date and timeSlot are required' });
    }

    const dayStart = new Date(date); dayStart.setHours(0,  0,  0,   0);
    const dayEnd   = new Date(date); dayEnd.setHours(23, 59, 59, 999);

    const existing = await Appointment.findOne({
      doctorId,
      date:     { $gte: dayStart, $lte: dayEnd },
      timeSlot,
      status:   { $ne: 'cancelled' }
    });
    if (existing) return res.status(409).json({ message: 'Slot already booked' });

    const patientRecord = await Patient.findOne({ $or: [{ _id: patientId }, { userId: patientId }] }).select('_id');
    if (!patientRecord) return res.status(404).json({ message: 'Patient record not found' });

    const appointment = new Appointment({
      patientId: patientRecord._id, doctorId, date, timeSlot, appointmentType, department,
      chiefComplaint, symptomDuration, bookedVia, notes,
      status: 'pending'
    });
    await appointment.save();

    const patient = await Patient.findById(patientRecord._id).populate('userId');
    const doctorDoc = await Doctor.findById(doctorId).populate('userId');

    if (patient && patient.userId && patient.userId.email) {
      await sendBookingConfirmation({
        to:          patient.userId.email,
        patientName: patient.userId.name,
        doctorName:  doctorDoc && doctorDoc.userId ? doctorDoc.userId.name : 'your doctor',
        date,
        timeSlot,
        referenceNo: appointment._id.toString()
      });
    }

    await createEvent({
      patientId: patientRecord._id,
      type:      'appointment',
      refId:     appointment._id,
      refModel:  'Appointment',
      title:     'Appointment booked',
      createdBy: req.user._id
    });

    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId')
      .populate('doctorId');
    if (!appointment) return res.status(404).json({ message: 'Not found' });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', verifyToken, requireRole('doctor','receptionist','admin'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Not found' });
    Object.assign(appointment, req.body);
    await appointment.save();
    const patient = await Patient.findById(appointment.patientId).populate('userId');
    if (patient?.userId?._id && req.body.status) {
      const labels = { confirmed: 'approved', cancelled: 'rejected', completed: 'completed', pending: 'set to pending' };
      await Notification.create({
        userId: patient.userId._id,
        type: req.body.status === 'cancelled' ? 'general' : 'booking',
        title: `Appointment ${labels[req.body.status] || 'updated'}`,
        body: `Your appointment on ${new Date(appointment.date).toLocaleDateString()} at ${appointment.timeSlot} was ${labels[req.body.status] || 'updated'}.`,
      });
    }
    if (req.body.status === 'cancelled') {
      await createEvent({
        patientId: appointment.patientId,
        type:      'update',
        refId:     appointment._id,
        refModel:  'Appointment',
        title:     'Appointment cancelled',
        createdBy: req.user._id
      });
    }
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Not found' });

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user.id }).select('_id');
      if (!patient || appointment.patientId.toString() !== patient._id.toString()) {
        return res.status(403).json({ message: 'You can only cancel your own appointments.' });
      }
    } else if (!['doctor', 'receptionist', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'You are not allowed to cancel appointments.' });
    }

    if (['completed', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json({ message: `Appointment is already ${appointment.status}.` });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    const patient = await Patient.findById(appointment.patientId).populate('userId');
    const doctorDoc = await require('../models/Doctor').findById(appointment.doctorId).populate('userId');
    if (patient && patient.userId && patient.userId.email) {
      await sendCancellationNotice({
        to:          patient.userId.email,
        patientName: patient.userId.name,
        doctorName:  doctorDoc && doctorDoc.userId ? doctorDoc.userId.name : 'your doctor',
        date:        appointment.date,
        timeSlot:    appointment.timeSlot
      });
    }

    await createEvent({
      patientId: appointment.patientId,
      type:      'update',
      refId:     appointment._id,
      refModel:  'Appointment',
      title:     'Appointment cancelled',
      createdBy: req.user._id
    });

    res.json({ message: 'Cancelled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
