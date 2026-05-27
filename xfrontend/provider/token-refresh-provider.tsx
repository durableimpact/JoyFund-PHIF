"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { setCachedToken } from "@/actions/api";

/**
 * Wraps protected routes and proactively refreshes the access token
 * before it expires so the user never experiences a mid-operation logout.
 *
 * Strategy:
 * 1. On mount / when session changes → cache the access token for actions
 * 2. Every 5 minutes → call update() which triggers NextAuth's JWT callback
 *    The JWT callback in auth.ts checks expiry and refreshes via Django when needed
 */

export default function TokenRefreshProvider({ children }: { children: React.ReactNode }) {
  const { data: session, update } = useSession();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep cached token in sync with session
  useEffect(() => {
    if (session?.accessToken) {
      setCachedToken(session.accessToken);
    }
  }, [session?.accessToken]);

  // Proactive refresh every 5 minutes
  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      try {
        // update() hits the NextAuth session endpoint, which runs the JWT
        // callback. The JWT callback checks expiry and calls Django /auth/token/
        // with the refresh_token to get a new access_token.
        await update();
      } catch {
        // silent — if the refresh fails the interceptor will catch the 401
      }
    }, 5 * 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [update]);

  return <>{children}</>;
}
