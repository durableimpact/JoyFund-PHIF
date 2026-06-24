"use client";

import api from "./api";
import { AxiosError } from "axios";

function handleError(e: unknown): never {
  const err = e as AxiosError;
  const data = err.response?.data;
  if (data) {
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    const msg = parsed.detail || parsed.error || parsed.message || Object.values(parsed).flat().join(", ") || "An unexpected error occurred";
    throw new Error(msg);
  }
  throw new Error("An unexpected error occurred");
}

export const listNotifications = async (access_token: string, params?: Record<string, string>) => {
  try {
    const { data } = await api.get<PaginationResponse<Notification>>("/api/notifications/", {
      headers: { Authorization: `Bearer ${access_token}` },
      params,
    });
    return data;
  } catch (e) { handleError(e); }
};

export const getNotification = async (id: string, access_token: string) => {
  try {
    const { data } = await api.get<Notification>(`/api/notifications/${id}/`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const getNotificationsByType = async (access_token: string) => {
  try {
    const { data } = await api.get("/api/notifications/by_type/", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const getUnreadNotificationCount = async (access_token: string) => {
  try {
    const { data } = await api.get<UnreadCountResponse>("/api/notifications/unread_count/", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const markNotificationAsRead = async (id: string, access_token: string) => {
  try {
    const { data } = await api.post(`/api/notifications/${id}/mark_as_read/`, {}, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const markNotificationAsUnread = async (id: string, access_token: string) => {
  try {
    const { data } = await api.post(`/api/notifications/${id}/mark_as_unread/`, {}, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const markAllNotificationsAsRead = async (access_token: string) => {
  try {
    const { data } = await api.post("/api/notifications/mark_all_as_read/", {}, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const deleteNotification = async (id: string, access_token: string) => {
  try {
    const { data } = await api.delete(`/api/notifications/${id}/delete_notification/`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const sendTestPush = async (
  access_token: string,
  payload: TestPushPayload,
) => {
  try {
    const { data } = await api.post<TestPushResponse>(
      "/api/notifications/push/test-send/",
      payload,
      { headers: { Authorization: `Bearer ${access_token}` } },
    );
    return data;
  } catch (e) { handleError(e); }
};
