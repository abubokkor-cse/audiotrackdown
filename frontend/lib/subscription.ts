import type { User } from '@/lib/db/schema';

/**
 * Single source of truth for subscription / plan state across the app.
 *
 * Previously the codebase had three inconsistent definitions of "Pro":
 *  - user/limits/route.ts treated only `status === 'active' && paddlePriceId` as Pro
 *  - pricing-client.tsx and download/extract routes treated `active || trialing` as active
 *  - none of them were enforced anyway
 *
 * Centralizing here keeps gating logic consistent.
 */

/** Subscription statuses that grant paid-tier benefits. */
export const ACTIVE_STATUSES = ['active', 'trialing'] as const;

/**
 * True if the user currently has a paid subscription (active or trialing).
 * Use this for UI gating (show "Pro" badge, hide ads, etc.).
 */
export function hasActiveSubscription(user: Pick<User, 'subscriptionStatus'> | null | undefined): boolean {
    return !!user?.subscriptionStatus && (ACTIVE_STATUSES as readonly string[]).includes(user.subscriptionStatus);
}

/**
 * True only if the user is a *fully* paid subscriber — active status AND a
 * Paddle price ID set (i.e. they actually picked a plan, not just trialing).
 * Use this for hard feature gating where trials should NOT count.
 */
export function isProSubscriber(
    user: Pick<User, 'subscriptionStatus' | 'paddlePriceId'> | null | undefined
): boolean {
    return user?.subscriptionStatus === 'active' && !!user?.paddlePriceId;
}

/**
 * Human-readable plan name for display. Returns 'Pro' (or the stored plan name)
 * for active subscribers, otherwise 'Free'.
 */
export function getPlanName(
    user: Pick<User, 'subscriptionStatus' | 'paddlePriceId' | 'planName'> | null | undefined
): string {
    return hasActiveSubscription(user) ? (user?.planName || 'Pro') : 'Free';
}
