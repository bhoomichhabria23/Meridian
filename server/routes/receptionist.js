const express = require("express");
const {
  verifyToken,
  requireRole,
} = require("../middleware/auth");
const Appointment =
  require("../models/Appointment");
const Patient =
  require("../models/Patient");
const User = require("../models/User");
const AuditLog =
  require("../models/AuditLog");

const router = express.Router();

/**
 * GET /api/receptionist/dashboard
 * Get receptionist dashboard data
 */
router.get(
  "/dashboard",
  verifyToken,
  requireRole("receptionist"),
  async (req, res) => {
    try {
      const totalPatients =
        await Patient.countDocuments();

      const todaysAppointments =
        await Appointment.find({
          date: {
            $gte: new Date(
              new Date().setHours(0, 0, 0, 0)
            ),
            $lt: new Date(
              new Date().setHours(
                23,
                59,
                59,
                999
              )
            ),
          },
        })
          .populate(
            "patientId",
            "name phone"
          )
          .populate("doctorId", "name")
          .limit(10);

      const pendingAppointments =
        await Appointment.find({
          status: "pending",
        })
          .populate(
            "patientId",
            "name"
          )
          .limit(10);

      const availableDoctors =
        await User.countDocuments({
          role: "doctor",
          isActive: true,
        });

      await AuditLog.create({
        userId: req.user.id,
        role: "receptionist",
        action: "DASHBOARD_VIEWED",
        entityType: "Dashboard",
      });

      return res.status(200).json({
        success: true,
        data: {
          totalPatients,
          todaysAppointmentsCount:
            todaysAppointments.length,
          pendingAppointmentsCount:
            pendingAppointments.length,
          availableDoctorsCount:
            availableDoctors,
          todaysAppointments,
          pendingAppointments,
        },
      });
    } catch (error) {
      console.error(
        "Error fetching dashboard:",
        error
      );
      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch dashboard",
      });
    }
  }
);

/**
 * GET /api/receptionist/patients
 * Get all patients for receptionist
 */
router.get(
  "/patients",
  verifyToken,
  requireRole("receptionist"),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
      } = req.query;
      const skip = (page - 1) * limit;

      const patients =
        await Patient.find()
          .populate("userId", "-password")
          .skip(skip)
          .limit(parseInt(limit));

      const total =
        await Patient.countDocuments();

      await AuditLog.create({
        userId: req.user.id,
        role: "receptionist",
        action: "PATIENT_LIST_VIEWED",
        entityType: "Patient",
      });

      return res.status(200).json({
        success: true,
        data: {
          patients,
          total,
          pages: Math.ceil(
            total / limit
          ),
        },
      });
    } catch (error) {
      console.error(
        "Error fetching patients:",
        error
      );
      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch patients",
      });
    }
  }
);

/**
 * GET /api/receptionist/appointments
 * Get all appointments
 */
router.get(
  "/appointments",
  verifyToken,
  requireRole("receptionist"),
  async (req, res) => {
    try {
      const {
        status,
        page = 1,
        limit = 20,
      } = req.query;
      const skip = (page - 1) * limit;

      const query = {};
      if (status) {
        query.status = status;
      }

      const appointments =
        await Appointment.find(query)
          .populate(
            "patientId",
            "name phone"
          )
          .populate("doctorId", "name")
          .sort({ date: -1 })
          .skip(skip)
          .limit(
            parseInt(limit)
          );

      const total =
        await Appointment.countDocuments(
          query
        );

      return res.status(200).json({
        success: true,
        data: {
          appointments,
          total,
          pages: Math.ceil(
            total / limit
          ),
        },
      });
    } catch (error) {
      console.error(
        "Error fetching appointments:",
        error
      );
      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch appointments",
      });
    }
  }
);

/**
 * POST /api/receptionist/appointments
 * Create new appointment
 */
router.post(
  "/appointments",
  verifyToken,
  requireRole("receptionist"),
  async (req, res) => {
    try {
      const {
        patientId,
        doctorId,
        date,
        reason,
      } = req.body;

      if (
        !patientId ||
        !date
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Patient and date are required",
        });
      }

      const appointment =
        new Appointment({
          patientId,
          doctorId,
          date,
          reason,
          status: "pending",
          createdBy: req.user.id,
        });

      await appointment.save();

      await AuditLog.create({
        userId: req.user.id,
        role: "receptionist",
        action:
          "APPOINTMENT_CREATED",
        entityType: "Appointment",
        targetId: appointment._id,
      });

      return res.status(201).json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      console.error(
        "Error creating appointment:",
        error
      );
      return res.status(500).json({
        success: false,
        message:
          "Failed to create appointment",
      });
    }
  }
);

/**
 * PUT /api/receptionist/appointments/:id
 * Update appointment
 */
router.put(
  "/appointments/:id",
  verifyToken,
  requireRole("receptionist"),
  async (req, res) => {
    try {
      const {
        id,
      } = req.params;
      const {
        doctorId,
        date,
        status,
        reason,
      } = req.body;

      const appointment =
        await Appointment.findByIdAndUpdate(
          id,
          {
            doctorId,
            date,
            status,
            reason,
          },
          {
            new: true,
          }
        );

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message:
            "Appointment not found",
        });
      }

      await AuditLog.create({
        userId: req.user.id,
        role: "receptionist",
        action:
          "APPOINTMENT_UPDATED",
        entityType: "Appointment",
        targetId: id,
      });

      return res.status(200).json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      console.error(
        "Error updating appointment:",
        error
      );
      return res.status(500).json({
        success: false,
        message:
          "Failed to update appointment",
      });
    }
  }
);

module.exports = router;
