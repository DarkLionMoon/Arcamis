/* ════════════════════════════════════
   ARCAMIS — app.js
   Core di navigazione: PTR, popstate, _pathMap,
   deep link, toggle wiki, overlay, lazy background.
   NOTA: la sezione _pathMap è AUTO-GENERATA da
   sync-registry.py — NON MODIFICARLA A MANO.
   (Classic script — variabili globali condivise)
════════════════════════════════════ */

/* ════ PTR (Pull to Refresh) ════ */
(function(){
  var startY = 0, pulling = false, atTop = false, atTopTimer = null;
  var ind = document.getElementById('ptr-indicator');
  var mainEl = document.getElementById('main') || window;
  function onScroll(){
    var sy = mainEl.scrollTop !== undefined ? mainEl.scrollTop : window.scrollY;
    if(sy === 0){ if(!atTopTimer) atTopTimer = setTimeout(function(){ atTop = true; }, 300); }
    else { atTop = false; clearTimeout(atTopTimer); atTopTimer = null; }
  }
  mainEl.addEventListener('scroll', onScroll, {passive:true});
  document.addEventListener('touchstart', function(e){ if(atTop) startY = e.touches[0].clientY; else startY = 0; }, {passive:true});
  document.addEventListener('touchmove', function(e){ if(!startY) return; var dy = e.touches[0].clientY - startY; if(dy > 110){ pulling = true; if(ind) ind.classList.add('vis'); } }, {passive:true});
  document.addEventListener('touchend', function(){ if(pulling){ location.reload(); } pulling = false; startY = 0; if(ind) ind.classList.remove('vis'); });
})();

/* ════ POPSTATE ════ */
window.addEventListener('popstate', function(e){
  if(e && e.state && e.state.id){
    if(e.state.stack) navStack = JSON.parse(JSON.stringify(e.state.stack));
    gp(e.state.id, e.state.label || '', e.state.icon || '', true);
  } else {
    if(typeof showHome === 'function') showHome();
  }
});

/* ════ PATHNAME → PAGE ID MAP ════
   Mappa tutti i pathname puliti al loro UUID Notion (o id speciale).
   Usata dal deep link per risolvere il path al caricamento della pagina.
════════════════════════════════ */
var _pathMap = {
  'lore/la-storia-di-gandora': 'pag-la-storia-di-gandora',
  'regole/regole-del-server': 'pag-regole-del-server',
  'personaggio/materiale-approvato': 'pag-materiale-approvato',
  'lore/pantheon': 'pag-pantheon',
  'personaggio/lavori': 'pag-lavori',
  'personaggio/come-si-inizia': 'pag-come-si-inizia',
  'personaggio/andando-avanti': 'pag-andando-avanti',
  'in-game/maestria-titoli': 'pag-maestria-titoli',
  'in-game/casate-e-compagnie': 'pag-casate-e-compagnie',
  'lore/storia-del-mondo': 'pag-storia-del-mondo',
  'lore/introduzione': 'pag-introduzione',
  'lore/piani-di-esistenza': 'pag-piani-di-esistenza',
  'lore/bibliografia-scoperta': 'pag-bibliografia-scoperta',
  'lore/esplora-dal-vivo': 'pag-esplora-dal-vivo',
  'lore/materiale-extra': 'pag-materiale-extra',
  'lore/mappe': 'pag-mappe',
  'lore/mappa-arcamis': 'pag-mappa-arcamis',
  'lore/specie-homebrew': 'pag-specie-homebrew',
  'lore/regole-homebrew': 'pag-regole-homebrew',
  'lore/sottoclassi-homebrew': 'pag-sottoclassi-homebrew',
  'changelog': 'pag-changelog',
  'lore/arcamis': 'pag-arcamis',
  'lore/selva-fogliabruna': 'pag-selva-fogliabruna',
  'lore/foresta-dello-smarrimento': 'pag-foresta-dello-smarrimento',
  'lore/volonx': 'pag-volonx',
  'lore/vigilius': 'pag-vigilius',
  'lore/galeton': 'pag-galeton',
  'lore/lago-di-gromot': 'pag-lago-di-gromot',
  'lore/forte-vigilus': 'pag-forte-vigilus',
  'lore/riva-di-ferro': 'pag-riva-di-ferro',
  'lore/fumofosco': 'pag-fumofosco',
  'lore/rovine-di-kaldur': 'pag-rovine-di-kaldur',
  'lore/rivorosso': 'pag-rivorosso',
  'lore/circolo-dello-smarrimento': 'pag-circolo-dello-smarrimento',
  'lore/dimora-degli-ursidi': 'pag-dimora-degli-ursidi'
};

/* ════ DEEP LINK ════ */
(function(){
  /* 1. Prova il pathname pulito */
  var path = location.pathname.replace(/^\//, '').replace(/\/$/, '');
  /* 2. Fallback retrocompatibile: ?p= */
  var params = new URLSearchParams(location.search);
  var qp = params.get('p');

  /* Se siamo sulla root o index.html, niente da fare */
  if(!path && !qp) return;
  if(path === 'index.html') path = '';

  var pid = null;

  if(path && path.startsWith('p/')){
    /* Path automatico UUID: /p/2f00274f... */
    pid = path.replace('p/', '');
  } else if(path){
    /* Pagina divinità: /lore/pantheon/<slug> */
    if(path.indexOf('lore/pantheon/') === 0){
      pid = 'pantheon-' + path.split('/').pop();
    } else if(path.indexOf('personaggio/lavori/') === 0){
      /* Pagina lavoro: /personaggio/lavori/<slug> */
      pid = 'lavori-' + path.split('/').pop();
    } else {
      /* Risolvi il pathname nella mappa */
      var resolved = _pathMap[path];
      if(resolved){
        pid = resolved;
      } else {
        /* Pathname non mappato — trattalo come UUID diretto (es. /2f00274f...) */
        pid = path;
      }
    }
  } else if(qp) {
    /* Vecchio ?p= — supporto retrocompatibile */
    pid = qp;
  }

  if(!pid) return;

  /* Pagina Notion generica */
  var pg = getPage(pid) || {l:'Pagina', i:'📄', id:pid};
  gp(pg.id, pg.l, pg.i, true);
})();
/* ════ WIKI SECTION TOGGLE ════ */
function toggleWiki(){
  var content = document.getElementById('wiki-content');
  var arrow = document.getElementById('wiki-arrow');
  var wrap = document.getElementById('wiki-wrap');
  var btn = wrap && wrap.querySelector('.wiki-toggle-btn');
  if(!content) return;
  var open = content.classList.toggle('open');
  if(arrow) arrow.textContent = open ? '▼' : '▶';
  if(wrap) wrap.style.display = 'block';
  if(btn) btn.setAttribute('aria-expanded', String(open));
}

/* ════ CLOSE OVERLAY ════ */
function cv(){
  var overlay = document.getElementById('overlay');
  if(!overlay) return;
  overlay.classList.remove('ovopen');
  overlay.classList.add('ovclose');
  setTimeout(function(){ overlay.classList.remove('ovclose'); }, 160);
}
document.getElementById('overlay') && document.getElementById('overlay').addEventListener('click', function(e){
  if(e.target === this) cv();
});
/* ════ LAZY LOAD BACKGROUND-IMAGE ════ */
(function(){
  function _lazyBg(root){
    root = root || document;
    root.querySelectorAll('.loc-card[style*="background-image"], .gs-card .gs-card-bg[style*="background-image"]').forEach(function(el){
      if(el.dataset.lazyBgDone) return;
      el.dataset.lazyBgDone = '1';
      var io = new IntersectionObserver(function(entries, obs){
        entries.forEach(function(en){
          if(!en.isIntersecting) return;
          obs.unobserve(en.target);
          var bg = en.target.style.backgroundImage;
          en.target.style.backgroundImage = 'none';
          requestAnimationFrame(function(){ en.target.style.backgroundImage = bg; });
        });
      }, { rootMargin: '200px' });
      io.observe(el);
    });
  }
  window.onAfterPageRender(function(){
    setTimeout(function(){ _lazyBg(document.getElementById('pbody')); }, 500);
  });
})();
