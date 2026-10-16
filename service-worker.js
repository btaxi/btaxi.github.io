const CACHE_NAME = 'btaxi-shell-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './images/logo.png',
  './images/logo-192.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ne jamais intercepter les requêtes API, Google Apps Script ou les requêtes POST.
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Pour la navigation : réseau d'abord, puis version mise en cache hors ligne.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          }
          return response;
        })
        .catch(() => caches.match('./index.html').then((cached) => cached || caches.match('./')))
    );
    return;
  }

  // Fichiers locaux : cache d'abord, puis réseau.
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    }))
  );
});
