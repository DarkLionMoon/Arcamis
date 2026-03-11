/* ════════════════════════════════════
   ARCAMIS — Service Worker (STATIC)
════════════════════════════════════ */
var CACHE = 'arcamis-static-v1';
var STATIC = [
  '/',
  '/index.html',
  '/style-base.css',
  '/style-page.css',
  '/style-fx.css',
  '/data.js',
  '/notion-render.js',
  '/fx.js',
  '/app.js',
  '/mappa.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) { return c.addAll(STATIC); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // Ignora le chiamate alle API esterne o estensioni
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request).then(function(res) {
      return res || fetch(e.request).then(function(nRes) {
        return caches.open(CACHE).then(function(c) {
          c.put(e.request, nRes.clone());
          return nRes;
        });
      });
    })
  );
});
