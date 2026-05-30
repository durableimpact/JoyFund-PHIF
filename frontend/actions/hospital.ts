"use client";

import api from "./api";
import { AxiosError } from "axios";

function handleError(e: unknown): never {
  const err = e as AxiosError;
  if (err.response?.data) throw JSON.stringify(err.response.data);
  throw JSON.stringify({ message: "An unexpected error occurred" });
}

// ── Hospitals CRUD ──

export const listHospitals = async (
  access_token: string,
  params?: Record<string, string>,
) => {
  try {
    const { data } = await api.get<PaginationResponse<Hospital>>(
      "/api/hospitals/",
      {
        headers: { Authorization: `Bearer ${access_token}` },
        params,
      },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const getHospital = async (id: string, access_token: string) => {
  try {
    const { data } = await api.get<Hospital>(`/api/hospitals/${id}/`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const createHospital = async (
  access_token: string,
  data: HospitalCreatePayload,
) => {
  try {
    const { data: hospital } = await api.post<Hospital>(
      "/api/hospitals/",
      data,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );
    return hospital;
  } catch (e) {
    handleError(e);
  }
};

export const updateHospital = async (
  id: string,
  access_token: string,
  data: Partial<HospitalCreatePayload>,
) => {
  try {
    const { data: hospital } = await api.patch<Hospital>(
      `/api/hospitals/${id}/`,
      data,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );
    return hospital;
  } catch (e) {
    handleError(e);
  }
};

export const deleteHospital = async (id: string, access_token: string) => {
  try {
    const { data } = await api.delete(`/api/hospitals/${id}/`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) {
    handleError(e);
  }
};

// ── Hospital Dashboard ──

export const getHospitalDashboard = async (
  hospitalId: string,
  access_token: string,
) => {
  try {
    const { data } = await api.get<HospitalDashboardResponse>(
      `/api/hospitals/${hospitalId}/dashboard/`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const getHospitalRedeemedDaily = async (
  hospitalId: string,
  access_token: string,
) => {
  try {
    const { data } = await api.get<HospitalRedeemedDaily[]>(
      `/api/hospitals/${hospitalId}/dashboard/redeemed-daily/`,
      { headers: { Authorization: `Bearer ${access_token}` } },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const getHospitalStaff = async (id: string, access_token: string) => {
  try {
    const { data } = await api.get<PaginationResponse<StaffMember>>(
      `/api/hospitals/${id}/staff/`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const getHospitalReceptionists = async (
  id: string,
  access_token: string,
) => {
  try {
    const { data } = await api.get<PaginationResponse<Receptionist>>(
      `/api/hospitals/${id}/receptionists/`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const getHospitalRedeemedVouchersTotal = async (
  id: string,
  access_token: string,
) => {
  try {
    const { data } = await api.get<RedeemedVouchersTotalResponse>(
      `/api/hospitals/${id}/redeemed-vouchers-total/`,
      { headers: { Authorization: `Bearer ${access_token}` } },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

// ── Services ──

export const listServices = async (
  hospitalId: string,
  access_token: string,
) => {
  try {
    const { data } = await api.get<PaginationResponse<Service>>(`/api/hospitals/${hospitalId}/services/`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const getService = async (
  hospitalId: string,
  id: string,
  access_token: string,
) => {
  try {
    const { data } = await api.get<Service>(
      `/api/hospitals/${hospitalId}/services/${id}/`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const createService = async (
  hospitalId: string,
  access_token: string,
  data: ServiceCreatePayload,
) => {
  try {
    const { data: service } = await api.post<Service>(
      `/api/hospitals/${hospitalId}/services/`,
      data,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );
    return service;
  } catch (e) {
    handleError(e);
  }
};

export const updateService = async (
  hospitalId: string,
  id: string,
  access_token: string,
  data: Partial<ServiceCreatePayload>,
) => {
  try {
    const { data: service } = await api.patch<Service>(
      `/api/hospitals/${hospitalId}/services/${id}/`,
      data,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );
    return service;
  } catch (e) {
    handleError(e);
  }
};

export const deleteService = async (
  hospitalId: string,
  id: string,
  access_token: string,
) => {
  try {
    const { data } = await api.delete(
      `/api/hospitals/${hospitalId}/services/${id}/`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

// ── Medical Claims CRUD ──

export const createMedicalClaim = async (
  access_token: string,
  data: MedicalClaimCreatePayload,
) => {
  try {
    const { data: claim } = await api.post<MedicalClaim>(
      "/api/hospitals/medical-claims/",
      data,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );
    return claim;
  } catch (e) {
    handleError(e);
  }
};

export const getMedicalClaims = async (
  access_token: string,
  params?: Record<string, string>,
) => {
  try {
    const { data } = await api.get<PaginationResponse<MedicalClaimList>>(
      "/api/hospitals/medical-claims/list/",
      {
        headers: { Authorization: `Bearer ${access_token}` },
        params,
      },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const getMedicalClaim = async (id: string, access_token: string) => {
  try {
    const { data } = await api.get<MedicalClaim>(
      `/api/hospitals/medical-claims/${id}/`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const updateMedicalClaim = async (
  id: string,
  access_token: string,
  data: Partial<MedicalClaimCreatePayload>,
) => {
  try {
    const { data: claim } = await api.patch<MedicalClaim>(
      `/api/hospitals/medical-claims/${id}/`,
      data,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );
    return claim;
  } catch (e) {
    handleError(e);
  }
};

export const addClaimItems = async (
  medicalClaimId: string,
  access_token: string,
  data: MedicalClaimAddItemsPayload,
) => {
  try {
    const { data: claim } = await api.post<MedicalClaim>(
      `/api/hospitals/medical-claims/${medicalClaimId}/add-items/`,
      data,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );
    return claim;
  } catch (e) {
    handleError(e);
  }
};

export const approveMedicalClaim = async (
  medicalClaimId: string,
  access_token: string,
) => {
  try {
    const { data } = await api.post<MedicalClaim>(
      `/api/hospitals/medical-claims/${medicalClaimId}/approve/`,
      {},
      { headers: { Authorization: `Bearer ${access_token}` } },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const rejectMedicalClaim = async (
  medicalClaimId: string,
  access_token: string,
  reason: string,
) => {
  try {
    const { data } = await api.post<MedicalClaim>(
      `/api/hospitals/medical-claims/${medicalClaimId}/reject/`,
      { rejection_reason: reason },
      { headers: { Authorization: `Bearer ${access_token}` } },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const finalVerifyMedicalClaim = async (
  medicalClaimId: string,
  access_token: string,
) => {
  try {
    const { data } = await api.post<MedicalClaim>(
      `/api/hospitals/medical-claims/${medicalClaimId}/final-verify/`,
      {},
      { headers: { Authorization: `Bearer ${access_token}` } },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const markMedicalClaimComplete = async (
  medicalClaimId: string,
  access_token: string,
) => {
  try {
    const { data } = await api.post<MedicalClaim>(
      `/api/hospitals/medical-claims/${medicalClaimId}/mark-complete/`,
      {},
      { headers: { Authorization: `Bearer ${access_token}` } },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

// ── Medical Claim Proofs ──

export const listMedicalClaimProofs = async (
  medicalClaimId: string,
  access_token: string,
) => {
  try {
    const { data } = await api.get(
      `/api/hospitals/medical-claims/${medicalClaimId}/proofs/`,
      { headers: { Authorization: `Bearer ${access_token}` } },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const getMedicalClaimProof = async (
  medicalClaimId: string,
  id: string,
  access_token: string,
) => {
  try {
    const { data } = await api.get<MedicalClaimProof>(
      `/api/hospitals/medical-claims/${medicalClaimId}/proofs/${id}/`,
      { headers: { Authorization: `Bearer ${access_token}` } },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const createMedicalClaimProof = async (
  medicalClaimId: string,
  access_token: string,
  data: FormData,
) => {
  try {
    const { data: proof } = await api.post<MedicalClaimProof>(
      `/api/hospitals/medical-claims/${medicalClaimId}/proofs/`,
      data,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return proof;
  } catch (e) {
    handleError(e);
  }
};

export const updateMedicalClaimProof = async (
  medicalClaimId: string,
  id: string,
  access_token: string,
  data: FormData,
) => {
  try {
    const { data: proof } = await api.patch<MedicalClaimProof>(
      `/api/hospitals/medical-claims/${medicalClaimId}/proofs/${id}/`,
      data,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return proof;
  } catch (e) {
    handleError(e);
  }
};

export const deleteMedicalClaimProof = async (
  medicalClaimId: string,
  id: string,
  access_token: string,
) => {
  try {
    const { data } = await api.delete(
      `/api/hospitals/medical-claims/${medicalClaimId}/proofs/${id}/`,
      { headers: { Authorization: `Bearer ${access_token}` } },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const verifyMedicalClaimProof = async (
  medicalClaimId: string,
  id: string,
  access_token: string,
) => {
  try {
    const { data } = await api.post<MedicalClaimProof>(
      `/api/hospitals/medical-claims/${medicalClaimId}/proofs/${id}/verify/`,
      {},
      { headers: { Authorization: `Bearer ${access_token}` } },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const rejectMedicalClaimProof = async (
  medicalClaimId: string,
  id: string,
  access_token: string,
  reason: string,
) => {
  try {
    const { data } = await api.post<MedicalClaimProof>(
      `/api/hospitals/medical-claims/${medicalClaimId}/proofs/${id}/reject/`,
      { rejection_reason: reason },
      { headers: { Authorization: `Bearer ${access_token}` } },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const flagMedicalClaimProof = async (
  medicalClaimId: string,
  id: string,
  access_token: string,
  reason: string,
) => {
  try {
    const { data } = await api.post<MedicalClaimProof>(
      `/api/hospitals/medical-claims/${medicalClaimId}/proofs/${id}/flag/`,
      { rejection_reason: reason },
      { headers: { Authorization: `Bearer ${access_token}` } },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

// ── Voucher Top-Up Requests ──

export const listVoucherTopUpRequests = async (access_token: string,params?:Partial<{page:number,hospital:string,status:"PENDING"|"APPROVED"|"REJECTED"}>) => {
  try {
    const { data } = await api.get<PaginationResponse<VoucherTopUpRequest>>("/api/hospitals/voucher-top-up-requests/", {
      headers: { Authorization: `Bearer ${access_token}` },
      params
    });
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const getVoucherTopUpRequest = async (
  id: string,
  access_token: string,
) => {
  try {
    const { data } = await api.get<VoucherTopUpRequest>(
      `/api/hospitals/voucher-top-up-requests/${id}/`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const createVoucherTopUpRequest = async (
  access_token: string,
  data: VoucherTopUpCreatePayload,
) => {
  try {
    const { data: request } = await api.post<VoucherTopUpRequest>(
      "/api/hospitals/voucher-top-up-requests/create/",
      data,
      { headers: { Authorization: `Bearer ${access_token}` } },
    );
    return request;
  } catch (e) {
    handleError(e);
  }
};

export const approveVoucherTopUpRequest = async (
  id: string,
  access_token: string,
  notes?: string,
) => {
  try {
    const { data } = await api.post<VoucherTopUpRequest>(
      `/api/hospitals/voucher-top-up-requests/${id}/approve/`,
      { review_notes: notes },
      { headers: { Authorization: `Bearer ${access_token}` } },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const rejectVoucherTopUpRequest = async (
  id: string,
  access_token: string,
  notes: string,
) => {
  try {
    const { data } = await api.post<VoucherTopUpRequest>(
      `/api/hospitals/voucher-top-up-requests/${id}/reject/`,
      { review_notes: notes },
      { headers: { Authorization: `Bearer ${access_token}` } },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

// ── Vouchers (Hospital-scoped) ──

export const approveVoucher = async (
  voucherId: string,
  access_token: string,
) => {
  try {
    const { data } = await api.post<VoucherApproveResponse>(
      `/api/hospitals/vouchers/${voucherId}/approve/`,
      {},
      { headers: { Authorization: `Bearer ${access_token}` } },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const confirmVoucherPin = async (
  voucherId: string,
  access_token: string,
  pin: string,
) => {
  try {
    const { data } = await api.post<VoucherConfirmPinResponse>(
      `/api/hospitals/vouchers/${voucherId}/confirm-pin/`,
      { pin },
      { headers: { Authorization: `Bearer ${access_token}` } },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};
