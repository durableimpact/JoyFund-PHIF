"use client";

import api from "./api";
import { AxiosError } from "axios";

// region Get account info after user has authenticated

export const getDonorInfo = async (access_token: string) => {
  try {
    const response = await api.get<DonorInfo>("/api/accounts/donor/info/", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;

    if (axiosError.response?.data) {
      throw JSON.stringify(axiosError.response.data);
    }

    throw JSON.stringify({
      message: "An unexpected error occurred",
    });
  }
};

export const getSystemAdminInfo = async (access_token: string) => {
  try {
    const response = await api.get<SystemAdminInfo>(
      "/api/accounts/system-admin/info/",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    );

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;

    if (axiosError.response?.data) {
      throw JSON.stringify(axiosError.response.data);
    }

    throw JSON.stringify({
      message: "An unexpected error occurred",
    });
  }
};

export const getSocialWorkerInfo = async (access_token: string) => {
  try {
    const response = await api.get<SocialWorkerInfoSerializer>(
      "/api/accounts/social-worker/info/",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    );

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;

    if (axiosError.response?.data) {
      throw JSON.stringify(axiosError.response.data);
    }

    throw JSON.stringify({
      message: "An unexpected error occurred",
    });
  }
};

export const getHospitalAdminInfo = async (access_token: string) => {
  try {
    const response = await api.get<HospitalAdmin>(
      "/api/accounts/hospital-admin/info/",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    );

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;

    if (axiosError.response?.data) {
      throw JSON.stringify(axiosError.response.data);
    }

    throw JSON.stringify({
      message: "An unexpected error occurred",
    });
  }
};

export const getReceptionistInfo = async (access_token: string) => {
  try {
    const response = await api.get<ReceptionistInfo>(
      "/api/accounts/receptionist/info/",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    );

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;

    if (axiosError.response?.data) {
      throw JSON.stringify(axiosError.response.data);
    }

    throw JSON.stringify({
      message: "An unexpected error occurred",
    });
  }
};
