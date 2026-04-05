import { NextRequest, NextResponse } from 'next/server';
import { toggleSignal } from '@/lib/store';
import type { SignalType } from '@/types/arena';
import { SIGNAL_TYPES } from '@/types/arena';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: _arenaId } = await params;

  try {
    const body = await request.json();
    const { contributionId, userToken, type } = body;

    if (!contributionId || !userToken) {
      return NextResponse.json(
        { success: false, error: 'contributionId and userToken are required' },
        { status: 400 }
      );
    }

    if (!SIGNAL_TYPES.includes(type as SignalType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid signal type' },
        { status: 400 }
      );
    }

    const result = await toggleSignal(contributionId, userToken, type as SignalType);

    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
