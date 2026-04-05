import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ success: true, data: null });
  }

  return NextResponse.json({ success: true, data: user });
}
