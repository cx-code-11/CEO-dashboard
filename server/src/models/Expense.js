const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true, default: Date.now },
  category: {
    type: String,
    enum: [
      'Salary', 'Rent', 'Marketing', 'Software Subscription', 'Travel', 
      'Utilities', 'Equipment Purchase', 'Office Supplies', 'Maintenance',
      'Professional Services', 'Insurance', 'Taxes', 'Loan Repayment', 
      'Advertising', 'Food & Entertainment', 'Training', 'Other'
    ],
    required: true
  },
  vendor: { type: String },
  paymentMode: { type: String, enum: ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Credit Card', 'Other'] },
  transactionId: { type: String },
  description: { type: String },
  isRecurring: { type: Boolean, default: false },
  recurringInterval: { type: String, enum: ['Monthly', 'Quarterly', 'Yearly'] },
  taxable: { type: Boolean, default: false },
  gstAmount: { type: Number, default: 0 },
  billAttachment: { type: String },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Paid'], default: 'Approved' },
  fiscalYear: { type: String },
  isHistorical: { type: Boolean, default: false },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

expenseSchema.pre('save', function(next) {
  const d = new Date(this.date);
  const month = d.getMonth();
  const year = d.getFullYear();
  this.fiscalYear = month >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  next();
});

module.exports = mongoose.model('Expense', expenseSchema);
