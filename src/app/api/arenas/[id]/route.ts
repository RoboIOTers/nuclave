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

/** Role weight multipliers */
const ROLE_WEIGHTS: Record<string, number> = {
  facilitator: 1.5,
  expert: 2,
  contributor: 1,
  observer: 0,
};

export async function GET(
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

  // Resolve facilitator status server-side. creatorToken is the secret that
  // authorizes phase/close actions, so it must never be sent to clients —
  // expose only the derived boolean.
  const token = request.nextUrl.searchParams.get('token');
  const isFacilitator = !!token && token === arena.creatorToken;
  const { creatorToken: _creatorToken, ...arenaPublic } = arena;

  // Load participants for role-based weighting
  const sql = getSql();
  const participantRows = await sql`
    SELECT user_token, role FROM participants WHERE arena_id = ${id}
  `;
  const roleMap = new Map<string, string>();
  for (const r of participantRows) {
    roleMap.set(r.user_token as string, r.role as string);
  }

  const rawContributions = await getContributions(id);
  const contributions = await Promise.all(
    rawContributions.map(async (c) => {
      const signals = await getSignalCounts(c.id);

      // Compute weighted signals
      const signalRows = await sql`
        SELECT user_token, type FROM signals WHERE contribution_id = ${c.id}
      `;
      const weighted: Record<string, number> = { agree: 0, critical: 0, challenge: 0 };
      for (const s of signalRows) {
        const role = roleMap.get(s.user_token as string) ?? 'contributor';
        const weight = ROLE_WEIGHTS[role] ?? 1;
        weighted[s.type as string] += weight;
      }

      return {
        ...c,
        signals,
        weightedSignals: weighted,
      };
    })
  );

  return NextResponse.json({
    success: true,
    data: {
      ...arenaPublic,
      isFacilitator,
      contributions,
      participantCount: new Set([
        ...contributions.map((c) => c.authorToken),
        ...participantRows.map((r) => r.user_token as string),
      ]).size || 1,
      participants: participantRows.map((r) => ({
        userToken: r.user_token,
        role: r.role,
      })),
    },
  });
}
