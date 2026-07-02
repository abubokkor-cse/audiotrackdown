'use client';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-sm">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-8 font-sans" style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}>
          Terms of Service
        </h1>
        <p className="text-xs text-slate-400 mb-8">Last Updated: July 2, 2026</p>

        <div className="space-y-8 text-sm text-slate-600 leading-relaxed font-sans">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-800 font-sans" style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}>
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing and using AudioTrackDown ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not access or use our Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-800 font-sans" style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}>
              2. Description of Service
            </h2>
            <p>
              AudioTrackDown is an online utility tool designed to help users extract audio formats, dubbed language tracks, and subtitle files (SRT, VTT) from public third-party video platforms, such as YouTube and Facebook, for personal use.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-800 font-sans" style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}>
              3. Fair Use & Copyright
            </h2>
            <p>
              The Service must only be used to download content for personal, non-commercial use. Users are solely responsible for ensuring they have the legal right or permission from content owners to download and extract media. AudioTrackDown does not host or store any third-party video content on its servers, and acts purely as a transient proxy converter tool.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-800 font-sans" style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}>
              4. Subscription & Abuse
            </h2>
            <p>
              Paid subscription accounts (PRO Plan) are strictly for personal use by a single user. Account sharing, automated scripts, scraping, or excessive bulk querying that degrades the Service's performance is strictly prohibited and may result in immediate suspension without refund.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-800 font-sans" style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}>
              5. Limitation of Liability
            </h2>
            <p>
              AudioTrackDown is provided "as is" without warranty of any kind. We do not guarantee uninterrupted service or compatibility with all third-party media platforms. Under no circumstances shall AudioTrackDown be liable for any direct, indirect, or consequential damages resulting from the use or misuse of the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-800 font-sans" style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}>
              6. Changes to Terms
            </h2>
            <p>
              We reserve the right to revise or update these Terms of Service at any time. Changes will be posted directly to this page with the updated revision date.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
