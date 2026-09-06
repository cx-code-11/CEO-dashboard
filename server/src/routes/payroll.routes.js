const express = require('express');
const router = express.Router();
const { protect, hrAccess, financeAccess } = require('../middleware/auth');
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Expense = require('../models/Expense');

// GET /api/payroll
router.get('/', protect, hrAccess, async (req, res) => {
  const { month, year, status, page = 1, limit = 20 } = req.query;
  const query = {};
  if (month) query.month = +month;
  if (year) query.year = +year;
  if (status) query.status = status;
  const data = await Payroll.find(query)
    .populate({ path: 'employee', populate: { path: 'user', select: 'name avatar' } })
    .sort({ year: -1, month: -1 })
    .skip((+page - 1) * +limit).limit(+limit);
  const total = await Payroll.countDocuments(query);
  res.json({ success: true, data, pagination: { total, page: +page, limit: +limit } });
});

// GET /api/payroll/employee/:empId
router.get('/employee/:empId', protect, async (req, res) => {
  const payrolls = await Payroll.find({ employee: req.params.empId }).sort({ year: -1, month: -1 });
  res.json({ success: true, data: payrolls });
});

// POST /api/payroll/generate — generate payroll for month
router.post('/generate', protect, hrAccess, async (req, res) => {
  const { month, year, employeeIds } = req.body;
  
  // Get all active employees or specific ones
  const query = { isActive: true };
  if (employeeIds?.length) query._id = { $in: employeeIds };
  const employees = await Employee.find(query).populate('user', 'name');

  const workingDays = new Date(year, month, 0).getDate() - [0, 6].filter(d => {
    let count = 0;
    for (let day = 1; day <= new Date(year, month, 0).getDate(); day++) {
      if (new Date(year, month - 1, day).getDay() === d) count++;
    }
    return count > 0;
  }).length; // Approximate working days

  const results = [];
  for (const emp of employees) {
    const existing = await Payroll.findOne({ employee: emp._id, month, year });
    if (existing) { results.push({ empId: emp.empId, status: 'skipped', reason: 'Already generated' }); continue; }

    // Get attendance for the month
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    const attendance = await Attendance.find({ employee: emp._id, date: { $gte: start, $lte: end } });
    const presentDays = attendance.filter(a => ['Present', 'Late', 'WFH'].includes(a.status)).length;
    const lopDays = Math.max(0, workingDays - presentDays);

    const basicSalary = emp.salary?.basic || 0;
    const lopDeduction = lopDays > 0 ? (basicSalary / workingDays) * lopDays : 0;

    const payroll = await Payroll.create({
      employee: emp._id,
      month, year,
      workingDays,
      presentDays,
      lopDays,
      earnings: {
        basicSalary,
        hra: emp.salary?.hra || 0,
        allowances: emp.salary?.allowances || 0,
      },
      deductions: {
        pf: Math.round(basicSalary * 0.12),
        esi: basicSalary <= 21000 ? Math.round((basicSalary + (emp.salary?.hra || 0)) * 0.0075) : 0,
        professionalTax: 200,
        lopDeduction: Math.round(lopDeduction),
        otherDeductions: emp.salary?.deductions || 0,
      },
      status: 'Generated',
      generatedBy: req.user._id,
    });
    results.push({ empId: emp.empId, name: emp.user?.name, status: 'generated', payrollId: payroll._id });

    // Create salary expense entry
    await Expense.create({
      title: `Salary - ${emp.user?.name} - ${new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`,
      amount: payroll.netSalary,
      date: new Date(year, month - 1, 28),
      category: 'Salary',
      employee: emp._id,
      recordedBy: req.user._id,
    });
  }

  res.json({ success: true, message: `Payroll generated for ${results.filter(r => r.status === 'generated').length} employees`, data: results });
});

// PUT /api/payroll/:id
router.put('/:id', protect, hrAccess, async (req, res) => {
  const payroll = await Payroll.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found' });
  res.json({ success: true, data: payroll });
});

// PUT /api/payroll/:id/mark-paid
router.put('/:id/mark-paid', protect, financeAccess, async (req, res) => {
  const { paymentDate, paymentMode, transactionId } = req.body;
  const payroll = await Payroll.findByIdAndUpdate(req.params.id,
    { status: 'Paid', paymentDate, paymentMode, transactionId },
    { new: true }
  );
  if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found' });
  res.json({ success: true, message: 'Payroll marked as paid', data: payroll });
});

module.exports = router;
