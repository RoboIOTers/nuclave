import postgres from 'postgres';

const SIMILARITY_THRESHOLD = 0.85;

/**
 * Find duplicate or near-duplicate contributions using cosine similarity.
 * Requires pgvector extension and embeddings stored in the contributions table.
 * Returns matching contribution IDs with their similarity scores.
 */
export async function findSimilar(
  arenaId: string,
  embedding: number[],
  excludeId?: string
): Promise<Array<{ id: string; content: string; similarity: number }>> {
  const sql = getSql();

  // pgvector cosine distance: 1 - (a <=> b) = cosine similarity
  const embeddingStr = `[${embedding.join(',')}]`;

  const rows = await sql`
    SELECT
      id,
      content,
      1 - (embedding <=> ${embeddingStr}::vector) as similarity
    FROM contributions
    WHERE arena_id = ${arenaId}
      AND embedding IS NOT NULL
      ${excludeId ? sql`AND id != ${excludeId}` : sql``}
    ORDER BY embedding <=> ${embeddingStr}::vector
    LIMIT 5
  `;

  return rows
    .filter((r) => (r.similarity as number) >= SIMILARITY_THRESHOLD)
    .map((r) => ({
      id: r.id as string,
      content: r.content as string,
      similarity: r.similarity as number,
    }));
}

/**
 * Store embedding for a contribution.
 */
export async function storeEmbedding(contributionId: string, embedding: number[]): Promise<void> {
  const sql = getSql();
  const embeddingStr = `[${embedding.join(',')}]`;

  await sql`
    UPDATE contributions
    SET embedding = ${embeddingStr}::vector
    WHERE id = ${contributionId}
  `;
}

/**
 * Simple text-based deduplication fallback (no embeddings needed).
 * Uses trigram similarity on the content text.
 */
export async function findSimilarByText(
  arenaId: string,
  content: string,
  excludeId?: string
): Promise<Array<{ id: string; content: string; similarity: number }>> {
  const sql = getSql();
  const normalizedContent = content.toLowerCase().trim();

  // Fetch all contributions and do client-side comparison
  const rows = await sql`
    SELECT id, content
    FROM contributions
    WHERE arena_id = ${arenaId}
      AND is_hidden = false
      ${excludeId ? sql`AND id != ${excludeId}` : sql``}
  `;

  const results: Array<{ id: string; content: string; similarity: number }> = [];

  for (const row of rows) {
    const sim = jaccardSimilarity(normalizedContent, (row.content as string).toLowerCase().trim());
    if (sim >= 0.5) {
      results.push({
        id: row.id as string,
        content: row.content as string,
        similarity: sim,
      });
    }
  }

  return results.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
}

/**
 * Jaccard similarity — quick approximation for text overlap.
 */
function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(/\s+/).filter((w) => w.length > 2));
  const setB = new Set(b.split(/\s+/).filter((w) => w.length > 2));
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ── Connection helper ──

function getSql() {
  const globalForSql = globalThis as unknown as { __nuclave_sql?: ReturnType<typeof postgres> };
  if (!globalForSql.__nuclave_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is required');
    globalForSql.__nuclave_sql = postgres(url, { max: 10, idle_timeout: 20 });
  }
  return globalForSql.__nuclave_sql;
}
