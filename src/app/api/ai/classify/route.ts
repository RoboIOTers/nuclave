import { NextRequest, NextResponse } from 'next/server';
import { classifyLocally } from '@/lib/ai/classify-local';

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    // Try AI classification if configured, fall back to local
    let result;
    try {
      const { classifyContribution } = await import('@/lib/ai/engine');
      const aiResult = await classifyContribution(content, 'feature');
      result = { type: aiResult.suggestedType, confidence: aiResult.confidence, source: 'ai' };
    } catch {
      // AI not configured — use local keyword classifier
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
