import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';

export const metadata: Metadata = {
  title: 'AudioTrackDown — Free YouTube & Facebook Audio Extractor & Subtitle Downloader',
  description: 'Extract audio tracks, dubbed voices, and subtitles from YouTube & Facebook videos instantly. Download MP3, M4A, SRT, VTT in 157+ languages — free, fast, mobile-optimized.',
  keywords: [
    'youtube audio extractor', 
    'facebook audio downloader', 
    'download youtube audio mp3', 
    'youtube dubbed audio download', 
    'download youtube subtitles', 
    'youtube srt download', 
    'youtube caption downloader', 
    'facebook video mp3 downloader',
    'youtube audio track download',
    'subtitle download from youtube',
    'youtube dubbing audio download',
    'youtube auto translate subtitle download',
    'download subtitles srt free',
    'youtube subtitle downloader all languages',
    'how to download subtitles from youtube'
  ],
  openGraph: {
    title: 'AudioTrackDown — Free YouTube & Facebook Audio Extractor & Subtitle Downloader',
    description: 'Extract audio tracks, dubbed voices, and subtitles from YouTube & Facebook videos instantly. Download MP3, M4A, SRT, VTT in 157+ languages.',
    type: 'website',
    url: 'https://audiotrackdown.com',
    siteName: 'AudioTrackDown',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AudioTrackDown — Free YouTube & Facebook Audio Extractor & Subtitle Downloader',
    description: 'Extract audio tracks, dubbed voices, and subtitles from YouTube & Facebook videos instantly. Download MP3, M4A, SRT, VTT in 157+ languages.',
  }
};


export const viewport: Viewport = {
  maximumScale: 1
};

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk', display: 'swap' });

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`bg-white text-black ${inter.variable} ${spaceGrotesk.variable}`}
    >
      <body className={`min-h-[100dvh] bg-white ${inter.className}`}>
        <SWRConfig
          value={{
            fallback: {
              // We do NOT await here
              // Only components that read this data will suspend
              '/api/user': getUser(),
              '/api/team': getTeamForUser()
            }
          }}
        >
          {children}
        </SWRConfig>
      </body>
    </html>
  );
}
