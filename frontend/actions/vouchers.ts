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

export const listVouchers = async (token: string, params?: Record<string, string>) => {
  try {
    const { data } = await api.get<PaginationResponse<VoucherList>>("/api/vouchers/", {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return data;
  } catch (e) { handleError(e); }
};

export const getVoucher = async (id: string, token: string) => {
  try {
    const { data } = await api.get<Voucher>(`/api/vouchers/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const createVoucher = async (token: string, payload: VoucherCreatePayload) => {
  try {
    const { data } = await api.post<Voucher>("/api/vouchers/create/", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const createVouchersFromCampaigns = async (token: string, payload: VoucherCreateFromCampaignsPayload) => {
  try {
    const { data } = await api.post<Voucher>("/api/vouchers/create-from-campaigns/", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const checkVoucher = async (token: string, code: string) => {
  try {
    const { data } = await api.get<VoucherCheckResponse>("/api/vouchers/check/", {
      params: { code },
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};
