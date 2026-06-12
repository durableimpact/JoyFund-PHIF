"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  registerPushSubscription,
  urlBase64ToUint8Array,
} from "@/actions/push-notifications";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

export default function PushSubscriptionManager() {
  const { data: session } = useSession();
  const token = session?.accessToken || session?.user?.accessToken;
  const registeredRef = useRef(false);
  const [status, setStatus] = useState(() => {
    if (typeof window === "undefined") return "idle";
    if (!VAPID_PUBLIC_KEY) {
      console.warn("[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set");
      return "missing VAPID key";
    }
    if (!("serviceWorker" in navigator)) {
      console.warn("[Push] Service Worker not supported");
      return "SW not supported";
    }
    if (!("PushManager" in window)) {
      console.warn("[Push] PushManager not supported");
      return "Push not supported";
    }
    return "idle";
  });

  useEffect(() => {
    if (registeredRef.current) return;
    if (status !== "idle") return;

    let cancelled = false;
    setStatus("registering...");

    async function subscribe() {
      try {
        let registration = await navigator.serviceWorker.getRegistration("/");
        if (!registration) {
          console.log("[Push] No existing SW registration, waiting...");
          // ServiceWorkerRegister handles registration after 1s — wait for it
          await new Promise((r) => setTimeout(r, 2000));
          registration = await navigator.serviceWorker.getRegistration("/");
          if (!registration) {
            console.log("[Push] Still no registration, registering...");
            registration = await navigator.serviceWorker.register("/sw.js", {
              scope: "/",
            });
          }
        } else {
          console.log("[Push] Found existing SW registration");
        }

        await navigator.serviceWorker.ready;

        let subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          console.log("[Push] Found existing push subscription");
        } else {
          console.log("[Push] Creating new push subscription...");
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as string,
          });
          console.log("[Push] Push subscription created");
        }

        if (cancelled) return;

        console.log("[Push] Saving subscription to backend...");
        // Token may be undefined for anonymous users — backend handles both cases
        await registerPushSubscription(subscription, token ?? undefined);
        registeredRef.current = true;
        setStatus("subscribed");
        console.log("[Push] Subscription saved to backend successfully!");
      } catch (err) {
        console.warn("[Push] Subscription failed:", err);
        setStatus("error: " + (err instanceof Error ? err.message : String(err)));
      }
    }

    subscribe();

    return () => {
      cancelled = true;
    };
  }, [token, VAPID_PUBLIC_KEY]);

  return null;
}
