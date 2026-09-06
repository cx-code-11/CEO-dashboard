const express = require('express');
const router = express.Router();
const { protect, financeAccess, managementAccess } = require('../middleware/auth');
const Expense = require('../models/Expense');
const auditLog = require('../middleware/auditLogger');
const upload = require('../middleware/upload');

router.get('/', protect, managementAccess, async (req, res) => {
  const { category, status, startDate, endDate, page = 1, limit = 50 } = req.query;
  const query = {};
  if (category) query.category = category;
  if (status) query.status = status;
  if (startDate && endDate) query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  
  const data = await Expense.find(query)
    .populate('recordedBy', 'name')
    .populate('approvedBy', 'name')
    .sort({ date: -1 })
    .skip((+page - 1) * +limit).limit(+limit);
  const total = await Expense.countDocuments(query);
  res.json({ success: true, data, pagination: { total, page: +page, limit: +limit } });
});

router.post('/', protect, managementAccess, upload.single('billAttachment'), auditLog('CREATE', 'Expense'), async (req, res) => {
  const billAttachment = req.file ? `/uploads/general/${req.file.filename}` : undefined;
  const expense = await Expense.create({ ...req.body, billAttachment, recordedBy: req.user._id });
  res.status(201).json({ success: true, data: expense });
});

router.put('/:id', protect, financeAccess, auditLog('UPDATE', 'Expense'), async (req, res) => {
  const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
  res.json({ success: true, data: expense });
});

router.put('/:id/approve', protect, financeAccess, auditLog('APPROVE', 'Expense'), async (req, res) => {
  const expense = await Expense.findByIdAndUpdate(req.params.id, { status: 'Approved', approvedBy: req.user._id }, { new: true });
  res.json({ success: true, data: expense });
});

module.exports = router;
