import postgres from 'postgres';
import { cookies } from 'next/headers';

function getSql() {
  const g = globalThis as unknown as { __nuclave_sql?: ReturnType<typeof postgres> };
  if (!g.__nuclave_sql) {
    g.__nuclave_sql = postgres(process.env.DATABASE_URL!, { max: 10, idle_timeout: 20 });
  }
  return g.__nuclave_sql;
}

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  provider: string;
}

const SESSION_COOKIE = 'nuclave_session';
const SESSION_TTL_DAYS = 30;

/**
 * Create or find user by OAuth provider.
 */
export async function findOrCreateUser(
  provider: string,
  providerId: string,
  email: string | null,
  name: string | null,
  avatarUrl: string | null
): Promise<AuthUser> {
  const sql = getSql();

  // Try to find existing
  const existing = await sql`
    SELECT * FROM auth_users WHERE provider = ${provider} AND provider_id = ${providerId}
  `;

  if (existing.length > 0) {
    const u = existing[0];
    // Update name/avatar if changed
    if (name || avatarUrl) {
      await sql`
        UPDATE auth_users SET
          name = COALESCE(${name}, name),
          avatar_url = COALESCE(${avatarUrl}, avatar_url),
          updated_at = now()
        WHERE id = ${u.id}
      `;
    }
    return mapUser(u);
  }

  // Create new
  const rows = await sql`
    INSERT INTO auth_users (email, name, avatar_url, provider, provider_id)
    VALUES (${email}, ${name}, ${avatarUrl}, ${provider}, ${providerId})
    RETURNING *
  `;

  return mapUser(rows[0]);
}

/**
 * Create a session for a user.
 */
export async function createSession(userId: string): Promise<string> {
  const sql = getSql();
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await sql`
    INSERT INTO auth_sessions (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt.toISOString()})
  `;

  return token;
}

/**
 * Get the current user from session cookie.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const sql = getSql();
  const rows = await sql`
    SELECT u.* FROM auth_users u
    JOIN auth_sessions s ON s.user_id = u.id
    WHERE s.token = ${token} AND s.expires_at > now()
  `;

  if (rows.length === 0) return null;
  return mapUser(rows[0]);
}

/**
 * Set session cookie.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
}

/**
 * Clear session.
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const sql = getSql();
    await sql`DELETE FROM auth_sessions WHERE token = ${token}`;
  }
  cookieStore.delete(SESSION_COOKIE);
}

function mapUser(row: Record<string, unknown>): AuthUser {
  return {
    id: row.id as string,
    email: row.email as string | null,
    name: row.name as string | null,
    avatarUrl: row.avatar_url as string | null,
    provider: row.provider as string,
  };
}
