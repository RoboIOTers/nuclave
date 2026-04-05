import { NextRequest, NextResponse } from 'next/server';
import { toggleSignal, getArena, getSignalCounts, getContributions, addContribution } from '@/lib/store';
import type { StoredContribution } from '@/lib/store';
import type { SignalType } from '@/types/arena';
import { SIGNAL_TYPES } from '@/types/arena';
import { checkRateLimit } from '@/lib/rate-limit';
import { generateSkepticLocal } from '@/lib/ai/skeptic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: arenaId } = await params;

  try {
    const body = await request.json();
    const { contributionId, userToken, type } = body;

    if (!contributionId || !userToken) {
      return NextResponse.json(
        { success: false, error: 'contributionId and userToken are required' },
        { status: 400 }
      );
    }

    if (!SIGNAL_TYPES.includes(type as SignalType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid signal type' },
        { status: 400 }
      );
    }

    // Rate limit: max 30 signals per user per minute
    const rateKey = `signal:${arenaId}:${userToken}`;
    const rateCheck = checkRateLimit(rateKey, 30, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many reactions. Slow down.' },
        { status: 429 }
      );
    }

    const result = await toggleSignal(contributionId, userToken, type as SignalType);

    // Auto-trigger Skeptic AI when agree count hits threshold during debate+
    if (result.action === 'added' && type === 'agree') {
      try {
        const arena = await getArena(arenaId);
        if (arena && arena.phase !== 'ideation') {
          const signals = await getSignalCounts(contributionId);
          if (signals.agree >= 2) {
            const allContribs = await getContributions(arenaId);
            const original = allContribs.find((c) => c.id === contributionId);
            const alreadyHasSkeptic = allContribs.some(
              (c) => c.isSkepticAi && c.content.includes((original?.content ?? '').slice(0, 30))
            );

            if (original && !original.isSkepticAi && !alreadyHasSkeptic) {
              const skepticResponse = generateSkepticLocal({
                id: original.id,
                type: original.type,
                content: original.content,
                agreeCount: signals.agree,
              });

              if (skepticResponse) {
                const skepticContrib: StoredContribution = {
                  id: crypto.randomUUID(),
                  arenaId,
                  type: skepticResponse.type,
                  content: skepticResponse.content,
                  authorToken: 'skeptic-ai',
                  isSkepticAi: true,
                  isPinned: false,
                  isHidden: false,
                  clusterId: null,
                  createdAt: new Date().toISOString(),
                };
                await addContribution(skepticContrib);

                // Broadcast via Socket.io if available
                const io = (globalThis as Record<string, unknown>).__nuclave_io;
                if (io && typeof (io as { to: (r: string) => { emit: (e: string, d: unknown) => void } }).to === 'function') {
                  (io as { to: (r: string) => { emit: (e: string, d: unknown) => void } })
                    .to(`arena:${arenaId}`)
                    .emit('contribution-added', {
                      ...skepticContrib,
                      signals: { agree: 0, critical: 0, challenge: 0 },
                    });
                }
              }
            }
          }
        }
      } catch {
        // Skeptic trigger is non-critical — don't fail the signal request
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
