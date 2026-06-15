"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  registerPushSubscription,
  urlBase64ToUint8Array,
} from "@/actions/push-notifications";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

export default function PushSubscriptionManager() {
  const { data: session, status } = useSession();
  const token = session?.accessToken || session?.user?.accessToken;
  const isAuthenticated = status === "authenticated" && !!token;

  const [state, setState] = useState(() => {
    if (typeof window === "undefined") return { stage: "idle" as const };
    if (!VAPID_PUBLIC_KEY) {
      console.warn("[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set");
      return { stage: "error" as const, reason: "missing VAPID key" };
    }
    if (!("serviceWorker" in navigator)) {
      console.warn("[Push] Service Worker not supported");
      return { stage: "error" as const, reason: "SW not supported" };
    }
    if (!("PushManager" in window)) {
      console.warn("[Push] PushManager not supported");
      return { stage: "error" as const, reason: "Push not supported" };
    }
    return { stage: "idle" as const };
  });

  const pushSubRef = useRef<PushSubscription | null>(null);
  const subscribedTokenRef = useRef<string | undefined>(undefined);
  const prevSessionRef = useRef<boolean>(isAuthenticated);

  // Get or create the browser push subscription (runs once for all users)
  useEffect(() => {
    if (state.stage !== "idle") return;

    let cancelled = false;
    setState({ stage: "registering" });

    async function subscribe() {
      try {
        let registration = await navigator.serviceWorker.getRegistration("/");
        if (!registration) {
          console.log("[Push] Registering service worker...");
          registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
          });
        }

        await navigator.serviceWorker.ready;

        let subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          console.log("[Push] Found existing push subscription");
        } else {
          console.log("[Push] Creating new push subscription...");
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
          console.log("[Push] Push subscription created");
        }

        if (cancelled) return;

        pushSubRef.current = subscription;
        prevSessionRef.current = isAuthenticated;

        console.log("[Push] Saving subscription to backend...");
        await registerPushSubscription(subscription, token || undefined);
        subscribedTokenRef.current = token || undefined;
        setState({ stage: "subscribed" });
        console.log("[Push] Subscription saved to backend successfully!");
      } catch (err) {
        if (cancelled) return;
        if ((err as Error)?.name === "NotAllowedError") {
          console.warn("[Push] Notification permission denied");
          setState({ stage: "error", reason: "permission denied" });
        } else {
          console.warn("[Push] Subscription failed:", err);
          setState({
            stage: "error",
            reason:
              err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    subscribe();

    return () => {
      cancelled = true;
    };
    // Run once on mount regardless of auth status
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-save subscription when user logs in (links anonymous sub to user)
  useEffect(() => {
    if (!isAuthenticated) return;
    if (prevSessionRef.current === isAuthenticated) return;
    prevSessionRef.current = isAuthenticated;

    const subscription = pushSubRef.current;
    if (!subscription) return;

    registerPushSubscription(subscription, token!)
      .then(() => {
        subscribedTokenRef.current = token;
        console.log("[Push] Subscription linked to authenticated user");
      })
      .catch((err) => console.warn("[Push] Link to user failed:", err));
  }, [isAuthenticated, token]);

  // Re-save subscription when token refreshes (already authenticated)
  useEffect(() => {
    const subscription = pushSubRef.current;
    if (!subscription) return;
    if (!token) return;
    if (token === subscribedTokenRef.current) return;

    subscribedTokenRef.current = token;

    registerPushSubscription(subscription, token)
      .then(() => {
        console.log("[Push] Subscription re-saved with updated token");
      })
      .catch((err) => console.warn("[Push] Re-save failed:", err));
  }, [token]);

  return null;
}
