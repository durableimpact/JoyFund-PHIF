"use client"
import api from "./api";
import { AxiosError } from "axios";

// region Auth

export const login = async (data: AuthBody) => {
    try {
        const response = await api.post<AuthResponse>('/api/auth/login/', data)
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.data) {
            throw JSON.stringify(axiosError.response.data);
        }
        throw JSON.stringify({ message: "An unexpected error occurred" });
    }
}

export const refreshToken = async (refresh_token: string) => {
    try {
        const response = await api.post<AuthResponse>('/api/auth/refresh/', { 
            grant_type: 'refresh_token',
            refresh_token,
            client_id: process.env.NEXT_PUBLIC_DJANGO_OAUTH_CLIENT_ID,
            client_secret: process.env.NEXT_PUBLIC_DJANGO_OAUTH_CLIENT_SECRET
         })
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.data) {
            throw JSON.stringify(axiosError.response.data);
        }
        throw JSON.stringify({ message: "An unexpected error occurred" });
    }
}


// endregion

// region Account Creation
