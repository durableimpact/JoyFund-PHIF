"use client";

import api from "./api";
import { AxiosError } from "axios";

function handleError(e: unknown): never {
  const err = e as AxiosError;
  const data = err.response?.data;
  if (data) {
    const parsed =
      typeof data === "string" ? (JSON.parse(data) as Record<string, unknown>) : data;
    const msg =
      (parsed as Record<string, unknown>).detail ||
      (parsed as Record<string, unknown>).error ||
      (parsed as Record<string, unknown>).message ||
      (Array.isArray(parsed)
        ? parsed.join(", ")
        : Object.values(parsed)
            .flat()
            .join(", ")) ||
      "An unexpected error occurred";
    throw new Error(msg as string);
  }
  throw new Error("An unexpected error occurred");
}

export const subscribeToNewsletter = async (email: string) => {
  try {
    const { data } = await api.post("/api/newsletter/subscribe/", { email });
    return data;
  } catch (e) {
    handleError(e);
  }
};
