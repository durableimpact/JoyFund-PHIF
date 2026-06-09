"use client";

import { useAuthCacheSync } from "@/hooks/use-auth-cache-sync";

export default function AuthCacheSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useAuthCacheSync();

  return <>{children}</>;
}
