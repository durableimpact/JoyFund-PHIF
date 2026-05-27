"use client";

import api from "./api";
import { AxiosError } from "axios";

function handleError(e: unknown) {
  const err = e as AxiosError;
  if (err.response?.data) throw JSON.stringify(err.response.data);
  throw JSON.stringify({ message: "An unexpected error occurred" });
}

export const listVouchers = async (token: string) => {
  try {
    const { data } = await api.get("/api/vouchers/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return Array.isArray(data) ? data : data?.results || [];
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
