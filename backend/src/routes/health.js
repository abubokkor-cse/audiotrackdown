const express = require('express');
const router = express.Router();

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'AudioVerse AI Backend',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

module.exports = router;
