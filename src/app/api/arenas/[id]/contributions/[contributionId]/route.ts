import { NextRequest, NextResponse } from 'next/server';
import { updateContributionType } from '@/lib/store';
import type { ContributionType } from '@/types/arena';
import { CONTRIBUTION_TYPES } from '@/types/arena';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contributionId: string }> }
) {
  const { id: arenaId, contributionId } = await params;

  try {
    const body = await request.json();
    const { type } = body;

    if (!CONTRIBUTION_TYPES.includes(type as ContributionType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid contribution type' },
        { status: 400 }
      );
    }

    const updated = await updateContributionType(arenaId, contributionId, type as ContributionType);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Contribution not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
