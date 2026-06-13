// JoyFund Service Worker
// Handles:
// - Web push notifications
// - Offline caching and fallbacks
// - Background sync
// - Update notifications

const STATIC_CACHE_NAME = "joyfund-static-v3";
const DYNAMIC_CACHE_NAME = "joyfund-dynamic-v3";
const APP_SHELL_ASSETS = [];

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
// Caching disabled: All requests go directly to the network
self.addEventListener("fetch", (event) => {
  return;
});

// ── Periodic Background Sync ───────────────────────────────────────────
// Sync campaigns when offline user goes back online (Caching disabled)
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-campaigns") {
    event.waitUntil(
      fetch("/api/campaigns/").then((response) => {
        return response;
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

  // Extract URL from various possible locations in the data
  const targetUrl = data.url || data.data?.url || "/";

  const title = data.title || "JoyFund";
  const options = {
    body: data.body || "",
    icon: data.icon || "/web-app-manifest-192x192.png",
    badge: data.badge || "/web-app-manifest-192x192.png",
    data: { url: targetUrl },
    tag: data.tag || "default",
    requireInteraction: true,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification Click Event ────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Get the URL from notification data and normalize it to an absolute URL
  const urlPath = event.notification.data?.url || "/";
  const targetUrl = new URL(urlPath, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Try to find a window that's already open to this URL (normalized)
        for (const client of clientList) {
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }
        // If no matching window is found, open a new one with the absolute URL
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      }),
  );
});
