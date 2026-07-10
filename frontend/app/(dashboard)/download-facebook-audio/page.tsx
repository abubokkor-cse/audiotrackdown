'use client';

import { Suspense } from 'react';
import { HomePageContent } from '../page';

export default function DownloadFacebookAudioPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[400px] text-gray-500 font-medium">Loading Facebook Audio Downloader...</div>}>
      <HomePageContent
        title="Download Facebook Audio — Free MP3 & Voice Track Extractor"
        subtitle="Instantly extract and download audio tracks and voices from any Facebook video in high-quality MP3 format. Free, fast, and no registration required."
      />
    </Suspense>
  );
}
