const cron        = require('node-cron');
const Appointment = require('../models/Appointment');
const { sendAppointmentReminder } = require('./emailService');

function startScheduler() {
  cron.schedule('*/15 * * * *', async () => {
    try {
      const now  = new Date();
      const w24s = new Date(now.getTime() + 23 * 3600 * 1000);
      const w24e = new Date(now.getTime() + 25 * 3600 * 1000);

      const appointments = await Appointment.find({ status: 'confirmed' })
        .populate({ path: 'patientId', populate: { path: 'userId' } })
        .populate({ path: 'doctorId',  populate: { path: 'userId' } });

      for (const appt of appointments) {
        try {
          const [h, m] = appt.timeSlot.split(':');
          const dt = new Date(appt.date);
          dt.setHours(parseInt(h), parseInt(m), 0, 0);

          if (dt >= w24s && dt <= w24e) {
            const patientUser = appt.patientId && appt.patientId.userId;
            const doctorUser  = appt.doctorId  && appt.doctorId.userId;
            if (patientUser && patientUser.email) {
              await sendAppointmentReminder({
                to:          patientUser.email,
                patientName: patientUser.name,
                doctorName:  doctorUser ? doctorUser.name : 'your doctor',
                date:        appt.date,
                timeSlot:    appt.timeSlot,
                hoursAhead:  24
              });
            }
          }
        } catch (inner) {
          console.warn('Scheduler inner error:', inner.message);
        }
      }
    } catch (err) {
      console.warn('Scheduler error:', err.message);
    }
  });
  console.log('Scheduler started');
}

module.exports = { startScheduler };
