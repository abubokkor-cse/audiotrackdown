const rateLimit = require('express-rate-limit');
const config = require('../config');

/**
 * Rate limiters for different endpoints
 */

// General API rate limit: 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.nodeEnv === 'development' ? 999999 : config.rateLimit.maxRequests * 2,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please try again later.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
  },
});

// Extraction-specific rate limit: 50 per 15 minutes (more expensive operation)
const extractionLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.nodeEnv === 'development' ? 999999 : config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many extraction requests. Please wait before trying again.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
  },
});

// Download rate limit: 200 per 15 minutes
const downloadLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.nodeEnv === 'development' ? 999999 : config.rateLimit.maxRequests * 4,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many download requests. Please wait before trying again.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
  },
});

module.exports = { generalLimiter, extractionLimiter, downloadLimiter };
