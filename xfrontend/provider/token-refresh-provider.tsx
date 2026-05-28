"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { setCachedToken } from "@/actions/api";
import { refreshToken as apiRefreshToken } from "@/actions/auth";

/**
 * Wraps protected routes and proactively refreshes the access token
 * before it expires so the user never experiences a mid-operation logout.
 */

export default function TokenRefreshProvider({ children }: { children: React.ReactNode }) {
  const { data: session, update } = useSession();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRefreshingRef = useRef(false);

  // Keep cached token in sync with session
  useEffect(() => {
    if (session?.accessToken) {
      setCachedToken(session.accessToken);
    }
  }, [session?.accessToken]);

  // Proactive refresh check every 1 minute
  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      if (!session?.refreshToken || !session?.expiresAt || isRefreshingRef.current) {
        return;
      }

      const now = Date.now();
      const timeUntilExpiry = session.expiresAt - now;
      const tenMinutesInMs = 10 * 60 * 1000;

      // If token is expiring within 10 minutes, proactively refresh it
      if (timeUntilExpiry < tenMinutesInMs) {
        console.log(`[TokenRefreshProvider] Token expiring in ${Math.round(timeUntilExpiry / 1000)}s, refreshing...`);
        isRefreshingRef.current = true;
        try {
          const refreshed = await apiRefreshToken(session.refreshToken);
          if (refreshed && refreshed.access_token) {
            console.log("[TokenRefreshProvider] Refresh successful, updating session...");
            await update({
              accessToken: refreshed.access_token,
              refreshToken: refreshed.refresh_token,
              expiresAt: Date.now() + refreshed.expires_in * 1000,
            });
            console.log("[TokenRefreshProvider] Session updated successfully");
          } else {
            console.warn("[TokenRefreshProvider] Refresh returned empty token");
          }
        } catch (error) {
          console.error("[TokenRefreshProvider] Failed to proactively refresh token:", error);
        } finally {
          isRefreshingRef.current = false;
        }
      }
    }, 60 * 1000); // Check every minute

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [session, update]);

  return <>{children}</>;
}
