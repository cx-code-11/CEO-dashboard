const express = require('express');
const router = express.Router();
const { protect, managementAccess } = require('../middleware/auth');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Invoice = require('../models/Invoice');
const Project = require('../models/Project');
const Employee = require('../models/Employee');
const dayjs = require('dayjs');

router.get('/kpi', protect, managementAccess, async (req, res) => {
  const currentMonthStart = dayjs().startOf('month').toDate();
  const lastMonthStart = dayjs().subtract(1, 'month').startOf('month').toDate();
  const lastMonthEnd = dayjs().subtract(1, 'month').endOf('month').toDate();

  // Income
  const currentIncomeAgg = await Income.aggregate([{ $match: { date: { $gte: currentMonthStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
  const lastIncomeAgg = await Income.aggregate([{ $match: { date: { $gte: lastMonthStart, $lte: lastMonthEnd } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
  const currentIncome = currentIncomeAgg[0]?.total || 0;
  const lastIncome = lastIncomeAgg[0]?.total || 0;
  
  // Expenses
  const currentExpenseAgg = await Expense.aggregate([{ $match: { date: { $gte: currentMonthStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
  const lastExpenseAgg = await Expense.aggregate([{ $match: { date: { $gte: lastMonthStart, $lte: lastMonthEnd } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
  const currentExpense = currentExpenseAgg[0]?.total || 0;
  const lastExpense = lastExpenseAgg[0]?.total || 0;

  // Receivables (Unpaid Invoices)
  const receivablesAgg = await Invoice.aggregate([{ $match: { status: { $in: ['Sent', 'Partially Paid', 'Overdue'] } } }, { $group: { _id: null, total: { $sum: '$balanceDue' } } }]);
  const totalReceivables = receivablesAgg[0]?.total || 0;

  // Active Projects
  const activeProjects = await Project.countDocuments({ status: { $in: ['Planning', 'In Progress'] } });
  
  // Employee count
  const employeeCount = await Employee.countDocuments({ isActive: true });

  // Growth calculations
  const calculateGrowth = (current, previous) => previous === 0 ? 100 : Math.round(((current - previous) / previous) * 100);

  res.json({
    success: true,
    data: {
      revenue: { current: currentIncome, growth: calculateGrowth(currentIncome, lastIncome) },
      expenses: { current: currentExpense, growth: calculateGrowth(currentExpense, lastExpense) },
      profit: { current: currentIncome - currentExpense, growth: calculateGrowth(currentIncome - currentExpense, lastIncome - lastExpense) },
      receivables: totalReceivables,
      activeProjects,
      employeeCount
    }
  });
});

module.exports = router;
