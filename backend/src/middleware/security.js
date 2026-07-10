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
  let frontendUrl = config.frontendUrl || '';
  if (frontendUrl.endsWith('/')) {
    frontendUrl = frontendUrl.slice(0, -1);
  }

  // Hardcode actual production domains so they are ALWAYS allowed,
  // preventing CORS blocks even if FRONTEND_URL is missing or misconfigured on Railway.
  const productionOrigins = [
    'https://www.audiotrackdown.com',
    'https://audiotrackdown.com'
  ];

  if (frontendUrl && frontendUrl.startsWith('http')) {
    if (!productionOrigins.includes(frontendUrl)) {
      productionOrigins.push(frontendUrl);
    }
    if (frontendUrl.includes('://www.')) {
      const nonWww = frontendUrl.replace('://www.', '://');
      if (!productionOrigins.includes(nonWww)) productionOrigins.push(nonWww);
    } else {
      const www = frontendUrl.replace('://', '://www.');
      if (!productionOrigins.includes(www)) productionOrigins.push(www);
    }
  }

  app.use(
    cors({
      origin: config.nodeEnv === 'development'
        ? ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001']
        : productionOrigins,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Fingerprint', 'X-Admin-Password', 'X-Admin-2FA-Code', 'X-Backend-Secret'],
      credentials: true,
    })
  );

  // Disable X-Powered-By
  app.disable('x-powered-by');
}

module.exports = { setupSecurity };
