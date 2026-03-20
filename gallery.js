/* ════════════════════════════════════
   ARCAMIS — gallery.js
   Character Select Screen — Galleria PG
════════════════════════════════════ */

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
.gs-wrap{
  position:relative;width:100%;min-height:520px;
  background:linear-gradient(180deg,rgba(4,6,14,0) 0%,rgba(4,6,14,.8) 100%);
  overflow:hidden;
}
/* Filtri classe */
.gs-filters{
  display:flex;align-items:center;gap:8px;flex-wrap:wrap;
  margin-bottom:20px;padding:0 2px;
}
.gs-filter-btn{
  font-family:'Cinzel',serif;font-size:8px;font-weight:700;letter-spacing:.15em;
  padding:5px 14px;border:1px solid rgba(200,155,60,.2);
  background:rgba(200,155,60,.04);color:rgba(200,155,60,.5);
  cursor:pointer;transition:.2s;text-transform:uppercase;
}
.gs-filter-btn:hover{border-color:rgba(200,155,60,.4);color:rgba(200,155,60,.8)}
.gs-filter-btn.active{
  border-color:rgba(200,155,60,.7);background:rgba(200,155,60,.12);
  color:var(--gold2);box-shadow:0 0 12px rgba(200,155,60,.2);
}
/* Grid personaggi */
.gs-grid{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(120px,1fr));
  gap:8px;margin-bottom:24px;
}
.gs-card{
  position:relative;height:160px;cursor:pointer;overflow:hidden;
  border:1px solid rgba(255,255,255,.06);
  background:#0a0c14;
  transition:transform .22s cubic-bezier(.22,1,.36,1),border-color .22s,box-shadow .22s;
}
.gs-card:hover{
  transform:translateY(-6px) scale(1.03);
  border-color:rgba(200,155,60,.35);
  box-shadow:0 12px 32px rgba(0,0,0,.7),0 0 20px var(--gs-glow,rgba(200,155,60,.3));
}
.gs-card.selected{
  border-color:var(--gs-c,rgba(200,155,60,.8))!important;
  box-shadow:0 0 0 1px var(--gs-c,rgba(200,155,60,.5)),0 8px 32px rgba(0,0,0,.8),0 0 28px var(--gs-glow,rgba(200,155,60,.4))!important;
  transform:translateY(-4px) scale(1.02)!important;
}
.gs-card-bg{
  position:absolute;inset:0;background-size:cover;background-position:center top;
  transition:transform .4s ease;filter:brightness(.75) saturate(.9);
}
.gs-card:hover .gs-card-bg,.gs-card.selected .gs-card-bg{
  transform:scale(1.06);filter:brightness(.9) saturate(1.1);
}
.gs-card-overlay{
  position:absolute;inset:0;
  background:linear-gradient(0deg,rgba(4,6,14,.97) 0%,rgba(4,6,14,.4) 50%,transparent 100%);
}
.gs-card-name{
  position:absolute;bottom:6px;left:0;right:0;text-align:center;
  font-family:'Cinzel',serif;font-size:9px;font-weight:700;letter-spacing:.06em;
  color:var(--white);padding:0 4px;line-height:1.3;
  text-shadow:0 1px 6px rgba(0,0,0,.9);
}
.gs-card-tag{
  position:absolute;top:5px;left:5px;
  font-family:'Cinzel',serif;font-size:7px;letter-spacing:.1em;
  padding:2px 6px;border:1px solid var(--gs-c,rgba(200,155,60,.5));
  background:rgba(0,0,0,.6);color:var(--gs-c,rgba(200,155,60,.8));
  backdrop-filter:blur(4px);
}
.gs-card-icon{
  position:absolute;top:5px;right:5px;font-size:14px;
  text-shadow:0 2px 8px rgba(0,0,0,.8);
}
/* Pannello dettaglio */
.gs-detail{
  display:grid;grid-template-columns:280px 1fr;gap:0;
  background:rgba(6,8,18,.95);border:1px solid rgba(200,155,60,.18);
  overflow:hidden;position:relative;min-height:320px;
  box-shadow:0 20px 60px rgba(0,0,0,.8);
  transition:opacity .3s,transform .3s;
}
.gs-detail.hidden{opacity:0;transform:translateY(10px);pointer-events:none;height:0;overflow:hidden;border:none;margin:0}
.gs-detail-cover{
  position:relative;overflow:hidden;min-height:320px;
}
.gs-detail-cover-img{
  position:absolute;inset:0;background-size:cover;background-position:center top;
  filter:brightness(.8);transition:transform .6s ease;
}
.gs-detail:hover .gs-detail-cover-img{transform:scale(1.03)}
.gs-detail-cover-overlay{
  position:absolute;inset:0;
  background:linear-gradient(90deg,rgba(6,8,18,0) 60%,rgba(6,8,18,.95) 100%),
             linear-gradient(0deg,rgba(6,8,18,.6) 0%,transparent 50%);
}
.gs-detail-body{
  padding:28px 28px 24px;display:flex;flex-direction:column;justify-content:center;
  position:relative;z-index:2;
}
.gs-detail-eyebrow{
  font-family:'Cinzel',serif;font-size:8px;letter-spacing:.3em;
  color:var(--gs-acc,rgba(200,155,60,.7));text-transform:uppercase;
  margin-bottom:10px;display:flex;align-items:center;gap:8px;
}
.gs-detail-eyebrow::before{content:'';width:24px;height:1px;background:var(--gs-acc,rgba(200,155,60,.5))}
.gs-detail-name{
  font-family:'Cinzel',serif;font-size:26px;font-weight:900;
  color:var(--white);letter-spacing:.05em;line-height:1.15;margin-bottom:14px;
  text-shadow:0 2px 20px rgba(0,0,0,.8);
}
.gs-detail-tags{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}
.gs-detail-tag{
  font-family:'Cinzel',serif;font-size:9px;letter-spacing:.12em;
  padding:4px 12px;border:1px solid var(--gs-acc,rgba(200,155,60,.4));
  color:var(--gs-acc,rgba(200,155,60,.8));
  background:rgba(0,0,0,.4);text-transform:uppercase;
}
.gs-detail-btn{
  display:inline-flex;align-items:center;gap:8px;
  font-family:'Cinzel',serif;font-size:9px;font-weight:700;letter-spacing:.18em;
  padding:10px 22px;border:1px solid var(--gs-acc,rgba(200,155,60,.5));
  background:rgba(200,155,60,.08);color:var(--gs-acc,rgba(200,155,60,.9));
  cursor:pointer;transition:.2s;align-self:flex-start;text-transform:uppercase;
}
.gs-detail-btn:hover{
  background:rgba(200,155,60,.18);
  box-shadow:0 0 20px var(--gs-glow,rgba(200,155,60,.3));
}
/* Decorazione angoli */
.gs-corner{position:absolute;width:12px;height:12px;opacity:.5}
.gs-corner-tl{top:8px;left:8px;border-top:1px solid var(--gs-acc,rgba(200,155,60,.6));border-left:1px solid var(--gs-acc,rgba(200,155,60,.6))}
.gs-corner-tr{top:8px;right:8px;border-top:1px solid var(--gs-acc,rgba(200,155,60,.6));border-right:1px solid var(--gs-acc,rgba(200,155,60,.6))}
.gs-corner-bl{bottom:8px;left:8px;border-bottom:1px solid var(--gs-acc,rgba(200,155,60,.6));border-left:1px solid var(--gs-acc,rgba(200,155,60,.6))}
.gs-corner-br{bottom:8px;right:8px;border-bottom:1px solid var(--gs-acc,rgba(200,155,60,.6));border-right:1px solid var(--gs-acc,rgba(200,155,60,.6))}
/* Loading */
.gs-loading{
  display:flex;align-items:center;justify-content:center;
  height:200px;color:rgba(200,155,60,.4);
  font-family:'Cinzel',serif;font-size:10px;letter-spacing:.2em;
  flex-direction:column;gap:14px;
}
.gs-loading-spin{
  width:28px;height:28px;border:2px solid rgba(200,155,60,.15);
  border-top-color:rgba(200,155,60,.7);border-radius:50%;
  animation:gs-spin .8s linear infinite;
}
@keyframes gs-spin{to{transform:rotate(360deg)}}
@media(max-width:700px){
  .gs-detail{grid-template-columns:1fr}
  .gs-detail-cover{min-height:200px}
  .gs-grid{grid-template-columns:repeat(auto-fill,minmax(90px,1fr))}
  .gs-card{height:130px}
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
    var col = _getClassColor(p.tags);
    var tagLabel = p.tags && p.tags.length ? p.tags[0] : '';
    var nameSafe = p.title.replace(/'/g, "\\'");
    gridHtml += '<div class="gs-card" id="gsc-'+p.id+'"'
      + ' style="--gs-c:'+col.c+';--gs-glow:'+col.glow+'"'
      + ' data-tags="'+(p.tags||[]).join(',')+'"'
      + ' onclick="gsSelect(\''+p.id+'\',\''+nameSafe+'\')">'
      + (cover ? '<div class="gs-card-bg" style="background-image:url(\''+cover+'\')"></div>' : '<div class="gs-card-bg" style="background:'+col.bg+'"></div>')
      + '<div class="gs-card-overlay"></div>'
      + (tagLabel ? '<div class="gs-card-tag" style="--gs-c:'+col.c+'">'+tagLabel+'</div>' : '')
      + '<div class="gs-card-icon">'+p.icon+'</div>'
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
  var detail = document.getElementById('gs-detail');
  if (!detail) return;

  detail.classList.remove('hidden');
  detail.style.setProperty('--gs-acc', col.c);
  detail.style.setProperty('--gs-glow', col.glow);

  var tagsHtml = (p.tags||[]).map(function(t) {
    return '<div class="gs-detail-tag" style="--gs-acc:'+col.c+'">'+t+'</div>';
  }).join('');

  detail.innerHTML =
    '<div class="gs-detail-cover">'
    + (cover ? '<div class="gs-detail-cover-img" style="background-image:url(\''+cover+'\')"></div>' : '<div class="gs-detail-cover-img" style="background:'+col.bg+'"></div>')
    + '<div class="gs-detail-cover-overlay"></div>'
    + '</div>'
    + '<div class="gs-detail-body">'
    + '<div class="gs-corner gs-corner-tl"></div>'
    + '<div class="gs-corner gs-corner-tr"></div>'
    + '<div class="gs-corner gs-corner-bl"></div>'
    + '<div class="gs-corner gs-corner-br"></div>'
    + '<div class="gs-detail-eyebrow">Avventuriero</div>'
    + '<div class="gs-detail-name">'+p.title+'</div>'
    + (tagsHtml ? '<div class="gs-detail-tags">'+tagsHtml+'</div>' : '')
    + '<div class="gs-detail-btn" onclick="gp(\''+id+'\',\''+p.title.replace(/'/g,"\\'")+'\',\''+p.icon+'\')">'
    + '⚔ Apri scheda personaggio'
    + '</div>'
    + '</div>';

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
window.loadGallery = function(container) {
  container.innerHTML = '<div class="gs-loading"><div class="gs-loading-spin"></div><span>Caricamento eroi...</span></div>';

  fetch('/api/gallery')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      _galleryData = data.pages || [];
      renderGallery(container, _galleryData);
    })
    .catch(function(e) {
      container.innerHTML = '<div class="gs-loading">⚠️ Errore caricamento galleria</div>';
    });
};
