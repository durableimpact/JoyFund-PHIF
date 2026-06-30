"use client";

import { useEffect, useRef, useCallback } from "react";
import { signOut, useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { refreshToken as apiRefreshToken } from "@/actions/auth";

/**
 * Wraps protected routes and proactively refreshes the access token
 * before it expires so the user never experiences a mid-operation logout.
 */

export default function TokenRefreshProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, update } = useSession();
  const queryClient = useQueryClient();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRefreshingRef = useRef(false);
  const hasLoggedOutRef = useRef(false);

  // Use refs so the interval callback always reads fresh values
  // without depending on closure re-creation
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const doRefresh = useCallback(async () => {
    if (isRefreshingRef.current || hasLoggedOutRef.current) return;

    const currentSession = sessionRef.current;
    if (!currentSession || (currentSession as any).error) return;

    const refreshToken = currentSession.refreshToken;
    const expiresAt = currentSession.expiresAt;
    if (!refreshToken || !expiresAt) return;

    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;
    const tenMinutesInMs = 10 * 60 * 1000;

    if (timeUntilExpiry >= tenMinutesInMs) return;

    console.log(
      `[TokenRefreshProvider] Token expiring in ${Math.round(timeUntilExpiry / 1000)}s, refreshing...`,
    );

    isRefreshingRef.current = true;
    try {
      const refreshed = await apiRefreshToken(refreshToken);
      if (refreshed && refreshed.access_token) {
        console.log(
          "[TokenRefreshProvider] Refresh successful, updating session...",
        );
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
      console.error(
        "[TokenRefreshProvider] Failed to proactively refresh token:",
        error,
      );

      // Signal the error to the rest of the app so useAuthError / proxy can
      // redirect the user to login instead of leaving them stranded.
      // Public pages (e.g. campaign views) stay accessible — only redirect
      // from protected routes.
      try {
        await update({ error: "RefreshAccessTokenError" } as any);
      } catch {
        // If even the update fails, clear everything and force sign-out
        try {
          queryClient.clear();
        } catch {}
        hasLoggedOutRef.current = true;
        await signOut({ redirect: false });
        const isProtected = ["/dashboard", "/profile", "/settings"].some(
          (p) => window.location.pathname.startsWith(p),
        );
        if (isProtected) {
          window.location.href = "/login?reason=session_expired";
        }
      }
    } finally {
      isRefreshingRef.current = false;
    }
  }, [update, queryClient]);

  useEffect(() => {
    // Reset state when session becomes invalid
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

    // Run immediately on mount / session change to catch tokens
    // that are already close to expiry
    doRefresh();

    const refreshInterval = setInterval(doRefresh, 60 * 1000);
    intervalRef.current = refreshInterval;

    return () => {
      clearInterval(refreshInterval);
      intervalRef.current = null;
    };
  }, [session?.refreshToken, session?.expiresAt, (session as any)?.error, doRefresh]);

  return <>{children}</>;
}
