import { getSession } from "next-auth/react"
import { refreshToken as apiRefreshToken } from "@/actions/auth"

/**
 * Make an authenticated API call with automatic token refresh.
 * Ensures token is fresh before making the request.
 *
 * @template T - The expected response type
 * @param url - The API endpoint (relative or absolute)
 * @param options - Fetch options
 * @returns Fetch response
 *
 * @example
 * ```ts
 * interface UserProfile {
 *   id: string
 *   name: string
 * }
 *
 * const response = await authenticatedFetch<UserProfile>('/api/user/profile')
 * const data: UserProfile = await response.json()
 * ```
 */
const REFRESH_BUFFER_MS = 3 * 60 * 1000

// Mirrors Auth.js's client `update()`: a POST to /api/auth/session runs the
// `jwt` callback with trigger="update", persisting the new token in the cookie.
async function updateSession(patch: Record<string, unknown>): Promise<void> {
  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  })
}

export async function authenticatedFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const session = await getSession()

  if (!session?.accessToken) {
    throw new Error("Not authenticated")
  }

  // Refresh the token if it's expiring soon.
  const now = Date.now()
  if (
    session.refreshToken &&
    session.expiresAt &&
    session.expiresAt - now < REFRESH_BUFFER_MS
  ) {
    try {
      const refreshed = await apiRefreshToken(session.refreshToken)
      if (refreshed?.access_token) {
        const expiresAt = Date.now() + (refreshed.expires_in || 300) * 1000
        await updateSession({
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token || session.refreshToken,
          expiresAt,
        })
        // Session storage now holds the fresh token; use it for this request.
        const freshSession = await getSession()
        const freshToken = freshSession?.accessToken || refreshed.access_token
        const freshExpiresAt = freshSession?.expiresAt || expiresAt
        return performFetch(url, options, freshToken, freshExpiresAt)
      }
    } catch (_) {
      // Refresh failed — fall through and attempt the request with the
      // existing token. A 401 will be handled by the caller/error boundary.
    }
  }

  return performFetch(url, options, session.accessToken, session.expiresAt)
}

async function performFetch(
  url: string,
  options: RequestInit,
  accessToken: string,
  _expiresAt?: number
): Promise<Response> {
  const baseUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000"
  const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`
  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  };

  // Log outgoing fetches when enabled (dev or ENABLE_SERVER_LOGS=true)
  const shouldLog = process.env.NODE_ENV !== "production" || process.env.ENABLE_SERVER_LOGS === "true";
  if (shouldLog) {
    try {
      const method = (fetchOptions.method || "GET").toString().toUpperCase();
      console.info(`[fetch] → ${method} ${fullUrl}`);
    } catch {}
  }

  const start = Date.now();
  return fetch(fullUrl, fetchOptions).then((res) => {
    if (shouldLog) {
      try {
        const dur = `${Date.now() - start}ms`;
        console.info(`[fetch] ← ${res.status} ${fullUrl} ${dur}`);
      } catch {}
    }
    return res;
  });
}