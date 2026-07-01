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
    // --- GUEST USER LIMITS (UNLIMITED) ---
    req.userTier = 'free';
    req.quotaLimits = {
      maxFileSize: 10.0 * 1024 * 1024 * 1024, // 10 GB
      maxDurationSeconds: 24 * 60 * 60,       // 24 hours
      maxConcurrentJobs: 999
    };

    next();
  } else {
    // --- REGISTERED SUBSCRIBER LIMITS (UNLIMITED) ---
    let user = db.getUser(req.user.uid);
    if (!user) {
      user = db.upsertUser(req.user.uid, req.user.email, 'free');
    }

    const currentLimits = {
      maxFileSize: 10.0 * 1024 * 1024 * 1024, // 10 GB
      maxDurationSecs: 24 * 60 * 60,         // 24 hours
      maxConcurrent: 999
    };

    // 4. Device Session Concurrency Verification (Bypassed / Kept for logging)
    const deviceFingerprint = req.headers['x-device-fingerprint'] || req.query.deviceFingerprint;
    if (deviceFingerprint) {
      db.registerSession(user.id, deviceFingerprint, ip);
      db.cleanExpiredSessions(user.id, currentLimits.maxConcurrent);
      db.updateSessionActivity(user.id, deviceFingerprint);
    }

    // 5. Daily Processing Limits (Disabled - Unlimited)
    // 6. Monthly Quota Checks (Disabled - Unlimited)

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
