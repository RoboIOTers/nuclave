import { NextRequest, NextResponse } from 'next/server';
import { createArena, getAllArenas, getArenasByCreator, type StoredArena } from '@/lib/store';
import { getCurrentUser } from '@/lib/auth';
import type { ArenaType, ArenaMode } from '@/types/arena';
import { checkRateLimit } from '@/lib/rate-limit';
import { getUserTier, getActiveArenaCount } from '@/lib/tier';

function generateJoinCode(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, type, mode, isAnonymous, maxContributors, contextDocument, creatorToken, template, phaseDurations, aiEnabled } = body;

    // Rate limit: max 5 arenas per user per hour
    const rateKey = `arena-create:${creatorToken || 'anonymous'}`;
    const rateCheck = checkRateLimit(rateKey, 5, 3600_000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many arenas created. Please wait before creating another.' },
        { status: 429 }
      );
    }

    // Check arena creation limit
    const userTier = await getUserTier(creatorToken || 'anonymous');
    const activeCount = await getActiveArenaCount(creatorToken || 'anonymous');
    if (activeCount >= userTier.maxArenas) {
      return NextResponse.json(
        {
          success: false,
          error: `You've reached your limit of ${userTier.maxArenas} active arenas. ${
            userTier.tier === 'free' ? 'Close an arena or upgrade to Pro for unlimited.' : ''
          }`,
          limitReached: true,
          tier: userTier.tier,
        },
        { status: 403 }
      );
    }

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    // Link the arena to the signed-in account (if any) so it follows the
    // user across devices; guests fall back to creator_token only.
    const currentUser = await getCurrentUser();

    const arena: StoredArena = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description?.trim() || null,
      type: (type || 'brainstorm') as ArenaType,
      mode: (mode || 'live') as ArenaMode,
      phase: 'ideation',
      status: 'active',
      isAnonymous: isAnonymous ?? true,
      joinCode: generateJoinCode(),
      contextDocument: contextDocument?.trim() || null,
      maxContributors: Math.min(Math.max(maxContributors || 10, 2), 500),
      creatorToken: creatorToken || 'anonymous',
      userId: currentUser?.id ?? null,
      template: template || null,
      phaseDurations: phaseDurations || null,
      phaseStartedAt: new Date().toISOString(),
      phaseDurationMinutes: phaseDurations?.ideation ?? null,
      aiEnabled: aiEnabled !== false,
      createdAt: new Date().toISOString(),
    };

    await createArena(arena);

    return NextResponse.json({ success: true, data: arena }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  const creatorToken = request.nextUrl.searchParams.get('creator');

  if (creatorToken) {
    return NextResponse.json({ success: true, data: await getArenasByCreator(creatorToken) });
  }

  return NextResponse.json({ success: true, data: await getAllArenas() });
}
