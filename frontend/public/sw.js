const STATIC_CACHE_NAME = "joyfund-static-v2";
const APP_SHELL_ASSETS = [
  "/",
  "/favicon.ico",
  "/assets/favicon_io/joyfund-android-chrome-192x192.png",
  "/assets/favicon_io/joyfund-android-chrome-512x512.png",
  "/assets/favicon_io/joyfund-apple-touch-icon.png",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
];

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
            .filter((key) => key !== STATIC_CACHE_NAME)
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

function isHtmlRequest(request) {
  return (
    request.mode === "navigate" ||
    request.headers.get("accept")?.includes("text/html")
  );
}

function isApiRequest(url) {
  return (
    url.origin === self.location.origin && url.pathname.startsWith("/api/")
  );
}

function isStaticAssetRequest(request, url) {
  if (url.origin !== self.location.origin) return false;

  if (APP_SHELL_ASSETS.includes(url.pathname)) return true;

  return ["style", "script", "image", "font", "worker"].includes(
    request.destination,
  );
}

function createNoStoreRequest(request) {
  const headers = new Headers(request.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("Pragma", "no-cache");

  return new Request(request, {
    headers,
    cache: "no-store",
  });
}

async function networkOnly(request) {
  return fetch(createNoStoreRequest(request));
}

async function networkFirst(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    if (isHtmlRequest(request)) {
      const shellResponse = await caches.match("/");
      if (shellResponse) {
        return shellResponse;
      }
    }

    throw error;
  }
}

async function cacheFirstStatic(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await fetch(request);

  if (
    networkResponse &&
    networkResponse.status === 200 &&
    networkResponse.type === "basic"
  ) {
    const cache = await caches.open(STATIC_CACHE_NAME);
    cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  const hasAuthorizationHeader = event.request.headers.has("authorization");

  if (isApiRequest(requestUrl) || hasAuthorizationHeader) {
    event.respondWith(networkOnly(event.request));
    return;
  }

  if (isStaticAssetRequest(event.request, requestUrl)) {
    event.respondWith(cacheFirstStatic(event.request));
    return;
  }

  if (isHtmlRequest(event.request)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(networkFirst(event.request));
});
