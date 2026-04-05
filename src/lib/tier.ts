import postgres from 'postgres';

function getSql() {
  const g = globalThis as unknown as { __nuclave_sql?: ReturnType<typeof postgres> };
  if (!g.__nuclave_sql) {
    g.__nuclave_sql = postgres(process.env.DATABASE_URL!, { max: 10, idle_timeout: 20 });
  }
  return g.__nuclave_sql;
}

export interface TierInfo {
  tier: 'free' | 'pro' | 'enterprise';
  maxContributors: number;
  maxArenas: number;
}

const TIER_DEFAULTS: Record<string, TierInfo> = {
  free: { tier: 'free', maxContributors: 5, maxArenas: 5 },
  pro: { tier: 'pro', maxContributors: 50, maxArenas: 999 },
  enterprise: { tier: 'enterprise', maxContributors: 500, maxArenas: 999 },
};

export async function getUserTier(userToken: string): Promise<TierInfo> {
  const sql = getSql();
  const rows = await sql`SELECT tier, max_contributors, max_arenas FROM tiers WHERE user_token = ${userToken}`;

  if (rows.length === 0) {
    return TIER_DEFAULTS.free;
  }

  return {
    tier: rows[0].tier as TierInfo['tier'],
    maxContributors: rows[0].max_contributors as number,
    maxArenas: rows[0].max_arenas as number,
  };
}

export async function getArenaContributorCount(arenaId: string): Promise<number> {
  const sql = getSql();
  const rows = await sql`
    SELECT COUNT(DISTINCT author_token)::int as count
    FROM contributions
    WHERE arena_id = ${arenaId} AND author_token != 'skeptic-ai'
  `;
  return (rows[0]?.count as number) ?? 0;
}

export async function getActiveArenaCount(creatorToken: string): Promise<number> {
  const sql = getSql();
  const rows = await sql`
    SELECT COUNT(*)::int as count
    FROM arenas
    WHERE creator_token = ${creatorToken} AND status = 'active'
  `;
  return (rows[0]?.count as number) ?? 0;
}
