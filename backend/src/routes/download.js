const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { getStreamUrl, YTDLP_BIN, BEST_CHROME_TARGET } = require('../services/ytdlp');
const { validateVideoUrl, validateFormatId } = require('../middleware/validate');
const { downloadLimiter } = require('../middleware/rateLimit');
const abuseLimiter = require('../middleware/abuseLimiter');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Active downloads store (in production use Redis)
const activeDownloads = new Map();

// Temporary directory for prepared downloads
const DOWNLOADS_DIR = path.join(os.tmpdir(), 'atd_prepared_downloads');
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of activeDownloads.entries()) {
    if (now - entry.timestamp > 15 * 60 * 1000) { // 15 mins TTL
      if (entry.filePath && fs.existsSync(entry.filePath)) {
        try {
          fs.unlinkSync(entry.filePath);
          console.log(`🧹 Deleted expired prepared file: ${entry.filePath}`);
        } catch (e) {
          console.error(`❌ Failed to delete expired file ${entry.filePath}:`, e.message);
        }
      }
      activeDownloads.delete(id);
    }
  }
}, 5 * 60 * 1000);

/**
 * Parses progress percentage from yt-dlp logs
 */
function parseProgress(downloadId, message) {
  const download = activeDownloads.get(downloadId);
  if (!download || download.status !== 'processing') return;

  const match = message.match(/\b(\d+(?:\.\d+)?)\s*%/);
  if (match) {
    const percent = Math.round(parseFloat(match[1]));
    // yt-dlp downloading is ~90% of work, ffmpeg is final 10%
    const progress = Math.min(95, Math.max(download.progress || 0, Math.round(percent * 0.95)));
    download.progress = progress;
  }
}

/**
 * Helper to update download status in memory
 */
function updateDownloadStatus(downloadId, status, errorMsg = null, progress = null) {
  const download = activeDownloads.get(downloadId);
  if (!download) return;

  download.status = status;
  if (errorMsg) download.error = errorMsg;
  if (progress !== null) download.progress = progress;
}

/**
 * Starts background download and transcode pipeline
 */
function startBackgroundDownload(downloadId) {
  const download = activeDownloads.get(downloadId);
  if (!download) return;

  const ytdlpArgs = [
    '--no-update',
    '--no-warnings',
    '--no-playlist',
    '--no-cache-dir',
  ];

  if (download.strategyUseImpersonate) {
    ytdlpArgs.push('--impersonate', BEST_CHROME_TARGET);
  }
  if (download.strategyUseUserAgent) {
    ytdlpArgs.push(
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      '--add-header', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      '--add-header', 'Accept-Language: en-US,en;q=0.9'
    );
  }
  const playerClient = download.strategyPlayerClient || 'web';
  ytdlpArgs.push('--extractor-args', `youtube:player_client=${playerClient}`);
  if (download.strategyUseCookies) {
    ytdlpArgs.push('--cookies-from-browser', 'chrome');
  }
  // NOTE: We intentionally do NOT use the proxy here.
  // The proxy (DataImpulse) is only needed for extraction (metadata fetch ~50KB).
  // The actual audio file (3-8MB) downloads directly from YouTube's CDN —
  // routing it through the proxy would waste expensive per-GB proxy bandwidth.
  ytdlpArgs.push('-f', download.formatId);
  ytdlpArgs.push('-o', '-'); // Stream to stdout
  ytdlpArgs.push(download.originalUrl);

  console.log(`🎬 [bg-download] Spawning yt-dlp for download ID: ${downloadId}`);
  const ytdlpProc = spawn(YTDLP_BIN, ytdlpArgs, {
    env: { ...process.env }
  });

  const ffmpegProc = spawn('ffmpeg', [
    '-i', 'pipe:0',             // Read from yt-dlp stdout
    '-vn',
    '-acodec', 'libmp3lame',
    '-ab', '192k',
    '-f', 'mp3',
    '-y',
    download.filePath           // Save to local temp file
  ]);

  ytdlpProc.stdout.pipe(ffmpegProc.stdin);

  ytdlpProc.stderr.on('data', (data) => {
    const msg = data.toString().trim();
    if (msg) {
      parseProgress(downloadId, msg);
      if (msg.includes('ERROR') || msg.includes('Error')) {
        console.error(`[bg-download yt-dlp error]: ${msg}`);
      }
    }
  });

  ytdlpProc.on('error', (err) => {
    console.error(`❌ Background yt-dlp error for ${downloadId}:`, err.message);
    updateDownloadStatus(downloadId, 'error', err.message);
    ffmpegProc.kill('SIGKILL');
  });

  ffmpegProc.on('error', (err) => {
    console.error(`❌ Background FFmpeg error for ${downloadId}:`, err.message);
    updateDownloadStatus(downloadId, 'error', err.message);
    ytdlpProc.kill('SIGKILL');
  });

  ffmpegProc.on('close', (code) => {
    if (code === 0) {
      console.log(`✅ Background transcoding finished: ${downloadId}`);
      updateDownloadStatus(downloadId, 'ready', null, 100);
    } else {
      console.error(`❌ FFmpeg exited with code ${code} for ${downloadId}`);
      updateDownloadStatus(downloadId, 'error', `FFmpeg failed with exit code ${code}`);
      ytdlpProc.kill('SIGKILL');
    }
  });
}

/**
 * POST /api/download/prepare
 * Prepare a download in the background and return a download ID
 */
router.post('/prepare', abuseLimiter, downloadLimiter, validateVideoUrl, validateFormatId, async (req, res) => {
  try {
    const { url, formatId, langName, targetExt } = req.body;
    const downloadId = uuidv4();

    // Get stream URL from yt-dlp
    const streamInfo = await getStreamUrl(url, formatId);
    const finalExt = targetExt || streamInfo.ext;
    const filePath = path.join(DOWNLOADS_DIR, `${downloadId}.${finalExt}`);

    activeDownloads.set(downloadId, {
      status: 'processing',
      progress: 0,
      filePath,
      streamUrl: streamInfo.url,
      originalUrl: url,
      formatId: formatId,
      title: streamInfo.title,
      ext: streamInfo.ext,
      targetExt: finalExt,
      filesize: streamInfo.filesize,
      langName: langName || 'audio',
      timestamp: Date.now(),
      // Strategy metadata
      strategyUseCookies: streamInfo.strategyUseCookies,
      strategyUseImpersonate: streamInfo.strategyUseImpersonate,
      strategyUseUserAgent: streamInfo.strategyUseUserAgent || false,
      strategyPlayerClient: streamInfo.strategyPlayerClient || 'web',
    });

    const safeTitle = streamInfo.title
      .replace(/[/\\?%*:|"<>]/g, '_')
      .substring(0, 100);
    const filename = `${safeTitle} - ${langName || 'audio'}.${finalExt}`;

    console.log(`✅ Preparing download in background: ${downloadId} → ${filename}`);

    // Trigger download in background process
    startBackgroundDownload(downloadId);

    res.json({
      success: true,
      downloadId,
      filename,
      filesize: streamInfo.filesize,
      status: 'processing',
      progress: 0,
    });
  } catch (error) {
    console.error('❌ Download preparation error:', error.message);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to prepare download.',
    });
  }
});

/**
 * GET /api/download/status/:id
 * Check the background download/transcode progress
 */
router.get('/status/:id', (req, res) => {
  const { id } = req.params;
  const download = activeDownloads.get(id);

  if (!download) {
    return res.status(404).json({ error: 'Download expired or invalid.' });
  }

  res.json({
    success: true,
    status: download.status,
    progress: download.progress || 0,
    error: download.error || null,
  });
});

/**
 * GET /api/download/stream/:id
 * Stream the prepared audio file instantly from local storage
 */
router.get('/stream/:id', (req, res) => {
  const { id } = req.params;
  const download = activeDownloads.get(id);

  if (!download) {
    return res.status(404).json({ error: 'Download expired or invalid. Please try again.' });
  }

  const { title, targetExt, ext, langName, filePath, status, error } = download;
  const finalExt = targetExt || ext;

  if (status === 'processing') {
    return res.status(202).json({ error: 'File is still preparing. Please wait.' });
  }

  if (status === 'error') {
    return res.status(500).json({ error: error || 'Failed to transcode audio file.' });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Prepared file not found on server disk. Please try again.' });
  }

  // URL-encode filename for Content-Disposition
  const safeTitle = title.replace(/[/\\?%*:|"<>]/g, '_').substring(0, 100);
  const filename = `${safeTitle} - ${langName}.${finalExt}`;
  const encodedFilename = encodeURIComponent(filename);

  // Determine MIME type
  const mimeTypes = {
    m4a: 'audio/mp4',
    mp3: 'audio/mpeg',
    webm: 'audio/webm',
  };
  const mimetype = mimeTypes[finalExt] || 'application/octet-stream';

  console.log(`📥 Streaming pre-prepared file instantly: ${filename}`);

  res.setHeader('Content-Type', mimetype);
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);

  const fileStats = fs.statSync(filePath);
  res.setHeader('Content-Length', fileStats.size);

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);

  fileStream.on('error', (err) => {
    console.error('❌ Error reading prepared file stream:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream audio file.' });
    }
  });
});

module.exports = router;
