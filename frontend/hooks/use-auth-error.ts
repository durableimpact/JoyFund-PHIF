/**
 * Hook to handle authentication errors
 *
 * Checks for session errors (like refresh token failure) and logs out the user
 * Only redirects on protected routes — public pages (e.g. campaign views)
 * should remain accessible even with an expired session.
 */

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

const protectedPrefixes = ["/dashboard", "/profile", "/settings"];

export function useAuthError() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== "loading" && session) {
      const error = (session as any).error;
      const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));
      if (!isProtected) return;

      if (error === "RefreshAccessTokenError") {
        console.error("[useAuthError] Refresh token failed, logging out");

        signOut({ redirect: false }).then(() => {
          router.push("/login?reason=session_expired");
        });
      } else if (error === "NoRefreshToken") {
        console.error("[useAuthError] No refresh token available, logging out");

        signOut({ redirect: false }).then(() => {
          router.push("/login?reason=unauthorized");
        });
      }
    }
  }, [session, status, router, pathname]);
}
