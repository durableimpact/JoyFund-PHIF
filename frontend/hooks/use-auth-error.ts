/**
 * Hook to handle authentication errors
 *
 * Checks for session errors (like refresh token failure) and logs out the user
 * This is an additional safety measure alongside middleware
 */

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function useAuthError() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Only check when session is loaded
    if (status !== "loading" && session) {
      const error = (session as any).error;

      if (error === "RefreshAccessTokenError") {
        console.error("[useAuthError] Refresh token failed, logging out");

        // Sign out the user
        signOut({ redirect: false }).then(() => {
          // Redirect to login with reason
          router.push("/login?reason=session_expired");
        });
      } else if (error === "NoRefreshToken") {
        console.error("[useAuthError] No refresh token available, logging out");

        signOut({ redirect: false }).then(() => {
          router.push("/login?reason=unauthorized");
        });
      }
    }
  }, [session, status, router]);
}
