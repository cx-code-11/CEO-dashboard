const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  title: { type: String, required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  contactPerson: { type: String, required: true },
  email: { type: String, lowercase: true },
  phone: { type: String },
  company: { type: String },
  source: { 
    type: String, 
    enum: ['Website', 'Referral', 'Cold Call', 'Social Media', 'Email', 'Exhibition', 'LinkedIn', 'Other'],
    default: 'Other'
  },
  status: { 
    type: String, 
    enum: ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost', 'On Hold'],
    default: 'New'
  },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  estimatedValue: { type: Number, default: 0 },
  probability: { type: Number, min: 0, max: 100, default: 10 },
  expectedCloseDate: { type: Date },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String },
  lostReason: { type: String },
  followUpDate: { type: Date },
  followUps: [{
    note: String,
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ['Call', 'Email', 'Meeting', 'Demo', 'Other'] },
    nextFollowUp: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
  tags: [String],
  convertedToClient: { type: Boolean, default: false },
  convertedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
