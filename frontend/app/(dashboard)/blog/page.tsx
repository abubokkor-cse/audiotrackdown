import fs from 'fs';
import path from 'path';
import BlogList from './BlogList';

export const metadata = {
  title: 'Blog — YouTube Audio & Subtitle Guides | audiotrackdown',
  description: 'Read the latest guides, tips, and tutorials about text-to-speech, YouTube audio extraction, video subtitles, and AI voiceovers.',
  openGraph: {
    title: 'Blog — YouTube Audio & Subtitle Guides | audiotrackdown',
    description: 'Read the latest guides, tips, and tutorials about text-to-speech, YouTube audio extraction, video subtitles, and AI voiceovers.',
    type: 'website',
  }
};

interface BlogPost {
  title: string;
  slug: string;
  description: string;
  content: string;
  tags: string[];
  readingTime: number;
  publishedAt: string;
}

function getBlogPosts(): BlogPost[] {
  const postsDir = path.join(process.cwd(), 'content/blog/posts');
  
  if (!fs.existsSync(postsDir)) {
    return [];
  }

  const filenames = fs.readdirSync(postsDir);
  const posts = filenames
    .filter(filename => filename.endsWith('.json'))
    .map(filename => {
      const filePath = path.join(postsDir, filename);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileContent) as BlogPost;
    });

  // Sort posts by publication date (newest first)
  return posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export default async function BlogPage() {
  const posts = getBlogPosts();

  return (
    <BlogList posts={posts} />
  );
}
