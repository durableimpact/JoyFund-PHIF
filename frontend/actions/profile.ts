"use client";

import { authenticatedFetch } from "@/lib/authenticated-fetch";

const ROLE_ENDPOINT: Record<string, string> = {
  DONOR: "donors",
  HOSPITAL_ADMIN: "hospital-admins",
  SOCIAL_WORKER: "social-workers",
  RECEPTIONIST: "receptionists",
  SYSTEM_ADMIN: "system-admins",
};

export async function updateProfile(
  role: string,
  profileId: string,
  data: { first_name?: string; last_name?: string; phone_number?: string }
) {
  const endpoint = ROLE_ENDPOINT[role];
  if (!endpoint) throw new Error(`Unknown role: ${role}`);

  const url =
    role === "DONOR"
      ? `/api/accounts/${endpoint}/${profileId}/update/`
      : `/api/accounts/${endpoint}/${profileId}/`;

  const res = await authenticatedFetch(url, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(JSON.stringify(err));
  }

  return res.json();
}

export async function changePassword(data: {
  old_password: string;
  new_password: string;
  confirm_password: string;
}) {
  const res = await authenticatedFetch("/api/accounts/password/change/", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(JSON.stringify(err));
  }

  return res.json();
}
