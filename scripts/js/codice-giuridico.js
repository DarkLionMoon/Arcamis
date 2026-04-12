/* ════════════════════════════════════
   ARCAMIS — codice-giuridico.js
   Pubblico Editto del Regno di Arcadia
   Fetch da Google Docs + layout
   sidebar capitoli + contenuto
════════════════════════════════════ */

var _CODICE_DOC_ID = '1vht_pvOzfvNDLaibetb3bdXOxWwYCugq_Km_s9xmmAQ';
var _codiceData = null; /* { chapters: [{title, emoji, lines}] } */

/* ════════════════════════════════════
   ENTRY POINT
════════════════════════════════════ */
window.showCodiceGiuridico = function() {
  if (typeof navStack === 'undefined') {
    setTimeout(window.showCodiceGiuridico, 100);
    return;
  }

  _injectCodiceCSS();
  if (typeof closeDd === 'function') closeDd();

  var fakeId = 'codice-giuridico';
  navStack.push({ id: fakeId, label: 'Pubblico Editto del Regno di Arcadia', icon: '⚖️' });
  history.pushState(
    { id: fakeId, label: 'Pubblico Editto del Regno di Arcadia', icon: '⚖️', stack: navStack.slice(0, -1) },
    '', location.pathname + '?p=' + fakeId
  );

  var phTitle   = document.getElementById('ph-title');
  var phIcon    = document.getElementById('ph-icon');
  var phCovbg   = document.getElementById('ph-covbg');
  var phOverlay = document.getElementById('ph-overlay');
  var phEyebrow = document.getElementById('ph-eyebrow');
  var phSub     = document.getElementById('ph-sub');
  var phHero    = document.getElementById('page-hero');
  var phCrumb   = document.getElementById('ph-crumb');
  var hv        = document.getElementById('hv');

  phTitle.textContent   = 'Pubblico Editto del Regno di Arcadia';
  phIcon.textContent    = '⚖️';
  phEyebrow.textContent = 'Lore — Arcadia';
  phSub.textContent     = 'Il codice giuridico supremo che regola ogni crimine e ogni pena nel regno.';
  phCovbg.style.backgroundImage = '';
  phOverlay.style.opacity = '0';
  phIcon.style.opacity    = '0.06';
  phCrumb.innerHTML = buildCrumb('Pubblico Editto del Regno di Arcadia');
  document.title = 'Pubblico Editto — Arcamis';
  phHero.style.setProperty('--ph-acc', 'rgba(200,155,60,.8)');
  phHero.style.setProperty('--ph-accbg', 'rgba(200,155,60,.06)');

  var pbody = document.getElementById('pbody');
  pbody.style.maxWidth = 'none';
  pbody.style.width = '100%';

  if (hv && hv.style.display === 'block') {
    xfade(hv, document.getElementById('pv'));
    document.getElementById('main').scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    document.getElementById('main').scrollTo({ top: 0, behavior: 'smooth' });
    pbody.style.opacity = '0';
    pbody.style.transition = 'opacity .15s ease';
    setTimeout(function() { pbody.style.opacity = '1'; }, 50);
  }

  pbody.innerHTML = '<div class="cg-loading"><div class="cg-spin"></div><span>Caricamento editto...</span></div>';

  /* Usa dati in cache se disponibili */
  if (_codiceData) {
    _renderCodice(pbody, _codiceData);
    if (typeof afterPageRender === 'function') afterPageRender();
    return;
  }

  fetch('https://docs.google.com/document/d/' + _CODICE_DOC_ID + '/export?format=txt')
    .then(function(r) { return r.text(); })
    .then(function(text) {
      _codiceData = _parseDoc(text);
      _renderCodice(pbody, _codiceData);
      if (typeof afterPageRender === 'function') afterPageRender();
    })
    .catch(function(e) {
      pbody.innerHTML = '<div class="cg-err">⚠️ Impossibile caricare l\'editto. <a href="https://docs.google.com/document/d/' + _CODICE_DOC_ID + '/view" target="_blank" rel="noopener" style="color:var(--gold2)">Aprilo su Google Docs →</a></div>';
      if (typeof afterPageRender === 'function') afterPageRender();
    });
};

/* ════════════════════════════════════
   PARSER
   Divide il documento in capitoli
   basandosi sui titoli numerati romani
   (es. "I.", "II.", "III.") o
   su righe in MAIUSCOLO brevi
════════════════════════════════════ */
function _parseDoc(text) {
  var lines = text.split('\n').map(function(l) { return l.trimEnd(); });
  var chapters = [];
  var current = null;

  /* Emoji per capitolo basate su keyword */
  var chapterEmojis = {
    'FONDAMENT': '🏛️',
    'CATALOGO': '📋',
    'CRIMINI': '🔴',
    'OMICIDIO': '🩸',
    'ECCEZIONI': '⚔️',
    'DIRITTI': '⚔️',
    'REGIONALI': '🗺️',
    'COMMERCIALE': '💰',
    'TARIFFE': '💰',
    'PROCEDURE': '📝',
    'ARRESTO': '📝',
    'PROCESSO': '📝',
    'PRIGIONI': '🔒',
    'GIUDIZIARIO': '⚖️',
    'GIUDIZIA': '⚖️',
  };

  function _getEmoji(title) {
    var up = title.toUpperCase();
    for (var k in chapterEmojis) {
      if (up.indexOf(k) > -1) return chapterEmojis[k];
    }
    return '📜';
  }

  /* Regex: riga che inizia con numero romano + punto */
  var romanRx = /^([IVX]+)\.\s+(.+)/;

  lines.forEach(function(line) {
    var trimmed = line.trim();
    if (!trimmed) {
      if (current) current.lines.push('');
      return;
    }

    var m = trimmed.match(romanRx);
    if (m) {
      /* Nuovo capitolo */
      current = {
        id: 'cap-' + m[1].toLowerCase(),
        numeral: m[1],
        title: m[2].replace(/[📜🏛️⚖️⚔️🩸🗺️💰📋📝🔒]/g, '').trim(),
        emoji: _getEmoji(m[2]),
        lines: []
      };
      chapters.push(current);
      return;
    }

    /* Linea normale — aggiungi al capitolo corrente */
    if (current) {
      current.lines.push(trimmed);
    } else {
      /* Prima del primo capitolo — crea capitolo "Introduzione" */
      if (!chapters.length || chapters[0].id !== 'cap-intro') {
        current = { id: 'cap-intro', numeral: '', title: 'Introduzione', emoji: '📜', lines: [] };
        chapters.unshift(current);
      }
      current.lines.push(trimmed);
    }
  });

  /* Rimuovi capitoli vuoti */
  chapters = chapters.filter(function(c) {
    return c.lines.some(function(l) { return l.trim(); });
  });

  return { chapters: chapters };
}

/* ════════════════════════════════════
   RENDER LAYOUT
════════════════════════════════════ */
function _renderCodice(pbody, data) {
  var chapters = data.chapters;
  if (!chapters.length) {
    pbody.innerHTML = '<div class="cg-err">Nessun contenuto trovato.</div>';
    return;
  }

  var sidebarHtml = chapters.map(function(ch, i) {
    return '<li class="cg-ch-item' + (i === 0 ? ' active' : '') + '" data-id="' + ch.id + '" onclick="cgSelectChapter(this,\'' + ch.id + '\')">'
      + '<span class="cg-ch-num">' + (ch.numeral || '◆') + '</span>'
      + '<span class="cg-ch-label">' + ch.title + '</span>'
      + '</li>';
  }).join('');

  pbody.innerHTML =
    '<div class="cg-wrap nc" style="animation:fi .22s ease forwards">'
      + '<div class="cg-layout">'
        + '<aside class="cg-sidebar">'
          + '<div class="cg-sidebar-title">Capitoli</div>'
          + '<ul class="cg-ch-list">' + sidebarHtml + '</ul>'
        + '</aside>'
        + '<div class="cg-main">'
          + '<div class="cg-content" id="cg-content"></div>'
        + '</div>'
      + '</div>'
    + '</div>';

  /* Store data on element */
  var wrap = pbody.querySelector('.cg-wrap');
  if (wrap) wrap._cgData = data;

  /* Seleziona primo capitolo */
  var firstItem = pbody.querySelector('.cg-ch-item');
  if (firstItem) cgSelectChapter(firstItem, chapters[0].id);
}

/* ════════════════════════════════════
   SELEZIONE CAPITOLO
════════════════════════════════════ */
window.cgSelectChapter = function(el, chapterId) {
  document.querySelectorAll('.cg-ch-item').forEach(function(i) { i.classList.remove('active'); });
  el.classList.add('active');

  var wrap = el.closest('.cg-wrap');
  if (!wrap || !wrap._cgData) return;
  var chapter = wrap._cgData.chapters.find(function(c) { return c.id === chapterId; });
  if (!chapter) return;

  var content = document.getElementById('cg-content');
  if (!content) return;

  content.innerHTML = _renderChapter(chapter);

  /* Scroll top del contenuto */
  content.scrollTop = 0;
  var cgMain = content.closest('.cg-main');
  if (cgMain) cgMain.scrollTop = 0;
};

/* ════════════════════════════════════
   RENDER SINGOLO CAPITOLO
════════════════════════════════════ */
function _renderChapter(chapter) {
  var h = '<div class="cg-chapter">';
  h += '<div class="cg-chapter-header">'
    + '<span class="cg-chapter-emoji">' + chapter.emoji + '</span>'
    + (chapter.numeral ? '<span class="cg-chapter-num">' + chapter.numeral + '.</span>' : '')
    + '<span class="cg-chapter-title">' + chapter.title + '</span>'
    + '</div>';

  /* Processa le linee del capitolo */
  var lines = chapter.lines;
  var i = 0;

  while (i < lines.length) {
    var line = lines[i];

    /* Linea vuota */
    if (!line.trim()) { i++; continue; }

    /* Tabella: inizia con | */
    if (line.startsWith('|') || (line.trim().startsWith('|'))) {
      var tableLines = [];
      while (i < lines.length && (lines[i].trim().startsWith('|') || lines[i].trim().match(/^[-|: ]+$/))) {
        tableLines.push(lines[i]);
        i++;
      }
      h += _renderTable(tableLines);
      continue;
    }

    /* Sottotitolo: riga breve in maiuscolo o con emoji heading */
    var isHeading = _isHeadingLine(line);
    if (isHeading) {
      h += '<div class="cg-subheading">' + _cleanLine(line) + '</div>';
      i++;
      continue;
    }

    /* Lista puntata */
    if (line.match(/^[*•·-]\s+/) || line.match(/^\d+\.\s+/)) {
      var listLines = [];
      while (i < lines.length && (lines[i].match(/^[*•·-]\s+/) || lines[i].match(/^\d+\.\s+/) || (lines[i].startsWith('  ') && listLines.length))) {
        listLines.push(lines[i]);
        i++;
      }
      h += _renderList(listLines);
      continue;
    }

    /* Paragrafo normale */
    var paraLines = [];
    while (i < lines.length && lines[i].trim() && !lines[i].startsWith('|') && !_isHeadingLine(lines[i]) && !lines[i].match(/^[*•·-]\s+/) && !lines[i].match(/^\d+\.\s+/)) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length) {
      h += '<p class="cg-para">' + paraLines.map(_cleanLine).join(' ') + '</p>';
    }
  }

  h += '</div>';
  return h;
}

function _isHeadingLine(line) {
  var trimmed = line.trim();
  /* Emoji + testo breve */
  if (trimmed.match(/^[🏛️⚔️🩸🗺️💰📝🔒⚖️📋🔴🟡🟢🐉💼⚙️]/u) && trimmed.length < 100) return true;
  /* Testo in grassetto Markdown */
  if (trimmed.match(/^\*\*[^*]+\*\*$/) && trimmed.length < 100) return true;
  /* Numero + punto + testo breve */
  if (trimmed.match(/^\d+\.\s+[A-Z]/) && trimmed.length < 80) return true;
  return false;
}

function _cleanLine(line) {
  return line
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    /* Ripristina i tag HTML che abbiamo inserito */
    .replace(/&lt;strong&gt;/g, '<strong>')
    .replace(/&lt;\/strong&gt;/g, '</strong>')
    .replace(/&lt;em&gt;/g, '<em>')
    .replace(/&lt;\/em&gt;/g, '</em>');
}

function _renderList(lines) {
  var h = '<ul class="cg-list">';
  lines.forEach(function(line) {
    var text = line.replace(/^[*•·-]\s+/, '').replace(/^\d+\.\s+/, '');
    h += '<li>' + _cleanLine(text) + '</li>';
  });
  h += '</ul>';
  return h;
}

function _renderTable(lines) {
  /* Filtra righe separatore (es. | :---- | :---- |) */
  var dataLines = lines.filter(function(l) {
    return !l.trim().match(/^[\s|:-]+$/);
  });
  if (!dataLines.length) return '';

  var h = '<div class="cg-table-wrap"><table class="cg-table">';
  dataLines.forEach(function(line, idx) {
    var cells = line.split('|').map(function(c) { return c.trim(); }).filter(function(c, i, arr) {
      return i > 0 && i < arr.length - 1;
    });
    if (!cells.length) return;
    var tag = idx === 0 ? 'th' : 'td';
    h += '<tr>' + cells.map(function(c) {
      return '<' + tag + '>' + _cleanLine(c) + '</' + tag + '>';
    }).join('') + '</tr>';
  });
  h += '</table></div>';
  return h;
}

/* ════════════════════════════════════
   CSS
════════════════════════════════════ */
function _injectCodiceCSS() {
  if (document.getElementById('cg-css')) return;
  var s = document.createElement('style');
  s.id = 'cg-css';
  s.textContent = `
/* ── Layout ── */
.cg-wrap { width: 100%; max-width: 100%; box-sizing: border-box; }
.cg-layout {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  min-height: 70vh;
  border: 1px solid rgba(200,155,60,.15);
  width: 100%;
  overflow: hidden;
}

/* ── Sidebar ── */
.cg-sidebar {
  border-right: 1px solid rgba(200,155,60,.15);
  background: rgba(4,6,14,.7);
  overflow-y: auto;
  max-height: 82vh;
}
.cg-sidebar-title {
  font-family: 'Cinzel', serif;
  font-size: 7px;
  font-weight: 700;
  letter-spacing: .28em;
  color: rgba(200,155,60,.45);
  padding: 16px 18px 10px;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(200,155,60,.1);
  position: sticky;
  top: 0;
  background: rgba(4,6,14,.95);
  z-index: 1;
}
.cg-ch-list { list-style: none; margin: 0; padding: 8px 0; }
.cg-ch-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  transition: .15s;
  border-left: 2px solid transparent;
}
.cg-ch-item:hover {
  background: rgba(200,155,60,.05);
  border-left-color: rgba(200,155,60,.2);
}
.cg-ch-item.active {
  background: rgba(200,155,60,.08);
  border-left-color: rgba(200,155,60,.7);
}
.cg-ch-num {
  font-family: 'Cinzel', serif;
  font-size: 9px;
  font-weight: 700;
  color: rgba(200,155,60,.6);
  letter-spacing: .06em;
  flex-shrink: 0;
  min-width: 20px;
  margin-top: 1px;
}
.cg-ch-item.active .cg-ch-num { color: rgba(200,155,60,.95); }
.cg-ch-label {
  font-family: 'Cinzel', serif;
  font-size: 10px;
  letter-spacing: .03em;
  color: rgba(220,200,160,.55);
  line-height: 1.4;
}
.cg-ch-item.active .cg-ch-label { color: rgba(220,200,160,.95); }
.cg-ch-item:hover .cg-ch-label { color: rgba(220,200,160,.85); }

/* ── Main content ── */
.cg-main {
  overflow-y: auto;
  max-height: 82vh;
  background: rgba(6,8,18,.4);
}
.cg-content { padding: 32px 40px 48px; }

/* ── Chapter ── */
.cg-chapter-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(200,155,60,.2);
}
.cg-chapter-emoji { font-size: 1.6em; flex-shrink: 0; }
.cg-chapter-num {
  font-family: 'Cinzel', serif;
  font-size: 13px;
  font-weight: 700;
  color: rgba(200,155,60,.5);
  letter-spacing: .1em;
  flex-shrink: 0;
}
.cg-chapter-title {
  font-family: 'Cinzel', serif;
  font-size: 20px;
  font-weight: 700;
  color: rgba(240,225,190,.95);
  letter-spacing: .05em;
  line-height: 1.3;
}

/* ── Subheading ── */
.cg-subheading {
  font-family: 'Cinzel', serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .15em;
  color: rgba(200,155,60,.85);
  text-transform: uppercase;
  margin: 28px 0 14px;
  padding: 10px 14px;
  background: rgba(200,155,60,.04);
  border-left: 3px solid rgba(200,155,60,.4);
}

/* ── Paragrafo ── */
.cg-para {
  font-family: 'Crimson Pro', serif;
  font-size: 16px;
  line-height: 1.8;
  color: rgba(220,200,160,.75);
  margin: 0 0 14px;
}

/* ── Lista ── */
.cg-list {
  margin: 0 0 16px 0;
  padding-left: 20px;
}
.cg-list li {
  font-family: 'Crimson Pro', serif;
  font-size: 15px;
  line-height: 1.75;
  color: rgba(220,200,160,.7);
  margin-bottom: 6px;
  padding-left: 6px;
}
.cg-list li::marker { color: rgba(200,155,60,.5); }

/* ── Tabella ── */
.cg-table-wrap {
  overflow-x: auto;
  margin: 16px 0 24px;
  border: 1px solid rgba(200,155,60,.12);
}
.cg-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.cg-table th {
  background: rgba(0,0,0,.5);
  color: rgba(200,155,60,.85);
  font-family: 'Cinzel', serif;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: .12em;
  padding: 10px 14px;
  border: 1px solid rgba(200,155,60,.15);
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}
.cg-table td {
  padding: 9px 14px;
  border: 1px solid rgba(200,155,60,.08);
  color: rgba(220,200,160,.75);
  font-family: 'Crimson Pro', serif;
  font-size: 14px;
  line-height: 1.5;
  vertical-align: top;
}
.cg-table tr:nth-child(odd) td { background: rgba(200,155,60,.02); }
.cg-table tr:hover td { background: rgba(200,155,60,.05); }
.cg-table td:first-child {
  font-family: 'Cinzel', serif;
  font-size: 11px;
  font-weight: 700;
  color: rgba(240,220,180,.9);
  letter-spacing: .03em;
}

/* ── Loading / Error ── */
.cg-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: rgba(200,155,60,.4);
  font-family: 'Cinzel', serif;
  font-size: 10px;
  letter-spacing: .2em;
  flex-direction: column;
  gap: 14px;
}
.cg-spin {
  width: 28px; height: 28px;
  border: 2px solid rgba(200,155,60,.15);
  border-top-color: rgba(200,155,60,.7);
  border-radius: 50%;
  animation: cg-spin .8s linear infinite;
}
@keyframes cg-spin { to { transform: rotate(360deg); } }
.cg-err {
  padding: 60px 40px;
  text-align: center;
  font-family: 'Cinzel', serif;
  font-size: 11px;
  color: rgba(200,155,60,.4);
  letter-spacing: .1em;
}

/* ── Mobile ── */
@media (max-width: 700px) {
  .cg-layout { grid-template-columns: 1fr; }
  .cg-sidebar { border-right: none; border-bottom: 1px solid rgba(200,155,60,.15); max-height: 200px; }
  .cg-main { max-height: none; }
  .cg-content { padding: 20px 16px 32px; }
  .cg-chapter-title { font-size: 16px; }
}
  `;
  document.head.appendChild(s);
}
