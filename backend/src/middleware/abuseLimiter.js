const dns = require('dns').promises;
const db = require('../db/database');
const config = require('../config');

// Hosting DNS suffixes to block commercial bot VPNs
const DATACENTER_DOMAINS = [
  'amazonaws.com',
  'googleusercontent.com',
  'azure.com',
  'digitalocean.com',
  'hetzner.com',
  'linode.com',
  'ovh.net',
  'scaleway.com',
  'choopa.com',
  'vultr.com',
  'colocrossing.com',
  'leaseweb.com'
];

/**
 * Helper to run reverse DNS with a timeout so it never blocks API requests
 */
async function reverseDnsWithTimeout(ip, timeoutMs = 1200) {
  const dnsPromise = dns.reverse(ip);
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('DNS Timeout')), timeoutMs)
  );
  return Promise.race([dnsPromise, timeoutPromise]);
}

/**
 * Enforces security and pricing limits across all synthesis and transcription routes
 */
async function abuseLimiter(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const userAgent = req.headers['user-agent'] || '';

  // 1. User Agent Bot Protection
  const botAgents = ['python', 'curl', 'postman', 'httpclient', 'axios', 'headless', 'puppeteer'];
  const uaLower = userAgent.toLowerCase();
  if (botAgents.some(agent => uaLower.includes(agent))) {
    console.warn(`[Abuse Limiter] Blocked Bot User-Agent: "${userAgent}"`);
    return res.status(403).json({ error: 'Automated script/bot access is restricted.' });
  }

  // 2. VPN/Datacenter IP Block (via reverse DNS lookup)
  // Bypass local IP checks for development convenience
  const isLocal = ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127.0.0.1');
  if (!isLocal) {
    try {
      const hostnames = await reverseDnsWithTimeout(ip);
      const isDatacenter = hostnames.some(hostname =>
        DATACENTER_DOMAINS.some(domain => hostname.endsWith(domain))
      );

      if (isDatacenter) {
        console.warn(`[Abuse Limiter] Blocked request from datacenter IP: ${ip} (${hostnames.join(', ')})`);
        return res.status(403).json({ error: 'Access from commercial VPNs or hosting environments is restricted.' });
      }
    } catch (err) {
      // Allow request to proceed if DNS resolves slowly or fails
      if (err.message !== 'DNS Timeout') {
        console.error(`[Abuse Limiter] DNS reverse lookup failed for IP ${ip}:`, err.message);
      }
    }
  }

  // Determine request action type based on path
  let actionType = 'tts';
  if (req.path.includes('transcribe')) {
    actionType = 'transcribe';
  } else if (req.path.includes('subtitle-to-speech') || req.path.includes('dub')) {
    actionType = 'dubbing';
  }

  // 3. User tier identification
  if (!req.user) {
    // --- GUEST USER LIMITS ---
    const stats = db.getIpUsage24h(ip);

    // Limit A: 3 total conversions per day
    if (config.nodeEnv !== 'development' && stats.conversions >= 3) {
      return res.status(429).json({
        error: 'Daily conversion limit reached.',
        code: 'LIMIT_EXCEEDED',
        message: 'You have used your 3 free conversions for today. Sign up or upgrade to get more minutes!'
      });
    }

    // Limit B: 3 minutes daily processing limit (180 seconds)
    if (config.nodeEnv !== 'development' && stats.duration >= 180) {
      return res.status(429).json({
        error: 'Daily time quota exceeded.',
        code: 'LIMIT_EXCEEDED',
        message: 'You have exceeded the 3-minute daily processing limit for free users. Please sign up.'
      });
    }

    // Limit C: 10,000 characters limit
    if (config.nodeEnv !== 'development' && stats.characters >= 10000) {
      return res.status(429).json({
        error: 'Daily character quota exceeded.',
        code: 'LIMIT_EXCEEDED',
        message: 'You have reached the 10,000 characters daily limit. Please sign up to continue.'
      });
    }

    req.userTier = 'free';
    req.quotaLimits = {
      maxFileSize: 100 * 1024 * 1024, // 100 MB
      maxDurationSeconds: 5 * 60,     // 5 minutes
      maxConcurrentJobs: 1
    };

    next();
  } else {
    // --- REGISTERED SUBSCRIBER LIMITS ---
    let user = db.getUser(req.user.uid);
    if (!user) {
      // Automatically register new Firebase user in local SQLite with free/sandbox plan
      user = db.upsertUser(req.user.uid, req.user.email, 'free');
    }

    // Quotas and boundaries config for each plan tier
    const tierConfig = {
      free: {
        maxDubbingMins: 60,
        maxTranscribeMins: 60,
        maxTtsChars: 50000,
        dailyLimitMins: 5,
        maxFileSize: 100 * 1024 * 1024,
        maxDurationSecs: 10 * 60,
        maxConcurrent: 1
      },
      starter: {
        maxDubbingMins: 400,
        maxTranscribeMins: 400,
        maxTtsChars: 500000,
        dailyLimitMins: 120,
        maxFileSize: 500 * 1024 * 1024,
        maxDurationSecs: 30 * 60,
        maxConcurrent: 1
      },
      creator: {
        maxDubbingMins: 800,
        maxTranscribeMins: 800,
        maxTtsChars: 1000000,
        dailyLimitMins: 240,
        maxFileSize: 1.5 * 1024 * 1024 * 1024,
        maxDurationSecs: 60 * 60,
        maxConcurrent: 2
      },
      pro: {
        maxDubbingMins: 2000,
        maxTranscribeMins: 2000,
        maxTtsChars: 3000000,
        dailyLimitMins: 480,
        maxFileSize: 3.0 * 1024 * 1024 * 1024,
        maxDurationSecs: 120 * 60,
        maxConcurrent: 4
      },
      business: {
        maxDubbingMins: 6000,
        maxTranscribeMins: 6000,
        maxTtsChars: 10000000,
        dailyLimitMins: 1440,
        maxFileSize: 10.0 * 1024 * 1024 * 1024,
        maxDurationSecs: 240 * 60,
        maxConcurrent: 8
      },
      admin: {
        maxDubbingMins: 9999999,
        maxTranscribeMins: 9999999,
        maxTtsChars: 999999999,
        dailyLimitMins: 999999,
        maxFileSize: 100 * 1024 * 1024 * 1024,
        maxDurationSecs: 999999,
        maxConcurrent: 999
      },
      unlimited: {
        maxDubbingMins: 9999999,
        maxTranscribeMins: 9999999,
        maxTtsChars: 999999999,
        dailyLimitMins: 999999,
        maxFileSize: 100 * 1024 * 1024 * 1024,
        maxDurationSecs: 999999,
        maxConcurrent: 999
      }
    };

    const currentLimits = tierConfig[user.plan_type] || tierConfig.free;

    // 4. Device Session Concurrency Verification (Credential Sharing Protection)
    const deviceFingerprint = req.headers['x-device-fingerprint'] || req.query.deviceFingerprint;
    if (deviceFingerprint) {
      db.registerSession(user.id, deviceFingerprint, ip);
      db.cleanExpiredSessions(user.id, currentLimits.maxConcurrent);

      // Verify if current session remains active (otherwise it was pushed out by another device)
      const active = db.getActiveSessions(user.id);
      const sessionIsValid = active.some(s => s.device_fingerprint === deviceFingerprint);
      if (!sessionIsValid) {
        return res.status(401).json({
          error: 'Session limit exceeded.',
          code: 'SESSION_LOGOUT',
          message: 'You have been logged out because this account is being used on another device.'
        });
      }
      db.updateSessionActivity(user.id, deviceFingerprint);
    }

    // 5. Daily Processing Limits (Enforced only on Free tier to prevent single-day sandbox exhaustion)
    if (config.nodeEnv !== 'development' && user.plan_type === 'free') {
      const dailyUsageMins = db.getUserDailyUsage(user.id);
      if (dailyUsageMins >= currentLimits.dailyLimitMins) {
        return res.status(429).json({
          error: 'Daily usage quota reached.',
          code: 'LIMIT_EXCEEDED',
          message: `You have reached your daily limit of ${currentLimits.dailyLimitMins} processing minutes. Please try again tomorrow.`
        });
      }
    }

    // 6. Monthly Quota Checks
    const monthlyStats = db.getUserMonthlyUsage(user.id);
    if (config.nodeEnv !== 'development') {
      if (actionType === 'tts') {
        const textLen = (req.body.text || '').length;
        if (user.plan_type === 'free' && monthlyStats.ttsCharacters + textLen > currentLimits.maxTtsChars) {
          return res.status(403).json({
            error: 'Monthly TTS quota exceeded.',
            code: 'QUOTA_EXCEEDED',
            message: `This generation would exceed your monthly TTS quota of ${currentLimits.maxTtsChars.toLocaleString()} characters.`
          });
        }
      } else if (actionType === 'transcribe') {
        if (monthlyStats.transcriptionMinutes >= currentLimits.maxTranscribeMins) {
          return res.status(403).json({
            error: 'Monthly transcription quota exceeded.',
            code: 'QUOTA_EXCEEDED',
            message: `You have reached your monthly transcription limit of ${currentLimits.maxTranscribeMins} minutes.`
          });
        }
      } else if (actionType === 'dubbing') {
        if (user.plan_type === 'free' && monthlyStats.dubbingMinutes >= currentLimits.maxDubbingMins) {
          return res.status(403).json({
            error: 'Monthly dubbing quota exceeded.',
            code: 'QUOTA_EXCEEDED',
            message: `You have reached your monthly dubbing limit of ${currentLimits.maxDubbingMins} minutes.`
          });
        }
      }
    }

    req.userTier = user.plan_type;
    req.userId = user.id;
    req.quotaLimits = {
      maxFileSize: currentLimits.maxFileSize,
      maxDurationSeconds: currentLimits.maxDurationSecs,
      maxConcurrentJobs: currentLimits.maxConcurrent
    };

    next();
  }
}

module.exports = abuseLimiter;
