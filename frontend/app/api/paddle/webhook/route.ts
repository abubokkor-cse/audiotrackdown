import { NextRequest, NextResponse } from 'next/server';
import { getPaddleInstance } from '@/lib/payments/paddle';
import { EventName } from '@paddle/paddle-node-sdk';
import { db } from '@/lib/db/drizzle';
import { teams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('paddle-signature') || '';
  const rawRequestBody = await request.text();
  const privateKey = process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET || '';

  try {
    if (!signature || !rawRequestBody) {
      return NextResponse.json({ error: 'Missing signature from header' }, { status: 400 });
    }

    const paddle = getPaddleInstance();
    const eventData = await paddle.webhooks.unmarshal(rawRequestBody, privateKey, signature);
    if (!eventData) {
      return NextResponse.json({ error: 'Invalid event data' }, { status: 400 });
    }

    console.log(`[Paddle Webhook] Received event: ${eventData.eventType}`);

    const eventName = eventData.eventType;
    
    // Handle Subscription events
    if (
      eventName === EventName.SubscriptionCreated ||
      eventName === EventName.SubscriptionUpdated
    ) {
      const subscription = eventData.data;
      const customerId = subscription.customerId;
      const subscriptionId = subscription.id;
      const status = subscription.status;
      const priceId = subscription.items[0]?.price?.id || '';
      const customData = subscription.customData as Record<string, any> | undefined;
      const teamId = customData?.teamId ? Number(customData.teamId) : null;

      let planName = 'Pro';
      if (priceId === process.env.NEXT_PUBLIC_PADDLE_PRICE_ANNUAL) {
        planName = 'Pro Annual';
      } else if (priceId === process.env.NEXT_PUBLIC_PADDLE_PRICE_MONTHLY) {
        planName = 'Pro Monthly';
      }

      if (teamId) {
        if (status === 'active' || status === 'trialing') {
          await db
            .update(teams)
            .set({
              paddleCustomerId: customerId,
              paddleSubscriptionId: subscriptionId,
              paddlePriceId: priceId,
              planName,
              subscriptionStatus: status,
              updatedAt: new Date(),
            })
            .where(eq(teams.id, teamId));
        } else {
          // If paused, canceled, past_due, etc.
          await db
            .update(teams)
            .set({
              paddleSubscriptionId: subscriptionId,
              paddlePriceId: priceId,
              planName: null,
              subscriptionStatus: status,
              updatedAt: new Date(),
            })
            .where(eq(teams.id, teamId));
        }
      } else {
        console.warn(`[Paddle Webhook] No teamId found in customData for subscription: ${subscriptionId}`);
      }
    }

    return NextResponse.json({ status: 200, eventName });
  } catch (e: any) {
    console.error('[Paddle Webhook Error]:', e);
    return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 });
  }
}
