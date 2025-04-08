const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');

// Health check endpoint for connectivity testing
router.get('/healthcheck', (req, res) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'Server is up and running',
    timestamp: new Date().toISOString()
  });
});

// API routes
router.use('/auth', authRoutes);

module.exports = router; 