import { auth } from "@/auth"
import { NextResponse, type NextRequest } from "next/server"
import type { NextProxy } from "next/server"

// Route categories
const protectedRoutes = ["/dashboard", "/profile", "/settings"]
const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"]
const adminRoutes = ["/dashboard/admin", "/dashboard/system-admin"]

/**
 * Proxy function for authentication and authorization.
 * 
 * Responsibilities:
 * 1. Redirect unauthenticated users away from protected pages
 * 2. Redirect authenticated users away from auth pages (login, register)
 * 3. Handle admin route protection
 * 4. Refresh session cookies (automatic via NextAuth)
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
  const { pathname } = request.nextUrl
  const session = await auth()

  // Helper to safely redirect
  const redirect = (path: string) => {
    const url = request.nextUrl.clone()
    url.pathname = path
    return NextResponse.redirect(url)
  }

  // 1. PROTECTED ROUTES - Require authentication
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!session) {
      // Redirect to login with return path
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = "/login"
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // 2. AUTH ROUTES - Only for unauthenticated users
  // Redirect logged-in users away from login/register to prevent confusion
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (session) {
      // Get the 'next' parameter for redirect, or default to dashboard
      const next = request.nextUrl.searchParams.get("next") || "/dashboard"
      
      // Safely validate redirect target (prevent open redirects)
      const destination = 
        next && next.startsWith("/") && !next.startsWith("//")
          ? next
          : "/dashboard"
      
      return redirect(destination)
    }
  }

  // 3. ADMIN ROUTES - Require both auth AND admin role
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (!session) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = "/login"
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    const userRole = (session?.user as any)?.role
    const adminRoles = ["SYSTEM_ADMIN", "HOSPITAL_ADMIN"]

    if (!adminRoles.includes(userRole)) {
      console.warn(
        `[proxy] Unauthorized admin access attempt. User: ${session.user?.email}, Role: ${userRole}, Path: ${pathname}`
      )
      return redirect("/unauthorized")
    }
  }

  return NextResponse.next()
}

// Configure which routes the proxy applies to
export const config = {
  matcher: [
    // Apply proxy to all routes except:
    // - Next.js internals and static files
    // - Images and media files
    // - Favicon and other assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
