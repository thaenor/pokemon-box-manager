const CACHE_NAME = 'pkmn-box-v1';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/firebase-config.js',
  '/js/app.js',
  '/manifest.json',
  '/images/icon-192.svg',
  '/images/icon-512.svg'
];

/* ── Install: cache static assets ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS);
    }).catch(err => {
      console.error('Precache failed:', err);
    })
  );
  self.skipWaiting();
});

/* ── Activate: clean old caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).catch(err => {
      console.error('Cache cleanup failed:', err);
    })
  );
  self.clients.claim();
});

/* ── Fetch strategy ── */
self.addEventListener('fetch', event => {
  const request = event.request;

  // API / data requests → network-first
  if (request.url.includes('/api/') || request.url.includes('firestore')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Everything else → cache-first
  event.respondWith(cacheFirst(request));
});

/* ── Cache-first strategy ── */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    // Only cache successful responses
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Offline and nothing cached — fail gracefully
    return new Response('Offline', { status: 503 });
  }
}

/* ── Network-first strategy ── */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Offline', { status: 503 });
  }
}