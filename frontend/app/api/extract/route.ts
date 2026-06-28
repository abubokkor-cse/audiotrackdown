import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser, getDailyDownloadCount } from '@/lib/db/queries';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const BACKEND_SECRET = process.env.BACKEND_SECRET || 'shared-secret';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    const team = await getTeamForUser();
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
    }

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '127.0.0.1';

    const hasActiveSub = team?.subscriptionStatus === 'active' || team?.subscriptionStatus === 'trialing';
    

    // Proxy request to Railway Express backend
    const res = await fetch(`${BACKEND_URL}/api/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-backend-secret': BACKEND_SECRET,
      },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ success: false, error: data.error || 'Failed to extract video details' }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API Extract Proxy Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
