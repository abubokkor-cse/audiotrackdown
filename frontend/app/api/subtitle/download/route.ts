import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const lang = searchParams.get('lang');
    const fmt = searchParams.get('fmt');
    const filename = searchParams.get('filename');

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
    }

    // Construct target URL for the backend
    const targetUrl = new URL(`${BACKEND_URL}/api/subtitle/download`);
    targetUrl.searchParams.set('url', url);
    if (lang) targetUrl.searchParams.set('lang', lang);
    if (fmt) targetUrl.searchParams.set('fmt', fmt);
    if (filename) targetUrl.searchParams.set('filename', filename);

    const res = await fetch(targetUrl.toString());

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to download subtitle from backend' },
        { status: res.status }
      );
    }

    const text = await res.text();

    return new Response(text, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'text/vtt; charset=utf-8',
        'Content-Disposition': res.headers.get('Content-Disposition') || 'attachment',
      },
    });
  } catch (error: any) {
    console.error('[API Subtitle Proxy Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
