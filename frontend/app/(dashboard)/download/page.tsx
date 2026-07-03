'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, ArrowLeft, Download, FileAudio, AlertTriangle } from 'lucide-react';

function DownloadPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const downloadId = searchParams.get('id');
  const filename = searchParams.get('filename') || 'audio';

  const isDirect = downloadId === 'direct';

  const [status, setStatus] = useState(isDirect ? 'ready' : 'processing');
  const [progress, setProgress] = useState(0);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll status endpoint if processing
  useEffect(() => {
    if (isDirect || !downloadId) return;

    let timer: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/download/status/${downloadId}`);
        if (!res.ok) {
          throw new Error('Failed to get download status');
        }
        const data = await res.json();
        
        if (data.status === 'ready') {
          setStatus('ready');
          setProgress(100);
        } else if (data.status === 'error') {
          setStatus('error');
          setError(data.error || 'Failed to transcode file');
        } else {
          setProgress(data.progress || 0);
          // Poll again in 2 seconds
          timer = setTimeout(checkStatus, 2000);
        }
      } catch (err: any) {
        setStatus('error');
        setError(err.message || 'Error checking preparation status');
      }
    };

    checkStatus();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [downloadId, isDirect]);

  // Trigger download automatically when ready
  useEffect(() => {
    if (status === 'ready' && !downloaded && downloadId && !isDirect) {
      triggerDownload();
    }
  }, [status]);

  const triggerDownload = () => {
    if (isDirect) return;
    setDownloaded(true);
    const downloadUrl = `/api/download/stream/${downloadId}`;
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = decodeURIComponent(filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 1000);
  };

  if (!downloadId) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-5">
          <FileAudio className="w-7 h-7 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Invalid Download Link</h1>
        <p className="text-gray-500 text-sm mb-6">This download link has expired or is invalid. Please extract a new audio track.</p>
        <Button
          onClick={() => router.push('/')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 px-6 font-semibold shadow-sm atd-btn-lift"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Extractor
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-20 px-4">
      <Card className="border-gray-200/80 shadow-xl rounded-3xl overflow-hidden text-center bg-white atd-stagger atd-stagger-1">
        <CardContent className="p-8 space-y-6">
          {status === 'processing' && (
            <>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" /> Preparing Your Download
              </h1>
              <p className="text-xs text-gray-500 font-mono break-all bg-gray-50 rounded-xl p-3 border border-gray-100">
                {decodeURIComponent(filename)}
              </p>

              {/* Progress Bar / Circle */}
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <svg className="absolute w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="#EEF2FF" strokeWidth="8" fill="transparent" />
                  <circle
                    cx="48" cy="48" r="40"
                    stroke="#4F46E5"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - progress / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-300"
                  />
                </svg>
                <span className="text-xl font-extrabold text-indigo-600">{progress}%</span>
              </div>

              <p className="text-sm text-gray-500 leading-normal">
                Transcoding audio to MP3 format on our server. This will take a few seconds...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Transcoding Failed</h1>
              <p className="text-xs text-gray-500 font-mono break-all leading-normal bg-gray-50 rounded-xl p-3 border border-gray-100">
                {decodeURIComponent(filename)}
              </p>
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 text-left text-xs leading-normal">
                Error: {error || 'Failed to prepare download.'}
              </p>

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  onClick={() => router.push('/')}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-6 font-bold shadow-sm"
                >
                  Go Back & Retry
                </Button>
              </div>
            </>
          )}

          {status === 'ready' && (
            <>
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Download Ready!</h1>
              <p className="text-xs text-gray-500 font-mono break-all leading-normal bg-gray-50 rounded-xl p-3 border border-gray-100">
                {decodeURIComponent(filename)}
              </p>

              <div className="flex flex-col gap-3 pt-2">
                {!isDirect && (
                  <Button
                    onClick={triggerDownload}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-6 font-bold flex items-center justify-center gap-2 shadow-sm atd-btn-lift"
                  >
                    <Download className="w-4 h-4" /> Download Now
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => router.push('/')}
                  className="w-full rounded-xl py-6 border-gray-200 hover:bg-gray-50 font-medium"
                >
                  Extract Another Video
                </Button>
              </div>

              {!isDirect && (
                <p className="text-xs text-gray-400">
                  If the download did not start automatically,{' '}
                  <a
                    href={`/api/download/stream/${downloadId}`}
                    download
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    click here to download manually
                  </a>.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DownloadPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-4" />
        <p className="text-gray-500 text-sm">Loading download link…</p>
      </div>
    }>
      <DownloadPageContent />
    </Suspense>
  );
}
