"use client";

import api from "./api";
import { AxiosError } from "axios";

function handleError(e: unknown): never {
  const err = e as AxiosError;
  if (err.response?.data) throw JSON.stringify(err.response.data);
  throw JSON.stringify({ message: "An unexpected error occurred" });
}

export async function registerPushSubscription(
  subscription: PushSubscription,
  accessToken?: string,
  userAgent?: string,
) {
  try {
    const sub = subscription.toJSON();
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    const { data } = await api.post(
      "/api/notifications/push/register/",
      {
        endpoint: sub.endpoint,
        p256dh_key: sub.keys!.p256dh,
        auth_key: sub.keys!.auth,
        user_agent: userAgent || navigator.userAgent || "",
      },
      { headers },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
}

export async function unregisterPushSubscription(
  endpoint: string,
  accessToken?: string,
) {
  try {
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    const { data } = await api.post(
      "/api/notifications/push/unregister/",
      { endpoint },
      { headers },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from(rawData.split("").map((c) => c.charCodeAt(0)));
}
