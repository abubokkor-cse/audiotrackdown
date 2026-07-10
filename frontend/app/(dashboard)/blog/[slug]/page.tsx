import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface BlogPost {
  title: string;
  slug: string;
  description: string;
  content: string;
  tags: string[];
  readingTime: number;
  publishedAt: string;
  featuredImage?: string;
}

// Generate static routes for all posts at build time
export async function generateStaticParams() {
  const postsDir = path.join(process.cwd(), 'content/blog/posts');
  if (!fs.existsSync(postsDir)) return [];

  const filenames = fs.readdirSync(postsDir);
  return filenames
    .filter(filename => filename.endsWith('.json'))
    .map(filename => ({
      slug: filename.replace('.json', '')
    }));
}

// Generate dynamic SEO metadata for each post
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostData(slug);
  
  if (!post) {
    return {
      title: 'Post Not Found — audiotrackdown',
    };
  }

  return {
    title: `${post.title} — audiotrackdown Blog`,
    description: post.description,
    openGraph: {
      title: `${post.title} — audiotrackdown Blog`,
      description: post.description,
      type: 'article',
      publishedTime: post.publishedAt,
      tags: post.tags,
    }
  };
}

// Helper to read post JSON data
function getPostData(slug: string): BlogPost | null {
  try {
    const filePath = path.join(process.cwd(), 'content/blog/posts', `${slug}.json`);
    if (!fs.existsSync(filePath)) return null;
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent) as BlogPost;
  } catch (e) {
    return null;
  }
}

// Helper to get related posts sharing at least one tag
function getRelatedPosts(currentPost: BlogPost): BlogPost[] {
  const postsDir = path.join(process.cwd(), 'content/blog/posts');
  if (!fs.existsSync(postsDir)) return [];

  const filenames = fs.readdirSync(postsDir);
  const allPosts = filenames
    .filter(filename => filename.endsWith('.json') && filename !== `${currentPost.slug}.json`)
    .map(filename => {
      const filePath = path.join(postsDir, filename);
      return JSON.parse(fs.readFileSync(filePath, 'utf8')) as BlogPost;
    });

  return allPosts
    .filter(p => p.tags.some(tag => currentPost.tags.includes(tag)))
    .slice(0, 3);
}

// Injects two advertisement blocks dynamically inside the HTML content
function injectAdContent(contentHtml: string) {
  return contentHtml;
}

const uniqueUnsplashImages = [
  "1590602847861-f357a9332bbc", "1478737270239-2f02b77fc618", "1489599849927-2ee91cede3ba", 
  "1427504494785-3a9ca7044f45", "1485827404703-89b55fcc595e", "1598488035139-bdbb2231ce04", 
  "1460925895917-afdab827c52f", "1610116306796-6fea9f4fae38", "1484704849700-f032a568e944", 
  "1508700115892-45ecd05ae2ad", "1516280440614-37939bbacd6a", "1487180142328-0c4e37023af5", 
  "1524678606370-a47ad25cb82a", "1478720568477-152d9b164e26", "1626814026160-2237a95fc5a0", 
  "1536440136628-849c177e76a1", "1503676260728-1c00da094a0b", "1497633762265-9d179a990aa6", 
  "1522202176988-66273c2fd55f", "1581091226825-a6a2a5aee158", "1526374965328-7f61d4dc18c5", 
  "1465847899084-d164df4dedc6", "1511671782779-c97d3d27a1d4", "1505740420928-5e560c06d30e", 
  "1551836022-d5d88e9218df", "1590283603385-17ffb3a7f29f", "1454165804606-c3d57bc86b40", 
  "1563986768609-322da13575f3", "1498050108023-c5249f4df085", "1531297484001-80022131f5a1", 
  "1504384308090-c894fdcc538d", "1451187580459-43490279c0fa", "1517694712202-14dd9538aa97", 
  "1550751827-4bd374c3f58b", "1518770660439-4636190af475", "1519389950473-47ba0277781c", 
  "1527689368864-3a821dbccc34", "1531482615713-2afd69097978", "1534528741775-53994a69daeb", 
  "1493612276216-ee3925520721", "1515378791036-0648a3ef77b2", "1506157786151-b8491531f063", 
  "1560250097-0b93528c311a", "1516321318423-f06f85e504b3", "1513258496099-48168024addd", 
  "1528605248644-14dd04022da1", "1434030216411-0b793f4b4173", "1552664730-d307ca884978", 
  "1517245386807-bb43f82c33c4", "1542744173-8e0ee26cf8b3"
];

const SLUG_IMAGE_MAP: { [key: string]: string } = {
  'download-youtube-audio-mp3': '1505740420928-5e560c06d30e',
  'youtube-subtitle-downloader': '1586953208448-b95a79798f07',
  'youtube-dubbed-audio-download': '1451187580459-43490279c0fa',
  'youtube-to-mp3-converter-guide': '1487180142328-0c4e37023af5',
  'youtube-repurposing-strategy-podcast-blog-global-reach': '1590283603385-17ffb3a7f29f',
  'unlock-global-content-extract-dubbed-audio-translate-subtitles-youtube': '1484704849700-f032a568e944',
  'youtube-seo-subtitles-transcripts-ranking-boost': '1516280440614-37939bbacd6a',
  'unlock-youtube-content-your-language-ai-dubbed-subtitles': '1508700115892-45ecd05ae2ad'
};

function getUniqueImageForSlug(slug: string) {
  if (SLUG_IMAGE_MAP[slug]) return SLUG_IMAGE_MAP[slug];
  try {
    const postsDir = path.join(process.cwd(), 'content/blog/posts');
    if (!fs.existsSync(postsDir)) return uniqueUnsplashImages[0];
    const filenames = fs.readdirSync(postsDir).filter(f => f.endsWith('.json'));
    const sortedSlugs = filenames.map(f => f.replace('.json', '')).sort();
    const index = sortedSlugs.indexOf(slug);
    const resolvedIndex = index === -1 ? 0 : index;
    return uniqueUnsplashImages[resolvedIndex % uniqueUnsplashImages.length];
  } catch (e) {
    return uniqueUnsplashImages[0];
  }
}

function getFeaturedImage(post: BlogPost) {
  if (post.featuredImage && !post.featuredImage.includes('photo-1618005182384-a83a8bd57fbe')) return post.featuredImage;
  const imgRegex = /<img[^>]+src=['"]([^'"]+)['"]/i;
  const match = post.content.match(imgRegex);
  if (match && match[1]) {
    const src = match[1];
    if (src.includes('source.unsplash.com') || src.includes('photo-1618005182384-a83a8bd57fbe')) {
      const imgId = getUniqueImageForSlug(post.slug);
      return `https://images.unsplash.com/photo-${imgId}?auto=format&fit=crop&w=1000&q=80`;
    }
    return src;
  }
  const imgId = getUniqueImageForSlug(post.slug);
  return `https://images.unsplash.com/photo-${imgId}?auto=format&fit=crop&w=1000&q=80`;
}

function fixLegacyImages(contentHtml: string, slug: string = '') {
  if (!contentHtml) return '';
  return contentHtml.replace(/(https:\/\/source\.unsplash\.com\/[^\s'"]+|https:\/\/images\.unsplash\.com\/photo-1618005182384-a83a8bd57fbe[^\s'"]*)/g, () => {
    const imgId = getUniqueImageForSlug(slug);
    return `https://images.unsplash.com/photo-${imgId}?auto=format&fit=crop&w=1000&q=80`;
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostData(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedPosts(post);
  const featuredImage = getFeaturedImage(post);
  
  // Remove first inline image to prevent double renders, and resolve deprecated Unsplash sources
  const cleanedContent = post.content.replace(/<img[^>]+>/i, '');
  const fixedContent = fixLegacyImages(cleanedContent, post.slug);
  const formattedContent = injectAdContent(fixedContent);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // ── JSON-LD Structured Data (SEO) ──────────────────────────────────────────
  const baseUrl = 'https://www.audiotrackdown.com';
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    image: featuredImage,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      '@type': 'Organization',
      name: 'AudioTrackDown',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'AudioTrackDown',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/blog/${post.slug}`,
    },
    keywords: post.tags.join(', '),
    url: `${baseUrl}/blog/${post.slug}`,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',  item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Blog',  item: `${baseUrl}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${baseUrl}/blog/${post.slug}` },
    ],
  };
  // ────────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* JSON-LD structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

    <article className="post-container">
      <style dangerouslySetInnerHTML={{ __html: `
        .post-container {
          padding-top: 2rem;
          padding-bottom: 4rem;
          max-width: 1000px;
          margin-left: auto !important;
          margin-right: auto !important;
          padding-left: 1.5rem;
          padding-right: 1.5rem;
          width: 100%;
        }

        .post-back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #4b5563;
          font-size: 0.95rem;
          margin-bottom: 1.5rem;
          transition: color 0.2s;
        }

        .post-back-link:hover {
          color: #3b82f6;
        }

        .post-content {
          min-width: 0;
        }

        .post-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }

        @media (min-width: 992px) {
          .post-grid {
            grid-template-columns: 3fr 1fr;
          }
        }

        .post-header {
          margin-bottom: 2rem;
        }

        .post-meta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.9rem;
          color: #4b5563;
          margin-bottom: 0.5rem;
        }

        .post-title-main {
          font-size: clamp(1.8rem, 5vw, 3rem);
          line-height: 1.25;
          margin-bottom: 1rem;
          color: #111827;
          font-weight: 800;
        }

        .post-meta-tags {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .post-meta-tag {
          font-size: 0.78rem;
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.08);
          padding: 0.25rem 0.6rem;
          border-radius: 999px;
          border: 1px solid rgba(59, 130, 246, 0.15);
        }

        .post-body {
          color: #1f2937;
          font-size: 1.05rem;
          line-height: 1.8;
          letter-spacing: -0.005em;
        }

        .post-body h2 {
          font-size: 1.6rem;
          margin-top: 2.2rem;
          margin-bottom: 1rem;
          color: #111827;
          font-weight: 700;
        }

        .post-body h3 {
          font-size: 1.3rem;
          margin-top: 1.8rem;
          margin-bottom: 0.8rem;
          color: #111827;
          font-weight: 600;
        }

        .post-body p {
          margin-bottom: 1.4rem;
        }

        .post-body ul, .post-body ol {
          margin-bottom: 1.4rem;
          padding-left: 1.5rem;
        }

        .post-body li {
          margin-bottom: 0.5rem;
        }

        .post-body blockquote {
          border-left: 4px solid #3b82f6;
          background: rgba(59, 130, 246, 0.05);
          padding: 1rem 1.5rem;
          border-radius: 8px;
          font-style: italic;
          margin: 1.5rem 0;
          color: #4b5563;
        }

        .post-body pre, .post-body code {
          white-space: pre-wrap;
          word-break: break-word;
          overflow-x: auto;
          max-width: 100%;
        }

        .post-cta-card {
          margin-top: 3rem;
          padding: 2.5rem;
          text-align: center;
          background: #fff;
          border: 1px solid rgba(30, 27, 75, 0.12);
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
        }

        .post-cta-title {
          font-size: 1.4rem;
          margin-bottom: 0.5rem;
          color: #111827;
          font-weight: 700;
        }

        .post-cta-desc {
          color: #4b5563;
          margin-bottom: 1.5rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .post-sidebar {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .sidebar-widget {
          padding: 1.5rem;
          background: #fff;
          border: 1px solid rgba(30, 27, 75, 0.12);
          border-radius: 16px;
        }

        .sidebar-widget-title {
          font-size: 1.1rem;
          margin-bottom: 1rem;
          padding-bottom: 0.25rem;
          border-bottom: 1px solid rgba(30, 27, 75, 0.12);
          color: #111827;
          font-weight: 700;
        }

        .related-posts-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .related-post-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .related-post-item a {
          color: #111827;
          font-size: 0.95rem;
          font-weight: 600;
          line-height: 1.3;
          text-decoration: none;
        }

        .related-post-item a:hover {
          color: #3b82f6;
        }

        .related-post-date {
          font-size: 0.78rem;
          color: #4b5563;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-weight: 600;
          font-size: 0.9rem;
          padding: 12px 24px;
          border-radius: 999px;
          border: 1px solid transparent;
          cursor: pointer;
          transition: transform .35s, box-shadow .35s;
          white-space: nowrap;
          text-decoration: none;
        }
        .btn-primary {
          background: linear-gradient(135deg, #f59e0b, #ef4444);
          color: #fff;
          box-shadow: 0 10px 30px -10px rgba(239, 68, 68, .45);
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 36px -12px rgba(239, 68, 68, .6);
        }
      `}} />

      {/* Back to Blog */}
      <Link href="/blog" className="post-back-link">
        <span>←</span> Back to all articles
      </Link>

      <div className="post-grid">
        {/* Main Article Column */}
        <main className="post-content">
          <header className="post-header">
            <div className="post-meta">
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
              <span>•</span>
              <span>{post.readingTime} min read</span>
            </div>
            
            <h1 className="post-title-main">{post.title}</h1>
            
            <div className="post-meta-tags">
              {post.tags.map(tag => (
                <span key={tag} className="post-meta-tag">#{tag}</span>
              ))}
            </div>
          </header>

          {featuredImage && (
            <div className="post-featured-image-wrap" style={{ width: '100%', maxHeight: '480px', overflow: 'hidden', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid rgba(30, 27, 75, 0.12)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <img 
                src={featuredImage} 
                alt={post.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
              />
            </div>
          )}

          <div 
            className="post-body" 
            dangerouslySetInnerHTML={{ __html: formattedContent }} 
          />

          {/* Call To Action Box */}
          <div className="post-cta-card">
            <h3 className="post-cta-title">Try audiotrackdown Tools for Free</h3>
            <p className="post-cta-desc">
              Extract high-quality audio from YouTube, download transcripts, download dubbed audio tracks, and extract subtitles in SRT, VTT, and JSON format. No credit card required.
            </p>
            <Link href="/" className="btn btn-primary">
              ⚡ Extract Audio &amp; Subtitles
            </Link>
          </div>
        </main>

        {/* Sidebar Column */}
        <aside className="post-sidebar">
          {/* Related Articles */}
          {relatedPosts.length > 0 && (
            <div className="sidebar-widget">
              <h4 className="sidebar-widget-title">Related Articles</h4>
              <div className="related-posts-list">
                {relatedPosts.map(p => (
                  <div key={p.slug} className="related-post-item">
                    <Link href={`/blog/${p.slug}`}>
                      {p.title}
                    </Link>
                    <span className="related-post-date">{formatDate(p.publishedAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </article>
    </>
  );
}
