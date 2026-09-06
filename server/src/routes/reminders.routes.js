const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Reminder = require('../models/Reminder');

// @route   GET /api/reminders
// @desc    Get all reminders for logged in user
router.get('/', protect, async (req, res) => {
  const reminders = await Reminder.find({ user: req.user._id }).sort({ isCompleted: 1, createdAt: -1 });
  res.json({ success: true, data: reminders });
});

// @route   POST /api/reminders
// @desc    Create a reminder
router.post('/', protect, async (req, res) => {
  if (!req.body.text) {
    return res.status(400).json({ success: false, message: 'Please add text' });
  }
  const reminder = await Reminder.create({
    text: req.body.text,
    user: req.user._id,
    dueDate: req.body.dueDate
  });
  res.status(201).json({ success: true, data: reminder });
});

// @route   PUT /api/reminders/:id
// @desc    Update reminder (e.g. mark completed)
router.put('/:id', protect, async (req, res) => {
  const reminder = await Reminder.findById(req.params.id);
  if (!reminder) {
    return res.status(404).json({ success: false, message: 'Reminder not found' });
  }
  if (reminder.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'User not authorized' });
  }
  const updatedReminder = await Reminder.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, data: updatedReminder });
});

// @route   DELETE /api/reminders/:id
// @desc    Delete reminder
router.delete('/:id', protect, async (req, res) => {
  const reminder = await Reminder.findById(req.params.id);
  if (!reminder) {
    return res.status(404).json({ success: false, message: 'Reminder not found' });
  }
  if (reminder.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'User not authorized' });
  }
  await reminder.deleteOne();
  res.json({ success: true, message: 'Reminder removed' });
});

module.exports = router;
