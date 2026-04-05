import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateUser, createSession, setSessionCookie } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=no_code`);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=token_failed`);
    }

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    // Create/find user
    const user = await findOrCreateUser(
      'google',
      userData.id,
      userData.email ?? null,
      userData.name ?? null,
      userData.picture ?? null
    );

    // Create session
    const sessionToken = await createSession(user.id);
    await setSessionCookie(sessionToken);

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/`);
  } catch {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=auth_failed`);
  }
}
