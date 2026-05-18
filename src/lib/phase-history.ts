/**
 * Phase-history rows were historically written double-encoded: the
 * `${JSON.stringify(x)}::jsonb` pattern with the postgres driver produces a
 * JSONB *string* rather than a JSONB array/object, so `phase_history` ends up
 * as an array whose elements are themselves JSON strings.
 *
 * `normalizePhaseHistory` reads both shapes — the legacy double-encoded one
 * and correctly-stored objects — so callers always get clean entries.
 * New writes should use `sql.json(...)` instead of `JSON.stringify(...)`.
 */

export interface PhaseHistoryEntry {
  phase: string;
  startedAt: string;
  endedAt: string;
  timeSpentSeconds: number;
  plannedSeconds: number | null;
  overtime: number;
}

function coerceEntry(raw: Record<string, unknown>): PhaseHistoryEntry | null {
  if (typeof raw.phase !== 'string') return null;
  return {
    phase: raw.phase,
    startedAt: typeof raw.startedAt === 'string' ? raw.startedAt : '',
    endedAt: typeof raw.endedAt === 'string' ? raw.endedAt : '',
    timeSpentSeconds: Number(raw.timeSpentSeconds) || 0,
    plannedSeconds: raw.plannedSeconds == null ? null : Number(raw.plannedSeconds) || 0,
    overtime: Number(raw.overtime) || 0,
  };
}

export function normalizePhaseHistory(raw: unknown): PhaseHistoryEntry[] {
  if (raw == null) return [];

  const items: unknown[] = Array.isArray(raw) ? raw : [raw];
  const flattened: unknown[] = [];

  for (const item of items) {
    if (typeof item === 'string') {
      // Legacy double-encoded element: a JSON string of an array or object.
      try {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed)) flattened.push(...parsed);
        else flattened.push(parsed);
      } catch {
        // Unparseable — skip it rather than crash the caller.
      }
    } else {
      flattened.push(item);
    }
  }

  const result: PhaseHistoryEntry[] = [];
  for (const entry of flattened) {
    if (entry && typeof entry === 'object') {
      const coerced = coerceEntry(entry as Record<string, unknown>);
      if (coerced) result.push(coerced);
    }
  }
  return result;
}
