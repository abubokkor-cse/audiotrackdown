const { spawn, execSync } = require('child_process');
const config = require('../config');


// ── Resolve newest yt-dlp binary (same logic as subtitle.js + tts.js) ─────────
const YTDLP_BIN = (() => {
  const candidates = [
    '/Library/Frameworks/Python.framework/Versions/3.12/bin/yt-dlp',
    '/Library/Frameworks/Python.framework/Versions/3.11/bin/yt-dlp',
    '/usr/local/bin/yt-dlp',
    '/opt/homebrew/bin/yt-dlp',
    'yt-dlp',
  ];
  for (const c of candidates) {
    try {
      const v = execSync(`"${c}" --version 2>/dev/null`, { timeout: 3000 }).toString().trim();
      const parts = v.split('.').map(Number);
      if ((parts[0] || 0) * 10000 + (parts[1] || 0) * 100 + (parts[2] || 0) >= 2026060) {
        console.log(`[ytdlp] Using binary: ${c} (${v})`);
        return c;
      }
    } catch { /* try next */ }
  }
  return 'yt-dlp';
})();

/**
 * Expand short YouTube URLs (youtu.be/ID) to full watch URL.
 * Also strips the tracking ?si= parameter.
 */
function normalizeYouTubeUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    // youtu.be/VIDEO_ID → youtube.com/watch?v=VIDEO_ID
    if (u.hostname === 'youtu.be') {
      const videoId = u.pathname.slice(1); // strip leading /
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
    // Drop tracking params (?si=, &pp=, etc.) but keep ?v=
    if (u.hostname.endsWith('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/watch?v=${v}`;
    }
  } catch { /* not a parseable URL — pass through */ }
  return rawUrl;
}

// In-memory cache: URL → extracted data (5 min TTL)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Clean expired cache entries
 */
function cleanCache() {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}

// Clean cache every 2 minutes
setInterval(cleanCache, 2 * 60 * 1000);

/**
 * Language code to display name mapping
 */
const LANG_NAMES = {
  en: 'English', 'en-US': 'English (US)', 'en-GB': 'English (UK)',
  hi: 'Hindi', bn: 'Bangla', ja: 'Japanese', ko: 'Korean',
  fr: 'French', 'fr-FR': 'French', de: 'German', 'de-DE': 'German',
  es: 'Spanish', 'es-US': 'Spanish (US)', 'es-ES': 'Spanish (Spain)',
  pt: 'Portuguese', 'pt-BR': 'Portuguese (BR)',
  it: 'Italian', 'it-IT': 'Italian',
  ru: 'Russian', zh: 'Chinese', 'zh-CN': 'Chinese (Simplified)',
  ar: 'Arabic', tr: 'Turkish', th: 'Thai', vi: 'Vietnamese',
  id: 'Indonesian', ms: 'Malay', pl: 'Polish', nl: 'Dutch',
  sv: 'Swedish', da: 'Danish', no: 'Norwegian', fi: 'Finnish',
  uk: 'Ukrainian', cs: 'Czech', ro: 'Romanian', el: 'Greek',
  he: 'Hebrew', fa: 'Persian', ur: 'Urdu', ta: 'Tamil',
  te: 'Telugu', mr: 'Marathi', gu: 'Gujarati', kn: 'Kannada',
  ml: 'Malayalam', pa: 'Punjabi', sw: 'Swahili',
};

/**
 * Language code to flag emoji mapping
 */
const LANG_FLAGS = {
  en: '🇺🇸', 'en-US': '🇺🇸', 'en-GB': '🇬🇧',
  hi: '🇮🇳', bn: '🇧🇩', ja: '🇯🇵', ko: '🇰🇷',
  fr: '🇫🇷', 'fr-FR': '🇫🇷', de: '🇩🇪', 'de-DE': '🇩🇪',
  es: '🇪🇸', 'es-US': '🇺🇸', 'es-ES': '🇪🇸',
  pt: '🇵🇹', 'pt-BR': '🇧🇷',
  it: '🇮🇹', 'it-IT': '🇮🇹',
  ru: '🇷🇺', zh: '🇨🇳', 'zh-CN': '🇨🇳',
  ar: '🇸🇦', tr: '🇹🇷', th: '🇹🇭', vi: '🇻🇳',
  id: '🇮🇩', ms: '🇲🇾', pl: '🇵🇱', nl: '🇳🇱',
  sv: '🇸🇪', da: '🇩🇰', no: '🇳🇴', fi: '🇫🇮',
  uk: '🇺🇦', cs: '🇨🇿', ro: '🇷🇴', el: '🇬🇷',
  he: '🇮🇱', fa: '🇮🇷', ur: '🇵🇰', ta: '🇮🇳',
  te: '🇮🇳', mr: '🇮🇳', gu: '🇮🇳', kn: '🇮🇳',
  ml: '🇮🇳', pa: '🇮🇳', sw: '🇰🇪',
};

/**
 * Extract audio tracks and subtitles from a YouTube URL
 * @param {string} url - YouTube video URL
 * @returns {Promise<object>} Extracted video data with audio tracks
 */
function extractAudioTracks(rawUrl) {
  const url = normalizeYouTubeUrl(rawUrl);

  return new Promise((resolve, reject) => {
    // Check cache first
    const cached = cache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`📦 Cache hit for: ${url.substring(0, 60)}`);
      return resolve(cached.data);
    }

    console.log(`🔍 Extracting subtitles for: ${url.substring(0, 60)}`);

    const isYouTubeUrl = url.includes('youtube.com') || url.includes('youtu.be');

    const buildArgs = ({ useCookies = false, useImpersonate = false, useUserAgent = false, playerClient = 'web' } = {}) => {
      const args = [
        '--no-update',
        '--no-warnings',
        '--dump-json',
        '--no-download',
        '--no-playlist',
      ];
      if (isYouTubeUrl) {
        if (useImpersonate) {
          args.push('--impersonate', 'Chrome-136');
        }
        if (useUserAgent) {
          args.push(
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            '--add-header', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            '--add-header', 'Accept-Language: en-US,en;q=0.9'
          );
        }
        args.push(
          '--extractor-args', `youtube:player_client=${playerClient}`
        );
      }
      if (useCookies) {
        args.push('--cookies-from-browser', 'chrome');
      }
      if (process.env.ROTATING_PROXIES) {
        args.push('--proxy', process.env.ROTATING_PROXIES);
      }
      args.push('--skip-download', url);
      return args;
    };

    const runStrategy = (args) => new Promise((resolveRun, rejectRun) => {
      const ytdlp = spawn(YTDLP_BIN, args, {
        timeout: config.ytdlp.timeoutMs,
        env: { ...process.env },
      });

      let stdout = '';
      let stderr = '';

      ytdlp.stdout.on('data', (data) => { stdout += data.toString(); });
      ytdlp.stderr.on('data', (data) => { stderr += data.toString(); });

      const timeout = setTimeout(() => {
        ytdlp.kill('SIGTERM');
        rejectRun(new Error('Extraction timed out.'));
      }, config.ytdlp.timeoutMs);

      ytdlp.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          resolveRun(stdout);
        } else {
          rejectRun(new Error(stderr || `Exit code ${code}`));
        }
      });

      ytdlp.on('error', (err) => {
        clearTimeout(timeout);
        rejectRun(err);
      });
    });

    const strategies = [
      // 💻 Try extracting from ALL clients with a simulated Chrome user-agent (gives full multi-language tracks)
      { useCookies: false, useImpersonate: false, useUserAgent: true, playerClient: 'all', label: 'all-chrome-ua' },
      // 📱 Try mobile fallback if blocked (returns at least the default/original track)
      { useCookies: false, useImpersonate: false, useUserAgent: false, playerClient: 'android', label: 'android' },
      { useCookies: false, useImpersonate: false, useUserAgent: false, playerClient: 'ios', label: 'ios' },
      { useCookies: false, useImpersonate: false, useUserAgent: false, playerClient: 'tv', label: 'tv' },
      // 🍪 Last resort using browser cookies
      { useCookies: true, useImpersonate: false, useUserAgent: true, playerClient: 'all', label: 'cookies+all' },
    ];

    (async () => {
      let lastError = null;
      let stdout = '';
      for (const strategy of strategies) {
        try {
          stdout = await runStrategy(buildArgs(strategy));
          console.log(`[ytdlp] ✓ Strategy "${strategy.label}" succeeded`);
          lastError = null;
          break;
        } catch (err) {
          console.warn(`[ytdlp] ✗ Strategy "${strategy.label}" failed: ${err.message.split('\n')[0].substring(0, 120)}`);
          lastError = err;
        }
      }

      if (lastError) {
        const errMsg = lastError.message || '';
        if (errMsg.includes('Video unavailable') || errMsg.includes('Private video')) {
          return reject(new Error('This video is private or unavailable.'));
        }
        if (errMsg.includes('age')) {
          return reject(new Error('This video is age-restricted and cannot be processed.'));
        }
        if (errMsg.includes('geo') || errMsg.includes('country')) {
          return reject(new Error('This video is not available in your region.'));
        }
        return reject(new Error(`Failed to extract video information: ${errMsg}`));
      }

      try {
        const info = JSON.parse(stdout);
        const result = processExtractedInfo(info);

        // Cache the result — only cache multi-track results so degraded fallbacks don't pollute
        if (result.audioTracks.length > 1) {
          cache.set(url, { data: result, timestamp: Date.now() });
        } else {
          console.log(`⚠️ Skipping cache for single-track result (likely degraded fallback)`);
        }

        console.log(`✅ Extracted ${result.audioTracks.length} audio tracks`);
        resolve(result);
      } catch (parseError) {
        console.error('❌ Failed to parse yt-dlp output:', parseError.message);
        reject(new Error('Failed to process video data.'));
      }
    })();
  });
}

/**
 * Process raw yt-dlp JSON into structured data
 */
function processExtractedInfo(info) {
  const allFormats = info.formats || [];

  // Extract video metadata
  const video = {
    id: info.id || '',
    title: info.title || 'Unknown Title',
    thumbnail: info.thumbnail || '',
    duration: info.duration || 0,
    uploader: info.uploader || info.channel || 'Unknown',
    viewCount: info.view_count || 0,
    uploadDate: info.upload_date || '',
    description: (info.description || '').substring(0, 300),
  };

  // ── Extract and group audio formats by language ──
  let audioFormats = allFormats.filter(
    (f) => f.acodec !== 'none' && f.vcodec === 'none'
  );

  // Fallback: if no audio-only formats are found (common with android client), use combined formats
  if (audioFormats.length === 0) {
    audioFormats = allFormats.filter(
      (f) => f.acodec !== 'none' && f.vcodec !== 'none'
    );
  }

  // Collect ALL formats per language
  const langFormats = {};
  for (const f of audioFormats) {
    const langCode = f.language || 'default';
    if (!langFormats[langCode]) langFormats[langCode] = [];
    langFormats[langCode].push(f);
  }

  // Build audio tracks with quality options per language
  const audioTracks = [];

  for (const [langCode, formats] of Object.entries(langFormats)) {
    // Sort by bitrate descending
    formats.sort((a, b) => (b.abr || 0) - (a.abr || 0));

    const formatNote = formats[0].format_note || '';
    let langName = LANG_NAMES[langCode] || formatNote.split(',')[0].trim() || 'Original Audio';

    // Clean up generic/empty names
    if (langName.toLowerCase() === 'default' || langName.toLowerCase() === 'dash audio' || langName === '') {
      langName = 'Original Audio';
    }

    const isOriginal = langCode === 'default' ||
      formatNote.toLowerCase().includes('original') ||
      formatNote.toLowerCase().includes('default');

    if (isOriginal && !langName.includes('Original')) {
      langName += ' (Original)';
    }

    // Helper: check if a format has a usable direct URL (same logic as existing Downloader)
    const BLOCKED_PROTOCOLS = ['m3u8', 'm3u8_native', 'http_dash_segments'];
    const getDirectUrl = (f) =>
      f.url && f.protocol && !BLOCKED_PROTOCOLS.includes(f.protocol) ? f.url : null;

    // Pick best high-quality and best low-quality
    const high = formats[0]; // highest bitrate
    const low = formats.find(f => (f.abr || 0) < 80) || formats[formats.length - 1];

    // Quality options for this language
    const qualities = [];

    // High quality — include direct URL if available
    const highDirectUrl = getDirectUrl(high);
    qualities.push({
      label: 'High',
      formatId: high.format_id,
      bitrate: high.abr || 0,
      ext: high.ext || 'm4a',
      filesize: high.filesize || high.filesize_approx || 0,
      directUrl: highDirectUrl,
      downloadType: highDirectUrl ? 'direct' : 'server',
    });

    // MP3 quality option (192kbps transcoded on-the-fly)
    const duration = info.duration || 0;
    const mp3Size = duration ? Math.round(duration * 192000 / 8) : 0;
    qualities.push({
      label: 'MP3',
      formatId: high.format_id,
      bitrate: 192,
      ext: 'mp3',
      filesize: mp3Size || Math.round((high.filesize || high.filesize_approx || 0) * 1.2),
      directUrl: null,
      downloadType: 'server',
    });


    // Low quality (only add if actually different from high)
    if (low.format_id !== high.format_id && (low.abr || 0) < (high.abr || 0)) {
      const lowDirectUrl = getDirectUrl(low);
      qualities.push({
        label: 'Low',
        formatId: low.format_id,
        bitrate: low.abr || 0,
        ext: low.ext || 'webm',
        filesize: low.filesize || low.filesize_approx || 0,
        directUrl: lowDirectUrl,
        downloadType: lowDirectUrl ? 'direct' : 'server',
      });
    }

    audioTracks.push({
      langCode,
      langName,
      flag: LANG_FLAGS[langCode] || '🌐',
      isOriginal,
      qualities,
      // Default (high) for backward compat
      formatId: high.format_id,
      bitrate: high.abr || 0,
      ext: high.ext || 'm4a',
      filesize: high.filesize || high.filesize_approx || 0,
      directUrl: highDirectUrl,
      downloadType: highDirectUrl ? 'direct' : 'server',
    });
  }

  // Sort: original first, then alphabetically by language name
  audioTracks.sort((a, b) => {
    if (a.isOriginal && !b.isOriginal) return -1;
    if (!a.isOriginal && b.isOriginal) return 1;
    return a.langName.localeCompare(b.langName);
  });

  // Extract subtitles info
  const subtitles = {};
  const rawSubs = { ...info.subtitles, ...info.automatic_captions };
  for (const [lang, formats] of Object.entries(rawSubs)) {
    if (formats && formats.length > 0) {
      subtitles[lang] = {
        langName: LANG_NAMES[lang] || lang.toUpperCase(),
        flag: LANG_FLAGS[lang] || '🌐',
        formats: formats.map((f) => ({
          ext: f.ext,
          url: f.url,
        })),
        isAutoGenerated: !info.subtitles?.[lang],
      };
    }
  }

  // ── Extract muxed video+audio formats (for Shorts Generator) ──
  const videoFormats = allFormats.filter(
    (f) => f.acodec !== 'none' && f.vcodec !== 'none' && f.ext === 'mp4'
  );

  // Sort by resolution descending, then bitrate
  videoFormats.sort((a, b) => {
    const resA = (a.height || 0);
    const resB = (b.height || 0);
    if (resB !== resA) return resB - resA;
    return (b.tbr || 0) - (a.tbr || 0);
  });

  const BLOCKED_PROTOCOLS = ['m3u8', 'm3u8_native', 'http_dash_segments'];
  const videoTracks = videoFormats.map(f => ({
    formatId: f.format_id,
    ext: f.ext || 'mp4',
    width: f.width || 0,
    height: f.height || 0,
    fps: f.fps || 0,
    bitrate: f.tbr || 0,
    filesize: f.filesize || f.filesize_approx || 0,
    label: `${f.height || '?'}p${f.fps && f.fps > 30 ? f.fps : ''}`,
    directUrl: (f.url && f.protocol && !BLOCKED_PROTOCOLS.includes(f.protocol)) ? f.url : null,
  }));

  return { video, audioTracks, subtitles, videoTracks };
}

/**
 * Get stream URL for a specific format
 * @param {string} url - YouTube video URL
 * @param {string} formatId - yt-dlp format ID
 * @returns {Promise<object>} Stream info with URL and metadata
 */
function getStreamUrl(rawUrl, formatId) {
  const url = normalizeYouTubeUrl(rawUrl);

  return new Promise((resolve, reject) => {
    const isYouTubeUrl = url.includes('youtube.com') || url.includes('youtu.be');

    const buildArgs = ({ useCookies = false, useImpersonate = false, useUserAgent = false, playerClient = 'web' } = {}) => {
      const args = [
        '--no-update',
        '--no-warnings',
        '--dump-json',
        '--no-download',
        '--no-playlist',
      ];

      if (isYouTubeUrl) {
        if (useImpersonate) {
          args.push(
            '--impersonate', 'Chrome-136'
          );
        }
        if (useUserAgent) {
          args.push(
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            '--add-header', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            '--add-header', 'Accept-Language: en-US,en;q=0.9'
          );
        }
        args.push(
          '--extractor-args', `youtube:player_client=${playerClient}`
        );
      }

      if (useCookies) {
        args.push('--cookies-from-browser', 'chrome');
      }

      if (process.env.ROTATING_PROXIES) {
        args.push('--proxy', process.env.ROTATING_PROXIES);
      }

      args.push('-f', formatId, url);
      return args;
    };

    const runStrategy = (args) => new Promise((resolveRun, rejectRun) => {
      const ytdlp = spawn(YTDLP_BIN, args, {
        timeout: config.ytdlp.timeoutMs,
        env: { ...process.env },
      });

      let stdout = '';
      let stderr = '';

      ytdlp.stdout.on('data', (data) => { stdout += data.toString(); });
      ytdlp.stderr.on('data', (data) => { stderr += data.toString(); });

      const timeout = setTimeout(() => {
        ytdlp.kill('SIGTERM');
        rejectRun(new Error('Stream URL retrieval timed out.'));
      }, config.ytdlp.timeoutMs);

      ytdlp.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          resolveRun(stdout);
        } else {
          rejectRun(new Error(stderr || `Exit code ${code}`));
        }
      });

      ytdlp.on('error', (err) => {
        clearTimeout(timeout);
        rejectRun(err);
      });
    });

    const strategies = [
      // 💻 Try extracting from ALL clients with a simulated Chrome user-agent (gives full multi-language tracks)
      { useCookies: false, useImpersonate: false, useUserAgent: true, playerClient: 'all', label: 'all-chrome-ua' },
      // 📱 Try mobile fallback if blocked (returns at least the default/original track)
      { useCookies: false, useImpersonate: false, useUserAgent: false, playerClient: 'android', label: 'android' },
      { useCookies: false, useImpersonate: false, useUserAgent: false, playerClient: 'ios', label: 'ios' },
      { useCookies: false, useImpersonate: false, useUserAgent: false, playerClient: 'tv', label: 'tv' },
      // 🍪 Last resort using browser cookies
      { useCookies: true, useImpersonate: false, useUserAgent: true, playerClient: 'all', label: 'cookies+all' },
    ];

    (async () => {
      let lastError = null;
      let stdout = '';
      let winningStrategy = null;
      for (const strategy of strategies) {
        try {
          stdout = await runStrategy(buildArgs(strategy));
          console.log(`[ytdlp] getStreamUrl: Strategy "${strategy.label}" succeeded`);
          winningStrategy = strategy;
          lastError = null;
          break;
        } catch (err) {
          const brief = err.message.split('\n')[0].substring(0, 120);
          console.warn(`[ytdlp] getStreamUrl: Strategy "${strategy.label}" failed: ${brief}`);
          lastError = err;
        }
      }

      if (lastError || !winningStrategy) {
        return reject(new Error(`Failed to get stream URL: ${lastError?.message || 'unknown'}`));
      }

      try {
        const info = JSON.parse(stdout);
        const streamUrl = info.url || (info.requested_formats && info.requested_formats[0]?.url);

        if (!streamUrl) {
          return reject(new Error('No stream URL available for this format.'));
        }

        resolve({
          url: streamUrl,
          title: info.title || 'audio',
          ext: info.ext || 'm4a',
          filesize: info.filesize || info.filesize_approx || 0,
          // Return strategy details so download route can reuse the same yt-dlp flags
          strategyUseCookies: winningStrategy.useCookies,
          strategyUseImpersonate: winningStrategy.useImpersonate,
          strategyUseUserAgent: winningStrategy.useUserAgent || false,
          strategyPlayerClient: winningStrategy.playerClient || 'web',
        });
      } catch {
        reject(new Error('Failed to parse stream data.'));
      }
    })();
  });
}

function clearCache() {
  const size = cache.size;
  cache.clear();
  console.log(`🗑️ Cache cleared (${size} entries removed)`);
  return size;
}

module.exports = { extractAudioTracks, getStreamUrl, clearCache, YTDLP_BIN };
