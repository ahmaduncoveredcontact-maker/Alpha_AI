import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  }

  // Set the client session cookie
  const response = NextResponse.redirect(new URL(`/live/${slug}`, req.url));
  response.cookies.set('client_session', slug, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
    sameSite: 'lax',
  });

  return response;
}