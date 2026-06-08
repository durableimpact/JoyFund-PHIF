"use client";
import axios from "axios";

const config = {
  apiUrl: process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000",
};

const api = axios.create({
  baseURL: config.apiUrl,
});

// Request/response logging. Enabled in dev or when `ENABLE_SERVER_LOGS=true`.
const shouldLog = process.env.NODE_ENV !== "production" || process.env.ENABLE_SERVER_LOGS === "true";
if (shouldLog) {
  api.interceptors.request.use((cfg) => {
    try {
      (cfg as any).__startTime = Date.now();
      const method = (cfg.method || "GET").toString().toUpperCase();
      console.info(`[api] → ${method} ${cfg.baseURL}${cfg.url}`);
    } catch {}
    return cfg;
  });

  api.interceptors.response.use(
    (res) => {
      try {
        const start = (res.config as any).__startTime;
        const dur = start ? `${Date.now() - start}ms` : "";
        const method = (res.config.method || "GET").toString().toUpperCase();
        console.info(`[api] ← ${res.status} ${method} ${res.config.baseURL}${res.config.url} ${dur}`);
      } catch {}
      return res;
    },
    (error) => {
      try {
        const cfg = error.config || {};
        const start = (cfg as any).__startTime;
        const dur = start ? `${Date.now() - start}ms` : "";
        const method = (cfg.method || "").toString().toUpperCase();
        console.error(`[api:error] ${error.response?.status ?? "ERR"} ${method} ${cfg.url} ${dur}`, error);
      } catch (e) {
        console.error("[api:error]", error);
      }

      return Promise.reject(error);
    }
  );
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

// Cached token — populated from session, replaced on refresh.
let cachedToken: string | null = null;

export function getCachedToken(): string | null {
  return cachedToken;
}

export function setCachedToken(token: string | null) {
  cachedToken = token;
}

// ── Response interceptor ──
// On 401, re-fetch the session so NextAuth's JWT callback refreshes the
// token server-side. Then retry the original request with the new token.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { getSession } = await import("next-auth/react");

      // getSession() hits /api/auth/session → JWT callback runs → auth.ts
      // refreshes the stored access token using the refresh token.
      const session = await getSession();

      if (!session?.accessToken) {
        throw new Error("Session refresh returned no token");
      }

      cachedToken = session.accessToken;

      processQueue(null, cachedToken);
      originalRequest.headers.Authorization = `Bearer ${cachedToken}`;

      return api(originalRequest);
    } catch {
      processQueue("Session refresh failed", null);
      cachedToken = null;

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }

      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
