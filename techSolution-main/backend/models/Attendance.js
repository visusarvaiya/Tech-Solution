const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  checkIn: {
    time: { type: Date },
    location: { type: String, default: '' }
  },
  checkOut: {
    time: { type: Date },
    location: { type: String, default: '' }
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'leave'],
    default: 'absent'
  },
  workingHours: {
    type: Number,
    default: 0
  },
  lateArrivalMinutes: {
    type: Number,
    default: 0
  },
  expectedCheckInTime: {
    type: String,
    default: '09:00' // Default 9 AM
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for efficient queries
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);

