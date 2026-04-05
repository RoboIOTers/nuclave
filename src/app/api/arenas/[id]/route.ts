import { NextRequest, NextResponse } from 'next/server';
import { getArena, getContributions, getSignalCounts } from '@/lib/store';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const arena = await getArena(id);

  if (!arena) {
    return NextResponse.json(
      { success: false, error: 'Arena not found' },
      { status: 404 }
    );
  }

  const rawContributions = await getContributions(id);
  const contributions = await Promise.all(
    rawContributions.map(async (c) => ({
      ...c,
      signals: await getSignalCounts(c.id),
    }))
  );

  return NextResponse.json({
    success: true,
    data: {
      ...arena,
      contributions,
      participantCount: new Set(contributions.map((c) => c.authorToken)).size || 1,
    },
  });
}
