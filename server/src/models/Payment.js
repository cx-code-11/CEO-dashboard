const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  amount: { type: Number, required: true, min: 0.01 },
  date: { type: Date, default: Date.now, required: true },
  mode: { 
    type: String, 
    enum: ['Bank Transfer', 'NEFT', 'RTGS', 'Cheque', 'Cash', 'UPI', 'Credit Card', 'Debit Card', 'PayPal', 'Stripe', 'Other'],
    required: true
  },
  transactionId: { type: String },
  reference: { type: String },
  bankName: { type: String },
  notes: { type: String },
  receiptUrl: { type: String },
  attachment: { type: String },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
