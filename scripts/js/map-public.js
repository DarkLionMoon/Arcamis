/* ════════════════════════════════════
   ARCAMIS — map-public.js
   Contatore di esplorazione della mappa: "X luoghi esplorati su Y".
   Osserva le puntine rese da app-home.js (data-explored) e aggiorna
   il contatore sotto #arcamis-map. Non fa nulla se la mappa manca.
   (Classic script — variabili globali condivise)
════════════════════════════════════ */
(function () {
  'use strict';

  function update() {
    var pins = document.querySelectorAll('.mpin');
    if (!pins.length) return;
    var explored = 0;
    pins.forEach(function (p) {
      if (p.getAttribute('data-explored') === 'true') explored += 1;
    });
    var map = document.getElementById('arcamis-map');
    if (!map) return;
    var el = document.getElementById('map-fog-count');
    if (!el) {
      el = document.createElement('div');
      el.id = 'map-fog-count';
      el.className = 'map-fog-count';
      if (map.parentNode) map.parentNode.insertBefore(el, map.nextSibling);
      else return;
    }
    var pct = pins.length ? Math.round((explored / pins.length) * 100) : 0;
    el.textContent = '🗺️ ' + explored + ' luoghi esplorati su ' + pins.length + ' (' + pct + '%)';
  }

  window.arcMapFogCount = update;

  function observe() {
    var container = document.getElementById('dynamic-pins') || document.getElementById('arcamis-map');
    if (!container) return;
    update();
    if (typeof MutationObserver !== 'undefined') {
      var obs = new MutationObserver(function () {
        update();
      });
      obs.observe(container, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observe);
  } else {
    observe();
  }
})();
