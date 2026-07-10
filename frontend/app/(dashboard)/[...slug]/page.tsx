'use client';

import { Suspense, use, useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { getSEOToolPage, type SEOToolPage } from '../../../lib/seo-tools';
import { HomePageContent } from '../page';
import { SubtitlesPageContent } from '../youtube-subtitle-downloader/page';

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default function SEOToolPage({ params }: PageProps) {
  const { slug } = use(params);
  const page = getSEOToolPage(slug);

  if (!page) {
    notFound();
  }

  const capitalizedPlatform = page.platform === 'both' ? 'YouTube & Facebook' : page.platform === 'youtube' ? 'YouTube' : 'Facebook';

  return (
    <div className="w-full">
      {/* 1. Core Tool Interface */}
      {page.routeType === 'audio' ? (
        <HomePageContent
          title={page.h1}
          subtitle={`Isolate and download standalone audio files or alternate voice tracks from any ${capitalizedPlatform} link. Pure audio extracts retaining original high-fidelity bitrates.`}
        />
      ) : (
        <SubtitlesPageContent
          title={page.h1}
          subtitle={`Convert and download official closed captions or auto-generated transcripts from any ${capitalizedPlatform} video into timing-accurate subtitle files.`}
        />
      )}

      {/* 2. Long-Form Informative Content (Combats Thin Content Penalty) */}
      <section className="max-w-[800px] mx-auto px-6 py-12 border-t border-gray-100 mt-6">
        <article className="prose prose-slate max-w-none space-y-8">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-4">
              Why Choose AudioTrackDown for "{page.focusKeyword}"?
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm">
              Most standard online converters force you to process and download heavy video files (MP4) even when you only need a single audio track or subtitle layer. 
              <strong> AudioTrackDown</strong> solves this by decoupling the media streams in the cloud. You extract exactly what you need, saving bandwidth, storage, and processing time.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 bg-slate-50 border border-slate-100 rounded-2xl p-6">
            <div>
              <h3 className="font-bold text-gray-800 text-sm mb-2">⚡ Decoupled Cloud Parsing</h3>
              <p className="text-gray-500 text-xs leading-relaxed">
                Processing occurs entirely on our high-speed cloud cluster. No video compilation blocks are triggered, guaranteeing instant conversions.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm mb-2">🔒 100% Secure & Clean</h3>
              <p className="text-gray-500 text-xs leading-relaxed">
                Zero intrusive pop-unders, redirections, or bundled malware installer extensions. We respect user privacy and clean web standards.
              </p>
            </div>
          </div>

          {page.routeType === 'audio' ? (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">
                Unmatched Alternative Dubbed Voice Support
              </h3>
              <p className="text-gray-600 leading-relaxed text-sm mb-4">
                Traditional platforms like Y2Mate or YTMP3 only download the default original audio track. AudioTrackDown dynamically hooks into video manifests to pull alternative dubbed voice tracks (e.g. Spanish, Hindi, or Arabic audio feeds) as standalone high-quality MP3s.
              </p>
              <ul className="list-disc pl-5 text-gray-600 text-sm space-y-2">
                <li>Preserve original stream bitrates without quality loss.</li>
                <li>Download secondary dubbed voices and translation feeds.</li>
                <li>Works directly on mobile and desktop web browsers.</li>
              </ul>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">
                Precision Subtitle Timings & Format Conformance
              </h3>
              <p className="text-gray-600 leading-relaxed text-sm mb-4">
                Older caption downloaders like DownSub often yield corrupted SRT lines or strip out timing tags entirely. AudioTrackDown keeps microsecond timecode markers fully synchronized and yields clean, W3C-compliant SRT, VTT, and plain text transcripts.
              </p>
              <ul className="list-disc pl-5 text-gray-600 text-sm space-y-2">
                <li>Perfect timestamp sync for Adobe Premiere, Final Cut, and CapCut.</li>
                <li>Supports official auto-translated captions and custom manual uploads.</li>
                <li>Convert VTT and SRT timelines directly into clean reading text paragraphs.</li>
              </ul>
            </div>
          )}

          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              How to process your link:
            </h3>
            <ol className="list-decimal pl-5 text-gray-600 text-sm space-y-2">
              <li>Copy the video URL from {capitalizedPlatform}.</li>
              <li>Paste the link into the search bar at the top of this page.</li>
              <li>Click the <strong>Extract</strong> button.</li>
              <li>Choose your target dubbed language or subtitle format (SRT, VTT, or JSON) and download instantly.</li>
            </ol>
          </div>
        </article>
      </section>
    </div>
  );
}
