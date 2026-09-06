const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, unique: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  description: { type: String },
  type: { type: String, enum: ['Fixed Price', 'Time & Material', 'Retainer', 'Internal'], default: 'Fixed Price' },
  status: { 
    type: String,
    enum: ['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled', 'Overdue'],
    default: 'Planning'
  },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  startDate: { type: Date, required: true },
  deadline: { type: Date, required: true },
  completedAt: { type: Date },
  budget: { type: Number, default: 0 },
  spent: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  team: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: String,
    addedAt: { type: Date, default: Date.now }
  }],
  milestones: [{
    title: String,
    dueDate: Date,
    completed: { type: Boolean, default: false },
    completedAt: Date,
  }],
  tags: [String],
  notes: { type: String },
  invoices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' }],
}, { timestamps: true });

projectSchema.pre('validate', async function(next) {
  if (!this.code) {
    const count = await mongoose.model('Project').countDocuments();
    this.code = `PRJ-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
