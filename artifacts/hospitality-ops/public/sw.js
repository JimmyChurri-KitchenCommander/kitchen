const CACHE = 'ops-shell-v1';

const SHELL = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/logo.svg',
];

// ── Install: warm the cache with the app shell ────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

// ── Activate: delete stale caches from old versions ──────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first with cache fallback ──────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET
  if (request.method !== 'GET') return;

  // Never intercept API calls — always live data
  if (url.pathname.startsWith('/api/')) return;

  // Never intercept Clerk or external auth/font requests
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache any successful same-origin response
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          // Navigation requests (HTML) fall back to the cached root shell
          if (request.mode === 'navigate') return caches.match('/');
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        })
      )
  );
});
