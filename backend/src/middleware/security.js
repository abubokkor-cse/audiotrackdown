const helmet = require('helmet');
const cors = require('cors');
const config = require('../config');

/**
 * Security middleware stack
 * - Helmet: Sets HTTP security headers (CSP, X-Frame-Options, HSTS, etc.)
 * - CORS: Restricts cross-origin requests to frontend domain
 * - Request size limiting is handled in server.js via express.json({ limit })
 */
function setupSecurity(app) {
  // Helmet — security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            // Ad network domains
            'https://contextual.media.net',
            'https://www.nitropay.com',
            'https://cdn.nitropay.com',
            'https://www.ezojs.com',
          ],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          connectSrc: ["'self'", config.frontendUrl, 'https://i.ytimg.com'],
          frameSrc: [
            "'self'",
            'https://contextual.media.net',
            'https://www.nitropay.com',
          ],
          mediaSrc: ["'self'", 'blob:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS — restrict to frontend origin
  app.use(
    cors({
      origin: config.nodeEnv === 'development'
        ? ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001']
        : [config.frontendUrl],
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Fingerprint', 'X-Admin-Password', 'X-Admin-2FA-Code'],
      credentials: true,
    })
  );

  // Disable X-Powered-By
  app.disable('x-powered-by');
}

module.exports = { setupSecurity };
