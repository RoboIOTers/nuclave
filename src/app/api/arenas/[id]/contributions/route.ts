import { NextRequest, NextResponse } from 'next/server';
import { getArena, addContribution, getContributions, getSignalCounts } from '@/lib/store';
import type { StoredContribution } from '@/lib/store';
import type { ContributionType } from '@/types/arena';
import { CONTRIBUTION_TYPES } from '@/types/arena';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: arenaId } = await params;
  const arena = getArena(arenaId);

  if (!arena) {
    return NextResponse.json(
      { success: false, error: 'Arena not found' },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const { type, content, authorToken } = body;

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

    addContribution(contribution);

    return NextResponse.json(
      {
        success: true,
        data: { ...contribution, signals: { agree: 0, critical: 0, challenge: 0 } },
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
  const arena = getArena(arenaId);

  if (!arena) {
    return NextResponse.json(
      { success: false, error: 'Arena not found' },
      { status: 404 }
    );
  }

  const contributions = getContributions(arenaId).map((c) => ({
    ...c,
    signals: getSignalCounts(c.id),
  }));

  return NextResponse.json({ success: true, data: contributions });
}
