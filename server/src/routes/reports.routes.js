const express = require('express');
const router = express.Router();
const { protect, managementAccess } = require('../middleware/auth');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const dayjs = require('dayjs');

router.get('/finance', protect, managementAccess, async (req, res) => {
  const { startDate, endDate, type = 'monthly' } = req.query;
  const start = startDate ? new Date(startDate) : dayjs().startOf('year').toDate();
  const end = endDate ? new Date(endDate) : dayjs().endOf('year').toDate();

  const dateFormat = type === 'monthly' ? '%Y-%m' : '%Y-%m-%d';

  const income = await Income.aggregate([
    { $match: { date: { $gte: start, $lte: end } } },
    { $group: { _id: { $dateToString: { format: dateFormat, date: '$date' } }, total: { $sum: '$amount' } } },
    { $sort: { _id: 1 } }
  ]);

  const expenses = await Expense.aggregate([
    { $match: { date: { $gte: start, $lte: end }, status: { $ne: 'Rejected' } } },
    { $group: { _id: { $dateToString: { format: dateFormat, date: '$date' } }, total: { $sum: '$amount' } } },
    { $sort: { _id: 1 } }
  ]);
  
  // Combine into a single array for charts
  const dates = [...new Set([...income.map(i => i._id), ...expenses.map(e => e._id)])].sort();
  const chartData = dates.map(date => {
    const inc = income.find(i => i._id === date)?.total || 0;
    const exp = expenses.find(e => e._id === date)?.total || 0;
    return { date, income: inc, expense: exp, profit: inc - exp };
  });

  res.json({ success: true, data: chartData });
});

router.get('/client-revenue', protect, managementAccess, async (req, res) => {
  const clients = await Client.find({ totalRevenue: { $gt: 0 } })
    .select('name companyName totalRevenue')
    .sort({ totalRevenue: -1 })
    .limit(10);
  res.json({ success: true, data: clients });
});

router.get('/expense-categories', protect, managementAccess, async (req, res) => {
  const { startDate, endDate } = req.query;
  const query = { status: { $ne: 'Rejected' } };
  if (startDate && endDate) query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };

  const categories = await Expense.aggregate([
    { $match: query },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } }
  ]);
  res.json({ success: true, data: categories });
});

module.exports = router;
