const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  payPeriod: { type: String }, // "January 2024"
  workingDays: { type: Number, required: true },
  presentDays: { type: Number, default: 0 },
  leaveDays: { type: Number, default: 0 },
  lopDays: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  earnings: {
    basicSalary: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    conveyanceAllowance: { type: Number, default: 0 },
    medicalAllowance: { type: Number, default: 0 },
    specialAllowance: { type: Number, default: 0 },
    overtimePay: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    otherEarnings: { type: Number, default: 0 },
  },
  deductions: {
    pf: { type: Number, default: 0 },
    esi: { type: Number, default: 0 },
    tds: { type: Number, default: 0 },
    professionalTax: { type: Number, default: 0 },
    lopDeduction: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },
    advance: { type: Number, default: 0 },
  },
  grossSalary: { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },
  netSalary: { type: Number, default: 0 },
  status: { type: String, enum: ['Draft', 'Generated', 'Paid', 'Cancelled'], default: 'Draft' },
  paymentDate: { type: Date },
  paymentMode: { type: String, enum: ['Bank Transfer', 'Cheque', 'Cash', 'UPI'] },
  transactionId: { type: String },
  payslipUrl: { type: String },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
}, { timestamps: true });

payrollSchema.pre('save', function(next) {
  const e = this.earnings;
  const d = this.deductions;
  this.grossSalary = Object.values(e).reduce((a, b) => a + b, 0);
  this.totalDeductions = Object.values(d).reduce((a, b) => a + b, 0);
  this.netSalary = this.grossSalary - this.totalDeductions;
  this.payPeriod = new Date(this.year, this.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  next();
});

payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);
