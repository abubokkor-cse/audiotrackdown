'use client';

// Trigger Vercel rebuild to deploy frontend changes and match backend routing updates
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

export function HomePageContent({
  title = "Extract Audio Tracks & Dubbed Voices from YouTube & Facebook Videos — Free",
  subtitle = "Download original and AI-dubbed audio as MP3 from any YouTube or Facebook video. Extract subtitles in SRT, VTT, or TXT across 157 languages — no account needed, works on mobile."
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
  const [activeTool, setActiveTool] = useState<'audio' | 'subtitles'>('audio');
  const [subSearch, setSubSearch] = useState('');
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [preparingSubtitle, setPreparingSubtitle] = useState<{ [key: string]: boolean }>({});
  const [proPopupOpen, setProPopupOpen] = useState(false);

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
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract video details');
      }

      setResult(data.data);
      mutate('/api/user/limits');
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

      // Poll the status endpoint until the file is ready, THEN download.
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

      // File is confirmed ready — download via blob to preserve filename
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
  const filteredSubtitles = subtitleLanguages.filter((langCode) => {
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


      {/* Pro Upgrade Popup */}
      {proPopupOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full mx-4 border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-white text-center relative">
              <button
                onClick={() => setProPopupOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <Crown className="w-10 h-10 mx-auto mb-2" />
              <h3 className="text-xl font-bold">Unlock MP3 Downloads</h3>
              <p className="text-sm opacity-80 mt-1">Upgrade to Pro for high-quality MP3 audio</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-gray-700">MP3, M4A &amp; WebM downloads</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-gray-700">Zero ads — distraction-free</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-gray-700">Unlimited downloads in 157+ languages</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-gray-700">Priority high-speed downloads</span>
                </div>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-center">
                <span className="text-3xl font-bold text-indigo-600">$3.99</span>
                <span className="text-gray-400 text-sm">/month</span>
                <p className="text-xs text-gray-400 mt-1">Cancel anytime</p>
              </div>
              <button
                onClick={() => {
                  setProPopupOpen(false);
                  router.push('/pricing');
                }}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-95 text-white font-bold py-3.5 px-8 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Crown className="w-4 h-4" /> Get Pro Now
              </button>
              <button
                onClick={() => setProPopupOpen(false)}
                className="w-full text-gray-400 hover:text-gray-600 text-sm font-semibold py-2"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

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
          Need subtitles or captions?{' '}
          <a
            href="/youtube-subtitle-downloader"
            onClick={(e) => {
              e.preventDefault();
              router.push('/youtube-subtitle-downloader');
            }}
            className="text-indigo-600 font-bold hover:underline"
          >
            Download SRT &amp; VTT in 157+ languages →
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
            <Music className="w-3.5 h-3.5" /> MP3 audio
          </span>
          <span
            className="chip flex items-center gap-1 on"
          >
            <Volume2 className="w-3.5 h-3.5" /> Dubbed audio
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
                {result.audioTracks && result.audioTracks.length > 0 && (
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-full font-medium flex items-center gap-1">
                    <Music className="w-3.5 h-3.5 text-indigo-600" /> {result.audioTracks.length} {result.audioTracks.length === 1 ? 'Audio Track' : 'Audio Tracks'}
                  </span>
                )}
                {subtitleLanguages && subtitleLanguages.length > 0 && (
                  <span className="bg-slate-100 text-gray-700 px-3 py-1.5 rounded-full font-medium flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-gray-500" /> {subtitleLanguages.length} Subtitles
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
                  {result.audioTracks?.length || 0}
                </span>
              </button>

              {subtitleLanguages.length > 0 && (
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
              )}
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
                          <Sparkles className="w-3 h-3" /> Original
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {track.qualities.map((q: any, qIdx: number) => {
                        // MP3 requires server transcoding (costs bandwidth).
                        // Gate it as Pro-only for free users; M4A/WebM direct
                        // downloads are free (zero server cost).
                        const isMp3ProLocked = isFree && q.label === 'MP3';

                        return (
                          <div
                            key={qIdx}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-gray-700">{q.label} Quality</span>
                              <span className="text-gray-400">({q.ext.toUpperCase()} · {formatFileSize(q.filesize)})</span>
                              {isMp3ProLocked && (
                                <span className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5">
                                  <Crown className="w-2.5 h-2.5" /> Pro
                                </span>
                              )}
                            </div>
                            {isMp3ProLocked ? (
                              <button
                                className="py-1.5 px-3 flex items-center gap-1.5 text-[11px] rounded-lg shadow-sm bg-gray-200 hover:bg-indigo-600 text-gray-500 hover:text-white transition-all duration-150 cursor-pointer"
                                onClick={() => setProPopupOpen(true)}
                                title="Upgrade to Pro for MP3 downloads"
                              >
                                <Crown className="w-3.5 h-3.5" /> Unlock
                              </button>
                            ) : (
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
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
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
                          <span className="text-xl">{sub.flag}</span>
                          <span className="font-bold text-gray-800 text-sm">{sub.langName}</span>
                          <span className="text-gray-400 text-xs">({langCode})</span>
                        </div>
                        {sub.isAutoGenerated && (
                          <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5">
                            Auto
                          </span>
                        )}
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
        </div>
      )}

      <div className="divider"></div>

      {/* Feature section */}
      <section className="section" id="formats">
        <div className="section-label">YouTube Audio &amp; Subtitle Extraction Tools</div>
        <div className="section-title">One URL. Every Audio Track &amp; Subtitle Format You Need.</div>
        <p className="section-body">
          Unlike DownSub or SaveSubs, AudioTrackDown extracts the original audio track, AI-dubbed voice, and auto-translated captions — all from a single YouTube or Facebook URL.
        </p>
        <div className="feat-grid">
          <div className="feat-card atd-card-hover">
            <div className="feat-icon bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <Music className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="feat-title">YouTube Audio Track Extractor</div>
            <p className="feat-desc">Extract clean MP3 audio from any YouTube video. Perfect for podcasts, lectures, and language learning.</p>
            <span className="feat-badge bg-indigo-50 text-indigo-600">Blue ocean · no rival</span>
          </div>
          <div className="feat-card atd-card-hover">
            <div className="feat-icon bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Volume2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="feat-title">AI-Dubbed Voice Downloader</div>
            <p className="feat-desc">Download YouTube's auto-translated dubbed audio as MP3 — Arabic, Hindi, Spanish dubs and more.</p>
            <span className="feat-badge bg-emerald-50 text-emerald-600">Unique feature</span>
          </div>
          <div className="feat-card atd-card-hover">
            <div className="feat-icon bg-amber-50 border border-amber-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-amber-600" />
            </div>
            <div className="feat-title">Subtitle &amp; Caption Downloader</div>
            <p className="feat-desc">SRT, VTT, or plain text — download auto-generated or manual subtitles in any language YouTube offers.</p>
            <span className="feat-badge bg-amber-50 text-amber-600">157+ languages</span>
          </div>
          <div className="feat-card atd-card-hover">
            <div className="feat-icon bg-rose-50 border border-rose-100 flex items-center justify-center">
              <Zap className="w-6 h-6 text-rose-600" />
            </div>
            <div className="feat-title">Mobile-Optimized Extraction Engine</div>
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
            <div className="step-title">Pick your format</div>
            <div className="step-desc">Choose MP3 audio, dubbed voice track, SRT subtitles, or auto-translated captions.</div>
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
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Start Extracting YouTube Audio &amp; Subtitles — Always Free</h2>
        <p className="text-gray-500 mb-6 max-w-lg mx-auto">No account required. Paste any YouTube URL and download audio tracks, dubbed voices, or subtitles in seconds. Works on all devices.</p>
        <button className="btn-cta bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-3 px-8 font-bold shadow-md transition-all atd-btn-lift cursor-pointer" onClick={focusInput}>
          Extract your first track →
        </button>
        <div className="cta-note mt-4 text-xs text-gray-400">
          Want unlimited speed + batch downloads? <a href="#" onClick={(e) => { e.preventDefault(); router.push('/pricing'); }} className="text-indigo-600 font-bold hover:underline">Try Pro for $3.99/mo</a>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-4" />
        <p className="text-gray-500">Loading...</p>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
