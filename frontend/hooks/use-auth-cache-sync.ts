"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";

export function useAuthCacheSync() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const previousAuthStateRef = useRef<{
    status: typeof status;
    sessionKey: string | null;
  } | null>(null);

  const sessionKey =
    status === "authenticated"
      ? `${session?.user?.id ?? "unknown"}:${session?.role ?? session?.user?.role ?? "unknown"}`
      : null;

  useEffect(() => {
    const previousAuthState = previousAuthStateRef.current;

    if (previousAuthState) {
      const becameAuthenticated =
        previousAuthState.status !== "authenticated" &&
        status === "authenticated";
      const becameUnauthenticated =
        previousAuthState.status === "authenticated" &&
        status === "unauthenticated";
      const switchedAuthenticatedUser =
        previousAuthState.status === "authenticated" &&
        status === "authenticated" &&
        previousAuthState.sessionKey !== sessionKey;

      if (
        becameAuthenticated ||
        becameUnauthenticated ||
        switchedAuthenticatedUser
      ) {
        queryClient.clear();
      }
    }

    previousAuthStateRef.current = { status, sessionKey };
  }, [queryClient, sessionKey, status]);
}
