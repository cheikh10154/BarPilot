// BarPilot Offline Service Worker (Network-First per HTML/JS/CSS, mai cache su /api/)
const CACHE_NAME = 'barpilot-cache-v136';
const ASSETS_TO_CACHE = [
  './manifest.json',
  './assets/images/logo.png',
  './assets/images/icons/icon-192x192.png',
  './assets/images/icons/icon-512x512.png',
  './assets/images/icons/icon-maskable.png',
  './assets/images/barpilot-logo-app.png',
  './assets/images/google-pay-button.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Non intercettare mai API, autenticazione Supabase o chiamate esterne
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
    return;
  }

  // Network-First: scarica sempre la versione più recente (evita checkout.html/app.js obsoleti in cache)
  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return networkResponse;
      })
      .catch(() => caches.match(req))
  );
});
