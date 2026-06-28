import { NextRequest, NextResponse } from 'next/server';
import { getUser, logDownload } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    const { type, lang } = await request.json();
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '127.0.0.1';

    await logDownload(user?.id || null, ipAddress, type, lang);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
