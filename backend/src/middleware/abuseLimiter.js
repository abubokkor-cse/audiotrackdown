const dns = require('dns').promises;

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
 * Security middleware: blocks automated bots (by User-Agent) and requests
 * originating from known datacenter/VPN IP ranges (by reverse DNS lookup).
 *
 * Wired into /api/extract, /api/download, and /api/subtitle so abusive
 * scripted traffic is rejected before hitting the expensive yt-dlp/ffmpeg
 * pipeline. Local development IPs are bypassed for convenience.
 */
async function abuseLimiter(req, res, next) {
  const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const ip = rawIp.split(',')[0].trim();
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

  next();
}

module.exports = abuseLimiter;
