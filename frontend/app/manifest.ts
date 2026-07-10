import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'AudioTrackDown — YouTube & Facebook Audio Extractor',
        short_name: 'AudioTrackDown',
        description:
            'Extract audio tracks, dubbed voices, and subtitles from YouTube & Facebook videos. Download MP3, M4A, SRT, VTT in 157+ languages — free.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#4f46e5',
        icons: [
            {
                src: '/icon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
            },
            {
                src: '/favicon.ico',
                sizes: '32x32',
                type: 'image/x-icon',
            },
        ],
        categories: ['utilities', 'productivity', 'media'],
    };
}
