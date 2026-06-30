'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { signOut } from '@/app/(login)/actions';
import Link from 'next/link';
import {
  Lock,
  Crown,
  ArrowLeft,
  Music,
  FileText,
  CreditCard,
  LogOut,
  Sparkles,
  Zap,
  Volume2,
  Download,
  AlertCircle,
  Check,
  CheckCircle2,
  Globe,
  Settings,
  Eye,
  Clock,
  Search,
  X,
  History,
  Languages,
  BadgeAlert,
  Play,
  User as UserIcon,
  SearchCode,
  ShieldCheck,
  RefreshCw,
  Menu,
  ChevronRight
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const FLAGS: Record<string, string> = {
  'English': '🇬🇧', 'Hindi': '🇮🇳', 'Spanish': '🇪🇸', 'French': '🇫🇷', 'Arabic': '🇸🇦',
  'Portuguese': '🇧🇷', 'German': '🇩🇪', 'Japanese': '🇯🇵', 'Korean': '🇰🇷', 'Chinese': '🇨🇳',
  'Russian': '🇷🇺', 'Turkish': '🇹🇷', 'Italian': '🇮🇹', 'Dutch': '🇳🇱', 'Polish': '🇵🇱',
  'Bengali': '🇧🇩', 'Indonesian': '🇮🇩', 'Thai': '🇹🇭', 'Vietnamese': '🇻🇳', 'Swedish': '🇸🇪',
};

// ── PRO UPGRADE WALL ──
function ProUpgradeWall({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 py-20">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6 shadow-md shadow-indigo-100">
        <Lock className="w-6 h-6 text-indigo-600 animate-pulse" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight text-center mb-2" style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}>
        Dashboard is Pro Only
      </h1>
      <p className="text-sm text-gray-500 text-center max-w-sm leading-relaxed mb-8">
        Free users can use our homepage with ads. Upgrade to Pro to get a distraction-free, unlimited, ad-free dashboard experience.
      </p>
      <button
        onClick={onUpgrade}
        className="w-full max-w-xs bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-95 text-white font-bold py-3.5 px-8 rounded-2xl shadow-lg shadow-indigo-500/25 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer atd-btn-lift"
      >
        <Crown className="w-4 h-4" /> Upgrade to Pro — $3.99/mo
      </button>
      <Link href="/" className="mt-4 text-xs font-semibold text-gray-400 hover:text-indigo-600 transition-colors flex items-center gap-1">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to free homepage
      </Link>
    </div>
  );
}

// ── AUDIO FORMAT CARDS ──
const AUDIO_FORMATS = [
  { id: 'mp3', label: 'MP3', desc: '192 kbps · universal', icon: Music },
  { id: 'm4a', label: 'M4A', desc: '256 kbps · high quality', icon: Volume2 },
  { id: 'webm', label: 'WebM', desc: 'Opus codec · compact', icon: Zap },
];

// ── SIDEBAR NAV ITEM ──
function SidebarItem({ active, icon: Icon, label, onClick }: { active: boolean; icon: any; label: string; onClick: () => void }) {
  return (
    <button
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
        active
          ? 'bg-indigo-50 text-indigo-700'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
      onClick={onClick}
    >
      <Icon className={`w-4 h-4 ${active ? 'text-indigo-600' : 'text-gray-400'}`} />
      {label}
    </button>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialUrl = searchParams.get('url') || '';

  // ── STATE ──
  const [activePage, setActivePage] = useState<'dashboard' | 'billing'>('dashboard');
  const [activeTool, setActiveTool] = useState<'audio' | 'subtitle'>('audio');
  const [audioUrl, setAudioUrl] = useState(initialUrl);
  const [subUrl, setSubUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [selTrackIdx, setSelTrackIdx] = useState(0);
  const [selFmt, setSelFmt] = useState('MP3');
  const [subSearch, setSubSearch] = useState('');
  const [selectedSubs, setSelectedSubs] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const [dlSuccess, setDlSuccess] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── DATA ──
  const { data: user } = useSWR<any>('/api/user', fetcher);
  const { data: limits, isLoading: limitsLoading } = useSWR('/api/user/limits', fetcher, { revalidateOnFocus: true });

  // Close sidebar on route/page change
  useEffect(() => {
    setSidebarOpen(false);
  }, [activePage]);

  // ── EXTRACT ──
  const handleExtract = useCallback(async (targetUrl: string, tool: 'audio' | 'subtitle') => {
    if (!targetUrl.trim()) { setError('Please paste a YouTube URL'); return; }
    setError(''); setLoading(true); setResult(null); setDlSuccess('');
    try {
      const res = await fetch('/api/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: targetUrl.trim() }) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to extract video details');
      setResult(data.data);
      setSelTrackIdx(0);
      mutate('/api/user/limits');
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── AUTO EXTRACT ──
  useEffect(() => {
    if (initialUrl) handleExtract(initialUrl, 'audio');
  }, [initialUrl, handleExtract]);

  // PRO GATE
  const isReallyPro = limits?.isPro === true && limits?.planName !== 'Free';
  if (!limitsLoading && limits && !isReallyPro) {
    return <ProUpgradeWall onUpgrade={() => router.push('/pricing')} />;
  }

  // ── AUDIO DOWNLOAD (same-tab) ──
  const handleAudioDownload = async () => {
    if (!result?.audioTracks?.[selTrackIdx]) return;
    const track = result.audioTracks[selTrackIdx];
    const quality = track.qualities?.find((q: any) => q.label === selFmt) || track.qualities?.[0];
    if (!quality) return;
    setDownloading(true); setDlSuccess('');
    try {
      if (quality.downloadType === 'direct' && quality.directUrl) {
        fetch('/api/download/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'audio', lang: track.langName })
        }).then(() => mutate('/api/user/limits'));

        const link = document.createElement('a');
        link.href = quality.directUrl;
        link.download = '';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => { if (document.body.contains(link)) document.body.removeChild(link); }, 500);
        setDlSuccess(`${track.langName} · ${selFmt} ready!`);
      } else {
        const res = await fetch('/api/download/prepare', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ 
            url: audioUrl.trim() || initialUrl, 
            formatId: quality.formatId, 
            langName: track.langName,
            targetExt: quality.ext,
          }) 
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Download failed');
        mutate('/api/user/limits');

        // Same-tab download via hidden anchor
        const streamUrl = `${BACKEND_URL}/api/download/stream/${data.downloadId}`;
        const link = document.createElement('a');
        link.href = streamUrl;
        link.download = data.filename || 'audio.mp3';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => { if (document.body.contains(link)) document.body.removeChild(link); }, 500);
        setDlSuccess(`${track.langName} · ${selFmt} ready!`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  // ── SUBTITLE DOWNLOAD ──
  const getSubUrl = (langCode: string, fmt: string) => {
    if (!result) return '';
    const sub = result.subtitles?.[langCode];
    if (!sub) return '';
    const videoId = result.video?.id;
    const isYT = subUrl.includes('youtube') || subUrl.includes('youtu.be') || initialUrl.includes('youtube');
    let targetUrl = isYT ? `https://www.youtube.com/watch?v=${videoId}` : sub.formats?.[0]?.url || '';
    return `${BACKEND_URL}/api/subtitle/download?url=${encodeURIComponent(targetUrl)}&lang=${langCode}&fmt=${fmt}&filename=${encodeURIComponent(result.video?.title || '')}`;
  };

  const subtitleLangs = result?.subtitles ? Object.keys(result.subtitles) : [];
  const filteredSubs = subtitleLangs.filter(lc => {
    const sub = result.subtitles[lc];
    return sub.langName?.toLowerCase().includes(subSearch.toLowerCase()) || lc.toLowerCase().includes(subSearch.toLowerCase());
  });

  const formatDuration = (s: number) => {
    if (!s) return '—';
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
  };

  const userInitials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  const PAGE_TITLES: Record<string, string> = { dashboard: 'Pro Dashboard', billing: 'Billing & Subscriptions' };

  // ── Sidebar Content (shared between desktop and mobile) ──
  const SidebarContent = () => (
    <>
      <div className="p-5 border-b border-slate-100 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <Link href="/" className="logo inline-block">
            <span className="text-lg font-bold tracking-tight text-slate-900" style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}>
              audio<span className="text-indigo-600">track</span>down
            </span>
          </Link>
          {/* Mobile close button */}
          <button
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-1 w-fit uppercase">
          <Crown className="w-3 h-3 text-indigo-600" /> PRO · Ads free
        </div>
      </div>

      <nav className="p-4 flex-1 space-y-5">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 px-3">
            Tools
          </span>
          <div className="mt-2 space-y-1">
            <SidebarItem
              active={activePage === 'dashboard'}
              icon={Zap}
              label="Dashboard"
              onClick={() => { setActivePage('dashboard'); setResult(null); setError(''); setDlSuccess(''); }}
            />
          </div>
        </div>

        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 px-3">
            Account
          </span>
          <div className="mt-2 space-y-1">
            <SidebarItem
              active={activePage === 'billing'}
              icon={CreditCard}
              label="Billing"
              onClick={() => setActivePage('billing')}
            />
            <SidebarItem
              active={false}
              icon={Settings}
              label="Settings"
              onClick={() => router.push('/dashboard/settings')}
            />
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-100 space-y-3">
        <div className="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-gray-900 truncate">
              {user?.name || user?.email?.split('@')[0] || 'Pro User'}
            </div>
            <div className="text-[10px] text-gray-400">Pro member</div>
          </div>
        </div>
        <button
          onClick={async () => { await signOut(); mutate('/api/user'); router.push('/'); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-red-500" /> Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="max-w-7xl mx-auto w-full" style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}>
      {/* ── MOBILE TOPBAR ── */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 sticky top-16 z-20">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-4 h-4" />
        </button>
        <h1 className="text-sm font-bold text-gray-900" style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}>
          {PAGE_TITLES[activePage]}
        </h1>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold text-white bg-indigo-600 rounded-full px-2 py-0.5 uppercase shadow-sm">
            PRO
          </span>
        </div>
      </div>

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      {sidebarOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="lg:hidden fixed left-0 top-0 bottom-0 w-[260px] bg-white border-r border-slate-200 z-50 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            <SidebarContent />
          </div>
        </>
      )}

      <div className="flex gap-0">
        {/* ── DESKTOP SIDEBAR ── */}
        <aside className="hidden lg:flex w-[230px] flex-shrink-0 bg-white border-r border-slate-200/80 flex-col self-start sticky top-16" style={{ height: 'calc(100vh - 4rem)' }}>
          <SidebarContent />
        </aside>

        {/* ── MAIN CONTENT AREA ── */}
        <div className="flex-1 min-w-0">
          {/* Desktop Topbar */}
          <header className="hidden lg:flex bg-white border-b border-slate-200/80 h-14 px-8 items-center justify-between sticky top-16 z-10">
            <h1 className="text-base font-bold text-gray-900" style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}>
              {PAGE_TITLES[activePage]}
            </h1>
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1 flex items-center gap-1 uppercase">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> No Ads
              </span>
              <span className="text-[10px] font-bold text-white bg-indigo-600 rounded-full px-2.5 py-1 uppercase shadow-sm">
                PRO MEMBER
              </span>
            </div>
          </header>

          <main className="p-4 sm:p-6 lg:p-8 max-w-5xl w-full">
            {/* ══ DASHBOARD PAGE ══ */}
            {activePage === 'dashboard' && (
              <div className="space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 atd-stagger atd-stagger-1">
                  {[
                    { label: 'Downloads', val: limits?.stats?.downloadsThisMonth ?? 0, hint: limits?.stats?.hintDownloads ?? 'This month', icon: History },
                    { label: 'Audio tracks', val: limits?.stats?.audioCount ?? 0, hint: 'MP3 + dubbed audio', icon: Music },
                    { label: 'Subtitle files', val: limits?.stats?.subtitleCount ?? 0, hint: 'SRT + VTT + TXT', icon: FileText },
                    { label: 'Languages', val: limits?.stats?.languagesCount ?? 0, hint: 'Across all downloads', icon: Languages },
                  ].map((s, idx) => (
                    <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-indigo-200 transition-all duration-200 atd-card-hover">
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{s.label}</span>
                        <s.icon className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="text-xl sm:text-2xl font-extrabold text-gray-900" style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}>{s.val}</div>
                      <p className="text-[10px] text-gray-400 mt-1">{s.hint}</p>
                    </div>
                  ))}
                </div>

                {/* Tool Selector Tabs */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-1.5 w-fit flex gap-1 shadow-sm atd-stagger atd-stagger-2">
                  <button
                    className={`flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      activeTool === 'audio'
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/10'
                        : 'text-gray-500 hover:bg-slate-50'
                    }`}
                    onClick={() => { setActiveTool('audio'); setResult(null); setError(''); setDlSuccess(''); }}
                  >
                    <Music className="w-4 h-4" /> Audio extractor
                  </button>
                  <button
                    className={`flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      activeTool === 'subtitle'
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/10'
                        : 'text-gray-500 hover:bg-slate-50'
                    }`}
                    onClick={() => { setActiveTool('subtitle'); setResult(null); setError(''); setDlSuccess(''); }}
                  >
                    <FileText className="w-4 h-4" /> Subtitle download
                  </button>
                </div>

                {/* ── AUDIO EXTRACTOR WORKSPACE ── */}
                {activeTool === 'audio' && (
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-8 shadow-sm space-y-6 atd-stagger atd-stagger-3">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2" style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}>
                        <Music className="w-5 h-5 text-indigo-600" /> Extract Audio Tracks
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">Paste a YouTube or Facebook URL to extract original audio tracks and translated dubbed voiceovers.</p>
                    </div>

                    {error && (
                      <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                      </div>
                    )}

                    {/* Extraction Form */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1 bg-slate-50 border-2 border-slate-200/60 focus-within:border-indigo-600 focus-within:bg-white focus-within:shadow-md focus-within:shadow-indigo-500/5 rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all">
                        <Play className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                        <input
                          className="flex-1 border-none outline-none text-sm text-gray-900 font-medium placeholder-gray-400 bg-transparent min-w-0"
                          type="text"
                          placeholder="Paste YouTube video link here…"
                          value={audioUrl}
                          onChange={(e) => setAudioUrl(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleExtract(audioUrl, 'audio')}
                        />
                        {audioUrl && (
                          <button 
                            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                            onClick={() => { setAudioUrl(''); setResult(null); setError(''); }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3.5 sm:py-0 rounded-2xl flex items-center justify-center gap-1.5 shadow-sm text-xs transition-all atd-btn-lift cursor-pointer disabled:bg-indigo-200 disabled:cursor-not-allowed"
                        disabled={loading}
                        onClick={() => handleExtract(audioUrl, 'audio')}
                      >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        {loading ? 'Fetching…' : 'Fetch tracks'}
                      </button>
                    </div>

                    {/* Metadata display */}
                    {result?.video && (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-4 items-center animate-in fade-in duration-300">
                        <div className="w-20 sm:w-24 h-14 sm:h-16 aspect-video bg-slate-900 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                          {result.video.thumbnail ? (
                            <img src={result.video.thumbnail} alt={result.video.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold">▶</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-sm font-bold text-gray-900 truncate leading-snug">{result.video.title}</div>
                          <div className="text-[11px] text-gray-400 mt-1 flex flex-wrap gap-2 sm:gap-3">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDuration(result.video.duration)}</span>
                            {result.video.viewCount > 0 && <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {(result.video.viewCount / 1e6).toFixed(1)}M</span>}
                            <span className="flex items-center gap-1"><Music className="w-3 h-3 text-indigo-500" /> {result.audioTracks?.length || 0} tracks</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Empty state */}
                    {!result && !loading && (
                      <div className="text-center py-12 text-gray-400">
                        <Music className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                        <p className="text-xs">Paste a YouTube URL and click <strong>Fetch tracks</strong> to begin.</p>
                      </div>
                    )}

                    {/* Tracks list & formats */}
                    {result?.audioTracks && result.audioTracks.length > 0 && (
                      <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="space-y-2.5">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            Available audio tracks
                            <div className="flex-1 h-px bg-slate-100" />
                          </div>
                          <div className="grid gap-2.5 max-h-56 overflow-y-auto pr-1">
                            {result.audioTracks.map((track: any, idx: number) => (
                              <div
                                key={idx}
                                className={`flex items-center gap-3 sm:gap-3.5 px-3 sm:px-4 py-3 rounded-2xl border-2 cursor-pointer transition-all ${
                                  selTrackIdx === idx
                                    ? 'border-indigo-600 bg-indigo-50/40 shadow-sm shadow-indigo-500/5'
                                    : 'border-slate-100 hover:border-indigo-200 bg-white'
                                }`}
                                onClick={() => setSelTrackIdx(idx)}
                              >
                                <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selTrackIdx === idx ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                                  {selTrackIdx === idx && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                                <span className="text-xl flex-shrink-0">{FLAGS[track.langName] || '🌐'}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-bold text-gray-900 truncate">{track.langName}</div>
                                  <div className="text-[10px] text-gray-400">
                                    {track.qualities?.[0] ? `${track.qualities[0].ext?.toUpperCase()} · ${track.qualities[0].label || ''} quality` : 'Audio track'}
                                  </div>
                                </div>
                                <div className="flex gap-1.5 flex-shrink-0">
                                  {track.isOriginal && <span className="bg-indigo-100 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded-md hidden sm:inline">Original</span>}
                                  {track.isDubbed && <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-md hidden sm:inline">Dubbed</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            Choose download format
                            <div className="flex-1 h-px bg-slate-100" />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {AUDIO_FORMATS.map((fmt) => (
                              <div
                                key={fmt.id}
                                className={`flex items-center gap-3 p-3 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all atd-card-hover ${
                                  selFmt === fmt.label
                                    ? 'border-indigo-600 bg-indigo-50/40'
                                    : 'border-slate-100 bg-white'
                                }`}
                                onClick={() => setSelFmt(fmt.label)}
                              >
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${selFmt === fmt.label ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-gray-400'}`}>
                                  <fmt.icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-gray-900">{fmt.label}</div>
                                  <div className="text-[10px] text-gray-400 mt-0.5 leading-snug">{fmt.desc}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold transition-all shadow-md shadow-indigo-500/10 atd-btn-lift flex items-center justify-center gap-2 cursor-pointer disabled:bg-indigo-200 disabled:cursor-not-allowed"
                          disabled={downloading}
                          onClick={handleAudioDownload}
                        >
                          {downloading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                          {downloading ? 'Extracting audio format…' : `Download ${result.audioTracks[selTrackIdx]?.langName || ''} · ${selFmt}`}
                        </button>

                        {dlSuccess && (
                          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3.5 animate-in fade-in duration-300">
                            <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm shadow-emerald-500/10">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-emerald-800">Ready to save!</div>
                              <div className="text-[10px] text-emerald-600 mt-0.5">{dlSuccess}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── SUBTITLE EXTRACTOR WORKSPACE ── */}
                {activeTool === 'subtitle' && (
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-8 shadow-sm space-y-6 atd-stagger atd-stagger-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2" style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}>
                          <FileText className="w-5 h-5 text-indigo-600" /> Download Subtitles &amp; Captions
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">Paste a YouTube or Facebook URL to extract manual or auto-translated subtitle options.</p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1 flex items-center gap-1 uppercase flex-shrink-0">
                        <Globe className="w-3.5 h-3.5 text-emerald-600" /> 157+ languages
                      </span>
                    </div>

                    {error && (
                      <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                      </div>
                    )}

                    {/* Extraction Form */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1 bg-slate-50 border-2 border-slate-200/60 focus-within:border-indigo-600 focus-within:bg-white focus-within:shadow-md focus-within:shadow-indigo-500/5 rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all">
                        <Play className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                        <input
                          className="flex-1 border-none outline-none text-sm text-gray-900 font-medium placeholder-gray-400 bg-transparent min-w-0"
                          type="text"
                          placeholder="Paste YouTube video link here…"
                          value={subUrl}
                          onChange={(e) => setSubUrl(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleExtract(subUrl, 'subtitle')}
                        />
                        {subUrl && (
                          <button 
                            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                            onClick={() => { setSubUrl(''); setResult(null); setError(''); }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3.5 sm:py-0 rounded-2xl flex items-center justify-center gap-1.5 shadow-sm text-xs transition-all atd-btn-lift cursor-pointer disabled:bg-indigo-200 disabled:cursor-not-allowed"
                        disabled={loading}
                        onClick={() => handleExtract(subUrl, 'subtitle')}
                      >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        {loading ? 'Fetching…' : 'Fetch subtitles'}
                      </button>
                    </div>

                    {/* Metadata display */}
                    {result?.video && (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-4 items-center animate-in fade-in duration-300">
                        <div className="w-20 sm:w-24 h-14 sm:h-16 aspect-video bg-slate-900 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                          {result.video.thumbnail ? (
                            <img src={result.video.thumbnail} alt={result.video.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold">▶</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-sm font-bold text-gray-900 truncate leading-snug">{result.video.title}</div>
                          <div className="text-[11px] text-gray-400 mt-1 flex flex-wrap gap-2 sm:gap-3">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDuration(result.video.duration)}</span>
                            <span className="flex items-center gap-1"><FileText className="w-3 h-3 text-indigo-500" /> {subtitleLangs.length} languages</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Empty state */}
                    {!result && !loading && (
                      <div className="text-center py-12 text-gray-400">
                        <FileText className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                        <p className="text-xs">Paste a YouTube URL and click <strong>Fetch subtitles</strong> to begin.</p>
                      </div>
                    )}

                    {/* Subtitle Languages Table */}
                    {result?.subtitles && subtitleLangs.length > 0 && (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="flex bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2.5 items-center gap-2.5 max-w-sm">
                          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <input
                            className="flex-1 bg-transparent border-none outline-none text-xs text-gray-700 font-medium placeholder-gray-400"
                            type="text"
                            placeholder="Search language…"
                            value={subSearch}
                            onChange={(e) => setSubSearch(e.target.value)}
                          />
                        </div>

                        {/* Mobile-friendly card list + Desktop table */}
                        <div className="border border-slate-100 rounded-2xl overflow-hidden">
                          {/* Desktop table */}
                          <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                  <th className="px-5 py-4">Language</th>
                                  <th className="px-5 py-4">Type</th>
                                  <th className="px-5 py-4">Download format</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50 text-xs font-semibold">
                                {filteredSubs.map((langCode) => {
                                  const sub = result.subtitles[langCode];
                                  const typeLabel = sub.isAutoTranslated ? 'Auto-translated' : sub.isAutoGenerated ? 'Auto-generated' : 'Manual';
                                  const typeStyle = sub.isAutoTranslated
                                    ? 'text-amber-700 bg-amber-50'
                                    : sub.isAutoGenerated
                                    ? 'text-emerald-700 bg-emerald-50'
                                    : 'text-indigo-700 bg-indigo-50';

                                  return (
                                    <tr key={langCode} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="px-5 py-3 flex items-center gap-2">
                                        <span className="text-xl">{FLAGS[sub.langName] || '🌐'}</span>
                                        <span className="text-gray-900">{sub.langName}</span>
                                        <span className="text-gray-400 font-normal">({langCode})</span>
                                      </td>
                                      <td className="px-5 py-3">
                                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md ${typeStyle}`}>
                                          {typeLabel}
                                        </span>
                                      </td>
                                      <td className="px-5 py-3">
                                        <div className="flex gap-1.5 flex-wrap">
                                          {['srt', 'vtt', 'json3'].map((fmt) => (
                                            <button
                                              key={fmt}
                                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-indigo-600 hover:text-indigo-600 transition-all font-bold text-[10px] text-gray-600 hover:bg-indigo-50/30 flex items-center gap-1.5 cursor-pointer"
                                              onClick={() => {
                                                const dlUrl = getSubUrl(langCode, fmt);
                                                if (dlUrl) {
                                                  const link = document.createElement('a');
                                                  link.href = dlUrl;
                                                  link.download = '';
                                                  link.style.display = 'none';
                                                  document.body.appendChild(link);
                                                  link.click();
                                                  setTimeout(() => { if (document.body.contains(link)) document.body.removeChild(link); }, 500);
                                                }
                                                fetch('/api/download/log', {
                                                  method: 'POST',
                                                  headers: { 'Content-Type': 'application/json' },
                                                  body: JSON.stringify({ type: 'subtitle', lang: sub.langName })
                                                }).then(() => mutate('/api/user/limits'));
                                              }}
                                            >
                                              <Download className="w-3 h-3" /> {fmt.toUpperCase()}
                                            </button>
                                          ))}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile card list */}
                          <div className="sm:hidden divide-y divide-slate-50">
                            {filteredSubs.map((langCode) => {
                              const sub = result.subtitles[langCode];
                              const typeLabel = sub.isAutoTranslated ? 'Auto-translated' : sub.isAutoGenerated ? 'Auto-generated' : 'Manual';
                              const typeStyle = sub.isAutoTranslated
                                ? 'text-amber-700 bg-amber-50'
                                : sub.isAutoGenerated
                                ? 'text-emerald-700 bg-emerald-50'
                                : 'text-indigo-700 bg-indigo-50';

                              return (
                                <div key={langCode} className="p-4 space-y-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{FLAGS[sub.langName] || '🌐'}</span>
                                    <span className="text-xs font-bold text-gray-900">{sub.langName}</span>
                                    <span className="text-[10px] text-gray-400">({langCode})</span>
                                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md ml-auto ${typeStyle}`}>
                                      {typeLabel}
                                    </span>
                                  </div>
                                  <div className="flex gap-1.5">
                                    {['srt', 'vtt', 'json3'].map((fmt) => (
                                      <button
                                        key={fmt}
                                        className="flex-1 text-center px-2 py-2 rounded-lg border border-slate-200 bg-white hover:border-indigo-600 hover:text-indigo-600 transition-all font-bold text-[10px] text-gray-600 cursor-pointer"
                                        onClick={() => {
                                          const dlUrl = getSubUrl(langCode, fmt);
                                          if (dlUrl) {
                                            const link = document.createElement('a');
                                            link.href = dlUrl;
                                            link.download = '';
                                            link.style.display = 'none';
                                            document.body.appendChild(link);
                                            link.click();
                                            setTimeout(() => { if (document.body.contains(link)) document.body.removeChild(link); }, 500);
                                          }
                                          fetch('/api/download/log', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ type: 'subtitle', lang: sub.langName })
                                          }).then(() => mutate('/api/user/limits'));
                                        }}
                                      >
                                        {fmt.toUpperCase()}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ══ BILLING PAGE ══ */}
            {activePage === 'billing' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 atd-stagger atd-stagger-1">
                {/* Plan Card */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}>Current plan</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Your active subscription details and parameters.</p>
                  </div>

                  {isReallyPro ? (
                    <>
                      <div className="bg-gradient-to-r from-indigo-550 to-violet-550 border border-indigo-200 bg-indigo-50 p-5 sm:p-6 rounded-2xl flex flex-col gap-1.5">
                        <div className="text-lg font-bold text-indigo-700" style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}>
                          {limits?.planName || 'Pro Plan'}
                        </div>
                        <div className="text-xs text-indigo-500 font-bold">
                          {limits?.planName?.includes('Annual') ? '$39.99 / year' : '$3.99 / month'}
                        </div>
                        <div className="text-[11px] text-gray-500 space-y-1.5 mt-4">
                          <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /> Unlimited extraction downloads</div>
                          <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /> Zero advertisements inside dashboard</div>
                          <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /> High quality dubbed track formats</div>
                          <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /> Priority proxy download pipelines</div>
                        </div>
                      </div>

                      <div className="text-xs divide-y divide-slate-100">
                        {[
                          ['Status', 'Active', 'text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold'],
                          ['Plan tier', limits?.planName || 'Pro Plan', 'text-gray-900 font-bold'],
                          ['Payment gateway', 'Paddle Billing', 'text-gray-900 font-bold']
                        ].map(([k, v, c]) => (
                          <div key={k} className="flex justify-between py-3">
                            <span className="text-gray-400">{k}</span>
                            <span className={c}>{v}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-3.5 rounded-xl border border-rose-200 transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        onClick={async () => {
                          if (confirm('Are you sure you want to cancel your subscription? You will lose unlimited downloads and other pro features.')) {
                            try {
                              const res = await fetch('/api/subscription/cancel', { method: 'POST' });
                              const data = await res.json();
                              if (!res.ok || !data.success) throw new Error(data.error || 'Failed to cancel');
                              alert('Your subscription has been canceled successfully.');
                              mutate('/api/user/limits');
                            } catch (err: any) {
                              alert(err.message || 'Something went wrong.');
                            }
                          }
                        }}
                      >
                        Cancel subscription
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="bg-slate-50 border border-slate-100 p-5 sm:p-6 rounded-2xl flex flex-col gap-1.5">
                        <div className="text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}>Free Plan</div>
                        <div className="text-xs text-gray-500">$0 / month</div>
                        <div className="text-[11px] text-gray-400 space-y-1.5 mt-4">
                          <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Unlimited downloads (MP3, M4A, WebM, SRT, VTT, JSON)</div>
                          <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Standard processing speed</div>
                          <div className="flex items-center gap-1.5"><X className="w-3.5 h-3.5 text-red-400" /> Adsterra ads and redirects active</div>
                          <div className="flex items-center gap-1.5"><X className="w-3.5 h-3.5 text-red-400" /> Priority proxy high-speed processing</div>
                        </div>
                      </div>

                      <div className="text-xs divide-y divide-slate-100">
                        {[
                          ['Status', 'Inactive', 'text-gray-400'],
                          ['Plan tier', 'Free', 'text-gray-900 font-bold'],
                        ].map(([k, v, c]) => (
                          <div key={k} className="flex justify-between py-3">
                            <span className="text-gray-400">{k}</span>
                            <span className={c}>{v}</span>
                          </div>
                        ))}
                      </div>

                      <Link
                        href="/pricing"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-500/10 cursor-pointer"
                      >
                        <Crown className="w-3.5 h-3.5" /> Upgrade to Pro
                      </Link>
                    </>
                  )}
                </div>

                {/* Invoice history */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}>Invoice history</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Your past transactions managed via Paddle.</p>
                  </div>
                  <div className="text-center text-gray-400 py-12 flex-1 flex flex-col items-center justify-center">
                    <CreditCard className="w-9 h-9 text-slate-300 mb-3" />
                    <p className="text-xs">No invoices yet. Your billing history will appear here after your first payment.</p>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-semibold text-gray-500">⏳ Loading dashboard…</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
