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
        keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});
self.addEventListener('fetch', function(e) {
  /* Ignora richieste esterne */
  if (!e.request.url.startsWith(self.location.origin)) return;
  /* Non cachare le chiamate API — hanno già cache lato server (s-maxage 3h) */
  if (e.request.url.includes('/api/')) return;
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
