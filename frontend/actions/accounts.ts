"use client";

import api from "./api";
import { AxiosError } from "axios";

// ── Helpers ──

function getAuthHeader(access_token?: string) {
  if (!access_token) return {};
  return { Authorization: `Bearer ${access_token}` };
}

function handleError(error: unknown): never {
  const axiosError = error as AxiosError;
  if (axiosError.response?.data) throw JSON.stringify(axiosError.response.data);
  throw JSON.stringify({ message: "An unexpected error occurred" });
}

// ── Info Endpoints (get authenticated user info after login) ──

export const getDonorInfo = async (access_token: string) => {
  try {
    const { data } = await api.get<DonorInfo>("/api/accounts/donor/info/", {
      headers: getAuthHeader(access_token),
    });
    return data;
  } catch (e) { handleError(e); }
};

export const getSystemAdminInfo = async (access_token: string) => {
  try {
    const { data } = await api.get<SystemAdminInfo>("/api/accounts/system-admin/info/", {
      headers: getAuthHeader(access_token),
    });
    return data;
  } catch (e) { handleError(e); }
};

export const getSocialWorkerInfo = async (access_token: string) => {
  try {
    const { data } = await api.get<SocialWorkerInfo>(
      "/api/accounts/social-worker/info/",
      { headers: getAuthHeader(access_token) }
    );
    return data;
  } catch (e) { handleError(e); }
};

export const getHospitalAdminInfo = async (access_token: string) => {
  try {
    const { data } = await api.get<HospitalAdminInfo>(
      "/api/accounts/hospital-admin/info/",
      { headers: getAuthHeader(access_token) }
    );
    return data;
  } catch (e) { handleError(e); }
};

export const getReceptionistInfo = async (access_token: string) => {
  try {
    const { data } = await api.get<ReceptionistInfo>(
      "/api/accounts/receptionist/info/",
      { headers: getAuthHeader(access_token) }
    );
    return data;
  } catch (e) { handleError(e); }
};

// ── Donors CRUD ──

export const listDonors = async (access_token: string, params?: Record<string, string>) => {
  try {
    const { data } = await api.get<PaginationResponse<Donor>>("/api/accounts/donors/", {
      headers: getAuthHeader(access_token),
      params,
    });
    return data;
  } catch (e) { handleError(e); }
};

export const getDonor = async (id: string, access_token?: string) => {
  try {
    const { data } = await api.get<Donor>(`/api/accounts/donors/${id}/`, {
      headers: getAuthHeader(access_token),
    });
    return data;
  } catch (e) { handleError(e); }
};

export const createDonorAccount = async (data: DonorRegister) => {
  try {
    const { data: donor } = await api.post<Donor>("/api/accounts/donors/register/", data);
    return donor;
  } catch (e) { handleError(e); }
};

export const updateDonor = async (id: string, access_token: string, data: DonorUpdate) => {
  try {
    const { data: donor } = await api.patch<Donor>(`/api/accounts/donors/${id}/update/`, data, {
      headers: getAuthHeader(access_token),
    });
    return donor;
  } catch (e) { handleError(e); }
};

export const getDonorDashboard = async (id: string, access_token: string) => {
  try {
    const { data } = await api.get<DonorDashboardSerializer>(
      `/api/accounts/donors/${id}/dashboard/`,
      { headers: getAuthHeader(access_token) }
    );
    return data;
  } catch (e) { handleError(e); }
};

// ── Hospital Admins CRUD ──

export const listHospitalAdmins = async (access_token: string, params?: Record<string, string>) => {
  try {
    const { data } = await api.get<PaginationResponse<HospitalAdmin>>("/api/accounts/hospital-admins/", {
      headers: getAuthHeader(access_token),
      params,
    });
    return data;
  } catch (e) { handleError(e); }
};

export const getHospitalAdmin = async (id: string, access_token: string) => {
  try {
    const { data } = await api.get<HospitalAdmin>(`/api/accounts/hospital-admins/${id}/`, {
      headers: getAuthHeader(access_token),
    });
    return data;
  } catch (e) { handleError(e); }
};

export const createHospitalAdminAccount = async (access_token: string, data: FormData) => {
  try {
    const { data: admin } = await api.post<HospitalAdmin>("/api/accounts/hospital-admins/", data, {
      headers: { ...getAuthHeader(access_token), "Content-Type": "multipart/form-data" },
    });
    return admin;
  } catch (e) { handleError(e); }
};

export const updateHospitalAdmin = async (id: string, access_token: string, data: FormData) => {
  try {
    const { data: admin } = await api.patch<HospitalAdmin>(
      `/api/accounts/hospital-admins/${id}/`,
      data,
      {
        headers: { ...getAuthHeader(access_token), "Content-Type": "multipart/form-data" },
      }
    );
    return admin;
  } catch (e) { handleError(e); }
};

export const getHospitalAdminDashboard = async (id: string, access_token: string) => {
  try {
    const { data } = await api.get<HospitalAdminDashboardSerializer>(
      `/api/accounts/hospital-admins/${id}/dashboard/`,
      { headers: getAuthHeader(access_token) }
    );
    return data;
  } catch (e) { handleError(e); }
};

// ── Receptionists CRUD ──

export const listReceptionists = async (access_token: string, params?: Record<string, string>) => {
  try {
    const { data } = await api.get<PaginationResponse<Receptionist>>("/api/accounts/receptionists/", {
      headers: getAuthHeader(access_token),
      params,
    });
    return data;
  } catch (e) { handleError(e); }
};

export const getReceptionist = async (id: string, access_token: string) => {
  try {
    const { data } = await api.get<Receptionist>(`/api/accounts/receptionists/${id}/`, {
      headers: getAuthHeader(access_token),
    });
    return data;
  } catch (e) { handleError(e); }
};

export const createReceptionistAccount = async (access_token: string, data: FormData) => {
  try {
    const { data: rec } = await api.post<Receptionist>("/api/accounts/receptionists/", data, {
      headers: { ...getAuthHeader(access_token), "Content-Type": "multipart/form-data" },
    });
    return rec;
  } catch (e) { handleError(e); }
};

export const updateReceptionist = async (id: string, access_token: string, data: FormData) => {
  try {
    const { data: rec } = await api.patch<Receptionist>(
      `/api/accounts/receptionists/${id}/`,
      data,
      {
        headers: { ...getAuthHeader(access_token), "Content-Type": "multipart/form-data" },
      }
    );
    return rec;
  } catch (e) { handleError(e); }
};

export const getReceptionistDashboard = async (id: string, access_token: string) => {
  try {
    const { data } = await api.get<ReceptionistDashboardSerializer>(
      `/api/accounts/receptionists/${id}/dashboard/`,
      { headers: getAuthHeader(access_token) }
    );
    return data;
  } catch (e) { handleError(e); }
};

// ── Social Workers CRUD ──

export const listSocialWorkers = async (access_token: string, params?: Record<string, string>) => {
  try {
    const { data } = await api.get<PaginationResponse<SocialWorker>>("/api/accounts/social-workers/", {
      headers: getAuthHeader(access_token),
      params,
    });
    return data;
  } catch (e) { handleError(e); }
};

export const getSocialWorker = async (id: string, access_token: string) => {
  try {
    const { data } = await api.get<SocialWorker>(`/api/accounts/social-workers/${id}/`, {
      headers: getAuthHeader(access_token),
    });
    return data;
  } catch (e) { handleError(e); }
};

export const createSocialWorkerAccount = async (access_token: string, data: FormData) => {
  try {
    const { data: sw } = await api.post<SocialWorker>("/api/accounts/social-workers/", data, {
      headers: { ...getAuthHeader(access_token), "Content-Type": "multipart/form-data" },
    });
    return sw;
  } catch (e) { handleError(e); }
};

export const updateSocialWorker = async (id: string, access_token: string, data: FormData) => {
  try {
    const { data: sw } = await api.patch<SocialWorker>(
      `/api/accounts/social-workers/${id}/`,
      data,
      {
        headers: { ...getAuthHeader(access_token), "Content-Type": "multipart/form-data" },
      }
    );
    return sw;
  } catch (e) { handleError(e); }
};

export const getSocialWorkerDashboard = async (id: string, access_token: string) => {
  try {
    const { data } = await api.get<SocialWorkerDashboardSerializer>(
      `/api/accounts/social-workers/${id}/dashboard/`,
      { headers: getAuthHeader(access_token) }
    );
    return data;
  } catch (e) { handleError(e); }
};

// ── System Admins CRUD ──

export const listSystemAdmins = async (access_token: string, params?: Record<string, string>) => {
  try {
    const { data } = await api.get<PaginationResponse<SystemAdmin>>("/api/accounts/system-admins/", {
      headers: getAuthHeader(access_token),
      params,
    });
    return data;
  } catch (e) { handleError(e); }
};

export const getSystemAdmin = async (id: string, access_token: string) => {
  try {
    const { data } = await api.get<SystemAdmin>(`/api/accounts/system-admins/${id}/`, {
      headers: getAuthHeader(access_token),
    });
    return data;
  } catch (e) { handleError(e); }
};

export const createSystemAdminAccount = async (access_token: string, data: SystemAdminRegister) => {
  try {
    const { data: admin } = await api.post<SystemAdmin>("/api/accounts/system-admins/", data, {
      headers: getAuthHeader(access_token),
    });
    return admin;
  } catch (e) { handleError(e); }
};

export const updateSystemAdmin = async (id: string, access_token: string, data: Partial<SystemAdminRegister>) => {
  try {
    const { data: admin } = await api.patch<SystemAdmin>(
      `/api/accounts/system-admins/${id}/`,
      data,
      { headers: getAuthHeader(access_token) }
    );
    return admin;
  } catch (e) { handleError(e); }
};

export const getSystemAdminDashboard = async (id: string, access_token: string) => {
  try {
    const { data } = await api.get<SystemAdminDashboardSerializer>(
      `/api/accounts/system-admins/${id}/dashboard/`,
      { headers: getAuthHeader(access_token) }
    );
    return data;
  } catch (e) { handleError(e); }
};

// ── Admin Dashboard Analytics ──

export const getAdminOverview = async (access_token: string) => {
  try {
    const { data } = await api.get<OverviewKpi>("/api/accounts/system-admins/dashboard/", {
      headers: getAuthHeader(access_token),
    });
    return data;
  } catch (e) { handleError(e); }
};

export const getAdminFinancial = async (access_token: string) => {
  try {
    const { data } = await api.get<FinancialDashboard>(
      "/api/accounts/system-admins/dashboard/financial/",
      { headers: getAuthHeader(access_token) }
    );
    return data;
  } catch (e) { handleError(e); }
};

export const getAdminDonationTrends = async (access_token: string, params?: Record<string, string>) => {
  try {
    const { data } = await api.get<DonationTrends>(
      "/api/accounts/system-admins/dashboard/donation-trends/",
      { headers: getAuthHeader(access_token), params }
    );
    return data;
  } catch (e) { handleError(e); }
};

export const getAdminUserAnalytics = async (access_token: string) => {
  try {
    const { data } = await api.get<UserGrowth>(
      "/api/accounts/system-admins/dashboard/user-analytics/",
      { headers: getAuthHeader(access_token) }
    );
    return data;
  } catch (e) { handleError(e); }
};

export const getAdminBeneficiaryVoucher = async (access_token: string) => {
  try {
    const { data } = await api.get<BeneficiaryVoucher>(
      "/api/accounts/system-admins/dashboard/beneficiaries-vouchers/",
      { headers: getAuthHeader(access_token) }
    );
    return data;
  } catch (e) { handleError(e); }
};

export const getAdminOrganization = async (access_token: string) => {
  try {
    const { data } = await api.get<OrganizationDashboard>(
      "/api/accounts/system-admins/dashboard/organization/",
      { headers: getAuthHeader(access_token) }
    );
    return data;
  } catch (e) { handleError(e); }
};

export const getAdminTrendsReport = async (access_token: string, params?: Record<string, string>) => {
  try {
    const { data } = await api.get<TrendsReport>(
      "/api/accounts/system-admins/dashboard/trends-reports/",
      { headers: getAuthHeader(access_token), params }
    );
    return data;
  } catch (e) { handleError(e); }
};

// ── Password Management ──

export const requestPasswordReset = async (email: string) => {
  try {
    const { data } = await api.post("/api/accounts/password/reset/", { email });
    return data;
  } catch (e) { handleError(e); }
};

export const confirmPasswordReset = async (payload: {
  code: string;
  new_password: string;
  confirm_password: string;
}) => {
  try {
    const { data } = await api.post("/api/accounts/password/reset-confirm/", payload);
    return data;
  } catch (e) { handleError(e); }
};

export const changePassword = async (access_token: string, payload: {
  old_password: string;
  new_password: string;
  confirm_password: string;
}) => {
  try {
    const { data } = await api.post("/api/accounts/password/change/", payload, {
      headers: getAuthHeader(access_token),
    });
    return data;
  } catch (e) { handleError(e); }
};

// ── Email Verification ──

export const verifyEmail = async ({ code, email }: { code: string; email: string }) => {
  try {
    const { data } = await api.post("/api/accounts/verify-email/", { code, email });
    return data;
  } catch (e) { handleError(e); }
};

export const resendVerificationEmail = async (email: string) => {
  try {
    const { data } = await api.post("/api/accounts/resend-verification/", { email });
    return data;
  } catch (e) { handleError(e); }
};
