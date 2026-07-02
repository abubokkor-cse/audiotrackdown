const express = require('express');
const router = express.Router();

/**
 * GET /api/health
 * Health check endpoint
 */
const { execSync } = require('child_process');

router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'audiotrackdown Backend',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

router.get('/proxy-test', (req, res) => {
  try {
    const proxy = process.env.ROTATING_PROXIES;
    if (!proxy) {
      return res.json({ success: false, error: 'ROTATING_PROXIES environment variable not set' });
    }
    const output = execSync(`curl -s -L --proxy "${proxy}" https://ipinfo.io/json`, { encoding: 'utf8', timeout: 10000 });
    res.json({
      success: true,
      proxyConfigured: true,
      ipInfo: JSON.parse(output)
    });
  } catch (err) {
    res.json({
      success: false,
      proxyConfigured: !!process.env.ROTATING_PROXIES,
      error: err.message,
      stderr: err.stderr?.toString()
    });
  }
});

module.exports = router;
