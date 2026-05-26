"use client";

import api from "./api";
import { AxiosError } from "axios";

function handleError(e: unknown) {
  const err = e as AxiosError;
  if (err.response?.data) throw JSON.stringify(err.response.data);
  throw JSON.stringify({ message: "An unexpected error occurred" });
}

// ── Beneficiaries CRUD ──

export const listBeneficiaries = async (access_token: string, params?: Record<string, string>) => {
  try {
    const { data } = await api.get<Beneficiary[]>("/api/beneficiaries/", {
      headers: { Authorization: `Bearer ${access_token}` },
      params,
    });
    return data;
  } catch (e) { handleError(e); }
};

export const getBeneficiary = async (id: string, access_token: string) => {
  try {
    const { data } = await api.get<Beneficiary>(`/api/beneficiaries/${id}/`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const createBeneficiary = async (access_token: string, data: FormData) => {
  try {
    const { data: beneficiary } = await api.post<Beneficiary>("/api/beneficiaries/", data, {
      headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "multipart/form-data" },
    });
    return beneficiary;
  } catch (e) { handleError(e); }
};

export const updateBeneficiary = async (id: string, access_token: string, data: FormData) => {
  try {
    const { data: beneficiary } = await api.patch<Beneficiary>(`/api/beneficiaries/${id}/`, data, {
      headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "multipart/form-data" },
    });
    return beneficiary;
  } catch (e) { handleError(e); }
};

export const deleteBeneficiary = async (id: string, access_token: string) => {
  try {
    const { data } = await api.delete(`/api/beneficiaries/${id}/`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

// ── Beneficiary Documents ──

export const listBeneficiaryDocuments = async (access_token: string, params?: Record<string, string>) => {
  try {
    const { data } = await api.get<BeneficiaryDocument[]>("/api/beneficiaries/documents/", {
      headers: { Authorization: `Bearer ${access_token}` },
      params,
    });
    return data;
  } catch (e) { handleError(e); }
};

export const getBeneficiaryDocument = async (id: string, access_token: string) => {
  try {
    const { data } = await api.get<BeneficiaryDocument>(`/api/beneficiaries/documents/${id}/`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const createBeneficiaryDocument = async (access_token: string, data: FormData) => {
  try {
    const { data: doc } = await api.post<BeneficiaryDocument>("/api/beneficiaries/documents/", data, {
      headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "multipart/form-data" },
    });
    return doc;
  } catch (e) { handleError(e); }
};

export const updateBeneficiaryDocument = async (id: string, access_token: string, data: FormData) => {
  try {
    const { data: doc } = await api.patch<BeneficiaryDocument>(`/api/beneficiaries/documents/${id}/`, data, {
      headers: { Authorization: `Bearer ${access_token}`, "Content-Type": "multipart/form-data" },
    });
    return doc;
  } catch (e) { handleError(e); }
};

export const deleteBeneficiaryDocument = async (id: string, access_token: string) => {
  try {
    const { data } = await api.delete(`/api/beneficiaries/documents/${id}/`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

// ── Health Issues CRUD ──

export const listHealthIssues = async (access_token: string, params?: Record<string, string>) => {
  try {
    const { data } = await api.get<HealthIssue[]>("/api/beneficiaries/health-issues/", {
      headers: { Authorization: `Bearer ${access_token}` },
      params,
    });
    return data;
  } catch (e) { handleError(e); }
};

export const getHealthIssue = async (id: string, access_token: string) => {
  try {
    const { data } = await api.get<HealthIssue>(`/api/beneficiaries/health-issues/${id}/`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const createHealthIssue = async (access_token: string, data: Record<string, any>) => {
  try {
    const { data: issue } = await api.post<HealthIssue>("/api/beneficiaries/health-issues/", data, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return issue;
  } catch (e) { handleError(e); }
};

export const updateHealthIssue = async (id: string, access_token: string, data: Record<string, any>) => {
  try {
    const { data: issue } = await api.patch<HealthIssue>(`/api/beneficiaries/health-issues/${id}/`, data, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return issue;
  } catch (e) { handleError(e); }
};

export const deleteHealthIssue = async (id: string, access_token: string) => {
  try {
    const { data } = await api.delete(`/api/beneficiaries/health-issues/${id}/`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const verifyHealthIssue = async (id: string, access_token: string) => {
  try {
    const { data } = await api.post<HealthIssue>(`/api/beneficiaries/health-issues/${id}/verify/`, {}, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const rejectHealthIssue = async (id: string, access_token: string, reason: string) => {
  try {
    const { data } = await api.post<HealthIssue>(`/api/beneficiaries/health-issues/${id}/reject/`, {
      rejection_reason: reason,
    }, { headers: { Authorization: `Bearer ${access_token}` } });
    return data;
  } catch (e) { handleError(e); }
};

export const actionHealthIssue = async (id: string, access_token: string, actionPayload: Record<string, any>) => {
  try {
    const { data } = await api.post<HealthIssue>(`/api/beneficiaries/health-issues/${id}/action/`, actionPayload, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};
