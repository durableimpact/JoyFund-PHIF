"use client";

import api from "./api";
import { AxiosError } from "axios";

function handleError(e: unknown): never {
  const err = e as AxiosError;
  if (err.response?.data) throw JSON.stringify(err.response.data);
  throw JSON.stringify({ message: "An unexpected error occurred" });
}

// ── Campaigns CRUD ──

type CampaignFilter = {
  status: string;
  event_type: CampaignEventType;
  is_public: boolean;
  is_active: boolean;
  donor_id: string;
  min_goal_amount: string;
  max_goal_amount: string;
  created_after: string;
  created_before: string;
  end_after: string;
  end_before: string;
  search: string;
  ordering: string;
  page: number;
  page_size: number;
};

export const listCampaigns = async (params?: Partial<CampaignFilter>) => {
  try {
    const { data } = await api.get<PaginationResponse<CampaignList>>(
      "/api/campaigns/",
      { params },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const getCampaign = async (id: string, access_token?: string) => {
  try {
    const { data } = await api.get<CampaignDetail>(`/api/campaigns/${id}/`, {
      headers: access_token ? { Authorization: `Bearer ${access_token}` } : {},
    });
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const createCampaign = async (access_token: string, data: FormData) => {
  try {
    const { data: campaign } = await api.post<Campaign>(
      "/api/campaigns/",
      data,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return campaign;
  } catch (e) {
    handleError(e);
  }
};

export const updateCampaign = async (
  id: string,
  access_token: string,
  data: FormData,
) => {
  try {
    const { data: campaign } = await api.patch<Campaign>(
      `/api/campaigns/${id}/`,
      data,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return campaign;
  } catch (e) {
    handleError(e);
  }
};

export const deleteCampaign = async (id: string, access_token: string) => {
  try {
    const { data } = await api.delete(`/api/campaigns/${id}/`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return data;
  } catch (e) {
    handleError(e);
  }
};

// ── Campaign Special Endpoints ──

export const getMyCampaigns = async (access_token: string) => {
  try {
    const { data } = await api.get<CampaignList[]>(
      "/api/campaigns/my-campaigns/",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const getAvailableBalances = async (
  access_token: string,
  params: { min_amount: number; page_size?: number; page?: number },
) => {
  try {
    const { data } = await api.get<PaginationResponse<CampaignBalance>>(
      "/api/campaigns/available-balances/",
      {
        params,
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const getCampaignLeaderboard = async (
  params?: Partial<{ page: number; page_size: number }>,
) => {
  try {
    const { data } = await api.get<
      PaginationResponse<CampaignLeaderboardEntry>
    >("/api/campaigns/leaderboard/", { params });
    return data;
  } catch (e) {
    handleError(e);
  }
};

// ── Donations ──

export const donateToCampaign = async (
  campaignId: string,
  data: DonationCreatePayload,
) => {
  try {
    const { data: donation } = await api.post<{ payment_link: string }>(
      `/api/campaigns/${campaignId}/donate/`,
      data,
    );
    return donation;
  } catch (e) {
    handleError(e);
  }
};

export const listCampaignDonations = async (
  campaignId: string,
  params?: Record<string, string>,
  access_token?: string,
) => {
  try {
    const { data } = await api.get<PaginationResponse<Donation>>(
      `/api/campaigns/${campaignId}/donations/`,
      {
        params,
        headers: access_token
          ? { Authorization: `Bearer ${access_token}` }
          : {},
      },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const getCampaignDonation = async (campaignId: string, id: string) => {
  try {
    const { data } = await api.get<Donation>(
      `/api/campaigns/${campaignId}/donations/${id}/`,
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const listAllDonations = async (params?: Record<string, string>) => {
  try {
    const { data } = await api.get("/api/campaigns/donations/", { params });
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const getMyDonations = async (access_token: string) => {
  try {
    const { data } = await api.get<PaginationResponse<Donation>>(
      "/api/campaigns/donations/my-donations/",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const getDonation = async (id: string) => {
  try {
    const { data } = await api.get<Donation>(`/api/campaigns/donations/${id}/`);
    return data;
  } catch (e) {
    handleError(e);
  }
};

// ── Platform Stats ──

export const getPlatformStats = async () => {
  try {
    const { data } = await api.get<{
      lives_supported: number;
      active_campaigns: number;
      total_raised: string;
    }>("/api/platform-stats/");
    return data;
  } catch (e) {
    handleError(e);
  }
};
