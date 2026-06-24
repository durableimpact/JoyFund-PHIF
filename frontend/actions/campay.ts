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

export const getCampayBalance = async (access_token: string) => {
  try {
    const { data } = await api.get<CampayBalance>("/api/payments/campay/balance/", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const campayDisburse = async (access_token: string, payload: CampayDisbursePayload) => {
  try {
    const { data } = await api.post<CampayDisburseResponse>("/api/payments/campay/disburse/", payload, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const getCampayTransactionStatus = async (access_token: string, reference: string) => {
  try {
    const { data } = await api.get<CampayTransactionStatus>("/api/payments/campay/transaction-status/", {
      headers: { Authorization: `Bearer ${access_token}` },
      params: { reference },
    });
    return data;
  } catch (e) { handleError(e); }
};
