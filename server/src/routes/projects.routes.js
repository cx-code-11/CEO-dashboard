const express = require('express');
const router = express.Router();
const { protect, projectAccess, managementAccess } = require('../middleware/auth');
const Project = require('../models/Project');
const Task = require('../models/Task');
const auditLog = require('../middleware/auditLogger');

router.get('/', protect, async (req, res) => {
  const { status, client, search, page = 1, limit = 20 } = req.query;
  const query = {};
  if (status) query.status = status;
  if (client) query.client = client;
  if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { code: { $regex: search, $options: 'i' } }];
  
  // If regular employee, only show projects they are part of
  if (req.user.role === 'Employee') {
    query['team.user'] = req.user._id;
  }
  
  const data = await Project.find(query)
    .populate('client', 'name')
    .populate('manager', 'name avatar')
    .sort({ createdAt: -1 })
    .skip((+page - 1) * +limit).limit(+limit);
  const total = await Project.countDocuments(query);
  res.json({ success: true, data, pagination: { total, page: +page, limit: +limit } });
});

router.get('/:id', protect, async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('client')
    .populate('manager', 'name avatar')
    .populate('team.user', 'name avatar role');
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  
  const tasks = await Task.find({ project: project._id }).populate('assignedTo', 'name avatar');
  res.json({ success: true, data: { ...project.toObject(), tasks } });
});

router.post('/', protect, projectAccess, auditLog('CREATE', 'Project'), async (req, res) => {
  const project = await Project.create({ ...req.body, manager: req.body.manager || req.user._id });
  res.status(201).json({ success: true, data: project });
});

router.put('/:id', protect, projectAccess, auditLog('UPDATE', 'Project'), async (req, res) => {
  const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  res.json({ success: true, data: project });
});

router.post('/:id/team', protect, projectAccess, async (req, res) => {
  const { userId, role } = req.body;
  const project = await Project.findByIdAndUpdate(req.params.id, 
    { $push: { team: { user: userId, role } } }, 
    { new: true }
  ).populate('team.user', 'name avatar');
  res.json({ success: true, data: project });
});

module.exports = router;
