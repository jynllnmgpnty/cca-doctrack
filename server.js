const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDB, checkHealth } = require('./db');
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

// REST API Health-Check Endpoint
app.get('/api/health', async (req, res) => {
  const health = await checkHealth();

  res.status(health.connected ? 200 : 503).json({
    status: health.connected ? 'UP' : 'DOWN',
    service: 'CCA DocTrack API',
    uptime: `${Math.floor(process.uptime())}s`,
    database: {
      status: health.connected ? 'Connected' : 'Disconnected',
      type: 'Turso Cloud Database (libSQL)',
      mode: health.mode || 'Offline',
      description: health.connected
        ? `Connected to ${health.mode}`
        : 'Not connected to database. Check TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env'
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
  console.log('🎓 CCA DocTrack - Christ Centered Academy of Lipa City Inc.');
  console.log('🏛️ Student Document Request Tracking System (Turso Cloud / libSQL)');
  console.log(`🚀 Server running on port: ${PORT}`);
  console.log(`🌐 Local Web App URL:      http://localhost:${PORT}`);
  console.log(`🩺 Health-Check Endpoint:  http://localhost:${PORT}/api/health`);
  console.log(`📦 REST API Base:          http://localhost:${PORT}/api/requests`);
  console.log('========================================================');

  // Initialize Turso tables and default records automatically
  try {
    await initDB();
  } catch (error) {
    console.error('⚠️ Database initialization warning:', error.message);
  }
});
