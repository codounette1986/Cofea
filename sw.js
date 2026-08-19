const cacheName = "agripilot-pwa-v56";
const assets = [
  "./",
  "./index.html",
  "./index.html?v=56",
  "./styles.css?v=56",
  "./app.js?v=56",
  "./manifest.webmanifest?v=56",
  "./icons/logo.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(assets)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const request = event.request;
  const isSameOrigin = new URL(request.url).origin === self.location.origin;
  const isNavigation = request.mode === "navigate";
  if (!isSameOrigin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(cacheName).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) =>
          cached || (isNavigation ? caches.match("./index.html?v=56") || caches.match("./index.html") : undefined)
        )
      )
  );
});
