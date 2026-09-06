const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  hsnSac: { type: String },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, default: 'Nos' },
  rate: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0 },
  discountType: { type: String, enum: ['%', 'fixed'], default: '%' },
  taxRate: { type: Number, default: 18 }, // GST %
  amount: { type: Number },
  taxAmount: { type: Number },
  total: { type: Number },
}, { _id: false });

const quotationSchema = new mongoose.Schema({
  quotationNo: { type: String, unique: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  title: { type: String, required: true },
  items: [lineItemSchema],
  subtotal: { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  validUntil: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['Draft', 'Sent', 'Viewed', 'Approved', 'Rejected', 'Expired', 'Converted'],
    default: 'Draft'
  },
  terms: { type: String },
  notes: { type: String },
  deliveryTime: { type: String },
  paymentTerms: { type: String, default: 'Net 30' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvalDate: { type: Date },
  rejectionReason: { type: String },
  convertedToInvoice: { type: Boolean, default: false },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  pdfUrl: { type: String },
  sentAt: { type: Date },
  viewedAt: { type: Date },
  // Make.com automation flag
  makeWebhookSent: { type: Boolean, default: false },
}, { timestamps: true });

quotationSchema.pre('validate', async function(next) {
  if (!this.quotationNo) {
    const count = await mongoose.model('Quotation').countDocuments();
    const year = new Date().getFullYear();
    this.quotationNo = `QT-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

quotationSchema.pre('save', function(next) {
  this.items.forEach(item => {
    const discountAmount = item.discountType === '%'
      ? (item.quantity * item.rate * item.discount) / 100
      : item.discount;
    item.amount = (item.quantity * item.rate) - discountAmount;
    item.taxAmount = (item.amount * item.taxRate) / 100;
    item.total = item.amount + item.taxAmount;
  });
  this.subtotal = this.items.reduce((sum, i) => sum + (i.amount || 0), 0);
  this.totalDiscount = this.items.reduce((sum, i) => sum + ((i.quantity * i.rate) - (i.amount || 0)), 0);
  this.totalTax = this.items.reduce((sum, i) => sum + (i.taxAmount || 0), 0);
  this.total = this.subtotal + this.totalTax;
  // For inter-state: IGST = totalTax; For intra-state: CGST = SGST = totalTax/2
  this.igst = this.totalTax; // Default to IGST (can be overridden)
  next();
});

module.exports = mongoose.model('Quotation', quotationSchema);
