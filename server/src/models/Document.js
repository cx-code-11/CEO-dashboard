const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: {
    type: String,
    enum: ['Employee Document', 'Client Agreement', 'Contract', 'Invoice', 'Company Policy', 'Legal', 'Financial', 'Project', 'Other'],
    required: true
  },
  fileUrl: { type: String, required: true },
  fileName: { type: String },
  fileSize: { type: Number },
  fileType: { type: String },
  relatedTo: {
    model: { type: String, enum: ['Employee', 'Client', 'Project', 'Invoice', 'Contract', 'Other'] },
    id: { type: mongoose.Schema.Types.ObjectId },
  },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  accessRoles: [{ type: String }], // who can view
  isConfidential: { type: Boolean, default: false },
  expiryDate: { type: Date },
  tags: [String],
  version: { type: Number, default: 1 },
  previousVersions: [{
    fileUrl: String,
    version: Number,
    uploadedAt: { type: Date, default: Date.now },
  }],
  downloadCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
