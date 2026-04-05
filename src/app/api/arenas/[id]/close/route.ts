import { NextRequest, NextResponse } from 'next/server';
import { getArena, getContributions, getSignalCounts } from '@/lib/store';
import postgres from 'postgres';

function getSql() {
  const g = globalThis as unknown as { __nuclave_sql?: ReturnType<typeof postgres> };
  if (!g.__nuclave_sql) {
    g.__nuclave_sql = postgres(process.env.DATABASE_URL!, { max: 10, idle_timeout: 20 });
  }
  return g.__nuclave_sql;
}

/**
 * POST /api/arenas/:id/close
 * Close an arena and generate a permanent decision record.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const arena = await getArena(id);

  if (!arena) {
    return NextResponse.json({ success: false, error: 'Arena not found' }, { status: 404 });
  }

  const sql = getSql();
  const rawContribs = await getContributions(id);
  const contributions = await Promise.all(
    rawContribs.map(async (c) => ({
      ...c,
      signals: await getSignalCounts(c.id),
    }))
  );

  // Classify contributions for decision record
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

  const narrative = `This session produced ${contributions.length} contributions from ${participantTokens.size} participants. ${
    agreed.length > 0 ? `The group reached consensus on ${agreed.length} items.` : 'No clear consensus emerged.'
  } ${blockers.length > 0 ? `${blockers.length} blockers were identified.` : ''} ${
    questions.length > 0 ? `${questions.length} questions remain open.` : ''
  }`;

  // Save decision record
  await sql`
    INSERT INTO decisions (arena_id, title, agreed_items, contested_items, unresolved_questions, blockers, next_actions, narrative, contribution_count, participant_count)
    VALUES (${id}, ${arena.title}, ${JSON.stringify(agreed)}, ${JSON.stringify(contested)}, ${JSON.stringify(questions)}, ${JSON.stringify(blockers)}, ${JSON.stringify(nextActions)}, ${narrative}, ${contributions.length}, ${participantTokens.size})
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
      contributionCount: contributions.length,
      participantCount: participantTokens.size,
    },
  });
}
