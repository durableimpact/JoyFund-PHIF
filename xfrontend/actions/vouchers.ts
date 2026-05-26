"use client";

import api from "./api";
import { AxiosError } from "axios";

function handleError(e: unknown) {
  const err = e as AxiosError;
  if (err.response?.data) throw JSON.stringify(err.response.data);
  throw JSON.stringify({ message: "An unexpected error occurred" });
}

// ── Vouchers CRUD ──

export const listVouchers = async (access_token: string, params?: Record<string, string>) => {
  try {
    const { data } = await api.get<Voucher[]>("/api/vouchers/", {
      headers: { Authorization: `Bearer ${access_token}` },
      params,
    });
    return data;
  } catch (e) { handleError(e); }
};

export const getVoucher = async (id: string, access_token: string) => {
  try {
    const { data } = await api.get<Voucher>(`/api/vouchers/${id}/`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const createVoucher = async (access_token: string, data: VoucherCreatePayload) => {
  try {
    const { data: voucher } = await api.post<Voucher>("/api/vouchers/create/", data, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return voucher;
  } catch (e) { handleError(e); }
};

export const createVouchersFromCampaigns = async (access_token: string, data: VoucherCreateFromCampaignsPayload) => {
  try {
    const { data } = await api.post<Voucher[]>("/api/vouchers/create-from-campaigns/", data, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const checkVoucher = async (voucher_code: string) => {
  try {
    const { data } = await api.get<VoucherCheckResponse>("/api/vouchers/check/", {
      params: { code: voucher_code },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const getVoucherNotifications = async (voucherId: string, access_token: string) => {
  try {
    const { data } = await api.get<VoucherNotification[]>(`/api/vouchers/${voucherId}/notifications/`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};
