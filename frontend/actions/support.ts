"use client";

import api from "./api";
import { AxiosError } from "axios";

function handleError(e: unknown): never {
  const err = e as AxiosError;
  const data = err.response?.data;
  if (data) {
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    const msg =
      parsed.detail ||
      parsed.error ||
      parsed.message ||
      Object.values(parsed).flat().join(", ") ||
      "An unexpected error occurred";
    throw new Error(msg);
  }
  throw new Error("An unexpected error occurred");
}

// ── Tickets ──

export const listTickets = async (
  token: string,
  params?: Record<string, string>
) => {
  try {
    const { data } = await api.get<PaginationResponse<SupportTicket>>(
      "/api/support/tickets/",
      {
        headers: { Authorization: `Bearer ${token}` },
        params,
      }
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const listMyTickets = async (
  token: string,
  params?: Record<string, string>
) => {
  try {
    const { data } = await api.get<PaginationResponse<SupportTicket>>(
      "/api/support/my-tickets/",
      {
        headers: { Authorization: `Bearer ${token}` },
        params,
      }
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const getTicket = async (id: string, token: string) => {
  try {
    const { data } = await api.get<SupportTicket>(
      `/api/support/tickets/${id}/`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const createTicket = async (
  token: string,
  payload: TicketCreateRequest
) => {
  try {
    const { data } = await api.post<SupportTicket>(
      "/api/support/tickets/create/",
      payload,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const updateTicket = async (
  id: string,
  token: string,
  payload: TicketUpdateRequest
) => {
  try {
    const { data } = await api.patch<SupportTicket>(
      `/api/support/tickets/${id}/update/`,
      payload,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const assignTicket = async (
  id: string,
  token: string,
  payload: TicketAssignRequest
) => {
  try {
    const { data } = await api.post<SupportTicket>(
      `/api/support/tickets/${id}/assign/`,
      payload,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const changeTicketStatus = async (
  id: string,
  token: string,
  payload: TicketStatusRequest
) => {
  try {
    const { data } = await api.patch<SupportTicket>(
      `/api/support/tickets/${id}/status/`,
      payload,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const closeTicket = async (
  id: string,
  token: string,
  payload?: TicketCloseRequest
) => {
  try {
    const { data } = await api.post<SupportTicket>(
      `/api/support/tickets/${id}/close/`,
      payload || {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const getTicketStats = async (token: string) => {
  try {
    const { data } = await api.get<TicketStats>("/api/support/stats/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const getTicketCategories = async (token: string) => {
  try {
    const { data } = await api.get<TicketCategoryOption[]>(
      "/api/support/categories/",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

// ── Messages ──

export const listTicketMessages = async (
  ticketId: string,
  token: string
) => {
  try {
    const { data } = await api.get<TicketMessage[]>(
      `/api/support/tickets/${ticketId}/messages/`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

export const sendTicketMessage = async (
  ticketId: string,
  token: string,
  payload: TicketMessageRequest
) => {
  try {
    const { data } = await api.post<TicketMessage>(
      `/api/support/tickets/${ticketId}/messages/`,
      payload,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

// ── Events ──

export const getTicketEvents = async (ticketId: string, token: string) => {
  try {
    const { data } = await api.get<TicketEvent[]>(
      `/api/support/tickets/${ticketId}/events/`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};

// ── System Admins ──

export const listSystemAdmins = async (token: string) => {
  try {
    const { data } = await api.get<{ id: string; email: string; first_name: string; last_name: string }[]>(
      "/api/support/admins/",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return data;
  } catch (e) {
    handleError(e);
  }
};
