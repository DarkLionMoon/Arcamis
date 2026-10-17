/* ════════════════════════════════════════════════════════
   ARCAMIS — Service Worker

   Questo file è anche il template usato da scripts/build-post.mjs:
   il build inietta PRIMA di questo codice
     self.__ARC_BUILD_VERSION__ = '<hash del build>';
     self.__ARC_PRECACHE__ = [ ...soli file realmente emessi ];
   In sviluppo (vite dev) restano i fallback qui sotto.

   Regole:
   - niente precache di file inesistenti (era il bug che salvava
     l'HTML del fallback SPA sotto URL .css)
   - rifiuta in cache risposte con content-type incompatibile
   - cache versionata: ogni build invalida la precedente
════════════════════════════════════════════════════════ */
const CACHE_VERSION = self.__ARC_BUILD_VERSION__ || 'dev';
const CACHE_NAME = 'arcamis-' + CACHE_VERSION;
const PRECACHE_URLS = Array.isArray(self.__ARC_PRECACHE__)
  ? self.__ARC_PRECACHE__
  : ['/index.html', '/Artboard_1.png'];

/* Una risposta è cacheabile solo se il content-type è coerente
   con l'estensione richiesta. Evita HTML salvato come CSS/JS. */
function isCacheable(url, response) {
  if (!response || !response.ok) return false;
  const type = (response.headers.get('content-type') || '').toLowerCase();
  let pathname;
  try {
    pathname = new URL(url, self.location.origin).pathname;
  } catch (e) {
    return false;
  }
  if (/\.css$/.test(pathname)) return type.includes('text/css');
  if (/\.js$/.test(pathname)) return type.includes('javascript');
  if (/\.json$/.test(pathname)) return type.includes('json');
  if (/\.(webp|png|jpe?g|avif|gif|svg)$/.test(pathname)) return type.startsWith('image/');
  if (/\.(woff2?|ttf|otf)$/.test(pathname)) return type.includes('font') || type.includes('woff');
  if (/\.html?$/.test(pathname) || pathname === '/') return type.includes('text/html');
  return true;
}

self.addEventListener('install', function (event) {
  event.waitUntil(
    (async function () {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(
        PRECACHE_URLS.map(async function (url) {
          try {
            const response = await fetch(url, { cache: 'reload' });
            if (isCacheable(url, response)) {
              await cache.put(url, response);
            } else {
              console.warn('[sw] skip precache', url, response && response.status);
            }
          } catch (e) {
            console.warn('[sw] precache fallita', url);
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    (async function () {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter(function (name) {
            return name.indexOf('arcamis-') === 0 && name !== CACHE_NAME;
          })
          .map(function (name) {
            return caches.delete(name);
          })
      );
      await self.clients.claim();
    })()
  );
});

/* Network-first con fallback in cache (navigation e JSON). */
async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (isCacheable(request.url, response)) await cache.put(request, response.clone());
    return response;
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl);
      if (fallback) return fallback;
    }
    throw e;
  }
}

/* Cache-first: sicuro solo per asset con hash nel nome. */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (isCacheable(request.url, response)) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

/* Stale-while-revalidate per immagini e file non hashati. */
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const network = fetch(request)
    .then(async function (response) {
      if (isCacheable(request.url, response)) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    })
    .catch(function () {
      return cached;
    });
  return cached || network;
}

self.addEventListener('fetch', function (event) {
  const request = event.request;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch (e) {
    return;
  }
  if (url.origin !== self.location.origin) return;

  /* Le API rispondono sempre dalla rete (dati admin/utente). */
  if (url.pathname.indexOf('/api/') === 0) return;

  if (request.mode === 'navigate') {
    /* offline: prima la pagina già visitata, poi la schermata offline dedicata */
    event.respondWith(networkFirst(request, '/offline.html'));
    return;
  }

  if (url.pathname.indexOf('/content/') === 0) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (/^\/scripts\/(js|css)\//.test(url.pathname) || url.pathname.indexOf('/assets/') === 0) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
