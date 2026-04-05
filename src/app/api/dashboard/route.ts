import { NextRequest, NextResponse } from 'next/server';
import { getArenasForParticipant, getContributionCount } from '@/lib/store';

export async function GET(request: NextRequest) {
  const userToken = request.nextUrl.searchParams.get('token');

  if (!userToken) {
    return NextResponse.json(
      { success: false, error: 'token parameter required' },
      { status: 400 }
    );
  }

  const arenas = await getArenasForParticipant(userToken);

  // Enrich with contribution counts
  const enriched = await Promise.all(
    arenas.map(async (a) => ({
      ...a,
      contributionCount: await getContributionCount(a.id),
    }))
  );

  return NextResponse.json({ success: true, data: enriched });
}
