import Link from 'next/link';
import { FileText, Download, Globe, ArrowRight } from 'lucide-react';

export const metadata = {
    title: 'YouTube Subtitle Downloader — Download SRT, VTT & Transcripts Free',
    description:
        'Learn how to download YouTube subtitles and captions as SRT, VTT, or text files. Free online tool supports 157+ languages including auto-translated subtitles. No sign-up needed.',
    keywords: [
        'youtube subtitle downloader',
        'download youtube subtitles srt',
        'youtube caption downloader',
        'extract youtube transcripts',
        'youtube vtt download',
        'auto translate subtitle download',
    ],
    openGraph: {
        title: 'YouTube Subtitle Downloader — Download SRT, VTT & Transcripts Free',
        description:
            'Download YouTube subtitles and captions as SRT, VTT, or text in 157+ languages. Free, no sign-up, works on mobile.',
        type: 'article',
        url: 'https://audiotrackdown.com/blog/youtube-subtitle-downloader',
    },
};

export default function YouTubeSubtitleDownloaderPage() {
    return (
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'FAQPage',
                        mainEntity: [
                            {
                                '@type': 'Question',
                                name: 'How do I download YouTube subtitles as SRT?',
                                acceptedAnswer: { '@type': 'Answer', text: 'Paste the YouTube URL into AudioTrackDown, switch to the Subtitles tab, choose your language, and click SRT to download.' },
                            },
                            {
                                '@type': 'Question',
                                name: 'Can I download auto-translated subtitles?',
                                acceptedAnswer: { '@type': 'Answer', text: 'Yes, AudioTrackDown supports auto-translated subtitles in 157+ languages, including languages that do not have manual captions.' },
                            },
                            {
                                '@type': 'Question',
                                name: 'What subtitle formats are supported?',
                                acceptedAnswer: { '@type': 'Answer', text: 'AudioTrackDown supports SRT, VTT, and JSON formats. SRT is the most widely compatible with video players.' },
                            },
                        ],
                    }),
                }}
            />

            <div className="mb-8">
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-indigo-100 mb-4">
                    <FileText className="w-3.5 h-3.5" /> Tutorial
                </span>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-4" style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}>
                    YouTube Subtitle Downloader — Download SRT, VTT &amp; Transcripts
                </h1>
                <p className="text-lg text-gray-500 leading-relaxed">
                    Subtitles and captions are invaluable for accessibility, language learning, and content repurposing.
                    This guide shows you how to download YouTube subtitles in SRT, VTT, or text format — for free, in 157+ languages.
                </p>
            </div>

            <div className="prose prose-slate max-w-none">
                <h2>Why Download YouTube Subtitles?</h2>
                <ul>
                    <li><strong>Language learning</strong> — Study subtitle transcripts alongside video content</li>
                    <li><strong>Accessibility</strong> — Provide captions for deaf and hard-of-hearing viewers</li>
                    <li><strong>Content repurposing</strong> — Turn video transcripts into blog posts or articles</li>
                    <li><strong>Translation reference</strong> — Compare original and translated subtitles side by side</li>
                    <li><strong>Offline study</strong> — Save lecture transcripts for later review</li>
                </ul>

                <h2>Step 1: Copy the YouTube Video URL</h2>
                <p>
                    Find the YouTube video that has subtitles or captions. Copy the URL from your browser.
                    You can check if a video has subtitles by looking for the <strong>CC</strong> button on the YouTube player.
                </p>

                <h2>Step 2: Paste the URL and Switch to Subtitles</h2>
                <p>
                    Go to <Link href="/" className="text-indigo-600 font-semibold hover:underline">AudioTrackDown</Link>, paste
                    the URL, and click <strong>Extract</strong>. Then switch to the <strong>Subtitles</strong> tab to see all
                    available caption languages.
                </p>

                <h2>Step 3: Choose a Subtitle Format</h2>
                <p>AudioTrackDown supports three subtitle formats:</p>
                <ul>
                    <li><strong>SRT (SubRip)</strong> — The most widely supported format. Works with VLC, MPC, Premiere, and almost every video player.</li>
                    <li><strong>VTT (WebVTT)</strong> — The web standard for HTML5 video. Used by YouTube, Netflix web, and online players.</li>
                    <li><strong>JSON</strong> — Structured data format with timestamps. Best for developers and programmatic processing.</li>
                </ul>

                <h2>Step 4: Download the Subtitle File</h2>
                <p>
                    Click the format button (SRT, VTT, or JSON) next to your desired language. The subtitle file will download
                    to your device immediately.
                </p>

                <h2>Auto-Translated Subtitles in 157+ Languages</h2>
                <p>
                    Even if a video doesn&apos;t have manual captions in your language, YouTube often provides auto-translated
                    subtitles. AudioTrackDown detects and lists all available auto-translated tracks, so you can download
                    subtitles in languages like Hindi, Bengali, Arabic, Japanese, Korean, Swahili, and many more.
                </p>

                <h2>Frequently Asked Questions</h2>
                <h3>Can I download subtitles from private videos?</h3>
                <p>No — you can only download subtitles from publicly accessible YouTube videos.</p>

                <h3>Are auto-translated subtitles accurate?</h3>
                <p>
                    Auto-translated subtitles use YouTube&apos;s machine translation. They&apos;re generally good for understanding
                    the gist of content but may contain errors in technical or idiomatic language.
                </p>

                <h3>Can I download Facebook video subtitles?</h3>
                <p>Yes — AudioTrackDown also supports Facebook video URLs for subtitle extraction.</p>
            </div>

            <div className="mt-12 p-8 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-3xl text-center">
                <Globe className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Download Subtitles Now</h2>
                <p className="text-gray-500 mb-4">Free, no sign-up, 157+ languages supported.</p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-2xl shadow-lg transition-all atd-btn-lift"
                >
                    <Download className="w-4 h-4" /> Extract Subtitles <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </article>
    );
}
