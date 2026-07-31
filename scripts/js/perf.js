/* ════════════════════════════════════
   ARCAMIS — perf.js
   Ottimizzazioni performance:
   - Prefetch hover navbar & cards
   - SessionStorage TTL 30min
   - MemCache TTL + size limit
   - DNS prefetch dinamico
════════════════════════════════════ */

(function() {

  /* ════════════════════════════════
     1. DNS PREFETCH DINAMICO
     Inietta i tag dns-prefetch per
     i domini esterni usati dal sito
  ════════════════════════════════ */
  var dnsDomains = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'docs.google.com',
  ];
  dnsDomains.forEach(function(domain) {
    if (document.querySelector('link[rel="dns-prefetch"][href*="' + domain + '"]')) return;
    var l = document.createElement('link');
    l.rel = 'dns-prefetch';
    l.href = '//' + domain;
    document.head.appendChild(l);
    /* Preconnect per i font — riduce latenza TLS */
    if (domain.indexOf('gstatic') > -1 || domain.indexOf('googleapis') > -1) {
      var pc = document.createElement('link');
      pc.rel = 'preconnect';
      pc.href = 'https://' + domain;
      pc.crossOrigin = 'anonymous';
      document.head.appendChild(pc);
    }
  });

  /* ════════════════════════════════
     2. SESSIONSTORE CON TTL 30min
     Sovrascrive le funzioni di lettura
     in notion-nav.js aggiungendo TTL.
     Le scritture già avvengono in
     _gpRender — qui intercettiamo
     solo la lettura per scartare dati
     troppo vecchi.
  ════════════════════════════════ */
  var SS_TTL = 30 * 60 * 1000; // 30 minuti

  var _origGpRender = window._gpRender;

  /* Patch sessionStorage.getItem per aggiungere TTL */
  var _origGetItem = sessionStorage.getItem.bind(sessionStorage);
  var _origSetItem = sessionStorage.setItem.bind(sessionStorage);

  sessionStorage.getItem = function(key) {
    var raw = _origGetItem(key);
    if (!raw) return null;
    /* Prova a leggere wrapper con timestamp */
    try {
      var wrapper = JSON.parse(raw);
      if (wrapper && wrapper._arc_ts && wrapper._arc_data !== undefined) {
        if (Date.now() - wrapper._arc_ts > SS_TTL) {
          sessionStorage.removeItem(key);
          return null;
        }
        return wrapper._arc_data;
      }
    } catch(e) {}
    /* Dato vecchio senza wrapper — restituisci com'è */
    return raw;
  };

  sessionStorage.setItem = function(key, value) {
    /* Wrappa solo le chiavi pg_ di Arcamis */
    if (key.indexOf('pg_') === 0) {
      try {
        var wrapper = JSON.stringify({ _arc_ts: Date.now(), _arc_data: value });
        _origSetItem(key, wrapper);
        return;
      } catch(e) {}
    }
    _origSetItem(key, value);
  };

  /* ════════════════════════════════
     3. MEMCACHE TTL + SIZE LIMIT
     _memCache in notion-nav.js non ha
     limite. Aggiungiamo eviction LRU
     semplice: max 40 pagine, TTL 20min.
  ════════════════════════════════ */
  var MC_MAX = 40;
  var MC_TTL = 20 * 60 * 1000;

  /* Aspetta che _memCache sia definito */
  var _mcPatchInterval = setInterval(function() {
    if (typeof _memCache === 'undefined') return;
    clearInterval(_mcPatchInterval);

    /* Sostituisci _memCache con un Proxy che gestisce TTL */
    var _store = {};
    var _times = {};
    var _order = [];

    function _evict() {
      /* Rimuovi entrate scadute */
      var now = Date.now();
      Object.keys(_times).forEach(function(k) {
        if (now - _times[k] > MC_TTL) {
          delete _store[k];
          delete _times[k];
          var idx = _order.indexOf(k);
          if (idx > -1) _order.splice(idx, 1);
        }
      });
      /* Rimuovi le più vecchie se sopra il limite */
      while (_order.length > MC_MAX) {
        var oldest = _order.shift();
        delete _store[oldest];
        delete _times[oldest];
      }
    }

    /* Copia dati esistenti */
    Object.keys(_memCache).forEach(function(k) {
      _store[k] = _memCache[k];
      _times[k] = Date.now();
      _order.push(k);
    });

    /* Override delle proprietà tramite defineProperty */
    /* Non possiamo usare Proxy su tutti i browser target,
       quindi patchiamo prefetchPage e _gpRender invece */

    var _origPrefetch = window.prefetchPage;
    window.prefetchPage = function(id) {
  if (!id) return;
  var key = 'pg_' + id;
  /* Controlla sia _store locale che _memCache globale */
  if (_store[key] && _times[key] && Date.now() - _times[key] < MC_TTL) return;
  if (typeof _memCache !== 'undefined' && _memCache[key]) return;
      _evict();
      fetch('/api/notion?pageId=' + id)
        .then(function(r) { return r.json(); })
        .then(function(data) {
          _store[key] = data;
          _times[key] = Date.now();
          var idx = _order.indexOf(key);
          if (idx > -1) _order.splice(idx, 1);
          _order.push(key);
          /* Sincronizza con _memCache originale */
          _memCache[key] = data;
        })
        .catch(function() {});
    };

    /* Pulizia periodica ogni 5 minuti */
    setInterval(_evict, 5 * 60 * 1000);

  }, 100);

  /* ════════════════════════════════
     4. PREFETCH HOVER — NAVBAR
     Quando il mouse entra su un
     tn-item del navbar, prefetch
     silenzioso della pagina.
  ════════════════════════════════ */
  function _prefetchFromOnclick(el) {
    var onclick = el.getAttribute('onclick') || '';
    var m = onclick.match(/gp\(['"]([a-f0-9]{32})['"]/);
    if (m && m[1] && window.prefetchPage) {
      window.prefetchPage(m[1]);
    }
  }

  /* Attacca hover su tutti i tn-item esistenti */
  function _attachNavbarPrefetch() {
    document.querySelectorAll('.tn-item, .tn-drop > .tn').forEach(function(el) {
      if (el.dataset.pfAttached) return;
      el.dataset.pfAttached = '1';
      el.addEventListener('mouseenter', function() {
        _prefetchFromOnclick(el);
      }, { passive: true });
    });
  }

  /* ════════════════════════════════
     5. PREFETCH HOVER — CARDS
     Quando il mouse entra su una
     card nella pagina (loc-card,
     loc-banner, cp-icard, gs-card),
     prefetch silenzioso.
  ════════════════════════════════ */
  function _attachCardPrefetch(root) {
    root = root || document;
    var selectors = [
      '.loc-card', '.loc-banner', '.cp-icard',
      '.gs-card', '.n-db-card', '.lcard'
    ];
    root.querySelectorAll(selectors.join(',')).forEach(function(el) {
      if (el.dataset.pfAttached) return;
      el.dataset.pfAttached = '1';
      el.addEventListener('mouseenter', function() {
        _prefetchFromOnclick(el);
        /* Anche i figli con onclick */
        el.querySelectorAll('[onclick]').forEach(_prefetchFromOnclick);
      }, { passive: true });
    });
  }

  /* ════════════════════════════════
     6. PREFETCH HOVER — MOBILE NAV
     Stesso per il drawer mobile
  ════════════════════════════════ */
  function _attachMobileNavPrefetch() {
    document.querySelectorAll('.mn-item').forEach(function(el) {
      if (el.dataset.pfAttached) return;
      el.dataset.pfAttached = '1';
      el.addEventListener('touchstart', function() {
        _prefetchFromOnclick(el);
      }, { passive: true });
    });
  }

  /* ════════════════════════════════
     7. INIT + HOOK afterPageRender
  ════════════════════════════════ */
  function _init() {
    _attachNavbarPrefetch();
    _attachMobileNavPrefetch();
    _attachCardPrefetch(document);
  }

  /* Esegui subito + dopo ogni navigazione */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }

  /* Hook afterPageRender per riattaccare sulle nuove card */
  (function() {
    var _orig = window.afterPageRender;
    window.afterPageRender = function() {
      if (_orig) _orig();
      setTimeout(function() {
        _attachCardPrefetch(document.getElementById('pbody'));
      }, 400);
    };
  })();

  /* ════════════════════════════════
     8. PREFETCH ANTICIPATO PAGINE
     Dopo 2s dal load, prefetch
     silenzioso delle pagine più
     visitate non ancora in cache.
  ════════════════════════════════ */
  if(!window._reducedMotion) window.addEventListener('load', function() {
    setTimeout(function() {
      /* Pagine lavori — le più cliccate */
      var hotPages = [
        '2f00274fdc1c8089bfe6c24434d53b67', // Biblioteca
        '2f00274fdc1c801c9697e75caa8d5f13', // Bottega farmaceutica
        '2ff0274fdc1c80688dd6c2b293a1f626', // Caserma
        '2f00274fdc1c805ca01ec57f18d2ffee', // Forgia
        '2f00274fdc1c801b8c13cefd9e15694e', // Gilda avventurieri
        '2f00274fdc1c80faa99eda064ef0fabc', // Locanda
        '2f00274fdc1c807aa03cc6cbeb3687cc', // Ospedale
        '2ff0274fdc1c8035bad4f0b6ab705192', // Sartoria
      ];
      hotPages.forEach(function(id) {
        if (window.prefetchPage) window.prefetchPage(id);
      });
    }, 2000);
  });

})();
