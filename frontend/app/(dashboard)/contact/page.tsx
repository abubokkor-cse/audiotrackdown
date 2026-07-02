'use client';

import { Mail, HelpCircle, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const faqs = [
    {
      q: 'How many languages do you support?',
      a: 'We support over 157 languages. Our tool extracts original audio tracks as well as all multi-language dubbed voiceovers and subtitles.'
    },
    {
      q: 'Why did my download link fail to open?',
      a: 'Please check your browser pop-up blocker settings. If it still fails, you can copy the download link directly or click the manual Download button in the guide.'
    },
    {
      q: 'Can I request a refund for my PRO purchase?',
      a: 'Yes! We offer a 14-day money-back guarantee. If you are not satisfied, contact us at support@audiotrackdown.com with your invoice details.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight font-sans" style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}>
            Contact Support & FAQ
          </h1>
          <p className="text-base text-slate-500 max-w-xl mx-auto">
            Have questions or encountered an issue? Our support team is here to help you.
          </p>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Email Support Card */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-indigo-500/20 border border-indigo-400/20 rounded-2xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-indigo-300" />
              </div>
              <h3 className="text-2xl font-bold font-sans" style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}>
                Email Support
              </h3>
              <p className="text-sm text-indigo-150/90 leading-relaxed">
                For customer service, billing inquiries, or technical support, write directly to our help desk. We are active every day to resolve your concerns.
              </p>
            </div>
            
            <div className="pt-6 border-t border-indigo-500/20 space-y-3">
              <span className="block text-xs uppercase tracking-widest text-indigo-400 font-bold">Support Address</span>
              <a href="mailto:support@audiotrackdown.com" className="text-lg sm:text-xl font-bold text-indigo-300 hover:text-white transition-colors hover:underline">
                support@audiotrackdown.com
              </a>
            </div>
          </div>

          {/* Quick Info Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 font-sans" style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}>
                What to Include
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                To help us assist you as fast as possible, please include:
              </p>
              
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>The YouTube or Facebook video URL you were converting</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Your account email address (if different from sending email)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Screenshots or description of error messages</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 border-t border-slate-100 flex flex-wrap gap-4 justify-between items-center text-xs text-slate-500">
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-indigo-500" />
                Response within 24 hours
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                PCI-Compliant Support
              </div>
            </div>
          </div>

        </div>

        {/* FAQs Section */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 font-sans" style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}>
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 border-t border-slate-100">
            {faqs.map((faq, idx) => (
              <div key={idx} className="space-y-3">
                <h4 className="font-bold text-sm text-slate-800 leading-snug">{faq.q}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
