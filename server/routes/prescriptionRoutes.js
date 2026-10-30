const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const Prescription = require("../models/Prescription");
const Patient = require("../models/Patient");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const { createEvent } = require("../utils/medicalEvent");
const SafetyEngine = require("../services/safetyEngine");
const SafetyAlert = require("../models/SafetyAlert");

const uploadDirectory = path.join(__dirname, "../uploads/prescriptions");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDirectory),
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname || "");
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    cb(null, uniqueName);
  },
});

const allowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

async function patientOwnerIds(identity) {
  const owner = mongoose.Types.ObjectId.isValid(identity)
    ? await User.findById(identity).select("_id")
    : await User.findOne({ firebaseUid: identity }).select("_id");
  if (!owner) return [];
  const patient = await Patient.findOne({ userId: owner._id }).select("_id");
  return [owner._id, patient?._id].filter(Boolean);
}

const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new Error("Only PDF, JPG, PNG, text, and common document files are allowed."));
  },
});

function parseMedicationList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeAttachment(rawAttachment) {
  if (!rawAttachment) return null;
  if (typeof rawAttachment === "string") {
    return {
      name: "document.txt",
      originalName: "document.txt",
      mimeType: "text/plain",
      size: 0,
      url: rawAttachment,
      type: "file",
      uploadedAt: new Date(),
    };
  }

  if (typeof rawAttachment.url === "string" && rawAttachment.url.trim()) {
    return {
      name: rawAttachment.name || path.basename(rawAttachment.url),
      originalName: rawAttachment.originalName || rawAttachment.name || path.basename(rawAttachment.url),
      mimeType: rawAttachment.mimeType || "application/octet-stream",
      size: Number(rawAttachment.size) || 0,
      url: rawAttachment.url,
      type: rawAttachment.type || "file",
      uploadedAt: rawAttachment.uploadedAt ? new Date(rawAttachment.uploadedAt) : new Date(),
    };
  }

  return null;
}

router.post("/", authMiddleware, upload.array("attachments", 5), async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Only doctors can create prescriptions" });
    }

    const { patientId, diagnosis, notes, validUntil } = req.body || {};
    const medications = parseMedicationList(req.body.medications);

    if (!patientId || !diagnosis || !Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({ message: "Patient, diagnosis and at least one medication are required" });
    }

    const patient = await Patient.findById(patientId).select("userId");
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const uploadedFiles = Array.isArray(req.files) ? req.files : [];
    const rawAttachments = Array.isArray(req.body.attachments) ? req.body.attachments : [];
    const normalizedAttachments = [
      ...uploadedFiles.map((file) => ({
        name: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `/uploads/prescriptions/${file.filename}`,
        type: file.mimetype.startsWith("text/") ? "text" : "file",
        uploadedAt: new Date(),
      })),
      ...rawAttachments.map(normalizeAttachment).filter(Boolean),
    ];

    const prescription = await Prescription.create({
      patientId: patient.userId,
      doctorId: req.user.id,
      prescriptionId: `RX${Date.now()}${Math.floor(Math.random() * 1000)}`,
      date: new Date(),
      followUpDate: validUntil || undefined,
      diagnosis,
      medications: medications.map((medication) => ({
        name: medication.name,
        dosage: medication.dosage || medication.dose || "As directed",
        frequency: medication.frequency || "",
        timing: medication.timing || medication.instructions || "",
        duration: medication.duration || "",
      })),
      attachments: normalizedAttachments,
      notes: notes || "",
    });
    const safetyAnalysis = await SafetyEngine.analyzePrescription(String(patient.userId), prescription, req.user.id);
    const safetyAlert = await SafetyAlert.create({
      prescriptionId: prescription._id,
      patientId: patient.userId,
      doctorId: req.user.id,
      status: safetyAnalysis.status,
      alerts: safetyAnalysis.alerts,
    });
    await createEvent({
      patientId: patient._id,
      type: "prescription",
      refId: prescription._id,
      refModel: "Prescription",
      title: "Prescription created",
      description: diagnosis,
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, data: { prescription, safetyAnalysis, safetyAlert } });
  } catch (error) {
    console.error("Prescription create error:", error);
    const message = error?.message || "Failed to save prescription";
    res.status(error?.code === "LIMIT_FILE_SIZE" ? 413 : 500).json({ message });
  }
});

router.get(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const owner = mongoose.Types.ObjectId.isValid(req.user.id)
        ? await User.findById(req.user.id).select("_id")
        : await User.findOne({ firebaseUid: req.user.id }).select("_id");
      if (!owner) {
        return res.status(200).json([]);
      }

      const patientProfile = await Patient.findOne({ userId: owner._id }).select("_id").lean();
      if (!patientProfile) {
        return res.status(200).json([]);
      }

      const prescriptions = await Prescription.find({
        patientId: { $in: [owner._id, patientProfile._id] },
      })
        .populate(
          "doctorId",
          "name specialization qualification profileImage"
        )
        .populate(
          "patientId",
          "name phone patientId"
        )
        .sort({
          date: -1,
        });

      const formatted = prescriptions.map((prescription) => ({
        _id: prescription._id,
        prescriptionId: prescription.prescriptionId,
        date: prescription.date,
        followUpDate: prescription.followUpDate,
        status: prescription.status,
        diagnosis: prescription.diagnosis,
        medications: prescription.medications,
        notes: prescription.notes,
        attachments: prescription.attachments || [],
        doctor: {
          name: prescription.doctorId?.name,
          specialization: prescription.doctorId?.specialization,
          qualification: prescription.doctorId?.qualification,
          image: prescription.doctorId?.profileImage,
        },
        patient: {
          name: prescription.patientId?.name,
          patientId: prescription.patientId?.patientId,
          phone: prescription.patientId?.phone,
        },
        activeMedicationCount: prescription.medications.filter((medication) => prescription.status === "active").length,
      }));

      res.status(200).json(formatted);
    } catch (error) {
      console.error("Prescription fetch error:", error);
      res.status(500).json({ message: "Failed to fetch prescriptions" });
    }
  }
);

router.get(
  "/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const query = { _id: req.params.id };

      if (req.user.role === "patient") {
        query.patientId = req.user.id;
      } else if (req.user.role === "doctor") {
        query.doctorId = req.user.id;
      } else {
        return res.status(403).json({ message: "You are not allowed to view this prescription" });
      }

      const prescription = await Prescription.findOne(query)
        .populate("doctorId", "name specialization qualification profileImage")
        .populate("patientId", "name email phone patientId");

      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }

      res.status(200).json(prescription);
    } catch (error) {
      console.error("Prescription detail error:", error);
      res.status(500).json({ message: "Failed to fetch prescription" });
    }
  }
);

router.get(
  "/:id/download",
  authMiddleware,
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      const prescription = await Prescription.findOne({
        _id: req.params.id,
        patientId: { $in: await patientOwnerIds(req.user.id) },
      }).populate("doctorId", "name specialization qualification");

      if (!prescription) {
        return res.status(404).json({
          message:
            "Prescription not found",
        });
      }

      const safeId = String(prescription.prescriptionId || prescription._id).replace(/[^a-z0-9_-]/gi, "_");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="prescription-${safeId}.pdf"`);

      const document = new PDFDocument({ size: "A4", margin: 52, info: { Title: `Prescription ${prescription.prescriptionId || ""}`, Author: "Meridian" } });
      document.on("error", (error) => {
        console.error("Prescription PDF generation error:", error);
        if (!res.headersSent) res.status(500).end("Unable to generate prescription PDF");
      });
      document.pipe(res);

      document.fontSize(20).fillColor("#176b3d").text("MERIDIAN", { continued: true });
      document.fontSize(9).fillColor("#63766b").text("   PATIENT PRESCRIPTION");
      document.moveDown(1.5).strokeColor("#dcebe0").moveTo(52, document.y).lineTo(543, document.y).stroke();
      document.moveDown();

      document.fontSize(17).fillColor("#173a28").text("Prescription");
      document.moveDown(0.5);
      document.fontSize(10).fillColor("#42564d");
      document.text(`Prescription ID: ${prescription.prescriptionId || prescription._id}`);
      document.text(`Issued: ${prescription.date ? new Date(prescription.date).toLocaleDateString("en-GB") : "Not recorded"}`);
      document.text(`Doctor: ${prescription.doctorId?.name || "Care team"}`);
      if (prescription.doctorId?.specialization) document.text(`Specialty: ${prescription.doctorId.specialization}`);
      document.text(`Diagnosis: ${prescription.diagnosis || "Not recorded"}`);
      if (prescription.followUpDate) document.text(`Follow-up: ${new Date(prescription.followUpDate).toLocaleDateString("en-GB")}`);

      document.moveDown(1.5).fontSize(13).fillColor("#173a28").text("Medications");
      document.moveDown(0.5);
      for (const [index, medication] of (prescription.medications || []).entries()) {
        if (document.y > 700) document.addPage();
        document.fontSize(11).fillColor("#176b3d").text(`${index + 1}. ${medication.name || "Medication"}`);
        document.fontSize(10).fillColor("#42564d");
        document.text(`Dose: ${medication.dosage || "As prescribed"}    Frequency: ${medication.frequency || "As directed"}`);
        if (medication.timing) document.text(`Timing: ${medication.timing}`);
        if (medication.duration) document.text(`Duration: ${medication.duration}`);
        if (medication.description) document.text(`Instructions: ${medication.description}`);
        document.moveDown(0.8);
      }

      if (prescription.notes) {
        document.moveDown(0.5).fontSize(13).fillColor("#173a28").text("Notes");
        document.moveDown(0.4).fontSize(10).fillColor("#42564d").text(prescription.notes);
      }
      document.end();
    } catch (error) {
      console.error(error);

      if (!res.headersSent) res.status(500).json({ message: "Unable to download prescription" });
    }
  }
);

router.get(
  "/:id/print",
  authMiddleware,
  async (req, res) => {
    try {
      const prescription = await Prescription.findOne({
        _id: req.params.id,
        patientId: { $in: await patientOwnerIds(req.user.id) },
      });

      if (!prescription) {
        return res.status(404).json({
          message:
            "Prescription not found",
        });
      }

      res.status(200).json({
        prescription,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Unable to print prescription",
      });
    }
  }
);

module.exports = router;