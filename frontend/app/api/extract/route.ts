import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL, backendHeaders } from '@/lib/backend';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
    }

    // Proxy request to Railway Express backend
    const res = await fetch(`${BACKEND_URL}/api/extract`, {
      method: 'POST',
      headers: backendHeaders(),
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
