const express = require('express');
const router = express.Router();
const { protect, salesAccess, ceoOnly } = require('../middleware/auth');
const Quotation = require('../models/Quotation');
const Invoice = require('../models/Invoice');
const auditLog = require('../middleware/auditLogger');
const PDFDocument = require('pdfkit');

router.get('/', protect, salesAccess, async (req, res) => {
  const { status, client, search, page = 1, limit = 20 } = req.query;
  const query = {};
  if (status) query.status = status;
  if (client) query.client = client;
  if (search) query.$or = [{ quotationNo: { $regex: search, $options: 'i' } }, { title: { $regex: search, $options: 'i' } }];
  const data = await Quotation.find(query).populate('client', 'name companyName email').populate('createdBy', 'name').sort({ createdAt: -1 }).skip((+page - 1) * +limit).limit(+limit);
  const total = await Quotation.countDocuments(query);
  res.json({ success: true, data, pagination: { total, page: +page, limit: +limit } });
});

router.get('/:id', protect, salesAccess, async (req, res) => {
  const q = await Quotation.findById(req.params.id).populate('client').populate('createdBy', 'name email').populate('approvedBy', 'name');
  if (!q) return res.status(404).json({ success: false, message: 'Quotation not found' });
  res.json({ success: true, data: q });
});

router.post('/', protect, salesAccess, auditLog('CREATE', 'Quotation'), async (req, res) => {
  const quotation = await Quotation.create({ ...req.body, createdBy: req.user._id });
  const populated = await Quotation.findById(quotation._id).populate('client', 'name companyName email');
  res.status(201).json({ success: true, message: 'Quotation created', data: populated });
});

router.put('/:id', protect, salesAccess, auditLog('UPDATE', 'Quotation'), async (req, res) => {
  const q = await Quotation.findById(req.params.id);
  if (!q) return res.status(404).json({ success: false, message: 'Quotation not found' });
  if (['Approved', 'Converted'].includes(q.status)) return res.status(400).json({ success: false, message: 'Cannot edit an approved/converted quotation' });
  const updated = await Quotation.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('client');
  res.json({ success: true, data: updated });
});

// PUT /api/quotations/:id/approve
router.put('/:id/approve', protect, async (req, res) => {
  if (!['CEO', 'Finance Manager'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Not authorized' });
  const q = await Quotation.findByIdAndUpdate(req.params.id,
    { status: 'Approved', approvedBy: req.user._id, approvalDate: new Date() },
    { new: true }
  ).populate('client', 'name companyName email');
  if (!q) return res.status(404).json({ success: false, message: 'Quotation not found' });
  res.json({ success: true, message: 'Quotation approved', data: q });
});

// PUT /api/quotations/:id/reject
router.put('/:id/reject', protect, async (req, res) => {
  if (!['CEO', 'Finance Manager'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Not authorized' });
  const q = await Quotation.findByIdAndUpdate(req.params.id,
    { status: 'Rejected', approvedBy: req.user._id, rejectionReason: req.body.reason },
    { new: true }
  );
  res.json({ success: true, data: q });
});

// POST /api/quotations/:id/convert — convert to invoice
router.post('/:id/convert', protect, salesAccess, async (req, res) => {
  const q = await Quotation.findById(req.params.id).populate('client');
  if (!q) return res.status(404).json({ success: false, message: 'Quotation not found' });
  if (q.convertedToInvoice) return res.status(400).json({ success: false, message: 'Already converted to invoice' });
  if (q.status !== 'Approved') return res.status(400).json({ success: false, message: 'Quotation must be approved first' });

  const dueDate = req.body.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const invoice = await Invoice.create({
    client: q.client._id,
    quotation: q._id,
    title: q.title,
    items: q.items,
    dueDate,
    paymentTerms: q.paymentTerms,
    terms: q.terms,
    notes: q.notes,
    gstType: req.body.gstType || 'IGST',
    createdBy: req.user._id,
  });

  await Quotation.findByIdAndUpdate(q._id, { status: 'Converted', convertedToInvoice: true, invoiceId: invoice._id });
  res.status(201).json({ success: true, message: 'Quotation converted to invoice', data: invoice });
});

// GET /api/quotations/:id/pdf — generate PDF
router.get('/:id/pdf', protect, salesAccess, async (req, res) => {
  const q = await Quotation.findById(req.params.id).populate('client').populate('createdBy', 'name email');
  if (!q) return res.status(404).json({ success: false, message: 'Quotation not found' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${q.quotationNo}.pdf"`);

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(res);

  // Header
  doc.fontSize(20).font('Helvetica-Bold').text(process.env.COMPANY_NAME || 'Cipher Mutex Pvt. Ltd.', 50, 50);
  doc.fontSize(10).font('Helvetica').text(process.env.COMPANY_ADDRESS || '', 50, 75);
  doc.text(`GST: ${process.env.COMPANY_GST || ''}`, 50, 90);
  doc.text(`Email: ${process.env.COMPANY_EMAIL || ''}`, 50, 105);

  doc.fontSize(20).font('Helvetica-Bold').text('QUOTATION', 400, 50, { align: 'right' });
  doc.fontSize(10).font('Helvetica').text(`No: ${q.quotationNo}`, 400, 75, { align: 'right' });
  doc.text(`Date: ${q.createdAt.toLocaleDateString('en-IN')}`, 400, 90, { align: 'right' });
  doc.text(`Valid Until: ${q.validUntil.toLocaleDateString('en-IN')}`, 400, 105, { align: 'right' });

  doc.moveTo(50, 130).lineTo(550, 130).stroke();

  // Client
  doc.fontSize(11).font('Helvetica-Bold').text('Bill To:', 50, 145);
  doc.font('Helvetica').text(q.client?.name || '', 50, 160);
  doc.text(q.client?.companyName || '', 50, 175);
  doc.text(q.client?.email || '', 50, 190);
  doc.text(q.client?.gstin ? `GST: ${q.client.gstin}` : '', 50, 205);

  // Table header
  const tableTop = 240;
  doc.fillColor('#1a1a2e').rect(50, tableTop, 500, 20).fill();
  doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
  doc.text('#', 55, tableTop + 5);
  doc.text('Description', 75, tableTop + 5);
  doc.text('Qty', 310, tableTop + 5);
  doc.text('Rate', 350, tableTop + 5);
  doc.text('Tax%', 400, tableTop + 5);
  doc.text('Amount', 460, tableTop + 5);

  // Table rows
  doc.fillColor('#000000').font('Helvetica');
  let y = tableTop + 25;
  q.items.forEach((item, i) => {
    if (i % 2 === 1) doc.fillColor('#f5f5f5').rect(50, y - 3, 500, 18).fill();
    doc.fillColor('#000000');
    doc.text(String(i + 1), 55, y);
    doc.text(item.description, 75, y, { width: 220 });
    doc.text(String(item.quantity), 310, y);
    doc.text(`₹${item.rate.toLocaleString('en-IN')}`, 350, y);
    doc.text(`${item.taxRate}%`, 400, y);
    doc.text(`₹${(item.total || 0).toLocaleString('en-IN')}`, 460, y);
    y += 22;
  });

  // Totals
  y += 10;
  doc.moveTo(350, y).lineTo(550, y).stroke();
  y += 10;
  doc.fontSize(10);
  doc.text('Subtotal:', 370, y); doc.text(`₹${q.subtotal.toLocaleString('en-IN')}`, 460, y); y += 18;
  doc.text('GST:', 370, y); doc.text(`₹${q.totalTax.toLocaleString('en-IN')}`, 460, y); y += 18;
  doc.moveTo(350, y).lineTo(550, y).stroke(); y += 5;
  doc.fontSize(12).font('Helvetica-Bold');
  doc.text('Total:', 370, y); doc.text(`₹${q.total.toLocaleString('en-IN')}`, 460, y);

  if (q.terms) { y += 50; doc.fontSize(10).font('Helvetica-Bold').text('Terms & Conditions:', 50, y); y += 15; doc.font('Helvetica').text(q.terms, 50, y); }

  doc.end();
});

module.exports = router;
