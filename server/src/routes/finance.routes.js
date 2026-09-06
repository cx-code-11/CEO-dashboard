const express = require('express');
const router = express.Router();
const { protect, financeAccess } = require('../middleware/auth');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const upload = require('../middleware/upload');
const csv = require('csv-parser');
const fs = require('fs');

// GET /api/finance
// Returns an aggregated list of Income and Expense transactions for the ledger
router.get('/', protect, financeAccess, async (req, res) => {
  try {
    const incomes = await Income.find().populate('recordedBy', 'name').sort({ date: -1 });
    const expenses = await Expense.find().populate('recordedBy', 'name').sort({ date: -1 });

    const transactions = [
      ...incomes.map(i => ({
        ...i.toObject(),
        type: 'Income'
      })),
      ...expenses.map(e => ({
        ...e.toObject(),
        type: 'Expense'
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ success: true, data: transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching finance data' });
  }
});

// POST /api/finance/import-statement
router.post('/import-statement', protect, financeAccess, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const results = [];
  let incomeCount = 0;
  let expenseCount = 0;
  let totalIncome = 0;
  let totalExpense = 0;

  try {
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        
        for (const row of results) {
          // Normalizing keys to lowercase to handle different header formats
          const keys = Object.keys(row);
          const getVal = (possibleKeys) => {
            const key = keys.find(k => possibleKeys.some(pk => k.toLowerCase().includes(pk)));
            return key ? row[key] : null;
          };

          const dateStr = getVal(['date']);
          const desc = getVal(['description', 'particulars', 'narration']);
          let amount = 0;
          let type = ''; // Income or Expense

          // Check if there are separate Debit/Credit columns
          const creditStr = getVal(['credit', 'deposit']);
          const debitStr = getVal(['debit', 'withdrawal']);
          
          if (creditStr && parseFloat(creditStr) > 0) {
            amount = parseFloat(creditStr);
            type = 'Income';
          } else if (debitStr && parseFloat(debitStr) > 0) {
            amount = parseFloat(debitStr);
            type = 'Expense';
          } else {
            // Check if there is a single amount column with positive/negative or a Type column
            const amtStr = getVal(['amount']);
            const typeStr = getVal(['type']);
            
            if (amtStr) {
              const val = parseFloat(amtStr);
              if (typeStr && typeStr.toLowerCase().includes('cr')) {
                type = 'Income';
                amount = Math.abs(val);
              } else if (typeStr && typeStr.toLowerCase().includes('dr')) {
                type = 'Expense';
                amount = Math.abs(val);
              } else if (val > 0) {
                type = 'Income';
                amount = val;
              } else if (val < 0) {
                type = 'Expense';
                amount = Math.abs(val);
              }
            }
          }

          if (dateStr && desc && amount > 0 && type) {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              if (type === 'Income') {
                await Income.create({
                  title: desc,
                  amount,
                  date,
                  category: 'Bank Import',
                  paymentMode: 'Bank Transfer',
                  recordedBy: req.user._id
                });
                incomeCount++;
                totalIncome += amount;
              } else {
                await Expense.create({
                  title: desc,
                  amount,
                  date,
                  category: 'Bank Import',
                  paymentMode: 'Bank Transfer',
                  recordedBy: req.user._id,
                  status: 'Approved' // auto approve imported
                });
                expenseCount++;
                totalExpense += amount;
              }
            }
          }
        }
        
        res.json({
          success: true,
          message: 'Statement imported successfully',
          data: { incomeCount, expenseCount, totalIncome, totalExpense }
        });
      });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error processing CSV' });
  }
});

module.exports = router;
