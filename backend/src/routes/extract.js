const express = require('express');
const { extractAudioTracks, clearCache } = require('../services/ytdlp');
const { validateVideoUrl } = require('../middleware/validate');
const { extractionLimiter } = require('../middleware/rateLimit');
const abuseLimiter = require('../middleware/abuseLimiter');

const router = express.Router();

/**
 * POST /api/extract
 * Extract all available audio tracks from a YouTube or Facebook video
 */
router.post('/', abuseLimiter, extractionLimiter, validateVideoUrl, async (req, res) => {
  try {
    const { url } = req.body;
    console.log(`📥 Extract request: ${url.substring(0, 60)}...`);

    const result = await extractAudioTracks(url);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('❌ Extraction error:', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to extract audio tracks.',
    });
  }
});

/**
 * POST /api/extract/clear-cache
 * Clear the in-memory extraction cache (useful after deployments)
 */
router.post('/clear-cache', (req, res) => {
  const cleared = clearCache();
  res.json({ success: true, cleared });
});

module.exports = router;
