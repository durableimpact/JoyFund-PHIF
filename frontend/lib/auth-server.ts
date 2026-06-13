import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { roleRedirectMap } from "@/lib/role-redirect"

/**
 * CRITICAL SECURITY NOTE:
 * 
 * The proxy.ts file protects PAGE navigation, but NOT Server Actions.
 * Server Actions are public POST endpoints that can be called directly.
 * 
 * An attacker who knows a Server Action exists can call it via fetch(),
 * bypassing the proxy entirely. Therefore:
 * 
 * ✅ DO: Verify authentication INSIDE every Server Action
 * ❌ DON'T: Rely on proxy.ts to protect Server Actions
 * 
 * This is the two-layer security model:
 * 1. proxy.ts - Protects page navigation (UX + first-line defense)
 * 2. Server Actions - Verify auth on every operation (mandatory)
 * 3. Database - Row-level security as final fallback
 * 
 * @see https://nextjs.org/docs/app/guides/authentication
 */

/**
 * Protect a server component or server action by requiring authentication.
 * Call this at the start of your server component or action.
 * 
 * For Server Actions, this is MANDATORY - proxy.ts doesn't protect them!
 *
 * @throws Redirects to login if not authenticated
 * @returns The user's session
 *
 * @example Server Component
 * ```ts
 * import { requireAuth } from "@/lib/auth-server"
 * 
 * export default async function Dashboard() {
 *   const session = await requireAuth()
 *   return <div>Welcome {session.user.email}</div>
 * }
 * ```
 * 
 * @example Server Action (MUST have auth check)
 * ```ts
 * 'use server'
 * import { requireAuth } from "@/lib/auth-server"
 * 
 * export async function updateProfile(data: ProfileData) {
 *   const session = await requireAuth() // ← MANDATORY
 *   // Safe to process now, verified user exists
 *   return updateUserInDB(session.user.id, data)
 * }
 * ```
 */
export async function requireAuth() {
  const session = await auth()

  if (!session || (session as any).error) {
    const loginUrl = (session as any)?.error === "RefreshAccessTokenError" 
      ? "/login?reason=session_expired" 
      : "/login";
    redirect(loginUrl)
  }

  return session
}

/**
 * Protect a server component or action with role-based access control.
 * Call this at the start of your server component or action.
 * 
 * For Server Actions, this is MANDATORY - proxy.ts doesn't protect them!
 *
 * @param allowedRoles - Single role or array of allowed roles
 * @throws Redirects to unauthorized if user doesn't have required role
 * @returns The user's session
 *
 * @example Server Component
 * ```ts
 * import { requireRole } from "@/lib/auth-server"
 * 
 * export default async function AdminDashboard() {
 *   const session = await requireRole("SYSTEM_ADMIN")
 *   return <div>Admin Area</div>
 * }
 * ```
 * 
 * @example Server Action with Role Check (MUST have auth check)
 * ```ts
 * 'use server'
 * import { requireRole } from "@/lib/auth-server"
 * 
 * export async function deleteUser(userId: string) {
 *   const session = await requireRole("SYSTEM_ADMIN") // ← Verify role!
 *   // Only admins can reach here
 *   return deleteUserFromDB(userId)
 * }
 * ```
 */
export async function requireRole(allowedRoles: string | string[]) {
  const session = await auth()

  if (!session || (session as any).error) {
    const loginUrl = (session as any)?.error === "RefreshAccessTokenError" 
      ? "/login?reason=session_expired" 
      : "/login";
    redirect(loginUrl)
  }

  const userRole = (session.user as any)?.role
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

  if (!roles.includes(userRole)) {
    const correctDashboard = roleRedirectMap[userRole as USER_ROLE]
    if (correctDashboard) {
      redirect(correctDashboard)
    }
    redirect("/unauthorized")
  }

  return session
}

/**
 * Get the current session without requiring authentication.
 * Returns null if user is not authenticated.
 * 
 * Use this when you need conditional behavior based on auth status.
 *
 * @returns The user's session or null
 *
 * @example
 * ```ts
 * export default async function Page() {
 *   const session = await getSession()
 *   
 *   if (session) {
 *     return <div>Logged in as {session.user.email}</div>
 *   }
 *   return <div>Not logged in</div>
 * }
 * ```
 */
export async function getSession() {
  return await auth()
}
