import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Missing GOOGLE_CLIENT_ID' }, { status: 500 });
  }

  // Store slug in cookie for callback
  const cookieStore = await cookies();
  cookieStore.set('gbp_oauth_slug', slug, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10,
    path: '/',
  });

  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/client/gbp/callback`;

  // ✅ ADDED: Gmail readonly scope
  const scope = [
    'https://www.googleapis.com/auth/business.manage',
    'https://www.googleapis.com/auth/gmail.readonly'  // NEW
  ].join(' ');

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${clientId}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scope)}` +
    `&access_type=offline` +
    `&prompt=consent`;

  return NextResponse.redirect(authUrl);
}