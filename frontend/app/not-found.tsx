import Link from 'next/link';
import { SearchX, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-white">
      <div className="max-w-md space-y-6 p-4 text-center">
        {/* Brand */}
        <Link href="/" className="inline-block mb-2">
          <span style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)", fontWeight: 700, fontSize: 20, color: '#0F172A', letterSpacing: '-0.5px' }}>
            audio<span style={{ color: '#4F46E5' }}>track</span>down
          </span>
        </Link>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <SearchX className="w-7 h-7 text-indigo-400" />
          </div>
        </div>

        {/* Copy */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-base text-gray-500 leading-relaxed">
            The audio extractor page you&apos;re looking for doesn&apos;t exist or has been moved. Try searching from the homepage.
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/"
          className="max-w-52 mx-auto flex items-center justify-center gap-2 py-2.5 px-5 border border-indigo-200 rounded-full shadow-sm text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
