import { NextRequest, NextResponse } from 'next/server';
import { getArenaByJoinCode } from '@/lib/store';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const arena = await getArenaByJoinCode(code);

  if (!arena) {
    return NextResponse.json(
      { success: false, error: 'Arena not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: arena });
}
