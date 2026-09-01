const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");
const Diagnosis = require("../models/Diagnosis");
const Allergy = require("../models/Allergy");
const Medication = require("../models/Medication");
const LabResult = require("../models/LabResult");
const AuditLog = require("../models/AuditLog");
const {
  verifyToken,
  authorizeRole,
} = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/doctors/profile
 * Get current doctor's profile
 */
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({
      userId: req.user.id,
    }).populate("userId", "-password");

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    console.error("Error fetching doctor profile:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctor profile",
    });
  }
});

/**
 * POST /api/doctors/setup-profile
 * Create or update doctor profile
 */
router.post(
  "/setup-profile",
  verifyToken,
  async (req, res) => {
    try {
      const {
        specialty,
        licenseNo,
        hospital,
        department,
        workingHours,
      } = req.body;

      let doctor = await Doctor.findOne({
        userId: req.user.id,
      });

      if (!doctor) {
        doctor = new Doctor({
          userId: req.user.id,
          specialty,
          licenseNo,
          hospital,
          department,
          workingHours,
        });
      } else {
        doctor.specialty = specialty ||
          doctor.specialty;
        doctor.licenseNo = licenseNo ||
          doctor.licenseNo;
        doctor.hospital = hospital ||
          doctor.hospital;
        doctor.department = department ||
          doctor.department;
        doctor.workingHours = workingHours ||
          doctor.workingHours;
      }

      await doctor.save();

      return res.status(200).json({
        success: true,
        message: "Doctor profile updated",
        data: doctor,
      });
    } catch (error) {
      console.error("Error updating doctor profile:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update doctor profile",
      });
    }
  }
);

/**
 * GET /api/doctors/dashboard
 * Get doctor dashboard data
 */
router.get("/dashboard", verifyToken, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(
      req.user.id
    );

    // Get doctor's assigned patients
    const doctor = await Doctor.findOne({
      userId,
    });

    const patientIds = doctor?.patients || [];

    // Count total patients
    const totalPatients = patientIds.length;

    // Get today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysAppointments =
      await Appointment.find({
        doctorId: doctor?._id,
        date: {
          $gte: today,
          $lt: tomorrow,
        },
      }).populate("patientId", "name phone");

    // Get upcoming appointments
    const upcomingAppointments =
      await Appointment.find({
        doctorId: doctor?._id,
        date: {
          $gte: tomorrow,
        },
        status: {
          $in: ["pending", "confirmed"],
        },
      })
        .sort({ date: 1 })
        .limit(5)
        .populate("patientId", "name phone");

    // Get recent prescriptions
    const recentPrescriptions =
      await Prescription.find({
        doctorId: userId,
      })
        .sort({ createdAt: -1 })
        .limit(8)
        .populate("patientId", "name");

    return res.status(200).json({
      success: true,
      data: {
        totalPatients,
        todaysAppointmentsCount:
          todaysAppointments.length,
        upcomingAppointmentsCount:
          upcomingAppointments.length,
        todaysAppointments,
        upcomingAppointments,
        recentPrescriptions,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
    });
  }
});

/**
 * GET /api/doctors/patients/search
 * Search for patients
 */
router.get("/patients/search", verifyToken, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter at least 2 characters",
      });
    }

    // Search by name, email, or patient code
    const patients = await Patient.find({
      $or: [
        {
          userId: {
            $in: await User.find({
              $or: [
                {
                  name: {
                    $regex: query,
                    $options: "i",
                  },
                },
                {
                  email: {
                    $regex: query,
                    $options: "i",
                  },
                },
                {
                  phone: {
                    $regex: query,
                    $options: "i",
                  },
                },
              ],
            }).distinct("_id"),
          },
        },
        {
          patientCode: {
            $regex: query,
            $options: "i",
          },
        },
      ],
    })
      .populate("userId", "name email phone")
      .limit(10);

    return res.status(200).json({
      success: true,
      data: patients,
    });
  } catch (error) {
    console.error("Error searching patients:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to search patients",
    });
  }
});

/**
 * GET /api/doctors/patients/:patientId
 * Get patient details
 */
router.get(
  "/patients/:patientId",
  verifyToken,
  async (req, res) => {
    try {
      const patient = await Patient.findById(
        req.params.patientId
      ).populate("userId", "name email phone role");

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      // Log patient view
      await AuditLog.create({
        userId: req.user.id,
        role: req.user.role,
        action: "PATIENT_VIEWED",
        entityType: "Patient",
        entityId: patient._id,
        targetUserId: patient.userId,
      });

      return res.status(200).json({
        success: true,
        data: patient,
      });
    } catch (error) {
      console.error("Error fetching patient:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch patient data",
      });
    }
  }
);

/**
 * GET /api/doctors/patients/:patientId/timeline
 * Get patient's medical timeline
 */
router.get(
  "/patients/:patientId/timeline",
  verifyToken,
  async (req, res) => {
    try {
      const patientUserId = await Patient.findById(
        req.params.patientId
      ).select("userId");

      if (!patientUserId) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      // Fetch all medical records
      const [
        diagnoses,
        allergies,
        medications,
        labs,
        prescriptions,
        appointments,
      ] = await Promise.all([
        Diagnosis.find({
          patientId: patientUserId.userId,
        }),
        Allergy.find({
          patientId: patientUserId.userId,
        }),
        Medication.find({
          patientId: patientUserId.userId,
        }),
        LabResult.find({
          patientId: patientUserId.userId,
        }),
        Prescription.find({
          patientId: patientUserId.userId,
        }),
        Appointment.find({
          patientId: req.params.patientId,
        }),
      ]);

      // Build timeline
      const timeline = [];

      diagnoses.forEach((d) => {
        timeline.push({
          date: d.diagnosedDate,
          type: "diagnosis",
          title: d.condition,
          description: d.notes || "",
          severity: d.severity,
          data: d,
        });
      });

      allergies.forEach((a) => {
        timeline.push({
          date: a.recordedDate,
          type: "allergy",
          title: `Allergy: ${a.allergen}`,
          description: `Reaction: ${a.reaction}`,
          severity: a.severity,
          data: a,
        });
      });

      medications.forEach((m) => {
        timeline.push({
          date: m.startDate || new Date(),
          type: "medication",
          title: `Medication: ${m.name}`,
          description: `${m.dosage} ${m.frequency}`,
          data: m,
        });
      });

      labs.forEach((l) => {
        timeline.push({
          date: l.testDate,
          type: "lab",
          title: `Lab: ${l.testName}`,
          description: `${l.results?.length || 0} results`,
          data: l,
        });
      });

      prescriptions.forEach((p) => {
        timeline.push({
          date: p.date || new Date(),
          type: "prescription",
          title: "Prescription Created",
          description: p.prescriptionId,
          data: p,
        });
      });

      appointments.forEach((a) => {
        timeline.push({
          date: a.date,
          type: "appointment",
          title: `Appointment (${a.status})`,
          description: a.chiefComplaint || "Checkup",
          data: a,
        });
      });

      // Sort by date descending
      timeline.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      return res.status(200).json({
        success: true,
        data: timeline,
      });
    } catch (error) {
      console.error("Error fetching timeline:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch timeline",
      });
    }
  }
);

module.exports = router;
