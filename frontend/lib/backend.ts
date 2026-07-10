/**
 * Backend connection configuration shared by all Next.js API routes that
 * proxy to the Express backend.
 *
 * SECURITY: `BACKEND_SECRET` must be set in production. We never fall back
 * to a hardcoded default — if the env var is missing, requests fail loudly
 * rather than silently authenticating with a guessable secret.
 */

export const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

const isProd = process.env.NODE_ENV === 'production';
const secret = process.env.BACKEND_SECRET;

if (isProd && !secret) {
    // Fail fast at module load time — better than silently sending empty auth.
    throw new Error(
        'FATAL: BACKEND_SECRET environment variable is required in production.'
    );
}

/**
 * The shared secret sent in the `x-backend-secret` header. In development
 * only, falls back to a local value so `npm run dev` works out of the box.
 */
export const BACKEND_SECRET = secret || (isProd ? '' : 'dev-shared-secret');

/**
 * Standard headers to send to the backend for authenticated POST requests.
 */
export function backendHeaders(extra: Record<string, string> = {}) {
    return {
        'Content-Type': 'application/json',
        'x-backend-secret': BACKEND_SECRET,
        ...extra,
    };
}
