const express = require('express');
const User = require('../models/User');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get own payroll
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('employeeId personalDetails jobDetails salary');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      employeeId: user.employeeId,
      name: `${user.personalDetails?.firstName || ''} ${user.personalDetails?.lastName || ''}`.trim() || user.email,
      department: user.jobDetails?.department || '',
      position: user.jobDetails?.position || '',
      salary: user.salary || {}
    });
  } catch (error) {
    console.error('Get payroll error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all payrolls (Admin/HR) - must come before /:employeeId route
router.get('/admin/all', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: 'employee' })
      .select('employeeId personalDetails jobDetails salary')
      .sort('employeeId');

    const payrolls = users.map(user => ({
      id: user._id,
      employeeId: user.employeeId,
      name: `${user.personalDetails?.firstName || ''} ${user.personalDetails?.lastName || ''}`.trim() || user.email,
      department: user.jobDetails?.department || '',
      position: user.jobDetails?.position || '',
      salary: user.salary || {}
    }));

    res.json(payrolls);
  } catch (error) {
    console.error('Get all payrolls error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get payroll for specific employee (admin)
router.get('/:employeeId', auth, async (req, res) => {
  try {
    const employeeId = req.params.employeeId;
    const isAdmin = req.user.role === 'admin';
    const isOwnPayroll = employeeId === req.user._id.toString();

    if (!isAdmin && !isOwnPayroll) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(employeeId).select('employeeId personalDetails jobDetails salary');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      employeeId: user.employeeId,
      name: `${user.personalDetails?.firstName || ''} ${user.personalDetails?.lastName || ''}`.trim() || user.email,
      department: user.jobDetails?.department || '',
      position: user.jobDetails?.position || '',
      salary: user.salary || {}
    });
  } catch (error) {
    console.error('Get payroll error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update salary (Admin only)
router.put('/:employeeId', auth, isAdmin, async (req, res) => {
  try {
    const { baseSalary, allowances, deductions } = req.body;
    const user = await User.findById(req.params.employeeId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (baseSalary !== undefined) user.salary.baseSalary = baseSalary;
    if (allowances !== undefined) user.salary.allowances = allowances;
    if (deductions !== undefined) user.salary.deductions = deductions;

    // Calculate net salary
    user.salary.netSalary = (user.salary.baseSalary || 0) + 
                           (user.salary.allowances || 0) - 
                           (user.salary.deductions || 0);

    await user.save();
    res.json({ message: 'Salary updated successfully', salary: user.salary });
  } catch (error) {
    console.error('Update salary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
