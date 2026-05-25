/**
 * Route configuration for authentication.
 * 
 * MODERN APPROACH (NextAuth v5):
 * Instead of middleware protecting routes globally, we now use explicit
 * protection in each component/action:
 * 
 * - Server components: Use requireAuth() from lib/auth-server.ts
 * - Client components: Use <ProtectedRoute> from components/protected-route.tsx
 * - Server actions: Use requireAuth() or requireRole()
 * 
 * This gives more control and follows NextJS best practices.
 */

/**
 * Public routes that don't require authentication.
 * These are accessible to everyone, including unauthenticated users.
 */
export const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/",
] as const

/**
 * Protected routes that require authentication.
 * Note: These are for documentation. Actual protection is done per-component.
 */
export const PROTECTED_ROUTES = [
  "/dashboard",
  "/profile",
  "/settings",
] as const

/**
 * Check if a route is public.
 *
 * @param pathname - The route path to check
 * @returns True if the route is public
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route)
  )
}

/**
 * Check if a route is typically protected.
 * Note: This is for reference only. Always use requireAuth() or <ProtectedRoute>
 * in actual components to enforce protection.
 *
 * @param pathname - The route path to check
 * @returns True if the route is typically protected
 */
export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
}

