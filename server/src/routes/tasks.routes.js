const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const auditLog = require('../middleware/auditLogger');
const upload = require('../middleware/upload');

router.get('/', protect, async (req, res) => {
  const { project, status, assignedTo, priority, page = 1, limit = 50 } = req.query;
  const query = {};
  if (project) query.project = project;
  if (status) query.status = status;
  if (priority) query.priority = priority;
  
  if (req.user.role === 'Employee') {
    query.assignedTo = req.user._id;
  } else if (assignedTo) {
    query.assignedTo = assignedTo;
  }
  
  const data = await Task.find(query)
    .populate('project', 'name')
    .populate('assignedTo', 'name avatar')
    .sort({ dueDate: 1 })
    .skip((+page - 1) * +limit).limit(+limit);
  const total = await Task.countDocuments(query);
  res.json({ success: true, data, pagination: { total, page: +page, limit: +limit } });
});

router.post('/', protect, upload.array('attachments'), auditLog('CREATE', 'Task'), async (req, res) => {
  const attachments = req.files ? req.files.map(f => `/uploads/general/${f.filename}`) : [];
  const task = await Task.create({ ...req.body, createdBy: req.user._id, attachments });
  
  if (task.assignedTo.toString() !== req.user._id.toString()) {
    await Notification.create({
      user: task.assignedTo,
      title: 'New Task Assigned',
      message: `You have been assigned a new task: ${task.title}`,
      type: 'task'
    });
  }
  
  res.status(201).json({ success: true, data: task });
});

router.put('/:id', protect, auditLog('UPDATE', 'Task'), async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
  res.json({ success: true, data: task });
});

router.post('/:id/comments', protect, async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, 
    { $push: { comments: { user: req.user._id, text: req.body.text } } }, 
    { new: true }
  ).populate('comments.user', 'name avatar');
  res.json({ success: true, data: task });
});

module.exports = router;
