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
  '/app.js'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(STATIC); })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', function(e){
  // Strategia: Cache-First, poi Network e aggiorna cache
  e.respondWith(
    caches.match(e.request).then(function(res){
      return res || fetch(e.request).then(function(nRes){
        return caches.open(CACHE).then(function(c){
          c.put(e.request, nRes.clone());
          return nRes;
        });
      });
    })
  );
});
