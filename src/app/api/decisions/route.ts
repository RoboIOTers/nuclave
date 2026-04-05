import { NextResponse } from 'next/server';
import postgres from 'postgres';

function getSql() {
  const g = globalThis as unknown as { __nuclave_sql?: ReturnType<typeof postgres> };
  if (!g.__nuclave_sql) {
    g.__nuclave_sql = postgres(process.env.DATABASE_URL!, { max: 10, idle_timeout: 20 });
  }
  return g.__nuclave_sql;
}

export async function GET() {
  const sql = getSql();

  const rows = await sql`
    SELECT d.*, a.join_code, a.type as arena_type
    FROM decisions d
    JOIN arenas a ON a.id = d.arena_id
    ORDER BY d.created_at DESC
    LIMIT 50
  `;

  const decisions = rows.map((r) => ({
    id: r.id,
    arenaId: r.arena_id,
    title: r.title,
    joinCode: r.join_code,
    arenaType: r.arena_type,
    agreedItems: r.agreed_items,
    contestedItems: r.contested_items,
    unresolvedQuestions: r.unresolved_questions,
    blockers: r.blockers,
    nextActions: r.next_actions,
    narrative: r.narrative,
    contributionCount: r.contribution_count,
    participantCount: r.participant_count,
    createdAt: (r.created_at as Date).toISOString(),
  }));

  return NextResponse.json({ success: true, data: decisions });
}
