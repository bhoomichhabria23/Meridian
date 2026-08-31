const express  = require('express');
const router   = express.Router();
const { verifyToken } = require('../middleware/auth');
const Notification = require('../models/Notification');
const currentUserId = (req) => req.user._id || req.user.id;

router.get('/', verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: currentUserId(req) })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, userId: currentUserId(req) });
    if (!notification) return res.status(404).json({ message: 'Not found' });
    notification.read = true;
    await notification.save();
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
