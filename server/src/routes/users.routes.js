const express = require('express');
const router = express.Router();
const { protect, ceoOnly, managementAccess } = require('../middleware/auth');
const User = require('../models/User');
const Employee = require('../models/Employee');
const upload = require('../middleware/upload');

// GET /api/users — list all users (management+)
router.get('/', protect, managementAccess, async (req, res) => {
  const { role, isActive, search, page = 1, limit = 20 } = req.query;
  const query = {};
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } }
  ];
  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  const total = await User.countDocuments(query);
  res.json({ success: true, data: users, pagination: { total, page: +page, limit: +limit, pages: Math.ceil(total / limit) } });
});

// GET /api/users/:id
router.get('/:id', protect, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: user });
});

// POST /api/users — create user (CEO only)
router.post('/', protect, ceoOnly, async (req, res) => {
  const { name, email, password, role, department, phone } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ success: false, message: 'Email already registered' });
  const user = await User.create({ name, email, password, role, department, phone });
  res.status(201).json({ success: true, message: 'User created', data: user });
});

// PUT /api/users/:id
router.put('/:id', protect, async (req, res) => {
  // Users can update their own profile, CEO can update anyone
  if (req.user.role !== 'CEO' && req.user._id.toString() !== req.params.id) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  const { name, department, phone, avatar } = req.body;
  const updateData = { name, department, phone, avatar };
  if (req.user.role === 'CEO') {
    const { role, isActive } = req.body;
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
  }
  const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, message: 'User updated', data: user });
});

// DELETE /api/users/:id (CEO only — soft delete)
router.delete('/:id', protect, ceoOnly, async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, message: 'User deactivated' });
});

// POST /api/users/:id/avatar
router.post('/:id/avatar', protect, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const fileUrl = `/uploads/general/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(req.params.id, { avatar: fileUrl }, { new: true });
  res.json({ success: true, data: { avatar: fileUrl, user } });
});

module.exports = router;
