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

    // Redirect directly to the Express backend stream route.
    // This avoids Vercel serverless function timeouts for long MP3 transcoding.
    const publicBackendUrl = process.env.NEXT_PUBLIC_API_URL || BACKEND_URL;
    return NextResponse.redirect(`${publicBackendUrl}/api/download/stream/${id}`);
  } catch (error: any) {
    console.error('[API Stream Proxy Error]:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

