/* ════════════════════════════════════
   ARCAMIS — sw-purge.js
   Purge del vecchio service worker
   ════════════════════════════════════ */
if('serviceWorker' in navigator){
  navigator.serviceWorker.getRegistrations().then(function(regs){
    regs.forEach(function(r){ r.unregister(); });
  });
  caches.keys().then(function(ks){
    ks.forEach(function(k){ caches.delete(k); });
  });
}
