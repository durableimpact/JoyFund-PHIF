"use client";

import { useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { refreshToken as apiRefreshToken } from "@/actions/auth";

/**
 * Wraps protected routes and proactively refreshes the access token
 * before it expires so the user never experiences a mid-operation logout.
 */

export default function TokenRefreshProvider({ children }: { children: React.ReactNode }) {
  const { data: session, update } = useSession();
  const queryClient = useQueryClient();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRefreshingRef = useRef(false);
  const hasLoggedOutRef = useRef(false);

  useEffect(() => {
    if (!session || (session as any).error) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (!session.refreshToken || !session.expiresAt) {
      return;
    }

    const refreshInterval = setInterval(async () => {
      if (isRefreshingRef.current || hasLoggedOutRef.current) {
        return;
      }

      const now = Date.now();
      const timeUntilExpiry = session.expiresAt - now;
      const tenMinutesInMs = 10 * 60 * 1000;

      if (timeUntilExpiry < tenMinutesInMs) {
        console.log(
          `[TokenRefreshProvider] Token expiring in ${Math.round(timeUntilExpiry / 1000)}s, refreshing...`
        );
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
          try {
            queryClient.clear();
          } catch (clearError) {
            console.error("[TokenRefreshProvider] Failed to clear React Query cache:", clearError);
          }
          hasLoggedOutRef.current = true;
          await signOut({ redirect: true, callbackUrl: "/login" });
        } finally {
          isRefreshingRef.current = false;
        }
      }
    }, 60 * 1000);

    intervalRef.current = refreshInterval;

    return () => {
      clearInterval(refreshInterval);
      intervalRef.current = null;
    };
  }, [session?.refreshToken, session?.expiresAt, (session as any)?.error, queryClient, update]);

  return <>{children}</>;
}
