// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

// Role-based route access control
// Maps route prefixes to allowed roles
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/dashboard': ['donor', 'guest'],
  '/create': ['donor', 'guest'],
  '/history': ['donor', 'guest'],
  '/social-worker': ['social_worker'],
  '/hospital/receptionist': ['receptionist'],
  '/hospital/nurse': ['nurse'],
  '/hospital-admin': ['hospital_admin'],
  '/admin': ['admin'],
  '/leaderboard': ['guest', 'donor', 'contributor', 'social_worker', 'receptionist', 'nurse', 'hospital_admin', 'admin'],
  '/explore': ['guest', 'donor', 'contributor', 'social_worker', 'receptionist', 'nurse', 'hospital_admin', 'admin'],
};

// backend user-info endpoints that return role info
const INFO_ENDPOINTS = [
  { endpoint: '/api/accounts/donor/info/', role: 'donor' },
  { endpoint: '/api/accounts/social-worker/info/', role: 'social_worker' },
  { endpoint: '/api/accounts/receptionist/info/', role: 'receptionist' },
  { endpoint: '/api/accounts/hospital-admin/info/', role: 'hospital_admin' },
  { endpoint: '/api/accounts/system-admin/info/', role: 'admin' },
];

// role → default home page redirect
const ROLE_HOME: Record<string, string> = {
  donor: '/dashboard',
  social_worker: '/social-worker/dashboard',
  receptionist: '/hospital/receptionist',
  nurse: '/hospital/nurse',
  hospital_admin: '/hospital-admin/dashboard',
  admin: '/admin/dashboard',
  guest: '/',
};

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('joyfund_token')?.value;
  const { pathname } = req.nextUrl;

  // Check if route requires protection
  const matchedRoute = Object.keys(ROUTE_PERMISSIONS).find((route) =>
    pathname.startsWith(route)
  );

  // If no matched protected route, allow access
  if (!matchedRoute) {
    return NextResponse.next();
  }

  // If the route allows guest access, make it public and skip token checks
  const allowedRoles = ROUTE_PERMISSIONS[matchedRoute] || [];
  if (allowedRoles.includes('guest')) {
    return NextResponse.next();
  }

  // If no token, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', encodeURIComponent(pathname));
    return NextResponse.redirect(loginUrl);
  }

  // Verify token and get user role
  const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://localhost:8000';

  let userRole: string | null = null;

  try {
    for (const { endpoint, role } of INFO_ENDPOINTS) {
      const res = await fetch(`${DJANGO_API_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        userRole = role;
        break;
      }

      if (res.status === 401) {
        break;
      }
    }
  } catch (e) {
    // network/backend error — treat as unauthenticated to be safe
    console.error('Middleware auth check failed:', e);
  }

  // If token is invalid or expired
  if (!userRole) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', encodeURIComponent(pathname));
    return NextResponse.redirect(loginUrl);
  }

  // Check if user's role is allowed to access this route
  // reuse previously computed `allowedRoles` from above
  if (!allowedRoles.includes(userRole)) {
    // User is authenticated but not authorized — redirect to their home page
    const homeUrl = ROLE_HOME[userRole] || '/';
    return NextResponse.redirect(new URL(homeUrl, req.url));
  }

  // User is authorized, allow access
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)'],
};
