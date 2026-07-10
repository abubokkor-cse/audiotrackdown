import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Download Facebook Audio — Extract MP3 Audio Tracks Free | audiotrackdown',
  description: 'Download audio tracks and voices from Facebook videos instantly. Free high-speed MP3 and M4A exports. No signup or registration required.',
  keywords: [
    'download facebook audio',
    'extract audio from facebook video',
    'facebook audio downloader mp3',
    'facebook to mp3 converter',
    'get facebook video audio',
    'fb audio extractor'
  ]
};

export default function DownloadFacebookAudioLayout({
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
        name: 'How do I download audio from a Facebook video?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Copy the Facebook video link, paste it into the extraction bar at the top of this page, click Extract, and download your MP3 audio track instantly.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is the Facebook audio downloader free?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! AudioTrackDown is completely free to use, safe, and downloads files in high quality instantly with no limits.'
        }
      },
      {
        '@type': 'Question',
        name: 'Can I use this on mobile devices?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! AudioTrackDown is fully mobile-optimized and works perfectly on Android and iOS browsers.'
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
