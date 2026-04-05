import { NextRequest, NextResponse } from 'next/server';
import { getArena, addContribution, getContributions, getSignalCounts } from '@/lib/store';
import type { StoredContribution } from '@/lib/store';
import type { ContributionType } from '@/types/arena';
import { CONTRIBUTION_TYPES } from '@/types/arena';
import { checkRateLimit } from '@/lib/rate-limit';
import { getUserTier, getArenaContributorCount } from '@/lib/tier';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: arenaId } = await params;
  const arena = await getArena(arenaId);

  if (!arena) {
    return NextResponse.json(
      { success: false, error: 'Arena not found' },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const { type, content, authorToken } = body;

    // Rate limit: max 10 contributions per user per minute
    const rateKey = `contribution:${arenaId}:${authorToken || 'anonymous'}`;
    const rateCheck = checkRateLimit(rateKey, 10, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many contributions. Please wait a moment.',
          retryAfterMs: rateCheck.retryAfterMs,
        },
        { status: 429 }
      );
    }

    // Check contributor limit (free tier = 5)
    const creatorTier = await getUserTier(arena.creatorToken);
    const currentContributors = await getArenaContributorCount(arenaId);
    const isExistingContributor = (await getContributions(arenaId)).some(
      (c) => c.authorToken === (authorToken || 'anonymous')
    );
    if (!isExistingContributor && currentContributors >= creatorTier.maxContributors) {
      return NextResponse.json(
        {
          success: false,
          error: `This arena has reached its limit of ${creatorTier.maxContributors} contributors. ${
            creatorTier.tier === 'free' ? 'Upgrade to Pro for up to 50 contributors.' : ''
          }`,
          limitReached: true,
          tier: creatorTier.tier,
        },
        { status: 403 }
      );
    }

    if (!content?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    if (!CONTRIBUTION_TYPES.includes(type as ContributionType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid contribution type' },
        { status: 400 }
      );
    }

    const contribution: StoredContribution = {
      id: crypto.randomUUID(),
      arenaId,
      type: type as ContributionType,
      content: content.trim(),
      authorToken: authorToken || 'anonymous',
      isSkepticAi: false,
      isPinned: false,
      isHidden: false,
      clusterId: null,
      createdAt: new Date().toISOString(),
    };

    await addContribution(contribution);

    // Check for similar contributions (non-blocking)
    let duplicates: Array<{ id: string; content: string; similarity: number }> = [];
    try {
      const { findSimilarByText } = await import('@/lib/ai/dedup');
      duplicates = await findSimilarByText(arenaId, contribution.content, contribution.id);
    } catch {
      // Dedup is non-critical
    }

    // Try to generate and store embedding (non-blocking)
    try {
      const { getEmbeddingProvider } = await import('@/lib/ai/index');
      const { storeEmbedding } = await import('@/lib/ai/dedup');
      const embedder = getEmbeddingProvider();
      const embedding = await embedder.embed(contribution.content);
      await storeEmbedding(contribution.id, embedding);
    } catch {
      // Embedding is optional — works without API keys
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...contribution,
          signals: { agree: 0, critical: 0, challenge: 0 },
          duplicates: duplicates.length > 0 ? duplicates : undefined,
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: arenaId } = await params;
  const arena = await getArena(arenaId);

  if (!arena) {
    return NextResponse.json(
      { success: false, error: 'Arena not found' },
      { status: 404 }
    );
  }

  const rawContributions = await getContributions(arenaId);
  const contributions = await Promise.all(
    rawContributions.map(async (c) => ({
      ...c,
      signals: await getSignalCounts(c.id),
    }))
  );

  return NextResponse.json({ success: true, data: contributions });
}
