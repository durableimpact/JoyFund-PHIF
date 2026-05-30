"use client";

import api from "./api";
import { AxiosError } from "axios";

function handleError(e: unknown): never {
  const err = e as AxiosError;
  if (err.response?.data) throw JSON.stringify(err.response.data);
  throw JSON.stringify({ message: "An unexpected error occurred" });
}

// ── Accounts ──

export const listAccounts = async (access_token: string) => {
  try {
    const { data } = await api.get("/api/payments/accounts/", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const getEscrowAccount = async (access_token: string) => {
  try {
    const { data } = await api.get<EscrowAccount>("/api/payments/accounts/escrow/", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const getFeeAccount = async (access_token: string) => {
  try {
    const { data } = await api.get<FeeAccount>("/api/payments/accounts/fee/", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

// ── Fee Policies ──

export const listFeePolicies = async (access_token: string) => {
  try {
    const { data } = await api.get("/api/payments/fee-policies/", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const getFeePolicy = async (id: number, access_token: string) => {
  try {
    const { data } = await api.get<FeePolicy>(`/api/payments/fee-policies/${id}/`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const createFeePolicy = async (access_token: string, data: FeePolicyCreatePayload) => {
  try {
    const { data: policy } = await api.post<FeePolicy>("/api/payments/fee-policies/", data, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return policy;
  } catch (e) { handleError(e); }
};

export const updateFeePolicy = async (id: number, access_token: string, data: FeePolicyUpdatePayload) => {
  try {
    const { data: policy } = await api.patch<FeePolicy>(`/api/payments/fee-policies/${id}/`, data, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return policy;
  } catch (e) { handleError(e); }
};

export const deleteFeePolicy = async (id: number, access_token: string) => {
  try {
    const { data } = await api.delete(`/api/payments/fee-policies/${id}/`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

// ── Payment Gateways ──

export const listGateways = async (access_token: string) => {
  try {
    const { data } = await api.get("/api/payments/gateways/", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const getGateway = async (id: number, access_token: string) => {
  try {
    const { data } = await api.get<PaymentGateway>(`/api/payments/gateways/${id}/`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const createGateway = async (access_token: string, data: PaymentGatewayCreatePayload) => {
  try {
    const { data: gateway } = await api.post<PaymentGateway>("/api/payments/gateways/", data, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return gateway;
  } catch (e) { handleError(e); }
};

export const updateGateway = async (id: number, access_token: string, data: PaymentGatewayUpdatePayload) => {
  try {
    const { data: gateway } = await api.patch<PaymentGateway>(`/api/payments/gateways/${id}/`, data, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return gateway;
  } catch (e) { handleError(e); }
};

export const deleteGateway = async (id: number, access_token: string) => {
  try {
    const { data } = await api.delete(`/api/payments/gateways/${id}/`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

// ── Transactions ──

export const listTransactions = async (access_token: string, params?: Record<string, string>) => {
  try {
    const { data } = await api.get("/api/payments/transactions/", {
      headers: { Authorization: `Bearer ${access_token}` },
      params,
    });
    return data;
  } catch (e) { handleError(e); }
};

export const getTransaction = async (id: string, access_token: string) => {
  try {
    const { data } = await api.get<Transaction>(`/api/payments/transactions/${id}/`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

// ── Fee Splits ──

export const listFeeSplits = async (access_token: string) => {
  try {
    const { data } = await api.get("/api/payments/fee-splits/", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const getFeeSplit = async (id: number, access_token: string) => {
  try {
    const { data } = await api.get<FeeSplit>(`/api/payments/fee-splits/${id}/`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

// ── Webhooks ──

export const listWebhookEvents = async (access_token: string) => {
  try {
    const { data } = await api.get("/api/payments/webhooks/", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const getWebhookEvent = async (id: number, access_token: string) => {
  try {
    const { data } = await api.get<WebhookEvent>(`/api/payments/webhooks/${id}/`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const getWebhookStatus = async () => {
  try {
    const { data } = await api.get("/api/payments/webhook/");
    return data;
  } catch (e) { handleError(e); }
};

export const postWebhook = async (payload: Record<string, any>) => {
  try {
    const { data } = await api.post("/api/payments/webhook/", payload);
    return data;
  } catch (e) { handleError(e); }
};
