const CACHE_NAME = "werfapp-cache-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Alleen GET requests cachen
  if (req.method !== "GET") return;

  // Cache-first voor app shell
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((resp) => {
        // Bewaar dezelfde-origin assets in cache
        const url = new URL(req.url);
        if (url.origin === self.location.origin) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return resp;
      }).catch(() => {
        // Als offline en navigatie: val terug op index
        if (req.mode === "navigate") {
          return caches.match("./index.html");
        }
      });
    })
  );
});
