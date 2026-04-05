import { NextRequest, NextResponse } from 'next/server';
import { updateArenaPhase, getArena } from '@/lib/store';
import type { ArenaPhase } from '@/types/arena';
import { ARENA_PHASES } from '@/types/arena';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const arena = await getArena(id);

  if (!arena) {
    return NextResponse.json(
      { success: false, error: 'Arena not found' },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const { phase } = body;

    if (!ARENA_PHASES.includes(phase as ArenaPhase)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phase' },
        { status: 400 }
      );
    }

    const updated = await updateArenaPhase(id, phase as ArenaPhase);
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
