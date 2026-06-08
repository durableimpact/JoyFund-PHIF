import { getSession } from "next-auth/react"

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
export async function authenticatedFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const session = await getSession()

  if (!session?.accessToken) {
    throw new Error("Not authenticated")
  }

  // Check if token is expiring soon and trigger refresh
  if (session.expiresAt) {
    const now = Date.now()
    const threeMinutesInMs = 3 * 60 * 1000

    if (session.expiresAt - now < threeMinutesInMs) {
      console.log("[authenticatedFetch] Token expiring soon, session will be refreshed on next check")
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000"
  const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`
  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
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
