const CACHE_NAME = 'pkmn-box-v1';

const PRECACHE_URLS = [
  '/',
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
  const { request } = event;
  const url = new URL(request.url);

  // Only intercept same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Navigation requests: serve cached index.html shell as fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets: Cache-first
  event.respondWith(cacheFirst(request));
});

/* ── Cache-first strategy ── */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type === 'basic') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}
