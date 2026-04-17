/* ARCAMIS — gallery.js — Character Select Screen — Galleria PG */
   ARCAMIS — gallery.js
   Character Select Screen — Galleria PG
/* ARCAMIS — gallery.js — Character Select Screen — Galleria PG */ */

var _galleryData = null;
var _gallerySelected = null;
var _galleryFilter = 'all';

/* Colori per classe */
var _classColors = {
  'Fighter':   { c: 'rgba(220,70,50,.9)',   bg: 'rgba(180,40,30,.15)',  glow: 'rgba(220,70,50,.4)'  },
  'Ranger':    { c: 'rgba(60,180,80,.9)',    bg: 'rgba(30,140,50,.15)',  glow: 'rgba(60,180,80,.4)'  },
  'Wizard':    { c: 'rgba(100,140,240,.9)',  bg: 'rgba(60,100,200,.15)', glow: 'rgba(100,140,240,.4)'},
  'Rogue':     { c: 'rgba(180,80,220,.9)',   bg: 'rgba(140,50,180,.15)', glow: 'rgba(180,80,220,.4)' },
  'Cleric':    { c: 'rgba(240,200,60,.9)',   bg: 'rgba(200,155,30,.15)', glow: 'rgba(240,200,60,.4)' },
  'Barbarian': { c: 'rgba(220,120,40,.9)',   bg: 'rgba(180,80,20,.15)',  glow: 'rgba(220,120,40,.4)' },
  'Bard':      { c: 'rgba(240,100,160,.9)',  bg: 'rgba(200,60,120,.15)', glow: 'rgba(240,100,160,.4)'},
  'Paladin':   { c: 'rgba(220,200,100,.9)',  bg: 'rgba(180,160,60,.15)', glow: 'rgba(220,200,100,.4)'},
  'Monk':      { c: 'rgba(80,200,200,.9)',   bg: 'rgba(40,160,160,.15)', glow: 'rgba(80,200,200,.4)' },
  'Druid':     { c: 'rgba(100,180,60,.9)',   bg: 'rgba(60,140,30,.15)',  glow: 'rgba(100,180,60,.4)' },
  'Warlock':   { c: 'rgba(140,60,200,.9)',   bg: 'rgba(100,30,160,.15)', glow: 'rgba(140,60,200,.4)' },
  'Sorcerer':  { c: 'rgba(200,80,80,.9)',    bg: 'rgba(160,40,40,.15)',  glow: 'rgba(200,80,80,.4)'  },
  'Artificer': { c: 'rgba(80,160,220,.9)',   bg: 'rgba(40,120,180,.15)', glow: 'rgba(80,160,220,.4)' },
  'default':   { c: 'rgba(200,155,60,.9)',   bg: 'rgba(160,115,20,.15)', glow: 'rgba(200,155,60,.4)' }
};

function _getClassColor(tags) {
  if (!tags || !tags.length) return _classColors['default'];
  for (var i = 0; i < tags.length; i++) {
    for (var k in _classColors) {
      if (tags[i].toLowerCase().indexOf(k.toLowerCase()) > -1) return _classColors[k];
    }
  }
  return _classColors['default'];
}

function _safeCover(url) {
  if (!url) return null;
  if (url.indexOf('s3.us-west') > -1 || url.indexOf('prod-files-secure') > -1) {
    return '/api/notion?img=' + encodeURIComponent(url);
  }
  return url;
}

/* ── Inietta il CSS del character select ── */
function _injectGalleryCSS() {
  if (document.getElementById('gallery-css')) return;
  var s = document.createElement('style');
  s.id = 'gallery-css';
  s.textContent = `
/* ════ WRAP ════ */
.gs-wrap {
  position: relative;
  width: 100%;
  overflow: hidden;
}

/* ════ FILTRI ════ */
.gs-filters {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 28px;
  padding: 0;
  border-bottom: 1px solid rgba(200,155,60,.1);
  padding-bottom: 16px;
}
.gs-filter-btn {
  font-family: 'Cinzel', serif;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: .18em;
  padding: 7px 16px;
  border: 1px solid transparent;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: rgba(200,155,60,.35);
  cursor: pointer;
  transition: .2s;
  text-transform: uppercase;
  position: relative;
  margin-bottom: -17px;
}
.gs-filter-btn:hover {
  color: rgba(200,155,60,.7);
  background: rgba(200,155,60,.04);
}
.gs-filter-btn.active {
  color: var(--gold2, #c89b3c);
  border-bottom-color: var(--gold2, #c89b3c);
  background: rgba(200,155,60,.06);
}

/* ════ GRID ════ */
.gs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 6px;
  margin-bottom: 28px;
}

/* ════ CARD ════ */
.gs-card {
  position: relative;
  height: 190px;
  cursor: pointer;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,.05);
  border-bottom: 2px solid var(--gs-c, rgba(200,155,60,.3));
  background: #06080f;
  transition: transform .25s cubic-bezier(.22,1,.36,1),
              border-color .25s,
              box-shadow .25s;
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%);
}
.gs-card::before {
  content: '';
  position: absolute;
  top: 0; right: 0;
  width: 0; height: 0;
  border-style: solid;
  border-width: 0 12px 12px 0;
  border-color: transparent rgba(200,155,60,.15) transparent transparent;
  z-index: 3;
  transition: border-color .25s;
}
.gs-card:hover {
  transform: translateY(-8px) scale(1.02);
  border-bottom-color: var(--gs-c, rgba(200,155,60,.8));
  box-shadow:
    0 16px 40px rgba(0,0,0,.8),
    0 0 20px var(--gs-glow, rgba(200,155,60,.2)),
    inset 0 0 20px rgba(0,0,0,.3);
  z-index: 2;
}
.gs-card:hover::before {
  border-color: transparent var(--gs-c, rgba(200,155,60,.5)) transparent transparent;
}
.gs-card.selected {
  border-color: var(--gs-c, rgba(200,155,60,.8)) !important;
  border-bottom-width: 2px;
  box-shadow:
    0 0 0 1px var(--gs-c, rgba(200,155,60,.4)),
    0 12px 40px rgba(0,0,0,.9),
    0 0 30px var(--gs-glow, rgba(200,155,60,.35)) !important;
  transform: translateY(-6px) scale(1.02) !important;
  z-index: 2;
}
.gs-card.selected::before {
  border-color: transparent var(--gs-c, rgba(200,155,60,.8)) transparent transparent;
}

/* ════ CARD INTERNALS ════ */
.gs-card-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center top;
  transition: transform .5s ease, filter .3s ease;
  filter: brightness(.65) saturate(.85);
}
.gs-card:hover .gs-card-bg,
.gs-card.selected .gs-card-bg {
  transform: scale(1.08);
  filter: brightness(.85) saturate(1.15);
}
.gs-card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    0deg,
    rgba(4,6,14,.98) 0%,
    rgba(4,6,14,.6) 40%,
    rgba(4,6,14,.1) 70%,
    transparent 100%
  );
}
.gs-card:hover .gs-card-overlay {
  background: linear-gradient(
    0deg,
    rgba(4,6,14,.95) 0%,
    rgba(4,6,14,.4) 35%,
    transparent 65%
  );
}

/* Glow bottom */
.gs-card::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 60px;
  background: linear-gradient(0deg, var(--gs-glow, rgba(200,155,60,.15)), transparent);
  opacity: 0;
  transition: opacity .3s;
  pointer-events: none;
}
.gs-card:hover::after,
.gs-card.selected::after {
  opacity: 1;
}

.gs-card-name {
  position: absolute;
  bottom: 8px;
  left: 0; right: 0;
  text-align: center;
  font-family: 'Cinzel', serif;
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: .07em;
  color: rgba(240,230,210,.95);
  padding: 0 6px;
  line-height: 1.35;
  text-shadow: 0 1px 8px rgba(0,0,0,1), 0 0 20px rgba(0,0,0,.8);
  transition: color .2s, bottom .2s;
  z-index: 2;
}
.gs-card:hover .gs-card-name {
  color: #fff;
  bottom: 10px;
}

.gs-card-tag {
  position: absolute;
  top: 6px;
  left: 6px;
  font-family: 'Cinzel', serif;
  font-size: 6.5px;
  letter-spacing: .12em;
  padding: 2px 7px;
  border: 1px solid var(--gs-c, rgba(200,155,60,.4));
  background: rgba(0,0,0,.7);
  color: var(--gs-c, rgba(200,155,60,.8));
  backdrop-filter: blur(6px);
  text-transform: uppercase;
  z-index: 2;
}

/* ════ DETTAGLIO ════ */
.gs-detail {
  position: relative;
  display: grid;
  grid-template-columns: 260px 1fr;
  background: rgba(4,6,14,.97);
  border: 1px solid rgba(200,155,60,.15);
  border-left: 3px solid var(--gs-acc, rgba(200,155,60,.7));
  overflow: hidden;
  min-height: 300px;
  box-shadow: 0 24px 80px rgba(0,0,0,.9), 0 0 40px var(--gs-glow, rgba(200,155,60,.1));
  transition: opacity .35s ease, transform .35s ease;
  margin-top: 8px;
}
.gs-detail.hidden {
  opacity: 0;
  transform: translateY(12px);
  pointer-events: none;
  height: 0;
  overflow: hidden;
  border: none;
  margin: 0;
}

/* Sfondo panoramico sfocato */
.gs-detail::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: var(--gs-bg-img, none);
  background-size: cover;
  background-position: center top;
  filter: blur(20px) brightness(.25) saturate(.6);
  transform: scale(1.1);
  z-index: 0;
}

.gs-detail-cover {
  position: relative;
  overflow: hidden;
  min-height: 300px;
  z-index: 1;
}
.gs-detail-cover-img {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center top;
  filter: brightness(.9);
  transition: transform .6s ease;
}
.gs-detail:hover .gs-detail-cover-img {
  transform: scale(1.04);
}
.gs-detail-cover-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, transparent 50%, rgba(4,6,14,.97) 100%),
    linear-gradient(0deg, rgba(4,6,14,.5) 0%, transparent 40%);
}

.gs-detail-body {
  padding: 32px 32px 28px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.gs-detail-eyebrow {
  font-family: 'Cinzel', serif;
  font-size: 7.5px;
  letter-spacing: .35em;
  color: var(--gs-acc, rgba(200,155,60,.6));
  text-transform: uppercase;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.gs-detail-eyebrow::before {
  content: '';
  width: 28px;
  height: 1px;
  background: var(--gs-acc, rgba(200,155,60,.5));
}
.gs-detail-eyebrow::after {
  content: '◆';
  font-size: 6px;
  opacity: .6;
}

.gs-detail-name {
  font-family: 'Cinzel', serif;
  font-size: 28px;
  font-weight: 900;
  color: #fff;
  letter-spacing: .04em;
  line-height: 1.1;
  margin-bottom: 16px;
  text-shadow: 0 2px 30px rgba(0,0,0,.9), 0 0 60px var(--gs-glow, rgba(200,155,60,.2));
}

.gs-detail-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}
.gs-detail-tag {
  font-family: 'Cinzel', serif;
  font-size: 8px;
  letter-spacing: .15em;
  padding: 4px 14px;
  border: 1px solid var(--gs-acc, rgba(200,155,60,.4));
  color: var(--gs-acc, rgba(200,155,60,.9));
  background: rgba(0,0,0,.5);
  text-transform: uppercase;
  clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%);
}

.gs-detail-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: 'Cinzel', serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .2em;
  padding: 11px 24px;
  border: 1px solid var(--gs-acc, rgba(200,155,60,.5));
  background: rgba(200,155,60,.08);
  color: var(--gs-acc, rgba(200,155,60,.95));
  cursor: pointer;
  transition: .25s;
  align-self: flex-start;
  text-transform: uppercase;
  clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
}
.gs-detail-btn:hover {
  background: rgba(200,155,60,.18);
  box-shadow: 0 0 28px var(--gs-glow, rgba(200,155,60,.3));
  letter-spacing: .25em;
}

/* Angoli decorativi */
.gs-corner { position: absolute; width: 14px; height: 14px; opacity: .4; z-index: 3; }
.gs-corner-tl { top: 10px; left: 10px; border-top: 1px solid var(--gs-acc, rgba(200,155,60,.7)); border-left: 1px solid var(--gs-acc, rgba(200,155,60,.7)); }
.gs-corner-tr { top: 10px; right: 10px; border-top: 1px solid var(--gs-acc, rgba(200,155,60,.7)); border-right: 1px solid var(--gs-acc, rgba(200,155,60,.7)); }
.gs-corner-bl { bottom: 10px; left: 10px; border-bottom: 1px solid var(--gs-acc, rgba(200,155,60,.7)); border-left: 1px solid var(--gs-acc, rgba(200,155,60,.7)); }
.gs-corner-br { bottom: 10px; right: 10px; border-bottom: 1px solid var(--gs-acc, rgba(200,155,60,.7)); border-right: 1px solid var(--gs-acc, rgba(200,155,60,.7)); }

/* ════ LOADING ════ */
.gs-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: rgba(200,155,60,.4);
  font-family: 'Cinzel', serif;
  font-size: 10px;
  letter-spacing: .2em;
  flex-direction: column;
  gap: 14px;
}
.gs-loading-spin {
  width: 28px;
  height: 28px;
  border: 2px solid rgba(200,155,60,.15);
  border-top-color: rgba(200,155,60,.7);
  border-radius: 50%;
  animation: gs-spin .8s linear infinite;
}
@keyframes gs-spin { to { transform: rotate(360deg); } }

/* ════ MOBILE ════ */
@media (max-width: 700px) {
  .gs-detail { grid-template-columns: 1fr; }
  .gs-detail-cover { min-height: 220px; }
  .gs-detail-cover-overlay {
    background: linear-gradient(0deg, rgba(4,6,14,.97) 0%, transparent 60%);
  }
  .gs-grid { grid-template-columns: repeat(auto-fill, minmax(95px, 1fr)); gap: 5px; }
  .gs-card { height: 145px; }
  .gs-detail-name { font-size: 22px; }
  .gs-detail-body { padding: 24px 20px; }
}
/* ════ POSA SPLASH ════ */
.gs-posa {
  position: absolute;
  bottom: 0;
  right: 32px;
  height: 115%;
  width: auto;
  max-width: 55%;
  object-fit: contain;
  object-position: bottom center;
  filter: drop-shadow(-8px 0 32px rgba(0,0,0,.9));
  opacity: 0;
  transform: translateX(30px);
  transition: opacity .5s ease .1s, transform .5s cubic-bezier(.22,1,.36,1) .1s;
  pointer-events: none;
  z-index: 2;
}
.gs-posa.visible {
  opacity: 1;
  transform: translateX(0);
}
@media (max-width: 700px) {
  .gs-posa { display: none; }
}
`;
  document.head.appendChild(s);
}

/* ── Render del character select ── */
function renderGallery(container, pages) {
  _injectGalleryCSS();

  /* Raccogli tutte le classi uniche */
  var allTags = [];
  pages.forEach(function(p) {
    (p.tags || []).forEach(function(t) {
      if (allTags.indexOf(t) === -1) allTags.push(t);
    });
  });
  allTags.sort();

  /* HTML filtri */
  var filtersHtml = '<div class="gs-filters">';
  filtersHtml += '<div class="gs-filter-btn active" data-filter="all" onclick="gsFilter(this,\'all\')">Tutti</div>';
  allTags.forEach(function(t) {
    filtersHtml += '<div class="gs-filter-btn" data-filter="'+t+'" onclick="gsFilter(this,\''+t+'\')">'+t+'</div>';
  });
  filtersHtml += '</div>';

  /* HTML grid */
  var gridHtml = '<div class="gs-grid" id="gs-grid">';
  pages.forEach(function(p) {
    var cover = _safeCover(p.cover);
    var posa = p.posa ? _safeCover(p.posa) : null;
    var col = _getClassColor(p.tags);
    var tagLabel = p.tags && p.tags.length ? p.tags.join(' / ') : '';
    var nameSafe = p.title.replace(/'/g, "\\'");
    gridHtml += '<div class="gs-card" id="gsc-'+p.id+'"'
      + ' style="--gs-c:'+col.c+';--gs-glow:'+col.glow+'"'
      + ' data-tags="'+(p.tags||[]).join(',')+'"'
      + ' onclick="gsSelect(\''+p.id+'\',\''+nameSafe+'\')">'
      + (cover ? '<div class="gs-card-bg" style="background-image:url(\''+cover+'\')"></div>' : '<div class="gs-card-bg" style="background:'+col.bg+'"></div>')
      + '<div class="gs-card-overlay"></div>'
      + (tagLabel ? '<div class="gs-card-tag" style="--gs-c:'+col.c+'">'+tagLabel+'</div>' : '')
      + '<div class="gs-card-name">'+p.title+'</div>'
      + '</div>';
  });
  gridHtml += '</div>';

  /* Pannello dettaglio (vuoto inizialmente) */
  var detailHtml = '<div class="gs-detail hidden" id="gs-detail"></div>';

  container.innerHTML = '<div class="gs-wrap">'+filtersHtml+gridHtml+detailHtml+'</div>';
}

/* ── Seleziona un personaggio ── */
window.gsSelect = function(id, name) {
  /* Rimuovi selected da tutti */
  document.querySelectorAll('.gs-card').forEach(function(c) { c.classList.remove('selected'); });
  var card = document.getElementById('gsc-'+id);
  if (card) card.classList.add('selected');

  /* Trova i dati */
  var p = _galleryData && _galleryData.find(function(x) { return x.id === id; });
  if (!p) return;

  var col = _getClassColor(p.tags);
  var cover = _safeCover(p.cover);
  var posa = p.posa ? _safeCover(p.posa) : null;
  var detail = document.getElementById('gs-detail');
  if (!detail) return;

  detail.classList.remove('hidden');
  detail.style.setProperty('--gs-acc', col.c);
  detail.style.setProperty('--gs-glow', col.glow);
  detail.style.setProperty('--gs-bg-img', cover ? 'url(\''+cover+'\')' : 'none');

  var tagsHtml = (p.tags||[]).map(function(t) {
    var tc = _getClassColor([t]);
    return '<div class="gs-detail-tag" style="--gs-acc:'+tc.c+'">'+t+'</div>';
}).join('');
   
  detail.innerHTML =
    '<div class="gs-detail-cover">'
    + (cover ? '<div class="gs-detail-cover-img" style="background-image:url(\''+cover+'\')"></div>' : '<div class="gs-detail-cover-img" style="background:'+col.bg+'"></div>')
    + '<div class="gs-detail-cover-overlay"></div>'
    + (posa ? '<img class="gs-posa" id="gs-posa-img" src="'+posa+'" alt="">' : '')
    + '</div>'
    + '<div class="gs-detail-body">'
    + '<div class="gs-corner gs-corner-tl"></div>'
    + '<div class="gs-corner gs-corner-tr"></div>'
    + '<div class="gs-corner gs-corner-bl"></div>'
    + '<div class="gs-corner gs-corner-br"></div>'
    + '<div class="gs-detail-eyebrow">Avventuriero</div>'
    + '<div class="gs-detail-name">'+p.title+'</div>'
    + (tagsHtml ? '<div class="gs-detail-tags">'+tagsHtml+'</div>' : '')
    + '<div class="gs-detail-btn" onclick="gp(\''+id+'\',\''+p.title.replace(/'/g,"&apos;")+'\',\''+p.icon+'\')">'
    + '⚔ Apri scheda personaggio'
    + '</div>'
    + '</div>';

   if (posa) {
    setTimeout(function() {
      var img = document.getElementById('gs-posa-img');
      if (img) img.classList.add('visible');
    }, 50);
  }
   
  /* Scroll al dettaglio */
  setTimeout(function() {
    detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
};

/* ── Filtra per classe ── */
window.gsFilter = function(btn, filter) {
  document.querySelectorAll('.gs-filter-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  _galleryFilter = filter;

  document.querySelectorAll('.gs-card').forEach(function(card) {
    var tags = card.getAttribute('data-tags') || '';
    if (filter === 'all' || tags.indexOf(filter) > -1) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });

  /* Nascondi dettaglio se il personaggio selezionato non è visibile */
  var selected = document.querySelector('.gs-card.selected');
  if (selected && selected.style.display === 'none') {
    var detail = document.getElementById('gs-detail');
    if (detail) detail.classList.add('hidden');
  }
};

/* ── Funzione principale: carica e mostra la galleria ── */
/* ── Funzione principale: carica e mostra la galleria ── */
window.loadGallery = function(container) {
  container.innerHTML = '<div class="gs-loading"><div class="gs-loading-spin"></div><span>Caricamento eroi...</span></div>';

  function doFetch(attempt) {
    fetch('/api/gallery')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        _galleryData = data.pages || [];
        if (!_galleryData.length && attempt < 2) {
          setTimeout(function() { doFetch(attempt + 1); }, 800);
          return;
        }
        renderGallery(container, _galleryData);
      })
      .catch(function(e) {
        container.innerHTML = '<div class="gs-loading">⚠️ Errore caricamento galleria</div>';
      });
  }

  doFetch(0);
};
