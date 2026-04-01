const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

// SIMPLE CORS - Allow all origins for now (fix properly once working)
app.use(cors());
app.use('/uploads', express.static(uploadsDir));

// Also handle preflight explicitly
app.options('*', cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/leave', require('./routes/leave'));
app.use('/api/payroll', require('./routes/payroll'));
app.use('/api/admin', require('./routes/admin'));

// Health check - MUST work even if MongoDB is down
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Tech Solution HRMS API is running' });
});

// Database connection - NON-BLOCKING
let dbConnected = false;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/techsolution', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    dbConnected = true;
    console.log('✅ MongoDB connected successfully');
    
    // Seed admin after DB connected
    try {
      const seedAdmin = require('./scripts/seedAdmin');
      await seedAdmin();
    } catch (error) {
      console.log('ℹ️  Admin seeding skipped (non-fatal):', error.message);
    }
  } catch (err) {
    dbConnected = false;
    console.error('❌ MongoDB connection failed:', err.message);
    // Don't exit - backend will still serve with limited functionality
    console.log('⚠️  Backend running in degraded mode (MongoDB down)');
  }
};

// Start DB connection in background
connectDB();

// Error handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error('Error:', err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'production' ? undefined : err
  });
});

// For local development only - NOT for Vercel serverless
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export for Vercel serverless
module.exports = app;

