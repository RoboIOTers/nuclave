import { NextRequest, NextResponse } from 'next/server';
import { classifyLocally } from '@/lib/ai/classify-local';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const { content, authorToken, aiEnabled } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    // If AI is disabled for this arena, use local only
    if (aiEnabled === false) {
      const local = classifyLocally(content);
      return NextResponse.json({ success: true, data: { ...local, source: 'local' } });
    }

    // Rate limit
    const ip = request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for') ?? 'unknown';
    const rateKey = `classify:${authorToken || ip}`;
    const rateCheck = checkRateLimit(rateKey, 15, 60_000);
    if (!rateCheck.allowed) {
      const local = classifyLocally(content);
      return NextResponse.json({ success: true, data: { ...local, source: 'local' } });
    }

    // Try AI classification
    let result;
    try {
      const { classifyContribution } = await import('@/lib/ai/engine');
      const aiResult = await classifyContribution(content, 'feature');
      result = { type: aiResult.suggestedType, confidence: aiResult.confidence, source: 'ai' };
    } catch {
      const local = classifyLocally(content);
      result = { ...local, source: 'local' };
    }

    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Classification failed' },
      { status: 500 }
    );
  }
}
