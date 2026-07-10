import { NextRequest } from 'next/server';
import { getUser, getDailyDownloadCount, getDashboardStats } from '@/lib/db/queries';
import { isProSubscriber, getPlanName } from '@/lib/subscription';

export async function GET(request: NextRequest) {
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '127.0.0.1';

  try {
    const user = await getUser();

    // Use the shared, app-wide definition of "Pro".
    const isReallyPro = isProSubscriber(user);

    const dailyCount = await getDailyDownloadCount(user?.id || null, ipAddress);
    const stats = await getDashboardStats(user?.id || null, ipAddress);

    return Response.json({
      planName: getPlanName(user),
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
