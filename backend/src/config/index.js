require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 50,
  },
  ytdlp: {
    timeoutMs: parseInt(process.env.YTDLP_TIMEOUT_MS, 10) || 90000,
    // How many yt-dlp strategies to run at once. Each process can use
    // ~50-100MB RAM, so keep this conservative on memory-constrained hosts
    // (e.g. Railway free tier = 512MB). Default 2 is safe for the free tier;
    // raise to 3–5 on higher-memory plans.
    maxParallelStrategies: parseInt(process.env.YTDLP_MAX_PARALLEL_STRATEGIES, 10) || 2,
  },
};
