/* ════════════════════════════════════
   library-gallery.js
   Biblioteca interattiva fantasy
   Scaffale 3D + filtri + animazione apertura libro
════════════════════════════════════ */

var BIBLIO_DB_ID = '3040274fdc1c80e0a0dccfa9761bff55';

/* Mappa colori Notion → CSS */
var _notionColors = {
  green:   '#4a7c59',
  blue:    '#3a6b9e',
  yellow:  '#9e7a1a',
  orange:  '#9e5a1a',
  red:     '#9e2a2a',
  purple:  '#6a3a9e',
  brown:   '#7a4a2a',
  gray:    '#555566',
  pink:    '#9e3a6a',
  default: '#555566'
};

/* Colori dorso libro per argomento */
var _spineColors = {
  'Arcamis':    { bg: '#1a3a2a', accent: '#4a7c59', text: '#a0d0b0' },
  'Botanica':   { bg: '#1a2a1a', accent: '#5a8a3a', text: '#90c080' },
  'Storia':     { bg: '#2a1a0a', accent: '#8a5a2a', text: '#d0a060' },
  'Geografia':  { bg: '#0a1a2a', accent: '#2a5a8a', text: '#70a0d0' },
  'Arcadia':    { bg: '#2a2a0a', accent: '#8a8a2a', text: '#d0d060' },
  'Shurima':    { bg: '#2a1500', accent: '#9a6010', text: '#e0a040' },
  'Ixtal':      { bg: '#1a0a2a', accent: '#6a2a8a', text: '#b060d0' },
  'Magia':      { bg: '#200a2a', accent: '#7a1a9a', text: '#c050e0' },
  'Void':       { bg: '#0a0a14', accent: '#3a2a6a', text: '#7060b0' },
  'PERICOLOSO': { bg: '#1e0404', accent: '#8a0a0a', text: '#d04040' },
  'Medicina':   { bg: '#0a1e1a', accent: '#2a7a6a', text: '#60c0a0' },
  'Alchimia':   { bg: '#1a0a18', accent: '#7a2a78', text: '#c060b0' },
  'Targon':     { bg: '#0a0e20', accent: '#2a3a8a', text: '#6080d0' },
  'Mitologia':  { bg: '#1a0808', accent: '#7a1a2a', text: '#c04060' },
  'default':    { bg: '#1a1408', accent: '#7a6030', text: '#c0a060' }
};

function _getSpineColor(argomenti) {
  if (!argomenti || !argomenti.length) return _spineColors['default'];
  return _spineColors[argomenti[0].name] || _spineColors['default'];
}

window.loadLibraryGallery = function(container) {
  container.innerHTML = '<div class="lib-loader"><div class="loader-dots"><div class="loader-dot"></div><div class="loader-dot"></div><div class="loader-dot"></div></div></div>';
  fetch('/api/notion?dbId=' + BIBLIO_DB_ID)
    .then(function(r) { return r.json(); })
    .then(function(data) { _renderLibrary(container, data.pages || []); })
    .catch(function(err) {
      container.innerHTML = '<p style="color:rgba(200,155,60,.5);font-family:Cinzel,serif;text-align:center;padding:40px">Errore nel risveglio delle pergamene.</p>';
      console.error(err);
    });
};

function _renderLibrary(container, pages) {
  /* Raccogli tutti gli argomenti unici */
  var allArgs = {};
  pages.forEach(function(p) {
    (p.argomenti || []).forEach(function(a) { allArgs[a.name] = a.color; });
  });
  /* Salva sul container per accesso da libOpenBook */
  container._libAllArgs = allArgs;
  var argKeys = Object.keys(allArgs).sort();

  /* HTML struttura */
  container.innerHTML =
    '<div class="lib-wrap">'+
      /* Filtri */
      '<div class="lib-filters">'+
        '<button class="lib-filter active" data-filter="all" onclick="libFilter(this,\'all\')">Tutti</button>'+
        argKeys.map(function(k) {
          var col = _notionColors[allArgs[k]] || '#888';
          return '<button class="lib-filter" data-filter="'+k+'" onclick="libFilter(this,\''+k+'\')" style="--fc:'+col+'">'+k+'</button>';
        }).join('')+
      '</div>'+
      /* Scaffale */
      '<div class="lib-shelf-wrap">'+
        '<div class="lib-shelf" id="lib-shelf">'+
          _renderShelf(pages)+
        '</div>'+
        '<div class="lib-shelf-base"></div>'+
      '</div>'+
      /* Info pannello */
      '<div class="lib-info" id="lib-info">'+
        '<div class="lib-info-placeholder">📖 Seleziona un libro</div>'+
      '</div>'+
    '</div>';

  container._libPages = pages;
  _injectLibCSS();
}

function _renderShelf(pages) {
  return pages.map(function(p, i) {
    var sc = _getSpineColor(p.argomenti);
    var titleSafe = p.title.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    var argStr = (p.argomenti||[]).map(function(a){return a.name;}).join(',');
    /* Altezza variabile per realismo */
    var h = 140 + Math.abs((_hash(p.id) % 40));
    /* Spessore variabile */
    var w = 28 + Math.abs((_hash(p.id + '1') % 18));
    /* Inclinazione lieve */
    var tilt = (_hash(p.id + '2') % 5) - 2;

    return '<div class="lib-book" data-id="'+p.id+'" data-title="'+titleSafe+'" data-args="'+argStr+'" '+
      'style="--sc-bg:'+sc.bg+';--sc-acc:'+sc.accent+';--sc-txt:'+sc.text+';--bh:'+h+'px;--bw:'+w+'px;--btilt:'+tilt+'deg" '+
      'onclick="libOpenBook(this)" onmouseenter="libHoverBook(this)" onmouseleave="libLeaveBook(this)">'+
      '<div class="lib-spine">'+
        '<div class="lib-spine-title">'+p.title+'</div>'+
        '<div class="lib-spine-deco"></div>'+
      '</div>'+
      '<div class="lib-book-top"></div>'+
      '<div class="lib-book-side"></div>'+
    '</div>';
  }).join('');
}

function _hash(str) {
  var h = 0;
  for (var i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

window.libFilter = function(btn, filter) {
  document.querySelectorAll('.lib-filter').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  document.querySelectorAll('.lib-book').forEach(function(book) {
    var args = book.getAttribute('data-args') || '';
    var show = filter === 'all' || args.split(',').indexOf(filter) > -1;
    book.style.opacity = show ? '1' : '0.15';
    book.style.pointerEvents = show ? 'auto' : 'none';
    book.style.transform = show ? '' : 'scaleY(0.92)';
  });
};

window.libHoverBook = function(el) {
  if (el.classList.contains('selected')) return;
  el.style.transform = 'translateY(-12px) rotate(var(--btilt)) scale(1.04)';
};

window.libLeaveBook = function(el) {
  if (el.classList.contains('selected')) return;
  el.style.transform = '';
};

window.libOpenBook = function(el) {
  var id = el.getAttribute('data-id');
  var title = el.getAttribute('data-title');

  /* Evidenzia libro selezionato */
  document.querySelectorAll('.lib-book').forEach(function(b){ b.classList.remove('selected'); b.style.transform = ''; });
  el.classList.add('selected');
  el.style.transform = 'translateY(-18px) rotate(var(--btilt)) scale(1.08)';

  /* Pannello info — loading */
  var info = document.getElementById('lib-info');
  if (!info) return;
  info.innerHTML = '<div class="lib-info-loading"><div class="loader-dots"><div class="loader-dot"></div><div class="loader-dot"></div><div class="loader-dot"></div></div></div>';
  info.classList.add('open');

  /* Cerca i dati della pagina */
  var container = el.closest('.lib-container, .hb-library-container, [class*="lib"]');
  /* Fetch pagina Notion */
  fetch('/api/notion?pageId=' + id)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.blocks) throw new Error('no blocks');

      /* Trova argomenti dal libro selezionato */
      var argStr = el.getAttribute('data-args') || '';
      var argomenti = argStr ? argStr.split(',').filter(Boolean) : [];
      var sc = _getSpineColor(argomenti.map(function(a){ return {name:a}; }));

      /* Leggi mappa colori dal container più vicino */
      var libContainer = el.closest('[class*="lib"]');
      var allArgsSaved = (libContainer && libContainer._libAllArgs) || {};
      var tagsHtml = argomenti.map(function(a) {
        var col = _notionColors[allArgsSaved[a]] || '#888';
        return '<span class="lib-tag" style="background:'+col+'22;border-color:'+col+'44;color:'+col+'">'+a+'</span>';
      }).join('');

      var html = renderBlocks(data.blocks, true);
      info.innerHTML =
        '<div class="lib-info-inner">'+
          '<div class="lib-info-header" style="--sc-acc:'+sc.accent+';--sc-bg:'+sc.bg+'">'+
            '<div class="lib-info-icon">📖</div>'+
            '<div>'+
              '<div class="lib-info-title">'+title+'</div>'+
              (tagsHtml ? '<div class="lib-info-tags">'+tagsHtml+'</div>' : '')+
            '</div>'+
          '</div>'+
          '<div class="lib-info-body n-body">'+html+'</div>'+
          '<div class="lib-info-footer">'+
            '<button class="lib-open-btn" onclick="gp(\''+id+'\',\''+title.replace(/'/g,"\\'")+'\',\'📖\')">Apri pagina completa →</button>'+
          '</div>'+
        '</div>';
    })
    .catch(function() {
      info.innerHTML = '<div class="lib-info-err">Errore caricamento</div>';
    });
};

function _injectLibCSS() {
  if (document.getElementById('lib-css')) return;
  var s = document.createElement('style');
  s.id = 'lib-css';
  s.textContent = `
/* ── Wrapper generale ── */
.lib-wrap {
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-columns: 1fr 340px;
  grid-template-areas: "filters filters" "shelf info";
  gap: 0;
  min-height: 520px;
  border: 1px solid rgba(200,155,60,.15);
  background: #06080e;
}

/* ── Filtri ── */
.lib-filters {
  grid-area: filters;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(200,155,60,.12);
  background: rgba(4,6,12,.8);
}
.lib-filter {
  font-family: 'Cinzel', serif;
  font-size: 9px;
  letter-spacing: .12em;
  text-transform: uppercase;
  padding: 5px 12px;
  border: 1px solid rgba(200,155,60,.2);
  background: transparent;
  color: rgba(200,155,60,.5);
  cursor: pointer;
  transition: .15s;
  border-radius: 2px;
}
.lib-filter:hover {
  background: rgba(200,155,60,.08);
  color: rgba(200,155,60,.9);
}
.lib-filter.active {
  background: rgba(200,155,60,.12);
  border-color: var(--fc, rgba(200,155,60,.6));
  color: var(--fc, rgba(200,155,60,.9));
}

/* ── Scaffale ── */
.lib-shelf-wrap {
  grid-area: shelf;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 40px 24px 0;
  background:
    radial-gradient(ellipse 80% 40% at 50% 100%, rgba(60,40,10,.4) 0%, transparent 70%),
    linear-gradient(180deg, #06080e 0%, #0c0e14 100%);
  min-height: 300px;
  position: relative;
  overflow-x: auto;
  overflow-y: visible;
}
.lib-shelf {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  padding: 0 8px 0;
  min-height: 200px;
}
.lib-shelf-base {
  height: 14px;
  background: linear-gradient(180deg, #3a2a10 0%, #2a1c08 60%, #1a1006 100%);
  border-top: 2px solid rgba(200,155,60,.4);
  box-shadow: 0 4px 20px rgba(0,0,0,.6);
  margin: 0 -24px;
  flex-shrink: 0;
}

/* ── Singolo libro ── */
.lib-book {
  position: relative;
  width: var(--bw, 32px);
  height: var(--bh, 160px);
  flex-shrink: 0;
  cursor: pointer;
  transform: rotate(var(--btilt, 0deg));
  transform-origin: bottom center;
  transition: transform .25s cubic-bezier(.34,1.56,.64,1), opacity .2s;
  filter: drop-shadow(2px 0 4px rgba(0,0,0,.5));
}
.lib-book.selected {
  filter: drop-shadow(0 0 12px rgba(200,155,60,.4)) drop-shadow(2px 0 4px rgba(0,0,0,.5));
}

/* Dorso */
.lib-spine {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    color-mix(in srgb, var(--sc-bg) 60%, #fff 5%) 0%,
    var(--sc-bg) 30%,
    color-mix(in srgb, var(--sc-bg) 80%, #000 20%) 70%,
    color-mix(in srgb, var(--sc-bg) 50%, #000 50%) 100%
  );
  border-left: 2px solid var(--sc-acc);
  border-right: 1px solid rgba(0,0,0,.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 8px 3px;
}
.lib-spine-title {
  font-family: 'Cinzel', serif;
  font-size: 7px;
  letter-spacing: .06em;
  color: var(--sc-txt);
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
  text-align: center;
  line-height: 1.3;
  max-height: 80%;
  overflow: hidden;
  opacity: .9;
}
.lib-spine-deco {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 1px;
  background: var(--sc-acc);
  opacity: .4;
}
.lib-spine-deco::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--sc-acc);
  opacity: .4;
  top: auto;
}

/* Parte superiore libro */
.lib-book-top {
  position: absolute;
  top: -5px;
  left: 2px;
  right: -4px;
  height: 5px;
  background: linear-gradient(90deg,
    color-mix(in srgb, var(--sc-bg) 90%, #fff 10%) 0%,
    color-mix(in srgb, var(--sc-bg) 70%, #fff 30%) 50%,
    color-mix(in srgb, var(--sc-bg) 80%, #fff 20%) 100%
  );
  transform: skewX(-45deg);
  transform-origin: left bottom;
}

/* Lato destro libro */
.lib-book-side {
  position: absolute;
  top: -4px;
  right: -4px;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--sc-bg) 60%, #fff 10%) 0%,
    color-mix(in srgb, var(--sc-bg) 40%, #000 30%) 100%
  );
  transform: skewY(-45deg);
  transform-origin: left top;
}

/* ── Pannello info ── */
.lib-info {
  grid-area: info;
  border-left: 1px solid rgba(200,155,60,.12);
  background: rgba(4,6,12,.95);
  overflow-y: auto;
  max-height: 100%;
  transition: opacity .2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}
.lib-info.open {
  align-items: flex-start;
}
.lib-info-placeholder {
  font-family: 'Cinzel', serif;
  font-size: 11px;
  letter-spacing: .1em;
  color: rgba(200,155,60,.2);
  text-align: center;
  padding: 40px 20px;
}
.lib-info-loading {
  display: flex;
  justify-content: center;
  padding: 60px;
}
.lib-info-err {
  color: rgba(200,60,60,.5);
  font-family: 'Cinzel', serif;
  font-size: 11px;
  padding: 40px;
  text-align: center;
}
.lib-info-inner {
  width: 100%;
}
.lib-info-header {
  padding: 20px 20px 14px;
  border-bottom: 1px solid rgba(200,155,60,.1);
  background: linear-gradient(135deg, var(--sc-bg, #0c0e14) 0%, rgba(4,6,12,.9) 100%);
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.lib-info-icon {
  font-size: 28px;
  flex-shrink: 0;
  margin-top: 2px;
}
.lib-info-title {
  font-family: 'Cinzel', serif;
  font-size: 14px;
  font-weight: 700;
  color: rgba(240,220,180,.95);
  letter-spacing: .04em;
  line-height: 1.4;
  margin-bottom: 8px;
}
.lib-info-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.lib-tag {
  font-family: 'Cinzel', serif;
  font-size: 8px;
  letter-spacing: .1em;
  padding: 2px 7px;
  border: 1px solid;
  border-radius: 2px;
  text-transform: uppercase;
}
.lib-info-body {
  padding: 16px 20px;
  font-size: 13px;
  max-height: 340px;
  overflow-y: auto;
}
.lib-info-footer {
  padding: 12px 20px 20px;
  border-top: 1px solid rgba(200,155,60,.1);
}
.lib-open-btn {
  font-family: 'Cinzel', serif;
  font-size: 9px;
  letter-spacing: .14em;
  text-transform: uppercase;
  padding: 8px 16px;
  border: 1px solid rgba(200,155,60,.4);
  background: rgba(200,155,60,.06);
  color: rgba(200,155,60,.8);
  cursor: pointer;
  transition: .15s;
  width: 100%;
}
.lib-open-btn:hover {
  background: rgba(200,155,60,.15);
  color: rgba(200,155,60,1);
  border-color: rgba(200,155,60,.7);
}

/* ── Loader ── */
.lib-loader {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80px;
}

/* ── Mobile ── */
@media (max-width: 640px) {
  .lib-wrap {
    grid-template-columns: 1fr;
    grid-template-areas: "filters" "shelf" "info";
  }
  .lib-info {
    border-left: none;
    border-top: 1px solid rgba(200,155,60,.12);
    min-height: 200px;
  }
  .lib-shelf-wrap {
    padding: 24px 12px 0;
  }
}
  `;
  document.head.appendChild(s);
}
