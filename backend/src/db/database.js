const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../database.db');
const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    plan_type TEXT DEFAULT 'free', -- 'free', 'starter', 'creator', 'pro', 'business'
    paddle_subscription_id TEXT,
    credits INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS usage_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    ip_address TEXT NOT NULL,
    action_type TEXT NOT NULL, -- 'tts', 'transcribe', 'dubbing'
    character_count INTEGER DEFAULT 0,
    duration_seconds REAL DEFAULT 0.0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS active_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    device_fingerprint TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    last_active_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Run dynamic schema migrations to add telemetry columns to usage_logs safely
try {
  db.exec("ALTER TABLE usage_logs ADD COLUMN engine TEXT DEFAULT 'edge';");
} catch (e) {
  // Column already exists or table issue
}
try {
  db.exec("ALTER TABLE usage_logs ADD COLUMN error_message TEXT;");
} catch (e) {
  // Column already exists or table issue
}
try {
  db.exec("ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 0;");
} catch (e) {
  // Column already exists or table issue
}

// Create indices for lightning fast aggregation
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_usage_logs_user ON usage_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_usage_logs_ip_date ON usage_logs(ip_address, created_at);
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON active_sessions(user_id);
`);

/**
 * Upsert user record (linked to Firebase UID)
 */
function upsertUser(id, email, planType = 'free', paddleSubscriptionId = null, credits = 0) {
  const stmt = db.prepare(`
    INSERT INTO users (id, email, plan_type, paddle_subscription_id, credits, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      email = excluded.email,
      plan_type = COALESCE(excluded.plan_type, plan_type),
      paddle_subscription_id = COALESCE(excluded.paddle_subscription_id, paddle_subscription_id)
  `);
  stmt.run(id, email, planType, paddleSubscriptionId, credits, Date.now());
  return getUser(id);
}

function getUser(id) {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id);
}

function updateUserPlan(id, planType, paddleSubscriptionId) {
  const stmt = db.prepare(`
    UPDATE users 
    SET plan_type = ?, paddle_subscription_id = ?
    WHERE id = ?
  `);
  stmt.run(planType, paddleSubscriptionId, id);
  return getUser(id);
}

function setUserCredits(id, credits) {
  const stmt = db.prepare('UPDATE users SET credits = ? WHERE id = ?');
  stmt.run(credits, id);
  return getUser(id);
}

function adjustUserCredits(id, amount) {
  const stmt = db.prepare('UPDATE users SET credits = MAX(0, credits + ?) WHERE id = ?');
  stmt.run(amount, id);
  return getUser(id);
}

/**
 * Logs usage of transcription, translation, or text to speech
 */
function logUsage(userId, ipAddress, actionType, characterCount, durationSeconds, engine = 'edge', errorMessage = null) {
  const id = crypto.randomUUID();
  const stmt = db.prepare(`
    INSERT INTO usage_logs (id, user_id, ip_address, action_type, character_count, duration_seconds, engine, error_message, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, userId || null, ipAddress, actionType, characterCount, durationSeconds, engine, errorMessage, Date.now());
}

/**
 * Returns daily aggregate usage of an anonymous guest IP (last 24 hours)
 */
function getIpUsage24h(ipAddress) {
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  
  const totalConversions = db.prepare(`
    SELECT COUNT(*) as count 
    FROM usage_logs 
    WHERE ip_address = ? AND user_id IS NULL AND engine != 'failed' AND created_at > ?
  `).get(ipAddress, dayAgo).count;

  const totalDuration = db.prepare(`
    SELECT SUM(duration_seconds) as total 
    FROM usage_logs 
    WHERE ip_address = ? AND user_id IS NULL AND engine != 'failed' AND created_at > ?
  `).get(ipAddress, dayAgo).total || 0;

  const totalCharacters = db.prepare(`
    SELECT SUM(character_count) as total 
    FROM usage_logs 
    WHERE ip_address = ? AND user_id IS NULL AND engine != 'failed' AND created_at > ?
  `).get(ipAddress, dayAgo).total || 0;

  return {
    conversions: totalConversions,
    duration: totalDuration,
    characters: totalCharacters
  };
}

/**
 * Returns monthly aggregate usage for a registered user (last 30 days)
 */
function getUserMonthlyUsage(userId) {
  const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  const totalDubbing = db.prepare(`
    SELECT SUM(duration_seconds) as total 
    FROM usage_logs 
    WHERE user_id = ? AND action_type = 'dubbing' AND engine != 'failed' AND created_at > ?
  `).get(userId, monthAgo).total || 0;

  const totalTranscription = db.prepare(`
    SELECT SUM(duration_seconds) as total 
    FROM usage_logs 
    WHERE user_id = ? AND action_type = 'transcribe' AND engine != 'failed' AND created_at > ?
  `).get(userId, monthAgo).total || 0;

  const totalTTSCharacters = db.prepare(`
    SELECT SUM(character_count) as total 
    FROM usage_logs 
    WHERE user_id = ? AND action_type = 'tts' AND engine != 'failed' AND created_at > ?
  `).get(userId, monthAgo).total || 0;

  return {
    dubbingMinutes: totalDubbing / 60,
    transcriptionMinutes: totalTranscription / 60,
    ttsCharacters: totalTTSCharacters
  };
}

/**
 * Returns daily aggregate usage in minutes for a registered user (last 24 hours)
 */
function getUserDailyUsage(userId) {
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;

  const totalDuration = db.prepare(`
    SELECT SUM(duration_seconds) as total 
    FROM usage_logs 
    WHERE user_id = ? AND engine != 'failed' AND created_at > ?
  `).get(userId, dayAgo).total || 0;

  return totalDuration / 60; // Returns total duration in minutes
}


/**
 * Concurrency tracking: registers a device fingerprint session
 */
function registerSession(userId, deviceFingerprint, ipAddress) {
  const id = crypto.randomUUID();
  
  // Remove existing session for the exact same fingerprint to avoid duplication
  db.prepare('DELETE FROM active_sessions WHERE user_id = ? AND device_fingerprint = ?')
    .run(userId, deviceFingerprint);

  const stmt = db.prepare(`
    INSERT INTO active_sessions (id, user_id, device_fingerprint, ip_address, last_active_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(id, userId, deviceFingerprint, ipAddress, Date.now());
  return id;
}

function getActiveSessions(userId) {
  const stmt = db.prepare('SELECT * FROM active_sessions WHERE user_id = ? ORDER BY last_active_at ASC');
  return stmt.all(userId);
}

function updateSessionActivity(userId, deviceFingerprint) {
  db.prepare(`
    UPDATE active_sessions 
    SET last_active_at = ? 
    WHERE user_id = ? AND device_fingerprint = ?
  `).run(Date.now(), userId, deviceFingerprint);
}

/**
 * Truncate sessions to matching limit (logs out oldest sessions)
 */
function cleanExpiredSessions(userId, limit) {
  const sessions = getActiveSessions(userId);
  if (sessions.length > limit) {
    const toDeleteCount = sessions.length - limit;
    const oldestSessions = sessions.slice(0, toDeleteCount);
    for (const s of oldestSessions) {
      db.prepare('DELETE FROM active_sessions WHERE id = ?').run(s.id);
    }
  }
}

module.exports = {
  db,
  upsertUser,
  getUser,
  updateUserPlan,
  logUsage,
  getIpUsage24h,
  getUserMonthlyUsage,
  getUserDailyUsage,
  registerSession,
  getActiveSessions,
  updateSessionActivity,
  cleanExpiredSessions,
  setUserCredits,
  adjustUserCredits
};
