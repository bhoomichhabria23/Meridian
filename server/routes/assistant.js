// const express = require('express');
// const Groq = require('groq-sdk');
// const { verifyToken } = require('../middleware/auth');
// const User = require('../models/User');
// const Patient = require('../models/Patient');
// const Medication = require('../models/Medication');
// const Appointment = require('../models/Appointment');
// const Report = require('../models/Report');
// const Reminder = require('../models/Reminder');
// const mongoose = require('mongoose');

// const router = express.Router();
// const GROQ_MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.6-27b';
// const hasGroq = Boolean(process.env.GROQ_API_KEY);
// const groq = hasGroq ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// async function resolveUser(identity) {
//   if (mongoose.Types.ObjectId.isValid(identity)) return User.findById(identity).lean();
//   return User.findOne({ firebaseUid: identity }).lean();
// }

// function cleanModelResponse(value) {
//   let response = String(value || '')
//     .replace(/<think>[\s\S]*?<\/think>/gi, '')
//     .replace(/<analysis>[\s\S]*?<\/analysis>/gi, '')
//     .trim();
//   const reasoningStart = response.search(/<(think|analysis)>/i);
//   if (reasoningStart >= 0) response = response.slice(0, reasoningStart).trim();
//   return response;
// }

// router.post('/chat', verifyToken, async (req, res) => {
//   try {
//     if (!hasGroq) return res.status(503).json({ message: 'MERIDIAN AI is not configured. Add GROQ_API_KEY to the server environment.' });
//     const history = Array.isArray(req.body.messages) ? req.body.messages.slice(-20) : [];
//     const currentUserId = req.user._id || req.user.id;
//     const user = await resolveUser(currentUserId);
//     if (!user) return res.status(404).json({ message: 'Authenticated user profile was not found.' });
//     const mongoUserId = user._id;
//     const [patient, medications, appointments, reports, reminders] = await Promise.all([
//       Patient.findOne({ userId: mongoUserId }).select('dateOfBirth gender bloodGroup allergies conditions').lean(),
//       Medication.find({ patientId: mongoUserId }).select('name dosage frequency status startDate endDate').limit(20).lean(),
//       Appointment.find({ patientId: mongoUserId }).select('date timeSlot status chiefComplaint doctorId').sort({ date: -1 }).limit(10).lean(),
//       Report.find({ patientId: mongoUserId }).select('name testName type status date description extractedText').sort({ date: -1 }).limit(10).lean(),
//       Reminder.find({ userId: mongoUserId, status: { $ne: 'completed' } }).select('title type date priority status').limit(20).lean(),
//     ]);
//     const context = { user: { name: user.name, role: user.role, email: user.email }, patient, medications, appointments, reports: reports.map((report) => ({ ...report, extractedText: String(report.extractedText || '').slice(0, 3000) })), reminders };
//     const completion = await groq.chat.completions.create({ model: GROQ_MODEL, reasoning_format: 'hidden', temperature: 0.2, max_tokens: 1200, messages: [{ role: 'system', content: 'You are MERIDIAN AI, a clinical support assistant. Use only the supplied patient context. Do not diagnose, prescribe, or invent medical records. Explain uncertainty and recommend contacting a qualified clinician for urgent or concerning symptoms. Be concise, warm, and clear. Return only the final answer to the patient. Never include hidden reasoning, analysis, or <think> tags. If report files have no extracted findings, clearly say that their contents are unavailable rather than inventing a summary. Patient context: ' + JSON.stringify(context) }, ...history.map((message) => ({ role: message.role === 'assistant' ? 'assistant' : 'user', content: String(message.content || '') }))] });
//     const message = cleanModelResponse(completion.choices?.[0]?.message?.content);
//     res.json({ message: message || 'I could not generate a response.' });
//   } catch (error) { res.status(500).json({ message: error.message }); }
// });

// module.exports = router;

const express = require("express");
const Groq = require("groq-sdk");
const { verifyToken } = require("../middleware/auth");

const User = require("../models/User");
const Patient = require("../models/Patient");
const Medication = require("../models/Medication");
const Appointment = require("../models/Appointment");
const Report = require("../models/Report");
const Reminder = require("../models/Reminder");

const mongoose = require("mongoose");

const router = express.Router();


// ======================================================
// GROQ CONFIG
// ======================================================

const GROQ_MODEL =
  process.env.GROQ_MODEL || "qwen/qwen3.6-27b";

const hasGroq =
  Boolean(process.env.GROQ_API_KEY);

const groq = hasGroq
  ? new Groq({
      apiKey: process.env.GROQ_API_KEY,
    })
  : null;


// ======================================================
// RESOLVE USER
// ======================================================

async function resolveUser(identity) {
  if (!identity) return null;

  if (mongoose.Types.ObjectId.isValid(identity)) {
    return User.findById(identity).lean();
  }

  return User.findOne({
    firebaseUid: identity,
  }).lean();
}


// ======================================================
// CLEAN MODEL RESPONSE
// ======================================================

function cleanModelResponse(value) {
  let response = String(value || "")
    .replace(
      /<think>[\s\S]*?<\/think>/gi,
      ""
    )
    .replace(
      /<analysis>[\s\S]*?<\/analysis>/gi,
      ""
    )
    .trim();

  const reasoningStart =
    response.search(
      /<(think|analysis)>/i
    );

  if (reasoningStart >= 0) {
    response = response
      .slice(0, reasoningStart)
      .trim();
  }

  return response;
}


// ======================================================
// CHAT
// ======================================================

router.post(
  "/chat",
  verifyToken,
  async (req, res) => {

    try {

      console.log(
        "\n========== MERIDIAN AI =========="
      );


      // ==================================================
      // CHECK GROQ
      // ==================================================

      if (!hasGroq) {

        console.error(
          "❌ GROQ_API_KEY not configured"
        );

        return res.status(503).json({
          message:
            "MERIDIAN AI is not configured. Add GROQ_API_KEY to the backend environment.",
        });
      }


      console.log(
        "✅ Groq configured"
      );

      console.log(
        "🤖 Model:",
        GROQ_MODEL
      );


      // ==================================================
      // CHAT HISTORY
      // ==================================================

      const history =
        Array.isArray(req.body.messages)
          ? req.body.messages
              .filter(
                (message) =>
                  message &&
                  typeof message.content === "string"
              )
              .slice(-20)
          : [];


      console.log(
        "💬 History:",
        history.length
      );


      // ==================================================
      // AUTH USER
      // ==================================================

      const currentUserId =
        req.user?._id ||
        req.user?.id;


      if (!currentUserId) {

        return res.status(401).json({
          message:
            "Authentication information is missing.",
        });
      }


      console.log(
        "👤 Auth ID:",
        currentUserId
      );


      const user =
        await resolveUser(
          currentUserId
        );


      if (!user) {

        console.error(
          "❌ User not found"
        );

        return res.status(404).json({
          message:
            "Authenticated user profile was not found.",
        });
      }


      const mongoUserId =
        user._id;


      console.log(
        "✅ User:",
        user.name
      );


      // ==================================================
      // PATIENT PROFILE
      // ==================================================

      const patient =
        await Patient.findOne({
          userId: mongoUserId,
        })
          .select(
            "dateOfBirth gender bloodGroup allergies conditions"
          )
          .lean();


      console.log(
        "🏥 Patient:",
        patient
          ? "FOUND"
          : "NOT FOUND"
      );


      // ==================================================
      // IMPORTANT
      //
      // Your schemas use User._id for patientId.
      //
      // Report.js:
      // patientId -> ref: "User"
      //
      // Therefore use mongoUserId.
      // ==================================================

      const patientId =
        mongoUserId;


      // ==================================================
      // FETCH PATIENT DATA
      // ==================================================

      const [
        medications,
        appointments,
        reports,
        reminders,
      ] = await Promise.all([


        // -------------------------------
        // MEDICATIONS
        // -------------------------------

        Medication.find({
          patientId,
        })
          .select(
            "name dosage frequency status startDate endDate"
          )
          .sort({
            startDate: -1,
          })
          .limit(20)
          .lean(),


        // -------------------------------
        // APPOINTMENTS
        // -------------------------------

        Appointment.find({
          patientId,
        })
          .select(
            "date timeSlot status chiefComplaint doctorId"
          )
          .sort({
            date: -1,
          })
          .limit(20)
          .lean(),


        // -------------------------------
        // REPORTS
        // -------------------------------

        Report.find({
          patientId,
        })
          .select(
            "reportId name testName type status date description labName fileUrl fileType fileName extractedText ocrStatus"
          )
          .sort({
            date: -1,
          })
          .limit(20)
          .lean(),


        // -------------------------------
        // REMINDERS
        // -------------------------------

        Reminder.find({
          userId: mongoUserId,
          status: {
            $ne: "completed",
          },
        })
          .select(
            "title type date priority status"
          )
          .sort({
            date: 1,
          })
          .limit(20)
          .lean(),

      ]);


      // ==================================================
      // DEBUG
      // ==================================================

      console.log(
        "💊 Medications:",
        medications.length
      );

      console.log(
        "📅 Appointments:",
        appointments.length
      );

      console.log(
        "📄 Reports:",
        reports.length
      );

      console.log(
        "🔔 Reminders:",
        reminders.length
      );


      // ==================================================
      // REMOVE UNNECESSARY FILE URL FROM AI CONTEXT
      // ==================================================

      const safeReports =
        reports.map(
          (report) => ({

            reportId:
              report.reportId,

            name:
              report.name,

            testName:
              report.testName,

            type:
              report.type,

            status:
              report.status,

            date:
              report.date,

            description:
              report.description,

            labName:
              report.labName,

            fileName:
              report.fileName,

            fileType:
              report.fileType,

            ocrStatus:
              report.ocrStatus,

            extractedText:
              String(
                report.extractedText || ""
              ).slice(0, 5000),

          })
        );


      // ==================================================
      // DYNAMIC PATIENT CONTEXT
      // ==================================================

      const context = {

        user: {
          name:
            user.name,

          email:
            user.email,

          role:
            user.role,
        },


        patient: patient
          ? {
              dateOfBirth:
                patient.dateOfBirth,

              gender:
                patient.gender,

              bloodGroup:
                patient.bloodGroup,

              allergies:
                patient.allergies,

              conditions:
                patient.conditions,
            }
          : null,


        medications,

        appointments,

        reports:
          safeReports,

        reminders,

      };


      console.log(
        "📦 Dynamic patient context created"
      );


      // ==================================================
      // GENERIC SYSTEM INSTRUCTION
      // ==================================================
      //
      // IMPORTANT:
      //
      // This does NOT contain predefined questions.
      // The LLM determines what information is relevant.
      // ==================================================

      const systemPrompt = `
You are MERIDIAN AI, an intelligent clinical support assistant.

You are assisting the authenticated user using their current healthcare information supplied as structured context.

Use the supplied patient context as your primary source of truth.

Answer the user's request naturally and dynamically based on the information available.

Do not invent, assume, or fabricate patient information.

If the requested information is not present in the supplied context, clearly state that it is unavailable.

You may analyze relationships between different parts of the supplied information when answering the user's request.

For medical information:
- provide understandable explanations and summaries;
- do not diagnose diseases;
- do not prescribe medications;
- do not change medication dosages;
- do not invent test results;
- do not invent clinical findings.

Keep responses concise, clear, warm, and personalized.

PATIENT CONTEXT:

${JSON.stringify(context)}
`;


      // ==================================================
      // BUILD LLM MESSAGES
      // ==================================================

      const messages = [

        {
          role: "system",
          content: systemPrompt,
        },

        ...history.map(
          (message) => ({

            role:
              message.role === "assistant"
                ? "assistant"
                : "user",

            content:
              message.content,

          })
        ),

      ];


      // ==================================================
      // CALL GROQ
      // ==================================================

      console.log(
        "🚀 Sending request to Groq..."
      );


      const completion =
        await groq.chat.completions.create({

          model:
            GROQ_MODEL,

          messages,

          reasoning_format:
            "hidden",

          reasoning_effort:
            "none",

          temperature:
            0.2,

          max_completion_tokens:
            1200,

        });


      // ==================================================
      // EXTRACT RESPONSE
      // ==================================================

      const rawResponse =
        completion
          ?.choices?.[0]
          ?.message?.content;


      const message =
        cleanModelResponse(
          rawResponse
        );


      console.log(
        "✅ Groq response received"
      );


      console.log(
        "🤖 Response:",
        message
      );


      console.log(
        "==================================\n"
      );


      // ==================================================
      // SEND RESPONSE
      // ==================================================

      return res.json({

        message:
          message ||
          "I could not generate a response.",

      });


    } catch (error) {


      // ==================================================
      // ERROR
      // ==================================================

      console.error(
        "\n========== MERIDIAN AI ERROR =========="
      );

      console.error(
        "Message:",
        error.message
      );

      console.error(
        "Status:",
        error.status
      );

      console.error(
        "Code:",
        error.code
      );

      console.error(
        "Full error:",
        error
      );

      console.error(
        "========================================\n"
      );


      return res.status(
        error.status || 500
      ).json({

        message:
          error.message ||
          "MERIDIAN AI request failed.",

      });

    }

  }
);


module.exports = router;