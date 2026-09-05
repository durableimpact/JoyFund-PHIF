import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

async function fetchFromAPI<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const baseUrl =
    process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000";
  const url = `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
      console.error(`[fetchFromAPI] Error response:`, errorData);
    } catch {
      const text = await response.text();
      console.error(`[fetchFromAPI] Error (text):`, text);
      errorData = { error: text || `HTTP ${response.status}` };
    }
    throw new Error(JSON.stringify(errorData));
  }

  return response.json();
}

// Refresh token helper function
async function refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
  // Call server-side refresh endpoint instead of exposing secrets to client
  const response = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refreshToken,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: `HTTP ${response.status}`,
    }));
    throw new Error(JSON.stringify(errorData));
  }

  const data = (await response.json()) as AuthResponse;
  return data;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "johndoe@gmail.com",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Forward the browser's User-Agent so Django records the real device
          const headers: Record<string, string> = {};
          const userAgent = (credentials as any)?.userAgent;
          if (userAgent) {
            headers["X-Device-User-Agent"] = userAgent;
          }

          // Login via Django API
          const response = await fetchFromAPI<AuthResponse>("/auth/token/", {
            method: "POST",
            headers,
            body: JSON.stringify({
              grant_type: "password",
              username: credentials.email as string,
              password: credentials.password as string,
              client_id: process.env.NEXT_PUBLIC_DJANGO_OAUTH_CLIENT_ID || "",
              client_secret:
                process.env.NEXT_PUBLIC_DJANGO_OAUTH_CLIENT_SECRET || "",
            }),
          });

          // Fetch user info based on role
          let userInfo:
            | DonorInfo
            | SystemAdminInfo
            | SocialWorkerInfo
            | HospitalAdminInfo
            | ReceptionistInfo
            | null = null;

          try {
            switch (response.role) {
              case "DONOR":
                userInfo = await fetchFromAPI<DonorInfo>(
                  "/api/accounts/donor/info/",
                  {
                    method: "GET",
                    headers: {
                      Authorization: `Bearer ${response.access_token}`,
                    },
                  },
                );
                break;
              case "SYSTEM_ADMIN":
                userInfo = await fetchFromAPI<SystemAdminInfo>(
                  "/api/accounts/system-admin/info/",
                  {
                    method: "GET",
                    headers: {
                      Authorization: `Bearer ${response.access_token}`,
                    },
                  },
                );
                break;
              case "SOCIAL_WORKER":
                userInfo = await fetchFromAPI<SocialWorkerInfo>(
                  "/api/accounts/social-worker/info/",
                  {
                    method: "GET",
                    headers: {
                      Authorization: `Bearer ${response.access_token}`,
                    },
                  },
                );
                break;
              case "HOSPITAL_ADMIN":
                userInfo = await fetchFromAPI<HospitalAdminInfo>(
                  "/api/accounts/hospital-admin/info/",
                  {
                    method: "GET",
                    headers: {
                      Authorization: `Bearer ${response.access_token}`,
                    },
                  },
                );
                break;
              case "RECEPTIONIST":
                userInfo = await fetchFromAPI<ReceptionistInfo>(
                  "/api/accounts/receptionist/info/",
                  {
                    method: "GET",
                    headers: {
                      Authorization: `Bearer ${response.access_token}`,
                    },
                  },
                );
                break;
            }
          } catch (error) {
            console.error("[auth] Failed to fetch user info:", error);
          }

          return {
            id: userInfo?.id as string,
            email: credentials.email as string,
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            role: response.role as USER_ROLE,
            userInfo,
            expiresAt:
              Date.now() +
              (response.expires_in ?? 3600) * 1000, // Convert seconds to milliseconds
          };
        } catch (error) {
          console.error("[auth] Login failed:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Handle client-side session update
      if (trigger === "update" && session) {
        if (session.accessToken) token.accessToken = session.accessToken;
        if (session.refreshToken) token.refreshToken = session.refreshToken;
        if (session.expiresAt) token.expiresAt = session.expiresAt;
        if (session.role) token.role = session.role;
        if (session.id) token.id = session.id;
        if (session.userInfo) token.userInfo = session.userInfo;
      }

      // Re-fetch userInfo when session is updated (e.g. after profile edit)
      if (trigger === "update" && token.accessToken && token.role) {
        try {
          const INFO_ENDPOINTS: Record<string, string> = {
            DONOR: "/api/accounts/donor/info/",
            SYSTEM_ADMIN: "/api/accounts/system-admin/info/",
            HOSPITAL_ADMIN: "/api/accounts/hospital-admin/info/",
            RECEPTIONIST: "/api/accounts/receptionist/info/",
            SOCIAL_WORKER: "/api/accounts/social-worker/info/",
          };
          const endpoint = INFO_ENDPOINTS[token.role as string];
          if (endpoint) {
            const freshUserInfo = await fetchFromAPI<any>(endpoint, {
              method: "GET",
              headers: { Authorization: `Bearer ${token.accessToken}` },
            });
            if (freshUserInfo) {
              token.userInfo = freshUserInfo;
            }
          }
        } catch (err) {
          console.error("[auth] Failed to re-fetch userInfo:", err);
        }
        return token;
      }

      // Initial login
      if (user) {
        token.id = (user as any).id;
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.role = (user as any).role;
        token.userInfo = (user as any).userInfo;
        token.expiresAt = (user as any).expiresAt;
        return token;
      }

      // Early bailout: if refresh already failed but token hasn't expired yet,
      // don't keep retrying — keep the current accessToken until it's truly expired
      if (
        token.error === "RefreshAccessTokenError" ||
        token.error === "NoRefreshToken"
      ) {
        const expiresAt = (token.expiresAt as number) || 0;
        if (Date.now() < expiresAt) {
          // Token still valid — transient failure, clear error and continue
          delete token.error;
          return token;
        }
        // Token genuinely expired, keep the error so proxy redirects to login
        return token;
      }

      // Check if token needs refresh
      const now = Date.now();
      const expiresAt = (token.expiresAt as number) || 0;
      const timeUntilExpiry = expiresAt - now;
      const bufferTimeMs = 5 * 60 * 1000; // Refresh 5 minutes before expiry (more aggressive)

      // If token is already expired or expiring within 5 minutes, refresh it
      if (timeUntilExpiry < bufferTimeMs) {
        if (!token.refreshToken) {
          return { ...token, error: "NoRefreshToken" };
        }

        try {
          const refreshedResponse = await refreshAccessToken(
            token.refreshToken as string,
          );

          const newExpiresAt =
            now + (refreshedResponse.expires_in ?? 3600) * 1000;

          return {
            ...token,
            accessToken: refreshedResponse.access_token,
            refreshToken: refreshedResponse.refresh_token || token.refreshToken,
            expiresAt: newExpiresAt,
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          console.error(`[auth] JWT: Token refresh failed: ${errorMessage}`);
          // Mark session as needing re-authentication
          return { ...token, error: "RefreshAccessTokenError" };
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id as string,
        accessToken: token.accessToken as string,
        refreshToken: token.refreshToken as string,
        role: token.role as USER_ROLE,
        userInfo: token.userInfo,
        expiresAt: token.expiresAt as number,
      };
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.role = token.role as USER_ROLE;
      session.expiresAt = token.expiresAt as number;

      if (token.error) {
        (session as any).error = token.error;
      }
      return session;
    },
  },
});
