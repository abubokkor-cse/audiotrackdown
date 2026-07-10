import type { MetadataRoute } from 'next';
import { SEO_TOOL_PAGES } from '../lib/seo-tools';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://audiotrackdown.com';
    const lastModified = new Date();

    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: `${baseUrl}/`,
            lastModified,
            changeFrequency: 'weekly',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/youtube-subtitle-downloader`,
            lastModified,
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/youtube-to-srt`,
            lastModified,
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/download-youtube-audio`,
            lastModified,
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/download-facebook-audio`,
            lastModified,
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/pricing`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/blog/download-youtube-audio-mp3`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/blog/youtube-subtitle-downloader`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/blog/best-downsub-alternative-download-youtube-subtitles`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/blog/notegpt-subtitle-downloader-vs-audiotrackdown-timestamps`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/blog/top-5-subtitle-extractor-alternatives-comparison`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/blog/best-y2mate-alternative-no-ads-no-malware`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/blog/savefrom-net-not-working-try-this-instead`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/blog/y2mate-vs-audiotrackdown-which-is-safer`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/blog/youtube-dubbed-audio-download`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/blog/youtube-to-mp3-converter-guide`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ];

    const dynamicSEORoutes: MetadataRoute.Sitemap = SEO_TOOL_PAGES.map((page) => ({
        url: `${baseUrl}/${page.slug}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.8,
    }));

    return [...staticRoutes, ...dynamicSEORoutes];
}
