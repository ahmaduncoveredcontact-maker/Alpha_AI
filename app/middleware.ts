import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Admin routes protection
  if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
    if (path === '/admin-login' || path === '/api/admin/auth') {
      return NextResponse.next();
    }
    const adminSession = request.cookies.get('admin_session');
    if (!adminSession || adminSession.value !== 'authenticated') {
      const loginUrl = new URL('/admin-login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Client live page protection
  if (path.startsWith('/live/') && !path.includes('/login')) {
    const clientSession = request.cookies.get('client_session');
    const adminSession = request.cookies.get('admin_session');
    const slug = path.split('/')[2];

    if (!clientSession && slug) {
      // If admin is logged in, redirect to auto-login endpoint
      if (adminSession && adminSession.value === 'authenticated') {
        const autoLoginUrl = new URL(`/api/client/auto-login?slug=${slug}`, request.url);
        return NextResponse.redirect(autoLoginUrl);
      }

      // No admin session – redirect to client login
      const loginUrl = new URL(`/live/${slug}/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/live/:slug*'],
};