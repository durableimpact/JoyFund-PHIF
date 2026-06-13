import { auth } from "@/auth";
import { NextResponse, type NextRequest } from "next/server";
import type { NextProxy } from "next/server";
import { roleRedirectMap } from "@/lib/role-redirect";

// Route categories
const protectedRoutes = ["/dashboard", "/profile", "/settings"];
const authRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];
const adminRoutes = ["/dashboard/admin", "/dashboard/system-admin"];

/**
 * Proxy function for authentication and authorization.
 *
 * Responsibilities:
 * 1. Check for token refresh errors and force logout
 * 2. Redirect unauthenticated users away from protected pages
 * 3. Redirect authenticated users to their role-specific dashboard
 * 4. Redirect authenticated users away from auth pages (login, register)
 * 5. Handle admin route protection
 * 6. Refresh session cookies (automatic via NextAuth)
 *
 * IMPORTANT: This proxy protects PAGE navigation only.
 * Server Actions are NOT protected by proxy and must verify auth internally.
 * Always check authentication inside Server Actions using requireAuth() or requireRole().
 *
 * @see lib/auth-server.ts - Use requireAuth() in Server Actions
 *
 * @example
 * // Server Action needs its own auth check
 * 'use server'
 * import { requireAuth } from "@/lib/auth-server"
 *
 * export async function updateProfile(data: ProfileData) {
 *   const session = await requireAuth() // Always verify!
 *   // Now safe to process the request
 * }
 */
export const proxy: NextProxy = async (request, event) => {
  const { pathname } = request.nextUrl;
  const session = await auth();

  // Helper to safely redirect
  const redirect = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    return NextResponse.redirect(url);
  };

  // ============================================================================
  // 0. CHECK FOR REFRESH TOKEN ERRORS
  // ============================================================================
  // If token refresh failed, force user to login again ONLY if they are on a protected route
  // Skip this check for public routes (like /) to avoid aggressive redirects
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route)) || 
                          adminRoutes.some((route) => pathname.startsWith(route));

  if (
    session &&
    (session as any).error === "RefreshAccessTokenError" &&
    isProtectedRoute &&
    !pathname.startsWith("/login")
  ) {
    console.warn("[proxy] Token refresh failed on protected route - forcing login");
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("reason", "session_expired");
    // Preserve original path so they can return after login
    const original = pathname + request.nextUrl.search;
    loginUrl.searchParams.set("redirect", original);
    return NextResponse.redirect(loginUrl);
  }

  // If session exists but has no access token, force logout
  if (
    session &&
    !session.accessToken &&
    !pathname.startsWith("/login")
  ) {
    console.error("[proxy] No access token in session - forcing logout");
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("reason", "unauthorized");
    return NextResponse.redirect(loginUrl);
  }

  // ============================================================================
  // 1. PROTECTED ROUTES - Require authentication
  // ============================================================================
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!session) {
      // Redirect to login with return path
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      // Preserve original path + query when sending user to login
      const original = pathname + request.nextUrl.search;
      loginUrl.searchParams.set("redirect", original);
      return NextResponse.redirect(loginUrl);
    }

    // If authenticated on the root /dashboard, redirect to role-specific dashboard
    // This avoids rendering an empty page while the client loads its session
    if (pathname === "/dashboard") {
      const userRole = (session.user as any)?.role as USER_ROLE;
      if (userRole && roleRedirectMap[userRole]) {
        const url = request.nextUrl.clone();
        url.pathname = roleRedirectMap[userRole];
        url.search = "";
        return NextResponse.redirect(url);
      }
    }
  }

  // ============================================================================
  // 2. AUTH ROUTES - Only for unauthenticated users
  // ============================================================================
  // Redirect logged-in users away from login/register to prevent confusion
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    // Only redirect away if the session is VALID (no errors)
    if (session && !(session as any).error) {
      // Prefer 'redirect' query param (used elsewhere) but support 'next' too
      const redirectParam = request.nextUrl.searchParams.get("redirect");
      const next = request.nextUrl.searchParams.get("next");
      const candidate = redirectParam || next || "/dashboard";

      // Safely validate redirect target (prevent open redirects)
      let destination =
        candidate && candidate.startsWith("/") && !candidate.startsWith("//")
          ? candidate
          : "/dashboard";

      // If session includes a role, prefer the role-specific dashboard
      const userRole = (session.user as any)?.role as USER_ROLE;
      if (userRole && roleRedirectMap[userRole]) {
        destination = roleRedirectMap[userRole];
      }

      return redirect(destination);
    }
  }

  // ============================================================================
  // 3. ADMIN ROUTES - Require both auth AND admin role
  // ============================================================================
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (!session) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      const original = pathname + request.nextUrl.search;
      loginUrl.searchParams.set("redirect", original);
      return NextResponse.redirect(loginUrl);
    }

    const userRole = (session?.user as any)?.role;
    const adminRoles = ["SYSTEM_ADMIN", "HOSPITAL_ADMIN"];

    if (!adminRoles.includes(userRole)) {
      console.warn(
        `[proxy] Unauthorized admin access attempt. User: ${session.user?.email}, Role: ${userRole}, Path: ${pathname}. Redirecting to correct dashboard.`,
      );
      const correctDashboard = roleRedirectMap[userRole as USER_ROLE];
      if (correctDashboard) {
        return redirect(correctDashboard);
      }
      return redirect("/unauthorized");
    }
  }

  return NextResponse.next();
};

// Configure which routes the proxy applies to
export const config = {
  matcher: [
    // Apply proxy to all routes except:
    // - Next.js internals and static files
    // - Sentry monitoring tunnel
    // - Images and media files
    // - Favicon and other assets
    "/((?!_next/static|_next/image|monitoring|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
