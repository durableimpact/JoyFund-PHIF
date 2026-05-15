// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

// protected route prefixes
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

// backend user-info endpoints (try each until one returns 200)
const INFO_ENDPOINTS = [
  '/api/accounts/donor/info/',
  '/api/accounts/social-worker/info/',
  '/api/accounts/receptionist/info/',
  '/api/accounts/hospital-admin/info/',
  '/api/accounts/system-admin/info/',
];

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('joyfund_token')?.value;
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));

  if (!isProtected) {
    return NextResponse.next();
  }

  // If no token cookie — redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // If token exists — verify it by calling backend info endpoints.
  // This prevents simple cookie spoofing; we require the backend to accept token.
  const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://localhost:8000';

  try {
    for (const endpoint of INFO_ENDPOINTS) {
      const res = await fetch(`${DJANGO_API_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        // token valid for at least one role-specific endpoint
        return NextResponse.next();
      }
      // if 403 try next endpoint; if 401 treat as invalid
      if (res.status === 401) {
        break;
      }
    }
  } catch (e) {
    // network/backend error — treat as unauthenticated to be safe
  }

  // invalid or expired token — redirect to login
  return NextResponse.redirect(new URL('/login', req.url));
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)'],
};