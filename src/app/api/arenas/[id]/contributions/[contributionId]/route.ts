import { NextRequest, NextResponse } from 'next/server';
import { updateContributionType, updateContributionContent } from '@/lib/store';
import type { ContributionType } from '@/types/arena';
import { CONTRIBUTION_TYPES } from '@/types/arena';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contributionId: string }> }
) {
  const { id: arenaId, contributionId } = await params;

  try {
    const body = await request.json();
    const { type, content } = body;

    // Update type
    if (type && CONTRIBUTION_TYPES.includes(type as ContributionType)) {
      const updated = await updateContributionType(arenaId, contributionId, type as ContributionType);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Contribution not found' }, { status: 404 });
      }
    }

    // Update content
    if (content?.trim()) {
      const updated = await updateContributionContent(arenaId, contributionId, content.trim());
      if (!updated) {
        return NextResponse.json({ success: false, error: 'Contribution not found' }, { status: 404 });
      }

      // Broadcast edit via Socket.io
      const io = (globalThis as Record<string, unknown>).__nuclave_io;
      if (io && typeof (io as { to: (r: string) => { emit: (e: string, d: unknown) => void } }).to === 'function') {
        (io as { to: (r: string) => { emit: (e: string, d: unknown) => void } })
          .to(`arena:${arenaId}`)
          .emit('contribution-edited', { contributionId, content: content.trim() });
      }

      return NextResponse.json({ success: true, data: updated });
    }

    // Re-fetch to return current state
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}
