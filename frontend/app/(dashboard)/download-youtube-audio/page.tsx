'use client';

import { Suspense } from 'react';
import { HomePageContent } from '../page';

export default function DownloadYoutubeAudioPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[400px] text-gray-500 font-medium">Loading YouTube Audio Downloader...</div>}>
      <HomePageContent
        title="Download YouTube Audio — High-Quality MP3 & Dubbed Voices Extractor"
        subtitle="Instantly extract and download original audio tracks and multi-language dubbed voices from any YouTube video in high-quality MP3 format. Free, safe, and mobile-optimized."
      />
    </Suspense>
  );
}
