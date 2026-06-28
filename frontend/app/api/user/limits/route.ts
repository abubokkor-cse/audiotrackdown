import { NextRequest } from 'next/server';
import { getUser, getTeamForUser, getDailyDownloadCount, getDashboardStats } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  const user = await getUser();
  const team = await getTeamForUser();
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '127.0.0.1';

  // A user is truly Pro only if:
  // 1. Subscription status is 'active' (not just 'trialing' — trials are NOT Pro)
  // 2. They have a paddlePriceId set (meaning they actually subscribed to a paid plan)
  const isReallyPro =
    team?.subscriptionStatus === 'active' &&
    !!team?.paddlePriceId;

  const dailyCount = await getDailyDownloadCount(user?.id || null, ipAddress);
  const stats = await getDashboardStats(user?.id || null, ipAddress);

  return Response.json({
    planName: isReallyPro ? (team?.planName || 'Pro') : 'Free',
    subscriptionStatus: team?.subscriptionStatus || null,
    isPro: isReallyPro,
    usedDownloads: dailyCount,
    remainingDownloads: 999999,
    ipAddress,
    stats,
  });
}
