const express = require('express');
const jwt = require('jsonwebtoken');
const admin = require('../config/firebaseAdmin');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

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
      phone: phone || '',
      role: requestedRole,
      specialization: requestedRole === 'doctor' ? specialization || '' : null,
    };

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
      await Patient.updateOne({ userId: user._id }, { $setOnInsert: { userId: user._id } }, { upsert: true });
    }
    if (user.role === 'doctor') {
      await Doctor.updateOne(
        { userId: user._id },
        { $setOnInsert: { userId: user._id }, $set: { specialty: specialization || '' } },
        { upsert: true }
      );
    }

    const token = jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, uid: decoded.uid, name: user.name, email: user.email, phone: user.phone, role: user.role, specialization: user.specialization } });
  } catch (error) {
    console.error('Firebase session exchange error:', error.code || 'unknown', error.stack || error.message);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'An account with this Firebase email already exists and could not be linked.' });
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
