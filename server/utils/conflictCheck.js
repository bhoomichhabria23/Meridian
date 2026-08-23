const Appointment = require('../models/Appointment');
const Doctor      = require('../models/Doctor');

async function checkConflict(doctorId, date, timeSlot) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const conflict = await Appointment.findOne({
    doctorId,
    date:     { $gte: dayStart, $lte: dayEnd },
    timeSlot,
    status:   { $ne: 'cancelled' }
  });

  if (!conflict) return { hasConflict: false, alternatives: [] };

  const doctor = await Doctor.findById(doctorId);
  const slotDuration = doctor ? doctor.slotDuration || 20 : 20;
  const start = doctor && doctor.workingHours ? doctor.workingHours.start || '09:00' : '09:00';
  const end   = doctor && doctor.workingHours ? doctor.workingHours.end   || '17:00' : '17:00';

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

  const occupied = await Appointment.find({
    doctorId,
    date:   { $gte: dayStart, $lte: dayEnd },
    status: { $ne: 'cancelled' }
  }).select('timeSlot');

  const occupiedSlots = occupied.map(a => a.timeSlot);
  const free = allSlots.filter(s => !occupiedSlots.includes(s));
  return { hasConflict: true, alternatives: free.slice(0, 3) };
}

module.exports = { checkConflict };
