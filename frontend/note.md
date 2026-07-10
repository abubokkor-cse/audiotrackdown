# 🎙️ AudioTrackDown Frontend — Technical Notes

This document describes the current architecture of the AudioTrackDown frontend
(Next.js SaaS app). It was originally forked from the `nextjs/saas-starter`
template but has been substantially customized: the multi-team model was
removed, Stripe was replaced with **Paddle**, and the app now serves a YouTube
& Facebook audio/subtitle extractor.

---

## 💻 1. Core Technology Stack

### Framework & UI
*   **Next.js 15.6 (Canary)**: App Router with React 19 (Server Actions, `useActionState`, Suspense loaders). Experimental `ppr` (Partial Prerendering) and `clientSegmentCache` enabled.
*   **Tailwind CSS v4.1.7**: Via `@tailwindcss/postcss`.
*   **UI Components**: Radix UI primitives, Lucide React icons, `class-variance-authority`, `tailwind-merge`, `tw-animate-css`.
*   **Data Fetching**: **SWR** for client-side caching/revalidation.

### Database & Auth
*   **Database**: PostgreSQL via the `postgres` driver.
*   **ORM**: **Drizzle ORM** + `drizzle-kit` for migrations.
*   **Sessions**: Custom HS256 JWT cookies signed with `AUTH_SECRET` via **jose**.
*   **Passwords**: `bcryptjs` (10 rounds).
*   **Local-dev fallback**: When `POSTGRES_URL` is unset (or `***`), all queries transparently fall back to `local-db.json` via `lib/db/jsonDb.ts`, so the app runs without a database.

### Payments
*   **Paddle** (`@paddle/paddle-js` for client checkout, `@paddle/paddle-node-sdk` for server-side API + webhook verification). **Stripe is no longer used.**

### Backend Integration
*   The Next.js API routes proxy to a separate Express backend (`BACKEND_URL`)
    that runs yt-dlp + ffmpeg. Every proxied request carries an
    `x-backend-secret` header (`BACKEND_SECRET`) that must match on both sides.
    See `lib/backend.ts` for the shared helper.

---

## 🗄️ 2. Database Schema (`lib/db/schema.ts`)

The multi-team model has been removed. The schema is now single-user:

### Table: `users`
*   `id`: `serial` PRIMARY KEY
*   `name`: `varchar(100)`
*   `email`: `varchar(255)` UNIQUE NOT NULL
*   `passwordHash`: `text` NOT NULL
*   `role`: `varchar(20)` NOT NULL DEFAULT `'member'`
*   `createdAt` / `updatedAt`: `timestamp` DEFAULT Now()
*   `deletedAt`: `timestamp` (soft deletes)
*   `paddleCustomerId`: `text` UNIQUE
*   `paddleSubscriptionId`: `text` UNIQUE
*   `paddlePriceId`: `text`
*   `planName`: `varchar(50)`
*   `subscriptionStatus`: `varchar(20)`

### Table: `downloadLogs`
*   `id`: `serial` PRIMARY KEY
*   `userId`: `integer` REFERENCES `users(id)`
*   `ipAddress`: `varchar(45)` NOT NULL
*   `createdAt`: `timestamp` DEFAULT Now()
*   `type`: `varchar(20)` — `'audio'` | `'subtitle'`
*   `lang`: `varchar(50)`

### Table: `activityLogs`
*   `id`: `serial` PRIMARY KEY
*   `userId`: `integer` REFERENCES `users(id)`
*   `action`: `text` NOT NULL (`SIGN_UP`, `SIGN_IN`, `SIGN_OUT`, `UPDATE_PASSWORD`, `DELETE_ACCOUNT`, `UPDATE_ACCOUNT`)
*   `ipAddress`: `varchar(45)`
*   `timestamp`: `timestamp` DEFAULT Now()

> The `teams`, `team_members`, and `invitations` tables from the original
> template no longer exist.

---

## 🛡️ 3. Authentication & Sessions (`lib/auth/`)

Authentication uses custom secure cookie sessions instead of heavy third-party providers:

1.  **Session JWT (`session.ts`)**:
    *   Generates symmetric HS256 tokens signed via a local secret `AUTH_SECRET` using the `SignJWT` builder from the `jose` library.
    *   Cookies are registered with properties: `httpOnly: true`, `secure: true`, `sameSite: 'lax'`, expiring in **1 day**.
2.  **Server Action validation (`lib/auth/middleware.ts`)**:
    *   `validatedAction(schema, fn)` and `validatedActionWithUser(schema, fn)` wrap Server Actions with Zod parsing.
3.  **Sliding-session Edge Middleware (`middleware.ts` at root)**:
    *   Protects `/dashboard/*` (redirects to `/sign-in` if no session cookie).
    *   On GET requests with a valid cookie, refreshes the expiry by one day.

---

## 💳 4. Paddle Subscription & Webhooks (`lib/payments/` + `app/api/paddle/`)

1.  **Checkout (`app/(dashboard)/pricing/pricing-client.tsx`)**:
    *   Initializes Paddle.js with `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`.
    *   `paddle.Checkout.open(...)` passes `customData: { userId }` and the user's email.
    *   Success URL redirects to `/dashboard`.
2.  **Webhook (`app/api/paddle/webhook/route.ts`)**:
    *   Verifies the `paddle-signature` header using `PADDLE_NOTIFICATION_WEBHOOK_SECRET`.
    *   Handles `SubscriptionCreated` / `SubscriptionUpdated`: updates the user's `paddleCustomerId`, `paddleSubscriptionId`, `paddlePriceId`, `planName`, and `subscriptionStatus`.
3.  **Cancellation (`app/api/subscription/cancel/route.ts`)**:
    *   Calls `paddle.subscriptions.cancel(...)` with `effectiveFrom: 'next_billing_period'`, then marks the local user as `'cancelled'` / `'Free'`.
4.  **Plan gating**:
    *   The single source of truth for "is this user Pro?" lives in `lib/subscription.ts`
        (`hasActiveSubscription`, `isProSubscriber`, `getPlanName`).
    *   Use these helpers everywhere instead of re-checking `subscriptionStatus` inline.

---

## 🔗 5. Backend Proxy Layer (`app/api/*`)

The frontend never calls yt-dlp directly. Next.js route handlers proxy to the
Express backend, attaching the shared secret:

*   `POST /api/extract` → backend `/api/extract`
*   `POST /api/download/prepare` → backend `/api/download/prepare`
*   `GET  /api/download/status/[id]` → backend `/api/download/status/:id`
*   `GET  /api/download/stream/[id]` → backend `/api/download/stream/:id` (streams the file body through)
*   `GET  /api/subtitle/download` → backend `/api/subtitle/download`
*   `GET  /api/user/limits` → reads local DB only (plan + daily download count + dashboard stats)

All backend-bound helpers are centralized in `lib/backend.ts`
(`BACKEND_URL`, `BACKEND_SECRET`, `backendHeaders()`).

---

## 📂 6. Route & Layout Directory Structure

### Marketing / public group — `app/(dashboard)/`
*   `page.tsx` — landing page with the extractor UI (free, ad-supported).
*   `pricing/` — pricing page (Free / Pro Monthly / Pro Annual) wired to Paddle.
*   `download/page.tsx` — progress + auto-download page for prepared files.
*   `subtitles/`, `contact/`, `privacy/`, `terms/` — static/marketing pages.
*   `terminal.tsx` — animated terminal hero component.

### Dashboard group — `app/(dashboard)/dashboard/`
*   `page.tsx` — Pro-only dashboard (ad-free extractor with audio + subtitle tools).
*   `settings/activity/` — user activity log.
*   `settings/security/` — change password / delete account.

### Login group — `app/(login)/`
*   `sign-in/`, `sign-up/` — forms backed by Server Actions in `actions.ts`
    (`signIn`, `signUp`, `signOut`, `updatePassword`, `deleteAccount`).

---

## ⚙️ 7. Environment Variables

See `.env.example`. Key variables:

| Variable | Purpose |
|----------|---------|
| `POSTGRES_URL` | PostgreSQL connection string (omit to use `local-db.json`) |
| `AUTH_SECRET` | JWT signing secret (`openssl rand -base64 32`) |
| `BASE_URL` | App base URL |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Paddle.js client token |
| `NEXT_PUBLIC_PADDLE_ENV` | `sandbox` or `production` |
| `NEXT_PUBLIC_PADDLE_PRICE_MONTHLY` / `_ANNUAL` | Paddle price IDs |
| `PADDLE_API_KEY` | Server-side Paddle API key |
| `PADDLE_NOTIFICATION_WEBHOOK_SECRET` | Webhook signature verification secret |
| `BACKEND_URL` | Express backend URL |
| `NEXT_PUBLIC_API_URL` | Same as `BACKEND_URL` (client-side) |
| `BACKEND_SECRET` | Shared secret for frontend↔backend auth (must match `backend/.env`) |

Run `pnpm db:setup` to interactively generate a `.env` file with all of these.
