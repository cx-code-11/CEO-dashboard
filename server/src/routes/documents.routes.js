const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Document = require('../models/Document');
const auditLog = require('../middleware/auditLogger');
const upload = require('../middleware/upload');

router.get('/', protect, async (req, res) => {
  const { category, search, page = 1, limit = 50 } = req.query;
  const query = {};
  if (category) query.category = category;
  if (search) query.$or = [
    { title: { $regex: search, $options: 'i' } },
    { fileName: { $regex: search, $options: 'i' } }
  ];
  
  // Access control
  if (req.user.role === 'Employee') {
    query.$or = [
      { accessRoles: req.user.role },
      { uploadedBy: req.user._id },
      { 'relatedTo.model': 'Employee', 'relatedTo.id': req.user._id }
    ];
  }
  
  const data = await Document.find(query)
    .populate('uploadedBy', 'name')
    .sort({ createdAt: -1 })
    .skip((+page - 1) * +limit).limit(+limit);
  const total = await Document.countDocuments(query);
  res.json({ success: true, data, pagination: { total, page: +page, limit: +limit } });
});

router.post('/', protect, upload.single('file'), auditLog('CREATE', 'Document'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  
  let accessRoles = req.body.accessRoles;
  if (typeof accessRoles === 'string') {
    accessRoles = accessRoles.split(',').map(r => r.trim());
  }

  const document = await Document.create({
    ...req.body,
    fileUrl: `/uploads/general/${req.file.filename}`,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    fileType: req.file.mimetype,
    uploadedBy: req.user._id,
    accessRoles: accessRoles || ['CEO', 'HR Manager', 'Finance Manager', 'Project Manager', 'Sales Executive']
  });
  
  res.status(201).json({ success: true, data: document });
});

router.delete('/:id', protect, auditLog('DELETE', 'Document'), async (req, res) => {
  const document = await Document.findById(req.params.id);
  if (!document) return res.status(404).json({ success: false, message: 'Document not found' });
  
  if (req.user.role !== 'CEO' && document.uploadedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  
  await Document.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Document deleted' });
});

module.exports = router;
