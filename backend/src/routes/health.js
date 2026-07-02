const express = require('express');
const router = express.Router();

/**
 * GET /api/health
 * Health check endpoint
 */
const { execSync } = require('child_process');

router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'audiotrackdown Backend',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

router.get('/proxy-test', (req, res) => {
  try {
    const proxy = process.env.ROTATING_PROXIES;
    if (!proxy) {
      return res.json({ success: false, error: 'ROTATING_PROXIES environment variable not set' });
    }
    
    // 1. Check IP address
    const ipOutput = execSync(`curl -s -L --proxy "${proxy}" https://ipinfo.io/json`, { encoding: 'utf8', timeout: 5000 });
    const ipInfo = JSON.parse(ipOutput);
    
    // 2. Resolve proxy to SOCKS5h if it is DataImpulse
    let actualProxy = proxy;
    if (proxy.includes('gw.dataimpulse.com:823')) {
      actualProxy = proxy.replace(/^http:\/\//i, 'socks5h://').replace(':823', ':824');
    }
    
    // 3. Run yt-dlp direct format diagnosis with Chrome TLS impersonation
    const watchUrl = 'https://www.youtube.com/watch?v=1FHOMM5As0w';
    const cmd = `yt-dlp --no-update --no-warnings --dump-json --no-download --no-playlist --no-cache-dir --impersonate "chrome" --extractor-args "youtube:player_client=all" --proxy "${actualProxy}" "${watchUrl}"`;
    
    let ytdlpOutput = '';
    let ytdlpStderr = '';
    try {
      ytdlpOutput = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 40000 });
    } catch (e) {
      ytdlpOutput = e.stdout?.toString() || '';
      ytdlpStderr = e.stderr?.toString() || e.message;
    }
    
    let info = {};
    let parseError = null;
    try {
      info = JSON.parse(ytdlpOutput || '{}');
    } catch (err) {
      parseError = err.message;
    }
    
    const formatsCount = info.formats?.length || 0;
    const audioFormats = (info.formats || []).filter(f => f.acodec !== 'none' && f.vcodec === 'none');
    const languages = [...new Set(audioFormats.map(f => f.language || 'default'))];
    
    res.json({
      success: true,
      ipInfo,
      diagnostics: {
        resolvedProxy: actualProxy,
        title: info.title || 'PARSE_FAILED',
        totalFormats: formatsCount,
        audioFormatsCount: audioFormats.length,
        languages,
        parseError,
        rawOutputLength: ytdlpOutput.length,
        stderr: ytdlpStderr
      }
    });
  } catch (err) {
    res.json({
      success: false,
      proxyConfigured: !!process.env.ROTATING_PROXIES,
      error: err.message,
      stderr: err.stderr?.toString()
    });
  }
});

module.exports = router;
