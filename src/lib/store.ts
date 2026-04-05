/**
 * In-memory global store for MVP.
 * Uses globalThis to persist across Next.js serverless function invocations.
 * Will be replaced by PostgreSQL + Drizzle in production.
 */

import type { ContributionType, SignalType, ArenaType, ArenaMode, ArenaPhase } from '@/types/arena';

export interface StoredArena {
  id: string;
  title: string;
  description: string | null;
  type: ArenaType;
  mode: ArenaMode;
  phase: ArenaPhase;
  status: 'draft' | 'active' | 'paused' | 'closed';
  isAnonymous: boolean;
  joinCode: string;
  contextDocument: string | null;
  maxContributors: number;
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

interface GlobalStore {
  arenas: Map<string, StoredArena>;
  contributions: Map<string, StoredContribution[]>; // keyed by arenaId
  signals: Map<string, StoredSignal[]>; // keyed by contributionId
}

const globalForStore = globalThis as unknown as { __nuclave_store?: GlobalStore };

function getStore(): GlobalStore {
  if (!globalForStore.__nuclave_store) {
    globalForStore.__nuclave_store = {
      arenas: new Map(),
      contributions: new Map(),
      signals: new Map(),
    };
  }
  return globalForStore.__nuclave_store;
}

// ── Arena operations ──

export function createArena(arena: StoredArena): StoredArena {
  const store = getStore();
  store.arenas.set(arena.id, arena);
  store.contributions.set(arena.id, []);
  return arena;
}

export function getArena(id: string): StoredArena | undefined {
  return getStore().arenas.get(id);
}

export function getArenaByJoinCode(code: string): StoredArena | undefined {
  const store = getStore();
  for (const arena of store.arenas.values()) {
    if (arena.joinCode === code) return arena;
  }
  return undefined;
}

export function getAllArenas(): StoredArena[] {
  return Array.from(getStore().arenas.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function updateArenaPhase(id: string, phase: ArenaPhase): StoredArena | undefined {
  const store = getStore();
  const arena = store.arenas.get(id);
  if (!arena) return undefined;
  const updated = { ...arena, phase };
  store.arenas.set(id, updated);
  return updated;
}

// ── Contribution operations ──

export function addContribution(contribution: StoredContribution): StoredContribution {
  const store = getStore();
  const list = store.contributions.get(contribution.arenaId) ?? [];
  list.unshift(contribution); // newest first
  store.contributions.set(contribution.arenaId, list);
  return contribution;
}

export function getContributions(arenaId: string): StoredContribution[] {
  return getStore().contributions.get(arenaId) ?? [];
}

// ── Signal operations ──

export function toggleSignal(
  contributionId: string,
  userToken: string,
  type: SignalType
): { action: 'added' | 'changed' | 'removed'; signal: StoredSignal | null } {
  const store = getStore();
  const list = store.signals.get(contributionId) ?? [];

  const existingIndex = list.findIndex((s) => s.userToken === userToken);

  if (existingIndex >= 0) {
    const existing = list[existingIndex];
    if (existing.type === type) {
      // Remove — toggle off
      list.splice(existingIndex, 1);
      store.signals.set(contributionId, list);
      return { action: 'removed', signal: null };
    }
    // Change signal type
    const updated: StoredSignal = { ...existing, type };
    list[existingIndex] = updated;
    store.signals.set(contributionId, list);
    return { action: 'changed', signal: updated };
  }

  // Add new
  const signal: StoredSignal = {
    id: crypto.randomUUID(),
    contributionId,
    userToken,
    type,
    createdAt: new Date().toISOString(),
  };
  list.push(signal);
  store.signals.set(contributionId, list);
  return { action: 'added', signal };
}

export function getSignalCounts(contributionId: string): Record<SignalType, number> {
  const list = getStore().signals.get(contributionId) ?? [];
  const counts: Record<SignalType, number> = { agree: 0, critical: 0, challenge: 0 };
  for (const s of list) {
    counts[s.type]++;
  }
  return counts;
}

export function getUserSignal(contributionId: string, userToken: string): SignalType | null {
  const list = getStore().signals.get(contributionId) ?? [];
  const found = list.find((s) => s.userToken === userToken);
  return found?.type ?? null;
}
