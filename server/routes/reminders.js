const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Reminder = require('../models/Reminder');
const SafetyEngine = require('../services/safetyEngine');

router.use(verifyToken);
const userId = (req) => req.user._id || req.user.id;

router.get('/', async (req, res) => {
  try {
    await SafetyEngine.createPreventiveCareReminders(userId(req));
    res.json(await Reminder.find({ userId: userId(req) }).sort({ date: 1 }));
  }
  catch (error) { res.status(500).json({ message: error.message }); }
});

router.post('/', async (req, res) => {
  try {
    const reminder = await Reminder.create({ ...req.body, userId: userId(req) });
    res.status(201).json(reminder);
  } catch (error) { res.status(400).json({ message: error.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndUpdate({ _id: req.params.id, userId: userId(req) }, req.body, { new: true, runValidators: true });
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
    res.json(reminder);
  } catch (error) { res.status(400).json({ message: error.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndDelete({ _id: req.params.id, userId: userId(req) });
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
    res.json({ message: 'Reminder deleted' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;
