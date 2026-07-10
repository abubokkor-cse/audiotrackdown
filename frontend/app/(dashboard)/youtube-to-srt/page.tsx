'use client';

import { Suspense } from 'react';
import { SubtitlesPageContent } from '../subtitles/page';

export default function YoutubeToSrtPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[400px] text-gray-500 font-medium">Loading SRT Extractor...</div>}>
      <SubtitlesPageContent
        title="YouTube to SRT Downloader — Extract Official Subtitles & Dubbed Audio"
        subtitle="Quickly convert and download official YouTube closed captions into SubRip (.srt) format with perfect, unchanged timing sync. Plus, extract and download separate multi-language dubbed audio tracks instantly — all in one place."
      />
    </Suspense>
  );
}
