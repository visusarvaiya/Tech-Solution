const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { auth, isAdmin } = require('../middleware/auth');
const { sendEmployeeCredentials } = require('../utils/emailService');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your_jwt_secret_key_here', {
    expiresIn: '7d'
  });
};

// Create Employee (Admin/HR only)
router.post('/create-employee', auth, isAdmin, async (req, res) => {
  try {
    const { employeeId, email, firstName, lastName, department, position, role } = req.body;

    // Validation
    if (!employeeId || !email) {
      return res.status(400).json({ message: 'Please provide Employee ID and Email' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { employeeId }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or employee ID already exists' });
    }

    // Generate temporary password
    const temporaryPassword = crypto.randomBytes(8).toString('hex');

    // Create new employee
    const user = new User({
      employeeId,
      email,
      password: temporaryPassword, // Will be hashed by pre-save hook
      role: role || 'employee',
      mustChangePassword: true,
      temporaryPassword: temporaryPassword, // Store plain text for email
      personalDetails: {
        firstName: firstName || '',
        lastName: lastName || ''
      },
      jobDetails: {
        department: department || '',
        position: position || ''
      }
    });

    await user.save();

    // Send credentials email
    const emailResult = await sendEmployeeCredentials(
      email,
      employeeId,
      temporaryPassword,
      firstName
    );

    if (!emailResult.success) {
      console.error('Failed to send email:', emailResult.error);
      // Still return success but log the error
    }

    res.status(201).json({
      message: 'Employee created successfully. Credentials sent to email.',
      user: {
        id: user._id,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword
      },
      emailSent: emailResult.success,
      temporaryPassword: temporaryPassword // Return for admin reference (remove in production if needed)
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: 'Server error during employee creation' });
  }
});

// Sign Up (Only for Admin/HR - for creating admin accounts)
router.post('/signup', async (req, res) => {
  try {
    const { employeeId, email, password, role } = req.body;

    // Validation
    if (!employeeId || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if this is the first user (allow any role for first user)
    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;

    // Only allow admin role for self-registration (unless it's the first user)
    if (!isFirstUser && role !== 'admin') {
      return res.status(403).json({ 
        message: 'Employee accounts can only be created by Admin. Please contact your administrator.' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { employeeId }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or employee ID already exists' });
    }

    // For first user, default to admin if no role specified
    const userRole = isFirstUser ? (role || 'admin') : (role || 'admin');

    // Create new user
    const user = new User({
      employeeId,
      email: email.toLowerCase(),
      password,
      role: userRole,
      mustChangePassword: false
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role,
        personalDetails: user.personalDetails,
        jobDetails: user.jobDetails
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: `User with this ${field} already exists` 
      });
    }
    res.status(500).json({ message: 'Server error during registration: ' + error.message });
  }
});

// Sign In
router.post('/signin', async (req, res) => {
  try {
    const { email, password, employeeId } = req.body;

    if ((!email && !employeeId) || !password) {
      return res.status(400).json({ message: 'Please provide email/employee ID and password' });
    }

    // Find user by email or employeeId (normalize email to lowercase)
    const query = email 
      ? { email: email.toLowerCase().trim() } 
      : { employeeId: employeeId.trim() };
    const user = await User.findOne(query);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email/employee ID or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email/employee ID or password' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role,
        personalDetails: user.personalDetails,
        jobDetails: user.jobDetails,
        mustChangePassword: user.mustChangePassword
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// First-time password change (no auth required)
router.post('/change-password-first-time', async (req, res) => {
  try {
    const { email, employeeId, currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    // Find user by email or employeeId
    const query = email ? { email } : { employeeId };
    const user = await User.findOne(query);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user must change password
    if (!user.mustChangePassword) {
      return res.status(400).json({ message: 'Password change not required' });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    user.mustChangePassword = false;
    user.temporaryPassword = '';
    await user.save();

    // Generate token for automatic login
    const token = generateToken(user._id);

    res.json({ 
      message: 'Password changed successfully',
      token,
      user: {
        id: user._id,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role,
        personalDetails: user.personalDetails,
        jobDetails: user.jobDetails,
        mustChangePassword: false
      }
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change Password (for logged-in users)
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    user.mustChangePassword = false;
    user.temporaryPassword = '';
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -temporaryPassword');
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

