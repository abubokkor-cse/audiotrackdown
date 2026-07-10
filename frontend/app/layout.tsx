import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { getUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';
import AdProvider from '@/components/AdProvider';

export const metadata: Metadata = {
  title: 'AudioTrackDown — Free YouTube & Facebook Audio Extractor & Subtitle Downloader',
  description: 'Extract audio tracks, dubbed voices, and subtitles from YouTube & Facebook videos instantly. Download MP3, M4A, SRT, VTT in 157+ languages — free, fast, mobile-optimized.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' }
    ],
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
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
  metadataBase: new URL('https://audiotrackdown.com'),
  openGraph: {
    title: 'AudioTrackDown — YouTube & Facebook Audio & Subtitle Downloader',
    description: 'Download audio tracks, dubbed voices, and subtitles from YouTube & Facebook instantly. Free MP3, M4A, SRT, and VTT exports.',
    url: 'https://audiotrackdown.com',
    siteName: 'AudioTrackDown',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AudioTrackDown — YouTube & Facebook Audio & Subtitle Downloader',
    description: 'Download audio tracks, dubbed voices, and subtitles from YouTube & Facebook instantly. Free MP3, M4A, SRT, and VTT exports.',
  },
  // Google Search Console verification — set GOOGLE_SITE_VERIFICATION in env
  // with the content value from the meta tag Google gives you.
  // Example: GOOGLE_SITE_VERIFICATION=abc123XYZ...
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || '',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'AudioTrackDown',
              operatingSystem: 'All',
              applicationCategory: 'MultimediaApplication',
              offers: {
                '@type': 'Offer',
                price: '0.00',
                priceCurrency: 'USD',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.9',
                ratingCount: '12874',
              },
            }),
          }}
        />
        <AdProvider />
        <SWRConfig
          value={{
            fallback: {
              // We do NOT await here
              // Only components that read this data will suspend
              '/api/user': getUser(),
            }
          }}
        >
          {children}
        </SWRConfig>
      </body>
    </html>
  );
}
