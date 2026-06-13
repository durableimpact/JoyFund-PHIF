"use client";

import { useAuthError } from "@/hooks/use-auth-error";

export function AuthErrorHandler() {
  useAuthError();
  return null;
}
