import { NextRequest, NextResponse } from 'next/server';
import { createArena, getAllArenas, type StoredArena } from '@/lib/store';
import type { ArenaType, ArenaMode } from '@/types/arena';

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
    const { title, description, type, mode, isAnonymous, maxContributors, contextDocument } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

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
      createdAt: new Date().toISOString(),
    };

    createArena(arena);

    return NextResponse.json({ success: true, data: arena }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ success: true, data: getAllArenas() });
}
