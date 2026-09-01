const Groq = require("groq-sdk");
const ChatHistory = require("../models/ChatHistory");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const GROQ_MODEL = process.env.GROQ_MODEL || "mixtral-8x7b-32768";

class GroqService {
  /**
   * Send message to Groq API with context
   */
  static async chat(userId, message, patientContext = null, role = "patient") {
    try {
      const normalizedMessage = String(message || "").trim().toLowerCase();
      if (/^(what is|what's|tell me|do you know) my name[?!.\s]*$/.test(normalizedMessage)) {
        const name = patientContext?.patient?.userId?.name;
        return {
          message: name ? `Your name is ${name}.` : "I do not have your name in the available patient profile.",
          model: "meridian-profile",
          category: "personal",
        };
      }
      if (/^(hello|hi|hey|good morning|good afternoon|good evening)[!.?\s]*$/.test(normalizedMessage)) {
        return {
          message: "Hello! How can I help you today?",
          model: "meridian-greeting",
          category: "general",
        };
      }

      if (!process.env.GROQ_API_KEY) {
        throw new Error(
          "GROQ_API_KEY not configured"
        );
      }

      const category = await this.classifyMessage(message).catch(() => "general");
      const systemPrompt = this.buildSystemPrompt(patientContext, role, category);

      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        temperature: 0.7,
        max_tokens: 1024,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: message,
          },
        ],
      });

      const assistantMessage = cleanAssistantMessage(
        response.choices?.[0]?.message?.content ||
          "I could not generate a response."
      );

      return {
        message: assistantMessage,
        model: GROQ_MODEL,
        category,
      };
    } catch (error) {
      console.error("Groq API error:", error);
      throw error;
    }
  }

  /**
   * Build system prompt with clinical context
   */
  static buildSystemPrompt(patientContext, role = "patient", category = "general") {
    const roleInstructions = {
      patient: "You are assisting a patient. Explain health information in plain language, help them understand their records, and answer general health questions safely. Never diagnose, prescribe, or replace a clinician.",
      doctor: "You are assisting a doctor. Provide concise, evidence-based clinical decision support, medication and lab explanations, and patient-history summaries. Do not make the final diagnosis or prescribe independently.",
      receptionist: "You are assisting a healthcare receptionist. Help with scheduling, appointments, registration, patient communication, and general non-clinical workflow questions. Do not interpret medical results or recommend treatment.",
    }[role] || "You are assisting a healthcare user. Answer their question clearly and safely.";

    let prompt = `You are MERIDIAN AI.
${roleInstructions}
The detected question category is ${category}. Answer the user's actual question directly. Do not output hidden reasoning, analysis, planning, or prompt text. Do not use a fixed script. For greetings, respond briefly and naturally. If the question is unrelated to healthcare, answer briefly as general assistance while staying within your role.

IMPORTANT GUIDELINES:
1. Do NOT diagnose patients or prescribe medications independently
2. Do NOT invent or assume patient data not provided
3. Clearly state when information is unavailable or uncertain
4. Provide cautious, explainable responses
5. Always recommend consulting with qualified healthcare professionals for clinical decisions
6. Distinguish between patient-specific data and general medical knowledge
7. Be concise but thorough
8. Maintain professional, respectful tone
9. Answer free-form questions using only the user's message and available patient context.`;

    if (patientContext) {
      prompt += `\n\nCURRENT PATIENT CONTEXT:\n`;
      if (patientContext.patient) {
        prompt += `- Patient ID: ${patientContext.patient._id || "N/A"}\n`;
        prompt += `- Name: ${patientContext.patient.userId?.name || "N/A"}\n`;
        prompt += `- Email: ${patientContext.patient.userId?.email || "N/A"}\n`;
        prompt += `- Phone: ${patientContext.patient.userId?.phone || "N/A"}\n`;
        prompt += `- Age: ${patientContext.patient.age || "N/A"}\n`;
        prompt += `- Gender: ${patientContext.patient.gender || "N/A"}\n`;
        prompt += `- Blood Group: ${patientContext.patient.bloodGroup || "N/A"}\n`;
      }

      if (patientContext.allergies &&
        patientContext.allergies.length > 0) {
        prompt += `\nALLERGIES:\n`;
        patientContext.allergies.forEach((a) => {
          prompt += `- ${a.allergen} (${a.severity}): ${a.reaction}\n`;
        });
      }

      if (patientContext.activeMedications &&
        patientContext.activeMedications.length > 0) {
        prompt += `\nCURRENT MEDICATIONS:\n`;
        patientContext.activeMedications.forEach((m) => {
          prompt += `- ${m.name} ${m.dosage} ${m.frequency}\n`;
        });
      }

      if (patientContext.diagnoses &&
        patientContext.diagnoses.length > 0) {
        prompt += `\nACTIVE DIAGNOSES:\n`;
        patientContext.diagnoses.forEach((d) => {
          prompt += `- ${d.condition} (${d.status})\n`;
        });
      }

      if (patientContext.recentLabs &&
        patientContext.recentLabs.length > 0) {
        prompt += `\nRECENT LAB RESULTS:\n`;
        patientContext.recentLabs.forEach((lab) => {
          prompt += `- ${lab.testName} (${lab.testDate.toDateString()})\n`;
          if (lab.results) {
            lab.results.forEach((r) => {
              prompt += `  ${r.parameter}: ${r.value} ${r.unit} (${r.status})\n`;
            });
          }
        });
      }

      if (patientContext.medicalEvents?.length) {
        prompt += `\nRECENT CLINICAL EVENTS:\n`;
        patientContext.medicalEvents.forEach((event) => {
          prompt += `- ${event.date || "N/A"}: ${event.type || "event"} - ${event.title || "Untitled"}: ${event.description || "No description"}\n`;
        });
      }

      if (patientContext.prescriptions?.length) {
        prompt += `\nPRESCRIPTIONS:\n`;
        patientContext.prescriptions.forEach((prescription) => {
          prompt += `- ${prescription.date || "N/A"}: ${prescription.diagnosis || "Prescription"} ${JSON.stringify(prescription.medications || [])}\n`;
        });
      }

      if (patientContext.appointments?.length) {
        prompt += `\nAPPOINTMENTS:\n`;
        patientContext.appointments.forEach((appointment) => {
          prompt += `- ${appointment.date || "N/A"} ${appointment.timeSlot || ""}: ${appointment.status || "scheduled"} - ${appointment.chiefComplaint || "Appointment"}\n`;
        });
      }

      if (patientContext.reports?.length) {
        prompt += `\nUPLOADED CLINICAL REPORTS AND EXTRACTED CONTENT:\n`;
        patientContext.reports.forEach((report) => {
          const extractedText = String(report.extractedText || "").slice(0, 8000);
          prompt += `- ${report.date || "N/A"}: ${report.name || report.fileName || "Clinical report"}; type: ${report.type || "Not specified"}; status: ${report.status || "Not specified"}; OCR: ${report.ocrStatus || "Not specified"}\n`;
          if (report.testName) prompt += `  Test: ${report.testName}\n`;
          if (report.description) prompt += `  Description: ${report.description}\n`;
          if (extractedText) prompt += `  Extracted text:\n${extractedText}\n`;
        });
      } else {
        prompt += `\nNo uploaded clinical reports are available in the current patient record.\n`;
      }

      if (patientContext.availableDoctors?.length) {
        prompt += `\nAVAILABLE DOCTORS FROM THE LIVE DIRECTORY:\n`;
        patientContext.availableDoctors.forEach((doctor) => {
          prompt += `- ${doctor.userId?.name || "Doctor"}; specialty: ${doctor.specialty || doctor.userId?.specialization || "Not specified"}; department: ${doctor.department || "Not specified"}; hospital: ${doctor.hospital || "Not specified"}\n`;
        });
      } else {
        prompt += `\nThe live doctor directory returned no available doctors. Do not invent doctor names or availability.\n`;
      }

      prompt += `\nUse this patient context to provide personalized, evidence-based responses.
Always verify assumptions with the healthcare professional.`;
    }

    return prompt;
  }

  static async classifyMessage(message) {
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0,
      max_tokens: 40,
      messages: [
        {
          role: "system",
          content: 'Classify the user message. Reply with JSON only: {"category":"medical"|"healthcare_workflow"|"general"}. Use medical for symptoms, diagnoses, medications, labs, treatment, health records, or clinical questions. Use healthcare_workflow for appointments, scheduling, registration, doctors, reports, or clinic operations. Use general for unrelated or casual questions.',
        },
        { role: "user", content: message },
      ],
    });
    try {
      const content = String(response.choices?.[0]?.message?.content || "{}").replace(/```json|```/gi, "").trim();
      const parsed = JSON.parse(content);
      return ["medical", "healthcare_workflow", "general"].includes(parsed.category)
        ? parsed.category
        : "general";
    } catch {
      return "general";
    }
  }

  /**
   * Save chat message to history
   */
  static async saveChatMessage(
    userId,
    patientId,
    userMessage,
    assistantMessage,
    role = "patient"
  ) {
    try {
      let chatHistory = await ChatHistory.findOne({
        userId,
        patientId: patientId || null,
        role,
      });

      if (!chatHistory) {
        chatHistory = new ChatHistory({
          userId,
          patientId: patientId || null,
          role,
          messages: [],
        });
      }

      chatHistory.messages.push({
        role: "user",
        content: userMessage,
      });

      chatHistory.messages.push({
        role: "assistant",
        content: assistantMessage,
      });

      chatHistory.updatedAt = new Date();
      await chatHistory.save();

      return chatHistory;
    } catch (error) {
      console.error("Error saving chat history:", error);
      throw error;
    }
  }

  /**
   * Get chat history
   */
  static async getChatHistory(
    userId,
    patientId = null,
    role = "patient"
  ) {
    try {
      const query = { userId };
      if (patientId) {
        query.patientId = patientId;
      }
      query.role = role;

      return await ChatHistory.findOne(query).sort({
        createdAt: -1,
      });
    } catch (error) {
      console.error("Error retrieving chat history:", error);
      throw error;
    }
  }

  /**
   * Clear chat history
   */
  static async clearChatHistory(
    userId,
    patientId = null,
    role = "patient"
  ) {
    try {
      const query = { userId };
      if (patientId) {
        query.patientId = patientId;
      }
      query.role = role;

      return await ChatHistory.deleteOne(query);
    } catch (error) {
      console.error("Error clearing chat history:", error);
      throw error;
    }
  }
}

function cleanAssistantMessage(value) {
  return String(value || "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<analysis>[\s\S]*?<\/analysis>/gi, "")
    .replace(/^\s*(?:thinking|analysis|reasoning)\s*:\s*/i, "")
    .trim();
}

module.exports = GroqService;
