const express = require('express');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const { auth, isAdmin } = require('../middleware/auth');
const { deleteImage } = require('../utils/cloudinary');

const router = express.Router();

// Get all employees (including all users for admin)
router.get('/employees', auth, isAdmin, async (req, res) => {
  try {
    const employees = await User.find()
      .select('-password -temporaryPassword')
      .sort('employeeId');

    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete employee
router.delete('/employees/:id', auth, isAdmin, async (req, res) => {
  try {
    const employeeId = req.params.id;
    
    // Prevent deleting yourself
    if (employeeId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Delete all related data
    const deletePromises = [];

    // 1. Delete all attendance records for this employee
    const attendanceCount = await Attendance.countDocuments({ employeeId: employeeId });
    if (attendanceCount > 0) {
      deletePromises.push(
        Attendance.deleteMany({ employeeId: employeeId })
          .then(() => console.log(`Deleted ${attendanceCount} attendance records for employee ${employeeId}`))
      );
    }

    // 2. Delete all leave records where this employee is the applicant
    const leaveCount = await Leave.countDocuments({ employeeId: employeeId });
    if (leaveCount > 0) {
      deletePromises.push(
        Leave.deleteMany({ employeeId: employeeId })
          .then(() => console.log(`Deleted ${leaveCount} leave records for employee ${employeeId}`))
      );
    }

    // 3. Update leave records where this employee approved leaves (set approvedBy to null)
    const approvedLeavesCount = await Leave.countDocuments({ approvedBy: employeeId });
    if (approvedLeavesCount > 0) {
      deletePromises.push(
        Leave.updateMany(
          { approvedBy: employeeId },
          { $unset: { approvedBy: '' } }
        ).then(() => console.log(`Updated ${approvedLeavesCount} leave records that were approved by employee ${employeeId}`))
      );
    }

    // 4. Delete profile picture from Cloudinary if it exists
    if (employee.personalDetails?.profilePicture) {
      const profilePictureUrl = employee.personalDetails.profilePicture;
      // Only delete if it's a Cloudinary URL (not an avatar URL)
      if (profilePictureUrl.includes('res.cloudinary.com') || profilePictureUrl.includes('cloudinary.com')) {
        deletePromises.push(
          deleteImage(profilePictureUrl)
            .then(() => console.log(`Deleted profile picture from Cloudinary for employee ${employeeId}`))
            .catch(err => console.error(`Error deleting profile picture: ${err.message}`))
        );
      }
    }

    // 5. Delete uploaded documents from local storage
    if (employee.documents && employee.documents.length > 0) {
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      employee.documents.forEach(doc => {
        if (doc.url) {
          // Extract filename from URL (could be /uploads/filename or full path)
          let filePath = doc.url;
          if (filePath.startsWith('/uploads/')) {
            filePath = path.join(uploadsDir, filePath.replace('/uploads/', ''));
          } else if (!path.isAbsolute(filePath)) {
            filePath = path.join(uploadsDir, path.basename(filePath));
          }
          
          if (fs.existsSync(filePath)) {
            deletePromises.push(
              new Promise((resolve) => {
                fs.unlink(filePath, (err) => {
                  if (err) {
                    console.error(`Error deleting document ${filePath}:`, err.message);
                  } else {
                    console.log(`Deleted document: ${filePath}`);
                  }
                  resolve();
                });
              })
            );
          }
        }
      });
    }

    // Wait for all deletions to complete
    await Promise.all(deletePromises);

    // 6. Finally, delete the user
    await User.findByIdAndDelete(employeeId);
    
    console.log(`Successfully deleted employee ${employeeId} and all related data`);
    res.json({ 
      message: 'Employee and all related data deleted successfully',
      deleted: {
        attendanceRecords: attendanceCount,
        leaveRecords: leaveCount,
        approvedLeavesUpdated: approvedLeavesCount,
        documents: employee.documents?.length || 0
      }
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Get dashboard statistics
router.get('/dashboard/stats', auth, isAdmin, async (req, res) => {
  try {
    const [totalEmployees, totalLeaves, pendingLeaves, todayAttendance] = await Promise.all([
      User.countDocuments({ role: 'employee' }),
      Leave.countDocuments(),
      Leave.countDocuments({ status: 'pending' }),
      Attendance.countDocuments({
        date: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        },
        status: 'present'
      })
    ]);

    res.json({
      totalEmployees,
      totalLeaves,
      pendingLeaves,
      todayAttendance
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reports
router.get('/reports/attendance', auth, isAdmin, async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (employeeId) {
      query.employeeId = employeeId;
    }

    const attendance = await Attendance.find(query)
      .populate('employeeId', 'employeeId personalDetails.firstName personalDetails.lastName')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get salary reports
router.get('/reports/salary', auth, isAdmin, async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' })
      .select('employeeId personalDetails jobDetails salary')
      .sort('employeeId');

    const salaryReport = employees.map(emp => ({
      employeeId: emp.employeeId,
      name: `${emp.personalDetails.firstName} ${emp.personalDetails.lastName}`,
      department: emp.jobDetails.department,
      position: emp.jobDetails.position,
      baseSalary: emp.salary.baseSalary,
      allowances: emp.salary.allowances,
      deductions: emp.salary.deductions,
      netSalary: emp.salary.netSalary
    }));

    res.json(salaryReport);
  } catch (error) {
    console.error('Get salary report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

