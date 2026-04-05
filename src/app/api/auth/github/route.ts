import { NextResponse } from 'next/server';

/** Redirect to GitHub OAuth */
export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { success: false, error: 'GitHub OAuth not configured' },
      { status: 501 }
    );
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`;
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;

  return NextResponse.redirect(url);
}
