"use client";

import api from "./api";
import { AxiosError } from "axios";

function handleError(e: unknown) {
  const err = e as AxiosError;
  if (err.response?.data) throw JSON.stringify(err.response.data);
  throw JSON.stringify({ message: "An unexpected error occurred" });
}

function unwrap(data: any) {
  return Array.isArray(data) ? data : (data?.results || []);
}

// ── Activity Logs ──

export const listActivityLogs = async (access_token: string, params?: Record<string, string>) => {
  try {
    const { data } = await api.get("/api/logs/activity/", {
      headers: { Authorization: `Bearer ${access_token}` },
      params,
    });
    return unwrap(data);
  } catch (e) { handleError(e); }
};

export const getActivityLog = async (id: string, access_token: string) => {
  try {
    const { data } = await api.get<ActivityLog>(`/api/logs/activity/${id}/`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

// ── Error Logs ──

export const listErrorLogs = async (access_token: string, params?: Record<string, string>) => {
  try {
    const { data } = await api.get("/api/logs/errors/", {
      headers: { Authorization: `Bearer ${access_token}` },
      params,
    });
    return unwrap(data);
  } catch (e) { handleError(e); }
};

export const getErrorLog = async (id: string, access_token: string) => {
  try {
    const { data } = await api.get<ErrorLog>(`/api/logs/errors/${id}/`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

// ── Request Logs ──

export const listRequestLogs = async (access_token: string, params?: Record<string, string>) => {
  try {
    const { data } = await api.get("/api/logs/requests/", {
      headers: { Authorization: `Bearer ${access_token}` },
      params,
    });
    return unwrap(data);
  } catch (e) { handleError(e); }
};

export const getRequestLog = async (id: string, access_token: string) => {
  try {
    const { data } = await api.get<RequestLog>(`/api/logs/requests/${id}/`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

// ── Log Stats ──

export const getLogStats = async (access_token: string) => {
  try {
    const { data } = await api.get<LogStats>("/api/logs/stats/stats/", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};
