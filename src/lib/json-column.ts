/**
 * Tolerant readers for JSON / JSONB columns.
 *
 * Legacy rows were written double-encoded — `${JSON.stringify(x)}` with the
 * postgres driver stores a JSONB *string* of JSON rather than a JSONB
 * array/object — so a column may come back from the driver as a JS string
 * instead of an already-parsed value. These helpers accept either shape (and
 * tolerate accidental multi-encoding), so callers always get a usable value.
 *
 * New writes should use `sql.json(...)`, which encodes exactly once.
 */

function unwrap(value: unknown): unknown {
  let v = value;
  // Peel up to a few layers of string encoding from legacy double-encoded rows.
  for (let i = 0; i < 3 && typeof v === 'string'; i++) {
    try {
      v = JSON.parse(v);
    } catch {
      return undefined;
    }
  }
  return v;
}

export function parseJsonArray<T = unknown>(value: unknown): T[] {
  const v = unwrap(value);
  return Array.isArray(v) ? (v as T[]) : [];
}

export function parseJsonObject<T extends Record<string, unknown>>(
  value: unknown
): T | null {
  const v = unwrap(value);
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as T) : null;
}
