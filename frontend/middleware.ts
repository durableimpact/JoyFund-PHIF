// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = [
  '/dashboard',
  '/create',
  '/history',
  '/social-worker',
  '/hospital/receptionist',
  '/hospital/nurse',
  '/hospital-admin',
  '/admin',
];

export function middleware(req: NextRequest) {
  const token = req.cookies.get('joyfund_token')?.value;
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)'],
};