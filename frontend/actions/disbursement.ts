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

// ── Disbursements CRUD ──

export const listDisbursements = async (access_token: string, params?: Partial<{ hospital: string, payment_method: DisbursementPaymentMethod | null, status: DisbursementStatus | null }>) => {
  try {
    const { data } = await api.get<PaginationResponse<Disbursement>>("/api/payments/disbursements/", {
      headers: { Authorization: `Bearer ${access_token}` },
      params,
    });
    return data;
  } catch (e) { handleError(e); }
};

export const getDisbursement = async (id: string, access_token: string) => {
  try {
    const { data } = await api.get<DisbursementDetail>(`/api/payments/disbursements/${id}/`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const createDisbursement = async (access_token: string, data: DisbursementCreatePayload) => {
  try {
    const { data: disbursement } = await api.post<Disbursement>("/api/payments/disbursements/", data, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return disbursement;
  } catch (e) { handleError(e); }
};

export const updateDisbursement = async (id: string, access_token: string, data: DisbursementUpdatePayload) => {
  try {
    const { data: disbursement } = await api.patch<Disbursement>(`/api/payments/disbursements/${id}/`, data, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return disbursement;
  } catch (e) { handleError(e); }
};

export const deleteDisbursement = async (id: string, access_token: string) => {
  try {
    const { data } = await api.delete(`/api/payments/disbursements/${id}/`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const markDisbursementCompleted = async (id: string, access_token: string) => {
  try {
    const { data } = await api.post<Disbursement>(
      `/api/payments/disbursements/${id}/mark_completed/`,
      {},
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    return data;
  } catch (e) { handleError(e); }
};

export const markDisbursementFailed = async (id: string, access_token: string) => {
  try {
    const { data } = await api.post<Disbursement>(
      `/api/payments/disbursements/${id}/mark_failed/`,
      {},
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    return data;
  } catch (e) { handleError(e); }
};

export const getDisbursementStatistics = async (access_token: string) => {
  try {
    const { data } = await api.get<DisbursementStatistics>(
      "/api/payments/disbursements/statistics/",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    return data;
  } catch (e) { handleError(e); }
};
