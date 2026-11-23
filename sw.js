const scope = new URL(self.registration.scope);
const cachePrefix = scope.pathname === "/" ? "pkmn-box-v" : `pkmn-box-${scope.pathname}:v`;
const CACHE_NAME = `${cachePrefix}9`;
const BOX_SHELL = scope.pathname;
const GUIDE_SHELL = `${scope.pathname}violet/`;
const GUIDE_PATHS = new Set([GUIDE_SHELL, `${GUIDE_SHELL}index.html`]);

const PRECACHE_URLS = [
  "",
  "css/style.css",
  "js/app.js",
  "js/api/pokeapi.js",
  "js/cache/pokemon-cache.js",
  "js/cache/schema.js",
  "js/data/natures.js",
  "js/data/species-list.js",
  "js/ui/box-grid.js",
  "js/ui/focus-trap.js",
  "js/ui/pokemon-detail.js",
  "js/ui/species-search.js",
  "js/ui/toast.js",
  "manifest.json",
  "images/icon-192.svg",
  "images/icon-512.svg",
  "violet/",
  "violet/companion.css",
  "violet/app.js",
  "violet/progress.js",
  "violet/catalogue.js",
  "violet/art/charcadet.png",
  "violet/art/portraits.png",
  "violet/manifest.webmanifest",
  "violet/icon-192.png",
  "violet/icon-512.png",
].map((asset) => new URL(asset, scope).href);

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
            .filter((key) => key.startsWith(cachePrefix) && key !== CACHE_NAME)
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

  if (
    request.method !== "GET" ||
    url.origin !== scope.origin ||
    !url.pathname.startsWith(BOX_SHELL)
  ) {
    return;
  }

  // Reopen the correct app, including a direct visit to the guide while offline.
  if (request.mode === "navigate") {
    if (url.pathname === GUIDE_SHELL.slice(0, -1)) {
      url.pathname = GUIDE_SHELL;
      event.respondWith(Response.redirect(url));
      return;
    }

    const shell = GUIDE_PATHS.has(url.pathname) ? GUIDE_SHELL : BOX_SHELL;
    event.respondWith(fetch(request).catch(() => caches.match(shell, { cacheName: CACHE_NAME })));
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
    const cached = await caches.match(request, { cacheName: CACHE_NAME });
    if (cached) return cached;
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

/* ── Cache-first strategy ── */
async function cacheFirst(request) {
  const cached = await caches.match(request, { cacheName: CACHE_NAME });
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
