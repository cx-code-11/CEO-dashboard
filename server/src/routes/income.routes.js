const express = require('express');
const router = express.Router();
const { protect, financeAccess } = require('../middleware/auth');
const Income = require('../models/Income');
const auditLog = require('../middleware/auditLogger');
const upload = require('../middleware/upload');

router.get('/', protect, financeAccess, async (req, res) => {
  const { category, startDate, endDate, page = 1, limit = 50 } = req.query;
  const query = {};
  if (category) query.category = category;
  if (startDate && endDate) query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  
  const data = await Income.find(query)
    .populate('client', 'name')
    .populate('recordedBy', 'name')
    .sort({ date: -1 })
    .skip((+page - 1) * +limit).limit(+limit);
  const total = await Income.countDocuments(query);
  res.json({ success: true, data, pagination: { total, page: +page, limit: +limit } });
});

router.post('/', protect, financeAccess, upload.array('attachments'), auditLog('CREATE', 'Income'), async (req, res) => {
  const attachments = req.files ? req.files.map(f => `/uploads/general/${f.filename}`) : [];
  const income = await Income.create({ ...req.body, attachments, recordedBy: req.user._id });
  res.status(201).json({ success: true, data: income });
});

router.put('/:id', protect, financeAccess, auditLog('UPDATE', 'Income'), async (req, res) => {
  const income = await Income.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!income) return res.status(404).json({ success: false, message: 'Income not found' });
  res.json({ success: true, data: income });
});

module.exports = router;
