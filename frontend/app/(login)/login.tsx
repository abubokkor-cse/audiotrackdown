'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { signIn, signUp } from './actions';
import { ActionState } from '@/lib/auth/middleware';

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
  const inviteId = searchParams.get('inviteId');
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' }
  );

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 bg-white" style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}>
      {/* Card */}
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)", fontWeight: 700, fontSize: 22, color: '#0F172A', letterSpacing: '-0.5px' }}>
              audio<span style={{ color: '#4F46E5' }}>track</span>down
            </span>
          </Link>
          <h1 style={{ fontFamily: "var(--font-space-grotesk, 'Space Grotesk', sans-serif)", fontWeight: 700, fontSize: 26, color: '#0F172A', letterSpacing: '-0.5px', marginBottom: 8 }}>
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280' }}>
            {mode === 'signin'
              ? 'Sign in to access your downloads and history.'
              : 'Start extracting audio & subtitles for free.'}
          </p>
        </div>

        {/* Form Card */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 20, padding: '32px', boxShadow: '0 4px 24px rgba(79,70,229,0.06)' }}>
          <form className="space-y-5" action={formAction}>
            <input type="hidden" name="redirect" value={redirect || ''} />
            <input type="hidden" name="priceId" value={priceId || ''} />
            <input type="hidden" name="inviteId" value={inviteId || ''} />

            <div>
              <Label htmlFor="email" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={state.email}
                required
                maxLength={50}
                style={{ borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, height: 44 }}
                className="w-full focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Label htmlFor="password" style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                  Password
                </Label>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                defaultValue={state.password}
                required
                minLength={8}
                maxLength={100}
                style={{ borderRadius: 10, border: '1px solid #E5E7EB', fontSize: 14, height: 44 }}
                className="w-full focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                placeholder={mode === 'signin' ? 'Your password' : 'Min. 8 characters'}
              />
            </div>

            {state?.error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#DC2626' }}>
                {state.error}
              </div>
            )}

            <Button
              type="submit"
              style={{ width: '100%', height: 46, borderRadius: 12, background: '#4F46E5', fontSize: 14, fontWeight: 700, letterSpacing: '-0.1px' }}
              className="hover:bg-indigo-700 transition-all text-white shadow-md shadow-indigo-200"
              disabled={pending}
            >
              {pending ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
                </>
              ) : mode === 'signin' ? (
                'Sign in'
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#F3F4F6' }} />
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>
              {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
            </span>
            <div style={{ flex: 1, height: 1, background: '#F3F4F6' }} />
          </div>

          <Link
            href={`${mode === 'signin' ? '/sign-up' : '/sign-in'}${redirect ? `?redirect=${redirect}` : ''}${priceId ? `&priceId=${priceId}` : ''}`}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 44, borderRadius: 12, border: '1.5px solid #E5E7EB', fontSize: 14, fontWeight: 600, color: '#374151', textDecoration: 'none', transition: 'border-color 0.15s, background 0.15s' }}
            className="hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
          >
            {mode === 'signin' ? 'Create a free account' : 'Sign in instead'}
          </Link>
        </div>

        {/* Footer note */}
        <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 20 }}>
          Free forever. No credit card required.
        </p>
      </div>
    </div>
  );
}
