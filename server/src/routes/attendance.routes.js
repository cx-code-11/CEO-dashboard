const express = require('express');
const router = express.Router();
const { protect, hrAccess } = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const dayjs = require('dayjs');

// GET /api/attendance — with filters
router.get('/', protect, hrAccess, async (req, res) => {
  const { employeeId, month, year, status, page = 1, limit = 50 } = req.query;
  const query = {};
  if (employeeId) query.employee = employeeId;
  if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    query.date = { $gte: start, $lte: end };
  }
  if (status) query.status = status;
  const data = await Attendance.find(query)
    .populate({ path: 'employee', populate: { path: 'user', select: 'name avatar' } })
    .sort({ date: -1 })
    .skip((+page - 1) * +limit)
    .limit(+limit);
  const total = await Attendance.countDocuments(query);
  res.json({ success: true, data, pagination: { total, page: +page, limit: +limit } });
});

// GET /api/attendance/summary — monthly summary for all employees
router.get('/summary', protect, hrAccess, async (req, res) => {
  const { month = dayjs().month() + 1, year = dayjs().year() } = req.query;
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  const summary = await Attendance.aggregate([
    { $match: { date: { $gte: start, $lte: end } } },
    { $group: {
      _id: '$employee',
      present: { $sum: { $cond: [{ $in: ['$status', ['Present', 'Late', 'WFH']] }, 1, 0] } },
      absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
      late: { $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] } },
      halfDay: { $sum: { $cond: [{ $eq: ['$status', 'Half Day'] }, 1, 0] } },
      wfh: { $sum: { $cond: [{ $eq: ['$status', 'WFH'] }, 1, 0] } },
      totalHours: { $sum: '$hoursWorked' },
      overtimeHours: { $sum: '$overtimeHours' },
    }},
    { $lookup: { from: 'employees', localField: '_id', foreignField: '_id', as: 'employee' } },
    { $unwind: '$employee' },
    { $lookup: { from: 'users', localField: 'employee.user', foreignField: '_id', as: 'user' } },
    { $unwind: { path: '$user', preserveNullAndEmpty: true } },
    { $project: { 'user.password': 0 } }
  ]);

  res.json({ success: true, data: summary });
});

// GET /api/attendance/today
router.get('/today', protect, async (req, res) => {
  const today = dayjs().startOf('day').toDate();
  const end = dayjs().endOf('day').toDate();
  const records = await Attendance.find({ date: { $gte: today, $lte: end } })
    .populate({ path: 'employee', populate: { path: 'user', select: 'name avatar department' } });
  res.json({ success: true, data: records });
});

// GET /api/attendance/employee/:empId/calendar
router.get('/employee/:empId/calendar', protect, async (req, res) => {
  const { month = dayjs().month() + 1, year = dayjs().year() } = req.query;
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);
  const records = await Attendance.find({ employee: req.params.empId, date: { $gte: start, $lte: end } }).sort({ date: 1 });
  res.json({ success: true, data: records });
});

// POST /api/attendance — mark single attendance
router.post('/', protect, hrAccess, async (req, res) => {
  const { employee, date, checkIn, checkOut, status, notes } = req.body;
  const existing = await Attendance.findOne({ employee, date: dayjs(date).startOf('day').toDate() });
  if (existing) {
    const updated = await Attendance.findByIdAndUpdate(existing._id, { checkIn, checkOut, status, notes, markedBy: req.user._id }, { new: true });
    return res.json({ success: true, message: 'Attendance updated', data: updated });
  }
  const attendance = await Attendance.create({ employee, date, checkIn, checkOut, status, notes, markedBy: req.user._id });
  res.status(201).json({ success: true, message: 'Attendance marked', data: attendance });
});

// POST /api/attendance/bulk — bulk mark attendance
router.post('/bulk', protect, hrAccess, async (req, res) => {
  const { records } = req.body; // array of { employee, date, status, checkIn, checkOut }
  const results = await Promise.allSettled(records.map(async (r) => {
    const existing = await Attendance.findOne({ employee: r.employee, date: new Date(r.date) });
    if (existing) return Attendance.findByIdAndUpdate(existing._id, r, { new: true });
    return Attendance.create({ ...r, markedBy: req.user._id });
  }));
  const saved = results.filter(r => r.status === 'fulfilled').map(r => r.value);
  res.json({ success: true, message: `${saved.length} records saved`, data: saved });
});

// POST /api/attendance/checkin — employee self check-in
router.post('/checkin', protect, async (req, res) => {
  const employee = await Employee.findOne({ user: req.user._id });
  if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found' });

  const today = dayjs().startOf('day').toDate();
  const existing = await Attendance.findOne({ employee: employee._id, date: today });
  if (existing?.checkIn) return res.status(400).json({ success: false, message: 'Already checked in today' });

  const attendance = existing
    ? await Attendance.findByIdAndUpdate(existing._id, { checkIn: new Date() }, { new: true })
    : await Attendance.create({ employee: employee._id, date: today, checkIn: new Date() });
  res.json({ success: true, message: 'Checked in successfully', data: attendance });
});

// POST /api/attendance/checkout — employee self check-out
router.post('/checkout', protect, async (req, res) => {
  const employee = await Employee.findOne({ user: req.user._id });
  if (!employee) return res.status(404).json({ success: false, message: 'Employee profile not found' });
  
  const today = dayjs().startOf('day').toDate();
  const attendance = await Attendance.findOne({ employee: employee._id, date: today });
  if (!attendance?.checkIn) return res.status(400).json({ success: false, message: 'Not checked in today' });
  if (attendance?.checkOut) return res.status(400).json({ success: false, message: 'Already checked out today' });

  const updated = await Attendance.findByIdAndUpdate(attendance._id, { checkOut: new Date() }, { new: true });
  res.json({ success: true, message: 'Checked out successfully', data: updated });
});

module.exports = router;
