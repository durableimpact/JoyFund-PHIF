/**
 * Server-side token refresh endpoint
 * 
 * This endpoint handles token refresh with credentials safely stored server-side.
 * Never expose client_secret to the client.
 * 
 * IMPORTANT: This must be called from NextAuth callbacks, NOT from client-side code.
 */

import { NextRequest, NextResponse } from "next/server"

async function fetchFromAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000"
  const url = `${baseUrl}${endpoint}`

  console.log(`[refresh-route] Making request to: ${url}`)

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  console.log(`[refresh-route] Response status: ${response.status}`)

  if (!response.ok) {
    let errorData: any
    try {
      errorData = await response.json()
      console.error(`[refresh-route] Error response:`, errorData)
    } catch {
      const text = await response.text()
      console.error(`[refresh-route] Error (text):`, text)
      errorData = { error: text || `HTTP ${response.status}` }
    }
    throw new Error(JSON.stringify(errorData))
  }

  return response.json()
}

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json()

    if (!refreshToken) {
      return NextResponse.json(
        { error: "refresh_token is required" },
        { status: 400 }
      )
    }

    console.log("[refresh-route] Attempting to refresh token")

    // Use server-side environment variables for credentials
    const response = await fetchFromAPI<AuthResponse>("/auth/token/", {
      method: "POST",
      body: JSON.stringify({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.DJANGO_OAUTH_CLIENT_ID || "",
        client_secret: process.env.DJANGO_OAUTH_CLIENT_SECRET || "",
      }),
    })

    console.log("[refresh-route] Token refreshed successfully")

    return NextResponse.json(response)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("[refresh-route] Refresh failed:", errorMessage)
    return NextResponse.json(
      { error: errorMessage },
      { status: 401 }
    )
  }
}
