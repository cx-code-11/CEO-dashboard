const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  empId: { type: String, unique: true, required: true },
  designation: { type: String, required: true },
  department: { type: String, required: true },
  joiningDate: { type: Date, required: true },
  employmentType: { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Intern'], default: 'Full-time' },
  salary: {
    basic: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
  },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
  },
  documents: [{
    type: { type: String },
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now },
  }],
  skills: [String],
  performanceScore: { type: Number, min: 0, max: 100, default: 0 },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  exitDate: { type: Date },
  exitReason: { type: String },
}, { timestamps: true });

// Auto-generate employee ID
employeeSchema.pre('validate', async function(next) {
  if (!this.empId) {
    const count = await mongoose.model('Employee').countDocuments();
    this.empId = `CX-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);
