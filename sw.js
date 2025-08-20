const CACHE_NAME = "avaliacoes-v7";
const urlsToCache = [
  "/avaliacoes/",
  "/avaliacoes/index.html",
  "/avaliacoes/manifest.json",
  "/avaliacoes/icons/icon-192.png",
  "/avaliacoes/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
