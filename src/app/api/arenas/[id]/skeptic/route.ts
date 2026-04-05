import { NextRequest, NextResponse } from 'next/server';
import { getArena, getContributions, getSignalCounts, addContribution } from '@/lib/store';
import type { StoredContribution } from '@/lib/store';
import { generateSkepticLocal, generateSkepticAI } from '@/lib/ai/skeptic';

export async function POST(
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

  const contributions = await getContributions(arenaId);
  const generated: StoredContribution[] = [];

  for (const c of contributions) {
    // Skip contributions from the Skeptic itself
    if (c.isSkepticAi) continue;

    const signals = await getSignalCounts(c.id);

    // Check if we already have a skeptic response for this contribution
    const hasSkepticResponse = contributions.some(
      (sc) => sc.isSkepticAi && sc.content.includes(c.content.slice(0, 30))
    );
    if (hasSkepticResponse) continue;

    // Try AI-powered, fall back to template
    let response;
    try {
      response = await generateSkepticAI(
        { id: c.id, type: c.type, content: c.content, agreeCount: signals.agree },
        arena.title
      );
    } catch {
      response = generateSkepticLocal({
        id: c.id,
        type: c.type,
        content: c.content,
        agreeCount: signals.agree,
      });
    }

    if (!response) continue;

    const skepticContribution: StoredContribution = {
      id: crypto.randomUUID(),
      arenaId,
      type: response.type,
      content: response.content,
      authorToken: 'skeptic-ai',
      isSkepticAi: true,
      isPinned: false,
      isHidden: false,
      clusterId: null,
      createdAt: new Date().toISOString(),
    };

    await addContribution(skepticContribution);
    generated.push(skepticContribution);
  }

  return NextResponse.json({
    success: true,
    data: { generated: generated.length, contributions: generated },
  });
}
