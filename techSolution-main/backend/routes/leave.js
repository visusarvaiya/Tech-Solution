const express = require('express');
const Leave = require('../models/Leave');
const User = require('../models/User');
const { auth, isAdmin } = require('../middleware/auth');
const { sendLeaveStatusNotification } = require('../utils/emailService');

const router = express.Router();

// Apply for leave
router.post('/apply', auth, async (req, res) => {
  try {
    const { leaveType, startDate, endDate, remarks } = req.body;

    if (!leaveType || !startDate || !endDate) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Calculate total days
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const leave = new Leave({
      employeeId: req.user._id,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays: diffDays,
      remarks: remarks || ''
    });

    await leave.save();
    await leave.populate('employeeId', 'employeeId personalDetails.firstName personalDetails.lastName');

    res.status(201).json({ message: 'Leave application submitted successfully', leave });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leave requests (for current user)
router.get('/', auth, async (req, res) => {
  try {
    const query = { employeeId: req.user._id };
    const { status } = req.query;
    if (status) {
      query.status = status;
    }

    const leaves = await Leave.find(query)
      .populate('employeeId', 'employeeId personalDetails.firstName personalDetails.lastName')
      .populate('approvedBy', 'employeeId personalDetails.firstName personalDetails.lastName')
      .sort({ appliedAt: -1 });

    res.json(leaves || []);
  } catch (error) {
    console.error('Get leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leave requests for specific employee (admin)
router.get('/:employeeId', auth, async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const isAdmin = req.user.role === 'admin';
    const isOwnLeave = employeeId === req.user._id.toString();

    if (!isAdmin && !isOwnLeave) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = { employeeId };
    const { status } = req.query;
    if (status) {
      query.status = status;
    }

    const leaves = await Leave.find(query)
      .populate('employeeId', 'employeeId personalDetails.firstName personalDetails.lastName')
      .populate('approvedBy', 'employeeId personalDetails.firstName personalDetails.lastName')
      .sort({ appliedAt: -1 });

    res.json(leaves || []);
  } catch (error) {
    console.error('Get leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all leave requests (Admin/HR)
router.get('/admin/all', auth, isAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) {
      query.status = status;
    }

    const leaves = await Leave.find(query)
      .populate('employeeId', 'employeeId personalDetails.firstName personalDetails.lastName jobDetails.department')
      .populate('approvedBy', 'employeeId personalDetails.firstName personalDetails.lastName')
      .sort({ appliedAt: -1 });

    res.json(leaves);
  } catch (error) {
    console.error('Get all leaves error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve/Reject leave
router.put('/:id/approve', auth, isAdmin, async (req, res) => {
  try {
    const { status, adminComments } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be approved or rejected' });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    leave.status = status;
    leave.approvedBy = req.user._id;
    leave.adminComments = adminComments || '';
    leave.reviewedAt = new Date();

    await leave.save();
    await leave.populate('employeeId', 'employeeId email personalDetails.firstName personalDetails.lastName');
    await leave.populate('approvedBy', 'employeeId personalDetails.firstName personalDetails.lastName');

    // Send email notification
    if (leave.employeeId && leave.employeeId.email) {
      const emailResult = await sendLeaveStatusNotification(
        leave.employeeId.email,
        leave.employeeId.personalDetails?.firstName || 'Employee',
        leave.leaveType,
        leave.startDate,
        leave.endDate,
        status,
        adminComments
      );
      
      if (!emailResult.success) {
        console.error('Failed to send leave status email:', emailResult.error);
        // Still return success but log the error
      }
    }

    res.json({ message: `Leave request ${status} successfully`, leave });
  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leave statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const employeeId = req.user.role === 'admin' 
      ? req.query.employeeId || null 
      : req.user._id;

    const query = employeeId ? { employeeId } : {};

    const [total, pending, approved, rejected] = await Promise.all([
      Leave.countDocuments(query),
      Leave.countDocuments({ ...query, status: 'pending' }),
      Leave.countDocuments({ ...query, status: 'approved' }),
      Leave.countDocuments({ ...query, status: 'rejected' })
    ]);

    res.json({ total, pending, approved, rejected });
  } catch (error) {
    console.error('Get leave stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

