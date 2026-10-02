const express = require('express');
const jwt = require('jsonwebtoken');
const admin = require('../config/firebaseAdmin');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const cacheManager = require('../utils/cacheManager');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { idToken, role, name, phone, specialization } = req.body;
    if (!idToken) return res.status(400).json({ message: 'Firebase ID token is required.' });

    const decoded = await admin.auth().verifyIdToken(idToken);
    const requestedRole = ['patient', 'doctor', 'receptionist'].includes(role) ? role : 'patient';
    const email = (decoded.email || '').toLowerCase().trim();
    const update = {
      email,
      firebaseUid: decoded.uid,
      name: name || decoded.name || email.split('@')[0] || 'User',
      role: requestedRole,
    };
    if (requestedRole === 'doctor') {
      if (typeof specialization === 'string' && specialization.trim()) {
        update.specialization = specialization.trim();
      }
    } else {
      update.specialization = null;
    }
    if (typeof phone === 'string' && phone.trim()) {
      update.phone = phone.trim();
    }

    // Link legacy email/password users to their Firebase identity instead of
    // attempting an upsert that violates the unique email index.
    let user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user && email) {
      user = await User.findOne({ email });
    }

    user = user
      ? await User.findByIdAndUpdate(user._id, { $set: update }, { new: true, runValidators: true })
      : await User.create(update);

    if (user.role === 'patient') {
      await Patient.updateOne(
        { userId: user._id },
        {
          ...(user.phone ? { $set: { phone: user.phone } } : {}),
          $setOnInsert: { userId: user._id },
        },
        { upsert: true }
      );
    }
    if (user.role === 'doctor') {
      // Ensure doctor record is created/updated
      const doctorUpdate = {
        userId: user._id,
        $setOnInsert: { createdAt: new Date() },
      };
      const savedSpecialty = typeof specialization === 'string' && specialization.trim()
        ? specialization.trim()
        : user.specialization;
      if (savedSpecialty) doctorUpdate.specialty = savedSpecialty;
      let doctorRecord;
      try {
        doctorRecord = await Doctor.findOneAndUpdate(
          { userId: user._id },
          doctorUpdate,
          { upsert: true, new: true }
        );
      } catch (doctorError) {
        const duplicateField = Object.keys(doctorError.keyPattern || {})[0];
        if (doctorError.code !== 11000 || duplicateField !== 'licenseNo') {
          throw doctorError;
        }

        await Doctor.collection.dropIndex('licenseNo_1').catch(() => {});
        await Doctor.syncIndexes();
        doctorRecord = await Doctor.findOneAndUpdate(
          { userId: user._id },
          doctorUpdate,
          { upsert: true, new: true }
        );
      }
      console.log('Doctor record ensured:', doctorRecord?._id, 'for user:', user._id);
      cacheManager.delete('doctors:{}');
    }

    const token = jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ token, user: { id: user._id, uid: decoded.uid, name: user.name, email: user.email, phone: user.phone, role: user.role, specialization: user.specialization } });
  } catch (error) {
    console.error('Firebase session exchange error:', error.code || 'unknown', error.stack || error.message);
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];
      const message = duplicateField === 'email'
        ? 'An account with this email already exists.'
        : duplicateField === 'licenseNo'
          ? 'This doctor license number is already registered.'
          : 'This account could not be completed because a unique profile value is already in use.';
      return res.status(409).json({ message });
    }

    const message = error.code === 'auth/id-token-expired'
      ? 'Your Firebase session has expired. Please sign in again.'
      : error.code === 'auth/argument-error' || error.code === 'auth/invalid-id-token'
        ? 'Invalid Firebase ID token.'
        : process.env.NODE_ENV !== 'production'
          ? `Firebase session exchange failed: ${error.message || 'unknown server error'}`
        : 'Firebase authentication could not be verified.';
    res.status(401).json({ message });
  }
});

module.exports = router;
