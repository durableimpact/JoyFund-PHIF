"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useNotificationSocket } from "@/hooks/use-notification-socket";
import { useDonationSocket } from "@/hooks/use-donation-socket";

interface WebSocketContextValue {
  notifications: ReturnType<typeof useNotificationSocket>;
  donations: ReturnType<typeof useDonationSocket>;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function useWebSocketContext() {
  const ctx = useContext(WebSocketContext);
  if (!ctx) {
    throw new Error("useWebSocketContext must be used within WebSocketProvider");
  }
  return ctx;
}

export default function WebSocketProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const notifications = useNotificationSocket();
  const donations = useDonationSocket();

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <WebSocketContext.Provider value={{ notifications, donations }}>
      {children}
    </WebSocketContext.Provider>
  );
}
