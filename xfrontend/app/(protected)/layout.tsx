"use client";

import React from "react";
import TokenRefreshProvider from "@/provider/token-refresh-provider";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <TokenRefreshProvider>
      {children}
    </TokenRefreshProvider>
  );
}
