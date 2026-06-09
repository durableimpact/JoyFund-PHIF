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



export default api;
