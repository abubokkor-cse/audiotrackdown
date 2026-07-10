import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSEOToolPage, SEO_TOOL_PAGES } from '../../../lib/seo-tools';

export async function generateStaticParams() {
  return SEO_TOOL_PAGES.map((page) => ({
    slug: page.slug.split('/'),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getSEOToolPage(slug);
  if (!page) {
    return {
      title: 'Page Not Found — audiotrackdown',
    };
  }

  return {
    title: `${page.metaTitle} | audiotrackdown`,
    description: page.metaDescription,
    keywords: [
      page.focusKeyword,
      `download ${page.focusKeyword}`,
      `free ${page.focusKeyword}`,
      `${page.focusKeyword} online`,
    ],
  };
}

export default async function SEOToolLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const page = getSEOToolPage(slug);
  if (!page) {
    notFound();
  }

  const capitalizedPlatform = page.platform === 'both' ? 'YouTube & Facebook' : page.platform === 'youtube' ? 'YouTube' : 'Facebook';

  // Customize FAQ content dynamically based on route type and keyword
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `How do I ${page.primaryIntent} from a video?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Simply copy the video URL, paste it into the extraction input field at the top of the page, click Extract, and select the desired file format (MP3, SRT, VTT, or JSON) to save it directly.`
        }
      },
      {
        '@type': 'Question',
        name: `Does it support secondary languages or dubbed voice tracks?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Yes! Our platform is fully optimized to detect and extract all secondary audio dub tracks (like Spanish, Hindi, or Arabic voiceovers) and their corresponding translated subtitle files.`
        }
      },
      {
        '@type': 'Question',
        name: `Is the ${page.focusKeyword} service free?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Yes, AudioTrackDown is completely free to use. You can extract and download files without creating an account or installing any software.`
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
