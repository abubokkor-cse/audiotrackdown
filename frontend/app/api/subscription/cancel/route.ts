import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser, updateTeamSubscription } from '@/lib/db/queries';
import { getPaddleInstance } from '@/lib/payments/paddle';

const isMock = !process.env.POSTGRES_URL || process.env.POSTGRES_URL.includes('***');

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ success: false, error: 'No team found for user' }, { status: 404 });
    }

    // If there is an active Paddle subscription, cancel it
    if (team.paddleSubscriptionId && !isMock && process.env.PADDLE_API_KEY && !process.env.PADDLE_API_KEY.includes('REPLACE')) {
      try {
        const paddle = getPaddleInstance();
        await paddle.subscriptions.cancel(team.paddleSubscriptionId, {
          effectiveFrom: 'next_billing_period',
        });
      } catch (err: any) {
        console.error('[Paddle Cancel SDK Error]:', err);
      }
    }

    // Update local database subscription status
    await updateTeamSubscription(team.id, {
      paddleSubscriptionId: team.paddleSubscriptionId,
      paddlePriceId: null,
      planName: 'Free',
      subscriptionStatus: 'cancelled',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Cancel Subscription Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
