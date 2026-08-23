const MedicalEvent = require('../models/MedicalEvent');

async function createEvent({ patientId, type, refId, refModel, title, description, createdBy }) {
  const event = new MedicalEvent({ patientId, type, refId, refModel, title, description, createdBy });
  await event.save();
  return event;
}

module.exports = { createEvent };
