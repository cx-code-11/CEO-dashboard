const express = require('express');
const router = express.Router();
const Quotation = require('../models/Quotation');
const Invoice = require('../models/Invoice');
const Lead = require('../models/Lead');
const Client = require('../models/Client');

// Middleware to verify Make.com webhook secret
const verifyMakeSecret = (req, res, next) => {
  const secret = req.headers['x-make-secret'];
  if (!secret || secret !== process.env.MAKE_WEBHOOK_SECRET) {
    return res.status(401).json({ success: false, message: 'Unauthorized webhook access' });
  }
  next();
};

// Webhook to get new leads for Make.com to process (e.g., send welcome email)
router.get('/new-leads', verifyMakeSecret, async (req, res) => {
  // Logic would depend on how Make polls, or we can push to Make.
  // This endpoint allows Make to poll for recent leads.
  const leads = await Lead.find({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } });
  res.json({ success: true, data: leads });
});

// Endpoint that Make can call to update a lead status
router.post('/update-lead', verifyMakeSecret, async (req, res) => {
  const { leadId, status, notes } = req.body;
  if (!leadId) return res.status(400).json({ success: false, message: 'leadId required' });
  
  const lead = await Lead.findByIdAndUpdate(leadId, { status }, { new: true });
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
  
  if (notes) {
    lead.followUps.push({ note: notes, type: 'Other', createdBy: null });
    await lead.save();
  }
  
  res.json({ success: true, data: lead });
});

// Endpoint for Make to sync client data from another system (e.g., Shopify, CRM)
router.post('/sync-client', verifyMakeSecret, async (req, res) => {
  const { email, name, phone, companyName } = req.body;
  if (!email || !name) return res.status(400).json({ success: false, message: 'email and name required' });
  
  let client = await Client.findOne({ email });
  if (client) {
    client = await Client.findByIdAndUpdate(client._id, { name, phone, companyName }, { new: true });
  } else {
    // Find CEO to assign
    const ceo = await require('../models/User').findOne({ role: 'CEO' });
    client = await Client.create({ name, email, phone, companyName, assignedTo: ceo?._id });
  }
  
  res.json({ success: true, data: client });
});

module.exports = router;
