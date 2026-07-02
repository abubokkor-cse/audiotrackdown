const express = require('express');
const router = express.Router();
const { URL } = require('url');
const { spawn, execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const config = require('../config');
const subtitleService = require('../services/subtitleService');

/**
 * Resolves the rotating proxy URL, automatically transforming HTTP to SOCKS5h
 * to force remote DNS resolution on headless environments.
 */
function getProxyUrl() {
  const rawProxy = process.env.ROTATING_PROXIES;
  if (!rawProxy) return null;
  
  // If it's a DataImpulse HTTP proxy, convert it to SOCKS5h to force remote DNS resolution
  if (rawProxy.includes('gw.dataimpulse.com:823')) {
    return rawProxy
      .replace(/^http:\/\//i, 'socks5h://')
      .replace(':823', ':824');
  }
  
  // If SOCKS5 is already set, upgrade it to socks5h
  if (rawProxy.startsWith('socks5://')) {
    return rawProxy.replace(/^socks5:\/\//i, 'socks5h://');
  }
  
  return rawProxy;
}


// ── Resolve the newest yt-dlp binary ─────────────────────────────────────────
const YTDLP_CANDIDATES = [
  '/Library/Frameworks/Python.framework/Versions/3.12/bin/yt-dlp',
  '/Library/Frameworks/Python.framework/Versions/3.11/bin/yt-dlp',
  '/usr/local/bin/yt-dlp',
  '/opt/homebrew/bin/yt-dlp',
  'yt-dlp', // PATH fallback
];

function resolveYtdlpBin() {
  for (const candidate of YTDLP_CANDIDATES) {
    try {
      const v = execSync(`"${candidate}" --version 2>/dev/null`, { timeout: 3000 })
        .toString().trim();
      // Accept any 2026.6.0+ build (fixes the 429 impersonation support)
      const parts = v.split('.').map(Number);
      const score = (parts[0] || 0) * 10000 + (parts[1] || 0) * 100 + (parts[2] || 0);
      if (score >= 2026060) {
        console.log(`[subtitle] Using yt-dlp: ${candidate} (${v})`);
        return candidate;
      }
    } catch { /* not found or too old, try next */ }
  }
  console.warn('[subtitle] Could not find yt-dlp >= 2026.6.0, falling back to PATH');
  return 'yt-dlp';
}

const YTDLP_BIN = resolveYtdlpBin();

// ── Route: GET /api/subtitle/download ────────────────────────────────────────
/**
 * Downloads YouTube subtitles via yt-dlp and returns cleaned VTT/SRT content.
 * Query params:
 *   url      - YouTube watch URL  e.g. https://www.youtube.com/watch?v=xyz
 *   lang     - Language code      e.g. en, es, fr  (default: en)
 *   filename - Base filename for Content-Disposition (optional)
 *   fmt      - Output format: vtt | srt | json    (default: vtt)
 */
router.get('/download', async (req, res) => {
  const { url, filename, lang, fmt: fmtParam } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const allowedHosts = ['www.youtube.com', 'youtube.com', 'youtu.be'];
  const isFbCdn = parsedUrl.hostname.endsWith('.fbcdn.net') || parsedUrl.hostname === 'fbcdn.net';

  if (!allowedHosts.includes(parsedUrl.hostname) && !isFbCdn) {
    return res.status(403).json({ error: 'Only YouTube and Facebook subtitle URLs are allowed' });
  }

  const langCode = lang || parsedUrl.searchParams.get('tlang') || parsedUrl.searchParams.get('lang') || 'en';
  if (typeof langCode !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(langCode)) {
    return res.status(400).json({ error: 'Invalid language code parameter' });
  }

  const fmt      = fmtParam || parsedUrl.searchParams.get('fmt') || 'vtt';
  const ext      = isFbCdn
    ? (url.includes('.srt') ? 'srt' : 'vtt')
    : (fmt === 'srt' || fmt === 'srv1' ? 'srt' : fmt === 'json' || fmt === 'json3' ? 'json' : 'vtt');

  const safeFilename = filename
    ? `${filename.replace(/[^a-zA-Z0-9\-_. ]/g, '_')}.${ext}`
    : `subtitle-${langCode}.${ext}`;

  // ── Facebook CDN — simple fetch ───────────────────────────────────────────
  if (isFbCdn) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        },
      });
      if (!response.ok) throw new Error(`FB CDN ${response.status}`);
      const text = await response.text();
      const contentType = ext === 'vtt' ? 'text/vtt; charset=utf-8' : 'text/srt; charset=utf-8';
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'no-cache');
      return res.send(text);
    } catch (err) {
      console.error('[subtitle] FB CDN error:', err.message);
      return res.status(500).json({ error: 'Failed to download subtitle from Facebook' });
    }
  }

  // ── YouTube via yt-dlp ────────────────────────────────────────────────────
  // Support both youtube.com/watch?v= and youtu.be/ID short URLs
  let videoId = parsedUrl.searchParams.get('v');
  if (!videoId && parsedUrl.hostname === 'youtu.be') {
    videoId = parsedUrl.pathname.slice(1).split('?')[0]; // strip leading /
  }
  if (!videoId) {
    return res.status(400).json({ error: 'Could not extract video ID from URL' });
  }
  if (typeof videoId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(videoId)) {
    return res.status(400).json({ error: 'Invalid video ID parameter' });
  }

  let rawVtt;
  let usePythonFallback = false;

  const tempDir = path.join(os.tmpdir(), `yt-subs-${crypto.randomBytes(8).toString('hex')}`);
  try {
    await fs.mkdir(tempDir, { recursive: true });
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Build yt-dlp argument list for a given strategy
    const buildArgs = ({ useCookies = false, useImpersonate = true } = {}) => {
      const args = [
        '--no-update',             // suppress version nag
        '--no-warnings',           // quiet output
        '--write-subs',
        '--write-auto-subs',
        '--sub-langs', langCode,
        '--skip-download',
        '--output', path.join(tempDir, 'sub'),
        // Mimic a real browser
        '--add-header', 'Accept-Language:en-US,en;q=0.9',
        '--add-header', 'Accept:text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        '--sleep-requests', '1',   // throttle to avoid 429
        '--extractor-args', 'youtube:skip=hls,dash',
      ];

      if (useImpersonate) {
        args.push('--impersonate', 'chrome');
      }

      if (useCookies) {
        args.push('--cookies-from-browser', 'chrome');
      }

      const proxyUrl = getProxyUrl();
      if (proxyUrl) {
        args.push('--proxy', proxyUrl);
      }
      args.push('--no-cache-dir');

      args.push(watchUrl);
      return args;
    };

    // Wrap yt-dlp spawn in a Promise
    const runYtdlp = (args) => new Promise((resolve, reject) => {
      const proc = spawn(YTDLP_BIN, args, { env: { ...process.env } });

      let stderr = '';
      proc.stderr.on('data', d => { stderr += d.toString(); });

      const timer = setTimeout(() => {
        proc.kill('SIGTERM');
        reject(new Error('yt-dlp process timed out'));
      }, config.ytdlp?.timeoutMs || 45000);

      proc.on('close', code => {
        clearTimeout(timer);
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`yt-dlp subtitle failed: ${stderr.trim()}`));
        }
      });

      proc.on('error', err => {
        clearTimeout(timer);
        reject(err);
      });
    });

    // Try four strategies in order — stop at first success
    const strategies = [
      { useCookies: false, useImpersonate: true,  label: 'impersonate'          },
      { useCookies: true,  useImpersonate: true,  label: 'cookies+impersonate'  },
      { useCookies: true,  useImpersonate: false, label: 'cookies-only'         },
      { useCookies: false, useImpersonate: false, label: 'plain'                },
    ];

    let lastError = null;
    for (const strategy of strategies) {
      try {
        await runYtdlp(buildArgs(strategy));
        console.log(`[subtitle] ✓ Strategy "${strategy.label}" succeeded`);
        lastError = null;
        break;
      } catch (err) {
        const brief = err.message.split('\n')[0].substring(0, 120);
        console.warn(`[subtitle] ✗ Strategy "${strategy.label}" failed: ${brief}`);
        lastError = err;
        // Wipe partial files before next attempt
        try {
          const existing = await fs.readdir(tempDir);
          for (const f of existing) await fs.unlink(path.join(tempDir, f)).catch(() => {});
        } catch { /* ignore */ }
      }
    }

    if (lastError) throw lastError;

    // Find the subtitle file yt-dlp wrote
    const files = await fs.readdir(tempDir);
    const subFile = files.find(f => f.startsWith('sub.') && f.endsWith('.vtt'));
    if (!subFile) {
      throw new Error('No VTT subtitle file found in output — video may not have subtitles in the requested language');
    }

    rawVtt = await fs.readFile(path.join(tempDir, subFile), 'utf8');
    console.log(`[subtitle] ✓ yt-dlp fetch succeeded for video: ${videoId}`);

  } catch (err) {
    console.warn(`[subtitle] ✗ yt-dlp fetch failed: ${err.message}. Falling back to Python InnerTube API...`);
    usePythonFallback = true;
  } finally {
    // Always clean up temp directory
    try {
      const files = await fs.readdir(tempDir).catch(() => []);
      for (const f of files) await fs.unlink(path.join(tempDir, f)).catch(() => {});
      await fs.rmdir(tempDir).catch(() => {});
    } catch { /* ignore */ }
  }

  if (usePythonFallback) {
    try {
      rawVtt = await subtitleService.fetchYouTubeSubtitles(videoId, langCode);
      console.log(`[subtitle] ✓ Python InnerTube fallback succeeded for video: ${videoId}`);
    } catch (innerTubeErr) {
      console.error('[subtitle] Both yt-dlp and Python InnerTube fallback failed.');
      const msg = innerTubeErr.message || '';
      if (msg.includes('429') || msg.includes('Too Many Requests')) {
        return res.status(503).json({
          error: 'YouTube is rate-limiting right now. Please wait 30–60 seconds and try again.',
        });
      }
      if (msg.includes('timed out')) {
        return res.status(504).json({
          error: 'Subtitle download timed out. Try again in a moment.',
        });
      }
      if (msg.includes('No transcripts found') || msg.includes('Subtitle file for language')) {
        return res.status(404).json({
          error: 'No subtitles found for this video in the requested language.',
        });
      }
      return res.status(500).json({
        error: `Failed to fetch subtitles: ${msg.split('\n')[0].substring(0, 200)}`,
      });
    }
  }

  try {
    const cleanedCues = parseAndCleanVtt(rawVtt);

    let responseContent, contentType;
    if (ext === 'srt') {
      contentType     = 'text/srt; charset=utf-8';
      responseContent = formatToSrt(cleanedCues);
    } else if (ext === 'json') {
      contentType     = 'application/json; charset=utf-8';
      responseContent = JSON.stringify({ cues: cleanedCues }, null, 2);
    } else {
      contentType     = 'text/vtt; charset=utf-8';
      responseContent = formatToVtt(cleanedCues);
    }

    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-cache');
    return res.send(responseContent);

  } catch (err) {
    console.error('[subtitle] Final error:', err.message);
    return res.status(500).json({
      error: `Failed to parse subtitles: ${err.message}`,
    });
  }

});

// ── VTT parser / cleaner ─────────────────────────────────────────────────────
/**
 * Parses raw VTT, strips HTML tags, removes duplicate cues from
 * YouTube's rolling-caption format.
 */
function parseAndCleanVtt(vttText) {
  const lines     = vttText.split(/\r?\n/);
  const cues      = [];
  const timeRegex = /(\d{2}:)?\d{2}:\d{2}\.\d{3}/;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.includes('-->')) {
      const parts      = line.split('-->');
      const startMatch = parts[0].match(timeRegex);
      const endMatch   = parts[1].match(timeRegex);
      if (startMatch && endMatch) {
        let start = startMatch[0];
        let end   = endMatch[0];
        if (start.split(':').length === 2) start = '00:' + start;
        if (end.split(':').length   === 2) end   = '00:' + end;

        const textLines = [];
        i++;
        while (i < lines.length && !lines[i].includes('-->')) {
          const clean = lines[i].trim().replace(/<[^>]+>/g, '').trim();
          if (clean) textLines.push(clean);
          i++;
        }

        // Remove internal duplicates
        const unique = [];
        for (const tl of textLines) {
          if (unique.length === 0 || unique[unique.length - 1] !== tl) unique.push(tl);
        }
        const text = unique.join('\n');
        if (text) cues.push({ start, end, text });
        continue;
      }
    }
    i++;
  }

  // Remove cross-cue overlapping text (YouTube's rolling auto-captions)
  const cleaned = [];
  for (const cue of cues) {
    if (cleaned.length === 0) {
      cleaned.push(cue);
      continue;
    }
    const prev         = cleaned[cleaned.length - 1];
    const prevLines    = prev.text.split('\n');
    let   curLines     = cue.text.split('\n');

    if (prev.text === cue.text) {
      prev.end = cue.end; // extend end time of identical cue
      continue;
    }

    let overlap = 0;
    for (let len = Math.min(prevLines.length, curLines.length); len > 0; len--) {
      if (prevLines.slice(-len).join('\n') === curLines.slice(0, len).join('\n')) {
        overlap = len;
        break;
      }
    }
    if (overlap > 0) curLines = curLines.slice(overlap);

    const newText = curLines.join('\n').trim();
    if (newText) {
      cleaned.push({ start: cue.start, end: cue.end, text: newText });
    } else {
      prev.end = cue.end;
    }
  }

  return cleaned;
}

function formatToVtt(cues) {
  let out = 'WEBVTT\n\n';
  for (const c of cues) out += `${c.start} --> ${c.end}\n${c.text}\n\n`;
  return out.trim() + '\n';
}

function formatToSrt(cues) {
  let out = '';
  cues.forEach((c, i) => {
    out += `${i + 1}\n${c.start.replace('.', ',')} --> ${c.end.replace('.', ',')}\n${c.text}\n\n`;
  });
  return out.trim() + '\n';
}

module.exports = router;
