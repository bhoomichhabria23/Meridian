const express     = require('express');
const router      = express.Router();
const { verifyToken } = require('../middleware/auth');
const Doctor      = require('../models/Doctor');
const Appointment = require('../models/Appointment');

router.get('/', verifyToken, async (req, res) => {
  try {
    const query = {};
    if (req.query.specialty) query.specialty = req.query.specialty;
    const doctors = await Doctor.find(query).populate('userId');
    res.json(doctors);
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

    const start        = (doctor.workingHours && doctor.workingHours.start) || '09:00';
    const end          = (doctor.workingHours && doctor.workingHours.end)   || '17:00';
    const slotDuration = doctor.slotDuration || 20;

    const [startH, startM] = start.split(':').map(Number);
    const [endH,   endM]   = end.split(':').map(Number);

    const allSlots = [];
    let cur = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    while (cur < endMin) {
      const h = Math.floor(cur / 60).toString().padStart(2, '0');
      const m = (cur % 60).toString().padStart(2, '0');
      allSlots.push(`${h}:${m}`);
      cur += slotDuration;
    }

    const dayStart = new Date(date); dayStart.setHours(0,  0,  0,   0);
    const dayEnd   = new Date(date); dayEnd.setHours(23, 59, 59, 999);

    const booked = await Appointment.find({
      doctorId: req.params.id,
      date:     { $gte: dayStart, $lte: dayEnd },
      status:   { $ne: 'cancelled' }
    }).select('timeSlot');

    const occupiedSlots = booked.map(a => a.timeSlot);
    const available     = allSlots.filter(s => !occupiedSlots.includes(s));
    res.json({ date, available });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/appointments', verifyToken, async (req, res) => {
  try {
    const query = { doctorId: req.params.id };
    if (req.query.date) {
      const dayStart = new Date(req.query.date); dayStart.setHours(0,  0,  0,   0);
      const dayEnd   = new Date(req.query.date); dayEnd.setHours(23, 59, 59, 999);
      query.date = { $gte: dayStart, $lte: dayEnd };
    }
    const appointments = await Appointment.find(query).populate('patientId');
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
