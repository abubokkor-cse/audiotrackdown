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
app.use((req, res, next) => {
  const backendSecret = process.env.BACKEND_SECRET || 'shared-secret';
  const headerSecret = req.headers['x-backend-secret'];
  
  if (req.method === 'POST' && headerSecret !== backendSecret) {
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
