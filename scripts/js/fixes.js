/* ════════════════════════════════════
   ARCAMIS — fixes.js
   Fix vari:
   - Breadcrumb reset su navigazione navbar
═════════════════════════════════════ */

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
     2. KEYBOARD ACCESS
     Attiva con Enter/Space gli elementi
     non-native con onclick (div role=button,
     dot del carousel, pill, ecc.)
  ════════════════════════════════ */
  document.addEventListener('keydown', function(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (e.defaultPrevented) return; /* già gestito da altri handler (es. dropdown) */
    var t = e.target;
    if (!t || t.nodeType !== 1) return;
    var tag = t.tagName;
    if (tag === 'A' || tag === 'BUTTON' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (!t.getAttribute('onclick')) return;
    e.preventDefault();
    t.click();
  });

  /* Helper: rende focusable/attivabile da tastiera un elemento creato via JS */
  window._kbdActivate = function(el) {
    if (!el || el.dataset.kbdAttached) return el;
    el.dataset.kbdAttached = '1';
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
    });
    return el;
  };

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
  window.onAfterPageRender(function() {
    setTimeout(_attachNavReset, 100);
  });

})();
function toggleTnAcc(header) {
  var menu = header.closest('.tn-menu--acc');
  // chiudi tutti gli altri header della stessa menu
  menu.querySelectorAll('.tn-acc-header').forEach(function(h) {
    if (h !== header) {
      h.classList.remove('open');
      h.nextElementSibling.style.display = 'none';
    }
  });
  // toggle quello cliccato
  var isOpen = header.classList.contains('open');
  header.classList.toggle('open', !isOpen);
  header.nextElementSibling.style.display = isOpen ? 'none' : 'block';
}

function _tnItem(icon, label, fn) {
  var d = document.createElement('div');
  d.className = 'tn-item';
  d.innerHTML = '<span class="tn-ii">' + icon + '</span>' + label;
  d.addEventListener('click', fn);
  return window._kbdActivate ? window._kbdActivate(d) : d;
}
function _tnDiv() {
  var d = document.createElement('div');
  d.className = 'tn-div';
  return d;
}
function _mnItem(icon, label, fn) {
  var d = document.createElement('div');
  d.className = 'mn-item';
  d.innerHTML = '<span class="mn-ii">' + icon + '</span>' + label;
  d.addEventListener('click', fn);
  return window._kbdActivate ? window._kbdActivate(d) : d;
}

