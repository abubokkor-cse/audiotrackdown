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

const AD_DETAILS = {
  extract: {
    title: 'Play Free Strategy Games Online!',
    desc: 'No installation required. Play instantly with other players worldwide in your browser.',
    btn: 'Play Free Now →',
    url: 'https://www.highratedrevenuegate.com'
  },
  download: {
    title: 'Secure High-Speed VPN Protection',
    desc: 'Protect your privacy online and browse anonymously with 100% free VPN access.',
    btn: 'Install Free Extension →',
    url: 'https://www.highratedrevenuegate.com'
  }
};

interface AdModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'extract' | 'download' | 'subtitle';
  onTimerComplete: () => void;
  downloadUrl?: string;
  ext?: string;
  isLoading?: boolean;
}

function AdModal({ isOpen, onClose, title, type, onTimerComplete, downloadUrl, ext, isLoading }: AdModalProps) {
  const totalSeconds = (type === 'extract' || type === 'subtitle') ? 0 : 6;
  const [seconds, setSeconds] = useState(totalSeconds);
  const [elapsed, setElapsed] = useState(0);
  const [adRotation, setAdRotation] = useState(0);
  const [guidePhase, setGuidePhase] = useState(false);
  const [modalDownloading, setModalDownloading] = useState(false);
  const [modalDownloadError, setModalDownloadError] = useState<string | null>(null);
  const [subBlobUrl, setSubBlobUrl] = useState<string | null>(null);
  const [subFilename, setSubFilename] = useState<string>('');

  // Reset states when modal reopens
  useEffect(() => {
    if (!isOpen) {
      setModalDownloading(false);
      setModalDownloadError(null);
    }
  }, [isOpen]);

  const activeAd = AD_DETAILS[type === 'subtitle' ? 'download' : type as 'extract' | 'download'];
  const router = useRouter();

  const bannerRef = useRef<HTMLDivElement>(null);
  const runRef = useRef({ onTimerComplete, onClose, downloadUrl, ext });
  runRef.current = { onTimerComplete, onClose, downloadUrl, ext };

  const hasOpenedRef = useRef(false);

  // Auto close extraction modal when loading completes
  useEffect(() => {
    if (isOpen && type === 'extract' && !isLoading) {
      onClose();
    }
  }, [isOpen, type, isLoading, onClose]);

  // Track elapsed seconds during extraction
  useEffect(() => {
    if (!isOpen || type !== 'extract') {
      setElapsed(0);
      return;
    }
    setElapsed(0);
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, type]);

  // Rotate 300x250 banner ad every 6 seconds inside modal to maximize CPM
  useEffect(() => {
    if (isOpen) {
      setAdRotation(0);
      const interval = setInterval(() => {
        setAdRotation((prev) => prev + 1);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Dynamically load Adsterra 300x250 Banner scripts inside ref container (DISABLED for now)
  // useEffect(() => {
  //   if (isOpen && bannerRef.current) {
  //     bannerRef.current.innerHTML = '';
  // 
  //     const confScript = document.createElement('script');
  //     confScript.innerHTML = `
  //       atOptions = {
  //         'key' : '2b84ee378c9cb53ae6db891eb5f00e6a',
  //         'format' : 'iframe',
  //         'height' : 250,
  //         'width' : 300,
  //         'params' : {}
  //       };
  //     `;
  // 
  //     const invokeScript = document.createElement('script');
  //     invokeScript.src = 'https://www.highperformanceformat.com/2b84ee378c9cb53ae6db891eb5f00e6a/invoke.js';
  //     invokeScript.async = true;
  // 
  //     bannerRef.current.appendChild(confScript);
  //     bannerRef.current.appendChild(invokeScript);
  //   }
  // }, [isOpen, adRotation]);

  const getExtractionProgressText = () => {
    const isSubtitle = title.toLowerCase().includes('subtitle');
    if (elapsed < 3) return '🔍 Accessing YouTube metadata...';
    if (elapsed < 6) return '⚡ Downloading player configuration...';
    if (elapsed < 10) return '🛡️ Solving YouTube security challenges...';
    if (isSubtitle) {
      if (elapsed < 14) return '🎵 Detecting dubbed languages & caption tracks...';
      return '✨ Formatting subtitle tracks & preparing results...';
    } else {
      if (elapsed < 14) return '🎵 Detecting dubbed audio tracks & languages...';
      return '✨ Formatting audio formats & preparing results...';
    }
  };

  const getProgressWidth = () => {
    if (type === 'extract') {
      const calculated = 5 + elapsed * 6;
      return `${Math.min(calculated, 95)}%`;
    }
    return `${((totalSeconds - seconds) / totalSeconds) * 100}%`;
  };

  useEffect(() => {
    if (!isOpen) {
      setSeconds((type === 'extract' || type === 'subtitle') ? 0 : 6);
      setGuidePhase(false);
      hasOpenedRef.current = false;
      return;
    }
    const total = (type === 'extract' || type === 'subtitle') ? 0 : 6;
    setSeconds(total);
    setGuidePhase(false);
    hasOpenedRef.current = false;

    if (type === 'extract' || type === 'subtitle') {
      return;
    }

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);

          const checkReadyAndOpen = () => {
            if (hasOpenedRef.current) return;
            const currentUrl = runRef.current.downloadUrl;
            if (currentUrl) {
              hasOpenedRef.current = true;
              window.open(currentUrl, '_blank');
              runRef.current.onClose();
            } else {
              setTimeout(checkReadyAndOpen, 100);
            }
          };

          if (type === 'download') {
            if (runRef.current.ext === 'mp3') {
              // MP3: stay in same card — download button will appear inline
            } else {
              setGuidePhase(true);
            }
          } else if (type === 'subtitle') {
            // Subtitle: stay in same card — download button will appear inline
          } else {
            checkReadyAndOpen();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, type]);

  // Pre-fetch subtitles immediately when modal opens (no 6s wait)
  useEffect(() => {
    if (!isOpen || type !== 'subtitle' || !downloadUrl) {
      setSubBlobUrl(null);
      setSubFilename('');
      return;
    }

    let active = true;
    setModalDownloading(true);
    setModalDownloadError(null);

    fetch(downloadUrl)
      .then(async (res) => {
        if (!active) return;
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to prepare subtitle.');
        }

        const disposition = res.headers.get('content-disposition');
        let filename = '';
        if (disposition && disposition.includes('filename=')) {
          const filenameMatch = disposition.match(/filename="?([^";]+)"?/);
          if (filenameMatch && filenameMatch[1]) {
            filename = decodeURIComponent(filenameMatch[1]);
          }
        }
        if (!filename) {
          try {
            const urlObj = new URL(downloadUrl, window.location.origin);
            const rawFilename = urlObj.searchParams.get('filename');
            const fmt = urlObj.searchParams.get('fmt') || 'vtt';
            const lang = urlObj.searchParams.get('lang') || 'en';
            if (rawFilename) {
              const ext = fmt === 'json3' ? 'json' : fmt;
              filename = `${rawFilename.replace(/[^a-zA-Z0-9\-_. ]/g, '_')}-${lang}.${ext}`;
            }
          } catch (e) {}
        }
        if (!filename) {
          filename = 'subtitle.vtt';
        }

        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        if (active) {
          setSubBlobUrl(blobUrl);
          setSubFilename(filename);
          setModalDownloading(false);
        }
      })
      .catch((err) => {
        if (active) {
          console.error('[sub-prefetch] failed:', err);
          setModalDownloadError(err.message || 'Failed to prepare subtitle. Please try again.');
          setModalDownloading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isOpen, type, downloadUrl]);

  // ── SMARTLINK DISABLED — get traffic first, monetize later ──
  // To re-enable: uncomment the code below and remove the empty function.
  const triggerSmartlinkOnce = () => {};
  // const triggerSmartlinkOnce = () => {
  //   const smartlinkOpened = sessionStorage.getItem('atd_smartlink_opened');
  //   if (!smartlinkOpened) {
  //     sessionStorage.setItem('atd_smartlink_opened', 'true');
  //     window.open('https://degreeeruptionpredator.com/ahijxi03?key=f6dd3af4cba03cac352ac9823d404ac6', '_blank');
  //   }
  // };

  if (!isOpen) return null;

  if (guidePhase && type === 'download') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl max-w-2xl w-full mx-auto border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 text-white text-center">
            <p className="text-xs font-bold uppercase tracking-widest opacity-75 mb-1">Your file is ready</p>
            <h3 className="text-xl font-bold flex items-center justify-center gap-2">
              <Download className="w-5 h-5" /> How to Download Your File
            </h3>
            <p className="text-sm opacity-80 mt-1">Follow these quick steps to save your audio file</p>
          </div>
          <div className="p-4 bg-slate-50 border-b border-slate-100">
            <img
              src="/how-to-download.png"
              alt="How to download guide"
              className="w-full rounded-xl border border-slate-200 shadow-sm object-contain max-h-[380px]"
            />
          </div>
          <div className="px-6 py-5 flex flex-col items-center gap-3 text-center">
            <button
              onClick={() => {
                onClose();
                triggerSmartlinkOnce();
                try { if (downloadUrl) window.open(downloadUrl, '_blank'); } catch (e) { console.error(e); }
              }}
              className="w-full max-w-sm bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold py-3.5 px-8 rounded-2xl shadow-lg transition-all text-base flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Audio File
            </button>
            <p className="text-[11px] text-gray-400">A new tab will open. If nothing happens, check your pop-up blocker.</p>
            <p className="text-[11px] text-gray-400 mt-1">
              Tired of ads?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); onClose(); router.push('/pricing'); }} className="text-indigo-600 font-bold hover:underline">
                Get Ad-Free Pro for $3.99/mo →
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isMp3Ready = ext === 'mp3' && type === 'download' && seconds === 0;
  const isSubReady = type === 'subtitle' && seconds === 0;
  const isInlineReady = isMp3Ready || isSubReady;

  let directStreamUrl = '';
  
  if (isMp3Ready && downloadUrl) {
    try {
      const u = new URL(downloadUrl, window.location.origin);
      const dlId = u.searchParams.get('id');
      if (dlId) directStreamUrl = `/api/download/stream/${dlId}`;
    } catch {}
  } else if (isSubReady) {
    directStreamUrl = downloadUrl || '';
  }

  const downloadBtnLabel = type === 'subtitle' ? 'Download Subtitles' : 'Download MP3';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full mx-4 border border-slate-200 shadow-2xl relative animate-in fade-in zoom-in duration-200 text-center">
        {isInlineReady && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <h3 className="text-xl font-bold text-gray-900 mb-2 font-sans">{title}</h3>
        <div className="text-sm text-gray-500 mb-6 flex items-center justify-center gap-1.5">
          {type === 'extract' ? (
            <span className="text-indigo-600 font-semibold flex items-center gap-1.5 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
              {getExtractionProgressText()}
            </span>
          ) : seconds > 0 ? (
            <span>
              {type === 'subtitle' ? 'Preparing subtitles... ' : 'Preparing download... '}
              Please wait <strong className="text-indigo-600 text-base">{seconds}s</strong>
            </span>
          ) : modalDownloadError ? (
            <span className="text-red-600 font-semibold flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {modalDownloadError}
            </span>
          ) : (type === 'subtitle' && subBlobUrl) ? (
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Your file is ready! Click below to download.
            </span>
          ) : type === 'subtitle' && modalDownloading ? (
            <span className="text-indigo-600 font-semibold flex items-center gap-1.5 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
              Preparing subtitles... please wait
            </span>
          ) : (
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Your file is ready!
            </span>
          )}
        </div>

        {/* Ad Slot */}
        <div className="bg-slate-50 rounded-2xl min-h-[250px] flex flex-col items-center justify-center relative overflow-hidden mb-6">
          <div className="absolute top-2 left-2 bg-slate-200/80 text-slate-600 font-bold px-2 py-0.5 rounded text-[8px] uppercase tracking-wide z-10">Sponsored</div>
          <div ref={bannerRef} className="w-[300px] h-[250px] flex items-center justify-center bg-slate-100/50" />
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full mb-4 overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-1000 ease-linear"
            style={{ width: getProgressWidth() }}
          />
        </div>

        {(isMp3Ready || (type === 'subtitle' && subBlobUrl)) ? (
          <div className="flex flex-col items-center gap-2 animate-in fade-in duration-300">
            <button
              disabled={modalDownloading}
              onClick={async () => {
                triggerSmartlinkOnce();
                if (type === 'subtitle') {
                  if (subBlobUrl) {
                    const link = document.createElement('a');
                    link.href = subBlobUrl;
                    link.download = subFilename || 'subtitle.vtt';
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    onClose();
                  }
                  return;
                }

                // MP3 Audio download path
                setModalDownloading(true);
                try {
                  const fileRes = await fetch(directStreamUrl);
                  const contentType = fileRes.headers.get('content-type') || '';

                  // If backend returned JSON for audio, it means the file is not ready or errored.
                  if (!fileRes.ok || contentType.includes('application/json')) {
                    const errData = await fileRes.json().catch(() => ({}));
                    throw new Error(errData.error || 'File not ready yet, please try again.');
                  }

                  const blob = await fileRes.blob();
                  const blobUrl = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = blobUrl;
                  link.download = 'audio.mp3';
                  link.style.display = 'none';
                  document.body.appendChild(link);
                  link.click();
                  setTimeout(() => {
                    if (document.body.contains(link)) document.body.removeChild(link);
                    window.URL.revokeObjectURL(blobUrl);
                  }, 1000);
                } catch (err: any) {
                  console.error('[download] Manual download failed:', err);
                  setModalDownloadError(err.message || 'Download failed. Please try again.');
                } finally {
                  setModalDownloading(false);
                }
              }}
              className="w-full max-w-sm bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-3.5 px-8 rounded-2xl shadow-lg transition-all text-base flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-wait"
            >
              {modalDownloading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  {downloadBtnLabel}
                </>
              )}
            </button>
            {modalDownloadError && (
              <p className="text-xs text-red-500 mt-1">{modalDownloadError}</p>
            )}
            <p className="text-[11px] text-gray-400 mt-1">
              Tired of ads?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); onClose(); router.push('/pricing'); }}
                className="text-indigo-600 font-bold hover:underline">
                Get Ad-Free Pro for $3.99/mo →
              </a>
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-gray-400">{seconds > 0 ? `Please wait ${seconds}s…` : 'Almost done...'}</p>
            <p className="text-[11px] text-gray-400">
              Tired of ads?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); onClose(); router.push('/pricing'); }}
                className="text-indigo-600 font-bold hover:underline">
                Get Ad-Free Pro with unlimited downloads for $3.99/mo →
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SubtitlesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialUrl = searchParams.get('url') || '';

  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [activeTool, setActiveTool] = useState<'audio' | 'subtitles'>('subtitles');
  const [subSearch, setSubSearch] = useState('');

  const [adModalOpen, setAdModalOpen] = useState(false);
  const [adModalType, setAdModalType] = useState<'extract' | 'download' | 'subtitle'>('extract');
  const [adTargetTrack, setAdTargetTrack] = useState<any>(null);
  const [adDownloadUrl, setAdDownloadUrl] = useState<string>('');
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
      });
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [url]);


  const onExtractSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFree) {
      setAdModalType('extract');
      setAdModalOpen(true);
      handleExtract();
    } else {
      handleExtract();
    }
  };

  const handleDownloadClick = async (track: any) => {
    if (!track) return;
    if (isFree) {
      await prepareAndShowAdForDownload(track);
    } else {
      executeDownload(track);
    }
  };

  const executeDownload = async (track: any) => {
    setError('');
    const { directUrl, downloadType, formatId, langName, ext } = track;

    if (downloadType === 'direct' && directUrl) {
      window.open(directUrl, '_blank');
      return;
    }

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
      const finalUrl = `${window.location.origin}/download?id=${data.downloadId}&filename=${encodeURIComponent(data.filename)}`;
      window.open(finalUrl, '_blank');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const prepareAndShowAdForDownload = (track: any) => {
    setError('');
    const { directUrl, downloadType, formatId, langName, ext } = track;

    setAdTargetTrack(track);
    setAdModalType('download');
    setAdModalOpen(true);
    setAdDownloadUrl('');

    if (downloadType === 'direct' && directUrl) {
      setAdDownloadUrl(directUrl);
    } else {
      fetch('/api/download/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim() || initialUrl,
          formatId,
          langName,
          targetExt: ext,
        }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok || !data.success) throw new Error(data.error || 'Download preparation failed');
          mutate('/api/user/limits');
          const resolvedUrl = `${window.location.origin}/download?id=${data.downloadId}&filename=${encodeURIComponent(data.filename)}`;
          setAdDownloadUrl(resolvedUrl);
        })
        .catch((err) => {
          setError(err.message);
          setAdModalOpen(false);
        });
    }
  };

  const handleSubtitleDownloadClick = async (langCode: string, fmt: string) => {
    const key = `${langCode}-${fmt}`;
    if (preparingSubtitle[key]) return;

    const sub = result.subtitles[langCode];
    const videoId = result.video.id;
    const isYouTube = url.includes('youtube') || url.includes('youtu.be') || initialUrl.includes('youtube') || initialUrl.includes('youtu.be');
    
    let targetUrl = '';
    if (isYouTube) {
      targetUrl = `https://www.youtube.com/watch?v=${videoId}`;
    } else {
      const fmtObj = sub.formats?.find((f: any) => 
        (fmt === 'vtt' && f.ext === 'vtt') ||
        (fmt === 'srt' && (f.ext === 'srt' || f.ext === 'srv1')) ||
        (fmt === 'json3' && (f.ext === 'json3' || f.ext === 'json'))
      );
      targetUrl = fmtObj?.url || sub.formats?.[0]?.url || '';
    }
    
    const downloadUrl = `/api/subtitle/download?url=${encodeURIComponent(targetUrl)}&lang=${langCode}&fmt=${fmt}&filename=${encodeURIComponent(result.video.title)}`;
    
    if (isFree) {
      setAdDownloadUrl(downloadUrl);
      setAdTargetTrack({ downloadType: 'direct', directUrl: downloadUrl });
      setAdModalType('subtitle');
      setAdModalOpen(true);
    } else {
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
        let filename = `${result.video.title || 'subtitle'}-${langCode}.${fmt === 'json3' ? 'json' : fmt}`;
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
    }
  };

  const handleAdTimerComplete = () => {};

  const handleAdModalClose = () => {
    setAdModalOpen(false);
    setAdTargetTrack(null);
    setAdDownloadUrl('');
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
      <AdModal
        isOpen={adModalOpen}
        onClose={handleAdModalClose}
        title={
          adModalType === 'extract'
            ? activeTool === 'audio'
              ? '🔍 Fetching Audio...'
              : '🔍 Fetching Subtitles...'
            : adModalType === 'subtitle'
            ? '📥 Preparing Subtitles...'
            : '📥 Preparing High-Speed Stream...'
        }
        type={adModalType}
        onTimerComplete={handleAdTimerComplete}
        downloadUrl={adDownloadUrl}
        ext={adTargetTrack?.ext}
        isLoading={loading}
      />

      {/* Limits & Banner Info */}
      {limits && (
        <div className="max-w-[1200px] mx-auto mt-8 mb-4 flex flex-wrap gap-4 items-center justify-between bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              Your Current Plan: <span className="text-indigo-600 font-extrabold">{limits.planName}</span>
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {limits.isPro 
                ? 'Enjoy unlimited high-speed downloads with zero ads.' 
                : 'You are on the Free Plan. Enjoy unlimited downloads with ad-supported viewing.'}
            </p>
          </div>
          {!limits.isPro && (
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md font-semibold flex items-center gap-1.5 transition-all atd-btn-lift"
              onClick={() => router.push('/pricing')}
            >
              <Crown className="w-4 h-4" /> Upgrade to Pro
            </Button>
          )}
        </div>
      )}

      {/* Hero section */}
      <section className="hero">
        <div className="hero-eyebrow flex items-center justify-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-indigo-500" />
          Free Online Tool · No Sign-Up Required · 157+ Languages
        </div>
        <h1>Download YouTube &amp; Facebook Subtitles &amp; Captions — Free SRT, VTT &amp; Transcript Extractor</h1>
        <p className="hero-sub">
          Paste any YouTube or Facebook URL to extract auto-generated captions, manual subtitles, and AI-translated transcripts. 
          Download as SRT, VTT, or plain text in 157+ languages — instantly, no account needed.
        </p>

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
            <select
              className="type-select"
              value={activeTool}
              onChange={(e) => setActiveTool(e.target.value as 'audio' | 'subtitles')}
              disabled={loading}
            >
              <option value="subtitles">📝 Subtitles</option>
              <option value="audio">🎵 Audio</option>
            </select>
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

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center gap-2 max-w-2xl mx-auto text-sm text-left">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <div className="formats">
          <span 
            className={`chip cursor-pointer flex items-center gap-1 ${activeTool === 'subtitles' ? 'on' : ''}`}
            onClick={() => setActiveTool('subtitles')}
          >
            <FileText className="w-3.5 h-3.5" /> SRT subtitles
          </span>
          <span 
            className={`chip cursor-pointer flex items-center gap-1 ${activeTool === 'subtitles' ? 'on' : ''}`}
            onClick={() => setActiveTool('subtitles')}
          >
            <FileText className="w-3.5 h-3.5" /> VTT captions
          </span>
          <span 
            className={`chip cursor-pointer flex items-center gap-1 ${activeTool === 'subtitles' ? 'on' : ''}`}
            onClick={() => setActiveTool('subtitles')}
          >
            <FileText className="w-3.5 h-3.5" /> TXT transcript
          </span>
          <span 
            className={`chip cursor-pointer flex items-center gap-1 ${activeTool === 'subtitles' ? 'on' : ''}`}
            onClick={() => setActiveTool('subtitles')}
          >
            <Globe className="w-3.5 h-3.5" /> Auto-translated
          </span>
          <span 
            className={`chip cursor-pointer flex items-center gap-1 ${activeTool === 'audio' ? 'on' : ''}`}
            onClick={() => setActiveTool('audio')}
          >
            <Music className="w-3.5 h-3.5" /> MP3 audio
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

      {limits && !limits.isPro && (
        <div className="max-w-[1200px] mx-auto my-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-6 text-center text-xs text-gray-400 relative overflow-hidden">
          <div className="absolute top-2 left-2 bg-gray-200 text-gray-500 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide">
            Advertisement
          </div>
          <div className="flex flex-col items-center justify-center min-h-[80px]">
            <p className="font-bold text-gray-700 text-sm flex items-center gap-1">
              <Zap className="w-4 h-4 text-indigo-600" /> Convert YouTube Audio to High-Quality MP3 Free!
            </p>
            <p className="text-gray-500 mt-1 max-w-md">Upgrade to Pro for $3.99/mo to remove advertisements and enjoy unlimited instant downloads.</p>
            <Button
              variant="link"
              className="text-indigo-600 hover:text-indigo-700 font-bold mt-2 flex items-center gap-1"
              onClick={() => router.push('/pricing')}
            >
              <Crown className="w-3.5 h-3.5" /> Get Ad-Free Pro Now
            </Button>
          </div>
        </div>
      )}

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
              </div>
            </div>
          </div>

          {activeTool === 'subtitles' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" /> Available Subtitle Languages
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

          {activeTool === 'audio' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Music className="w-5 h-5 text-indigo-600" /> Available Audio Tracks
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
                            className="btn-pro py-1.5 px-3 flex items-center gap-1.5 text-[11px] rounded-lg shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-150 atd-btn-lift cursor-pointer"
                            onClick={() => handleDownloadClick({ ...track, formatId: q.formatId, ext: q.ext, directUrl: q.directUrl, downloadType: q.downloadType })}
                          >
                            <Download className="w-3.5 h-3.5" /> Download
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
        <div className="section-title">One URL. Every Subtitle Language &amp; Format You Need.</div>
        <p className="section-body">
          We support all official languages, auto-generated transcripts, and auto-translations offered by YouTube and Facebook.
        </p>
        <div className="feat-grid">
          <div className="feat-card atd-card-hover">
            <div className="feat-icon bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="feat-title">SRT &amp; VTT Subtitle Downloads</div>
            <p className="feat-desc">SRT, VTT, or plain text — download auto-generated or manual subtitles in any language YouTube offers.</p>
            <span className="feat-badge bg-indigo-50 text-indigo-600">157+ languages</span>
          </div>
          <div className="feat-card atd-card-hover">
            <div className="feat-icon bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Globe className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="feat-title">Auto-Translated Subtitles in 157+ Languages</div>
            <p className="feat-desc">Instantly download subtitles translated into any of the 100+ supported international languages.</p>
            <span className="feat-badge bg-emerald-50 text-emerald-600">Auto translation</span>
          </div>
          <div className="feat-card atd-card-hover">
            <div className="feat-icon bg-amber-50 border border-amber-100 flex items-center justify-center">
              <Music className="w-6 h-6 text-amber-600" />
            </div>
            <div className="feat-title">Bonus: YouTube Audio Extractor</div>
            <p className="feat-desc">Want the audio too? You can easily toggle and download premium high-speed MP3 audio tracks.</p>
            <span className="feat-badge bg-amber-50 text-amber-600">All-in-one</span>
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
