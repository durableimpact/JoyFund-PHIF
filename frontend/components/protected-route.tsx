"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ReactNode, useEffect } from "react"

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: USER_ROLE | USER_ROLE[]
}

/**
 * Client-side route protection wrapper.
 * Checks authentication and optionally role-based access.
 *
 * @param children - Components to render if user is authenticated
 * @param requiredRole - Optional single role or array of allowed roles
 *
 * @example
 * ```tsx
 * <ProtectedRoute requiredRole="DONOR">
 *   <Dashboard />
 * </ProtectedRoute>
 *
 * // Or require multiple roles
 * <ProtectedRoute requiredRole={["ADMIN", "DONOR"]}>
 *   <Page />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === "unauthenticated") {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    // Check role-based access if required role is specified
    if (status === "authenticated" && requiredRole) {
      const userRole = (session?.user as any)?.role
      const allowedRoles = Array.isArray(requiredRole)
        ? requiredRole
        : [requiredRole]

      if (!allowedRoles.includes(userRole)) {
        console.error(
          `[ProtectedRoute] User role ${userRole} not allowed. Required: ${allowedRoles.join(", ")}`
        )
        router.push("/unauthorized")
        return
      }
    }
  }, [status, session, requiredRole, router])

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render children if not authenticated
  if (status === "unauthenticated") {
    return null
  }

  // Render children if authenticated (and role check passed if required)
  return <>{children}</>
}
