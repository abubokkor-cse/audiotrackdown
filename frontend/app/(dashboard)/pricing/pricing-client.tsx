'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { type Environments, initializePaddle, type Paddle } from '@paddle/paddle-js';
import {
  Check,
  Sparkles,
  Zap,
  Crown,
  ShieldCheck,
  Headphones,
  Globe,
  Ban,
  Download,
  Gauge,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hasActiveSubscription } from '@/lib/subscription';

interface PricingClientProps {
  user: any;
}

export default function PricingClient({ user }: PricingClientProps) {
  const router = useRouter();
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    const environment = (process.env.NEXT_PUBLIC_PADDLE_ENV as Environments) || 'sandbox';

    if (token) {
      initializePaddle({
        token,
        environment,
      }).then((paddleInstance) => {
        if (paddleInstance) {
          setPaddle(paddleInstance);
        }
      });
    }
  }, []);

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      router.push(`/sign-up?redirect=pricing`);
      return;
    }

    if (!paddle) {
      alert('Paddle billing is initializing, please try again in a second.');
      return;
    }

    setLoadingPriceId(priceId);

    try {
      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customData: {
          userId: user.id.toString(),
        },
        customer: {
          email: user.email,
        },
        settings: {
          variant: 'one-page',
          theme: 'dark',
          successUrl: `${window.location.origin}/dashboard`,
        }
      });
    } catch (err) {
      console.error('Error opening checkout:', err);
    } finally {
      setLoadingPriceId(null);
    }
  };

  const hasActiveSub = hasActiveSubscription(user);
  const isMonthly = user?.paddlePriceId === process.env.NEXT_PUBLIC_PADDLE_PRICE_MONTHLY;
  const isAnnual = user?.paddlePriceId === process.env.NEXT_PUBLIC_PADDLE_PRICE_ANNUAL;

  const tiers = [
    {
      name: 'Free',
      price: '$0',
      description: 'Perfect for occasional YouTube audio and subtitle extractions.',
      features: [
        { text: 'Unlimited downloads (MP3, M4A, WebM, SRT, VTT, JSON)', icon: Check, forbidden: false },
        { text: 'Extract from YouTube & Facebook', icon: Check, forbidden: false },
        { text: 'Contains advertisements (popups/redirects)', icon: Check, forbidden: false },
        { text: 'Standard stream download speed', icon: Check, forbidden: false },
        { text: 'Zero advertisements (100% ad-free)', icon: X, forbidden: true },
        { text: 'Priority proxy high-speed downloading', icon: X, forbidden: true },
        { text: 'Dedicated 24/7 priority email support', icon: X, forbidden: true },
      ],
      cta: hasActiveSub ? 'Downgrade' : 'Current Plan',
      priceId: 'free',
      popular: false,
    },
    {
      name: 'Pro Monthly',
      price: '$3.99',
      interval: 'month',
      description: 'Unlimited ad-free YouTube audio and subtitle downloads with priority speed. Cancel anytime.',
      features: [
        { text: 'Unlimited audio & subtitle downloads', icon: Check, forbidden: false },
        { text: 'Zero advertisements — distraction-free', icon: Check, forbidden: false },
        { text: 'High-quality MP3, M4A & WebM extraction', icon: Check, forbidden: false },
        { text: 'All 157 auto-translated subtitle languages & JSON', icon: Check, forbidden: false },
        { text: 'Priority high-speed stream proxy', icon: Check, forbidden: false },
        { text: 'Dedicated 24/7 priority email support', icon: Check, forbidden: false },
      ],
      cta: hasActiveSub && isMonthly ? 'Current Plan' : 'Upgrade to Pro',
      priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_MONTHLY || 'pri_monthly',
      popular: false,
    },
    {
      name: 'Pro Annual',
      price: '$29',
      interval: 'year',
      description: 'Best value — save 39% versus monthly. Everything in Pro with locked-in annual pricing.',
      features: [
        { text: 'Everything in Pro Monthly', icon: Check, forbidden: false },
        { text: '39% savings compared to monthly plan', icon: Check, forbidden: false },
        { text: 'Locked-in annual rate', icon: Check, forbidden: false },
        { text: 'Priority feature updates & beta access', icon: Check, forbidden: false },
      ],
      cta: hasActiveSub && isAnnual ? 'Current Plan' : 'Upgrade to Pro',
      priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ANNUAL || 'pri_annual',
      popular: true,
    },
  ];

  return (
    <div
      className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
    >
      {/* ── Header ── */}
      <div className="text-center max-w-3xl mx-auto mb-16 atd-stagger atd-stagger-1">
        <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-indigo-100 mb-6">
          <Crown className="w-3.5 h-3.5" />
          Pricing Plans
        </div>
        <h1
          className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-gray-900 tracking-tight leading-tight mb-4"
          style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}
        >
          Unlimited YouTube &amp; Facebook Audio &amp;{' '}
          <span className="text-indigo-600">Subtitle Downloads</span>
        </h1>
        <p className="text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
          Remove ads, unlock unlimited high-speed downloads, and access every audio format.
          Plans start at just <strong className="text-gray-700">$2.42/month</strong>.
        </p>
      </div>

      {/* ── Pricing Grid ── */}
      <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch">
        {tiers.map((tier, index) => (
          <div
            key={tier.name}
            className={`atd-stagger atd-stagger-${index + 2} flex flex-col justify-between p-7 bg-white rounded-2xl border ${tier.popular
                ? 'border-indigo-300 shadow-lg shadow-indigo-100/50 ring-2 ring-indigo-500/20'
                : 'border-gray-200 shadow-sm'
              } relative overflow-hidden atd-card-hover`}
          >
            {tier.popular && (
              <div className="absolute top-0 right-0 bg-gradient-to-l from-indigo-600 to-violet-600 text-white text-[11px] font-bold px-4 py-1.5 rounded-bl-xl flex items-center gap-1.5 shadow-md">
                <Sparkles className="w-3.5 h-3.5" /> Best Value
              </div>
            )}

            <div>
              <div className="mb-6">
                <h3
                  className="text-lg font-bold text-gray-900 tracking-tight"
                  style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}
                >
                  {tier.name}
                </h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{tier.description}</p>
              </div>

              <div className="mb-6 flex items-baseline">
                <span
                  className="text-4xl lg:text-[44px] font-bold text-gray-900 tracking-tight"
                  style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)" }}
                >
                  {tier.price}
                </span>
                {tier.interval && (
                  <span className="ml-2 text-lg font-medium text-gray-400">/{tier.interval}</span>
                )}
              </div>

              <ul className="space-y-3.5 mb-8">
                {tier.features.map((feature: any, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${feature.forbidden
                        ? 'bg-red-50 text-red-500 border border-red-100/50'
                        : tier.popular
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                      <feature.icon className="h-3 w-3" />
                    </div>
                    <span className={`text-sm leading-snug ${feature.forbidden ? 'text-gray-400 line-through decoration-gray-300' : 'text-gray-600'}`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              {tier.priceId === 'free' ? (
                <Button
                  variant="outline"
                  className="w-full py-6 text-base rounded-xl font-semibold border-gray-200 hover:bg-gray-50"
                  disabled={!hasActiveSub}
                  onClick={() => router.push('/dashboard')}
                >
                  {hasActiveSub ? 'Use Free Features' : 'Current Plan'}
                </Button>
              ) : (
                <Button
                  className={`w-full py-6 text-base rounded-xl font-semibold transition-all atd-btn-lift ${tier.popular
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                    }`}
                  disabled={
                    (hasActiveSub && isMonthly && tier.priceId === process.env.NEXT_PUBLIC_PADDLE_PRICE_MONTHLY) ||
                    (hasActiveSub && isAnnual && tier.priceId === process.env.NEXT_PUBLIC_PADDLE_PRICE_ANNUAL) ||
                    loadingPriceId === tier.priceId
                  }
                  onClick={() => handleSubscribe(tier.priceId)}
                >
                  {loadingPriceId === tier.priceId ? 'Processing…' : tier.cta}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Trust bar ── */}
      <div className="text-center mt-12 text-sm text-gray-400 max-w-lg mx-auto atd-stagger atd-stagger-5">
        <p>Secure payments powered by Paddle. Cancel anytime. All plans include 24/7 email support.</p>
      </div>
    </div>
  );
}
