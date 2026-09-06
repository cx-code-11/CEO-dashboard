const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true, default: Date.now },
  category: { 
    type: String,
    enum: ['Service Revenue', 'Product Sales', 'Consulting', 'Subscription', 'Retainer', 'Royalty', 'Investment Return', 'Grant', 'Other'],
    required: true
  },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  paymentMode: { type: String, enum: ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Other'] },
  transactionId: { type: String },
  description: { type: String },
  isRecurring: { type: Boolean, default: false },
  taxable: { type: Boolean, default: true },
  gstAmount: { type: Number, default: 0 },
  netAmount: { type: Number },
  fiscalYear: { type: String },
  attachments: [String],
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isHistorical: { type: Boolean, default: false }, // For historical data import
}, { timestamps: true });

incomeSchema.pre('save', function(next) {
  this.netAmount = this.amount - this.gstAmount;
  const d = new Date(this.date);
  const month = d.getMonth();
  const year = d.getFullYear();
  this.fiscalYear = month >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  next();
});

module.exports = mongoose.model('Income', incomeSchema);
