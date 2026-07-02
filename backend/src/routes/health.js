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
    
    // 3. Run yt-dlp direct format diagnosis
    const watchUrl = 'https://www.youtube.com/watch?v=1FHOMM5As0w';
    const cmd = `yt-dlp --no-update --no-warnings --dump-json --no-download --no-playlist --no-cache-dir --extractor-args "youtube:player_client=all" --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" --proxy "${actualProxy}" "${watchUrl}"`;
    const ytdlpOutput = execSync(cmd, { encoding: 'utf8', timeout: 40000 });
    
    const info = JSON.parse(ytdlpOutput);
    const formatsCount = info.formats?.length || 0;
    const audioFormats = (info.formats || []).filter(f => f.acodec !== 'none' && f.vcodec === 'none');
    const languages = [...new Set(audioFormats.map(f => f.language || 'default'))];
    
    res.json({
      success: true,
      ipInfo,
      diagnostics: {
        resolvedProxy: actualProxy,
        title: info.title,
        totalFormats: formatsCount,
        audioFormatsCount: audioFormats.length,
        languages
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
