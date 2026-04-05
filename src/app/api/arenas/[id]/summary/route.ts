import { NextRequest, NextResponse } from 'next/server';

// MVP summary generator — uses the AI engine when available,
// falls back to simple aggregation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: arenaId } = await params;
    const body = await request.json();
    const { contributions } = body;

    if (!contributions || contributions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No contributions to summarize' },
        { status: 400 }
      );
    }

    // Try AI-powered summary
    try {
      const { generateSummary } = await import('@/lib/ai/engine');
      const summary = await generateSummary(contributions);
      return NextResponse.json({ success: true, data: summary, arenaId });
    } catch {
      // Fall back to simple aggregation if AI is not configured
    }

    // Fallback: simple aggregation without AI
    const byType: Record<string, Array<{ content: string; signals: Record<string, number> }>> = {};
    for (const c of contributions) {
      if (!byType[c.type]) byType[c.type] = [];
      byType[c.type].push(c);
    }

    const consensusItems: string[] = [];
    const contestedItems: string[] = [];
    const unresolvedQuestions: string[] = [];
    const criticalBlockers: string[] = [];
    const topIdeasByType: Record<string, string[]> = {};

    for (const [type, items] of Object.entries(byType)) {
      const sorted = items.sort(
        (a, b) =>
          (b.signals?.agree ?? 0) -
          (a.signals?.agree ?? 0)
      );
      topIdeasByType[type] = sorted.slice(0, 3).map((i) => i.content);

      for (const item of items) {
        const agree = item.signals?.agree ?? 0;
        const challenge = item.signals?.challenge ?? 0;

        if (type === 'question') {
          unresolvedQuestions.push(item.content);
        } else if (type === 'blocker') {
          criticalBlockers.push(item.content);
        } else if (agree > 0 && challenge === 0) {
          consensusItems.push(item.content);
        } else if (agree > 0 && challenge > 0) {
          contestedItems.push(item.content);
        }
      }
    }

    const summary = {
      consensusItems: consensusItems.slice(0, 5),
      contestedItems: contestedItems.slice(0, 5),
      unresolvedQuestions: unresolvedQuestions.slice(0, 5),
      criticalBlockers,
      topIdeasByType,
      narrativeSummary: `This session has ${contributions.length} contributions across ${Object.keys(byType).length} categories. ${
        criticalBlockers.length > 0
          ? `There are ${criticalBlockers.length} critical blockers that need attention.`
          : 'No critical blockers have been raised yet.'
      } ${
        unresolvedQuestions.length > 0
          ? `${unresolvedQuestions.length} questions remain open.`
          : ''
      }`,
    };

    return NextResponse.json({ success: true, data: summary, arenaId });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
