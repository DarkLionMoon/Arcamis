/* ════════════════════════════════════════════════════════
   ARCAMIS — sw-purge.js
   Registra il service worker. La pulizia delle cache vecchie è
   gestita dal SW stesso nell'evento `activate` (CACHE_NAME è
   versionato dal build): cancellarle qui a ogni page load
   azzererebbe la cache appena creata.
════════════════════════════════════════════════════════ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function () {});
  });
}
