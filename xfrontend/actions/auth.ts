"use client";

import api from "./api";
import { AxiosError } from "axios";

// region Auth

/**
 * Authenticate a user and return access credentials.
 *
 * @param data - User authentication payload.
 * @returns Auth response containing tokens and user information.
 *
 * @throws Will throw an error response from the API if authentication fails.
 */
export const login = async (data: AuthBody) => {
  try {
    const response = await api.post<AuthResponse>("/api/auth/login/", data);

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

/**
 * Refresh the authentication token using a refresh token.
 *
 * @param refresh_token - The refresh token issued during login.
 * @returns A new authentication response with refreshed tokens.
 *
 * @throws Will throw an error response from the API if token refresh fails.
 */
export const refreshToken = async (refresh_token: string) => {
  try {
    const response = await api.post<AuthResponse>("/api/auth/refresh/", {
      grant_type: "refresh_token",
      refresh_token,
      client_id: process.env.NEXT_PUBLIC_DJANGO_OAUTH_CLIENT_ID,
      client_secret: process.env.NEXT_PUBLIC_DJANGO_OAUTH_CLIENT_SECRET,
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

// endregion

// region Account Creation

/**
 * Create a donor account.
 *
 * @param data - Donor registration payload.
 * @returns The newly created donor account.
 *
 * @throws Will throw an error response from the API if account creation fails.
 */
export const createDonorAccount = async (data: DonorRegister) => {
  try {
    const response = await api.post<Donor>(
      "/api/accounts/donors/register/",
      data,
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

/**
 * Create a social worker account.
 *
 * Note:
 * - This endpoint is protected and requires admin privileges.
 * - Ensure that authentication and authorization headers are included.
 *
 * Expected FormData fields:
 * @example
 * ```ts
 * {
 *   email: string;
 *   password: string;
 *   first_name: string;
 *   last_name: string;
 *   phone_number: string;
 *   national_id_number: string;
 *   front_national_id_image: File;
 *   back_national_id_image: File;
 *   organization: string;
 *   region_assigned: string;
 * }
 * ```
 *
 * @param data - Multipart form data containing social worker details.
 * @returns The newly created social worker account.
 *
 * @throws Will throw an error response from the API if account creation fails.
 */
export const createSocialWorkerAccount = async (data: FormData) => {
  try {
    const response = await api.post<SocialWorker>(
      "/api/accounts/social-workers/",
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
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

/**
 * Create a receptionist account.
 *
 * Note:
 * - This endpoint is protected and requires admin privileges.
 * - Ensure that authentication and authorization headers are included.
 *
 * Expected FormData fields:
 * @example
 * ```ts
 * {
 *   email: string;
 *   password: string;
 *   first_name: string;
 *   last_name: string;
 *   phone_number: string;
 *   national_id_number: string;
 *   front_national_id_image: File;
 *   back_national_id_image: File;
 *   hospital?: string | null;
 * }
 * ```
 *
 * @param data - Multipart form data containing receptionist details.
 * @returns The newly created receptionist account.
 *
 * @throws Will throw an error response from the API if account creation fails.
 */
export const createReceptionistAccount = async (data: FormData) => {
  try {
    const response = await api.post<Receptionist>(
      "/api/accounts/receptionists/",
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
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

/**
 * Create a hospital admin account.
 *
 * Note:
 * - This endpoint is protected and requires system admin privileges.
 * - Ensure that authentication and authorization headers are included.
 *
 * Expected FormData fields:
 * @example
 * ```ts
 * {
 *   email: string;
 *   password: string;
 *   first_name: string;
 *   last_name: string;
 *   phone_number: string;
 *   national_id_number: string;
 *   front_national_id_image: File;
 *   back_national_id_image: File;
 *   hospital?: string | null;
 * }
 * ```
 *
 * @param data - Multipart form data containing hospital admin details.
 * @returns The newly created hospital admin account.
 *
 * @throws Will throw an error response from the API if account creation fails.
 */
export const createHospitalAdminAccount = async (data: FormData) => {
  try {
    const response = await api.post<HospitalAdmin>(
      "/api/accounts/hospital-admins/",
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
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

/**
 * Create a System admin account.
 *
 * @async
 * @param {SystemAdminRegister} data
 * @returns {unknown}
 */
export const createSystemAdminAccount = async (data: SystemAdminRegister) => {
  try {
    const response = await api.post<SystemAdmin>(
      "/api/accounts/system-admins/",
      data,
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

// region Verify Email

export const verifyEmail = async ({
  token,
  email,
}: {
  token: string;
  email: string;
}) => {
  try {
    const response = await api.post("/api/accounts/verify-email/", {
      token,
      email,
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


export const resentVerificationEmail = async (email: string) => {
  try {
    const response = await api.post("/api/accounts/resend-verification/", {
      email,
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