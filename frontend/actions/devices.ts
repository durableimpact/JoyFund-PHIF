"use client";

import { authenticatedFetch } from "@/lib/authenticated-fetch";

export interface Device {
  id: string;
  device_name: string;
  device_type: string;
  browser: string;
  os: string;
  ip_address: string;
  last_active: string;
  is_current: boolean;
  is_trusted: boolean;
  is_blocked: boolean;
  created_at: string;
}

const BASE = "/api/accounts/devices";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function getDevices(): Promise<Device[]> {
  const res = await authenticatedFetch(BASE + "/");
  return handleResponse<Device[]>(res);
}

export async function blockDevice(deviceId: string): Promise<Device> {
  const res = await authenticatedFetch(`${BASE}/${deviceId}/block/`, { method: "POST" });
  return handleResponse<Device>(res);
}

export async function unblockDevice(deviceId: string): Promise<Device> {
  const res = await authenticatedFetch(`${BASE}/${deviceId}/unblock/`, { method: "POST" });
  return handleResponse<Device>(res);
}

export async function trustDevice(deviceId: string): Promise<Device> {
  const res = await authenticatedFetch(`${BASE}/${deviceId}/trust/`, { method: "POST" });
  return handleResponse<Device>(res);
}

export async function removeDevice(deviceId: string): Promise<void> {
  const res = await authenticatedFetch(`${BASE}/${deviceId}/remove/`, { method: "DELETE" });
  return handleResponse<void>(res);
}
