const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Patient = require("../models/Patient");
const { verifyToken } = require("../middleware/auth");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const currentUserId = (req) => req.user._id || req.user.id;

async function currentUser(req) {
  const identity = currentUserId(req);
  if (mongoose.Types.ObjectId.isValid(identity)) {
    return User.findById(identity);
  }
  return User.findOne({ firebaseUid: identity });
}

// GET current logged-in user's profile
router.get("/me", verifyToken, async (req, res) => {
  try {
    // Firebase middleware should attach the decoded user
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const userDocument = await currentUser(req);
    const user = userDocument?.toObject ? userDocument.toObject() : userDocument;

    if (!user) {
      return res.status(404).json({
        message: "User profile not found",
      });
    }

    const patient = user.role === "patient" ? await Patient.findOne({ userId: user._id }).lean() : null;
    res.json({ ...user, patient });
  } catch (error) {
    console.error("Get profile error:", error);

    res.status(500).json({
      message: "Failed to fetch user profile",
    });
  }
});

router.put("/me", verifyToken, async (req, res) => {
  try {
    const allowedUser = (({ name, phone, email }) => ({ name, phone, email }))(req.body);
    const existingUser = await currentUser(req);
    const user = existingUser ? await User.findByIdAndUpdate(existingUser._id, allowedUser, { new: true, runValidators: true }).lean() : null;
    if (!user) return res.status(404).json({ message: "User profile not found" });
    const patientFields = (({ dateOfBirth, gender, bloodGroup, allergies, conditions, emergencyContact, address }) => ({ dateOfBirth, gender, bloodGroup, allergies, conditions, emergencyContact, address }))(req.body);
    const patient = user.role === "patient" ? await Patient.findOneAndUpdate({ userId: user._id }, patientFields, { new: true, upsert: true, runValidators: true }).lean() : null;
    res.json({ ...user, patient });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

router.put("/me/password", verifyToken, async (req, res) => {
  try {
    if (!req.body.currentPassword || !req.body.newPassword || req.body.newPassword.length < 8) return res.status(400).json({ message: "Current password and a new password of at least 8 characters are required." });
    const user = await currentUser(req);
    if (!user || !(await bcrypt.compare(req.body.currentPassword, user.password))) return res.status(400).json({ message: "Current password is incorrect." });
    user.password = await bcrypt.hash(req.body.newPassword, 12);
    await user.save();
    res.json({ message: "Password changed successfully." });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

module.exports = router;