/**
 * Data store backed by PostgreSQL.
 * Same interface as the original in-memory store, now persistent.
 */

import postgres from 'postgres';
import type { ContributionType, SignalType, ArenaPhase } from '@/types/arena';
import { parseJsonObject } from './json-column';

// ── Types ──

export interface StoredArena {
  id: string;
  title: string;
  description: string | null;
  type: string;
  mode: string;
  phase: string;
  status: string;
  isAnonymous: boolean;
  joinCode: string;
  contextDocument: string | null;
  maxContributors: number;
  creatorToken: string;
  template: string | null;
  phaseDurations: Record<string, number> | null;
  phaseStartedAt: string | null;
  phaseDurationMinutes: number | null;
  aiEnabled: boolean;
  createdAt: string;
}

export interface StoredContribution {
  id: string;
  arenaId: string;
  type: ContributionType;
  content: string;
  authorToken: string;
  isSkepticAi: boolean;
  isPinned: boolean;
  isHidden: boolean;
  clusterId: string | null;
  createdAt: string;
}

export interface StoredSignal {
  id: string;
  contributionId: string;
  userToken: string;
  type: SignalType;
  createdAt: string;
}

// ── Connection ──

const globalForSql = globalThis as unknown as { __nuclave_sql?: ReturnType<typeof postgres> };

function getSql() {
  if (!globalForSql.__nuclave_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL is required');
    }
    globalForSql.__nuclave_sql = postgres(url, { max: 10, idle_timeout: 20 });
  }
  return globalForSql.__nuclave_sql;
}

// ── Arena operations ──

export async function createArena(arena: StoredArena): Promise<StoredArena> {
  const sql = getSql();
  await sql`
    INSERT INTO arenas (id, title, description, type, mode, phase, status, is_anonymous, join_code, context_document, max_contributors, creator_token, phase_durations, phase_started_at, phase_duration_minutes, ai_enabled, created_at)
    VALUES (${arena.id}, ${arena.title}, ${arena.description}, ${arena.type}, ${arena.mode}, ${arena.phase}, ${arena.status}, ${arena.isAnonymous}, ${arena.joinCode}, ${arena.contextDocument}, ${arena.maxContributors}, ${arena.creatorToken}, ${arena.phaseDurations ? sql.json(arena.phaseDurations) : null}, ${arena.phaseStartedAt}, ${arena.phaseDurationMinutes}, ${arena.aiEnabled}, ${arena.createdAt})
  `;
  return arena;
}

export async function getArena(id: string): Promise<StoredArena | undefined> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM arenas WHERE id = ${id}`;
  if (rows.length === 0) return undefined;
  return mapArenaRow(rows[0]);
}

export async function getArenaByJoinCode(code: string): Promise<StoredArena | undefined> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM arenas WHERE join_code = ${code}`;
  if (rows.length === 0) return undefined;
  return mapArenaRow(rows[0]);
}

export async function getAllArenas(): Promise<StoredArena[]> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM arenas ORDER BY created_at DESC LIMIT 50`;
  return rows.map(mapArenaRow);
}

export async function getArenasByCreator(creatorToken: string): Promise<StoredArena[]> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM arenas WHERE creator_token = ${creatorToken} ORDER BY created_at DESC LIMIT 50`;
  return rows.map(mapArenaRow);
}

export async function getArenasForParticipant(userToken: string): Promise<StoredArena[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT DISTINCT a.* FROM arenas a
    LEFT JOIN contributions c ON c.arena_id = a.id AND c.author_token = ${userToken}
    LEFT JOIN participants p ON p.arena_id = a.id AND p.user_token = ${userToken}
    WHERE a.creator_token = ${userToken} OR c.id IS NOT NULL OR p.id IS NOT NULL
    ORDER BY a.created_at DESC
    LIMIT 50
  `;
  return rows.map(mapArenaRow);
}

export async function getContributionCount(arenaId: string): Promise<number> {
  const sql = getSql();
  const rows = await sql`SELECT COUNT(*)::int as count FROM contributions WHERE arena_id = ${arenaId}`;
  return (rows[0]?.count as number) ?? 0;
}

export async function updateArenaPhase(id: string, phase: ArenaPhase): Promise<StoredArena | undefined> {
  const sql = getSql();
  const rows = await sql`UPDATE arenas SET phase = ${phase}, updated_at = now() WHERE id = ${id} RETURNING *`;
  if (rows.length === 0) return undefined;
  return mapArenaRow(rows[0]);
}

function mapArenaRow(row: Record<string, unknown>): StoredArena {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string | null,
    type: row.type as string,
    mode: row.mode as string,
    phase: row.phase as string,
    status: row.status as string,
    isAnonymous: row.is_anonymous as boolean,
    joinCode: row.join_code as string,
    contextDocument: row.context_document as string | null,
    maxContributors: row.max_contributors as number,
    creatorToken: (row.creator_token as string) ?? 'anonymous',
    template: (row.template as string) ?? null,
    phaseDurations: parseJsonObject<Record<string, number>>(row.phase_durations),
    phaseStartedAt: row.phase_started_at ? (row.phase_started_at as Date).toISOString() : null,
    phaseDurationMinutes: (row.phase_duration_minutes as number) ?? null,
    aiEnabled: (row.ai_enabled as boolean) ?? true,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

// ── Contribution operations ──

export async function addContribution(contribution: StoredContribution): Promise<StoredContribution> {
  const sql = getSql();
  await sql`
    INSERT INTO contributions (id, arena_id, type, content, author_token, is_skeptic_ai, is_pinned, is_hidden, cluster_id, created_at)
    VALUES (${contribution.id}, ${contribution.arenaId}, ${contribution.type}, ${contribution.content}, ${contribution.authorToken}, ${contribution.isSkepticAi}, ${contribution.isPinned}, ${contribution.isHidden}, ${contribution.clusterId}, ${contribution.createdAt})
  `;
  return contribution;
}

export async function getContributions(arenaId: string): Promise<StoredContribution[]> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM contributions WHERE arena_id = ${arenaId} ORDER BY created_at DESC`;
  return rows.map(mapContributionRow);
}

export async function updateContributionType(arenaId: string, contributionId: string, type: ContributionType): Promise<StoredContribution | undefined> {
  const sql = getSql();
  const rows = await sql`UPDATE contributions SET type = ${type} WHERE id = ${contributionId} AND arena_id = ${arenaId} RETURNING *`;
  if (rows.length === 0) return undefined;
  return mapContributionRow(rows[0]);
}

export async function updateContributionContent(arenaId: string, contributionId: string, content: string): Promise<StoredContribution | undefined> {
  const sql = getSql();
  const rows = await sql`UPDATE contributions SET content = ${content} WHERE id = ${contributionId} AND arena_id = ${arenaId} RETURNING *`;
  if (rows.length === 0) return undefined;
  return mapContributionRow(rows[0]);
}

function mapContributionRow(row: Record<string, unknown>): StoredContribution {
  return {
    id: row.id as string,
    arenaId: row.arena_id as string,
    type: row.type as ContributionType,
    content: row.content as string,
    authorToken: row.author_token as string,
    isSkepticAi: row.is_skeptic_ai as boolean,
    isPinned: row.is_pinned as boolean,
    isHidden: row.is_hidden as boolean,
    clusterId: row.cluster_id as string | null,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

// ── Signal operations ──

export async function toggleSignal(
  contributionId: string,
  userToken: string,
  type: SignalType
): Promise<{ action: 'added' | 'changed' | 'removed'; signal: StoredSignal | null }> {
  const sql = getSql();

  const existing = await sql`SELECT * FROM signals WHERE contribution_id = ${contributionId} AND user_token = ${userToken}`;

  if (existing.length > 0) {
    if (existing[0].type === type) {
      // Toggle off
      await sql`DELETE FROM signals WHERE id = ${existing[0].id}`;
      return { action: 'removed', signal: null };
    }
    // Change type
    const rows = await sql`UPDATE signals SET type = ${type} WHERE id = ${existing[0].id} RETURNING *`;
    return { action: 'changed', signal: mapSignalRow(rows[0]) };
  }

  // New signal
  const rows = await sql`
    INSERT INTO signals (contribution_id, user_token, type)
    VALUES (${contributionId}, ${userToken}, ${type})
    RETURNING *
  `;
  return { action: 'added', signal: mapSignalRow(rows[0]) };
}

export async function getSignalCounts(contributionId: string): Promise<Record<SignalType, number>> {
  const sql = getSql();
  const rows = await sql`
    SELECT type, COUNT(*)::int as count
    FROM signals
    WHERE contribution_id = ${contributionId}
    GROUP BY type
  `;
  const counts: Record<SignalType, number> = { agree: 0, critical: 0, challenge: 0 };
  for (const row of rows) {
    counts[row.type as SignalType] = row.count as number;
  }
  return counts;
}

export async function getUserSignal(contributionId: string, userToken: string): Promise<SignalType | null> {
  const sql = getSql();
  const rows = await sql`SELECT type FROM signals WHERE contribution_id = ${contributionId} AND user_token = ${userToken}`;
  return rows.length > 0 ? (rows[0].type as SignalType) : null;
}

function mapSignalRow(row: Record<string, unknown>): StoredSignal {
  return {
    id: row.id as string,
    contributionId: row.contribution_id as string,
    userToken: row.user_token as string,
    type: row.type as SignalType,
    createdAt: (row.created_at as Date).toISOString(),
  };
}
