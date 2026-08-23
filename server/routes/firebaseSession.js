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
    const user = await User.findOneAndUpdate(
      { firebaseUid: decoded.uid },
      {
        $set: {
          email: decoded.email || undefined,
          name: name || decoded.name || decoded.email?.split('@')[0] || 'User',
          phone: phone || '',
          role: requestedRole,
          specialization: requestedRole === 'doctor' ? specialization || '' : null,
        },
        $setOnInsert: { firebaseUid: decoded.uid },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

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
    console.error('Firebase session exchange error:', error.message);
    res.status(401).json({ message: 'Firebase authentication could not be verified.' });
  }
});

module.exports = router;
