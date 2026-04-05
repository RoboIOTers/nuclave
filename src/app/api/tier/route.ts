import { NextRequest, NextResponse } from 'next/server';
import { getUserTier, getActiveArenaCount } from '@/lib/tier';

export async function GET(request: NextRequest) {
  const userToken = request.nextUrl.searchParams.get('token');

  if (!userToken) {
    return NextResponse.json({ success: false, error: 'token required' }, { status: 400 });
  }

  const tier = await getUserTier(userToken);
  const activeArenas = await getActiveArenaCount(userToken);

  return NextResponse.json({
    success: true,
    data: {
      ...tier,
      activeArenas,
      arenasRemaining: Math.max(0, tier.maxArenas - activeArenas),
    },
  });
}
