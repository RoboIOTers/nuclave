import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

function getSql() {
  const g = globalThis as unknown as { __nuclave_sql?: ReturnType<typeof postgres> };
  if (!g.__nuclave_sql) {
    g.__nuclave_sql = postgres(process.env.DATABASE_URL!, { max: 10, idle_timeout: 20 });
  }
  return g.__nuclave_sql;
}

/** Join arena / update role */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: arenaId } = await params;
  const sql = getSql();

  try {
    const { userToken, displayName, role } = await request.json();

    if (!userToken) {
      return NextResponse.json({ success: false, error: 'userToken required' }, { status: 400 });
    }

    const validRoles = ['facilitator', 'expert', 'contributor', 'observer'];
    const safeRole = validRoles.includes(role) ? role : 'contributor';

    const rows = await sql`
      INSERT INTO participants (arena_id, user_token, display_name, role)
      VALUES (${arenaId}, ${userToken}, ${displayName ?? null}, ${safeRole})
      ON CONFLICT (arena_id, user_token) DO UPDATE SET
        role = ${safeRole},
        display_name = COALESCE(${displayName ?? null}, participants.display_name)
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      data: {
        id: rows[0].id,
        arenaId: rows[0].arena_id,
        userToken: rows[0].user_token,
        displayName: rows[0].display_name,
        role: rows[0].role,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to join' }, { status: 500 });
  }
}

/** Get all participants for an arena */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: arenaId } = await params;
  const sql = getSql();

  const rows = await sql`
    SELECT id, user_token, display_name, role, joined_at
    FROM participants
    WHERE arena_id = ${arenaId}
    ORDER BY joined_at ASC
  `;

  return NextResponse.json({
    success: true,
    data: rows.map((r) => ({
      id: r.id,
      userToken: r.user_token,
      displayName: r.display_name,
      role: r.role,
      joinedAt: r.joined_at,
    })),
  });
}
