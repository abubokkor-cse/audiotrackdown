const express = require('express');
const { extractAudioTracks } = require('../services/ytdlp');
const { validateVideoUrl } = require('../middleware/validate');
const { extractionLimiter } = require('../middleware/rateLimit');

const router = express.Router();

/**
 * POST /api/extract
 * Extract all available audio tracks from a YouTube or Facebook video
 */
router.post('/', extractionLimiter, validateVideoUrl, async (req, res) => {
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

module.exports = router;
