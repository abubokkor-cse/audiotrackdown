import { NextRequest } from 'next/server';
import { getUser, getDailyDownloadCount, getDashboardStats } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '127.0.0.1';

  try {
    const user = await getUser();

    // A user is truly Pro only if:
    // 1. Subscription status is 'active' (not just 'trialing' — trials are NOT Pro)
    // 2. They have a paddlePriceId set (meaning they actually subscribed to a paid plan)
    const isReallyPro =
      user?.subscriptionStatus === 'active' &&
      !!user?.paddlePriceId;

    const dailyCount = await getDailyDownloadCount(user?.id || null, ipAddress);
    const stats = await getDashboardStats(user?.id || null, ipAddress);

    return Response.json({
      planName: isReallyPro ? (user?.planName || 'Pro') : 'Free',
      subscriptionStatus: user?.subscriptionStatus || null,
      isPro: isReallyPro,
      usedDownloads: dailyCount,
      remainingDownloads: 999999,
      ipAddress,
      stats,
    });
  } catch (error) {
    console.error('[API user limits error]:', error);
    // Safe fallback so the page never crashes on db connection issues
    return Response.json({
      planName: 'Free',
      subscriptionStatus: null,
      isPro: false,
      usedDownloads: 0,
      remainingDownloads: 999999,
      ipAddress,
      stats: {
        downloadsThisMonth: 0,
        hintDownloads: '0',
        audioCount: 0,
        subtitleCount: 0,
        languagesCount: 0,
      },
    });
  }
}
