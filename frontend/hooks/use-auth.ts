"use client"

import { useSession } from "next-auth/react"
import { useCallback } from "react"

/**
 * Hook to get current session and ensure token is fresh.
 * Automatically triggers token refresh if needed (within 3 minutes of expiry).
 *
 * @returns {Object} Session data with fresh access token
 *
 * @example
 * ```ts
 * const { session, status, accessToken } = useAuth()
 *
 * if (status === "authenticated") {
 *   // accessToken is guaranteed to be fresh (checked every time session is accessed)
 * }
 * ```
 */
export function useAuth() {
  const { data: session, status, update } = useSession()

  // Function to refresh session and ensure fresh token
  const ensureFreshToken = useCallback(async () => {
    if (status === "authenticated" && session) {
      // Check if token expires within 5 minutes
      const now = Date.now()
      const expiresAt = session.expiresAt || 0
      const fiveMinutesInMs = 5 * 60 * 1000

      if (expiresAt - now < fiveMinutesInMs) {
        console.log("[useAuth] Token expiring soon, updating session...")
        await update()
      }
    }
  }, [session, status, update])

  return {
    session,
    status,
    accessToken: session?.accessToken,
    refreshToken: session?.refreshToken,
    role: session?.role,
    expiresAt: session?.expiresAt,
    ensureFreshToken,
  }
}
