/* ════════════════════════════════════
   ARCAMIS — sw-purge.js
   Purge vecchio SW + registrazione nuovo
   ════════════════════════════════════ */
if ('serviceWorker' in navigator) {
  /* 1. Elimina tutti i vecchi SW e cache vecchie */
  navigator.serviceWorker.getRegistrations().then(function (regs) {
    regs.forEach(function (r) {
      /* Salta se è già il SW attuale */
      if (r.scope === self.location.origin + '/') {
        return;
      }
      r.unregister();
    });
  });
  caches.keys().then(function (ks) {
    ks.forEach(function (k) {
      if (k !== 'arcamis-v1') {
        caches.delete(k);
      }
    });
  });

  /* 2. Registra il nuovo service worker */
  navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function () {});
}
