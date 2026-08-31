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
const { extractReportText } = require("../utils/ocrService");
const { classifyReport } = require("../utils/reportClassifier");
const mongoose = require("mongoose");
const User = require("../models/User");

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
          .sort({
            date: -1,
          });

      const formattedReports =
        reports.map((report) => ({
          _id: report._id,

          reportId:
            report.reportId,

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

      const { patientId, title, type, date } = req.body || {};
      const patient = await findPatientByIdentity(patientId || req.user.id);
      if (!patient) return res.status(404).json({ message: "Patient not found." });

      const reportType = {
        scan: "imaging",
        discharge: "other",
        consultation: "other",
        prescription_copy: "other",
      }[type] || type;

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
      const classifiedType = classifyReport({
        extractedText,
        name: title,
        fileName: req.file.originalname,
      });

      const report =
        await Report.create({
          patientId: patient.userId,
          doctorId: req.user.role === "doctor" ? req.user.id : undefined,

          reportId,

          name: title || path.parse(req.file.originalname).name,

          type: classifiedType,

          status: "pending",

          date: date ? new Date(date) : new Date(),

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
      await createEvent({
        patientId: patient._id,
        type: "report",
        refId: report._id,
        refModel: "Report",
        title: `Report uploaded: ${report.name}`,
        description: `${report.type} report uploaded for review`,
        createdBy: req.user.id,
      });

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

      if (!report || !report.fileUrl) {
        return res.status(404).json({ message: "Report file not found." });
      }

      const filePath = reportFilePath(report.fileUrl);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Report file not found." });
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