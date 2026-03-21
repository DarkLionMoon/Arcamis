/* ════════════════════════════════════
   ARCAMIS — subclass-gallery.js
   Layout sidebar + contenuto inline
   per il database Sottoclassi Homebrew.
   Stile ispirato a 5etools.
════════════════════════════════════ */

var HB_SUBCLASS_DB_ID = '2f70274fdc1c803ca5cafa97ca1817cd';

/* ── Colori per classe ── */
var _hbClassColors = {
  'Artefice':  '#4da6c8',
  'Artificer': '#4da6c8',
  'Barbaro':   '#c84d4d',
  'Barbarian': '#c84d4d',
  'Bardo':     '#c87dc8',
  'Bard':      '#c87dc8',
  'Chierico':  '#c8b84d',
  'Cleric':    '#c8b84d',
  'Druido':    '#6ac84d',
  'Druid':     '#6ac84d',
  'Guerriero': '#c87040',
  'Fighter':   '#c87040',
  'Monaco':    '#4dc8a0',
  'Monk':      '#4dc8a0',
  'Paladino':  '#c8c04d',
  'Paladin':   '#c8c04d',
  'Ranger':    '#5ac84d',
  'Ladro':     '#a04dc8',
  'Rogue':     '#a04dc8',
  'Stregone':  '#c84d7d',
  'Sorcerer':  '#c84d7d',
  'Warlock':   '#7d4dc8',
  'Mago':      '#4d7dc8',
  'Wizard':    '#4d7dc8',
  'default':   '#c89b3c'
};

function _hbColor(classe) {
  if (!classe) return _hbClassColors['default'];
  for (var k in _hbClassColors) {
    if (classe.toLowerCase() === k.toLowerCase()) return _hbClassColors[k];
  }
  return _hbClassColors['default'];
}

/* ── CSS iniettato una volta sola ── */
function _injectHbCSS() {
  if (document.getElementById('hb-sc-css')) return;
  var s = document.createElement('style');
  s.id = 'hb-sc-css';
  s.textContent = `
.hb-sc-wrap {
  display:grid;
  grid-template-columns:220px 1fr;
  gap:0;
  min-height:500px;
  border:1px solid rgba(200,155,60,.15);
  overflow:hidden;
  position:relative;
}

/* ── Sidebar ── */
.hb-sc-sidebar {
  border-right:1px solid rgba(200,155,60,.12);
  background:rgba(4,5,12,.6);
  display:flex;
  flex-direction:column;
  overflow:hidden;
}
.hb-sc-search-wrap {
  padding:10px 12px;
  border-bottom:1px solid rgba(200,155,60,.1);
  flex-shrink:0;
}
.hb-sc-search {
  width:100%;
  background:rgba(0,0,0,.4);
  border:1px solid rgba(200,155,60,.18);
  color:var(--white);
  font-family:'Crimson Pro',serif;
  font-size:13px;
  padding:6px 10px;
  outline:none;
  transition:border-color .18s;
  box-sizing:border-box;
}
.hb-sc-search:focus { border-color:rgba(200,155,60,.5); }
.hb-sc-search::placeholder { color:rgba(200,155,60,.25);font-style:italic; }

.hb-sc-filters {
  padding:8px 12px;
  border-bottom:1px solid rgba(200,155,60,.08);
  display:flex;flex-wrap:wrap;gap:5px;
  flex-shrink:0;
}
.hb-sc-filt {
  font-family:'Cinzel',serif;font-size:7px;letter-spacing:.1em;
  padding:3px 8px;border:1px solid rgba(200,155,60,.18);
  background:transparent;color:rgba(200,155,60,.45);
  cursor:pointer;transition:.15s;text-transform:uppercase;
}
.hb-sc-filt:hover { border-color:rgba(200,155,60,.4);color:rgba(200,155,60,.8); }
.hb-sc-filt.active {
  border-color:var(--hb-fc,rgba(200,155,60,.7));
  background:rgba(200,155,60,.08);
  color:var(--hb-fc,rgba(200,155,60,.9));
}

.hb-sc-list {
  flex:1;overflow-y:auto;
}
.hb-sc-list::-webkit-scrollbar { width:3px; }
.hb-sc-list::-webkit-scrollbar-thumb { background:rgba(200,155,60,.2); }

.hb-sc-group-label {
  font-family:'Cinzel',serif;font-size:7.5px;letter-spacing:.22em;
  color:rgba(200,155,60,.4);text-transform:uppercase;
  padding:10px 14px 5px;
  border-top:1px solid rgba(200,155,60,.06);
  position:sticky;top:0;
  background:rgba(4,5,12,.95);
  z-index:2;
}
.hb-sc-item {
  display:flex;align-items:center;gap:8px;
  padding:7px 14px;cursor:pointer;
  transition:background .12s,color .12s;
  border-left:2px solid transparent;
  font-size:13.5px;color:var(--text);
  position:relative;
}
.hb-sc-item:hover {
  background:rgba(200,155,60,.05);
  color:var(--parch);
}
.hb-sc-item.active {
  background:rgba(200,155,60,.08);
  border-left-color:var(--hb-ic,rgba(200,155,60,.7));
  color:var(--parch);
}
.hb-sc-item-dot {
  width:5px;height:5px;border-radius:50%;
  background:var(--hb-ic,rgba(200,155,60,.5));
  flex-shrink:0;
}
.hb-sc-item-name { flex:1;line-height:1.35; }
.hb-sc-item-class {
  font-family:'Cinzel',serif;font-size:7px;letter-spacing:.08em;
  color:var(--hb-ic,rgba(200,155,60,.5));
  opacity:.7;flex-shrink:0;
}

/* ── Contenuto destra ── */
.hb-sc-content {
  background:rgba(6,8,18,.5);
  overflow-y:auto;
  position:relative;
}
.hb-sc-content::-webkit-scrollbar { width:3px; }
.hb-sc-content::-webkit-scrollbar-thumb { background:rgba(200,155,60,.2); }

.hb-sc-placeholder {
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  height:100%;min-height:400px;
  color:rgba(200,155,60,.2);
  font-family:'Cinzel',serif;font-size:10px;letter-spacing:.2em;
  text-transform:uppercase;gap:14px;
}
.hb-sc-placeholder-icon { font-size:40px;opacity:.3; }

.hb-sc-page {
  padding:28px 32px 40px;
  animation:hbPageIn .2s ease forwards;
}
@keyframes hbPageIn {
  from { opacity:0;transform:translateY(6px); }
  to   { opacity:1;transform:translateY(0); }
}
.hb-sc-page-header {
  display:flex;align-items:flex-start;gap:16px;
  margin-bottom:20px;padding-bottom:18px;
  border-bottom:1px solid rgba(200,155,60,.12);
}
.hb-sc-page-icon { font-size:32px;flex-shrink:0;margin-top:2px; }
.hb-sc-page-meta { flex:1; }
.hb-sc-page-classe {
  font-family:'Cinzel',serif;font-size:8px;letter-spacing:.25em;
  text-transform:uppercase;margin-bottom:6px;
  color:var(--hb-pc,rgba(200,155,60,.7));
}
.hb-sc-page-title {
  font-family:'Cinzel',serif;font-size:22px;font-weight:700;
  color:var(--white);letter-spacing:.04em;line-height:1.2;
  margin-bottom:4px;
}
.hb-sc-page-tag {
  display:inline-block;
  font-family:'Cinzel',serif;font-size:8px;letter-spacing:.12em;
  padding:3px 10px;border:1px solid var(--hb-pc,rgba(200,155,60,.4));
  color:var(--hb-pc,rgba(200,155,60,.8));
  background:rgba(0,0,0,.3);text-transform:uppercase;margin-top:6px;
}
.hb-sc-open-btn {
  display:inline-flex;align-items:center;gap:6px;
  font-family:'Cinzel',serif;font-size:8px;letter-spacing:.15em;
  padding:7px 16px;border:1px solid rgba(200,155,60,.3);
  background:rgba(200,155,60,.06);color:rgba(200,155,60,.7);
  cursor:pointer;transition:.18s;text-transform:uppercase;
  flex-shrink:0;margin-top:4px;
}
.hb-sc-open-btn:hover {
  background:rgba(200,155,60,.14);border-color:rgba(200,155,60,.5);
  color:var(--gold2);
}

.hb-sc-loading {
  display:flex;align-items:center;justify-content:center;
  height:200px;gap:12px;
  color:rgba(200,155,60,.4);font-family:'Cinzel',serif;
  font-size:9px;letter-spacing:.2em;flex-direction:column;
}
.hb-sc-spin {
  width:24px;height:24px;
  border:2px solid rgba(200,155,60,.15);
  border-top-color:rgba(200,155,60,.7);
  border-radius:50%;animation:hbSpin .8s linear infinite;
}
@keyframes hbSpin { to { transform:rotate(360deg); } }

.hb-sc-page-body { }
.hb-sc-page-body .nc>*+*{margin-top:.7em}

/* Nav tastiera */
.hb-sc-keynav {
  font-family:'Cinzel',serif;font-size:7px;letter-spacing:.1em;
  color:rgba(200,155,60,.3);padding:6px 14px;
  border-top:1px solid rgba(200,155,60,.06);
  flex-shrink:0;text-align:center;
}

@media(max-width:700px){
  .hb-sc-wrap { grid-template-columns:1fr; }
  .hb-sc-sidebar { max-height:280px; }
}
  `;
  document.head.appendChild(s);
}

/* ── Carica e renderizza ── */
window.loadSubclassGallery = function(container) {
  _injectHbCSS();
  container.innerHTML = '<div class="hb-sc-loading"><div class="hb-sc-spin"></div><span>Caricamento sottoclassi…</span></div>';

  fetch('/api/notion?dbId=' + HB_SUBCLASS_DB_ID)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      _renderHbGallery(container, data.pages || []);
    })
    .catch(function() {
      container.innerHTML = '<div class="hb-sc-loading">⚠️ Errore caricamento</div>';
    });
};

function _renderHbGallery(container, pages) {
  /* Raccogli classi uniche ordinate */
  var classi = [];
  pages.forEach(function(p) {
    var c = p.classe || p.tags && p.tags[0] || '';
    if (c && classi.indexOf(c) === -1) classi.push(c);
  });
  classi.sort();

  /* Sidebar: filtri */
  var filtersHtml = '<div class="hb-sc-filters" id="hb-filters">'
    + '<div class="hb-sc-filt active" data-filter="all" style="--hb-fc:rgba(200,155,60,.9)" onclick="hbFilter(this,\'all\')">Tutti</div>';
  classi.forEach(function(c) {
    var col = _hbColor(c);
    filtersHtml += '<div class="hb-sc-filt" data-filter="'+c+'" style="--hb-fc:'+col+'" onclick="hbFilter(this,\''+c+'\')">'+c+'</div>';
  });
  filtersHtml += '</div>';

  /* Sidebar: lista raggruppata per classe */
  var listHtml = '<div class="hb-sc-list" id="hb-list">';
  classi.forEach(function(c) {
    var items = pages.filter(function(p) {
      return (p.classe || (p.tags && p.tags[0]) || '') === c;
    });
    if (!items.length) return;
    var col = _hbColor(c);
    listHtml += '<div class="hb-sc-group-label" data-classe="'+c+'" style="color:'+col+'">'+c+'</div>';
    items.forEach(function(p) {
      listHtml += '<div class="hb-sc-item" id="hbsi-'+p.id+'" data-id="'+p.id+'" data-classe="'+c+'"'
        +' style="--hb-ic:'+col+'" onclick="hbSelectSubclass(\''+p.id+'\',\''+p.title.replace(/'/g,"\\'")+'\',\''+c+'\',\''+col+'\')">'
        +'<div class="hb-sc-item-dot"></div>'
        +'<div class="hb-sc-item-name">'+p.title+'</div>'
        +'</div>';
    });
  });
  listHtml += '</div>';

  container.innerHTML = '<div class="hb-sc-wrap">'
    + '<div class="hb-sc-sidebar">'
    + '<div class="hb-sc-search-wrap"><input class="hb-sc-search" placeholder="Cerca sottoclasse…" oninput="hbSearch(this.value)"/></div>'
    + filtersHtml
    + listHtml
    + '<div class="hb-sc-keynav">↑↓ per navigare · Invio per aprire</div>'
    + '</div>'
    + '<div class="hb-sc-content" id="hb-content">'
    + '<div class="hb-sc-placeholder"><div class="hb-sc-placeholder-icon">⚔</div>Seleziona una sottoclasse</div>'
    + '</div>'
    + '</div>';

  /* Keyboard nav */
  _hbInitKeys();
}

/* ── Seleziona e carica sottoclasse ── */
window.hbSelectSubclass = function(id, title, classe, color) {
  /* Attiva item sidebar */
  document.querySelectorAll('.hb-sc-item').forEach(function(el) { el.classList.remove('active'); });
  var item = document.getElementById('hbsi-'+id);
  if (item) {
    item.classList.add('active');
    item.scrollIntoView({ block:'nearest' });
  }

  var content = document.getElementById('hb-content');
  if (!content) return;

  content.innerHTML = '<div class="hb-sc-loading"><div class="hb-sc-spin"></div><span>Caricamento…</span></div>';

  /* Fetch pagina Notion */
  var cacheKey = 'pg_'+id;
  var cached = null;
  try { cached = sessionStorage.getItem(cacheKey); } catch(e){}

  var promise = cached
    ? Promise.resolve(JSON.parse(cached))
    : fetch('/api/notion?pageId='+id).then(function(r){ return r.json(); });

  promise.then(function(data) {
    if (!cached) {
      try { sessionStorage.setItem(cacheKey, JSON.stringify(data)); } catch(e){}
    }

    var pg = data.page || {};
    var bl = data.blocks || [];
    var icon = pg.icon && pg.icon.emoji ? pg.icon.emoji : '⚔';
    var html = renderBlocks(bl, true);

    content.innerHTML = '<div class="hb-sc-page" style="--hb-pc:'+color+'">'
      + '<div class="hb-sc-page-header">'
      + '<div class="hb-sc-page-icon">'+icon+'</div>'
      + '<div class="hb-sc-page-meta">'
      + '<div class="hb-sc-page-classe">Sottoclasse — '+classe+'</div>'
      + '<div class="hb-sc-page-title">'+title+'</div>'
      + '<div class="hb-sc-page-tag">'+classe+'</div>'
      + '</div>'
      + '<div class="hb-sc-open-btn" onclick="gp(\''+id+'\',\''+title.replace(/'/g,"\\'")+'\',\''+icon+'\')" title="Apri pagina completa">↗ Apri</div>'
      + '</div>'
      + '<div class="hb-sc-page-body nc">'+html+'</div>'
      + '</div>';

    /* Carica eventuali DB nelle sottopagine */
    loadDbGalleries(content);
  }).catch(function() {
    content.innerHTML = '<div class="hb-sc-loading">⚠️ Errore caricamento</div>';
  });
};

/* ── Filtro per classe ── */
window.hbFilter = function(btn, filter) {
  document.querySelectorAll('.hb-sc-filt').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');

  document.querySelectorAll('.hb-sc-item').forEach(function(el) {
    var c = el.getAttribute('data-classe') || '';
    el.style.display = (filter === 'all' || c === filter) ? '' : 'none';
  });
  document.querySelectorAll('.hb-sc-group-label').forEach(function(el) {
    var c = el.getAttribute('data-classe') || '';
    el.style.display = (filter === 'all' || c === filter) ? '' : 'none';
  });
};

/* ── Ricerca ── */
window.hbSearch = function(val) {
  var q = val.toLowerCase().trim();
  document.querySelectorAll('.hb-sc-item').forEach(function(el) {
    var name = el.querySelector('.hb-sc-item-name');
    var txt = name ? name.textContent.toLowerCase() : '';
    el.style.display = (!q || txt.indexOf(q) > -1) ? '' : 'none';
  });
  document.querySelectorAll('.hb-sc-group-label').forEach(function(grp) {
    var c = grp.getAttribute('data-classe');
    var hasVisible = false;
    document.querySelectorAll('.hb-sc-item[data-classe="'+c+'"]').forEach(function(el) {
      if (el.style.display !== 'none') hasVisible = true;
    });
    grp.style.display = hasVisible ? '' : 'none';
  });
  /* Reset filtri classe */
  if (q) {
    document.querySelectorAll('.hb-sc-filt').forEach(function(b) { b.classList.remove('active'); });
    document.querySelector('.hb-sc-filt[data-filter="all"]') && document.querySelector('.hb-sc-filt[data-filter="all"]').classList.add('active');
  }
};

/* ── Keyboard navigation ── */
function _hbInitKeys() {
  document.addEventListener('keydown', function(e) {
    var wrap = document.querySelector('.hb-sc-wrap');
    if (!wrap) return;
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter') return;
    var items = Array.from(document.querySelectorAll('.hb-sc-item')).filter(function(el) {
      return el.style.display !== 'none';
    });
    if (!items.length) return;
    var active = document.querySelector('.hb-sc-item.active');
    var idx = active ? items.indexOf(active) : -1;
    if (e.key === 'ArrowDown') { e.preventDefault(); idx = Math.min(idx+1, items.length-1); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); idx = Math.max(idx-1, 0); }
    if (e.key === 'Enter' && active) {
      active.click(); return;
    }
    if (items[idx]) items[idx].click();
  });
}
