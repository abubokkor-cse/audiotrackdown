import { NextRequest, NextResponse } from 'next/server';
import { getUser, logDownload } from '@/lib/db/queries';
import { BACKEND_URL, backendHeaders } from '@/lib/backend';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    const { url, formatId, langName, targetExt } = await request.json();

    if (!url || !formatId) {
      return NextResponse.json({ success: false, error: 'URL and Format ID are required' }, { status: 400 });
    }

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '127.0.0.1';

    // Proxy download prepare to Express backend
    const res = await fetch(`${BACKEND_URL}/api/download/prepare`, {
      method: 'POST',
      headers: backendHeaders(),
      body: JSON.stringify({ url, formatId, langName, targetExt }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ success: false, error: data.error || 'Failed to prepare download' }, { status: res.status });
    }

    // Log the download usage
    await logDownload(user?.id || null, ipAddress, 'audio', langName);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API Download Prepare Proxy Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
