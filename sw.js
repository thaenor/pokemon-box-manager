const scope = new URL(self.registration.scope);
const cachePrefix = scope.pathname === "/" ? "pkmn-box-v" : `pkmn-box-${scope.pathname}:v`;
const CACHE_NAME = `${cachePrefix}12`;
const ARTWORK_CACHE_NAME = `${cachePrefix}violet-artwork`;
const ARTWORK_PATH =
  /^\/PokeAPI\/sprites\/master\/sprites\/pokemon\/other\/official-artwork\/\d+\.png$/;
const HOME_SHELL = scope.pathname;
const APP_SHELLS = ["champions/", "violet/"].map((route) => `${HOME_SHELL}${route}`);

const PRECACHE_URLS = [
  "",
  "champions/",
  "css/landing.css",
  "css/style.css",
  "js/app.js",
  "js/api/pokeapi.js",
  "js/api/champions.js",
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
  "violet/artwork.js",
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
            .filter(
              (key) =>
                key.startsWith(cachePrefix) && key !== CACHE_NAME && key !== ARTWORK_CACHE_NAME,
            )
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
    request.method === "GET" &&
    request.destination === "image" &&
    request.mode === "cors" &&
    url.origin === "https://raw.githubusercontent.com" &&
    ARTWORK_PATH.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request, ARTWORK_CACHE_NAME));
    return;
  }

  if (
    request.method !== "GET" ||
    url.origin !== scope.origin ||
    !url.pathname.startsWith(HOME_SHELL)
  ) {
    return;
  }

  // Reopen the correct app, including a direct visit to the guide while offline.
  if (request.mode === "navigate") {
    const shell = APP_SHELLS.find(
      (path) =>
        url.pathname === path ||
        url.pathname === `${path}index.html` ||
        url.pathname === path.slice(0, -1),
    );
    if (shell && url.pathname === shell.slice(0, -1)) {
      url.pathname = shell;
      event.respondWith(Response.redirect(url));
      return;
    }

    event.respondWith(
      fetch(request).catch(() => caches.match(shell ?? HOME_SHELL, { cacheName: CACHE_NAME })),
    );
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
async function cacheFirst(request, cacheName = CACHE_NAME) {
  const cached = await caches.match(request, { cacheName });
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.status === 200 && ["basic", "cors"].includes(response.type)) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch (err) {
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}
