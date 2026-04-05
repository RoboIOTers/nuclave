import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const { content, authorToken } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 });
    }

    // Rate limit: 10 improve requests per user per minute
    const ip = request.headers.get('x-real-ip') ?? 'unknown';
    const rateKey = `improve:${authorToken || ip}`;
    const rateCheck = checkRateLimit(rateKey, 10, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Please wait before requesting another improvement.' }, { status: 429 });
    }

    try {
      const { getCompletionProvider } = await import('@/lib/ai/index');
      const ai = getCompletionProvider();

      const improved = await ai.complete(
        `Rewrite this brainstorming contribution to be clearer, more concise, and better written. Fix any spelling or grammar mistakes. Keep the same meaning and tone. If the original is already well-written, make only minimal changes.\n\nOriginal: "${content.trim()}"\n\nRespond with ONLY the improved text, nothing else. No quotes, no explanation.`,
        {
          temperature: 0.3,
          maxTokens: 200,
          systemPrompt: 'You are a concise writing editor. Output only the improved text.',
        }
      );

      const trimmed = improved.trim().replace(/^["']|["']$/g, '');

      // Don't suggest if it's basically the same
      if (trimmed.toLowerCase() === content.trim().toLowerCase()) {
        return NextResponse.json({ success: true, data: { improved: null, reason: 'Already well-written' } });
      }

      return NextResponse.json({ success: true, data: { improved: trimmed } });
    } catch {
      return NextResponse.json({ success: true, data: { improved: null, reason: 'AI not configured' } });
    }
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to improve' }, { status: 500 });
  }
}
