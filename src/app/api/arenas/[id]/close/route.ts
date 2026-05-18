import { NextRequest, NextResponse } from 'next/server';
import { getArena, getContributions, getSignalCounts } from '@/lib/store';
import { normalizePhaseHistory } from '@/lib/phase-history';
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
    return NextResponse.json({ success: false, error: 'Arena not found' }, { status: 404 });
  }

  // Closing an arena is destructive (generates the decision record and ends
  // the session) — restrict it to the facilitator who created the arena.
  const body = (await request.json().catch(() => ({}))) as { creatorToken?: string };
  if (body.creatorToken !== arena.creatorToken) {
    return NextResponse.json(
      { success: false, error: 'Only the arena facilitator can close this arena.' },
      { status: 403 }
    );
  }

  const sql = getSql();

  // Record final phase time
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
        phase_history = COALESCE(phase_history, '[]'::jsonb) || ${sql.json([historyEntry])}::jsonb
      WHERE id = ${id}
    `;
  }

  // Fetch phase history (normalized to tolerate legacy double-encoded rows)
  const arenaRows = await sql`SELECT phase_history FROM arenas WHERE id = ${id}`;
  const phaseHistory = normalizePhaseHistory(arenaRows[0]?.phase_history);

  const rawContribs = await getContributions(id);
  const contributions = await Promise.all(
    rawContribs.map(async (c) => ({
      ...c,
      signals: await getSignalCounts(c.id),
    }))
  );

  const agreed = contributions
    .filter((c) => c.signals.agree >= 2 && c.signals.challenge === 0)
    .map((c) => c.content)
    .slice(0, 10);

  const contested = contributions
    .filter((c) => c.signals.agree > 0 && c.signals.challenge > 0)
    .map((c) => c.content)
    .slice(0, 10);

  const questions = contributions
    .filter((c) => c.type === 'question')
    .map((c) => c.content);

  const blockers = contributions
    .filter((c) => c.type === 'blocker')
    .map((c) => c.content);

  const nextActions = contributions
    .filter((c) => c.type === 'decision' || c.type === 'checklist')
    .sort((a, b) => b.signals.agree - a.signals.agree)
    .map((c) => c.content)
    .slice(0, 10);

  const participantTokens = new Set(contributions.map((c) => c.authorToken));

  // Build phase timing summary
  const totalSeconds = phaseHistory.reduce((sum, p) => sum + p.timeSpentSeconds, 0);
  const totalOvertime = phaseHistory.reduce((sum, p) => sum + p.overtime, 0);
  const formatMins = (secs: number) => `${Math.floor(secs / 60)}m ${secs % 60}s`;
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

  const phaseTimingSummary = phaseHistory.map((p) => {
    const planned = p.plannedSeconds ? formatMins(p.plannedSeconds) : 'no limit';
    const actual = formatMins(p.timeSpentSeconds);
    const over = p.overtime > 0 ? ` (+${formatMins(p.overtime)} over)` : '';
    return `${p.phase}: ${actual} (planned: ${planned})${over}`;
  });

  const narrative = `This session produced ${plural(contributions.length, 'contribution')} from ${plural(participantTokens.size, 'participant')} across ${plural(phaseHistory.length, 'phase')} in ${formatMins(totalSeconds)} total. ${
    totalOvertime > 0 ? `The session ran ${formatMins(totalOvertime)} over planned time. ` : ''
  }${
    agreed.length > 0 ? `The group reached consensus on ${plural(agreed.length, 'item')}.` : 'No clear consensus emerged.'
  } ${blockers.length > 0 ? `${plural(blockers.length, 'blocker')} ${blockers.length === 1 ? 'was' : 'were'} identified.` : ''} ${
    questions.length > 0 ? `${plural(questions.length, 'question')} ${questions.length === 1 ? 'remains' : 'remain'} open.` : ''
  }`;

  // Save decision record
  await sql`
    INSERT INTO decisions (arena_id, title, agreed_items, contested_items, unresolved_questions, blockers, next_actions, narrative, contribution_count, participant_count)
    VALUES (${id}, ${arena.title}, ${sql.json(agreed)}, ${sql.json(contested)}, ${sql.json(questions)}, ${sql.json(blockers)}, ${sql.json(nextActions)}, ${narrative}, ${contributions.length}, ${participantTokens.size})
    ON CONFLICT (arena_id) DO UPDATE SET
      agreed_items = EXCLUDED.agreed_items,
      contested_items = EXCLUDED.contested_items,
      unresolved_questions = EXCLUDED.unresolved_questions,
      blockers = EXCLUDED.blockers,
      next_actions = EXCLUDED.next_actions,
      narrative = EXCLUDED.narrative,
      contribution_count = EXCLUDED.contribution_count,
      participant_count = EXCLUDED.participant_count
  `;

  // Update arena status
  await sql`UPDATE arenas SET status = 'closed', phase = 'closed', updated_at = now() WHERE id = ${id}`;

  // Store in Institutional Memory (non-blocking)
  try {
    const { storeArenaKnowledge } = await import('@/lib/knowledge');
    const tags = [...new Set(contributions.map((c) => c.type))];
    await storeArenaKnowledge(id, arena.title, narrative, agreed, blockers, tags);
  } catch {
    // Knowledge storage is non-critical
  }

  return NextResponse.json({
    success: true,
    data: {
      title: arena.title,
      agreed,
      contested,
      questions,
      blockers,
      nextActions,
      narrative,
      phaseTimingSummary,
      totalTime: formatMins(totalSeconds),
      totalOvertime: totalOvertime > 0 ? formatMins(totalOvertime) : null,
      contributionCount: contributions.length,
      participantCount: participantTokens.size,
    },
  });
}
