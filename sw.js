/* ════════════════════════════════════
   ARCAMIS — Service Worker v1.0
   Cache-first static assets, network-first JSON content
   ════════════════════════════════════ */

const CACHE_NAME = 'arcamis-v1';
const CACHE_VERSION = 1;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/Artboard_1.png',
  '/cover.webp',
  '/mappa.webp',
  '/robots.txt',
  '/sitemap.xml',
  '/scripts/css/style-base.css',
  '/scripts/css/changelog.css',
  '/scripts/css/style-home.css',
  '/scripts/css/style-notion.css',
  '/scripts/css/style-page.css',
  '/scripts/css/style-fx.css',
  '/scripts/css/style-ui.css',
  '/scripts/css/style-rep.css',
  '/scripts/css/style-compendio.css',
  '/scripts/js/data.js',
  '/scripts/js/md-render.js',
  '/scripts/js/notion-render.js',
  '/scripts/js/notion-nav.js',
  '/scripts/js/fx.js',
  '/scripts/js/app-ui.js',
  '/scripts/js/app.js',
  '/scripts/js/app-home.js',
  '/scripts/js/gallery.js',
  '/scripts/js/carousel-loader.js',
  '/scripts/js/admin-overlay.js',
  '/scripts/js/admin-preview.js',
  '/scripts/js/subclass-gallery.js',
  '/scripts/js/library-gallery.js',
  '/scripts/js/timeline.js',
  '/scripts/js/npc-gallery.js',
  '/scripts/js/changelog.js',
  '/scripts/js/novita-widget.js',
  '/scripts/js/perf.js',
  '/scripts/js/fixes.js',
  '/scripts/js/custom-nav.js',
  '/scripts/js/easter-eggs.js',
  '/scripts/js/sw-purge.js',
];

/* ── Install: pre-cache static assets ── */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(PRECACHE_URLS);
      })
      .then(function() {
        return self.skipWaiting();
      })
  );
});

/* ── Activate: clean old caches ── */
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* ── Fetch strategies ── */
self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);

  /* Skip non-GET and cross-origin */
  if (e.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  /* Strategy: network-first for JSON content (pages, databases) */
  if (url.pathname.startsWith('/content/')) {
    e.respondWith(
      fetch(e.request)
        .then(function(response) {
          if (response && response.ok) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(e.request, clone);
            });
          }
          return response;
        })
        .catch(function() {
          return caches.match(e.request);
        })
    );
    return;
  }

  /* Strategy: cache-first for static assets (CSS, JS, images) */
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;

      return fetch(e.request).then(function(response) {
        if (response && response.ok) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      });
    })
  );
});
