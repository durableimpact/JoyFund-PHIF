"use client";

import { useEffect } from "react";

export default function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const unregisterAll = async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map((registration) => registration.unregister()),
      );

      if ("caches" in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
      }
    };

    if (process.env.NODE_ENV !== "production") {
      unregisterAll().catch((error) => {
        console.warn(
          "[PWA] Failed to clear development service workers:",
          error,
        );
      });
      return;
    }

    let hasRefreshedForNewWorker = false;

    const requestActivation = (registration: ServiceWorkerRegistration) => {
      registration.waiting?.postMessage({ type: "SKIP_WAITING" });
    };

    const registerWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (hasRefreshedForNewWorker) return;
          hasRefreshedForNewWorker = true;
          window.location.reload();
        });

        if (registration.waiting) {
          requestActivation(registration);
        }

        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener("statechange", () => {
            if (
              installingWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              requestActivation(registration);
            }
          });
        });

        await registration.update();
        console.log("[PWA] Service worker registered successfully.");
      } catch (error) {
        console.warn("[PWA] Service worker registration failed:", error);
      }
    };

    if (window.location.protocol === "https:") {
      registerWorker();
    }
  }, []);

  return null;
}
