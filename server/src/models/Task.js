const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  description: { type: String },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { 
    type: String,
    enum: ['Todo', 'In Progress', 'In Review', 'Blocked', 'Completed', 'Cancelled'],
    default: 'Todo'
  },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  dueDate: { type: Date },
  completedAt: { type: Date },
  estimatedHours: { type: Number, default: 0 },
  loggedHours: { type: Number, default: 0 },
  tags: [String],
  attachments: [String],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  subTasks: [{
    title: String,
    completed: { type: Boolean, default: false },
    completedAt: Date,
  }],
  dependsOn: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
