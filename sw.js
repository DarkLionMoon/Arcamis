/* ════════════════════════════════════
   ARCAMIS — Service Worker
   Auto-unregister: non fa nulla, si rimuove
════════════════════════════════════ */
self.addEventListener('install', function() {
  self.skipWaiting();
});
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { return caches.delete(k); }));
    }).then(function() {
      return self.registration.unregister();
    }).then(function() {
      return self.clients.matchAll();
    }).then(function(clients) {
      clients.forEach(function(client) {
        if (client.navigate) client.navigate(client.url);
      });
    })
  );
});
