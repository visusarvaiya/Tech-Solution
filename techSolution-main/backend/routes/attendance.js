const express = require('express');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Check In
router.post('/checkin', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if already checked in today - use findOneAndUpdate to prevent race conditions
    const existingAttendance = await Attendance.findOne({
      employeeId: req.user._id,
      date: { $gte: today, $lt: tomorrow }
    });

    if (existingAttendance && existingAttendance.checkIn && existingAttendance.checkIn.time) {
      return res.status(400).json({ message: 'You have already checked in today. You can only check in once per day.' });
    }

    const checkInTime = new Date();
    const expectedCheckInTime = req.body.expectedCheckInTime || '09:00'; // Default 9 AM
    const [expectedHours, expectedMinutes] = expectedCheckInTime.split(':').map(Number);
    const expectedTime = new Date(today);
    expectedTime.setHours(expectedHours, expectedMinutes, 0, 0);

    // Calculate late arrival in minutes
    let lateArrivalMinutes = 0;
    if (checkInTime > expectedTime) {
      lateArrivalMinutes = Math.floor((checkInTime - expectedTime) / (1000 * 60));
    }

    let attendance;
    if (existingAttendance) {
      // Update existing record
      attendance = existingAttendance;
      attendance.checkIn = {
        time: checkInTime,
        location: req.body.location || ''
      };
      attendance.lateArrivalMinutes = lateArrivalMinutes;
      attendance.expectedCheckInTime = expectedCheckInTime;
      attendance.status = 'present';
    } else {
      // Create new record
      attendance = new Attendance({
        employeeId: req.user._id,
        date: today,
        checkIn: {
          time: checkInTime,
          location: req.body.location || ''
        },
        lateArrivalMinutes: lateArrivalMinutes,
        expectedCheckInTime: expectedCheckInTime,
        status: 'present'
      });
    }

    await attendance.save();
    res.json({ 
      message: 'Checked in successfully', 
      attendance,
      lateArrivalMinutes: lateArrivalMinutes > 0 ? lateArrivalMinutes : 0
    });
  } catch (error) {
    console.error('Check-in error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already checked in today. You can only check in once per day.' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Check Out
router.post('/checkout', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.findOne({
      employeeId: req.user._id,
      date: { $gte: today, $lt: tomorrow }
    });

    if (!attendance || !attendance.checkIn || !attendance.checkIn.time) {
      return res.status(400).json({ message: 'Please check in first before checking out' });
    }

    if (attendance.checkOut && attendance.checkOut.time) {
      return res.status(400).json({ message: 'You have already checked out today. You can only check out once per day.' });
    }

    const checkOutTime = new Date();
    attendance.checkOut = {
      time: checkOutTime,
      location: req.body.location || ''
    };

    // Calculate working hours
    const checkInTime = new Date(attendance.checkIn.time);
    const diffMs = checkOutTime - checkInTime;
    attendance.workingHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    await attendance.save();
    res.json({ message: 'Checked out successfully', attendance });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get today's attendance status (MUST come before /:employeeId route)
router.get('/today/status', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.findOne({
      employeeId: req.user._id,
      date: { $gte: today, $lt: tomorrow }
    });

    if (!attendance) {
      return res.json({ checkedIn: false, checkedOut: false });
    }

    res.json({
      checkedIn: !!attendance.checkIn.time,
      checkedOut: !!attendance.checkOut.time,
      checkInTime: attendance.checkIn.time,
      checkOutTime: attendance.checkOut.time,
      workingHours: attendance.workingHours,
      status: attendance.status,
      lateArrivalMinutes: attendance.lateArrivalMinutes || 0,
      expectedCheckInTime: attendance.expectedCheckInTime || '09:00'
    });
  } catch (error) {
    console.error('Get today status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get own attendance or all employees' attendance (admin)
router.get('/', auth, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const { startDate, endDate, view, allEmployees } = req.query;
    
    let query = {};
    
    // If admin and allEmployees is true, don't filter by employeeId
    if (isAdmin && allEmployees === 'true') {
      // Query for all employees
      query = {};
    } else {
      // Query for own attendance
      query = { employeeId: req.user._id };
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (view === 'week') {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      
      query.date = { $gte: weekStart, $lt: weekEnd };
    } else if (view === 'month') {
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);
      
      query.date = { $gte: monthStart, $lte: monthEnd };
    } else {
      // Default: today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      query.date = { $gte: today, $lt: tomorrow };
    }

    const attendance = await Attendance.find(query)
      .populate('employeeId', 'employeeId personalDetails.firstName personalDetails.lastName')
      .sort({ date: -1 });

    res.json(attendance || []);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get attendance for specific employee (admin) - MUST come after all specific routes
router.get('/:employeeId', auth, async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const isAdmin = req.user.role === 'admin';
    const isOwnAttendance = employeeId === req.user._id.toString();

    if (!isAdmin && !isOwnAttendance) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { startDate, endDate, view } = req.query;
    let query = { employeeId: employeeId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (view === 'week') {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      
      query.date = { $gte: weekStart, $lt: weekEnd };
    } else if (view === 'month') {
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);
      
      query.date = { $gte: monthStart, $lte: monthEnd };
    } else {
      // Default: today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      query.date = { $gte: today, $lt: tomorrow };
    }

    const attendance = await Attendance.find(query)
      .populate('employeeId', 'employeeId personalDetails.firstName personalDetails.lastName')
      .sort({ date: -1 });

    res.json(attendance || []);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update attendance status (Admin only)
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    if (status) {
      attendance.status = status;
    }
    if (notes !== undefined) {
      attendance.notes = notes;
    }

    await attendance.save();
    res.json({ message: 'Attendance updated successfully', attendance });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
