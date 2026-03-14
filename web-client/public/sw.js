// web-client/public/sw.js
// Local Borga Service Worker
// Strategy:
//   - Static assets (JS, CSS, images, fonts) → Cache First
//   - API routes (/api/*)                    → Network First (never serve stale data)
//   - Pages                                  → Network First with offline fallback
//   - Offline fallback                       → /offline

const CACHE_NAME    = 'local-borga-v1';
const OFFLINE_URL   = '/offline';

// Assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/logo.jpg',
];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ── Activate — clear old caches ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  // ── API routes: Network First, no caching ────────────────────────────────
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(
          JSON.stringify({ error: 'You appear to be offline. Please check your connection.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    return;
  }

  // ── Static assets: Cache First ───────────────────────────────────────────
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/images/')        ||
    url.pathname.startsWith('/icons/')         ||
    url.pathname.endsWith('.png')              ||
    url.pathname.endsWith('.jpg')              ||
    url.pathname.endsWith('.svg')              ||
    url.pathname.endsWith('.ico')              ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // ── Pages: Network First with offline fallback ───────────────────────────
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful page responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(async () => {
        // Try cache first
        const cached = await caches.match(request);
        if (cached) return cached;
        // Final fallback → offline page
        const offlinePage = await caches.match(OFFLINE_URL);
        return offlinePage || new Response('Offline', { status: 503 });
      })
  );
});