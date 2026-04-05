import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: arenaId } = await params;

  const rateCheck = checkRateLimit(`clusters:${arenaId}`, 3, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json({ success: false, error: 'Please wait before regenerating clusters.' }, { status: 429 });
  }

  try {
    const { contributions } = await request.json();

    if (!contributions?.length) {
      return NextResponse.json({ success: true, data: { clusters: [] } });
    }

    // Try AI-powered thematic clustering
    try {
      const { getCompletionProvider } = await import('@/lib/ai/index');
      const ai = getCompletionProvider();

      const contribList = contributions
        .map((c: { type: string; content: string }) => `[${c.type}] ${c.content}`)
        .join('\n');

      const response = await ai.complete(
        `Group these brainstorming contributions into 3-6 thematic clusters. Each cluster should have a short label and list the contribution indices (0-based) that belong to it.

CONTRIBUTIONS:
${contribList}

Respond with valid JSON only:
{"clusters": [{"label": "Theme Name", "indices": [0, 2, 5]}, ...]}`,
        {
          temperature: 0.3,
          maxTokens: 500,
          systemPrompt: 'You are a brainstorming analyst. Group ideas by theme. Respond with JSON only.',
        }
      );

      const parsed = JSON.parse(response);
      const clusters = parsed.clusters.map((cluster: { label: string; indices: number[] }) => {
        const items = cluster.indices
          .filter((i: number) => i < contributions.length)
          .map((i: number) => contributions[i]);
        return {
          label: cluster.label,
          type: items[0]?.type ?? 'feature',
          items,
          totalAgree: items.reduce((sum: number, c: { signals?: { agree?: number } }) => sum + (c.signals?.agree ?? 0), 0),
        };
      }).filter((c: { items: unknown[] }) => c.items.length > 0);

      return NextResponse.json({ success: true, data: { clusters, source: 'ai' } });
    } catch {
      // AI not available — return empty (client does type-based fallback)
      return NextResponse.json({ success: true, data: { clusters: [], source: 'fallback' } });
    }
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to cluster' }, { status: 500 });
  }
}
