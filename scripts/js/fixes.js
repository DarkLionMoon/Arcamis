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
     2. INIT
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
/* ════ BUILD LAVORI NAV DINAMICO ════ */
function buildLavoriNav() {
  var empty = !window.LAVORI || !LAVERI.length;

  // Desktop: hide entire dropdown if empty
  var ddWrap = document.getElementById('dd-lavori');
  if (empty) {
    if (ddWrap) ddWrap.style.display = 'none';
    return;
  }

  var ddMenu = ddWrap && ddWrap.querySelector('.tn-menu--acc');
  if (ddMenu) {
    var bodies = ddMenu.querySelectorAll('.tn-acc-body');
    var lavoriBody = bodies[0];

    if (lavoriBody) {
      lavoriBody.innerHTML = '';
      LAVORI.forEach(function(v, i) {
        if (i === 2) lavoriBody.appendChild(_tnDiv()); // separatore dopo Forgia
        var el = _tnItem(v.i, v.l, function() { closeDd(); gp(v.id, v.l, v.i); });
        lavoriBody.appendChild(el);
      });
    }
  }

  // Mobile drawer
  var mnLavori = document.querySelector('#mobile-nav .mn-section--lavori');
  if (mnLavori) {
    mnLavori.innerHTML = '<div class="mn-label">Lavori</div>';
    LAVORI.forEach(function(v) {
      var el = _mnItem(v.i, v.l, function(id,l,i){ return function(){ closeMobileNav(); gp(id,l,i); }; }(v.id,v.l,v.i));
      mnLavori.appendChild(el);
    });
  }

  // Bottom nav
  var bnavLavori = document.querySelector('#bottom-nav .bnav-item[data-k="lavori"]');
  if (bnavLavori) bnavLavori.style.display = 'none';
}

function _tnItem(icon, label, fn) {
  var d = document.createElement('div');
  d.className = 'tn-item';
  d.innerHTML = '<span class="tn-ii">' + icon + '</span>' + label;
  d.addEventListener('click', fn);
  return d;
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
  return d;
}

document.addEventListener('DOMContentLoaded', buildLavoriNav);
