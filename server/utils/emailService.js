const sgMail = require('@sendgrid/mail');
const hasSendgrid = Boolean(process.env.SENDGRID_API_KEY);
if (hasSendgrid) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM = 'noreply@meridianhealth.app';

async function sendBookingConfirmation({ to, patientName, doctorName, date, timeSlot, referenceNo }) {
  if (!hasSendgrid) return;
  try {
    await sgMail.send({
      to, from: FROM,
      subject: 'Appointment Confirmed — Meridian',
      html: `<div style="font-family:sans-serif;max-width:500px;margin:auto;border:1px solid #eee;border-radius:8px;padding:24px">
        <h2 style="color:#1D9E75">Appointment Confirmed</h2>
        <p>Hi <strong>${patientName}</strong>, your appointment has been booked.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;color:#666">Doctor</td><td style="padding:8px"><strong>Dr. ${doctorName}</strong></td></tr>
          <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Date</td><td style="padding:8px">${new Date(date).toDateString()}</td></tr>
          <tr><td style="padding:8px;color:#666">Time</td><td style="padding:8px">${timeSlot}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Reference</td><td style="padding:8px">${referenceNo}</td></tr>
        </table>
        <p style="color:#888;font-size:13px">Please arrive 10 minutes early. Carry any previous reports if available.</p>
      </div>`
    });
  } catch (err) {
    console.warn('sendBookingConfirmation error:', err.message);
  }
}

async function sendAppointmentReminder({ to, patientName, doctorName, date, timeSlot, hoursAhead }) {
  if (!hasSendgrid) return;
  try {
    await sgMail.send({
      to, from: FROM,
      subject: `Reminder: Appointment in ${hoursAhead} hours — Meridian`,
      html: `<div style="font-family:sans-serif;max-width:500px;margin:auto;border:1px solid #eee;border-radius:8px;padding:24px">
        <h2 style="color:#1D9E75">Appointment Reminder</h2>
        <p>Hi <strong>${patientName}</strong>, your appointment is coming up in <strong>${hoursAhead} hours</strong>.</p>
        <p>Doctor: <strong>Dr. ${doctorName}</strong><br>Date: ${new Date(date).toDateString()}<br>Time: ${timeSlot}</p>
      </div>`
    });
  } catch (err) {
    console.warn('sendAppointmentReminder error:', err.message);
  }
}

async function sendCancellationNotice({ to, patientName, doctorName, date, timeSlot }) {
  if (!hasSendgrid) return;
  try {
    await sgMail.send({
      to, from: FROM,
      subject: 'Appointment Cancelled — Meridian',
      html: `<div style="font-family:sans-serif;max-width:500px;margin:auto;border:1px solid #eee;border-radius:8px;padding:24px">
        <h2 style="color:#E24B4A">Appointment Cancelled</h2>
        <p>Hi <strong>${patientName}</strong>, your appointment with Dr. ${doctorName} on ${new Date(date).toDateString()} at ${timeSlot} has been cancelled.</p>
        <p>Please log in to Meridian to rebook at a convenient time.</p>
      </div>`
    });
  } catch (err) {
    console.warn('sendCancellationNotice error:', err.message);
  }
}

async function sendReportUploadNotice({ to, patientName, reportTitle, uploadedBy }) {
  if (!hasSendgrid) return;
  try {
    await sgMail.send({
      to, from: FROM,
      subject: 'New Report Available — Meridian',
      html: `<div style="font-family:sans-serif;max-width:500px;margin:auto;border:1px solid #eee;border-radius:8px;padding:24px">
        <h2 style="color:#1D9E75">New Report Available</h2>
        <p>Hi <strong>${patientName}</strong>, a new report has been uploaded for you.</p>
        <p>Report: <strong>${reportTitle}</strong><br>Uploaded by: ${uploadedBy}</p>
        <p>Log in to your Meridian portal to view and download it.</p>
      </div>`
    });
  } catch (err) {
    console.warn('sendReportUploadNotice error:', err.message);
  }
}

async function sendPrescriptionNotice({ to, patientName, doctorName, diagnosis }) {
  if (!hasSendgrid) return;
  try {
    await sgMail.send({
      to, from: FROM,
      subject: 'New Prescription Issued — Meridian',
      html: `<div style="font-family:sans-serif;max-width:500px;margin:auto;border:1px solid #eee;border-radius:8px;padding:24px">
        <h2 style="color:#1D9E75">New Prescription Issued</h2>
        <p>Hi <strong>${patientName}</strong>, Dr. ${doctorName} has issued a new prescription for you.</p>
        <p>Diagnosis: <strong>${diagnosis}</strong></p>
        <p>Log in to your Meridian portal to view your prescription details.</p>
      </div>`
    });
  } catch (err) {
    console.warn('sendPrescriptionNotice error:', err.message);
  }
}

module.exports = {
  sendBookingConfirmation,
  sendAppointmentReminder,
  sendCancellationNotice,
  sendReportUploadNotice,
  sendPrescriptionNotice
};
