// Offline-first service worker. The whole app is a handful of static files and
// the profiles are generated on-device, so once cached, Unhinged works with no
// network at all — swipe on a plane, in a bunker, wherever.

const CACHE = "unhinged-v1";
const ASSETS = [
  ".",
  "index.html",
  "styles.css",
  "manifest.webmanifest",
  "assets/logo.svg",
  "assets/mark.svg",
  "js/app.js",
  "js/generator.js",
  "js/avatar.js",
  "js/random.js",
  "js/copy.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first for our own assets; network fallback for anything else.
self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  e.respondWith(
    caches.match(request).then((hit) =>
      hit ||
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          if (new URL(request.url).origin === self.location.origin) {
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => caches.match("index.html"))
    )
  );
});
