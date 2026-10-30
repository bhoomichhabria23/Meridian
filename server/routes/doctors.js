const express     = require('express');
const router      = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const Doctor      = require('../models/Doctor');
const User        = require('../models/User');
const Appointment = require('../models/Appointment');
const cacheManager = require('../utils/cacheManager');

// Get current doctor's profile (must come before /:id routes)
router.get('/me/profile', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied. You are not a doctor.' });
    }

    const doctor = await Doctor.findOne({ userId: req.user.id })
      .populate('userId', 'name email phone role specialization')
      .lean();

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found. Please contact administration.' });
    }

    res.json(doctor);
  } catch (err) {
    console.error('Error fetching doctor profile:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/', verifyToken, async (req, res) => {
  try {
    const query = {};
    if (req.query.specialty) query.specialty = req.query.specialty;
    
    const doctorRecords = await Doctor.find(query)
      .populate('userId', 'name email phone specialization')
      .lean();
    const doctors = doctorRecords.map((doctor) => ({
      ...doctor,
      specialty: doctor.specialty || doctor.userId?.specialization || '',
    }));
    
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', verifyToken, requireRole('receptionist'), async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select('userId');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    await Doctor.deleteOne({ _id: doctor._id });
    if (doctor.userId) await User.deleteOne({ _id: doctor.userId, role: 'doctor' });
    cacheManager.clear?.();

    res.json({ message: 'Doctor deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/slots', verifyToken, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'date query param required' });

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    const configuredStart = doctor.workingHours?.start || '10:00';
    const configuredEnd = doctor.workingHours?.end || '19:00';
    const usesLegacyDefaults = configuredStart === '09:00' && configuredEnd === '17:00';
    const minutesFromTime = (value, fallback) => {
      const [hours, minutes] = String(value).split(':').map(Number);
      return Number.isInteger(hours) && Number.isInteger(minutes) && hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60
        ? hours * 60 + minutes
        : fallback;
    };
    const startMin = Math.max(10 * 60, usesLegacyDefaults ? 10 * 60 : minutesFromTime(configuredStart, 10 * 60));
    const endMin = Math.min(19 * 60, usesLegacyDefaults ? 19 * 60 : minutesFromTime(configuredEnd, 19 * 60));
    const slotDuration = 30;
    if (endMin <= startMin) return res.status(400).json({ message: 'Doctor working hours do not overlap the 10:00–19:00 booking window.' });

    const allSlots = [];
    let cur = startMin;
    while (cur < endMin) {
      const h = Math.floor(cur / 60).toString().padStart(2, '0');
      const m = (cur % 60).toString().padStart(2, '0');
      const overlapsLunchBreak = cur < 15 * 60 && cur + slotDuration > 14 * 60;
      if (!overlapsLunchBreak) allSlots.push(`${h}:${m}`);
      cur += slotDuration;
    }

    const dayStart = new Date(date); dayStart.setHours(0,  0,  0,   0);
    const dayEnd   = new Date(date); dayEnd.setHours(23, 59, 59, 999);

    const booked = await Appointment.find({
      doctorId: req.params.id,
      date:     { $gte: dayStart, $lte: dayEnd },
      status:   { $ne: 'cancelled' }
    }).select('timeSlot').lean();

    const occupiedSlots = booked.map(a => a.timeSlot);
    const available     = allSlots.filter(s => !occupiedSlots.includes(s));
    res.json({ date, available });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/appointments', verifyToken, async (req, res) => {
  try {
    const query = { doctorId: req.params.id, status: { $in: ['confirmed', 'completed'] } };
    if (req.query.date) {
      const dayStart = new Date(req.query.date); dayStart.setHours(0,  0,  0,   0);
      const dayEnd   = new Date(req.query.date); dayEnd.setHours(23, 59, 59, 999);
      query.date = { $gte: dayStart, $lte: dayEnd };
    }
    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email phone userId')
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email phone' } })
      .sort({ date: 1 })
      .lean();
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
