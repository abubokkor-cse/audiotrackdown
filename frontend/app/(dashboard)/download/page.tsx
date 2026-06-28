'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, ArrowLeft, Download, FileAudio, Sparkles } from 'lucide-react';

function DownloadPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const downloadId = searchParams.get('id');
  const filename = searchParams.get('filename') || 'audio';

  const [countdown, setCountdown] = useState(0);
  const [downloadReady, setDownloadReady] = useState(true);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (countdown <= 0) {
      setDownloadReady(true);
      return;
    }

    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const isDirect = downloadId === 'direct';
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    if (downloadReady && !downloaded && downloadId && !isDirect) {
      triggerDownload();
    }
    if (downloadReady && isDirect) {
      setDownloaded(true);
    }
  }, [downloadReady]);

  const triggerDownload = () => {
    if (isDirect) return;
    setDownloaded(true);
    const downloadUrl = `${BACKEND_URL}/api/download/stream/${downloadId}`;
    
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
          {!downloadReady ? (
            <>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Preparing Your Download</h1>
              <p className="text-xs text-gray-500 font-mono break-all bg-gray-50 rounded-xl p-3 border border-gray-100">
                {decodeURIComponent(filename)}
              </p>

              {/* Countdown ring */}
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <svg className="absolute w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="#EEF2FF" strokeWidth="8" fill="transparent" />
                  <circle
                    cx="48" cy="48" r="40"
                    stroke="#4F46E5"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - countdown / 3)}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <span className="text-3xl font-extrabold text-indigo-600">{countdown}</span>
              </div>

              <p className="text-sm text-gray-500">Your download starts in a few seconds.</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Download Started!</h1>
              <p className="text-xs text-gray-500 font-mono break-all leading-normal bg-gray-50 rounded-xl p-3 border border-gray-100">
                {decodeURIComponent(filename)}
              </p>

              <div className="flex flex-col gap-3 pt-2">
                {!isDirect && (
                  <Button
                    onClick={triggerDownload}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-6 font-bold flex items-center justify-center gap-2 shadow-sm atd-btn-lift"
                  >
                    <Download className="w-4 h-4" /> Download Again
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

              {isDirect ? (
                <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Direct download completed! Check your downloads folder.</span>
                </div>
              ) : (
                <p className="text-xs text-gray-400">
                  If the download did not start automatically,{' '}
                  <a
                    href={`${BACKEND_URL}/api/download/stream/${downloadId}`}
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
