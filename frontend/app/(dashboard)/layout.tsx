'use client';

import Link from 'next/link';
import { useState, Suspense, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Home, LogOut, Settings, Crown, Menu, X, Globe, Music, FileText, RefreshCw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from '@/app/(login)/actions';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const { data: limits } = useSWR<any>('/api/user/limits', fetcher);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  if (!user) {
    return (
      <Link href="/sign-up" className="btn-pro flex items-center justify-center gap-1.5 shadow-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 px-5 text-sm transition-all atd-btn-lift">
        <Crown className="w-4 h-4" />
        Sign Up
      </Link>
    );
  }

  const isPro = limits?.isPro === true && limits?.planName !== 'Free';

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer select-none">
          <Avatar className="size-9 ring-2 ring-indigo-100 transition-all hover:ring-indigo-300">
            <AvatarImage alt={user.name || ''} />
            <AvatarFallback className="bg-indigo-50 text-indigo-700 font-semibold">
              {user.email
                ? user.email.split(' ').map((n) => n[0]).join('').toUpperCase()
                : 'U'}
            </AvatarFallback>
          </Avatar>
          {isPro && (
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full tracking-wider shadow-sm">
              PRO
            </span>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 mt-2 p-1.5 rounded-xl border-gray-200/80 shadow-lg flex flex-col gap-1">
        {isPro ? (
          <DropdownMenuItem className="cursor-pointer rounded-lg font-medium" asChild>
            <Link href="/dashboard" className="flex w-full items-center">
              <Home className="mr-2 h-4 w-4 text-gray-400" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem className="cursor-pointer rounded-lg font-bold text-indigo-600 hover:bg-indigo-50 focus:bg-indigo-50" onClick={() => router.push('/pricing')}>
            <span className="flex w-full items-center gap-2">
              <Crown className="h-4 w-4 text-indigo-600 animate-pulse" />
              <span>Upgrade to Pro</span>
            </span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem className="cursor-pointer rounded-lg font-medium" asChild>
          <Link href="/dashboard/settings" className="flex w-full items-center">
            <Settings className="mr-2 h-4 w-4 text-gray-400" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <form action={handleSignOut} className="w-full">
          <button type="submit" className="flex w-full">
            <DropdownMenuItem className="w-full flex-1 cursor-pointer rounded-lg font-medium text-red-600 focus:bg-red-50 focus:text-red-700">
              <LogOut className="mr-2 h-4 w-4 text-red-500" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: limits } = useSWR<any>('/api/user/limits', fetcher);
  const isPro = limits?.isPro === true && limits?.planName !== 'Free';

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href={isPro ? "/dashboard" : "/"} className="logo flex items-center">
          <img src="/logo.svg" alt="audio track down logo" className="h-7 w-auto select-none" />
        </Link>

        {/* Desktop links */}
        {!isPro && (
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className={`text-sm font-semibold transition-colors flex items-center gap-1.5 ${pathname === '/' ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}>
              <Music className="w-4 h-4" />
              Audio Extractor
            </Link>
            <Link href="/youtube-subtitle-downloader" className={`text-sm font-semibold transition-colors flex items-center gap-1.5 ${pathname === '/youtube-subtitle-downloader' ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}>
              <FileText className="w-4 h-4" />
              Subtitles Downloader
            </Link>
            <a href="#how-it-works" className="text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors">
              How It Works
            </a>
            <Link href="/blog" className={`text-sm font-semibold transition-colors ${pathname.startsWith('/blog') ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}>
              Blog
            </Link>
            <Link href="/pricing" className={`text-sm font-semibold transition-colors ${pathname === '/pricing' ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'}`}>
              Pricing
            </Link>
            <Suspense fallback={<div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse" />}>
              <UserMenu />
            </Suspense>
          </div>
        )}

        {isPro && (
          <div className="flex items-center gap-3">
            <Suspense fallback={<div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse" />}>
              <UserMenu />
            </Suspense>
          </div>
        )}

        {/* Mobile controls */}
        {!isPro && (
          <div className="md:hidden flex items-center gap-3">
            <Suspense fallback={<div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse" />}>
              <UserMenu />
            </Suspense>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-xl hover:bg-gray-100"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
            </Button>
          </div>
        )}
      </nav>

      {/* Mobile Drawer */}
      {!isPro && isMobileMenuOpen && (
        <div className="md:hidden border-b border-gray-100 bg-white/95 backdrop-blur-md px-6 py-6 space-y-4 animate-in fade-in slide-in-from-top-3 duration-200">
          <Link href="/" className={`flex items-center gap-2 text-base font-semibold py-2 border-b border-gray-50 ${pathname === '/' ? 'text-indigo-600' : 'text-gray-700'}`}>
            <Music className="w-4.5 h-4.5 text-gray-400" />
            Audio Extractor
          </Link>
          <Link href="/youtube-subtitle-downloader" className={`flex items-center gap-2 text-base font-semibold py-2 border-b border-gray-50 ${pathname === '/youtube-subtitle-downloader' ? 'text-indigo-600' : 'text-gray-700'}`}>
            <FileText className="w-4.5 h-4.5 text-gray-400" />
            Subtitles Downloader
          </Link>
          <a href="#how-it-works" className="block text-base font-semibold text-gray-700 py-2 border-b border-gray-50">
            How It Works
          </a>
          <Link href="/blog" className={`block text-base font-semibold py-2 border-b border-gray-50 ${pathname.startsWith('/blog') ? 'text-indigo-600' : 'text-gray-700'}`}>
            Blog
          </Link>
          <Link href="/pricing" className={`block text-base font-semibold py-2 ${pathname === '/pricing' ? 'text-indigo-600' : 'text-gray-700'}`}>
            Pricing
          </Link>
        </div>
      )}
    </header>
  );
}

function Footer() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const { data: limits } = useSWR<any>('/api/user/limits', fetcher);
  const isPro = limits?.isPro === true && limits?.planName !== 'Free';

  if (isPro || pathname.startsWith('/dashboard')) {
    return null;
  }

  return (
    <footer className="footer bg-slate-50 border-t border-gray-100 py-12 lg:py-16">
      {/* Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            'name': 'AudioTrackDown',
            'url': 'https://audiotrackdown.com',
            'logo': 'https://audiotrackdown.com/logo.png',
            'sameAs': [
              'https://twitter.com/audiotrackdown'
            ]
          })
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-10 mb-12">
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-2">
            <Link href="/" className="footer-logo inline-block">
              <img src="/logo.svg" alt="audio track down logo" className="h-6 w-auto select-none" />
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              Extract high-quality audio tracks, dubbed voices, and subtitles from YouTube & Facebook videos instantly.
              Free, fast, and mobile-optimized.
            </p>
          </div>

          {/* Products Column */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Products</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-600 hover:text-indigo-600 transition-colors">YouTube Audio Extractor</Link>
              </li>
              <li>
                <Link href="/youtube-subtitle-downloader" className="text-gray-600 hover:text-indigo-600 transition-colors">YouTube Subtitle Downloader</Link>
              </li>
              <li>
                <Link href="/pricing" className="text-gray-600 hover:text-indigo-600 transition-colors">Pricing Plans</Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-600 hover:text-indigo-600 transition-colors">Blog &amp; Guides</Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#how-it-works" className="text-gray-600 hover:text-indigo-600 transition-colors">How It Works</Link>
              </li>
              <li>
                <Link href="/#languages" className="text-gray-600 hover:text-indigo-600 transition-colors">Supported Languages</Link>
              </li>
              <li>
                <Link href="/#formats" className="text-gray-600 hover:text-indigo-600 transition-colors">All Extraction Formats</Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Legal & Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-indigo-600 transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-indigo-600 transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-indigo-600 transition-colors">Contact Support</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-gray-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">
            © {currentYear} audio<span className="text-indigo-500/80">track</span>down. All rights reserved. Free for personal use.
          </p>
          <div className="flex items-center gap-6 text-xs text-gray-400">
            <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-indigo-600 transition-colors">Terms</a>
            <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-indigo-600 transition-colors">Privacy</a>
            <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-indigo-600 transition-colors">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: limits } = useSWR<any>('/api/user/limits', fetcher);
  const isPro = limits?.isPro === true && limits?.planName !== 'Free';

  useEffect(() => {
    if (isPro) {
      const publicPaths = ['/', '/youtube-subtitle-downloader', '/pricing'];
      if (publicPaths.includes(pathname)) {
        router.replace('/dashboard');
      }
    }
  }, [isPro, pathname, router]);

  // Prevent flash of public content for logged in Pro users
  const isPublicPath = ['/', '/youtube-subtitle-downloader', '/pricing'].includes(pathname);
  if (isPro && isPublicPath) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin h-8 w-8 text-indigo-600" />
          <p className="text-sm font-semibold text-gray-500">Redirecting to Dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="atd min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </div>
  );
}
