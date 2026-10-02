const express      = require('express');
const router       = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const Patient      = require('../models/Patient');
const MedicalEvent = require('../models/MedicalEvent');
const Prescription = require('../models/Prescription');
const Report       = require('../models/Report');
const Appointment  = require('../models/Appointment');
const Medication   = require('../models/Medication');
const mongoose      = require('mongoose');
const User          = require('../models/User');
const Doctor        = require('../models/Doctor');

async function findPatientByIdentity(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return Patient.findOne({ $or: [{ _id: id }, { userId: id }] });
  }
  const user = await User.findOne({ firebaseUid: id }).select('_id');
  return user ? Patient.findOne({ userId: user._id }) : null;
}

router.get('/', verifyToken, async (req, res) => {
  try {
    const filter = req.user.role === 'patient' && mongoose.Types.ObjectId.isValid(req.user.id) ? { userId: req.user.id } : {};

    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user.id }).select('_id').lean();
      if (!doctor) return res.json([]);

      const approvedAppointments = await Appointment.find({
        doctorId: doctor._id,
        status: 'confirmed',
      }).distinct('patientId');
      filter.$or = [
        { _id: { $in: approvedAppointments } },
        { userId: { $in: approvedAppointments } },
      ];
    }
    
    // Server-side search filtering for better performance
    if (req.query.search) {
      const searchPattern = new RegExp(req.query.search, 'i');
      const matchingUsers = await User.find({ name: searchPattern }).select('_id').lean();
      const userIds = matchingUsers.map(u => u._id);
      filter.userId = { $in: userIds };
    }
    
    const patients = await Patient.find(filter)
      .populate('userId', 'name email phone createdAt')
      .lean();
    
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const patient = await findPatientByIdentity(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    
    await patient.populate('userId assignedDoctors');
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', verifyToken, requireRole('receptionist'), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    await Patient.deleteOne({ _id: patient._id });
    if (patient.userId) await User.deleteOne({ _id: patient.userId, role: 'patient' });

    res.json({ message: 'Patient deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/timeline', verifyToken, async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const patient = await findPatientByIdentity(req.params.id);
    if (patient) await patient.populate('userId');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    const storedEvents = await MedicalEvent.find({ patientId: patient._id })
      .sort({ date: -1 })
      .lean();
    const [prescriptions, reports, appointments, medications] = await Promise.all([
      Prescription.find({ patientId: patient.userId }).sort({ date: -1 }).lean(),
      Report.find({ patientId: patient.userId }).sort({ date: -1 }).lean(),
      Appointment.find({ patientId: patient._id }).sort({ date: -1 }).lean(),
      Medication.find({ patientId: patient.userId }).sort({ createdAt: -1 }).lean(),
    ]);
    const storedReferences = new Set(storedEvents.map((event) => `${event.refModel}:${event.refId}`));
    const derivedEvents = [
      ...prescriptions.filter((item) => !storedReferences.has(`Prescription:${item._id}`)).map((item) => ({
        type: 'prescription', refId: item._id, refModel: 'Prescription', title: 'Prescription created', description: item.diagnosis || 'Prescription added', date: item.date || item.createdAt,
      })),
      ...reports.filter((item) => !storedReferences.has(`Report:${item._id}`)).map((item) => ({
        type: 'report', refId: item._id, refModel: 'Report', title: `Report: ${item.name || item.testName || 'Clinical report'}`, description: `${item.type || 'other'} report`, date: item.date || item.createdAt,
      })),
      ...appointments.filter((item) => !storedReferences.has(`Appointment:${item._id}`)).map((item) => ({
        type: 'appointment', refId: item._id, refModel: 'Appointment', title: 'Appointment', description: item.chiefComplaint || 'Appointment scheduled', date: item.date || item.createdAt,
      })),
      ...medications.filter((item) => !storedReferences.has(`Medication:${item._id}`)).map((item) => ({
        type: 'medication', refId: item._id, refModel: 'Medication', title: `Medication: ${item.name}`, description: `${item.dosage || 'As directed'}${item.frequency ? `, ${item.frequency}` : ''}`, date: item.createdAt || item.startDate,
      })),
    ];
    const events = [...storedEvents, ...derivedEvents]
      .sort((first, second) => new Date(second.date || 0) - new Date(first.date || 0))
      .slice((page - 1) * limit, page * limit);
    const trendEvents = storedEvents.filter((event) => event.details?.metric && Number.isFinite(Number(event.details?.value)));
    const healthTrends = trendEvents.reduce((result, event) => {
      const metric = event.details.metric;
      (result[metric] ||= []).push({ label: new Date(event.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), value: Number(event.details.value), unit: event.details.unit || '' });
      return result;
    }, {});
    res.json({ events, healthTrends });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/records', verifyToken, async (req, res) => {
  try {
    const { type, title, description, date, metric, value, unit } = req.body || {};
    if (!title || !type) return res.status(400).json({ message: 'Record title and type are required' });
    const patient = await findPatientByIdentity(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    const event = await MedicalEvent.create({ patientId: patient._id, type, title, description, date: date || new Date(), createdBy: req.user.id, details: { metric, value: value === '' ? undefined : Number(value), unit } });
    res.status(201).json(event);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.get('/:id/insights', verifyToken, async (req, res) => {
  try {
    const patient = await findPatientByIdentity(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    const events = await MedicalEvent.find({ patientId: patient._id }).sort({ date: -1 }).limit(50).lean();
    const metricEvents = events.filter((event) => event.details?.metric && Number.isFinite(Number(event.details?.value)));
    const insights = [];
    const latestByMetric = new Map();
    metricEvents.forEach((event) => {
      if (!latestByMetric.has(event.details.metric)) latestByMetric.set(event.details.metric, event);
    });
    latestByMetric.forEach((event, metric) => {
      insights.push({
        id: `metric-${metric}`,
        title: `${metric} is being tracked`,
        description: `Your latest recorded value is ${event.details.value} ${event.details.unit || ''}. Continue monitoring this trend with your care team.`.trim(),
        recommendation: 'Review changes over time during your next care visit.',
      });
    });
    if (!insights.length && events.length) {
      insights.push({ id: 'history-active', title: 'Clinical history is up to date', description: `${events.length} recent clinical record${events.length === 1 ? '' : 's'} available for review.` });
    }
    res.json(insights);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/prescriptions', verifyToken, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.params.id })
      .sort({ createdAt: -1 })
      .populate('doctorId');
    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/reports', verifyToken, async (req, res) => {
  try {
    const reports = await Report.find({ patientId: req.params.id })
      .sort({ date: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/appointments', verifyToken, async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.params.id })
      .sort({ date: -1 })
      .populate('doctorId');
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
