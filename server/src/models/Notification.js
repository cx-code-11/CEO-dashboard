const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['info', 'success', 'warning', 'error', 'payment', 'invoice', 'leave', 'task', 'project', 'system'],
    default: 'info'
  },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  link: { type: String },
  icon: { type: String },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  expiresAt: { type: Date },
  sentViaEmail: { type: Boolean, default: false },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
