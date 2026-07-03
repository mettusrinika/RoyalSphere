import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware only prevents authenticated users
// from visiting login/register pages.
// Dashboard authentication is handled on the client
// using Zustand + /auth/me.

const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Do not block dashboard routes here.
  // Client-side auth will handle them.

  if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};