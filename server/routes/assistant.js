const express = require("express");
const mongoose = require("mongoose");
const GroqService = require("../services/groqService");
const { verifyToken } = require("../middleware/auth");
const Patient = require("../models/Patient");
const Medication = require("../models/Medication");
const Diagnosis = require("../models/Diagnosis");
const Allergy = require("../models/Allergy");
const LabResult = require("../models/LabResult");
const Doctor = require("../models/Doctor");
const MedicalEvent = require("../models/MedicalEvent");
const Prescription = require("../models/Prescription");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const Report = require("../models/Report");
const AuditLog = require("../models/AuditLog");
const Reminder = require("../models/Reminder");

const router = express.Router();

/**
 * POST /api/assistant/chat
 * Send message to AI chatbot
 */
router.post("/chat", verifyToken, async (req, res) => {
  try {
    const {
      message: requestMessage,
      patientId,
      conversationId,
      useContext,
    } = req.body;
    const message = requestMessage || req.body.messages?.filter((item) => item.role === 'user').at(-1)?.content;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({
        success: false,
        message:
          "AI service not configured. Add GROQ_API_KEY to environment.",
      });
    }

    // Patients automatically receive their own context. Staff only receive
    // context for a patient explicitly selected in the workflow.
    let patientContext = null;
    const userLookup = mongoose.Types.ObjectId.isValid(req.user.id)
      ? { _id: req.user.id }
      : { firebaseUid: req.user.uid || req.user.id };
    const currentUser = await User.findOne(userLookup)
      .select("name email phone role specialization")
      .lean();
    const staffUser = ["doctor", "receptionist"].includes(req.user.role)
      ? currentUser
      : null;
    let contextPatientId = patientId;
    let availableDoctors = useContext !== false && req.user.role !== "doctor"
      ? await Doctor.find({})
        .select("specialty hospital department workingHours userId")
        .populate("userId", "name email specialization")
        .lean()
      : [];
    let clinicContext = null;
    if (useContext !== false && ["doctor", "receptionist"].includes(req.user.role)) {
      if (req.user.role === "doctor") {
        const currentDoctor = await Doctor.findOne({ userId: req.user.id })
          .select("specialty hospital department workingHours slotDuration patients userId")
          .populate("userId", "name email phone specialization")
          .lean();
        if (!currentDoctor) {
          return res.status(404).json({ success: false, message: "Doctor profile not found." });
        }
        availableDoctors = [currentDoctor];

        const appointments = await Appointment.find({ doctorId: currentDoctor._id })
          .sort({ date: -1 })
          .populate("patientId", "patientCode age gender bloodGroup height weight bmi userId")
          .lean();
        const patientIds = [...new Set([
          ...(currentDoctor.patients || []).map(String),
          ...appointments.map((appointment) => appointment.patientId?._id).filter(Boolean).map(String),
        ])];
        const patients = await Patient.find({ _id: { $in: patientIds } })
          .select("patientCode age gender bloodGroup height weight bmi userId assignedDoctors")
          .populate("userId", "name email phone")
          .lean();
        const patientUserIds = patients.map((patient) => patient.userId?._id || patient.userId).filter(Boolean);
        const [medications, labs, prescriptions, reports] = await Promise.all([
          Medication.find({
            $or: [
              { doctorId: req.user.id },
              { patientId: { $in: patientUserIds } },
            ],
          }).sort({ createdAt: -1 }).lean(),
          LabResult.find({ patientId: { $in: patientUserIds } }).sort({ testDate: -1 }).lean(),
          Prescription.find({
            $or: [
              { doctorId: req.user.id },
              { patientId: { $in: patientUserIds } },
            ],
          }).sort({ date: -1 }).lean(),
          Report.find({ patientId: { $in: patientUserIds } }).sort({ date: -1 }).lean(),
        ]);
        clinicContext = {
          currentDoctor,
          patients,
          appointments,
          medications,
          labs,
          prescriptions,
          reports,
          reminders: [],
        };
      } else {
        const [patients, appointments, medications, labs, prescriptions, reports, reminders] = await Promise.all([
          Patient.find({}).select("patientCode age gender bloodGroup height weight bmi userId").populate("userId", "name email phone").lean(),
          Appointment.find({}).sort({ date: -1 }).populate("patientId", "patientCode userId").populate("doctorId", "userId specialty department").lean(),
          Medication.find({}).sort({ createdAt: -1 }).lean(),
          LabResult.find({}).sort({ testDate: -1 }).lean(),
          Prescription.find({}).sort({ date: -1 }).lean(),
          Report.find({}).sort({ date: -1 }).lean(),
          Reminder.find({}).sort({ date: 1 }).lean(),
        ]);
        clinicContext = { patients, appointments, medications, labs, prescriptions, reports, reminders };
      }
    }
    if (
      useContext !== false &&
      req.user.role === "doctor" &&
      contextPatientId &&
      clinicContext &&
      !clinicContext.patients.some((patient) => String(patient._id) === String(contextPatientId))
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only access patients assigned to or seen by you.",
      });
    }
    if (useContext !== false && req.user.role === "patient") {
      const ownPatient = await Patient.findOne({ userId: req.user.id }).select("_id");
      contextPatientId = ownPatient?._id;
    }
    if (useContext !== false && contextPatientId) {
      const patient = await Patient.findById(contextPatientId)
        .select("gender age bloodGroup dateOfBirth height weight bmi userId")
        .populate("userId", "name email phone");

      if (patient) {
        const patientUserId = patient.userId?._id || patient.userId;
        if (patientUserId && !patient.userId?.name) {
          patient.userId = await User.findById(patientUserId).select("name email phone");
        }
        const [
          allergies,
          activeMedications,
          diagnoses,
          recentLabs,
          medicalEvents,
          prescriptions,
          appointments,
          reports,
        ] = await Promise.all([
          Allergy.find({
            patientId: patientUserId,
            isActive: true,
          }).select(
            "allergen severity reaction"
          ),
          Medication.find({
            patientId: patientUserId,
            status: "active",
          }).select("name dosage frequency"),
          Diagnosis.find({
            patientId: patientUserId,
            status: {
              $in: ["active", "chronic"],
            },
          }).select("condition status"),
          LabResult.find({
            patientId: patientUserId,
          })
            .sort({ testDate: -1 })
            .limit(5)
            .select(
              "testName testDate results"
            ),
          MedicalEvent.find({ patientId: patient._id }).sort({ date: -1 }).limit(20).select("type title description details date").lean(),
          Prescription.find({ patientId: patientUserId }).sort({ date: -1 }).limit(10).select("diagnosis medications date").lean(),
          Appointment.find({ patientId: patient._id }).sort({ date: -1 }).limit(10).select("date timeSlot status chiefComplaint doctorId").lean(),
          Report.find({ patientId: patientUserId }).sort({ date: -1 }).limit(20).select("name fileName type status date testName description extractedText ocrStatus").lean(),
        ]);

        patientContext = {
          patient,
          allergies,
          activeMedications,
          diagnoses,
          recentLabs,
          medicalEvents,
          prescriptions,
          appointments,
          reports,
          availableDoctors,
        };
      }
    }

    if (!patientContext && useContext !== false) {
      patientContext = { availableDoctors, clinicContext, staffUser, currentUser };
    } else if (patientContext) {
      patientContext.clinicContext = clinicContext;
      patientContext.staffUser = staffUser;
      patientContext.currentUser = currentUser;
    } else if (useContext !== false) {
      patientContext = { availableDoctors, currentUser };
    }

    // Call Groq API
    const response = await GroqService.chat(
      req.user.id,
      message,
      patientContext,
      req.user.role
    );

    // Save to chat history
    await GroqService.saveChatMessage(
      req.user.id,
      patientId || null,
      message,
      response.message,
      req.user.role,
      conversationId || null
    );

    // Log audit
    await AuditLog.create({
      userId: req.user.id,
      role: req.user.role,
      action: "CHATBOT_USED",
      entityType: "Chat",
      targetUserId: patientId || null,
      details: {
        messageLength: message.length,
        usedContext: useContext,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        message: response.message,
        model: response.model,
        category: response.category || "general",
      },
    });
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process chat message",
      error: error.message,
    });
  }
});

/**
 * GET /api/assistant/history
 * Get chat history for user
 */
router.get(
  "/history",
  verifyToken,
  async (req, res) => {
    try {
      const { patientId, conversationId } = req.query;

      const history =
        await GroqService.getChatHistory(
          req.user.id,
          patientId || null,
          req.user.role
          , conversationId || null
        );

      if (!history) {
        return res.status(200).json({
          success: true,
          data: {
            messages: [],
            conversations: [],
          },
        });
      }

      const conversations = await GroqService.getChatConversations(
        req.user.id,
        patientId || null,
        req.user.role
      );

      return res.status(200).json({
        success: true,
        data: { ...history.toObject(), conversations },
      });
    } catch (error) {
      console.error(
        "Error fetching chat history:",
        error
      );
      return res.status(500).json({
        success: false,
        message: "Failed to fetch chat history",
      });
    }
  }
);

/**
 * DELETE /api/assistant/history
 * Clear chat history
 */
router.delete(
  "/history",
  verifyToken,
  async (req, res) => {
    try {
      const { patientId } = req.query;

      await GroqService.clearChatHistory(
        req.user.id,
        patientId || null,
        req.user.role
      );

      return res.status(200).json({
        success: true,
        message: "Chat history cleared",
      });
    } catch (error) {
      console.error(
        "Error clearing chat history:",
        error
      );
      return res.status(500).json({
        success: false,
        message: "Failed to clear chat history",
      });
    }
  }
);

/**
 * GET /api/assistant/suggested-prompts
 * Get suggested prompts for chatbot
 */
router.get(
  "/suggested-prompts",
  verifyToken,
  async (req, res) => {
    const prompts = [
      "Summarize this patient's medical history",
      "What medications are currently recorded?",
      "Summarize the patient's recent clinical events",
      "What are the active diagnoses?",
      "Are there any concerning lab results?",
      "Explain any recent safety alerts",
      "What is this patient's allergy profile?",
    ];

    return res.status(200).json({
      success: true,
      data: prompts,
    });
  }
);

module.exports = router;
