const { spawn, execSync } = require('child_process');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ── Resolve Python Binary ───────────────────────────────────────────────────
function resolvePythonBin() {
  const candidates = [
    '/Library/Frameworks/Python.framework/Versions/3.12/bin/python3',
    '/Library/Frameworks/Python.framework/Versions/3.11/bin/python3',
    '/opt/homebrew/bin/python3',
    'python3',
  ];
  for (const c of candidates) {
    try {
      execSync(`"${c}" --version 2>/dev/null`, { timeout: 3000 });
      return c;
    } catch { /* next */ }
  }
  return 'python3';
}

const PYTHON_BIN = resolvePythonBin();
const SCRIPT_PATH = path.join(__dirname, 'fetch_youtube_transcript.py');

// Initialize Gemini API
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/**
 * Convert VTT/SRT timestamp to seconds
 */
function parseTimeToSeconds(timeStr) {
  const match = timeStr.trim().replace(',', '.').match(/(?:(\d{2}):)?(\d{2}):(\d{2})\.(\d{3})/);
  if (!match) return 0;
  const hrs = match[1] ? parseInt(match[1], 10) : 0;
  const mins = parseInt(match[2], 10);
  const secs = parseInt(match[3], 10);
  const ms = parseInt(match[4], 10);
  return hrs * 3600 + mins * 60 + secs + ms / 1000;
}

/**
 * Format seconds back to VTT timestamp
 */
function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

/**
 * Parse raw VTT transcript into cues array
 */
function parseVttToCues(vttText) {
  const lines = vttText.split(/\r?\n/);
  const cues = [];
  const timeRegex = /(\d{2}:)?\d{2}:\d{2}\.\d{3}/;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.includes('-->')) {
      const parts = line.split('-->');
      const startMatch = parts[0].match(timeRegex);
      const endMatch = parts[1].match(timeRegex);
      if (startMatch && endMatch) {
        let start = startMatch[0];
        let end = endMatch[0];
        if (start.split(':').length === 2) start = '00:' + start;
        if (end.split(':').length === 2) end = '00:' + end;

        const textLines = [];
        i++;
        while (i < lines.length && !lines[i].includes('-->')) {
          const textLine = lines[i].trim().replace(/<[^>]+>/g, '').trim();
          if (textLine) textLines.push(textLine);
          i++;
        }

        const text = textLines.join('\n');
        if (text) {
          cues.push({
            start: parseTimeToSeconds(start),
            end: parseTimeToSeconds(end),
            text
          });
        }
        continue;
      }
    }
    i++;
  }
  return cues;
}

/**
 * Format cues array back to WEBVTT string
 */
function cuesToVtt(cues) {
  let out = 'WEBVTT\n\n';
  for (const c of cues) {
    out += `${formatTime(c.start)} --> ${formatTime(c.end)}\n${c.text}\n\n`;
  }
  return out.trim() + '\n';
}

/**
 * Translate cues using Gemini API
 */
async function translateCuesWithGemini(cues, targetLanguage) {
  if (!cues || cues.length === 0) return [];
  if (!genAI) {
    throw new Error('Gemini API key is not configured on the server.');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const batchSize = 60;
  const translatedCues = [];

  for (let i = 0; i < cues.length; i += batchSize) {
    const batch = cues.slice(i, i + batchSize);
    console.log(`[subtitleService] Translating batch ${i / batchSize + 1} of ${Math.ceil(cues.length / batchSize)} (${batch.length} cues)...`);

    const prompt = `You are a professional video dubbing translator. Translate the following text segments into ${targetLanguage}.
Context: These segments are consecutive speech parts from a video transcript. You must translate each segment naturally and contextually, maintaining continuity between segments.

Input segments:
${JSON.stringify(batch.map((s, idx) => ({ id: idx, text: s.text })), null, 2)}

Return ONLY a JSON object containing a "translations" array, where each item has "id" and "translation" fields.
Preserve the exact "id" values. Do not change the segment counts.
Example output format:
{
  "translations": [
    { "id": 0, "translation": "translated text" }
  ]
}
Do NOT wrap the output in markdown code blocks like \`\`\`json. Return pure JSON.`;

    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            translations: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  id: { type: 'INTEGER' },
                  translation: { type: 'STRING' }
                },
                required: ['id', 'translation']
              }
            }
          },
          required: ['translations']
        }
      }
    });

    const responseText = result.response.text();
    let parsed;
    try {
      parsed = JSON.parse(responseText.trim());
    } catch (err) {
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('Invalid JSON response from Gemini');
      }
    }

    const translationsMap = new Map(parsed.translations.map(t => [t.id, t.translation]));
    batch.forEach((cue, index) => {
      const translatedText = translationsMap.get(index) || cue.text;
      translatedCues.push({
        start: cue.start,
        end: cue.end,
        text: translatedText
      });
    });
  }

  return translatedCues;
}

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

/**
 * Spawns the python script and retrieves subtitles via youtube-transcript-api.
 * Falls back to translating via Gemini if required.
 *
 * @param {string} videoId
 * @param {string} langCode
 * @returns {Promise<string>} WEBVTT formatted subtitle content
 */
function fetchYouTubeSubtitles(videoId, langCode) {
  return new Promise((resolve, reject) => {
    console.log(`[subtitleService] Fetching transcript via InnerTube for video: ${videoId}, lang: ${langCode}`);

    const env = { ...process.env };
    const proxyUrl = getProxyUrl();
    if (proxyUrl) {
      env.ROTATING_PROXIES = proxyUrl;
      env.HTTP_PROXY = proxyUrl;
      env.HTTPS_PROXY = proxyUrl;
      env.http_proxy = proxyUrl;
      env.https_proxy = proxyUrl;
    }

    const proc = spawn(PYTHON_BIN, [SCRIPT_PATH, videoId, langCode], {
      env
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', d => { stdout += d.toString(); });
    proc.stderr.on('data', d => { stderr += d.toString(); });

    proc.on('close', async (code) => {
      if (code !== 0) {
        let errMsg = `Process exited with code ${code}`;
        try {
          const parsed = JSON.parse(stdout.trim());
          errMsg = parsed.error || errMsg;
        } catch {
          if (stderr.trim()) errMsg = stderr.trim();
        }
        return reject(new Error(`Python fetch script failed: ${errMsg}`));
      }

      try {
        const result = JSON.parse(stdout.trim());
        if (!result.success) {
          return reject(new Error(result.error || 'Failed to fetch transcript.'));
        }

        if (result.requires_gemini_translation) {
          // Native YouTube translation unavailable — return original transcript directly.
          // Gemini translation removed: too costly and unreliable for production.
          console.log(`[subtitleService] Native translation unavailable. Returning original transcript for: ${langCode}`);
          return resolve(result.vtt);
        }

        // Returns direct VTT from YouTube (original or translated natively)
        resolve(result.vtt);
      } catch (err) {
        reject(new Error(`Failed to parse Python script output: ${err.message}`));
      }
    });

    proc.on('error', err => {
      reject(new Error(`Failed to spawn Python process: ${err.message}`));
    });
  });
}

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
 * Lists available subtitle tracks for a YouTube video via InnerTube API.
 * 
 * @param {string} videoId
 * @returns {Promise<object>} Map of language code to subtitle details
 */
function listYouTubeSubtitles(videoId, originalOnly = false) {
  return new Promise((resolve, reject) => {
    console.log(`[subtitleService] Listing transcripts via InnerTube for video: ${videoId}`);

    const env = { ...process.env };
    if (process.env.ROTATING_PROXIES) {
      env.HTTP_PROXY = process.env.ROTATING_PROXIES;
      env.HTTPS_PROXY = process.env.ROTATING_PROXIES;
      env.http_proxy = process.env.ROTATING_PROXIES;
      env.https_proxy = process.env.ROTATING_PROXIES;
    }

    const proc = spawn(PYTHON_BIN, [SCRIPT_PATH, '--list', videoId], {
      env
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', d => { stdout += d.toString(); });
    proc.stderr.on('data', d => { stderr += d.toString(); });

    proc.on('close', (code) => {
      if (code !== 0) {
        let errMsg = `Process exited with code ${code}`;
        try {
          const parsed = JSON.parse(stdout.trim());
          errMsg = parsed.error || errMsg;
        } catch {
          if (stderr.trim()) errMsg = stderr.trim();
        }
        return reject(new Error(`Python list script failed: ${errMsg}`));
      }

      try {
        const result = JSON.parse(stdout.trim());
        if (!result.success) {
          return reject(new Error(result.error || 'Failed to list transcripts.'));
        }

        const subtitles = {};

        // Populate using original transcripts
        for (const t of result.transcripts) {
          const lang = t.language_code;

          subtitles[lang] = {
            langName: LANG_NAMES[lang] || t.language || lang.toUpperCase(),
            flag: LANG_FLAGS[lang] || '🌐',
            formats: [{ ext: 'vtt', url: `https://www.youtube.com/watch?v=${videoId}` }],
            isAutoGenerated: t.is_generated
          };

          // Also add translation target languages if originalOnly is false
          if (!originalOnly && t.translation_languages && t.translation_languages.length > 0) {
            for (const tl of t.translation_languages) {
              const tlLang = tl.language_code;
              // Avoid overwriting a native/manually uploaded or direct transcript with an auto-translation
              if (!subtitles[tlLang]) {
                subtitles[tlLang] = {
                  langName: LANG_NAMES[tlLang] || tl.language || tlLang.toUpperCase(),
                  flag: LANG_FLAGS[tlLang] || '🌐',
                  formats: [{ ext: 'vtt', url: `https://www.youtube.com/watch?v=${videoId}` }],
                  isAutoGenerated: true // auto-translation is considered generated
                };
              }
            }
          }
        }

        resolve(subtitles);
      } catch (err) {
        reject(new Error(`Failed to parse Python list script output: ${err.message}`));
      }
    });

    proc.on('error', err => {
      reject(new Error(`Failed to spawn Python list process: ${err.message}`));
    });
  });
}

module.exports = {
  fetchYouTubeSubtitles,
  listYouTubeSubtitles,
  LANG_NAMES,
  LANG_FLAGS
};
