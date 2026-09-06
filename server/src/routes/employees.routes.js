const express = require('express');
const router = express.Router();
const { protect, hrAccess, managementAccess } = require('../middleware/auth');
const Employee = require('../models/Employee');
const User = require('../models/User');
const upload = require('../middleware/upload');
const auditLog = require('../middleware/auditLogger');

// GET /api/employees
router.get('/', protect, managementAccess, async (req, res) => {
  const { department, search, employmentType, isActive = 'true', page = 1, limit = 20 } = req.query;
  const query = {};
  if (department) query.department = department;
  if (employmentType) query.employmentType = employmentType;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  let employees = Employee.find(query).populate('user', 'name email avatar role').sort({ createdAt: -1 });
  if (search) {
    const users = await User.find({ $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }).select('_id');
    const userIds = users.map(u => u._id);
    query.$or = [{ user: { $in: userIds } }, { empId: { $regex: search, $options: 'i' } }, { designation: { $regex: search, $options: 'i' } }];
    employees = Employee.find(query).populate('user', 'name email avatar role').sort({ createdAt: -1 });
  }
  const total = await Employee.countDocuments(query);
  const data = await employees.skip((+page - 1) * +limit).limit(+limit);
  res.json({ success: true, data, pagination: { total, page: +page, limit: +limit, pages: Math.ceil(total / +limit) } });
});

// GET /api/employees/departments
router.get('/departments', protect, async (req, res) => {
  const departments = await Employee.distinct('department');
  res.json({ success: true, data: departments });
});

// GET /api/employees/:id
router.get('/:id', protect, async (req, res) => {
  const employee = await Employee.findById(req.params.id).populate('user', 'name email avatar role phone').populate('managerId', 'name email');
  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
  res.json({ success: true, data: employee });
});

// POST /api/employees
router.post('/', protect, hrAccess, auditLog('CREATE', 'Employee'), async (req, res) => {
  const { userId, designation, department, joiningDate, employmentType, salary, bankDetails, address, emergencyContact } = req.body;
  
  const userExists = await Employee.findOne({ user: userId });
  if (userExists) return res.status(409).json({ success: false, message: 'Employee profile already exists for this user' });

  const employee = await Employee.create({ user: userId, designation, department, joiningDate, employmentType, salary, bankDetails, address, emergencyContact });
  
  // Update user department
  await User.findByIdAndUpdate(userId, { department });
  
  const populated = await Employee.findById(employee._id).populate('user', 'name email avatar role');
  res.status(201).json({ success: true, message: 'Employee created', data: populated });
});

// PUT /api/employees/:id
router.put('/:id', protect, hrAccess, auditLog('UPDATE', 'Employee'), async (req, res) => {
  const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('user', 'name email avatar role');
  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
  res.json({ success: true, message: 'Employee updated', data: employee });
});

// DELETE /api/employees/:id
router.delete('/:id', protect, hrAccess, auditLog('DELETE', 'Employee'), async (req, res) => {
  const employee = await Employee.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
  res.json({ success: true, message: 'Employee deactivated' });
});

// POST /api/employees/:id/documents
router.post('/:id/documents', protect, hrAccess, upload.single('document'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const { type, name } = req.body;
  const fileUrl = `/uploads/documents/${req.file.filename}`;
  const employee = await Employee.findByIdAndUpdate(
    req.params.id,
    { $push: { documents: { type, name, url: fileUrl } } },
    { new: true }
  );
  res.json({ success: true, data: employee });
});

module.exports = router;
