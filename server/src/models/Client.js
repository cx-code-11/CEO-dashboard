const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  companyName: { type: String, trim: true },
  email: { type: String, lowercase: true, trim: true },
  phone: { type: String },
  alternatePhone: { type: String },
  gstin: { type: String, uppercase: true },
  pan: { type: String, uppercase: true },
  website: { type: String },
  industry: { type: String },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' },
  },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' },
  },
  currency: { type: String, default: 'INR' },
  paymentTerms: { type: String, default: 'Net 30' },
  creditLimit: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive', 'Prospect', 'Churned'], default: 'Active' },
  source: { type: String, enum: ['Referral', 'Website', 'Cold Call', 'Social Media', 'Exhibition', 'Other'] },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totalRevenue: { type: Number, default: 0 },
  outstandingAmount: { type: Number, default: 0 },
  notes: { type: String },
  tags: [String],
  avatar: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);
