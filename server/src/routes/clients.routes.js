const express = require('express');
const router = express.Router();
const { protect, salesAccess } = require('../middleware/auth');
const Client = require('../models/Client');
const Invoice = require('../models/Invoice');
const auditLog = require('../middleware/auditLogger');

router.get('/', protect, salesAccess, async (req, res) => {
  const { status, search, industry, page = 1, limit = 20 } = req.query;
  const query = {};
  if (status) query.status = status;
  if (industry) query.industry = industry;
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { companyName: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } }
  ];
  const data = await Client.find(query).populate('assignedTo', 'name avatar').sort({ totalRevenue: -1 }).skip((+page - 1) * +limit).limit(+limit);
  const total = await Client.countDocuments(query);
  res.json({ success: true, data, pagination: { total, page: +page, limit: +limit } });
});

router.get('/top', protect, async (req, res) => {
  const clients = await Client.find({ status: 'Active' }).sort({ totalRevenue: -1 }).limit(10).populate('assignedTo', 'name');
  res.json({ success: true, data: clients });
});

router.get('/:id', protect, salesAccess, async (req, res) => {
  const client = await Client.findById(req.params.id).populate('assignedTo', 'name avatar email');
  if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
  const invoices = await Invoice.find({ client: client._id }).sort({ createdAt: -1 }).limit(10);
  res.json({ success: true, data: { ...client.toObject(), recentInvoices: invoices } });
});

router.post('/', protect, salesAccess, auditLog('CREATE', 'Client'), async (req, res) => {
  const client = await Client.create({ ...req.body, assignedTo: req.body.assignedTo || req.user._id });
  res.status(201).json({ success: true, message: 'Client created', data: client });
});

router.put('/:id', protect, salesAccess, auditLog('UPDATE', 'Client'), async (req, res) => {
  const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
  res.json({ success: true, data: client });
});

router.delete('/:id', protect, async (req, res) => {
  if (!['CEO', 'Finance Manager'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Not authorized' });
  await Client.findByIdAndUpdate(req.params.id, { status: 'Inactive' });
  res.json({ success: true, message: 'Client deactivated' });
});

module.exports = router;
