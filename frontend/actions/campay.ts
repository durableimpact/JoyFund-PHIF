"use client";

import api from "./api";
import { AxiosError } from "axios";

function handleError(e: unknown): never {
  const err = e as AxiosError;
  if (err.response?.data) throw JSON.stringify(err.response.data);
  throw JSON.stringify({ message: "An unexpected error occurred" });
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
