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

    // If clicking the same phase, do nothing
    if (phase === arena.phase) {
      return NextResponse.json({
        success: true,
        data: {
          phase: arena.phase,
          phaseStartedAt: arena.phaseStartedAt,
          phaseDurationMinutes: arena.phaseDurationMinutes,
        },
      });
    }

    // Auto-resolve duration: explicit > stored template > null
    let resolvedDuration = durationMinutes ?? null;
    if (resolvedDuration === null && arena.phaseDurations) {
      const durations = typeof arena.phaseDurations === 'string'
        ? JSON.parse(arena.phaseDurations as string)
        : arena.phaseDurations;
      resolvedDuration = durations[phase] ?? null;
    }

    const sql = getSql();

    // Check if this phase was already visited — restore its timer if so
    const arenaRow = await sql`SELECT phase_history FROM arenas WHERE id = ${id}`;
    const history = (arenaRow[0]?.phase_history ?? []) as Array<{
      phase: string; startedAt: string; endedAt: string; timeSpentSeconds: number; plannedSeconds: number | null;
    }>;
    const previousVisit = history.findLast((h) => h.phase === phase);

    // Record time spent in the current phase before switching
    if (arena.phaseStartedAt) {
      const prevStart = new Date(arena.phaseStartedAt).getTime();
      const timeSpentSeconds = Math.floor((Date.now() - prevStart) / 1000);
      const plannedSeconds = arena.phaseDurationMinutes ? arena.phaseDurationMinutes * 60 : null;

      const historyEntry = {
        phase: arena.phase,
        startedAt: arena.phaseStartedAt,
        endedAt: new Date().toISOString(),
        timeSpentSeconds,
        plannedSeconds,
        overtime: plannedSeconds ? Math.max(0, timeSpentSeconds - plannedSeconds) : 0,
      };

      await sql`
        UPDATE arenas SET
          phase_history = COALESCE(phase_history, '[]'::jsonb) || ${JSON.stringify([historyEntry])}::jsonb
        WHERE id = ${id}
      `;
    }

    // If revisiting a phase, account for time already spent
    let startTimestamp = new Date().toISOString();
    if (previousVisit && resolvedDuration) {
      const allVisits = history.filter((h) => h.phase === phase);
      const totalSpent = allVisits.reduce((sum, v) => sum + v.timeSpentSeconds, 0);
      // Set start time back by the amount already spent, so the timer continues where it left off
      startTimestamp = new Date(Date.now() - totalSpent * 1000).toISOString();
    }

    // Switch to phase
    const rows = await sql`
      UPDATE arenas SET
        phase = ${phase},
        phase_started_at = ${startTimestamp},
        phase_duration_minutes = ${resolvedDuration},
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
