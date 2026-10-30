const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Reminder = require('../models/Reminder');
const CareSchedule = require('../models/CareSchedule');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const mongoose = require('mongoose');
const SafetyEngine = require('../services/safetyEngine');
const LabResult = require('../models/LabResult');

router.use(verifyToken);
const userId = (req) => req.user._id || req.user.id;

async function generateApprovedReminders(patientUserId) {
  const schedules = await CareSchedule.find({ patientId: patientUserId, active: true }).lean();
  const today = new Date();
  for (const schedule of schedules) {
    let dueDate = new Date(schedule.nextDueDate);
    if (Number.isNaN(dueDate.getTime()) || dueDate > today) continue;

    const existing = await Reminder.findOne({
      userId: patientUserId,
      title: schedule.testName,
      status: { $in: ['active', 'snoozed'] },
      createdAt: { $gte: new Date(dueDate.getTime() - 86400000) },
    });
    if (!existing) {
      await Reminder.create({
        userId: patientUserId,
        title: schedule.testName,
        type: 'lab_test',
        date: dueDate,
        description: schedule.description || 'Follow the clinician-approved preventive care schedule.',
        priority: schedule.priority,
        status: 'active',
      });
    }

    while (dueDate <= today) dueDate = new Date(dueDate.getTime() + schedule.intervalDays * 86400000);
    await CareSchedule.updateOne({ _id: schedule._id }, { nextDueDate: dueDate });
  }
}

async function resolvePatientUserId(identity) {
  if (!identity || !mongoose.Types.ObjectId.isValid(identity)) return null;
  const patient = await Patient.findOne({ $or: [{ _id: identity }, { userId: identity }] }).select('userId').lean();
  return patient?.userId || null;
}

async function doctorCanAccessPatient(req, patientUserId) {
  if (req.user.role !== 'doctor') return false;
  const doctor = await Doctor.findOne({ userId: userId(req) }).select('_id').lean();
  if (!doctor) return false;
  const patient = await Patient.findOne({ userId: patientUserId }).select('_id assignedDoctors').lean();
  if (patient?.assignedDoctors?.some((doctorId) => String(doctorId) === String(doctor._id))) return true;
  return Appointment.exists({
    doctorId: doctor._id,
    patientId: patient._id,
    status: 'confirmed',
  });
}

router.get('/', async (req, res) => {
  try {
    await generateApprovedReminders(userId(req));
    res.json(await Reminder.find({ userId: userId(req) }).sort({ date: 1 }));
  }
  catch (error) { res.status(500).json({ message: error.message }); }
});

router.get('/test-status', async (req, res) => {
  try {
    await generateApprovedReminders(userId(req));
    const [completed, pending, scheduled] = await Promise.all([
      LabResult.find({ patientId: userId(req) }).sort({ testDate: -1 }).lean(),
      Reminder.find({ userId: userId(req), type: 'lab_test', status: { $in: ['active', 'snoozed'] } }).sort({ date: 1 }).lean(),
      CareSchedule.find({ patientId: userId(req), active: true }).sort({ nextDueDate: 1 }).lean(),
    ]);
    res.json({ completed, pending, scheduled });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load test status.' });
  }
});

router.get('/schedules/:patientId', async (req, res) => {
  try {
    const patientUserId = await resolvePatientUserId(req.params.patientId);
    if (!patientUserId) return res.status(404).json({ message: 'Patient not found' });
    if (req.user.role === 'patient' && String(patientUserId) !== String(userId(req))) return res.status(403).json({ message: 'Forbidden' });
    if (req.user.role === 'doctor' && !(await doctorCanAccessPatient(req, patientUserId))) return res.status(403).json({ message: 'You are not authorized to view this patient schedule' });
    res.json(await CareSchedule.find({ patientId: patientUserId, active: true }).sort({ nextDueDate: 1 }).populate('approvedBy', 'name'));
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post('/schedules', async (req, res) => {
  try {
    if (req.user.role !== 'doctor') return res.status(403).json({ message: 'Only doctors can approve care schedules' });
    const patientUserId = await resolvePatientUserId(req.body.patientId);
    const doctor = await Doctor.findOne({ userId: userId(req) }).select('_id').lean();
    if (!doctor) return res.status(403).json({ message: 'Doctor profile not found' });
    if (!patientUserId) return res.status(404).json({ message: 'Patient not found' });
    if (!(await doctorCanAccessPatient(req, patientUserId))) return res.status(403).json({ message: 'You are not authorized to approve a schedule for this patient' });
    const schedule = await CareSchedule.create({
      patientId: patientUserId,
      testName: req.body.testName,
      description: req.body.description || '',
      intervalDays: Number(req.body.intervalDays),
      nextDueDate: req.body.nextDueDate,
      priority: req.body.priority || 'medium',
      approvedBy: userId(req),
    });
    await generateApprovedReminders(patientUserId);
    res.status(201).json(schedule);
  } catch (error) { res.status(400).json({ message: error.message }); }
});

router.delete('/schedules/:id', async (req, res) => {
  try {
    if (req.user.role !== 'doctor') return res.status(403).json({ message: 'Only doctors can remove care schedules' });
    const schedule = await CareSchedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    if (String(schedule.approvedBy) !== String(userId(req))) return res.status(403).json({ message: 'This schedule belongs to another doctor' });
    schedule.active = false;
    await schedule.save();
    res.json(schedule);
  } catch (error) { res.status(400).json({ message: error.message }); }
});

router.post('/', async (req, res) => {
  try {
    const reminder = await Reminder.create({ ...req.body, userId: userId(req) });
    res.status(201).json(reminder);
  } catch (error) { res.status(400).json({ message: error.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndUpdate({ _id: req.params.id, userId: userId(req) }, req.body, { new: true, runValidators: true });
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
    res.json(reminder);
  } catch (error) { res.status(400).json({ message: error.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndDelete({ _id: req.params.id, userId: userId(req) });
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
    res.json({ message: 'Reminder deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;
