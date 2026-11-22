const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const requestRoutes = require('./routes/requestRoutes');
const authRoutes = require('./routes/authRoutes');

// Initialize Express Application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware configuration
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection Logic
const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Connect to MongoDB Atlas
 */
const connectDB = async () => {
  if (!MONGODB_URI || MONGODB_URI.includes('<username>') || MONGODB_URI.includes('your_mongodb_connection_string')) {
    console.warn('\n⚠️  WARNING: MONGODB_URI is not properly configured in the .env file.');
    console.warn('👉 Please update .env with your actual MongoDB Atlas connection string.\n');
    return;
  }

  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Successfully connected to MongoDB Atlas database!');
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error.message);
    console.error('👉 Tip: Check your database username, password, and Network Access IP whitelist (allow 0.0.0.0/0 on Atlas).\n');
  }
};

// Mongoose connection event listeners
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected successfully.');
});

// REST API Health-Check Endpoint
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  res.status(200).json({
    status: 'UP',
    service: 'CCA DocTrack API',
    uptime: `${Math.floor(process.uptime())}s`,
    database: {
      status: isDbConnected ? 'Connected' : 'Disconnected',
      stateCode: mongoose.connection.readyState,
      description: isDbConnected
        ? 'Connected to MongoDB Atlas'
        : 'Not connected to database. Check MONGODB_URI in .env'
    },
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);

// Fallback route for unmatched API requests (404)
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`
  });
});

// Serve frontend index.html for root or client routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the Express Server
app.listen(PORT, async () => {
  console.log('========================================================');
  console.log('🎓 CCA DocTrack - Cloud-Based Student Document Tracking');
  console.log(`🚀 Server running on port: ${PORT}`);
  console.log(`🌐 Local Web App URL:      http://localhost:${PORT}`);
  console.log(`🩺 Health-Check Endpoint:  http://localhost:${PORT}/api/health`);
  console.log(`📦 REST API Base:          http://localhost:${PORT}/api/requests`);
  console.log('========================================================');

  // Attempt database connection
  await connectDB();
});
