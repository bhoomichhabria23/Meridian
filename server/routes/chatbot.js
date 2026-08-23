const express     = require('express');
const router      = express.Router();
const Groq        = require('groq-sdk');
const { verifyToken } = require('../middleware/auth');
const Patient     = require('../models/Patient');
const Appointment = require('../models/Appointment');
const { createEvent }   = require('../utils/medicalEvent');
const { checkConflict } = require('../utils/conflictCheck');

const GROQ_MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.6-27b';
const hasGroq = Boolean(process.env.GROQ_API_KEY);
const groq = hasGroq ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

function cleanModelResponse(value) {
  let response = String(value || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<analysis>[\s\S]*?<\/analysis>/gi, '')
    .trim();
  const reasoningStart = response.search(/<(think|analysis)>/i);
  if (reasoningStart >= 0) response = response.slice(0, reasoningStart).trim();
  return response;
}

router.post('/validate-complaint', verifyToken, async (req, res) => {
  try {
    const { complaint } = req.body;
    if (!complaint) return res.status(400).json({ message: 'complaint is required' });
    if (!hasGroq) return res.json({ valid: true, message: '' });

    const completion = await groq.chat.completions.create({
      reasoning_format: 'hidden',
      model:    GROQ_MODEL,
      messages: [
        {
          role:    'system',
          content: 'You are a medical intake validator. Reply with JSON only, no markdown, no extra text, and no reasoning: {"valid":true or false,"message":"reason if invalid, else empty string"}. Only reject clearly non-medical text like random gibberish or greetings. Be very permissive.'
        },
        { role: 'user', content: complaint }
      ],
      max_tokens: 200
    });

    const text = cleanModelResponse(completion.choices[0].message.content);
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { valid: true, message: '' };
    }
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/confirm-booking', verifyToken, async (req, res) => {
  try {
    const {
      name, bloodGroup, gender, dateOfBirth,
      chiefComplaint, symptomDuration,
      preferredDoctorId, appointmentDate, timeSlot
    } = req.body;

    if (!preferredDoctorId || !appointmentDate || !timeSlot || !chiefComplaint) {
      return res.status(400).json({ message: 'preferredDoctorId, appointmentDate, timeSlot and chiefComplaint are required' });
    }

    let patient = await Patient.findOne({ userId: req.user._id });
    let isNewPatient = false;
    if (!patient) {
      patient = new Patient({ userId: req.user._id, bloodGroup, gender, dateOfBirth });
      await patient.save();
      isNewPatient = true;
    }

    const { hasConflict, alternatives } = await checkConflict(preferredDoctorId, appointmentDate, timeSlot);
    if (hasConflict) return res.status(409).json({ message: 'Slot not available', alternatives });

    const appointment = new Appointment({
      patientId:      patient._id,
      doctorId:       preferredDoctorId,
      date:           appointmentDate,
      timeSlot,
      chiefComplaint,
      symptomDuration,
      bookedVia:      'chatbot',
      status:         'confirmed'
    });
    await appointment.save();

    await createEvent({
      patientId: patient._id,
      type:      'appointment',
      refId:     appointment._id,
      refModel:  'Appointment',
      title:     'Appointment booked via chatbot',
      createdBy: req.user._id
    });

    let confirmationMessage = 'Your appointment has been booked successfully.';
    if (hasGroq) {
      const completion = await groq.chat.completions.create({
        reasoning_format: 'hidden',
        model:    GROQ_MODEL,
        messages: [
          {
            role:    'system',
            content: 'You are a medical receptionist assistant. Generate a warm, professional 3-sentence appointment confirmation message. Return only the final plain-text message. Never include reasoning, analysis, or <think> tags.'
          },
          {
            role:    'user',
            content: JSON.stringify({ patientName: name, chiefComplaint, appointmentDate, timeSlot })
          }
        ],
        max_tokens: 300
      });
      confirmationMessage = cleanModelResponse(completion.choices[0].message.content) || confirmationMessage;
    }
    res.json({ success: true, appointment, confirmationMessage, isNewPatient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
