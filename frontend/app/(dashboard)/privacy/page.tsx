'use client';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-sm">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-8 font-sans" style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}>
          Privacy Policy
        </h1>
        <p className="text-xs text-slate-400 mb-8">Last Updated: July 2, 2026</p>

        <div className="space-y-8 text-sm text-slate-600 leading-relaxed font-sans">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-800 font-sans" style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}>
              1. Information We Collect
            </h2>
            <p>
              We collect your email address when you register for an account or subscribe to our paid plans. In addition, when you use the conversion features, we transiently collect the URL of the third-party video (YouTube, Facebook) you submit. This URL is used only to process the conversion request and is not stored permanently.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-800 font-sans" style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}>
              2. How We Use Information
            </h2>
            <p>
              Your email address is used to authenticate you, manage your subscription plan (PRO vs. Free), track your extraction limits, and send transactional emails (such as payment receipts). We do not sell or rent your personal information to third parties.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-800 font-sans" style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}>
              3. Payments & Security
            </h2>
            <p>
              All payments are processed securely through Paddle. We do not store or have access to your raw payment card credentials. Paddle collects billing information directly to process subscriptions and checkouts securely under PCI-compliance.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-800 font-sans" style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}>
              4. Advertising (Adsterra)
            </h2>
            <p>
              We display ads to monetize our Free tier. Third-party ad networks, such as Adsterra, may use cookies or web beacons to gather non-personally identifiable information (such as your IP address, device type, or browser agent) to serve targeted advertisements based on your location and preferences. Paid PRO users do not receive any third-party ads.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-800 font-sans" style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}>
              5. Third-Party Platforms
            </h2>
            <p>
              Our Service connects transiently to third-party media platforms (YouTube, Facebook). We are not affiliated with these platforms, and your use of their services via our tool is governed by their respective Terms of Service and Privacy Policies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-800 font-sans" style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}>
              6. Contact Us
            </h2>
            <p>
              If you have any questions or concerns about this Privacy Policy or our data practices, feel free to contact us at support@audiotrackdown.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
