# 🎙️ Next.js SaaS Starter — Technical Notes

This document provides a detailed breakdown of the technology stack, database schema, custom authentication model, Stripe billing flow, and folder structure of the **nextjs-saas-starter** repository.

---

## 💻 1. Core Technology Stack

### Frontend & Framework
*   **Next.js 15.6.0 (Canary)**: Utilizing Next.js App Router with React 19 features (e.g., Server Actions, `useActionState`, and `Suspense` loaders).
*   **Tailwind CSS v4.1.7**: Features Tailwind v4 with the `@tailwindcss/postcss` wrapper for modern, light-weight build compiling.
*   **UI Components**: Radix UI primitives, Lucide React icons, Class Variance Authority (`cva`), and Tailwind Merge.
*   **Data Fetching**: Client-side caching and synchronization handled by **SWR** (`swr`).

### Backend, Database, & Payment
*   **Database Client**: Postgres (`postgres` package) connecting to a PostgreSQL server.
*   **Drizzle ORM & Kit**: Schema-first object-relational mapping (`drizzle-orm`) and migration utility (`drizzle-kit`).
*   **Session Cryptography**: Custom session JWT tokens signed and verified via **jose** (`jose` package).
*   **Payment Gateway**: Stripe SDK (`stripe` package) for card checkouts, subscriptions, and billing portal access.

---

## 🗄️ 2. Database Schema (`lib/db/schema.ts`)

A PostgreSQL schema representing a multi-member SaaS model:

### Table: `users`
*   `id`: `serial` PRIMARY KEY
*   `name`: `varchar(100)`
*   `email`: `varchar(255)` UNIQUE NOT NULL
*   `passwordHash`: `text` NOT NULL
*   `role`: `varchar(20)` NOT NULL DEFAULT 'member'
*   `createdAt` / `updatedAt`: `timestamp` DEFAULT Now()
*   `deletedAt`: `timestamp` (for soft deletes)

### Table: `teams`
*   `id`: `serial` PRIMARY KEY
*   `name`: `varchar(100)` NOT NULL
*   `stripeCustomerId`: `text` UNIQUE
*   `stripeSubscriptionId`: `text` UNIQUE
*   `stripeProductId`: `text`
*   `planName`: `varchar(50)`
*   `subscriptionStatus`: `varchar(20)`
*   `createdAt` / `updatedAt`: `timestamp`

### Table: `team_members`
*   `id`: `serial` PRIMARY KEY
*   `userId`: `integer` REFERENCES `users(id)`
*   `teamId`: `integer` REFERENCES `teams(id)`
*   `role`: `varchar(50)` NOT NULL (e.g., `'owner'`, `'member'`)
*   `joinedAt`: `timestamp`

### Table: `activity_logs`
*   `id`: `serial` PRIMARY KEY
*   `teamId`: `integer` REFERENCES `teams(id)`
*   `userId`: `integer` REFERENCES `users(id)`
*   `action`: `text` NOT NULL (Activity types like `SIGN_IN`, `SIGN_UP`, `CREATE_TEAM`, `INVITE_TEAM_MEMBER`)
*   `ipAddress`: `varchar(45)`
*   `timestamp`: `timestamp`

### Table: `invitations`
*   `id`: `serial` PRIMARY KEY
*   `teamId`: `integer` REFERENCES `teams(id)`
*   `email`: `varchar(255)` NOT NULL
*   `role`: `varchar(50)` NOT NULL
*   `invitedBy`: `integer` REFERENCES `users(id)`
*   `invitedAt`: `timestamp`
*   `status`: `varchar(20)` DEFAULT `'pending'` (`'pending'`, `'accepted'`, `'declined'`)

---

## 🛡️ 3. Authentication & Sessions (`lib/auth/`)

Authentication uses custom secure cookie sessions instead of heavy third-party providers:

1.  **Session JWT (`session.ts`)**:
    *   Generates symmetric HS256 tokens signed via a local secret `AUTH_SECRET` using the `SignJWT` builder from the `jose` library.
    *   Cookies are registered with properties: `httpOnly: true`, `secure: true`, `sameSite: 'lax'`, expiring in **1 day**.
2.  **Server Actions Middleware (`middleware.ts` in `lib/auth`)**:
    *   Defines `validatedAction` and `validatedActionWithUser` wrappers.
    *   Uses **Zod** schemas (`zod`) to parse and validate `FormData` on the server before running the underlying handler logic.
    *   Provides `withTeam(action)` to enforce that the logged-in user belongs to a valid team before carrying out restricted actions.
3.  **Sliding-Window Expiration Edge Middleware (`middleware.ts` in root)**:
    *   Monitors all routes. If the path starts with `/dashboard`, it checks for the `session` cookie and redirects unauthorized traffic to `/sign-in`.
    *   If a session cookie is present on a GET request, it dynamically **refreshes** the session's expiration date by one day, resigning and updating the cookie.

---

## 💳 4. Stripe Subscription & Webhooks (`lib/payments/`)

Stripe billing supports trials, subscription modifications, and self-service management:

1.  **Checkout Sessions (`stripe.ts` & `actions.ts`)**:
    *   `createCheckoutSession` redirects users to Stripe’s checkout overlay. Mapped to price IDs, it includes `allow_promotion_codes: true` and configured trial periods (default: 14 days).
    *   Passes the user ID in `client_reference_id` to link the purchase.
2.  **Billing Customer Portal**:
    *   `createCustomerPortalSession` creates a billing portal URL.
    *   Allows customers to update cards, review past invoices, and upgrade/downgrade/cancel tiers safely.
3.  **Checkout Redirection Handler (`app/api/stripe/checkout/route.ts`)**:
    *   A GET route triggered upon checkout success.
    *   Retrieves the Stripe checkout session, reads `client_reference_id`, fetches the user's team ID, updates the plan details on the `teams` record in PostgreSQL, sets the session cookie, and redirects the client to `/dashboard`.
4.  **Stripe Webhook Listener (`app/api/stripe/webhook/route.ts`)**:
    *   Verifies incoming Stripe signatures using `STRIPE_WEBHOOK_SECRET`.
    *   Listens to `customer.subscription.updated` and `customer.subscription.deleted` events.
    *   Calls `handleSubscriptionChange` to keep local team plan types and subscription statuses synchronized.

---

## 📂 5. Route & Layout Directory Structure

### Public / Marketing Group (`app/(dashboard)/`)
*   **`page.tsx`**: Renders landing page highlights, CTAs, and lists features.
*   **`pricing/page.tsx`**: Server component that queries recurring products and prices from the Stripe API (cached with a 1-hour revalidation time). Displays plans (e.g. `'Base'`, `'Plus'`) in pricing cards.
*   **`terminal.tsx`**: Component/terminal mock helper.

### Dashboard Settings Group (`app/(dashboard)/dashboard/`)
*   **`layout.tsx`**: Houses the side-nav layout structure (Overview, Activity, Security, Settings).
*   **`page.tsx`**: Renders the central Team settings dashboard:
    *   Lists active plan details (Stripe Portal access button).
    *   Renders team members list (shows initials and roles). Owners can remove members.
    *   Enables owners to input an email and invite new members as Owners or Members.
*   **`activity/page.tsx`**: Displays a chronological feed of logged actions.
*   **`general/page.tsx`**: Standard forms to rename team titles, adjust contact emails, or delete teams and accounts.
*   **`security/page.tsx`**: Change user password form.

### Login Group (`app/(login)/`)
*   **`sign-in/page.tsx`** & **`sign-up/page.tsx`**: Renders forms connected to Server Actions.
*   **`actions.ts`**: Contains Server Actions for:
    *   `signIn`: Validates details, sets session token, and updates activity logs.
    *   `signUp`: Checks for existing emails, creates a password hash using `bcryptjs`, accepts team invitations (`invitations` table status set to `'accepted'`), or creates a default team (`"[email]'s Team"`).
    *   `signOut`: Deletes the `session` cookie.
