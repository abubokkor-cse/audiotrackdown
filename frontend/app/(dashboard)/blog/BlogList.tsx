'use client';

import { useState } from 'react';
import Link from 'next/link';

const CORE_CATEGORIES = [
  "Audio",
  "Subtitles",
  "Converters",
  "Guides"
];

const CURATED_TAGS = [
  "YouTube to MP3",
  "Subtitle Downloader",
  "Audio Extractor",
  "SRT Downloader",
  "VTT Converter",
  "YouTube Dubbing",
  "Free Tools",
  "Media Conversion",
  "Audio Quality",
  "Video Editing"
];

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

interface ProcessedPost extends BlogPost {
  categories: string;
  readingTime: number;
}

export default function BlogList({ posts }: { posts: BlogPost[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Pagination posts limit
  const postsPerPage = 6;

  // Helper to dynamically calculate reading time based on word count
  const calculateReadingTime = (content: string) => {
    if (!content) return 5;
    const words = content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
    return Math.max(2, Math.ceil(words / 220));
  };

  // Helper to dynamically categorize posts based on metadata and text matches
  const getPostCategories = (post: BlogPost) => {
    const slug = post.slug.toLowerCase();
    const tags = (post.tags || []).map(t => t.toLowerCase());

    if (
      slug.includes('subtitle') || 
      slug.includes('srt') || 
      slug.includes('vtt') || 
      tags.some(t => t.includes('subtitle') || t.includes('caption') || t.includes('srt') || t.includes('vtt'))
    ) {
      return "Subtitles";
    }

    if (
      slug.includes('convert') || 
      slug.includes('to-') ||
      tags.some(t => t.includes('convert') || t.includes('converter') || t.includes('conversion'))
    ) {
      return "Converters";
    }

    if (
      slug.includes('download') || 
      slug.includes('audio') || 
      slug.includes('mp3') || 
      tags.some(t => t.includes('audio') || t.includes('mp3') || t.includes('download'))
    ) {
      return "Audio";
    }

    return "Guides";
  };

  // Get specific category classes matching mockup styles
  const getCategoryClass = (category: string) => {
    switch (category) {
      case 'Audio': return 'cat-tech';
      case 'Subtitles': return 'cat-business';
      case 'Converters': return 'cat-science';
      case 'Guides':
      default:
        return 'cat-brand';
    }
  };

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

  // Helper to extract a stable, unique thumbnail image from the post content
  const getPostThumbnail = (post: BlogPost) => {
    if (post.featuredImage && !post.featuredImage.includes('photo-1618005182384-a83a8bd57fbe')) return post.featuredImage;
    if (SLUG_IMAGE_MAP[post.slug]) {
      return `https://images.unsplash.com/photo-${SLUG_IMAGE_MAP[post.slug]}?auto=format&fit=crop&w=600&q=80`;
    }
    const imgRegex = /<img[^>]+src=['"]([^'"]+)['"]/i;
    const match = post.content.match(imgRegex);
    if (match && match[1]) {
      const src = match[1];
      if (src.includes('source.unsplash.com') || src.includes('photo-1618005182384-a83a8bd57fbe')) {
        const sortedSlugs = posts.map(p => p.slug).sort();
        const index = sortedSlugs.indexOf(post.slug);
        const imageId = uniqueUnsplashImages[index % uniqueUnsplashImages.length];
        return `https://images.unsplash.com/photo-${imageId}?auto=format&fit=crop&w=600&q=80`;
      }
      return src;
    }
    const sortedSlugs = posts.map(p => p.slug).sort();
    const index = sortedSlugs.indexOf(post.slug);
    const imageId = uniqueUnsplashImages[index % uniqueUnsplashImages.length];
    return `https://images.unsplash.com/photo-${imageId}?auto=format&fit=crop&w=600&q=80`;
  };

  // Select the featured post
  const featuredSlug = 'youtube-to-mp3-converter-guide';
  const featuredPostRaw = posts.find(p => p.slug === featuredSlug) || posts[0];
  const featuredPost: ProcessedPost | null = featuredPostRaw ? {
    ...featuredPostRaw,
    categories: getPostCategories(featuredPostRaw),
    readingTime: calculateReadingTime(featuredPostRaw.content)
  } : null;

  // Process and map posts categories
  const processedPosts: ProcessedPost[] = posts.map(post => ({
    ...post,
    categories: getPostCategories(post),
    readingTime: calculateReadingTime(post.content)
  }));

  // Filter posts based on client states
  const filteredPosts = processedPosts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || post.categories === selectedCategory;
    const matchesTag = !selectedTag || (post.tags && post.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase()));
    
    return matchesSearch && matchesCategory && matchesTag;
  });

  const showHero = !searchQuery && !selectedCategory && !selectedTag && featuredPost;

  // Exclude featured post from the grid lists in "All" view to prevent duplicate display
  const gridPosts = showHero && featuredPost
    ? filteredPosts.filter(p => p.slug !== featuredPost.slug)
    : filteredPosts;

  // Pagination slicing
  const totalPages = Math.ceil(gridPosts.length / postsPerPage);
  const displayedPosts = gridPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <div className="blog-container">
      {/* Ported Design System & Scoped Layout Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .blog-container {
          --ink: var(--accent-violet, #1e1b4b);
          --ink-2: #312e81;
          --ink-3: #1e1b4b;
          --paper: var(--bg-primary, #f9fafb);
          --paper-dim: var(--bg-secondary, #f3f4f6);
          --amber: #f59e0b;
          --coral: #ef4444;
          --teal: #10b981;
          --violet: #8b5cf6;
          --text-on-ink: #f9fafb;
          --muted: #9ca3af;
          --muted-ink: #4b5563;
          --line: rgba(249,250,251,0.10);
          --line-paper: rgba(30, 27, 75, 0.12);
          --container: 1180px;
          --radius: 16px;

          max-width: var(--container);
          margin: 0 auto;
          padding: 0 1.5rem;
          padding-top: 2rem;
          padding-bottom: 4rem;
        }

        /* category colors */
        .blog-container .cat-tech { --cat: var(--coral); --cat-bg: rgba(239,68,68,.10); }
        .blog-container .cat-business { --cat: #10b981; --cat-bg: rgba(16,185,129,.12); }
        .blog-container .cat-science { --cat: #8b5cf6; --cat-bg: rgba(139,92,246,.12); }
        .blog-container .cat-brand { --cat: #f59e0b; --cat-bg: rgba(245,158,11,.12); }

        /* eyebrow */
        .blog-container .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: monospace;
          font-size: 0.76rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--coral);
        }
        .blog-container .eyebrow::before {
          content: "";
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--coral);
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.16);
        }
        .blog-container .eyebrow.on-ink {
          color: var(--amber);
        }
        .blog-container .eyebrow.on-ink::before {
          background: var(--amber);
          box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.18);
        }

        /* hero */
        .blog-container .hero {
          position: relative;
          overflow: hidden;
          padding: 48px 0;
          border-bottom: 1px solid var(--line-paper);
          margin-bottom: 32px;
        }
        .blog-container .hero::before {
          content: "";
          position: absolute;
          top: -160px;
          right: -160px;
          width: 480px;
          height: 480px;
          background: radial-gradient(circle at center, rgba(239, 68, 68, 0.11), transparent 70%);
          filter: blur(10px);
          pointer-events: none;
        }
        .blog-container .hero__head {
          max-width: 680px;
          margin: 0 auto;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .blog-container .hero__head h1 {
          font-size: clamp(2.2rem, 4.6vw, 3.6rem);
          margin-top: 14px;
          color: var(--ink);
          font-weight: 700;
          line-height: 1.1;
        }
        .blog-container .hero__head p {
          margin-top: 16px;
          color: var(--muted-ink);
          font-size: 1.05rem;
          max-width: 520px;
        }

        /* category nav strip */
        .blog-container .cat-strip {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 36px;
          align-items: center;
          justify-content: center;
        }
        .blog-container .cat-chip {
          font-family: monospace;
          font-size: 0.76rem;
          letter-spacing: .04em;
          padding: 9px 16px;
          border-radius: 999px;
          border: 1px solid var(--line-paper);
          color: var(--muted-ink);
          background: #fff;
          cursor: pointer;
          transition: all .25s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .blog-container .cat-chip .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--cat, var(--muted-ink));
          transition: background-color 0.2s;
        }
        .blog-container .cat-chip.is-active {
          background: var(--ink);
          color: var(--paper);
          border-color: var(--ink);
        }
        .blog-container .cat-chip.is-active .dot {
          background: currentColor;
        }
        .blog-container .cat-chip:hover:not(.is-active) {
          border-color: var(--cat, var(--coral));
          color: var(--cat, var(--coral));
        }

        /* search */
        .blog-container .search {
          position: relative;
          flex: 1;
          min-width: 220px;
          max-width: 340px;
        }
        .blog-container .search input {
          width: 100%;
          font-size: 0.92rem;
          padding: 12px 16px 12px 42px;
          border-radius: 999px;
          border: 1px solid var(--line-paper);
          background: #fff;
          color: var(--ink);
          outline: none;
          transition: border-color .25s, box-shadow .25s;
        }
        .blog-container .search input:focus {
          border-color: var(--coral);
          box-shadow: 0 0 0 4px rgba(239, 68, 68, .10);
        }
        .blog-container .search svg {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          width: 15px;
          height: 15px;
          color: var(--muted-ink);
        }

        /* layout */
        .blog-container .layout {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 48px;
          align-items: start;
        }

        /* featured */
        .blog-container .featured {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 40px;
          align-items: center;
          background: var(--ink);
          color: var(--text-on-ink);
          border-radius: 24px;
          padding: 44px;
          position: relative;
          overflow: hidden;
          transition: transform .4s cubic-bezier(.2,.8,.2,1), box-shadow .4s;
          text-align: left;
        }
        .blog-container .featured:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 40px rgba(30, 27, 75, 0.15);
        }
        .blog-container .featured::before {
          content: "";
          position: absolute;
          bottom: -140px;
          left: -120px;
          width: 380px;
          height: 380px;
          background: radial-gradient(circle at center, rgba(139, 92, 246, .16), transparent 70%);
          filter: blur(8px);
        }
        .blog-container .featured__meta {
          display: flex;
          gap: 12px;
          align-items: center;
          font-family: monospace;
          font-size: 0.72rem;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .blog-container .featured__meta span.dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--muted);
          display: inline-block;
        }
        .blog-container .featured h2 {
          font-size: clamp(1.6rem, 3.2vw, 2.5rem);
          font-weight: 700;
          line-height: 1.1;
        }
        .blog-container .featured p {
          margin-top: 14px;
          color: var(--muted);
          font-size: 1rem;
          max-width: 440px;
          line-height: 1.6;
        }
        .blog-container .featured__cta {
          margin-top: 24px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          color: var(--amber);
          font-size: 0.94rem;
        }
        .blog-container .featured__cta svg {
          width: 16px;
          height: 16px;
          transition: transform .3s;
        }
        .blog-container .featured:hover .featured__cta svg {
          transform: translateX(4px);
        }
        .blog-container .featured__art {
          position: relative;
          z-index: 1;
          background: var(--ink-2);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 28px;
        }
        .blog-container .featured__art .tag-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 18px;
        }
        .blog-container .tag {
          font-family: monospace;
          font-size: 0.7rem;
          padding: 6px 12px;
          border-radius: 999px;
          border: 1px solid var(--line);
          color: var(--muted);
        }

        /* section head */
        .blog-container .section-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 28px;
          gap: 20px;
          flex-wrap: wrap;
          border-bottom: 1px solid var(--line-paper);
          padding-bottom: 12px;
        }
        .blog-container .section-head h2 {
          font-size: clamp(1.4rem, 2.6vw, 1.9rem);
          color: var(--ink);
          font-weight: 700;
        }
        .blog-container .section-head .view-all-link {
          font-family: monospace;
          font-size: 0.78rem;
          color: var(--coral);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: color 0.2s;
        }
        .blog-container .section-head .view-all-link:hover {
          color: var(--ink);
        }
        .blog-container .section-head .view-all-link svg {
          width: 13px;
          height: 13px;
        }

        /* grid */
        .blog-container .grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        /* card */
        .blog-container .card {
          display: flex;
          flex-direction: column;
          background: #fff;
          border: 1px solid var(--line-paper);
          border-radius: var(--radius);
          overflow: hidden;
          transition: transform .4s cubic-bezier(.2,.8,.2,1), box-shadow .4s, border-color .4s;
          text-align: left;
        }
        .blog-container .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 22px 46px -28px rgba(30, 27, 75, 0.18);
          border-color: var(--cat, rgba(239, 68, 68, 0.3));
        }
        .blog-container .card__art {
          height: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: var(--cat-bg, var(--paper-dim));
          transition: background-color 0.2s;
        }
        .blog-container .card__art img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform .4s cubic-bezier(.2,.8,.2,1);
        }
        .blog-container .card:hover .card__art img {
          transform: scale(1.05);
        }
        .blog-container .card__body {
          padding: 22px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .blog-container .card__cat {
          font-family: monospace;
          font-size: 0.66rem;
          letter-spacing: .12em;
          text-transform: uppercase;
          color: var(--cat, var(--coral));
          margin-bottom: 10px;
        }
        .blog-container .card h3 {
          font-weight: 700;
          font-size: 1.12rem;
          margin-bottom: 8px;
          line-height: 1.35;
          color: var(--ink);
        }
        .blog-container .card p {
          color: var(--muted-ink);
          font-size: 0.88rem;
          flex: 1;
          line-height: 1.5;
        }
        .blog-container .card__meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid var(--line-paper);
          font-family: monospace;
          font-size: 0.72rem;
          color: var(--muted-ink);
        }
        .blog-container .card__meta .read {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--ink);
          font-weight: 600;
        }
        .blog-container .card__meta .read svg {
          width: 13px;
          height: 13px;
          transition: transform .3s;
        }
        .blog-container .card:hover .card__meta .read svg {
          transform: translateX(4px);
        }

        /* pagination */
        .blog-container .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          margin-top: 48px;
        }
        .blog-container .page-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid var(--line-paper);
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: monospace;
          font-size: 0.82rem;
          color: var(--muted-ink);
          cursor: pointer;
          transition: all .25s;
        }
        .blog-container .page-btn.is-active {
          background: var(--ink);
          color: var(--paper);
          border-color: var(--ink);
        }
        .blog-container .page-btn:hover:not(.is-active):not(:disabled) {
          border-color: var(--coral);
          color: var(--coral);
        }
        .blog-container .page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .blog-container .page-btn--nav {
          border-radius: 999px;
          width: auto;
          padding: 0 16px;
          gap: 8px;
        }

        /* sidebar */
        .blog-container .sidebar {
          display: flex;
          flex-direction: column;
          gap: 32px;
          text-align: left;
        }
        .blog-container .widget {
          background: #fff;
          border: 1px solid var(--line-paper);
          border-radius: var(--radius);
          padding: 26px;
        }
        .blog-container .widget h4 {
          font-family: monospace;
          font-size: 0.74rem;
          letter-spacing: .14em;
          text-transform: uppercase;
          color: var(--muted-ink);
          margin-bottom: 18px;
          font-weight: 400;
        }
        .blog-container .widget h3 {
          font-weight: 700;
          color: var(--ink);
          line-height: 1.2;
        }
        .blog-container .widget--dark {
          background: var(--ink);
          color: var(--text-on-ink);
          border-color: var(--ink);
        }
        .blog-container .widget--dark h4 {
          color: var(--muted);
        }

        .blog-container .popular {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .blog-container .popular-item {
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }
        .blog-container .popular-item__num {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--cat, var(--coral));
          flex-shrink: 0;
          width: 28px;
        }
        .blog-container .popular-item h5 {
          font-size: 0.94rem;
          font-weight: 600;
          line-height: 1.35;
          margin: 0;
        }
        .blog-container .popular-item a {
          color: var(--ink);
          transition: color 0.2s;
        }
        .blog-container .popular-item a:hover {
          color: var(--coral);
        }
        .blog-container .popular-item span {
          display: block;
          font-family: monospace;
          font-size: 0.7rem;
          color: var(--muted-ink);
          margin-top: 6px;
        }

        .blog-container .tagcloud {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .blog-container .tag-chip-sidebar {
          font-family: monospace;
          font-size: 0.74rem;
          padding: 7px 13px;
          border-radius: 999px;
          border: 1px solid var(--line-paper);
          color: var(--muted-ink);
          background: #fff;
          cursor: pointer;
          transition: all .25s;
        }
        .blog-container .tag-chip-sidebar:hover, .blog-container .tag-chip-sidebar.active {
          border-color: var(--coral);
          color: var(--coral);
          background: rgba(239, 68, 68, 0.06);
        }

        .blog-container .widget--brand p {
          color: var(--muted-ink);
          font-size: 0.9rem;
          margin-top: 10px;
          line-height: 1.6;
        }
        .blog-container .widget--brand .btn {
          margin-top: 16px;
        }

        .blog-container .widget--newsletter input {
          width: 100%;
          font-size: 0.9rem;
          padding: 12px 16px;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: var(--ink-2);
          color: var(--text-on-ink);
          outline: none;
          margin-bottom: 10px;
          transition: border-color 0.2s;
        }
        .blog-container .widget--newsletter input:focus {
          border-color: var(--amber);
        }
        .blog-container .widget--newsletter input::placeholder {
          color: var(--muted);
        }
        .blog-container .widget--newsletter p {
          color: var(--muted);
          font-size: 0.88rem;
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .blog-container .btn {
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
          transition: transform .35s cubic-bezier(.2,.8,.2,1), box-shadow .35s;
          white-space: nowrap;
          flex-shrink: 0;
          width: 100%;
          text-align: center;
        }
        .blog-container .btn--primary {
          background: linear-gradient(135deg, var(--amber), var(--coral));
          color: #fff;
          box-shadow: 0 10px 30px -10px rgba(239, 68, 68, .45);
        }
        .blog-container .btn--primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 36px -12px rgba(239, 68, 68, .6);
        }

        .blog-container .no-results {
          text-align: center;
          padding: 64px 32px;
          background: #fff;
          border: 1px solid var(--line-paper);
          border-radius: var(--radius);
        }
        .blog-container .no-results h3 {
          font-size: 1.4rem;
          color: var(--ink);
          margin-bottom: 8px;
        }
        .blog-container .no-results p {
          color: var(--muted-ink);
          font-size: 0.9rem;
        }

        /* responsive */
        @media (max-width: 1080px) {
          .blog-container .layout {
            grid-template-columns: 1fr;
          }
          .blog-container .sidebar {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
          }
        }
        @media (max-width: 860px) {
          .blog-container .featured {
            grid-template-columns: 1fr;
            gap: 28px;
            padding: 32px;
          }
          .blog-container .grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 620px) {
          .blog-container .sidebar {
            grid-template-columns: 1fr;
          }
        }
      `}} />

      {/* 1. Hero Header & Category Strip */}
      <header className="hero" id="top">
        <div className="hero__head">
          <span className="eyebrow">The audiotrackdown journal</span>
          <h1>Insights &amp; Guides</h1>
          <p>Discover tutorials, case studies, and updates to multiply your reach using state-of-the-art neural speech engines.</p>
        </div>

        <div className="cat-strip">
          <div className="search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="11" cy="11" r="7"/>
              <path d="M21 21l-4.3-4.3" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search articles…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <button
            className={`cat-chip ${!selectedCategory && !selectedTag ? 'is-active' : ''}`}
            onClick={() => {
              setSelectedCategory(null);
              setSelectedTag(null);
              setCurrentPage(1);
            }}
          >
            <span className="dot"></span>All
          </button>
          {CORE_CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`cat-chip ${getCategoryClass(cat)} ${selectedCategory === cat ? 'is-active' : ''}`}
              onClick={() => {
                setSelectedCategory(cat);
                setSelectedTag(null);
                setCurrentPage(1);
              }}
            >
              <span className="dot"></span>{cat}
            </button>
          ))}
        </div>
      </header>

      {/* 2. Featured Big Card (Visible in "All" view only) */}
      {showHero && featuredPost && (
        <Link href={`/blog/${featuredPost.slug}`} style={{ display: 'block', textDecoration: 'none' }}>
          <div className="featured">
            <div>
              <div className="featured__meta">
                <span className="eyebrow on-ink">Featured · {featuredPost.categories}</span>
                <span className="dot"></span>
                <span>{formatDate(featuredPost.publishedAt)}</span>
                <span className="dot"></span>
                <span>{featuredPost.readingTime} min read</span>
              </div>
              <h2>{featuredPost.title}</h2>
              <p>{featuredPost.description}</p>
              <div className="featured__cta">
                Read the guide
                <svg viewBox="0 0 16 16" fill="none">
                  <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div className="featured__art">
              <span className="eyebrow on-ink">Inside this guide</span>
              <h3 style={{ marginTop: '14px', fontSize: '1.25rem', color: 'var(--text-on-ink)', fontWeight: 600 }}>
                Audio quality · download speed · formats
              </h3>
              <p style={{ marginTop: '10px', color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.5 }}>
                Extract high-quality MP3s, download multilingual subtitles, and fetch dubbed audio tracks instantly.
              </p>
              <div className="tag-row">
                <span className="tag">100% Free</span>
                <span className="tag">No Registration</span>
                <span className="tag">157+ Languages</span>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Spacer between Hero and Layout grids */}
      <div style={{ height: '48px' }}></div>

      {/* 3. Two-Column Layout */}
      <div className="layout">
        
        {/* Main Feed Column */}
        <main className="feed-column">
          <div>
            <div className="section-head">
              <h2>
                {selectedCategory
                  ? `${selectedCategory} updates`
                  : selectedTag
                  ? `Tagged: #${selectedTag}`
                  : searchQuery
                  ? `Search Results: "${searchQuery}"`
                  : "Latest updates"}
              </h2>
              {(selectedCategory || selectedTag || searchQuery) && (
                <button
                  className="view-all-link"
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedTag(null);
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>

            {displayedPosts.length === 0 ? (
              <div className="no-results">
                <h3>No articles found</h3>
                <p>We couldn't find any articles matching your search criteria. Try a different query or clear the filters.</p>
              </div>
            ) : (
              <>
                <div className="grid" style={{ marginBottom: '40px' }}>
                  {displayedPosts.map(post => {
                    const cat = post.categories;
                    return (
                      <Link href={`/blog/${post.slug}`} key={post.slug} className={`card ${getCategoryClass(cat)}`} style={{ textDecoration: 'none' }}>
                        <div className="card__art">
                          <img src={getPostThumbnail(post)} alt={post.title} loading="lazy" />
                        </div>
                        <div className="card__body">
                          <span className="card__cat">{cat} · Article</span>
                          <h3>{post.title}</h3>
                          <p>{post.description}</p>
                          <div className="card__meta">
                            <span>{post.readingTime} min read · {formatDateShort(post.publishedAt)}</span>
                            <span className="read">
                              Read
                              <svg viewBox="0 0 16 16" fill="none">
                                <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Pagination Navigation */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="page-btn page-btn--nav"
                      disabled={currentPage === 1}
                      onClick={() => {
                        setCurrentPage(prev => Math.max(1, prev - 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M13 8H3M3 8L7 4M3 8L7 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Prev
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        className={`page-btn ${currentPage === page ? 'is-active' : ''}`}
                        onClick={() => {
                          setCurrentPage(page);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      className="page-btn page-btn--nav"
                      disabled={currentPage === totalPages}
                      onClick={() => {
                        setCurrentPage(prev => Math.min(totalPages, prev + 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      Next
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* Sidebar Widgets Column */}
        <aside className="sidebar">
          {/* Widget 1: Brand Info */}
          <div className="widget widget--brand">
            <h4>About audiotrackdown</h4>
            <h3 style={{ fontSize: '1.2rem' }}>Free YouTube Audio &amp; Subtitle Extractor</h3>
            <p>Download original audio tracks, multi-language dubbed voiceovers, and subtitles (SRT, VTT, JSON) from YouTube and Facebook. 100% free, fast, and mobile-optimized.</p>
            <Link href="/" className="btn btn--primary" style={{ textDecoration: 'none' }}>
              Try the extractor
            </Link>
          </div>

          {/* Widget 2: Most Read Week */}
          <div className="widget">
            <h4>Most read this week</h4>
            <div className="popular">
              <div className="popular-item cat-brand">
                <span className="popular-item__num">01</span>
                <div>
                  <h5>
                    <Link href="/blog/youtube-subtitle-downloader">
                      YouTube Subtitle Downloader — Download SRT, VTT &amp; Transcripts Free
                    </Link>
                  </h5>
                  <span>Subtitles · 5 min read</span>
                </div>
              </div>
              <div className="popular-item cat-business">
                <span className="popular-item__num">02</span>
                <div>
                  <h5>
                    <Link href="/blog/download-youtube-audio-mp3">
                      How to Download YouTube Audio as MP3 — Free Guide
                    </Link>
                  </h5>
                  <span>Audio · 5 min read</span>
                </div>
              </div>
              <div className="popular-item cat-tech">
                <span className="popular-item__num">03</span>
                <div>
                  <h5>
                    <Link href="/blog/youtube-dubbed-audio-download">
                      Download Dubbed Audio Tracks from YouTube — Hindi, Spanish &amp; More
                    </Link>
                  </h5>
                  <span>Dubbing · 5 min read</span>
                </div>
              </div>
              <div className="popular-item cat-science">
                <span className="popular-item__num">04</span>
                <div>
                  <h5>
                    <Link href="/blog/vtt-to-mp3-converter-guide">
                      WebVTT to MP3: Create AI Voiceovers from Video Subtitles
                    </Link>
                  </h5>
                  <span>Voiceover · 12 min read</span>
                </div>
              </div>
            </div>
          </div>

          {/* Widget 3: Newsletter Sign Up */}
          <div className="widget widget--dark widget--newsletter">
            <h4>Weekly digest</h4>
            {subscribed ? (
              <p style={{ color: 'var(--teal)', fontWeight: 'bold', margin: '10px 0' }}>Thank you! You are now subscribed.</p>
            ) : (
              <>
                <p>Get the latest guides and tutorials on media conversion, video translation, and audio extraction once a week.</p>
                <form onSubmit={handleSubscribe} style={{ margin: 0 }}>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn--primary">Subscribe</button>
                </form>
              </>
            )}
          </div>

          {/* Widget 4: Tag Cloud */}
          <div className="widget">
            <h4>Browse by topic</h4>
            <div className="tagcloud">
              {CURATED_TAGS.map(tag => (
                <button
                  key={tag}
                  className={`tag-chip-sidebar ${selectedTag === tag ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedTag(tag);
                    setSelectedCategory(null);
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
