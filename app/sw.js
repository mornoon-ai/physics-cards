const CACHE = "physics-cards-v3-2026060801";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=2026060801",
  "./app.js?v=2026060801",
  "./data.js?v=2026060801",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-newton-2026060801.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        if (event.request.method === "GET" && response.ok) {
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});
