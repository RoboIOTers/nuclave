import { NextResponse } from 'next/server';

/** Redirect to Google OAuth */
export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { success: false, error: 'Google OAuth not configured' },
      { status: 501 }
    );
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&access_type=offline`;

  return NextResponse.redirect(url);
}
