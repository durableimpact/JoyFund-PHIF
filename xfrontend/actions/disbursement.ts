"use client";

import api from "./api";
import { AxiosError } from "axios";

function handleError(e: unknown) {
  const err = e as AxiosError;
  if (err.response?.data) throw JSON.stringify(err.response.data);
  throw JSON.stringify({ message: "An unexpected error occurred" });
}

// ── Disbursements CRUD ──

export const listDisbursements = async (access_token: string, params?: Record<string, string>) => {
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
    const { data } = await api.get<Disbursement>(`/api/payments/disbursements/${id}/`, {
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

export const getDisbursementsByHospital = async (access_token: string) => {
  try {
    const { data } = await api.get(
      "/api/payments/disbursements/by_hospital/",
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
