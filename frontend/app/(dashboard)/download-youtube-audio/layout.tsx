import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Download YouTube Audio — Extract High-Quality MP3 Free | audiotrackdown',
  description: 'Download audio tracks and dubbed voices from YouTube videos instantly. Free high-speed MP3 and M4A exports. No signup or account required.',
  keywords: [
    'download youtube audio',
    'extract audio from youtube video',
    'youtube audio downloader mp3',
    'download youtube voice tracks',
    'get youtube audio free',
    'youtube to mp3 extractor'
  ]
};

export default function DownloadYoutubeAudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do I download audio from a YouTube video?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Copy the YouTube link, paste it into the search box at the top of this page, select the Audio tab, and click Download next to your desired audio track or dubbed language.'
        }
      },
      {
        '@type': 'Question',
        name: 'Can I download dubbed audio tracks?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! AudioTrackDown supports extracting official multi-language dubbed voice tracks (e.g. Spanish or Hindi audio tracks) in addition to the original audio.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is the audio downloader free?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! AudioTrackDown is completely free to use, requires no registration, and downloads files in high quality instantly.'
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {children}
    </>
  );
}
