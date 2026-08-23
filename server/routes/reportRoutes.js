const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Report = require("../models/Report");
const Patient = require("../models/Patient");
const authMiddleware = require("../middleware/authMiddleware");
const { createEvent } = require("../utils/medicalEvent");
const { extractReportText } = require("../utils/ocrService");
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

/*
GET REPORTS
*/
router.get(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const reports =
        await Report.find({
          patientId: req.user.id,
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
      const patient = await findPatientByIdentity(patientId);
      if (!patient) return res.status(404).json({ message: "Patient not found." });

      const reportType = {
        scan: "imaging",
        discharge: "other",
        consultation: "other",
        prescription_copy: "other",
      }[type] || type;

      const reportCount =
        await Report.countDocuments();

      const reportId =
        `RPT${String(
          reportCount + 1
        ).padStart(5, "0")}`;

      let extractedText = "";
      let ocrStatus = "pending";
      try {
        extractedText = await extractReportText(req.file.path, req.file.mimetype);
        ocrStatus = extractedText ? "completed" : "failed";
      } catch (ocrError) {
        console.error("Report OCR error:", ocrError.message);
        ocrStatus = "failed";
      }

      const report =
        await Report.create({
          patientId: patient.userId,
          doctorId: req.user.role === "doctor" ? req.user.id : undefined,

          reportId,

          name: title || path.parse(req.file.originalname).name,

          type: ["lab", "imaging", "cardiology", "pathology", "radiology"].includes(reportType) ? reportType : "other",

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
      const report = await Report.findOne({
        _id: req.params.id,
        patientId: req.user.id,
      });

      if (!report || !report.fileUrl) {
        return res.status(404).json({ message: "Report file not found." });
      }

      const filePath = path.join(uploadDirectory, path.basename(report.fileUrl));
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
      const report =
        await Report.findOne({
          _id: req.params.id,
          patientId: req.user.id,
        });

      if (!report) {
        return res.status(404).json({
          message:
            "Report not found.",
        });
      }

      if (report.fileName) {
        const filePath =
          path.join(
            uploadDirectory,
            path.basename(
              report.fileUrl
            )
          );

        if (fs.existsSync(filePath)) {
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