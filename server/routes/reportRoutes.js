const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const Report = require("../models/Report");
const Patient = require("../models/Patient");
const authMiddleware = require("../middleware/authMiddleware");
const { createEvent } = require("../utils/medicalEvent");
const MedicalEvent = require("../models/MedicalEvent");
const { extractReportText } = require("../utils/ocrService");
const { classifyReport } = require("../utils/reportClassifier");
const GroqService = require("../services/groqService");
const mongoose = require("mongoose");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");

async function findPatientByIdentity(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return Patient.findOne({ $or: [{ _id: id }, { userId: id }] });
  }
  const user = await User.findOne({ firebaseUid: id }).select("_id");
  return user ? Patient.findOne({ userId: user._id }) : null;
}

const uploadDirectory = path.join(
  __dirname,
  "../uploads/reports"
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${path.extname(file.originalname)}`;

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];

    if (
      allowedTypes.includes(
        file.mimetype
      )
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only PDF, JPG and PNG files are allowed."
        )
      );
    }
  },
});

function reportFilePath(fileUrl) {
  if (!fileUrl) return null;
  let fileName = fileUrl;
  try {
    fileName = new URL(fileUrl, "http://localhost").pathname;
  } catch {
    // Keep relative legacy paths as-is.
  }
  return path.join(uploadDirectory, path.basename(decodeURIComponent(fileName)));
}

function reportLookup(id) {
  const lookup = [{ reportId: id }];
  if (mongoose.Types.ObjectId.isValid(id)) lookup.unshift({ _id: id });
  return { $or: lookup };
}

async function findOwnedReport(id, identity) {
  const owner = mongoose.Types.ObjectId.isValid(identity)
    ? await User.findById(identity).select("_id")
    : await User.findOne({ firebaseUid: identity }).select("_id");
  if (!owner) return null;

  const patient = await Patient.findOne({ userId: owner._id }).select("_id");
  const ownerIds = [owner._id];
  if (patient) ownerIds.push(patient._id);

  return Report.findOne({
    ...reportLookup(id),
    patientId: { $in: ownerIds },
  });
}

async function findDoctorReport(id, doctorUserId) {
  const doctor = await Doctor.findOne({ userId: doctorUserId }).select("_id").lean();
  if (!doctor) return { error: "Doctor profile not found." };
  const report = await Report.findOne(reportLookup(id));
  if (!report) return { error: "Report not found." };
  const patient = await findPatientByIdentity(String(report.patientId));
  if (!patient) return { error: "Patient not found." };

  const assigned = (patient.assignedDoctors || []).some((doctorId) => String(doctorId) === String(doctor._id));
  const appointment = await Appointment.exists({
    doctorId: { $in: [doctor._id, doctorUserId] },
    patientId: { $in: [patient._id, patient.userId] },
    status: { $in: ["confirmed", "completed"] },
  });
  if (!assigned && !appointment) return { error: "You are not authorized to access this patient's report." };
  return { report, patient };
}

/*
GET REPORTS
*/
router.get(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const owner = mongoose.Types.ObjectId.isValid(req.user.id)
        ? await User.findById(req.user.id).select("_id")
        : await User.findOne({ firebaseUid: req.user.id }).select("_id");
      if (!owner) return res.json([]);

      const patient = await Patient.findOne({ userId: owner._id }).select("_id");
      const ownerIds = [owner._id];
      if (patient) ownerIds.push(patient._id);

      const reports =
        await Report.find({
          patientId: { $in: ownerIds },
        })
          .populate(
            "doctorId",
            "name specialization profileImage"
          )
          .populate(
            "patientId",
            "name patientId phone"
          )
          .populate(
            "uploadedBy",
            "role"
          )
          .sort({
            date: -1,
          })
          .lean();

      const patientReports = reports.filter((report) => {
        const uploaderRole = report.uploadedBy?.role || report.uploadedByRole || "patient";
        return !(report.type === "lab" && uploaderRole === "receptionist");
      });

      const formattedReports =
        patientReports.map((report) => ({
          _id: report._id,

          reportId:
            report.reportId,

          uploadedBy:
            report.uploadedBy?._id || report.uploadedBy,

          uploadedByRole:
            report.uploadedBy?.role || report.uploadedByRole || "patient",

          name:
            report.name,

          testName:
            report.testName,

          description:
            report.description,

          type:
            report.type,

          status:
            report.status,

          reviewStatus:
            report.reviewStatus || "pending",

          clinicalResult:
            report.clinicalResult || "",

          resultStatus:
            report.resultStatus || "not_specified",

          reviewedAt:
            report.reviewedAt,

          date:
            report.date,

          labName:
            report.labName,

          fileUrl:
            report.fileUrl,

          fileType:
            report.fileType,

          fileName:
            report.fileName,

          extractedText:
            report.extractedText,

          aiSummary:
            report.aiSummary,

          ocrStatus:
            report.ocrStatus,

          doctor: {
            name:
              report.doctorId?.name,

            specialization:
              report.doctorId
                ?.specialization,

            image:
              report.doctorId
                ?.profileImage,
          },

          patient: {
            name:
              report.patientId?.name,

            patientId:
              report.patientId
                ?.patientId,

            phone:
              report.patientId?.phone,
          },
        }));

      res.json(formattedReports);
    } catch (error) {
      console.error(
        "Get reports error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch reports",
      });
    }
  }
);

router.get("/lab-results", authMiddleware, async (req, res) => {
  try {
    const owner = mongoose.Types.ObjectId.isValid(req.user.id)
      ? await User.findById(req.user.id).select("_id")
      : await User.findOne({ firebaseUid: req.user.id }).select("_id");
    if (!owner) return res.json([]);

    const patient = await Patient.findOne({ userId: owner._id }).select("_id");
    const ownerIds = [owner._id];
    if (patient) ownerIds.push(patient._id);

    const reports = await Report.find({
      patientId: { $in: ownerIds },
      type: "lab",
    })
      .populate("uploadedBy", "role")
      .sort({ date: -1 })
      .lean();

    res.json(reports
      .filter((report) => (report.uploadedBy?.role || report.uploadedByRole) === "receptionist")
      .map((report) => ({
        ...report,
        uploadedByRole: report.uploadedBy?.role || report.uploadedByRole,
      })));
  } catch (error) {
    console.error("Get lab results error:", error);
    res.status(500).json({ message: "Failed to fetch lab results" });
  }
});

router.get("/patient/:patientId", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "doctor") return res.status(403).json({ message: "Only doctors can view patient reports here." });
    const patient = await findPatientByIdentity(req.params.patientId);
    if (!patient) return res.status(404).json({ message: "Patient not found." });
    const doctor = await Doctor.findOne({ userId: req.user.id }).select("_id").lean();
    if (!doctor) return res.status(403).json({ message: "Doctor profile not found." });
    const access = await Appointment.exists({
      doctorId: { $in: [req.user.id, doctor._id] },
      patientId: { $in: [patient._id, patient.userId] },
      status: { $in: ["confirmed", "completed"] },
    });
    const assigned = (patient.assignedDoctors || []).some((doctorId) => String(doctorId) === String(doctor._id));
    if (!assigned && !access) return res.status(403).json({ message: "You are not authorized to view this patient's reports." });

    const reports = await Report.find({ patientId: { $in: [patient.userId, patient._id] } })
      .populate("uploadedBy", "role")
      .sort({ date: -1 })
      .lean();

    const doctorReports = reports.filter((report) => {
      const uploaderRole = report.uploadedBy?.role || report.uploadedByRole || "patient";
      return ["receptionist", "doctor"].includes(uploaderRole);
    });

    res.json(doctorReports.map((report) => ({
      ...report,
      uploadedByRole: report.uploadedBy?.role || report.uploadedByRole || "patient",
      reviewStatus: report.reviewStatus || "pending",
      clinicalResult: report.clinicalResult || "",
      resultStatus: report.resultStatus || "not_specified",
    })));
  } catch (error) {
    console.error("Doctor patient reports error:", error);
    res.status(500).json({ message: "Unable to load patient reports." });
  }
});

router.post("/:id/viewed", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "doctor") return res.status(403).json({ message: "Only doctors can review patient reports." });
    const access = await findDoctorReport(req.params.id, req.user.id);
    if (access.error) return res.status(access.error.startsWith("You are not") ? 403 : 404).json({ message: access.error });
    const { report } = access;
    if (report.reviewStatus === "pending") {
      report.reviewStatus = "viewed";
      report.reviewedBy = req.user.id;
      report.reviewedAt = new Date();
      await report.save();
    }
    res.json({ report, fileUrl: report.fileUrl });
  } catch (error) {
    console.error("Report viewed update error:", error);
    res.status(500).json({ message: "Unable to update report review status." });
  }
});

router.patch("/:id/review", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "doctor") return res.status(403).json({ message: "Only doctors can enter report results." });
    const clinicalResult = String(req.body?.clinicalResult || "").trim();
    const resultStatus = String(req.body?.resultStatus || "not_specified").toLowerCase();
    if (!clinicalResult) return res.status(400).json({ message: "Enter a result before saving the review." });
    if (!["not_specified", "normal", "abnormal", "critical"].includes(resultStatus)) {
      return res.status(400).json({ message: "Invalid result status." });
    }
    const access = await findDoctorReport(req.params.id, req.user.id);
    if (access.error) return res.status(access.error.startsWith("You are not") ? 403 : 404).json({ message: access.error });
    const { report } = access;
    report.clinicalResult = clinicalResult;
    report.resultStatus = resultStatus;
    report.reviewStatus = "reviewed";
    report.reviewedBy = req.user.id;
    report.reviewedAt = new Date();
    if (resultStatus !== "not_specified") report.status = resultStatus;
    await report.save();
    res.json({ message: "Report result saved.", report });
  } catch (error) {
    console.error("Report review save error:", error);
    res.status(500).json({ message: "Unable to save report result." });
  }
});

router.post(
  "/:id/summary",
  authMiddleware,
  async (req, res) => {
    try {
      const report = await findOwnedReport(req.params.id, req.user.id);
      if (!report) return res.status(404).json({ message: "Report not found." });
      if (!report.extractedText?.trim()) {
        return res.status(400).json({ message: "No OCR text is available for this report yet." });
      }

      const result = await GroqService.chat(
        req.user.id,
        `Create a concise clinical summary of this uploaded report. Use only the OCR text provided. Include the main findings, abnormal or important values, and recommended follow-up questions. Do not diagnose or invent missing information. Return plain text with short headings.\n\nReport name: ${report.name}\nReport type: ${report.type}\nOCR text:\n${String(report.extractedText).slice(0, 12000)}`,
        null,
        req.user.role || "patient"
      );

      report.aiSummary = result.message;
      await report.save();
      res.json({ summary: report.aiSummary, model: result.model });
    } catch (error) {
      console.error("Report summary error:", error);
      res.status(502).json({ message: error.message || "Unable to generate report summary." });
    }
  }
);

/*
UPLOAD REPORT
*/
router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message:
            "Please select a file.",
        });
      }

      const { patientId, title, type, date, labName } = req.body || {};
      const uploaderRole = String(req.user?.role || "").toLowerCase();
      if (!["patient", "doctor", "receptionist"].includes(uploaderRole)) {
        return res.status(400).json({ message: "Invalid uploader role for this report." });
      }

      const patient = await findPatientByIdentity(patientId || req.user.id);
      if (!patient) return res.status(404).json({ message: "Patient not found." });

      const reportType = {
        scan: "imaging",
        discharge: "other",
        consultation: "other",
        prescription_copy: "other",
      }[type] || type;
      if (reportType === "lab" && !String(labName || "").trim()) {
        fs.unlink(req.file.path, () => {});
        return res.status(400).json({ message: "Facility / laboratory name is required for lab reports." });
      }

      const reportId = `RPT${Date.now()}${crypto.randomInt(1000, 10000)}`;

      let extractedText = "";
      let ocrStatus = "pending";
      try {
        extractedText = await extractReportText(req.file.path, req.file.mimetype);
        ocrStatus = extractedText ? "completed" : "failed";
      } catch (ocrError) {
        console.error("Report OCR error:", ocrError.message);
        ocrStatus = "failed";
      }
      const explicitType = {
        scan: "imaging",
        discharge: "other",
        consultation: "other",
        prescription_copy: "other",
      }[reportType] || reportType;
      const classifiedType = explicitType || classifyReport({
        extractedText,
        name: title,
        fileName: req.file.originalname,
      });
      if ((reportType === "lab" || classifiedType === "lab") && !["doctor", "receptionist"].includes(req.user.role)) {
        fs.unlink(req.file.path, () => {});
        return res.status(403).json({ message: "Laboratory report uploads are restricted to doctors and receptionists." });
      }

      const report =
        await Report.create({
          patientId: patient.userId,
          doctorId: req.user.role === "doctor" ? req.user.id : undefined,
          uploadedBy: req.user.id,
          uploadedByRole: uploaderRole,

          reportId,

          name: title || path.parse(req.file.originalname).name,

          type: classifiedType,

          status: "pending",
          reviewStatus: "pending",

          date: date ? new Date(date) : new Date(),

          labName: String(labName || "").trim(),

          fileUrl:
            `${req.protocol}://${req.get(
              "host"
            )}/uploads/reports/${req.file.filename}`,

          fileType:
            req.file.mimetype,

          fileName:
            req.file.originalname,
          extractedText,
          ocrStatus,
        });

      if (extractedText && process.env.GROQ_API_KEY) {
        try {
          const summary = await GroqService.chat(
            req.user.id,
            `Create a concise clinical summary of this uploaded report. Use only the OCR text provided. Include the main findings, abnormal or important values, and recommended follow-up questions. Do not diagnose or invent missing information. Return plain text with short headings.\n\nReport name: ${report.name}\nReport type: ${report.type}\nOCR text:\n${String(extractedText).slice(0, 12000)}`,
            null,
            req.user.role || "patient"
          );
          report.aiSummary = summary.message;
          await report.save();
        } catch (summaryError) {
          console.error("Report AI summary unavailable:", summaryError.message);
        }
      }

      if (!(uploaderRole === "receptionist" && report.type === "lab")) {
        await createEvent({
          patientId: patient._id,
          type: "report",
          refId: report._id,
          refModel: "Report",
          title: `Report uploaded: ${report.name}`,
          description: `${report.type} report uploaded for review`,
          createdBy: req.user.id,
        });
      }

      res.status(201).json({
        message:
          "Report uploaded successfully.",

        report,
      });
    } catch (error) {
      console.error(
        "Upload report error:",
        error
      );

        res.status(500).json({ message: error.message || "Failed to upload report." });
    }
  }
);

router.get(
  "/:id/download",
  authMiddleware,
  async (req, res) => {
    try {
      const report = await findOwnedReport(req.params.id, req.user.id);

      if (!report) return res.status(404).json({ message: "Report not found or not accessible." });
      if (!report.fileUrl) return res.status(404).json({ message: "This report has no uploaded file." });

      const filePath = reportFilePath(report.fileUrl);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "The uploaded report file is missing from server storage." });
      }

      return res.download(filePath, report.fileName || report.name);
    } catch (error) {
      return res.status(500).json({ message: "Failed to download report." });
    }
  }
);

/*
DELETE REPORT
*/
router.delete(
  "/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const report = await findOwnedReport(req.params.id, req.user.id);

      if (!report) {
        return res.status(404).json({
          message:
            "Report not found.",
        });
      }

      if (report.fileName) {
        const filePath = reportFilePath(report.fileUrl);

        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await Report.deleteOne({
        _id: report._id,
      });
      await MedicalEvent.deleteMany({
        refModel: "Report",
        refId: report._id,
      });

      res.json({
        message:
          "Report deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete report error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to delete report.",
      });
    }
  }
);

module.exports = router;