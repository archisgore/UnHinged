// Service worker. NETWORK-FIRST for our own files so a freshly-deployed shell
// and its JS always load together and consistently (the app updates the moment
// you reload). Falls back to cache when offline — the whole app is a few tiny
// static files and profiles are generated on-device, so it still works on a
// plane once cached.
//
// (v2 was cache-first, which could pair a stale index.html with newer JS after
// a deploy and soft-lock the landing screen. v3 fixes that.)

const CACHE = "unhinged-v6";
const ASSETS = [
  ".",
  "index.html",
  "terms.html",
  "feed.html",
  "styles.css",
  "manifest.webmanifest",
  "assets/logo.svg",
  "assets/mark.svg",
  "assets/og.png",
  "js/app.js",
  "js/generator.js",
  "js/random.js",
  "js/copy.js",
  "js/sfx.js",
  "js/auth.js",
  "js/config.js",
  "js/net.js",
  "js/feed.js",
  "js/analytics.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const sameOrigin = new URL(request.url).origin === self.location.origin;
  if (!sameOrigin) return; // let cross-origin requests hit the network normally

  // Network-first: fetch fresh, update the cache, fall back to cache offline.
  e.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(request).then(
          (hit) => hit || (request.mode === "navigate" ? caches.match("index.html") : Response.error())
        )
      )
  );
});
