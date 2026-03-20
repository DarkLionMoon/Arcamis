/* ════════════════════════════════════
   ARCAMIS — Service Worker
   Cache-first per asset statici,
   network-first per API Notion
════════════════════════════════════ */
var CACHE='arcamis-v4';
var STATIC=[
  '/',
  '/index.html',
  '/style-base.css',
  '/style-page.css',
  '/data.js',
  '/notion-render.js',
  '/fx.js',
  '/app.js',
  '/mappa.png'
];

self.addEventListener('install',function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return c.addAll(STATIC);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch',function(e){
  var url=e.request.url;
  /* API Notion → network-first, fallback cache */
  if(url.includes('/api/notion')){
    e.respondWith(
      fetch(e.request).then(function(r){
        var clone=r.clone();
        caches.open(CACHE).then(function(c){c.put(e.request,clone);});
        return r;
      }).catch(function(){
        return caches.match(e.request);
      })
    );
    return;
  }
  /* Asset statici → cache-first */
  if(e.request.method==='GET'){
    e.respondWith(
      caches.match(e.request).then(function(cached){
        if(cached)return cached;
        return fetch(e.request).then(function(r){
          if(!r||r.status!==200||r.type==='opaque')return r;
          var clone=r.clone();
          caches.open(CACHE).then(function(c){c.put(e.request,clone);});
          return r;
        });
      })
    );
  }
});
