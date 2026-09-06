const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');

router.get('/', protect, async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const query = { user: req.user._id };
  if (unreadOnly === 'true') query.isRead = false;
  
  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip((+page - 1) * +limit).limit(+limit);
    
  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
  const total = await Notification.countDocuments(query);
  
  res.json({ success: true, data: notifications, unreadCount, pagination: { total, page: +page, limit: +limit } });
});

router.put('/:id/read', protect, async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  res.json({ success: true, data: notification });
});

router.put('/read-all', protect, async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  res.json({ success: true, message: 'All notifications marked as read' });
});

module.exports = router;
