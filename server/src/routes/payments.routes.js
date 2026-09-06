const express = require('express');
const router = express.Router();
const { protect, financeAccess, salesAccess } = require('../middleware/auth');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const upload = require('../middleware/upload');
const auditLog = require('../middleware/auditLogger');

router.get('/', protect, financeAccess, async (req, res) => {
  const { startDate, endDate, mode, client, page = 1, limit = 50 } = req.query;
  const query = {};
  if (startDate && endDate) query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  if (mode) query.mode = mode;
  if (client) query.client = client;
  
  const data = await Payment.find(query)
    .populate('client', 'name companyName')
    .populate('invoice', 'invoiceNo total status')
    .populate('recordedBy', 'name')
    .sort({ date: -1 })
    .skip((+page - 1) * +limit).limit(+limit);
  const total = await Payment.countDocuments(query);
  res.json({ success: true, data, pagination: { total, page: +page, limit: +limit } });
});

router.get('/:id', protect, financeAccess, async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('client')
    .populate('invoice')
    .populate('recordedBy', 'name');
  if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
  res.json({ success: true, data: payment });
});

router.post('/:id/attachment', protect, financeAccess, upload.single('attachment'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const payment = await Payment.findByIdAndUpdate(req.params.id, { attachment: `/uploads/general/${req.file.filename}` }, { new: true });
  res.json({ success: true, data: payment });
});

module.exports = router;
