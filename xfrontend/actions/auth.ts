"use client";

import api from "./api";
import { AxiosError } from "axios";

function handleError(e: unknown) {
  const err = e as AxiosError;
  if (err.response?.data) throw JSON.stringify(err.response.data);
  throw JSON.stringify({ message: "An unexpected error occurred" });
}

// ── Token Authentication (OAuth2 password / refresh flow) ──

export const login = async (data: {username:string,password:string}) => {
  try {
    const response = await api.post<AuthResponse>("/auth/token/", {
        username: data.username,
        password: data.password,
        grant_type: "password",
        client_id: process.env.NEXT_PUBLIC_DJANGO_OAUTH_CLIENT_ID,
        client_secret: process.env.NEXT_PUBLIC_DJANGO_OAUTH_CLIENT_SECRET,
    });
    return response.data;
  } catch (e) { handleError(e); }
};

export const refreshToken = async (refresh_token: string) => {
  try {
    const response = await api.post<AuthResponse>("/auth/token/", {
      grant_type: "refresh_token",
      refresh_token,
      client_id: process.env.NEXT_PUBLIC_DJANGO_OAUTH_CLIENT_ID,
      client_secret: process.env.NEXT_PUBLIC_DJANGO_OAUTH_CLIENT_SECRET,
    });
    return response.data;
  } catch (e) { handleError(e); }
};

// ── OAuth2 Proxy (social auth / convert token) ──

export const convertToken = async (data: {
  grant_type: string;
  backend: string;
  token: string;
  client_id: string;
  client_secret: string;
}) => {
  try {
    const { data: result } = await api.post<AuthResponse>("/auth/convert-token/", data);
    return result;
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
