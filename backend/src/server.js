const express = require('express');
const config = require('./config');
const { setupSecurity } = require('./middleware/security');
const { generalLimiter } = require('./middleware/rateLimit');

// Debug: log proxy environment variables to detect conflicts
Object.keys(process.env).forEach(key => {
  if (key.toLowerCase().includes('proxy') || key.toLowerCase().includes('agent')) {
    console.log(`[env] ${key}: ${process.env[key] ? 'SET' : 'EMPTY'}`);
  }
});

// Import routes
const extractRoutes = require('./routes/extract');
const downloadRoutes = require('./routes/download');
const healthRoutes = require('./routes/health');
const subtitleRoutes = require('./routes/subtitle');

const app = express();

// Trust Railway's reverse proxy (fixes express-rate-limit X-Forwarded-For error)
app.set('trust proxy', 1);

// ── Security ──────────────────────────────────────────────────────────
setupSecurity(app);

// ── Body parsing ──────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// ── General rate limit ────────────────────────────────────────────────
app.use(generalLimiter);

// ── Secret token verification ─────────────────────────────────────────
// SECURITY: never use a weak default in production. Fail fast if unset.
const isProdSecure = config.nodeEnv === 'production';
const backendSecret = process.env.BACKEND_SECRET || (isProdSecure ? null : 'dev-shared-secret');
if (isProdSecure && !process.env.BACKEND_SECRET) {
  console.error('❌ FATAL: BACKEND_SECRET environment variable is required in production.');
  process.exit(1);
}

// Paths that require the shared secret on EVERY method (including GET).
// These expose diagnostics / proxy details and must not be public.
const SECRET_REQUIRED_PATHS = [
  '/api/health/proxy-test',
  '/api/health/verbose-test',
];

app.use((req, res, next) => {
  const headerSecret = req.headers['x-backend-secret'];

  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  const isProtectedGet = SECRET_REQUIRED_PATHS.some((p) => req.path.startsWith(p));

  if ((isMutating || isProtectedGet) && headerSecret !== backendSecret) {
    return res.status(401).json({ error: 'Unauthorized backend access.' });
  }
  next();
});

// ── Routes ────────────────────────────────────────────────────────────
app.use('/api/extract', extractRoutes);
app.use('/api/download', downloadRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/subtitle', subtitleRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ── Error handler ─────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('❌ Unhandled error:', err.message);
  res.status(500).json({
    error: config.nodeEnv === 'development' ? err.message : 'Internal server error.',
  });
});

// ── Start server ──────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log('\n' + '═'.repeat(60));
  console.log('  🎵  audiotrackdown — Backend Server');
  console.log('═'.repeat(60));
  console.log(`  🚀  Running on: http://localhost:${config.port}`);
  console.log(`  🌍  Environment: ${config.nodeEnv}`);
  console.log(`  🔒  CORS origin: ${config.frontendUrl}`);
  console.log(`  ⏱️   Rate limit: ${config.rateLimit.maxRequests} req / ${config.rateLimit.windowMs / 60000} min`);
  console.log('═'.repeat(60) + '\n');
});

module.exports = app;
