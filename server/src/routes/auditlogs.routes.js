const express = require('express');
const router = express.Router();
const { protect, ceoOnly } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

router.get('/', protect, ceoOnly, async (req, res) => {
  const { module, action, userRole, startDate, endDate, page = 1, limit = 50 } = req.query;
  const query = {};
  if (module) query.module = module;
  if (action) query.action = action;
  if (userRole) query.userRole = userRole;
  if (startDate && endDate) query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  
  const data = await AuditLog.find(query)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip((+page - 1) * +limit).limit(+limit);
  const total = await AuditLog.countDocuments(query);
  res.json({ success: true, data, pagination: { total, page: +page, limit: +limit } });
});

module.exports = router;
