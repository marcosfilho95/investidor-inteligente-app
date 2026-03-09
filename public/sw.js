const CACHE_NAME = "investidor-inteligente-v2";
const APP_SHELL = ["/", "/index.html", "/favicon.png", "/manifest.webmanifest"];

function isCacheableHttpUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (!isCacheableHttpUrl(event.request.url)) return;
  const requestUrl = new URL(event.request.url);

  // Never intercept Vite dev/HMR endpoints.
  if (
    requestUrl.pathname.startsWith("/@vite") ||
    requestUrl.pathname.startsWith("/@react-refresh") ||
    requestUrl.pathname.startsWith("/src/")
  ) {
    return;
  }

  const isHtmlRequest = event.request.mode === "navigate";

  if (isHtmlRequest) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && isCacheableHttpUrl(response.url)) {
            const copy = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put("/index.html", copy))
              .catch(() => undefined);
          }
          return response;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (
            response &&
            response.status === 200 &&
            response.type === "basic" &&
            isCacheableHttpUrl(event.request.url) &&
            isCacheableHttpUrl(response.url)
          ) {
            const copy = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, copy))
              .catch(() => undefined);
          }
          return response;
        })
        .catch(() => cached || Response.error());

      return cached || fetchPromise;
    })
  );
});
