"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "./use-websocket";
import { toast } from "sonner";

export function useDonationSocket() {
  const queryClient = useQueryClient();

  const handleMessage = useCallback(
    (data: Record<string, unknown>) => {
      if (data.type === "donation_created" || data.event === "donation_created") {
        queryClient.invalidateQueries({ queryKey: ["campaigns"] });
        queryClient.invalidateQueries({ queryKey: ["donations"] });

        const msgData = data as {
          type?: string;
          event?: string;
          data?: { title?: string; message?: string };
        };
        if (msgData.data?.title) {
          toast(msgData.data.title, {
            description: msgData.data.message,
          });
        }
      }
    },
    [queryClient],
  );

  const apiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000";
  const wsUrl = apiUrl.replace(/^http/, "ws") + "/ws/donations/";

  return useWebSocket({
    url: wsUrl,
    onMessage: handleMessage,
  });
}
