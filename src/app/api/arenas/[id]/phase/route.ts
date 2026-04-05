import { NextRequest, NextResponse } from 'next/server';
import { getArena } from '@/lib/store';
import type { ArenaPhase } from '@/types/arena';
import { ARENA_PHASES } from '@/types/arena';
import postgres from 'postgres';

function getSql() {
  const g = globalThis as unknown as { __nuclave_sql?: ReturnType<typeof postgres> };
  if (!g.__nuclave_sql) {
    g.__nuclave_sql = postgres(process.env.DATABASE_URL!, { max: 10, idle_timeout: 20 });
  }
  return g.__nuclave_sql;
}

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
    const { phase, durationMinutes } = body;

    if (!ARENA_PHASES.includes(phase as ArenaPhase)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phase' },
        { status: 400 }
      );
    }

    const sql = getSql();
    const rows = await sql`
      UPDATE arenas SET
        phase = ${phase},
        phase_started_at = now(),
        phase_duration_minutes = ${durationMinutes ?? null},
        updated_at = now()
      WHERE id = ${id}
      RETURNING *,
        phase_started_at,
        phase_duration_minutes
    `;

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
    }

    const r = rows[0];

    // Broadcast phase change via Socket.io
    const io = (globalThis as Record<string, unknown>).__nuclave_io;
    if (io && typeof (io as { to: (room: string) => { emit: (e: string, d: unknown) => void } }).to === 'function') {
      (io as { to: (room: string) => { emit: (e: string, d: unknown) => void } })
        .to(`arena:${id}`)
        .emit('phase-changed', {
          phase,
          phaseStartedAt: r.phase_started_at ? (r.phase_started_at as Date).toISOString() : null,
          phaseDurationMinutes: r.phase_duration_minutes,
        });
    }

    return NextResponse.json({
      success: true,
      data: {
        phase,
        phaseStartedAt: r.phase_started_at ? (r.phase_started_at as Date).toISOString() : null,
        phaseDurationMinutes: r.phase_duration_minutes,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
