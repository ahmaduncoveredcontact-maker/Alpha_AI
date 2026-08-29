import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Admin routes protection (except login page and auth API)
  if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
    // Skip auth API and login page itself
    if (path === '/admin-login' || path === '/api/admin/auth') {
      return NextResponse.next();
    }
    const adminSession = request.cookies.get('admin_session');
    if (!adminSession || adminSession.value !== 'authenticated') {
      const loginUrl = new URL('/admin-login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Client live page protection: check client session for /live/[slug] (not login)
  if (path.startsWith('/live/') && !path.includes('/login')) {
    const clientSession = request.cookies.get('client_session');
    if (!clientSession) {
      const slug = path.split('/')[2];
      if (slug) {
        const loginUrl = new URL(`/live/${slug}/login`, request.url);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/live/:slug*'],
};