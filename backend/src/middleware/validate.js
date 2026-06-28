/**
 * Input validation and sanitization middleware
 */

const YOUTUBE_URL_PATTERN = /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}/;
const FACEBOOK_URL_PATTERN = /^https?:\/\/(www\.|web\.|m\.)?(facebook\.com|fb\.watch|fb\.gg)\/.+/;

/**
 * Validate and sanitize Video URL (YouTube or Facebook)
 */
function validateVideoUrl(req, res, next) {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Please provide a valid video URL.' });
  }

  const trimmedUrl = url.trim();

  // Length check
  if (trimmedUrl.length > 500) {
    return res.status(400).json({ error: 'URL is too long.' });
  }

  // Check for potentially malicious patterns
  const dangerousPatterns = [
    /javascript:/i,
    /data:/i,
    /<script/i,
    /on\w+\s*=/i,
    /\.\.\//,
    /%2e%2e/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmedUrl)) {
      return res.status(400).json({ error: 'Invalid URL format.' });
    }
  }

  const isYouTube = YOUTUBE_URL_PATTERN.test(trimmedUrl);
  const isFacebook = FACEBOOK_URL_PATTERN.test(trimmedUrl);

  // Validate URL pattern
  if (!isYouTube && !isFacebook) {
    return res.status(400).json({
      error: 'Only YouTube and Facebook URLs are supported. Please paste a valid video URL.',
    });
  }

  // Sanitize — only keep the essential URL parts
  try {
    const parsed = new URL(trimmedUrl);
    const allowedHosts = [
      'youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com',
      'facebook.com', 'www.facebook.com', 'web.facebook.com', 'm.facebook.com',
      'fb.watch', 'fb.gg'
    ];
    if (!allowedHosts.includes(parsed.hostname)) {
      return res.status(400).json({ error: 'Only YouTube and Facebook URLs are supported.' });
    }
    req.body.url = trimmedUrl;
  } catch {
    return res.status(400).json({ error: 'Invalid URL format.' });
  }

  next();
}

/**
 * Validate format ID (alphanumeric + dash/underscore only)
 */
function validateFormatId(req, res, next) {
  const { formatId } = req.body;

  if (formatId && typeof formatId === 'string') {
    if (!/^[a-zA-Z0-9_-]{1,25}$/.test(formatId)) {
      return res.status(400).json({ error: 'Invalid format ID.' });
    }
  }

  next();
}

module.exports = { validateVideoUrl, validateFormatId };
