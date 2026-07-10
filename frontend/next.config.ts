import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    clientSegmentCache: true
  },
  async redirects() {
    return [
      {
        source: '/subtitles',
        destination: '/youtube-subtitle-downloader',
        permanent: true,
      },
    ];
  }
};

export default nextConfig;
