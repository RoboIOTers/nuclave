import { NextRequest, NextResponse } from 'next/server';
import { getArenasForParticipant, getContributionCount, claimGuestActivity } from '@/lib/store';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const userToken = request.nextUrl.searchParams.get('token');

  if (!userToken) {
    return NextResponse.json(
      { success: false, error: 'token parameter required' },
      { status: 400 }
    );
  }

  // When signed in, claim this browser's guest activity (arenas created,
  // contributed to, or joined) for the account so it appears on every device
  // the user logs in from.
  const user = await getCurrentUser();
  if (user) {
    await claimGuestActivity(userToken, user.id);
  }

  const arenas = await getArenasForParticipant(userToken, user?.id ?? null);

  // Enrich with contribution counts
  const enriched = await Promise.all(
    arenas.map(async (a) => ({
      ...a,
      contributionCount: await getContributionCount(a.id),
    }))
  );

  return NextResponse.json({ success: true, data: enriched });
}
