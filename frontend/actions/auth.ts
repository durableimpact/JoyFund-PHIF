"use client";

import api from "./api";
import { AxiosError } from "axios";

function handleError(e: unknown) {
  const err = e as AxiosError;
  if (err.response?.data) throw JSON.stringify(err.response.data);
  throw JSON.stringify({ message: "An unexpected error occurred" });
}

// ── Token Authentication (OAuth2 password / refresh flow) ──

/**
 * @deprecated Login is now handled by NextAuth in auth.ts
 * Use signIn() from next-auth/react instead
 */
export const login = async (data: {username:string,password:string}) => {
  throw new Error(
    "Direct login API call is deprecated. Use signIn() from next-auth/react instead."
  );
};

/**
 * Refresh token via server-side endpoint.
 * The server-side endpoint has access to client credentials securely.
 * @param refresh_token The refresh token
 * @returns New access token
 */
export const refreshToken = async (refresh_token: string) => {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: refresh_token }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    return await response.json();
  } catch (e) { handleError(e); }
};

export const revokeToken = async (data: { token: string; client_id: string; client_secret: string }) => {
  try {
    const { data: result } = await api.post("/auth/revoke-token/", data);
    return result;
  } catch (e) { handleError(e); }
};

export const invalidateRefreshTokens = async (access_token: string) => {
  try {
    const { data } = await api.post("/auth/invalidate-refresh-tokens/", {}, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const invalidateSessions = async (access_token: string) => {
  try {
    const { data } = await api.post("/auth/invalidate-sessions/", {}, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};
