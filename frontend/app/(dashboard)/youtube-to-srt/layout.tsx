import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'YouTube to SRT Downloader — Extract SRT Subtitles Free | audiotrackdown',
  description: 'Convert and download YouTube videos to SRT subtitle format. Free online SRT caption generator works instantly in 157+ languages with perfect sync.',
  keywords: [
    'youtube to srt',
    'download youtube to srt',
    'convert youtube video to srt file',
    'extract srt from youtube',
    'youtube to srt converter free',
    'srt subtitle downloader'
  ]
};

export default function YoutubeToSrtLayout({
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
        name: 'How do I download YouTube subtitles to SRT?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Copy the YouTube video link, paste it into the converter at the top of the page, click Extract, and click the SRT button next to your desired language.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is the SRT downloader free?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! AudioTrackDown allows you to extract and download SRT subtitle files completely free without any signup or software installation.'
        }
      },
      {
        '@type': 'Question',
        name: 'Does it support auto-translated subtitles?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, it can convert auto-generated closed captions and translate them into 157+ other languages before saving them as an SRT file.'
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
