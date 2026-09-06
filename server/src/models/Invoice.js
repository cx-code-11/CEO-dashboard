const mongoose = require('mongoose');

const invoiceLineItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  hsnSac: { type: String },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'Nos' },
  rate: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  taxRate: { type: Number, default: 18 },
  amount: { type: Number },
  taxAmount: { type: Number },
  total: { type: Number },
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoiceNo: { type: String, unique: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  quotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  title: { type: String, required: true },
  invoiceDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  items: [invoiceLineItemSchema],
  subtotal: { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  gstType: { type: String, enum: ['CGST/SGST', 'IGST'], default: 'IGST' },
  status: { 
    type: String,
    enum: ['Draft', 'Sent', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled', 'Disputed'],
    default: 'Draft'
  },
  isRecurring: { type: Boolean, default: false },
  recurringInterval: { type: String, enum: ['Monthly', 'Quarterly', 'Yearly'] },
  nextDueDate: { type: Date },
  paymentTerms: { type: String, default: 'Net 30' },
  terms: { type: String },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pdfUrl: { type: String },
  sentAt: { type: Date },
  payments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }],
  makeWebhookSent: { type: Boolean, default: false },
}, { timestamps: true });

invoiceSchema.pre('validate', async function(next) {
  if (!this.invoiceNo) {
    const count = await mongoose.model('Invoice').countDocuments();
    const year = new Date().getFullYear();
    this.invoiceNo = `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

invoiceSchema.pre('save', function(next) {
  this.items.forEach(item => {
    item.amount = item.quantity * item.rate * (1 - item.discount / 100);
    item.taxAmount = (item.amount * item.taxRate) / 100;
    item.total = item.amount + item.taxAmount;
  });
  this.subtotal = this.items.reduce((s, i) => s + (i.amount || 0), 0);
  this.totalTax = this.items.reduce((s, i) => s + (i.taxAmount || 0), 0);
  if (this.gstType === 'CGST/SGST') {
    this.cgst = this.totalTax / 2;
    this.sgst = this.totalTax / 2;
    this.igst = 0;
  } else {
    this.igst = this.totalTax;
    this.cgst = 0;
    this.sgst = 0;
  }
  this.total = this.subtotal + this.totalTax;
  this.balanceDue = this.total - this.paidAmount;
  if (this.balanceDue <= 0) this.status = 'Paid';
  else if (this.paidAmount > 0) this.status = 'Partially Paid';
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
