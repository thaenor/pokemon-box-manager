const CACHE_NAME = "pkmn-box-v7";
const GUIDE_SHELL = "/violet/";
const GUIDE_PATHS = new Set(["/violet", GUIDE_SHELL, "/violet/index.html"]);

const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/firebase-config.js",
  "/js/app.js",
  "/manifest.json",
  "/images/icon-192.svg",
  "/images/icon-512.svg",
  GUIDE_SHELL,
  "/violet/companion.css",
  "/violet/app.js",
  "/violet/progress.js",
  "/violet/catalogue.js",
  "/violet/art/charcadet.png",
  "/violet/art/portraits.png",
  "/violet/manifest.webmanifest",
  "/violet/icon-192.png",
  "/violet/icon-512.png",
];

/* ── Install: cache static assets ── */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(PRECACHE_URLS);
      await self.skipWaiting();
    }),
  );
});

/* ── Activate: clean old caches ── */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("pkmn-box-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/* ── Fetch strategy ── */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only intercept GET requests
  if (request.method !== "GET") {
    return;
  }

  // Firebase SDK scripts from CDN: stale-while-revalidate for offline resilience
  if (url.origin === "https://www.gstatic.com" && url.pathname.startsWith("/firebasejs/")) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Only intercept same-origin requests beyond this point
  if (url.origin !== self.location.origin) {
    return;
  }

  // Reopen the correct app, including a direct visit to the guide while offline.
  if (request.mode === "navigate") {
    const shell = GUIDE_PATHS.has(url.pathname) ? GUIDE_SHELL : "/index.html";
    event.respondWith(fetch(request).catch(() => caches.match(shell)));
    return;
  }

  // JavaScript files: network-first — always try fresh, fall back to cache
  if (url.pathname.match(/\.(js|mjs)$/)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // All other static assets (CSS, images, fonts): cache-first
  event.respondWith(cacheFirst(request));
});

/* ── Stale-while-revalidate strategy (for CDN scripts) ── */
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        caches
          .open(CACHE_NAME)
          .then((c) => {
            c.put(request, response.clone()).catch(() => {});
          })
          .catch(() => {});
      }
      return response;
    })
    .catch(() => cached || new Response("Offline", { status: 503 }));

  // Return cached immediately if available, else wait for network
  return cached || fetchPromise;
}

/* ── Network-first strategy (for JS files) ── */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok && response.type === "basic") {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

/* ── Cache-first strategy ── */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type === "basic") {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}
