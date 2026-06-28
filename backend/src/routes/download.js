const express = require('express');
const https = require('https');
const http = require('http');
const { getStreamUrl, YTDLP_BIN } = require('../services/ytdlp');
const { validateVideoUrl, validateFormatId } = require('../middleware/validate');
const { downloadLimiter } = require('../middleware/rateLimit');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Active downloads store (in production use Redis)
const activeDownloads = new Map();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of activeDownloads.entries()) {
    if (now - entry.timestamp > 10 * 60 * 1000) {
      activeDownloads.delete(id);
    }
  }
}, 5 * 60 * 1000);

/**
 * POST /api/download/prepare
 * Prepare a download and return a download ID
 */
router.post('/prepare', downloadLimiter, validateVideoUrl, validateFormatId, async (req, res) => {
  try {
    const { url, formatId, langName, targetExt } = req.body;
    const downloadId = uuidv4();

    // Get stream URL from yt-dlp
    const streamInfo = await getStreamUrl(url, formatId);

    activeDownloads.set(downloadId, {
      streamUrl: streamInfo.url,
      originalUrl: url,
      formatId: formatId,
      title: streamInfo.title,
      ext: streamInfo.ext,
      targetExt: targetExt || streamInfo.ext,
      filesize: streamInfo.filesize,
      langName: langName || 'audio',
      timestamp: Date.now(),
      // Strategy that worked during getStreamUrl — reuse for download pipeline
      strategyUseCookies: streamInfo.strategyUseCookies,
      strategyUseImpersonate: streamInfo.strategyUseImpersonate,
    });

    const safeTitle = streamInfo.title
      .replace(/[/\\?%*:|"<>]/g, '_')
      .substring(0, 100);
    const finalExt = targetExt || streamInfo.ext;
    const filename = `${safeTitle} - ${langName || 'audio'}.${finalExt}`;

    console.log(`✅ Download prepared: ${downloadId} → ${filename} (target: ${finalExt})`);

    res.json({
      success: true,
      downloadId,
      filename,
      filesize: streamInfo.filesize,
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
 * GET /api/download/stream/:id
 * Stream the audio file through the server (proxy + optional transcode)
 */
router.get('/stream/:id', (req, res) => {
  const { id } = req.params;
  const download = activeDownloads.get(id);

  if (!download) {
    return res.status(404).json({ error: 'Download expired or invalid. Please try again.' });
  }

  const { streamUrl, title, ext, targetExt, langName } = download;
  const finalExt = targetExt || ext;

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

  console.log(`📥 Streaming: ${filename} (source format: ${ext})`);

  // Transcode to MP3 on-the-fly using FFmpeg
  if (finalExt === 'mp3' && ext !== 'mp3') {
    console.log(`🎬 Transcoding on-the-fly to MP3: ${filename}`);

    res.setHeader('Content-Type', mimetype);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);

    const { spawn } = require('child_process');

    // 🚀 HIGH-SPEED PIPELINE: yt-dlp (with same strategy that worked) → FFmpeg → response
    // yt-dlp handles YouTube's throttle bypass internally, giving full download speed.
    const isYouTubeUrl = download.originalUrl &&
      (download.originalUrl.includes('youtube.com') || download.originalUrl.includes('youtu.be'));

    if (isYouTubeUrl && download.originalUrl && download.formatId) {
      console.log(`🚀 Using yt-dlp → FFmpeg high-speed pipeline (cookies=${download.strategyUseCookies}, impersonate=${download.strategyUseImpersonate})`);

      const ytdlpArgs = [
        '--no-update',
        '--no-warnings',
        '--no-playlist',
      ];

      // Reuse the EXACT strategy that succeeded during getStreamUrl
      if (download.strategyUseImpersonate) {
        ytdlpArgs.push('--impersonate', 'Chrome-136');
        ytdlpArgs.push('--extractor-args', 'youtube:player_client=web');
      }
      if (download.strategyUseCookies) {
        ytdlpArgs.push('--cookies-from-browser', 'chrome');
      }
      ytdlpArgs.push('-f', download.formatId);
      ytdlpArgs.push('-o', '-'); // Output to stdout
      ytdlpArgs.push(download.originalUrl);

      const ytdlpProc = spawn(YTDLP_BIN, ytdlpArgs, {
        env: { ...process.env }
      });

      const ffmpegProc = spawn('ffmpeg', [
        '-i', 'pipe:0',             // Read from stdin (yt-dlp stdout)
        '-vn',                      // Disable video
        '-acodec', 'libmp3lame',    // Use MP3 encoder
        '-ab', '192k',              // Set audio bitrate
        '-f', 'mp3',                // Output format MP3
        'pipe:1'                    // Stream output to stdout
      ]);

      // Pipe: yt-dlp stdout → ffmpeg stdin → ffmpeg stdout → HTTP response
      ytdlpProc.stdout.pipe(ffmpegProc.stdin);
      ffmpegProc.stdout.pipe(res);

      // Handle client disconnect
      req.on('close', () => {
        ytdlpProc.kill('SIGKILL');
        ffmpegProc.kill('SIGKILL');
      });

      ytdlpProc.stderr.on('data', (data) => {
        const msg = data.toString().trim();
        if (msg) console.log(`[yt-dlp pipe] ${msg}`);
      });

      ytdlpProc.on('error', (err) => {
        console.error('❌ yt-dlp pipeline error:', err.message);
      });

      ffmpegProc.stderr.on('data', (data) => {
        // FFmpeg outputs progress to stderr — ignore unless debugging
      });

      ffmpegProc.on('error', (err) => {
        console.error('❌ FFmpeg pipeline error:', err.message);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Audio transcoding failed.' });
        }
      });
    } else {
      // ⚠️ FALLBACK: Non-YouTube or missing data — use direct stream URL
      console.log(`⚠️ Fallback: direct URL → FFmpeg for ${filename}`);

      const ffmpeg = spawn('ffmpeg', [
        '-i', 'pipe:0',
        '-vn',
        '-acodec', 'libmp3lame',
        '-ab', '192k',
        '-f', 'mp3',
        'pipe:1'
      ]);

      ffmpeg.stdout.pipe(res);

      const protocol = streamUrl.startsWith('https') ? https : http;
      const proxyReq = protocol.get(streamUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Accept-Encoding': 'identity',
        },
      }, (proxyRes) => {
        if (proxyRes.statusCode >= 400) {
          console.error(`❌ Upstream stream error: ${proxyRes.statusCode}`);
          if (!res.headersSent) {
            res.status(502).json({ error: 'Failed to fetch audio stream.' });
          }
          ffmpeg.stdin.destroy();
          return;
        }
        proxyRes.pipe(ffmpeg.stdin);
        proxyRes.on('error', (err) => {
          console.error('❌ Proxy stream error:', err.message);
          ffmpeg.stdin.destroy();
        });
      });

      proxyReq.on('error', (err) => {
        console.error('❌ Proxy request error:', err.message);
        ffmpeg.stdin.destroy();
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to connect to audio source.' });
        }
      });

      req.on('close', () => {
        proxyReq.destroy();
        ffmpeg.kill('SIGKILL');
      });

      ffmpeg.on('error', (err) => {
        console.error('❌ FFmpeg error:', err.message);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Audio transcoding failed.' });
        }
      });
    }

    return;
  }

  // Proxy the stream normally if no transcoding is needed
  const protocol = streamUrl.startsWith('https') ? https : http;

  const proxyReq = protocol.get(streamUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Encoding': 'identity',
      'Range': 'bytes=0-',
    },
  }, (proxyRes) => {
    if (proxyRes.statusCode >= 400) {
      console.error(`❌ Upstream error: ${proxyRes.statusCode}`);
      return res.status(502).json({ error: 'Failed to fetch audio from source.' });
    }

    res.setHeader('Content-Type', mimetype);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
    if (proxyRes.headers['content-length']) {
      res.setHeader('Content-Length', proxyRes.headers['content-length']);
    }

    proxyRes.pipe(res);

    proxyRes.on('error', (err) => {
      console.error('❌ Stream error:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream interrupted.' });
      }
    });
  });

  proxyReq.on('error', (err) => {
    console.error('❌ Proxy request error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to connect to audio source.' });
    }
  });

  // Handle client disconnect
  req.on('close', () => {
    proxyReq.destroy();
  });
});

module.exports = router;
