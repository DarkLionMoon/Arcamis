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
  var detail = document.getElementById('gs-detail');
  if (!detail) return;

  detail.classList.remove('hidden');
  detail.style.setProperty('--gs-acc', col.c);
  detail.style.setProperty('--gs-glow', col.glow);

  var tagsHtml = (p.tags||[]).map(function(t) {
    var tc = _getClassColor([t]);
    return '<div class="gs-detail-tag" style="--gs-acc:'+tc.c+'">'+t+'</div>';
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
