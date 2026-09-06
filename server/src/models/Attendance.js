const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  status: { 
    type: String, 
    enum: ['Present', 'Absent', 'Late', 'Half Day', 'WFH', 'Holiday', 'On Leave'], 
    default: 'Absent' 
  },
  hoursWorked: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },
  notes: { type: String },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // manual entry
}, { timestamps: true });

// Calculate hours worked before save
attendanceSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut) {
    const diff = (this.checkOut - this.checkIn) / (1000 * 60 * 60);
    this.hoursWorked = Math.round(diff * 100) / 100;
    this.overtimeHours = Math.max(0, this.hoursWorked - 8);
    
    if (this.hoursWorked < 4) this.status = 'Half Day';
    else if (this.checkIn.getHours() > 9 || (this.checkIn.getHours() === 9 && this.checkIn.getMinutes() > 30)) {
      this.status = 'Late';
    } else {
      this.status = 'Present';
    }
  }
  next();
});

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
