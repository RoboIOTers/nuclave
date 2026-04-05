import { NextRequest, NextResponse } from 'next/server';
import { findRelatedKnowledge, getAllKnowledge } from '@/lib/knowledge';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');

  if (query) {
    // Rate limit search
    const ip = request.headers.get('x-real-ip') ?? 'unknown';
    const rateCheck = checkRateLimit(`knowledge:${ip}`, 10, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Please wait.' }, { status: 429 });
    }

    const results = await findRelatedKnowledge(query);
    return NextResponse.json({ success: true, data: results });
  }

  // Return all
  const all = await getAllKnowledge();
  return NextResponse.json({ success: true, data: all });
}
