const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    // Check if already connected (when called from server.js)
    const isConnected = mongoose.connection.readyState === 1;
    
    // Only connect if not already connected (when run as standalone script)
    if (!isConnected) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dayflow', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    console.log('Checking for default admin account...');

    // Check if admin already exists
    const adminExists = await User.findOne({
      $or: [
        { email: 'kavadparth54@gmail.com' },
        { role: 'admin' }
      ]
    });

    if (adminExists) {
      console.log('Admin account already exists. Skipping seed.');
      // Only close connection if we opened it (standalone mode)
      if (!isConnected) {
        await mongoose.connection.close();
      }
      return;
    }

    // Create default admin
    const admin = new User({
      employeeId: 'ADMIN001',
      email: 'kavadparth54@gmail.com',
      password: 'Parth#2005',
      role: 'admin',
      mustChangePassword: false,
      personalDetails: {
        firstName: 'Admin',
        lastName: 'User'
      },
      jobDetails: {
        department: 'Administration',
        position: 'System Administrator',
        employmentType: 'Full-time'
      }
    });

    await admin.save();
    console.log('✅ Default admin account created successfully!');
    console.log('   Email: kavadparth54@gmail.com');
    console.log('   Password: Parth#2005');
    console.log('   Employee ID: ADMIN001');

    // Only close connection if we opened it (standalone mode)
    if (!isConnected) {
      await mongoose.connection.close();
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
    // Only close connection if we opened it (standalone mode)
    const isConnected = mongoose.connection.readyState === 1;
    if (!isConnected) {
      await mongoose.connection.close();
    }
    // Don't exit process if called from server.js
    if (require.main === module) {
      process.exit(1);
    }
    throw error; // Re-throw so server.js can handle it
  }
};

// Run if called directly
if (require.main === module) {
  seedAdmin();
}

module.exports = seedAdmin;

