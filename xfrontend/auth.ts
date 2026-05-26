import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

async function fetchFromAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000"
  const url = `${baseUrl}${endpoint}`

  console.log(`[fetchFromAPI] Making request to: ${url}`)

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  console.log(`[fetchFromAPI] Response status: ${response.status}`)

  if (!response.ok) {
    let errorData: any
    try {
      errorData = await response.json()
      console.error(`[fetchFromAPI] Error response:`, errorData)
    } catch {
      const text = await response.text()
      console.error(`[fetchFromAPI] Error (text):`, text)
      errorData = { error: text || `HTTP ${response.status}` }
    }
    throw new Error(JSON.stringify(errorData))
  }

  return response.json()
}

// Refresh token helper function
async function refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
  console.log("[auth] Refreshing access token")

  const response = await fetchFromAPI<AuthResponse>("/auth/token/", {
    method: "POST",
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.NEXT_PUBLIC_DJANGO_OAUTH_CLIENT_ID || "",
      client_secret: process.env.NEXT_PUBLIC_DJANGO_OAUTH_CLIENT_SECRET || "",
    }),
  })

  console.log("[auth] Token refreshed successfully")
  return response
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
        })

        if (!credentials?.email || !credentials?.password) {
          console.error("[auth] Missing email or password in credentials")
          return null
        }

        try {
          // Login via Django API
          const response = await fetchFromAPI<AuthResponse>("/auth/token/", {
            method: "POST",
            body: JSON.stringify({
              grant_type: "password",
              username: credentials.email as string,
              password: credentials.password as string,
              client_id: process.env.NEXT_PUBLIC_DJANGO_OAUTH_CLIENT_ID || "",
              client_secret: process.env.NEXT_PUBLIC_DJANGO_OAUTH_CLIENT_SECRET || "",
            }),
          })

          console.log("[auth] Login successful for:", credentials.email)

          // Fetch user info based on role
          let userInfo:
            | DonorInfo
            | SystemAdminInfo
            | SocialWorkerInfo
            | HospitalAdminInfo
            | ReceptionistInfo
            | null = null

          try {
            switch (response.role) {
              case "DONOR":
                userInfo = await fetchFromAPI<DonorInfo>("/api/accounts/donor/info/", {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${response.access_token}`,
                  },
                })
                break
              case "SYSTEM_ADMIN":
                userInfo = await fetchFromAPI<SystemAdminInfo>("/api/accounts/system-admin/info/", {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${response.access_token}`,
                  },
                })
                break
              case "SOCIAL_WORKER":
                userInfo = await fetchFromAPI<SocialWorkerInfo>(
                  "/api/accounts/social-worker/info/",
                  {
                    method: "GET",
                    headers: {
                      Authorization: `Bearer ${response.access_token}`,
                    },
                  }
                )
                break
              case "HOSPITAL_ADMIN":
                userInfo = await fetchFromAPI<HospitalAdminInfo>("/api/accounts/hospital-admin/info/", {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${response.access_token}`,
                  },
                })
                break
              case "RECEPTIONIST":
                userInfo = await fetchFromAPI<ReceptionistInfo>("/api/accounts/receptionist/info/", {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${response.access_token}`,
                  },
                })
                break
            }
          } catch (error) {
            console.error("[auth] Failed to fetch user info:", error)
          }

          return {
            id: credentials.email as string,
            email: credentials.email as string,
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            role: response.role as USER_ROLE,
            userInfo,
            expiresAt: Date.now() + response.expires_in * 1000, // Convert seconds to milliseconds
          }
        } catch (error) {
          console.error("[auth] Login failed:", error)
          return null
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
    async jwt({ token, user }) {
      // Initial login
      if (user) {
        token.accessToken = (user as any).accessToken
        token.refreshToken = (user as any).refreshToken
        token.role = (user as any).role
        token.userInfo = (user as any).userInfo
        token.expiresAt = (user as any).expiresAt
        return token
      }

      // Check if token needs refresh (within 3 minutes of expiration or already expired)
      const now = Date.now()
      const expiresAt = (token.expiresAt as number) || 0
      const timeUntilExpiry = expiresAt - now
      const threeMinutesInMs = 3 * 60 * 1000

      // If token is expired or expiring within 3 minutes, refresh it
      if (timeUntilExpiry < threeMinutesInMs) {
        console.log(
          `[auth] Token expiring in ${Math.round(timeUntilExpiry / 1000)}s, refreshing...`
        )

        try {
          const refreshedResponse = await refreshAccessToken(
            token.refreshToken as string
          )

          return {
            ...token,
            accessToken: refreshedResponse.access_token,
            refreshToken: refreshedResponse.refresh_token,
            expiresAt: now + refreshedResponse.expires_in * 1000,
          }
        } catch (error) {
          console.error("[auth] Token refresh failed - invalidating session:", error)
          // If refresh fails, invalidate the session by returning null
          // This will force the user to re-authenticate
          return null
        }
      }

      return token
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        accessToken: token.accessToken as string,
        refreshToken: token.refreshToken as string,
        role: token.role as USER_ROLE,
        userInfo: token.userInfo,
        expiresAt: token.expiresAt as number,
      }
      session.accessToken = token.accessToken as string
      session.refreshToken = token.refreshToken as string
      session.role = token.role as USER_ROLE
      session.expiresAt = token.expiresAt as number
      return session
    },
  },
})