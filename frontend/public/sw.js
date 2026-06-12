// JoyFund Service Worker
// Handles:
// - Web push notifications
// - Offline caching and fallbacks
// - Background sync
// - Update notifications

const STATIC_CACHE_NAME = "joyfund-static-v3";
const DYNAMIC_CACHE_NAME = "joyfund-dynamic-v3";
const APP_SHELL_ASSETS = [
  "/",
  "/manifest.json",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
];

// Cache strategies
const CACHE_STRATEGIES = {
  cacheFirst: async (request) => {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const response = await cache.match(request);
    if (response) return response;

    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      return new Response("Offline", { status: 503 });
    }
  },

  networkFirst: async (request) => {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      const cached = await caches.match(request);
      if (cached) return cached;
      return new Response("Offline", { status: 503 });
    }
  },

  staleWhileRevalidate: async (request) => {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cached = await cache.match(request);

    const fetchPromise = fetch(request).then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    });

    return (
      cached ||
      fetchPromise.catch(() => new Response("Offline", { status: 503 }))
    );
  },
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ── Fetch Event Handler ─────────────────────────────────────────────────
// Route different types of requests to appropriate cache strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip external origins (except APIs)
  if (url.origin !== self.location.origin && !url.hostname.includes("api")) {
    return;
  }

  // API calls: network-first with fallback
  if (url.pathname.includes("/api/")) {
    return event.respondWith(CACHE_STRATEGIES.networkFirst(request));
  }

  // Assets: cache-first
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff|woff2)$/)) {
    return event.respondWith(CACHE_STRATEGIES.cacheFirst(request));
  }

  // HTML documents: stale-while-revalidate
  if (request.mode === "navigate" || url.pathname.endsWith("/")) {
    return event.respondWith(CACHE_STRATEGIES.staleWhileRevalidate(request));
  }

  // Default: network-first
  event.respondWith(CACHE_STRATEGIES.networkFirst(request));
});

// ── Periodic Background Sync ───────────────────────────────────────────
// Sync campaigns when offline user goes back online
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-campaigns") {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        return fetch("/api/campaigns/").then((response) => {
          if (response.ok) {
            cache.put("/api/campaigns/", response.clone());
          }
          return response;
        });
      }),
    );
  }
});

// ── Push Notification Event ─────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (error) {
    data = { title: "JoyFund", body: event.data.text() };
  }

  const title = data.title || "JoyFund";
  const options = {
    body: data.body || "",
    icon: data.icon || "/web-app-manifest-192x192.png",
    badge: data.badge || "/web-app-manifest-192x192.png",
    data: data.data || { url: "/" },
    tag: data.tag || "default",
    requireInteraction: true,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification Click Event ────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      }),
  );
});
