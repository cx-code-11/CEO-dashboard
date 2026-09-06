const express = require('express');
const router = express.Router();
const { protect, salesAccess } = require('../middleware/auth');
const Lead = require('../models/Lead');
const Client = require('../models/Client');
const Notification = require('../models/Notification');
const auditLog = require('../middleware/auditLogger');

router.get('/', protect, salesAccess, async (req, res) => {
  const { status, assignedTo, priority, search, page = 1, limit = 50 } = req.query;
  const query = {};
  if (status) query.status = status;
  if (priority) query.priority = priority;
  // Sales Executives see only their own leads
  if (req.user.role === 'Sales Executive') query.assignedTo = req.user._id;
  else if (assignedTo) query.assignedTo = assignedTo;
  if (search) query.$or = [
    { title: { $regex: search, $options: 'i' } },
    { contactPerson: { $regex: search, $options: 'i' } },
    { company: { $regex: search, $options: 'i' } }
  ];
  const data = await Lead.find(query)
    .populate('assignedTo', 'name avatar')
    .populate('client', 'name companyName')
    .sort({ createdAt: -1 })
    .skip((+page - 1) * +limit).limit(+limit);
  const total = await Lead.countDocuments(query);
  res.json({ success: true, data, pagination: { total, page: +page, limit: +limit } });
});

// GET pipeline (grouped by status)
router.get('/pipeline', protect, salesAccess, async (req, res) => {
  const query = req.user.role === 'Sales Executive' ? { assignedTo: req.user._id } : {};
  const pipeline = await Lead.aggregate([
    { $match: query },
    { $group: { _id: '$status', count: { $sum: 1 }, totalValue: { $sum: '$estimatedValue' }, leads: { $push: '$$ROOT' } } },
    { $sort: { _id: 1 } }
  ]);
  res.json({ success: true, data: pipeline });
});

router.get('/:id', protect, salesAccess, async (req, res) => {
  const lead = await Lead.findById(req.params.id).populate('assignedTo', 'name avatar email').populate('client');
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
  res.json({ success: true, data: lead });
});

router.post('/', protect, salesAccess, auditLog('CREATE', 'Lead'), async (req, res) => {
  const lead = await Lead.create({ ...req.body, assignedTo: req.body.assignedTo || req.user._id });
  res.status(201).json({ success: true, message: 'Lead created', data: lead });
});

router.put('/:id', protect, salesAccess, auditLog('UPDATE', 'Lead'), async (req, res) => {
  const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
  res.json({ success: true, data: lead });
});

// POST /api/leads/:id/followup
router.post('/:id/followup', protect, salesAccess, async (req, res) => {
  const { note, type, nextFollowUp } = req.body;
  const lead = await Lead.findByIdAndUpdate(req.params.id,
    { $push: { followUps: { note, type, nextFollowUp, createdBy: req.user._id } }, followUpDate: nextFollowUp },
    { new: true }
  );
  res.json({ success: true, data: lead });
});

// POST /api/leads/:id/convert — convert lead to client
router.post('/:id/convert', protect, salesAccess, async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
  if (lead.convertedToClient) return res.status(400).json({ success: false, message: 'Already converted' });

  const client = await Client.create({
    name: lead.contactPerson,
    companyName: lead.company || req.body.companyName,
    email: lead.email,
    phone: lead.phone,
    source: lead.source,
    assignedTo: lead.assignedTo,
    status: 'Active',
    ...req.body,
  });

  await Lead.findByIdAndUpdate(lead._id, { status: 'Won', convertedToClient: true, convertedAt: new Date(), client: client._id });
  res.status(201).json({ success: true, message: 'Lead converted to client', data: { lead, client } });
});

router.delete('/:id', protect, async (req, res) => {
  if (!['CEO', 'Sales Executive'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Not authorized' });
  await Lead.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Lead deleted' });
});

module.exports = router;
