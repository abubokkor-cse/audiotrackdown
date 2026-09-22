'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Download,
  FileText,
  RefreshCw,
  AlertCircle,
  Music,
  Globe,
  Zap,
  User,
  Clock,
  Eye,
  CheckCircle2,
  FileAudio,
  Crown,
  Play,
  Volume2,
  X,
  ShieldCheck
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Map language code to country flag emoji
// Language codes like 'en' → 'GB', 'fr' → 'FR', etc.
const LANG_TO_COUNTRY: Record<string, string> = {
  af: 'ZA', ak: 'GH', sq: 'AL', am: 'ET', ar: 'SA', hy: 'AM', as: 'IN',
  ay: 'BO', az: 'AZ', bn: 'BD', ba: 'RU', eu: 'ES', be: 'BY', bs: 'BA',
  bg: 'BG', ca: 'ES', ceb: 'PH', ny: 'MW', 'zh-Hans': 'CN', 'zh-Hant': 'TW',
  co: 'FR', hr: 'HR', cs: 'CZ', da: 'DK', dv: 'MV', nl: 'NL', en: 'GB',
  'en-US': 'US', 'en-GB': 'GB', eo: 'EU', et: 'EE', ee: 'GH', fi: 'FI',
  fr: 'FR', 'fr-FR': 'FR', fy: 'NL', gl: 'ES', ka: 'GE', de: 'DE',
  'de-DE': 'DE', el: 'GR', gu: 'IN', ht: 'HT', ha: 'NG', haw: 'US',
  iw: 'IL', he: 'IL', hi: 'IN', hmn: 'CN', hu: 'HU', is: 'IS', ig: 'NG',
  id: 'ID', ga: 'IE', it: 'IT', ja: 'JP', jw: 'ID', kn: 'IN', kk: 'KZ',
  km: 'KH', rw: 'RW', ko: 'KR', ku: 'IQ', ky: 'KG', lo: 'LA', la: 'VA',
  lv: 'LV', lt: 'LT', lb: 'LU', mk: 'MK', mg: 'MG', ms: 'MY', ml: 'IN',
  mt: 'MT', mi: 'NZ', mr: 'IN', mn: 'MN', my: 'MM', ne: 'NP', no: 'NO',
  or: 'IN', ps: 'AF', fa: 'IR', pl: 'PL', 'pt-BR': 'BR', pt: 'PT',
  pa: 'IN', ro: 'RO', ru: 'RU', sm: 'WS', gd: 'GB', sr: 'RS', st: 'ZA',
  sn: 'ZW', sd: 'PK', si: 'LK', sk: 'SK', sl: 'SI', so: 'SO', 'es-US': 'US',
  es: 'ES', su: 'ID', sw: 'KE', sv: 'SE', tg: 'TJ', ta: 'IN', tt: 'RU',
  te: 'IN', th: 'TH', ti: 'ET', ts: 'ZA', tr: 'TR', tk: 'TM', uk: 'UA',
  ur: 'PK', ug: 'CN', uz: 'UZ', vi: 'VN', cy: 'GB', xh: 'ZA', yi: 'IL',
  yo: 'NG', zu: 'ZA',
};

function getLangFlag(code: string): string {
  const country = LANG_TO_COUNTRY[code] || LANG_TO_COUNTRY[code.split('-')[0]];
  if (!country) return '🌐';
  return country.split('').map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('');
}

export function SubtitlesPageContent({
  title = "Download YouTube & Facebook Subtitles & Captions — Free SRT, VTT & Transcript Extractor",
  subtitle = "Paste any YouTube or Facebook URL to extract auto-generated captions, manual subtitles, and AI-translated transcripts. Download as SRT, VTT, or plain text in 157+ languages — instantly, no account needed."
}: {
  title?: string;
  subtitle?: string;
} = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialUrl = searchParams.get('url') || '';

  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [activeTool, setActiveTool] = useState<'audio' | 'subtitles'>('subtitles');
  const [subSearch, setSubSearch] = useState('');

  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [preparingSubtitle, setPreparingSubtitle] = useState<{ [key: string]: boolean }>({});

  const { data: limits } = useSWR('/api/user/limits', fetcher, {
    revalidateOnFocus: true,
  });
  const isFree = !limits || !limits.isPro;

  useEffect(() => {
    if (initialUrl) {
      handleExtract(initialUrl);
    }
  }, [initialUrl]);

  const handleExtract = useCallback(async (extractUrl?: string) => {
    const targetUrl = extractUrl || url.trim();
    if (!targetUrl) {
      setError('Please paste a YouTube or Facebook URL');
      return;
    }

    const ytPattern = /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)/;
    const fbPattern = /^https?:\/\/(www\.|web\.|m\.)?(facebook\.com|fb\.watch|fb\.gg)/;
    if (!ytPattern.test(targetUrl) && !fbPattern.test(targetUrl)) {
      setError('Please enter a valid YouTube or Facebook URL');
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);

    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || '';
      const infoUrl = `${BACKEND_URL}/api/subtitle/info?url=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(infoUrl);

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not load video info');
      }

      // Map subtitle/info response to the shape the rest of the page expects
      setResult({
        video: {
          title: data.video.title,
          thumbnail: data.video.thumbnail,
          duration: data.video.duration,
          uploader: data.video.uploader,
          id: data.video.id,
        },
        audioTracks: [],
        subtitles: data.subtitles || {},
        originalLang: data.originalLang || null,
      });
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [url]);


  const onExtractSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleExtract();
  };

  const handleDownloadClick = async (track: any) => {
    if (!track) return;
    executeDownload(track);
  };

  const executeDownload = async (track: any) => {
    setError('');
    const { directUrl, downloadType, formatId, langName, ext } = track;
    const formatKey = `${formatId}-${ext}`;

    if (downloadType === 'direct' && directUrl) {
      const link = document.createElement('a');
      link.href = directUrl;
      link.download = '';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => { if (document.body.contains(link)) document.body.removeChild(link); }, 500);
      return;
    }

    setDownloadingFormat(formatKey);
    try {
      const res = await fetch('/api/download/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim() || initialUrl,
          formatId,
          langName,
          targetExt: ext,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Download preparation failed');

      mutate('/api/user/limits');

      const streamUrl = `/api/download/stream/${data.downloadId}`;
      const statusUrl = `/api/download/status/${data.downloadId}`;

      let ready = false;
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        try {
          const sRes = await fetch(statusUrl);
          const sData = await sRes.json();
          if (sData.status === 'ready') { ready = true; break; }
          if (sData.status === 'error') throw new Error(sData.error || 'Transcoding failed');
        } catch (e) {
          throw e;
        }
      }
      if (!ready) throw new Error('Download timed out. Please try again.');

      const fileRes = await fetch(streamUrl);
      if (!fileRes.ok) throw new Error('Failed to download audio file');
      const blob = await fileRes.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = data.filename || 'audio.mp3';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleSubtitleDownloadClick = async (langCode: string, fmt: string) => {
    const key = `${langCode}-${fmt}`;
    if (preparingSubtitle[key]) return;

    const sub = result?.subtitles?.[langCode];
    const videoId = result?.video?.id;
    const isYouTube = url.includes('youtube') || url.includes('youtu.be') || initialUrl.includes('youtube') || initialUrl.includes('youtu.be');
    
    let targetUrl = '';
    if (isYouTube) {
      targetUrl = `https://www.youtube.com/watch?v=${videoId}`;
    } else {
      const fmtObj = sub?.formats?.find((f: any) => 
        (fmt === 'vtt' && f.ext === 'vtt') ||
        (fmt === 'srt' && (f.ext === 'srt' || f.ext === 'srv1')) ||
        (fmt === 'json3' && (f.ext === 'json3' || f.ext === 'json'))
      );
      targetUrl = fmtObj?.url || sub?.formats?.[0]?.url || '';
    }
    
    const downloadUrl = `/api/subtitle/download?url=${encodeURIComponent(targetUrl)}&lang=${langCode}&fmt=${fmt}&filename=${encodeURIComponent(result?.video?.title || 'subtitle')}`;
    
    setPreparingSubtitle(prev => ({ ...prev, [key]: true }));
    setError('');
    try {
      const res = await fetch(downloadUrl);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to download subtitle');
      }
      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition');
      let filename = `${result?.video?.title || 'subtitle'}-${langCode}.${fmt === 'json3' ? 'json' : fmt}`;
      if (disposition && disposition.includes('filename=')) {
        const filenameMatch = disposition.match(/filename="?([^";]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPreparingSubtitle(prev => ({ ...prev, [key]: false }));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${m}:${String(s).padStart(2, '0')}`;
  };

  const subtitleLanguages = result?.subtitles ? Object.keys(result.subtitles) : [];
  const originalLang = result?.originalLang || null;

  // Sort: original language always first, then rest alphabetically by name
  const sortedSubtitleLanguages = [...subtitleLanguages].sort((a, b) => {
    if (a === originalLang) return -1;
    if (b === originalLang) return 1;
    return (result.subtitles[a]?.langName || a).localeCompare(result.subtitles[b]?.langName || b);
  });

  const filteredSubtitles = sortedSubtitleLanguages.filter((langCode) => {
    const sub = result.subtitles[langCode];
    return (
      sub.langName.toLowerCase().includes(subSearch.toLowerCase()) ||
      langCode.toLowerCase().includes(subSearch.toLowerCase())
    );
  });

  const focusInput = () => {
    const inp = document.getElementById('url-inp');
    if (inp) {
      inp.focus();
      inp.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const langs = [
    '🇧🇩 Bangla', '🇺🇸 English', '🇸🇦 Arabic', '🇪🇸 Spanish', '🇮🇳 Hindi',
    '🇰🇷 Korean', '🇯🇵 Japanese', '🇫🇷 French', '🇩🇪 German', '🇧🇷 Portuguese',
    '🇮🇩 Indonesian', '🇮🇹 Italian', '🇷🇺 Russian', '🇳🇱 Dutch', '🇵🇱 Polish',
    '🇸🇪 Swedish', '🇹🇷 Turkish', '🇹🇭 Thai', '🇻🇳 Vietnamese', '🇵🇭 Filipino'
  ];

  return (
    <div className="w-full">

      {/* Hero section */}
      <section className="hero">
        <div className="hero-eyebrow flex items-center justify-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-indigo-500" />
          Free Online Tool · No Sign-Up Required · 157+ Languages
        </div>
        <h1>{title}</h1>
        <p className="hero-sub">{subtitle}</p>

        <div className="wave-wrap">
          <div className="waveform" id="wv">
            {Array.from({ length: 52 }).map((_, idx) => (
              <div
                key={idx}
                className="wb"
                style={{
                  opacity: url.trim().length > 0 ? 0.65 : undefined,
                  height: `${(idx % 5) * 4 + 8}px`
                }}
              />
            ))}
          </div>

          <form 
            onSubmit={onExtractSubmit} 
            className="tool-box"
          >
            <input
              id="url-inp"
              className="url-input"
              type="text"
              placeholder="Paste YouTube or Facebook URL — e.g. youtube.com/watch?v=…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              required
            />

            <button 
              type="submit" 
              className="btn-extract flex items-center justify-center gap-1.5"
              disabled={loading}
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Extracting…' : 'Extract →'}
            </button>
          </form>
        </div>

        <p className="mt-3 text-xs text-gray-400">
          Need MP3 audio tracks or dubbed voices?{' '}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              router.push('/');
            }}
            className="text-indigo-600 font-bold hover:underline"
          >
            Download MP3 &amp; M4A audio →
          </a>
        </p>

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center gap-2 max-w-2xl mx-auto text-sm text-left">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <div className="formats">
          <span 
            className="chip flex items-center gap-1 on"
          >
            <FileText className="w-3.5 h-3.5" /> SRT subtitles
          </span>
          <span 
            className="chip flex items-center gap-1 on"
          >
            <FileText className="w-3.5 h-3.5" /> VTT captions
          </span>
          <span 
            className="chip flex items-center gap-1 on"
          >
            <FileText className="w-3.5 h-3.5" /> TXT transcript
          </span>
          <span 
            className="chip flex items-center gap-1 on"
          >
            <Globe className="w-3.5 h-3.5" /> Auto-translated
          </span>
        </div>

        <div className="stats">
          <div className="stat">
            <div className="stat-n">3.5M+</div>
            <div className="stat-l">monthly extractions</div>
          </div>
          <div className="stat">
            <div className="stat-n">157+</div>
            <div className="stat-l">languages supported</div>
          </div>
          <div className="stat">
            <div className="stat-n">&lt;2s</div>
            <div className="stat-l">average load time</div>
          </div>
          <div className="stat">
            <div className="stat-n">Free</div>
            <div className="stat-l">always, no sign-up</div>
          </div>
        </div>
      </section>

      {/* Infinite scrolling marquee */}
      <div className="lang-strip" id="languages">
        <div className="lang-scroll" id="ls">
          {[...langs, ...langs].map((l, idx) => {
            const parts = l.split(' ');
            const flag = parts[0];
            const name = parts.slice(1).join(' ');
            return (
              <div key={idx} className="lang-pill">
                <span>{flag}</span>{name}
              </div>
            );
          })}
        </div>
      </div>


      {loading && (
        <div className="max-w-[1200px] mx-auto my-6 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex gap-4 animate-pulse">
            <div className="w-40 h-24 bg-gray-100 rounded-lg flex-shrink-0"></div>
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-gray-100 rounded w-3/4"></div>
              <div className="h-4 bg-gray-100 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="max-w-[1200px] mx-auto my-10 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start">
            {result.video.thumbnail && (
              <img
                src={result.video.thumbnail}
                alt={result.video.title}
                fetchPriority="high"
                className="w-full md:w-56 h-auto aspect-video object-cover rounded-xl border border-gray-100 shadow-sm"
              />
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 leading-tight mb-2">{result.video.title}</h2>
              <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                <User className="w-4 h-4 text-gray-400" /> {result.video.uploader}
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                {result.video.duration > 0 && (
                  <span className="bg-slate-100 px-3 py-1.5 rounded-full font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" /> {formatDuration(result.video.duration)}
                  </span>
                )}
                {result.video.viewCount > 0 && (
                  <span className="bg-slate-100 px-3 py-1.5 rounded-full font-medium flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-gray-400" /> {(result.video.viewCount / 1000000).toFixed(1)}M views
                  </span>
                )}
                {subtitleLanguages && subtitleLanguages.length > 0 && (
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-full font-medium flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" /> {subtitleLanguages.length} Subtitles
                  </span>
                )}
                {result.audioTracks && result.audioTracks.length > 0 && (
                  <span className="bg-slate-100 text-gray-700 px-3 py-1.5 rounded-full font-medium flex items-center gap-1">
                    <Music className="w-3.5 h-3.5 text-gray-500" /> {result.audioTracks.length} {result.audioTracks.length === 1 ? 'Audio Track' : 'Audio Tracks'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tool switch tabs */}
          {((result.audioTracks && result.audioTracks.length > 0) || subtitleLanguages.length > 0) && (
            <div className="flex border-b border-gray-200 gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => setActiveTool('subtitles')}
                className={`pb-3 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTool === 'subtitles'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Subtitles</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTool === 'subtitles'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {subtitleLanguages.length}
                </span>
              </button>

              {result.audioTracks && result.audioTracks.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTool('audio')}
                  className={`pb-3 px-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                    activeTool === 'audio'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Music className="w-4 h-4" />
                  <span>Audio Tracks</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    activeTool === 'audio'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {result.audioTracks.length}
                  </span>
                </button>
              )}
            </div>
          )}

          {activeTool === 'subtitles' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" /> Available Subtitle Languages
                <span className="ml-1 bg-indigo-50 text-indigo-600 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-100">
                  {subtitleLanguages.length}
                </span>
              </h3>
              
              <input
                type="text"
                placeholder="Search languages..."
                className="w-full max-w-md bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all atd-focus-ring"
                value={subSearch}
                onChange={(e) => setSubSearch(e.target.value)}
              />

              <div className="grid sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
                {filteredSubtitles.map((langCode) => {
                  const sub = result.subtitles[langCode];

                  return (
                    <div
                      key={langCode}
                      className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-sm hover:border-indigo-200 transition-all atd-card-hover"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{sub.flag || getLangFlag(langCode)}</span>
                          <span className="font-bold text-gray-800 text-sm">{sub.langName}</span>
                          <span className="text-gray-400 text-xs">({langCode})</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {langCode === originalLang && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
                              Original
                            </span>
                          )}
                          {sub.isAutoGenerated && (
                            <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5">
                              Auto
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSubtitleDownloadClick(langCode, 'vtt')}
                          disabled={preparingSubtitle[`${langCode}-vtt`]}
                          className="flex-1 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-center font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 border border-slate-200 hover:border-indigo-100 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {preparingSubtitle[`${langCode}-vtt`] ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FileText className="w-3.5 h-3.5" />
                          )}
                          VTT
                        </button>
                        <button
                          onClick={() => handleSubtitleDownloadClick(langCode, 'srt')}
                          disabled={preparingSubtitle[`${langCode}-srt`]}
                          className="flex-1 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-center font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 border border-slate-200 hover:border-indigo-100 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {preparingSubtitle[`${langCode}-srt`] ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FileText className="w-3.5 h-3.5" />
                          )}
                          SRT
                        </button>
                        <button
                          onClick={() => handleSubtitleDownloadClick(langCode, 'json3')}
                          disabled={preparingSubtitle[`${langCode}-json3`]}
                          className="flex-1 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-center font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 border border-slate-200 hover:border-indigo-100 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {preparingSubtitle[`${langCode}-json3`] ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <FileText className="w-3.5 h-3.5" />
                          )}
                          JSON
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filteredSubtitles.length === 0 && (
                  <p className="text-sm text-gray-500 col-span-2 py-4">No matching languages found.</p>
                )}
              </div>
            </div>
          )}

          {activeTool === 'audio' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Music className="w-5 h-5 text-indigo-600" /> Available Audio Tracks
                <span className="ml-1 bg-indigo-50 text-indigo-600 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-100">
                  {result.audioTracks?.length || 0}
                </span>
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {result.audioTracks.map((track: any, idx: number) => (
                  <div 
                    key={idx} 
                    className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-indigo-200 transition-all flex flex-col justify-between atd-card-hover"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{track.flag}</span>
                        <span className="font-bold text-gray-900">{track.langName}</span>
                      </div>
                      {track.isOriginal && (
                        <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> Original
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {track.qualities.map((q: any, qIdx: number) => (
                        <div 
                          key={qIdx} 
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                        >
                          <div>
                            <span className="font-bold text-gray-700">{q.label} Quality</span>
                            <span className="text-gray-400 ml-1.5">({q.ext.toUpperCase()} · {formatFileSize(q.filesize)})</span>
                          </div>
                          <button
                            disabled={!!downloadingFormat}
                            className="btn-pro py-1.5 px-3 flex items-center gap-1.5 text-[11px] rounded-lg shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-150 atd-btn-lift cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                            onClick={() => handleDownloadClick({ ...track, formatId: q.formatId, ext: q.ext, directUrl: q.directUrl, downloadType: q.downloadType })}
                          >
                            {downloadingFormat === `${q.formatId}-${q.ext}` ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Preparing...
                              </>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5" /> Download
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="divider"></div>

      {/* Feature section */}
      <section className="section" id="formats">
        <div className="section-label">YouTube Subtitle Download Formats</div>
        <div className="section-title">One URL. Every Subtitle Language, Timing &amp; Dubbed Audio Track.</div>
        <p className="section-body">
          We extract official, exact subtitles with timings alongside all available language dubbed audio tracks.
        </p>
        <div className="feat-grid">
          <div className="feat-card atd-card-hover">
            <div className="feat-icon bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="feat-title">Official YouTube Timings Included</div>
            <p className="feat-desc">Extract official, exact YouTube subtitles as SRT, VTT, or JSON. Timings are preserved perfectly for direct import into video editors.</p>
            <span className="feat-badge bg-indigo-50 text-indigo-600">Perfect timecodes</span>
          </div>
          <div className="feat-card atd-card-hover">
            <div className="feat-icon bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Globe className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="feat-title">Auto-Translated in 157+ Languages</div>
            <p className="feat-desc">Download auto-generated transcripts translated into any of the 157+ supported international languages instantly.</p>
            <span className="feat-badge bg-emerald-50 text-emerald-600">Auto translation</span>
          </div>
          <div className="feat-card atd-card-hover">
            <div className="feat-icon bg-amber-50 border border-amber-100 flex items-center justify-center">
              <Music className="w-6 h-6 text-amber-600" />
            </div>
            <div className="feat-title">YouTube Dubbed Audio &amp; Voice Downloader</div>
            <p className="feat-desc">The only tool that extracts and lets you download separate multi-language dubbed voice and audio tracks from videos.</p>
            <span className="feat-badge bg-amber-50 text-amber-600">Multi-Audio support</span>
          </div>
          <div className="feat-card atd-card-hover">
            <div className="feat-icon bg-rose-50 border border-rose-100 flex items-center justify-center">
              <Zap className="w-6 h-6 text-rose-600" />
            </div>
            <div className="feat-title">Mobile-Optimized Subtitle Engine</div>
            <p className="feat-desc">Loads under 2s on mobile. Competitors have poor mobile UX — 65% of users are mobile. We built for them first.</p>
            <span className="feat-badge bg-rose-50 text-rose-600">Fastest on mobile</span>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* Steps section */}
      <section className="section" id="how-it-works">
        <div className="section-label">How it works</div>
        <div className="section-title">Three steps, done.</div>
        <div className="steps">
          <div className="step">
            <div className="step-num">01</div>
            <div className="step-title">Paste the URL</div>
            <div className="step-desc">Copy any YouTube or Facebook video link and paste it into the input box above.</div>
          </div>
          <div className="step">
            <div className="step-num">02</div>
            <div className="step-title">Pick your subtitle language</div>
            <div className="step-desc">Search for your preferred language and choose SRT, VTT, or JSON format.</div>
          </div>
          <div className="step">
            <div className="step-num">03</div>
            <div className="step-title">Download instantly</div>
            <div className="step-desc">Your file is ready in seconds. No account, no email, no watermark.</div>
          </div>
        </div>
      </section>

      <div className="divider"></div>

      {/* CTA section */}
      <div className="cta-wrap bg-slate-50 border border-slate-100 rounded-3xl p-12 text-center max-w-4xl mx-auto my-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Start Downloading YouTube Subtitles — Free, Instant, No Signup</h2>
        <p className="text-gray-500 mb-6 max-w-lg mx-auto">No account required. Paste any YouTube URL and download subtitles in SRT, VTT, or JSON formats in seconds. Works on all devices.</p>
        <button className="btn-cta bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-3 px-8 font-bold shadow-md transition-all atd-btn-lift cursor-pointer" onClick={focusInput}>
          Extract your first subtitle →
        </button>
        <div className="cta-note mt-4 text-xs text-gray-400">
          Want unlimited speed + batch downloads? <a href="#" onClick={(e) => { e.preventDefault(); router.push('/pricing'); }} className="text-indigo-600 font-bold hover:underline">Try Pro for $3.99/mo</a>
        </div>
      </div>
    </div>
  );
}

export default function SubtitlesPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-4" />
        <p className="text-gray-500">Loading...</p>
      </div>
    }>
      <SubtitlesPageContent />
    </Suspense>
  );
}
