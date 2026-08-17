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
    if(e.state.id.startsWith('mestiere-')){
      if(typeof showMestiere === 'function') showMestiere(e.state.id.replace('mestiere-', ''));
      return;
    }
    if(e.state.id === 'mestieri-compendio'){
      if(typeof showMestieriCompendio === 'function') showMestieriCompendio();
      return;
    }
    if(e.state.id === 'societa-licenze'){
      if(typeof showSocietaLicenze === 'function') showSocietaLicenze();
      return;
    }
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
  'lavori/gilda-avventurieri': '2f00274fdc1c801b8c13cefd9e15694e',
  'changelog': '3000274fdc1c8033a214c44a1aa7f01f',
  'maestria-titoli': '2f00274fdc1c802a9babd4239d97a319',
  'lore/la-storia-di-gandora': 'pag-la-storia-di-gandora',
  'regole/regole-del-server': 'pag-regole-del-server',
  'personaggio/materiale-approvato': 'pag-materiale-approvato',
  'lore/pantheon': 'pag-pantheon',
  'lavori/bottega-farmaceutica': '2f00274fdc1c801c9697e75caa8d5f13',
  'lavori/caserma': '2ff0274fdc1c80688dd6c2b293a1f626',
  'lavori/corporazione-costruttori': '2ff0274fdc1c80769a4ae243f22f0582',
  'lore/storia': '2f00274fdc1c806f8f17dbc6532d2211',
  'mappe': '2f10274fdc1c80489f23c49164747770',
  'homebrew': '2f00274fdc1c80e78ad7ce985007b7c6',
  'regole/gameplay/combattimento': '2f60274fdc1c80b7a729ef091b278682',
  'regole/gameplay/codex': '2f60274fdc1c80adb7a5d6beeef3e544',
  'homebrew/specie-hb': '2f00274fdc1c81a1bc4ddbf500704b80',
  'homebrew/classi-hb': '2f70274fdc1c803ca5cafa97ca1817cd',
  'homebrew/mscge': '2ff0274fdc1c8054a400c64b1fdd2ab9',
  'mestieri/guida': 'mestiere-come-funzionano',
  'mestieri/alchimista': 'mestiere-alchimista',
  'mestieri/architetto': 'mestiere-architetto',
  'mestieri/artigiano': 'mestiere-artigiano',
  'mestieri/artista': 'mestiere-artista',
  'mestieri/falegname': 'mestiere-falegname',
  'mestieri/metallurgo': 'mestiere-metallurgo',
  'mestieri/oste': 'mestiere-oste',
  'mestieri/sarto': 'mestiere-sarto',
  'mestieri/compendio': 'mestieri-compendio',
  'societa-licenze': 'societa-licenze',
  'lore/mondo/introduzione': '2f60274fdc1c80558d8fe99842377aef',
  'lore/mondo/introduzione/storia': '2fc0274fdc1c80c4bbc1c8806f591e0f',
  'lore/mondo/esplora-dal-vivo': '3090274fdc1c80008f0dffe3a677cb66',
  'lore/mondo/esplora-dal-vivo/marche-di-arcamis': '30d0274fdc1c805cbbc2daf73b5f3a66',
  'lore/mondo/extra': '3410274fdc1c805d891bcbda6364e0ad',
  'lore/mondo/bibliografia': '3040274fdc1c80ed816ef58f6a606f21',
  'lore/mondo/linguaggi': '2fb0274fdc1c8073addaf1d5a3e9768b',
  'lore/mondo/pde': '2fb0274fdc1c8080b07bd553e953c88d',
  'lore/mondo/npc': '2f90274fdc1c8015bf95f52c4e7681b8',
  'mappe/arcamis': '2f10274fdc1c80dca8caeb2e6de23146',
  'personaggio/andando-avanti': '5cea525d149f4acb9c59007bf6b3d5ff',
  'sottoclassi': '2f70274fdc1c80e3bdc7f95f81eb9cc0',
  'specie-homebrew': '2f60274fdc1c80fba671c588ba93b116'
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
    } else {
      /* Risolvi il pathname nella mappa */
      var resolved = _pathMap[path];
      if(resolved){
        pid = resolved;
      } else if(typeof _slugMap !== 'undefined' && _slugMap[path]){
        /* Supporto slug piatti legacy (es. /gameplay) */
        pid = _slugMap[path];
      } else {
        /* Pathname non mappato — trattalo come UUID diretto (es. /2f00274f...) */
        pid = path;
      }
    }
  } else if(qp) {
    /* Vecchio ?p= — supporto retrocompatibile */
    pid = (typeof _slugMap !== 'undefined' && _slugMap[qp]) ? _slugMap[qp] : qp;
  }

  if(!pid) return;

  /* Mestieri */
  if(pid.startsWith('mestiere-')){
    var key = pid.replace('mestiere-', '');
    setTimeout(function(){ if(typeof showMestiere === 'function') showMestiere(key); }, 0);
    return;
  }
  /* Pagine speciali JS */
  if(pid === 'mestieri-compendio'){
    setTimeout(function(){ if(typeof showMestieriCompendio === 'function') showMestieriCompendio(); }, 0);
    return;
  }
  if(pid === 'societa-licenze'){
    setTimeout(function(){ if(typeof showSocietaLicenze === 'function') showSocietaLicenze(); }, 0);
    return;
  }
  /* Pagina Notion generica */
  var pg = getPage(pid) || {l:'Pagina', i:'📄', id:pid};
  gp(pg.id, pg.l, pg.i, true);
})();
/* ════ WIKI SECTION TOGGLE ════ */
function toggleWiki(){
  var content = document.getElementById('wiki-content');
  var arrow = document.getElementById('wiki-arrow');
  var wrap = document.getElementById('wiki-wrap');
  if(!content) return;
  var open = content.classList.toggle('open');
  if(arrow) arrow.textContent = open ? '▼' : '▶';
  if(wrap) wrap.style.display = 'block';
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
