import postgres from 'postgres';
import { parseJsonArray } from './json-column';

function getSql() {
  const g = globalThis as unknown as { __nuclave_sql?: ReturnType<typeof postgres> };
  if (!g.__nuclave_sql) {
    g.__nuclave_sql = postgres(process.env.DATABASE_URL!, { max: 10, idle_timeout: 20 });
  }
  return g.__nuclave_sql;
}

export interface KnowledgeEntry {
  id: string;
  arenaId: string;
  title: string;
  summary: string | null;
  keyDecisions: string[];
  keyBlockers: string[];
  tags: string[];
  createdAt: string;
  similarity?: number;
}

/**
 * Store knowledge from a closed arena.
 */
export async function storeArenaKnowledge(
  arenaId: string,
  title: string,
  summary: string | null,
  keyDecisions: string[],
  keyBlockers: string[],
  tags: string[]
): Promise<void> {
  const sql = getSql();

  // Try to generate embedding for the combined text
  let embeddingStr: string | null = null;
  try {
    const { getEmbeddingProvider } = await import('./ai/index');
    const embedder = getEmbeddingProvider();
    const textToEmbed = `${title}. ${summary ?? ''}. Decisions: ${keyDecisions.join('. ')}. Blockers: ${keyBlockers.join('. ')}`;
    const embedding = await embedder.embed(textToEmbed);
    embeddingStr = `[${embedding.join(',')}]`;
  } catch {
    // Embedding not available
  }

  if (embeddingStr) {
    await sql`
      INSERT INTO arena_knowledge (arena_id, title, summary, key_decisions, key_blockers, tags, embedding)
      VALUES (${arenaId}, ${title}, ${summary}, ${sql.json(keyDecisions)}, ${sql.json(keyBlockers)}, ${sql.json(tags)}, ${embeddingStr}::vector)
      ON CONFLICT (arena_id) DO UPDATE SET
        title = EXCLUDED.title, summary = EXCLUDED.summary,
        key_decisions = EXCLUDED.key_decisions, key_blockers = EXCLUDED.key_blockers,
        tags = EXCLUDED.tags, embedding = EXCLUDED.embedding
    `;
  } else {
    await sql`
      INSERT INTO arena_knowledge (arena_id, title, summary, key_decisions, key_blockers, tags)
      VALUES (${arenaId}, ${title}, ${summary}, ${sql.json(keyDecisions)}, ${sql.json(keyBlockers)}, ${sql.json(tags)})
      ON CONFLICT (arena_id) DO UPDATE SET
        title = EXCLUDED.title, summary = EXCLUDED.summary,
        key_decisions = EXCLUDED.key_decisions, key_blockers = EXCLUDED.key_blockers,
        tags = EXCLUDED.tags
    `;
  }
}

/**
 * Find related past arenas by semantic similarity.
 */
export async function findRelatedKnowledge(
  query: string,
  limit = 5
): Promise<KnowledgeEntry[]> {
  const sql = getSql();

  // Try vector similarity first
  try {
    const { getEmbeddingProvider } = await import('./ai/index');
    const embedder = getEmbeddingProvider();
    const embedding = await embedder.embed(query);
    const embeddingStr = `[${embedding.join(',')}]`;

    const rows = await sql`
      SELECT *,
        1 - (embedding <=> ${embeddingStr}::vector) as similarity
      FROM arena_knowledge
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${embeddingStr}::vector
      LIMIT ${limit}
    `;

    return rows
      .filter((r) => (r.similarity as number) > 0.3)
      .map(mapKnowledgeRow);
  } catch {
    // Fallback: text search
  }

  // Fallback: simple ILIKE search
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3).slice(0, 5);
  if (words.length === 0) return [];

  const pattern = `%${words.join('%')}%`;
  const rows = await sql`
    SELECT *, 0.5 as similarity
    FROM arena_knowledge
    WHERE LOWER(title) LIKE ${pattern} OR LOWER(summary) LIKE ${pattern}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  return rows.map(mapKnowledgeRow);
}

/**
 * Get all knowledge entries (for browsing).
 */
export async function getAllKnowledge(): Promise<KnowledgeEntry[]> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM arena_knowledge ORDER BY created_at DESC LIMIT 50`;
  return rows.map(mapKnowledgeRow);
}

function mapKnowledgeRow(row: Record<string, unknown>): KnowledgeEntry {
  return {
    id: row.id as string,
    arenaId: row.arena_id as string,
    title: row.title as string,
    summary: row.summary as string | null,
    keyDecisions: parseJsonArray<string>(row.key_decisions),
    keyBlockers: parseJsonArray<string>(row.key_blockers),
    tags: parseJsonArray<string>(row.tags),
    createdAt: (row.created_at as Date).toISOString(),
    similarity: row.similarity as number | undefined,
  };
}
