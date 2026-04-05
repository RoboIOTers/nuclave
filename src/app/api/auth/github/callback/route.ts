import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateUser, createSession, setSessionCookie } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=no_code`);
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=token_failed`);
    }

    // Get user info
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    // Get email
    let email = userData.email;
    if (!email) {
      const emailRes = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const emails = await emailRes.json();
      const primary = emails.find((e: { primary: boolean }) => e.primary);
      email = primary?.email ?? null;
    }

    // Create/find user
    const user = await findOrCreateUser(
      'github',
      String(userData.id),
      email,
      userData.name ?? userData.login,
      userData.avatar_url
    );

    // Create session
    const sessionToken = await createSession(user.id);
    await setSessionCookie(sessionToken);

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/`);
  } catch {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?error=auth_failed`);
  }
}
