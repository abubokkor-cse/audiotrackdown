import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Download ID is required' }, { status: 400 });
    }

    // Call the backend stream route
    const res = await fetch(`${BACKEND_URL}/api/download/stream/${id}`);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to fetch stream from backend' },
        { status: res.status }
      );
    }

    // Return the response streaming body directly to the client browser
    return new Response(res.body, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'audio/mpeg',
        'Content-Disposition': res.headers.get('Content-Disposition') || 'attachment',
        'Content-Length': res.headers.get('Content-Length') || '',
      },
    });
  } catch (error: any) {
    console.error('[API Stream Proxy Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
