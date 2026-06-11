"use client";

import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "./use-websocket";
import { toast } from "sonner";

interface NotificationEvent {
  type: string;
  event: string;
  timestamp: string;
  data: {
    id: string;
    title: string;
    message: string;
    notification_id?: string | null;
    object?: Record<string, unknown>;
  };
}

export function useNotificationSocket() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const authUserId = session?.user?.id;
  const token = session?.accessToken || session?.user?.accessToken;

  const handleMessage = useCallback(
    (data: Record<string, unknown>) => {
      const event = data as unknown as NotificationEvent;

      if (event.type === "notification_event" || data.type === "notification") {
        queryClient.invalidateQueries({ queryKey: ["notifications", authUserId] });
        queryClient.invalidateQueries({ queryKey: ["notifications-unread", authUserId] });

        if (event.data?.title) {
          toast(event.data.title, {
            description: event.data.message,
          });
        }
      }

      if (event.event === "donation_created") {
        queryClient.invalidateQueries({ queryKey: ["campaigns"] });
        queryClient.invalidateQueries({ queryKey: ["donations"] });
      }
    },
    [queryClient, authUserId],
  );

  const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000";
  const wsUrl = apiUrl.replace(/^http/, "ws") + "/ws/notifications/";
  const enabled = !!token && !!authUserId;

  return useWebSocket({
    url: wsUrl,
    token,
    enabled,
    onMessage: handleMessage,
  });
}
