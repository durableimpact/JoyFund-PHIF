"use client";

import api from "./api";
import { AxiosError } from "axios";

function handleError(e: unknown) {
  const err = e as AxiosError;
  if (err.response?.data) throw JSON.stringify(err.response.data);
  throw JSON.stringify({ message: "An unexpected error occurred" });
}

export const listBeneficiaries = async (token: string, params?: Record<string, string>) => {
  try {
    const { data } = await api.get<PaginationResponse<Beneficiary>>("/api/beneficiaries/", {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return data;
  } catch (e) { handleError(e); }
};

export const getBeneficiary = async (id: string, token: string) => {
  try {
    const { data } = await api.get<Beneficiary>(`/api/beneficiaries/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const createBeneficiary = async (token: string, formData: FormData) => {
  try {
    const { data } = await api.post<Beneficiary>("/api/beneficiaries/", formData, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const updateBeneficiary = async (id: string, token: string, formData: FormData) => {
  try {
    const { data } = await api.patch<Beneficiary>(`/api/beneficiaries/${id}/`, formData, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const deleteBeneficiary = async (id: string, token: string) => {
  try {
    const { data } = await api.delete(`/api/beneficiaries/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const listBeneficiaryDocuments = async (beneficiary_id:string,token: string, params?: Record<string, string>) => {
  try {
    const { data } = await api.get(`/api/beneficiaries/${beneficiary_id}/documents/`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return data;
  } catch (e) { handleError(e); }
};

export const getBeneficiaryDocument = async (id: string,beneficiary_id:string, token: string) => {
  try {
    const { data } = await api.get<BeneficiaryDocument>(`/api/beneficiaries/${beneficiary_id}/documents/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

/**
 * 
 * @param token 
 * @param formData 
formData should include:
 - document : file
 - description : optional
 * @returns 
 */
export const createBeneficiaryDocument = async (token: string,beneficiary_id:string, formData: FormData) => {
  try {
    const { data } = await api.post<BeneficiaryDocument>(`/api/beneficiaries/${beneficiary_id}/documents/`, formData, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const updateBeneficiaryDocument = async (id: string,beneficiary_id:string, token: string, formData: FormData) => {
  try {
    const { data } = await api.patch<BeneficiaryDocument>(`/api/beneficiaries/${beneficiary_id}/documents/${id}/`, formData, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const deleteBeneficiaryDocument = async (id: string, beneficiary_id:string, token: string) => {
  try {
    const { data } = await api.delete(`/api/beneficiaries/${beneficiary_id}/documents/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const listHealthIssues = async (token: string, params?: Record<string, string>) => {
  try {
    const { data } = await api.get<PaginationResponse<HealthIssue>>("/api/beneficiaries/health-issues/", {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return data;
  } catch (e) { handleError(e); }
};

export const getHealthIssue = async (id: string, token: string) => {
  try {
    const { data } = await api.get<HealthIssue>(`/api/beneficiaries/health-issues/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const createHealthIssue = async (token: string, body: Record<string, any>) => {
  try {
    const { data } = await api.post<HealthIssue>("/api/beneficiaries/health-issues/", body, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const updateHealthIssue = async (id: string, token: string, body: Record<string, any>) => {
  try {
    const { data } = await api.patch<HealthIssue>(`/api/beneficiaries/health-issues/${id}/`, body, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const deleteHealthIssue = async (id: string, token: string) => {
  try {
    const { data } = await api.delete(`/api/beneficiaries/health-issues/${id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const verifyHealthIssue = async (id: string, token: string) => {
  try {
    const { data } = await api.post<HealthIssue>(`/api/beneficiaries/health-issues/${id}/verify/`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};

export const rejectHealthIssue = async (id: string, token: string, reason: string) => {
  try {
    const { data } = await api.post<HealthIssue>(`/api/beneficiaries/health-issues/${id}/reject/`, {
      rejection_reason: reason,
    }, { headers: { Authorization: `Bearer ${token}` } });
    return data;
  } catch (e) { handleError(e); }
};

export const actionHealthIssue = async (id: string, token: string, actionPayload: Record<string, any>) => {
  try {
    const { data } = await api.post<HealthIssue>(`/api/beneficiaries/health-issues/${id}/action/`, actionPayload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (e) { handleError(e); }
};
