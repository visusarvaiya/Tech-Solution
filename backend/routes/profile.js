const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { auth, isAdmin } = require('../middleware/auth');
const { uploadProfilePicture, deleteImage } = require('../utils/cloudinary');

const router = express.Router();

// Ensure uploads directory exists (for documents)
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for document uploads (not profile pictures)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Only allow documents (PDF, DOC, DOCX)
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
    }
  }
});

// Get own profile
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -temporaryPassword');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get profile by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select('-password -temporaryPassword');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user can view this profile
    if (req.user.role !== 'admin' && userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update own profile
router.put('/', auth, uploadProfilePicture.single('profilePicture'), async (req, res) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';
    const isOwnProfile = true;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Parse JSON fields if they are strings
    let personalDetails = req.body.personalDetails;
    let jobDetails = req.body.jobDetails;
    let salary = req.body.salary;

    if (typeof personalDetails === 'string') {
      personalDetails = JSON.parse(personalDetails);
    }
    if (typeof jobDetails === 'string') {
      jobDetails = JSON.parse(jobDetails);
    }
    if (typeof salary === 'string') {
      salary = JSON.parse(salary);
    }

    // Update profile picture if uploaded to Cloudinary
    if (req.file && req.file.path) {
      // Delete old profile picture from Cloudinary if it exists (not avatar URLs)
      if (user.personalDetails.profilePicture && !user.personalDetails.profilePicture.includes('dicebear.com')) {
        await deleteImage(user.personalDetails.profilePicture);
      }
      // Store Cloudinary URL in database
      user.personalDetails.profilePicture = req.file.path;
    }
    
    // Also handle profile picture URL if sent directly (for avatar selection)
    if (personalDetails && personalDetails.profilePicture) {
      user.personalDetails.profilePicture = personalDetails.profilePicture;
    }

    // Employees can only edit limited fields
    if (isOwnProfile && !isAdmin) {
      if (personalDetails) {
        if (personalDetails.address !== undefined) user.personalDetails.address = personalDetails.address;
        if (personalDetails.phone !== undefined) user.personalDetails.phone = personalDetails.phone;
        if (personalDetails.firstName !== undefined) user.personalDetails.firstName = personalDetails.firstName;
        if (personalDetails.lastName !== undefined) user.personalDetails.lastName = personalDetails.lastName;
      }
    } else if (isAdmin) {
      // Admin can edit all fields
      if (personalDetails) {
        Object.assign(user.personalDetails, personalDetails);
      }
      if (jobDetails) {
        Object.assign(user.jobDetails, jobDetails);
      }
      if (salary) {
        Object.assign(user.salary, salary);
        // Calculate net salary
        user.salary.netSalary = (user.salary.baseSalary || 0) + 
                                (user.salary.allowances || 0) - 
                                (user.salary.deductions || 0);
      }
    }

    await user.save();
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Update profile by ID
router.put('/:id', auth, uploadProfilePicture.single('profilePicture'), async (req, res) => {
  try {
    const userId = req.params.id;
    const isAdmin = req.user.role === 'admin';
    const isOwnProfile = userId === req.user._id.toString();

    if (!isAdmin && !isOwnProfile) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Parse JSON fields if they are strings
    let personalDetails = req.body.personalDetails;
    let jobDetails = req.body.jobDetails;
    let salary = req.body.salary;

    if (typeof personalDetails === 'string') {
      personalDetails = JSON.parse(personalDetails);
    }
    if (typeof jobDetails === 'string') {
      jobDetails = JSON.parse(jobDetails);
    }
    if (typeof salary === 'string') {
      salary = JSON.parse(salary);
    }

    // Update profile picture if uploaded to Cloudinary
    if (req.file && req.file.path) {
      // Delete old profile picture from Cloudinary if it exists (not avatar URLs)
      if (user.personalDetails.profilePicture && !user.personalDetails.profilePicture.includes('dicebear.com')) {
        await deleteImage(user.personalDetails.profilePicture);
      }
      // Store Cloudinary URL in database
      user.personalDetails.profilePicture = req.file.path;
    }
    
    // Also handle profile picture URL if sent directly (for avatar selection)
    if (personalDetails && personalDetails.profilePicture) {
      user.personalDetails.profilePicture = personalDetails.profilePicture;
    }

    // Employees can only edit limited fields
    if (isOwnProfile && !isAdmin) {
      if (personalDetails) {
        if (personalDetails.address !== undefined) user.personalDetails.address = personalDetails.address;
        if (personalDetails.phone !== undefined) user.personalDetails.phone = personalDetails.phone;
        if (personalDetails.firstName !== undefined) user.personalDetails.firstName = personalDetails.firstName;
        if (personalDetails.lastName !== undefined) user.personalDetails.lastName = personalDetails.lastName;
      }
    } else if (isAdmin) {
      // Admin can edit all fields
      if (personalDetails) {
        Object.assign(user.personalDetails, personalDetails);
      }
      if (jobDetails) {
        Object.assign(user.jobDetails, jobDetails);
      }
      if (salary) {
        Object.assign(user.salary, salary);
        // Calculate net salary
        user.salary.netSalary = (user.salary.baseSalary || 0) + 
                                (user.salary.allowances || 0) - 
                                (user.salary.deductions || 0);
      }
    }

    await user.save();
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Upload document
router.post('/documents', auth, upload.single('document'), async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Store document URL in database
    const documentUrl = `/uploads/${req.file.filename}`;
    const documentName = req.body.name || req.file.originalname;
    const documentType = req.body.type || 'document';

    user.documents.push({
      name: documentName,
      type: documentType,
      url: documentUrl,
      uploadedAt: new Date()
    });

    await user.save();
    res.json({ 
      message: 'Document uploaded successfully', 
      user,
      document: {
        name: documentName,
        type: documentType,
        url: documentUrl
      }
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload document for specific user (admin only)
router.post('/:id/documents', auth, upload.single('document'), async (req, res) => {
  try {
    const userId = req.params.id;
    const isAdmin = req.user.role === 'admin';
    const isOwnProfile = userId === req.user._id.toString();

    if (!isAdmin && !isOwnProfile) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Store document URL in database
    const documentUrl = `/uploads/${req.file.filename}`;
    const documentName = req.body.name || req.file.originalname;
    const documentType = req.body.type || 'document';

    user.documents.push({
      name: documentName,
      type: documentType,
      url: documentUrl,
      uploadedAt: new Date()
    });

    await user.save();
    res.json({ 
      message: 'Document uploaded successfully', 
      user,
      document: {
        name: documentName,
        type: documentType,
        url: documentUrl
      }
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
