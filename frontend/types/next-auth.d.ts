import NextAuth, { type DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    email: string
    first_name: string
    last_name: string
    accessToken: string
    refreshToken: string
    role: USER_ROLE
    expiresAt: number
    userInfo?:
      | DonorInfo
      | SystemAdminInfo
      | SocialWorkerInfo
      | HospitalAdminInfo
      | ReceptionistInfo
  }

  interface Session extends DefaultSession {
    user: User & DefaultSession["user"]
    accessToken: string
    refreshToken: string
    role: USER_ROLE
    expiresAt: number
    error?: "RefreshAccessTokenError" | "NoRefreshToken"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    accessToken: string
    refreshToken: string
    role: USER_ROLE
    expiresAt: number
    error?: "RefreshAccessTokenError" | "NoRefreshToken"
    userInfo?:
      | DonorInfo
      | SystemAdminInfo
      | SocialWorkerInfo
      | HospitalAdminInfo
      | ReceptionistInfo
  }
}
