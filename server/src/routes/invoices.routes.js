const express = require('express');
const router = express.Router();
const { protect, financeAccess, salesAccess } = require('../middleware/auth');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Client = require('../models/Client');
const Income = require('../models/Income');
const PDFDocument = require('pdfkit');
const auditLog = require('../middleware/auditLogger');

router.get('/', protect, salesAccess, async (req, res) => {
  const { status, client, page = 1, limit = 20, search } = req.query;
  const query = {};
  if (status) query.status = status;
  if (client) query.client = client;
  if (search) query.$or = [{ invoiceNo: { $regex: search, $options: 'i' } }, { title: { $regex: search, $options: 'i' } }];
  const data = await Invoice.find(query).populate('client', 'name companyName email').populate('createdBy', 'name').sort({ createdAt: -1 }).skip((+page - 1) * +limit).limit(+limit);
  const total = await Invoice.countDocuments(query);
  res.json({ success: true, data, pagination: { total, page: +page, limit: +limit } });
});

// Overdue invoices
router.get('/overdue', protect, financeAccess, async (req, res) => {
  const overdue = await Invoice.find({ status: { $in: ['Sent', 'Partially Paid'] }, dueDate: { $lt: new Date() } })
    .populate('client', 'name companyName email phone')
    .sort({ dueDate: 1 });
  // Update status to overdue
  await Invoice.updateMany({ status: { $in: ['Sent', 'Partially Paid'] }, dueDate: { $lt: new Date() } }, { status: 'Overdue' });
  res.json({ success: true, data: overdue, total: overdue.reduce((s, i) => s + i.balanceDue, 0) });
});

router.get('/:id', protect, salesAccess, async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate('client').populate('quotation', 'quotationNo').populate('createdBy', 'name email').populate({ path: 'payments', populate: { path: 'recordedBy', select: 'name' } });
  if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
  res.json({ success: true, data: invoice });
});

router.post('/', protect, salesAccess, auditLog('CREATE', 'Invoice'), async (req, res) => {
  const invoice = await Invoice.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, message: 'Invoice created', data: invoice });
});

router.put('/:id', protect, salesAccess, auditLog('UPDATE', 'Invoice'), async (req, res) => {
  const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('client');
  if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
  res.json({ success: true, data: invoice });
});

// POST /api/invoices/:id/payment — record payment
router.post('/:id/payment', protect, financeAccess, async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate('client');
  if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

  const payment = await Payment.create({
    invoice: invoice._id,
    client: invoice.client._id,
    recordedBy: req.user._id,
    ...req.body,
  });

  // Update invoice paid amount
  invoice.paidAmount += payment.amount;
  invoice.payments.push(payment._id);
  await invoice.save();

  // Update client total revenue
  await Client.findByIdAndUpdate(invoice.client._id, { $inc: { totalRevenue: payment.amount, outstandingAmount: -payment.amount } });

  // Create income entry
  await Income.create({
    title: `Payment for Invoice ${invoice.invoiceNo}`,
    amount: payment.amount,
    date: payment.date,
    category: 'Service Revenue',
    client: invoice.client._id,
    invoice: invoice._id,
    paymentMode: payment.mode,
    transactionId: payment.transactionId,
    recordedBy: req.user._id,
  });

  res.status(201).json({ success: true, message: 'Payment recorded', data: { payment, invoice } });
});

// GET /api/invoices/:id/pdf
router.get('/:id/pdf', protect, salesAccess, async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate('client');
  if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNo}.pdf"`);

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(res);

  // Header
  doc.fontSize(20).font('Helvetica-Bold').fillColor('#1a1a2e').text(process.env.COMPANY_NAME || 'Cipher Mutex Pvt. Ltd.', 50, 50);
  doc.fontSize(10).font('Helvetica').fillColor('#333').text(process.env.COMPANY_ADDRESS || '', 50, 75);
  doc.text(`GSTIN: ${process.env.COMPANY_GST || ''}`, 50, 90);
  doc.fontSize(22).font('Helvetica-Bold').fillColor('#1a1a2e').text('TAX INVOICE', 380, 50, { align: 'right' });
  doc.fontSize(10).font('Helvetica').fillColor('#333').text(`Invoice No: ${invoice.invoiceNo}`, 380, 80, { align: 'right' });
  doc.text(`Date: ${invoice.invoiceDate.toLocaleDateString('en-IN')}`, 380, 95, { align: 'right' });
  doc.text(`Due Date: ${invoice.dueDate.toLocaleDateString('en-IN')}`, 380, 110, { align: 'right' });

  doc.fillColor('#1a1a2e').rect(50, 130, 500, 2).fill();

  // Client
  doc.fillColor('#333').fontSize(11).font('Helvetica-Bold').text('Bill To:', 50, 145);
  const c = invoice.client;
  doc.font('Helvetica').text(`${c?.name || ''}${c?.companyName ? ' / ' + c.companyName : ''}`, 50, 160);
  if (c?.email) doc.text(c.email, 50, 175);
  if (c?.gstin) doc.text(`GSTIN: ${c.gstin}`, 50, 190);

  // GST info box
  doc.fillColor('#f0f4ff').rect(350, 145, 200, 65).fill();
  doc.fillColor('#333').fontSize(9).text('GST Type:', 360, 152);
  doc.font('Helvetica-Bold').text(invoice.gstType, 430, 152);
  if (invoice.gstType === 'CGST/SGST') {
    doc.font('Helvetica').text(`CGST (9%): ₹${invoice.cgst.toLocaleString('en-IN')}`, 360, 167);
    doc.text(`SGST (9%): ₹${invoice.sgst.toLocaleString('en-IN')}`, 360, 182);
  } else {
    doc.font('Helvetica').text(`IGST (18%): ₹${invoice.igst.toLocaleString('en-IN')}`, 360, 167);
  }

  // Items table
  const tTop = 230;
  doc.fillColor('#1a1a2e').rect(50, tTop, 500, 20).fill();
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(9);
  ['#', 'Description', 'HSN/SAC', 'Qty', 'Rate (₹)', 'Tax%', 'Amount (₹)'].forEach((h, i) => {
    const x = [55, 75, 250, 310, 340, 400, 450][i];
    doc.text(h, x, tTop + 5);
  });

  let y = tTop + 25;
  doc.fillColor('#000').font('Helvetica').fontSize(9);
  invoice.items.forEach((item, i) => {
    if (i % 2 === 1) doc.fillColor('#f8f9ff').rect(50, y - 3, 500, 18).fill();
    doc.fillColor('#000');
    doc.text(String(i + 1), 55, y);
    doc.text(item.description, 75, y, { width: 170, ellipsis: true });
    doc.text(item.hsnSac || '-', 250, y);
    doc.text(String(item.quantity), 310, y);
    doc.text(item.rate.toLocaleString('en-IN'), 340, y);
    doc.text(`${item.taxRate}%`, 400, y);
    doc.text((item.total || 0).toLocaleString('en-IN'), 450, y);
    y += 20;
  });

  y += 15;
  doc.fillColor('#1a1a2e').rect(350, y, 200, 1).fill(); y += 8;
  doc.fillColor('#333').fontSize(10);
  doc.text('Subtotal:', 360, y); doc.text(`₹${invoice.subtotal.toLocaleString('en-IN')}`, 490, y, { align: 'right', width: 60 }); y += 18;
  if (invoice.gstType === 'CGST/SGST') {
    doc.text('CGST (9%):', 360, y); doc.text(`₹${invoice.cgst.toLocaleString('en-IN')}`, 490, y, { align: 'right', width: 60 }); y += 18;
    doc.text('SGST (9%):', 360, y); doc.text(`₹${invoice.sgst.toLocaleString('en-IN')}`, 490, y, { align: 'right', width: 60 }); y += 18;
  } else {
    doc.text('IGST (18%):', 360, y); doc.text(`₹${invoice.igst.toLocaleString('en-IN')}`, 490, y, { align: 'right', width: 60 }); y += 18;
  }
  doc.fillColor('#1a1a2e').rect(350, y, 200, 2).fill(); y += 8;
  doc.fillColor('#1a1a2e').font('Helvetica-Bold').fontSize(12);
  doc.text('Total:', 360, y); doc.text(`₹${invoice.total.toLocaleString('en-IN')}`, 490, y, { align: 'right', width: 60 }); y += 20;
  if (invoice.paidAmount > 0) {
    doc.fillColor('#16a34a').fontSize(10).font('Helvetica');
    doc.text('Paid Amount:', 360, y); doc.text(`₹${invoice.paidAmount.toLocaleString('en-IN')}`, 490, y, { align: 'right', width: 60 }); y += 18;
    doc.fillColor('#dc2626').font('Helvetica-Bold');
    doc.text('Balance Due:', 360, y); doc.text(`₹${invoice.balanceDue.toLocaleString('en-IN')}`, 490, y, { align: 'right', width: 60 });
  }

  // Footer
  doc.fontSize(9).fillColor('#999').font('Helvetica').text('Thank you for your business!', 50, 750, { align: 'center', width: 500 });
  doc.text(`${process.env.COMPANY_NAME} | ${process.env.COMPANY_EMAIL} | ${process.env.COMPANY_PHONE}`, 50, 765, { align: 'center', width: 500 });

  doc.end();
});

module.exports = router;
