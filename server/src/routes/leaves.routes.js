const express = require('express');
const router = express.Router();
const { protect, hrAccess } = require('../middleware/auth');
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');
const upload = require('../middleware/upload');

// GET /api/leaves
router.get('/', protect, async (req, res) => {
  const { employeeId, status, type, page = 1, limit = 20 } = req.query;
  const query = {};
  
  // Employees can only see their own leaves
  if (req.user.role === 'Employee') {
    const emp = await Employee.findOne({ user: req.user._id });
    if (emp) query.employee = emp._id;
  } else if (employeeId) {
    query.employee = employeeId;
  }
  if (status) query.status = status;
  if (type) query.type = type;

  const data = await Leave.find(query)
    .populate({ path: 'employee', populate: { path: 'user', select: 'name avatar' } })
    .populate('approvedBy', 'name')
    .sort({ createdAt: -1 })
    .skip((+page - 1) * +limit).limit(+limit);
  const total = await Leave.countDocuments(query);
  res.json({ success: true, data, pagination: { total, page: +page, limit: +limit } });
});

// POST /api/leaves — apply for leave
router.post('/', protect, async (req, res) => {
  const employee = await Employee.findOne({ user: req.user._id });
  if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found' });

  const { type, startDate, endDate, reason, isHalfDay, halfDaySession } = req.body;
  const leave = await Leave.create({ employee: employee._id, type, startDate, endDate, reason, isHalfDay, halfDaySession });

  // Notify HR
  const hrUsers = await require('../models/User').find({ role: 'HR Manager' });
  await Notification.insertMany(hrUsers.map(hr => ({
    user: hr._id, title: 'New Leave Request',
    message: `${req.user.name} has applied for ${type} from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`,
    type: 'leave', link: `/hr/leaves/${leave._id}`,
  })));

  res.status(201).json({ success: true, message: 'Leave applied successfully', data: leave });
});

// PUT /api/leaves/:id/approve
router.put('/:id/approve', protect, hrAccess, async (req, res) => {
  const leave = await Leave.findByIdAndUpdate(req.params.id,
    { status: 'Approved', approvedBy: req.user._id, approvedAt: new Date() },
    { new: true }
  ).populate({ path: 'employee', populate: { path: 'user' } });

  if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });

  // Notify employee
  await Notification.create({
    user: leave.employee.user._id, title: 'Leave Approved',
    message: `Your ${leave.type} from ${leave.startDate.toLocaleDateString()} has been approved.`,
    type: 'success',
  });

  res.json({ success: true, message: 'Leave approved', data: leave });
});

// PUT /api/leaves/:id/reject
router.put('/:id/reject', protect, hrAccess, async (req, res) => {
  const { rejectionReason } = req.body;
  const leave = await Leave.findByIdAndUpdate(req.params.id,
    { status: 'Rejected', approvedBy: req.user._id, approvedAt: new Date(), rejectionReason },
    { new: true }
  ).populate({ path: 'employee', populate: { path: 'user' } });

  if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });

  await Notification.create({
    user: leave.employee.user._id, title: 'Leave Rejected',
    message: `Your ${leave.type} request has been rejected. Reason: ${rejectionReason}`,
    type: 'error',
  });

  res.json({ success: true, message: 'Leave rejected', data: leave });
});

// PUT /api/leaves/:id/cancel
router.put('/:id/cancel', protect, async (req, res) => {
  const leave = await Leave.findById(req.params.id);
  if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });
  if (leave.status !== 'Pending') return res.status(400).json({ success: false, message: 'Only pending leaves can be cancelled' });
  const updated = await Leave.findByIdAndUpdate(req.params.id, { status: 'Cancelled' }, { new: true });
  res.json({ success: true, data: updated });
});

module.exports = router;
