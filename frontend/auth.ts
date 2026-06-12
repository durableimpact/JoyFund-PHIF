import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

async function fetchFromAPI<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const baseUrl =
    process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000";
  const url = `${baseUrl}${endpoint}`;

  console.log(`[fetchFromAPI] Making request to: ${url}`);

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  console.log(`[fetchFromAPI] Response status: ${response.status}`);

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
  console.log("[auth] Refreshing access token");

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
    let errorData: any;
    try {
      errorData = await response.json();
      console.error("[auth] Refresh error response:", errorData);
    } catch {
      const text = await response.text();
      console.error("[auth] Refresh error (text):", text);
      errorData = { error: text || `HTTP ${response.status}` };
    }
    throw new Error(JSON.stringify(errorData));
  }

  const data = (await response.json()) as AuthResponse;
  console.log("[auth] Token refreshed successfully");
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
        console.log("[auth] authorize called with credentials:", {
          email: (credentials as any)?.email,
          password: (credentials as any)?.password ? "***" : undefined,
          credentialsKeys: Object.keys(credentials || {}),
        });

        if (!credentials?.email || !credentials?.password) {
          console.error("[auth] Missing email or password in credentials");
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

          console.log("[auth] Login successful for:", credentials.email);

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
            expiresAt: Date.now() + response.expires_in * 1000, // Convert seconds to milliseconds
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
        console.log("[auth] Handling session update from client", session);
        if (session.accessToken) token.accessToken = session.accessToken;
        if (session.refreshToken) token.refreshToken = session.refreshToken;
        if (session.expiresAt) token.expiresAt = session.expiresAt;
        if (session.role) token.role = session.role;
        if (session.userInfo) token.userInfo = session.userInfo;
        return token;
      }

      // Initial login
      if (user) {
        console.log("[auth] JWT: Initial login for user:", (user as any).email);
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.role = (user as any).role;
        token.userInfo = (user as any).userInfo;
        token.expiresAt = (user as any).expiresAt;
        console.log(
          "[auth] JWT: Token set to expire at:",
          new Date(token.expiresAt as number),
        );
        return token;
      }

      // Check if token needs refresh
      const now = Date.now();
      const expiresAt = (token.expiresAt as number) || 0;
      const timeUntilExpiry = expiresAt - now;
      const bufferTimeMs = 5 * 60 * 1000; // Refresh 5 minutes before expiry (more aggressive)

      console.log(
        `[auth] JWT check - Now: ${new Date(now).toISOString()}, Expires: ${new Date(expiresAt).toISOString()}, TTL: ${Math.round(timeUntilExpiry / 1000)}s`,
      );

      // If token is already expired or expiring within 5 minutes, refresh it
      if (timeUntilExpiry < bufferTimeMs) {
        console.log(
          `[auth] JWT: Token expiring in ${Math.round(timeUntilExpiry / 1000)}s, attempting refresh...`,
        );

        if (!token.refreshToken) {
          console.error(
            "[auth] JWT: No refresh token available, cannot refresh",
          );
          return { ...token, error: "NoRefreshToken" };
        }

        try {
          const refreshedResponse = await refreshAccessToken(
            token.refreshToken as string,
          );

          const newExpiresAt = now + refreshedResponse.expires_in * 1000;
          console.log(
            `[auth] JWT: Refresh successful. New expiry: ${new Date(newExpiresAt).toISOString()}`,
          );

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
