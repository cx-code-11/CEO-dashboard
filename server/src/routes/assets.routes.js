const express = require('express');
const router = express.Router();
const { protect, managementAccess } = require('../middleware/auth');
const Asset = require('../models/Asset');
const auditLog = require('../middleware/auditLogger');
const upload = require('../middleware/upload');

router.get('/', protect, managementAccess, async (req, res) => {
  const { type, status, assignedTo, search, page = 1, limit = 50 } = req.query;
  const query = {};
  if (type) query.type = type;
  if (status) query.status = status;
  if (assignedTo) query.assignedTo = assignedTo;
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { assetTag: { $regex: search, $options: 'i' } },
    { serialNo: { $regex: search, $options: 'i' } }
  ];
  
  const data = await Asset.find(query)
    .populate('assignedTo', 'name')
    .sort({ createdAt: -1 })
    .skip((+page - 1) * +limit).limit(+limit);
  const total = await Asset.countDocuments(query);
  res.json({ success: true, data, pagination: { total, page: +page, limit: +limit } });
});

router.post('/', protect, managementAccess, upload.array('images'), auditLog('CREATE', 'Asset'), async (req, res) => {
  const images = req.files ? req.files.map(f => `/uploads/general/${f.filename}`) : [];
  const asset = await Asset.create({ ...req.body, images });
  res.status(201).json({ success: true, data: asset });
});

router.put('/:id', protect, managementAccess, auditLog('UPDATE', 'Asset'), async (req, res) => {
  const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
  res.json({ success: true, data: asset });
});

router.post('/:id/allocate', protect, managementAccess, async (req, res) => {
  const { userId, notes } = req.body;
  const asset = await Asset.findById(req.params.id);
  if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
  if (asset.status !== 'Available') return res.status(400).json({ success: false, message: 'Asset is not available' });
  
  asset.assignedTo = userId;
  asset.assignedAt = new Date();
  asset.status = 'Assigned';
  asset.allocationHistory.push({ user: userId, assignedAt: new Date(), notes });
  await asset.save();
  
  res.json({ success: true, data: asset });
});

router.post('/:id/return', protect, managementAccess, async (req, res) => {
  const asset = await Asset.findById(req.params.id);
  if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
  if (asset.status !== 'Assigned') return res.status(400).json({ success: false, message: 'Asset is not assigned' });
  
  const currentAllocation = asset.allocationHistory[asset.allocationHistory.length - 1];
  if (currentAllocation) {
    currentAllocation.returnedAt = new Date();
    currentAllocation.notes = req.body.notes || currentAllocation.notes;
  }
  
  asset.assignedTo = null;
  asset.returnedAt = new Date();
  asset.status = 'Available';
  await asset.save();
  
  res.json({ success: true, data: asset });
});

module.exports = router;
