/* ════════════════════════════════════
   ARCAMIS — fixes.js
   Fix vari:
   - Breadcrumb reset su navigazione navbar
   - Tab attivo mestieri su popstate/deeplink
════════════════════════════════════ */

(function() {

  /* ════════════════════════════════
     1. BREADCRUMB FIX
     Resetta navStack quando si clicca
     una voce del navbar (non una card
     dentro una pagina) o si torna home.
     
     La logica: se la navigazione parte
     da un click su navbar/mobile-nav,
     il navStack si svuota prima di
     pushare la nuova pagina.
     Questo fa sì che il breadcrumb
     mostri solo la catena corrente.
  ════════════════════════════════ */

  /* Patch showHome — già resetta la vista,
     ma navStack non viene svuotato */
  var _origShowHome = window.showHome;
  window.showHome = function() {
    if (typeof navStack !== 'undefined') navStack = [];
    if (_origShowHome) _origShowHome();
  };

  /* Attacca reset su tutti i tn-item del navbar desktop */
  function _attachNavReset() {
    document.querySelectorAll('.tn-item').forEach(function(el) {
      if (el.dataset.navResetAttached) return;
      el.dataset.navResetAttached = '1';
      el.addEventListener('click', function() {
        /* Resetta navStack prima della navigazione */
        if (typeof navStack !== 'undefined') navStack = [];
      }, true); /* capture: true per eseguire prima di gp() */
    });

    /* Mobile nav items */
    document.querySelectorAll('.mn-item').forEach(function(el) {
      if (el.dataset.navResetAttached) return;
      el.dataset.navResetAttached = '1';
      el.addEventListener('click', function() {
        if (typeof navStack !== 'undefined') navStack = [];
      }, true);
    });

    /* Bottom nav items */
    document.querySelectorAll('.bnav-item').forEach(function(el) {
      if (el.dataset.navResetAttached) return;
      el.dataset.navResetAttached = '1';
      el.addEventListener('click', function() {
        if (typeof navStack !== 'undefined') navStack = [];
      }, true);
    });
  }

  /* ════════════════════════════════
     2. TAB ATTIVO MESTIERI
     Quando si naviga a un mestiere
     via popstate o deeplink, il tab
     attivo viene ripristinato.
     
     Salviamo l'ultimo tab attivo
     per ogni mestiere in memoria.
  ════════════════════════════════ */
  var _mestiereLastTab = {}; /* { 'alchimista': 'LV 1', ... } */

  /* Patch msTabClick per salvare il tab attivo */
  var _origMsTabClick = null;
  var _mcPatchInterval = setInterval(function() {
    if (typeof window.msTabClick === 'undefined') return;
    clearInterval(_mcPatchInterval);

    _origMsTabClick = window.msTabClick;
    window.msTabClick = function(el) {
      /* Trova la chiave mestiere corrente dall'URL */
      var params = new URLSearchParams(location.search);
      var pid = params.get('p') || '';
      var key = pid.replace('mestiere-', '');
      if (key) _mestiereLastTab[key] = el.getAttribute('data-tab');
      if (_origMsTabClick) _origMsTabClick(el);
    };
  }, 200);

  /* Patch showMestiere per ripristinare il tab */
  var _smPatchInterval = setInterval(function() {
    if (typeof window.showMestiere === 'undefined') return;
    clearInterval(_smPatchInterval);

    var _origShowMestiere = window.showMestiere;
    window.showMestiere = function(key) {
      _origShowMestiere(key);
      /* Dopo il render, ripristina il tab se era stato salvato */
      var lastTab = _mestiereLastTab[key];
      if (!lastTab || lastTab === 'Introduzione') return;
      setTimeout(function() {
        var tabs = document.querySelectorAll('.ms-tab');
        tabs.forEach(function(tab) {
          if (tab.getAttribute('data-tab') === lastTab) {
            tab.click();
          }
        });
      }, 150);
    };
  }, 200);

  /* ════════════════════════════════
     3. INIT
  ════════════════════════════════ */
  function _init() {
    _attachNavReset();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }

  /* Riattacca dopo ogni navigazione (il mobile nav
     viene ricreato dinamicamente in alcuni casi) */
  (function() {
    var _orig = window.afterPageRender;
    window.afterPageRender = function() {
      if (_orig) _orig();
      setTimeout(_attachNavReset, 100);
    };
  })();

})();
