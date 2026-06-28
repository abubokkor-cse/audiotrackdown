import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'YouTube Subtitle Downloader — Download SRT, VTT & Transcripts | audiotrackdown',
  description: 'Free online tool to extract and download subtitles and captions from YouTube and Facebook. Save transcripts as SRT, VTT, or plain text in 100+ languages.',
  keywords: [
    'subtitle download from youtube',
    'download subtitles srt free',
    'youtube auto translate subtitle download',
    'youtube subtitle downloader all languages',
    'how to download subtitles from youtube',
    'extract youtube captions',
    'download facebook subtitles',
    'vtt download from youtube'
  ]
};

export default function SubtitlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
