/* ════════════════════════════════════
   ARCAMIS — codice-giuridico.js
   Pubblico Editto del Regno di Arcadia
   Fetch HTML da Google Docs
════════════════════════════════════ */

var _CODICE_DOC_ID = '1vht_pvOzfvNDLaibetb3bdXOxWwYCugq_Km_s9xmmAQ';
var _codiceData = null;

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
  var _alreadyIn = navStack.length && navStack[navStack.length-1].id === fakeId;
  if (!_alreadyIn) {
    navStack.push({ id: fakeId, label: 'Pubblico Editto del Regno di Arcadia', icon: '⚖️' });
  }
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

  if (_codiceData) {
    _renderCodice(pbody, _codiceData);
    if (typeof afterPageRender === 'function') afterPageRender();
    return;
  }

  fetch('https://docs.google.com/document/d/' + _CODICE_DOC_ID + '/export?format=html')
    .then(function(r) { return r.text(); })
    .then(function(html) {
      _codiceData = _parseHtml(html);
      _renderCodice(pbody, _codiceData);
      if (typeof afterPageRender === 'function') afterPageRender();
    })
    .catch(function() {
      pbody.innerHTML = '<div class="cg-err">⚠️ Impossibile caricare l\'editto. <a href="https://docs.google.com/document/d/' + _CODICE_DOC_ID + '/view" target="_blank" rel="noopener" style="color:var(--gold2)">Aprilo su Google Docs →</a></div>';
      if (typeof afterPageRender === 'function') afterPageRender();
    });
};

/* ════════════════════════════════════
   PARSER HTML
════════════════════════════════════ */
function _parseHtml(htmlStr) {
  var parser = new DOMParser();
  var doc = parser.parseFromString(htmlStr, 'text/html');
  var body = doc.body;
  if (!body) return { chapters: [] };

  var chapterEmojis = {
    'FONDAMENT': '🏛️', 'CATALOGO': '📋', 'OMICIDIO': '🩸',
    'ECCEZIONI': '⚔️', 'DIRITTI': '⚔️', 'REGIONALI': '🗺️',
    'COMMERCIALE': '💰', 'TARIFFE': '💰', 'PROCEDURE': '📝',
    'ARRESTO': '📝', 'PROCESSO': '📝', 'PRIGIONI': '🔒',
    'GIUDIZIARIO': '⚖️', 'GIUDIZIA': '⚖️', 'CRIMINI': '⚠️',
  };

  function _getEmoji(title) {
    var up = (title || '').toUpperCase();
    for (var k in chapterEmojis) {
      if (up.indexOf(k) > -1) return chapterEmojis[k];
    }
    return '📜';
  }

  var romanRx = /^([IVX]+)\.\s*/;
  var chapters = [];
  var current = null;

  Array.from(body.childNodes).forEach(function(node) {
    if (node.nodeType !== 1) return;
    var tag = node.tagName.toLowerCase();
    var text = (node.textContent || '').trim();
    if (!text && tag !== 'table') return;

    if (tag === 'h1') {
      var m = text.match(romanRx);
      var numeral = m ? m[1] : '';
      var title = text.replace(romanRx, '').replace(/^\s*[🏛️⚔️🩸🗺️💰📝🔒⚖️📋⚠️✦◆•·]/u, '').trim();
      current = {
        id: 'cap-' + (numeral ? numeral.toLowerCase() : _cgSlugify(title)),
        numeral: numeral,
        title: title,
        emoji: _getEmoji(title),
        nodes: []
      };
      chapters.push(current);
      return;
    }

    if (!current) {
      current = { id: 'cap-intro', numeral: '', title: 'Introduzione', emoji: '📜', nodes: [] };
      chapters.push(current);
    }
    current.nodes.push(node.cloneNode(true));
  });

  return { chapters: chapters.filter(function(c) { return c.nodes && c.nodes.length; }) };
}

function _cgSlugify(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
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
      + '<span class="cg-ch-emoji">' + ch.emoji + '</span>'
      + '<div class="cg-ch-info">'
      + (ch.numeral ? '<span class="cg-ch-num">' + ch.numeral + '.</span>' : '')
      + '<span class="cg-ch-label">' + ch.title + '</span>'
      + '</div>'
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

  var wrap = pbody.querySelector('.cg-wrap');
  if (wrap) wrap._cgData = data;

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

  var chapterDiv = document.createElement('div');
  chapterDiv.className = 'cg-chapter';

  /* Header */
  var header = document.createElement('div');
  header.className = 'cg-chapter-header';
  header.innerHTML =
    '<span class="cg-chapter-emoji">' + chapter.emoji + '</span>'
    + (chapter.numeral ? '<span class="cg-chapter-num">' + chapter.numeral + '.</span>' : '')
    + '<span class="cg-chapter-title">' + chapter.title + '</span>';
  chapterDiv.appendChild(header);

  /* Nodi */
  (chapter.nodes || []).forEach(function(node) {
    var rendered = _cgRenderNode(node);
    if (rendered) chapterDiv.appendChild(rendered);
  });

  content.innerHTML = '';
  content.appendChild(chapterDiv);

  var cgMain = content.closest('.cg-main');
  if (cgMain) cgMain.scrollTop = 0;
};

/* ════════════════════════════════════
   RENDER NODO
════════════════════════════════════ */
function _cgRenderNode(node) {
  var tag = node.tagName ? node.tagName.toLowerCase() : '';
  var text = (node.textContent || '').trim();

  if (!text && tag !== 'table') return null;

  if (tag === 'table') return _cgRenderTable(node);

  if (tag === 'h2' || tag === 'h3' || tag === 'h4') {
    var sh = document.createElement('div');
    sh.className = 'cg-subheading';
    sh.innerHTML = _cgInlineHtml(node);
    return sh;
  }

  if (tag === 'ul' || tag === 'ol') return _cgRenderList(node);

  if (tag === 'p') {
    var inline = _cgInlineHtml(node);
    if (!inline.trim()) return null;
    var p = document.createElement('p');
    p.className = 'cg-para';
    p.innerHTML = inline;
    return p;
  }

  if (tag === 'div') {
    var wrapper = document.createElement('div');
    Array.from(node.childNodes).forEach(function(child) {
      if (child.nodeType === 1) {
        var r = _cgRenderNode(child);
        if (r) wrapper.appendChild(r);
      }
    });
    return wrapper.childNodes.length ? wrapper : null;
  }

  return null;
}

function _cgInlineHtml(node) {
  var result = '';
  Array.from(node.childNodes).forEach(function(child) {
    if (child.nodeType === 3) {
      result += child.textContent;
    } else if (child.nodeType === 1) {
      var ct = child.tagName.toLowerCase();
      var inner = _cgInlineHtml(child);
      if (ct === 'b' || ct === 'strong') result += '<strong>' + inner + '</strong>';
      else if (ct === 'i' || ct === 'em') result += '<em>' + inner + '</em>';
      else if (ct === 'a') {
        var href = child.getAttribute('href') || '#';
        result += '<a href="' + href + '" target="_blank" rel="noopener" class="cg-link">' + inner + '</a>';
      } else if (ct === 'br') result += '<br>';
      else result += inner;
    }
  });
  return result;
}

function _cgRenderTable(tableNode) {
  var wrap = document.createElement('div');
  wrap.className = 'cg-table-wrap';
  var table = document.createElement('table');
  table.className = 'cg-table';
  var rows = tableNode.querySelectorAll('tr');
  rows.forEach(function(row, ri) {
    var tr = document.createElement('tr');
    row.querySelectorAll('td, th').forEach(function(cell) {
      var isHeader = cell.tagName.toLowerCase() === 'th' || ri === 0;
      var el = document.createElement(isHeader ? 'th' : 'td');
      el.innerHTML = _cgInlineHtml(cell);
      if (cell.colSpan > 1) el.colSpan = cell.colSpan;
      if (cell.rowSpan > 1) el.rowSpan = cell.rowSpan;
      tr.appendChild(el);
    });
    if (tr.childNodes.length) table.appendChild(tr);
  });
  wrap.appendChild(table);
  return wrap;
}

function _cgRenderList(listNode) {
  var tag = listNode.tagName.toLowerCase();
  var list = document.createElement(tag === 'ol' ? 'ol' : 'ul');
  list.className = 'cg-list';
  listNode.querySelectorAll('li').forEach(function(li) {
    var item = document.createElement('li');
    item.innerHTML = _cgInlineHtml(li);
    list.appendChild(item);
  });
  return list;
}

/* ════════════════════════════════════
   CSS
════════════════════════════════════ */
function _injectCodiceCSS() {
  if (document.getElementById('cg-css')) return;
  var s = document.createElement('style');
  s.id = 'cg-css';
  s.textContent = `
.cg-wrap { width: 100%; max-width: 100%; box-sizing: border-box; }
.cg-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  min-height: 70vh;
  border: 1px solid rgba(200,155,60,.15);
  width: 100%;
  overflow: hidden;
}
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
  background: rgba(4,6,14,.97);
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
.cg-ch-item:hover { background: rgba(200,155,60,.05); border-left-color: rgba(200,155,60,.2); }
.cg-ch-item.active { background: rgba(200,155,60,.08); border-left-color: rgba(200,155,60,.7); }
.cg-ch-emoji { font-size: 1em; flex-shrink: 0; margin-top: 2px; }
.cg-ch-info { display: flex; flex-direction: column; gap: 2px; }
.cg-ch-num {
  font-family: 'Cinzel', serif; font-size: 7px; font-weight: 700;
  color: rgba(200,155,60,.5); letter-spacing: .1em;
}
.cg-ch-item.active .cg-ch-num { color: rgba(200,155,60,.9); }
.cg-ch-label {
  font-family: 'Cinzel', serif; font-size: 10px;
  letter-spacing: .03em; color: rgba(220,200,160,.55); line-height: 1.4;
}
.cg-ch-item.active .cg-ch-label { color: rgba(220,200,160,.95); }
.cg-ch-item:hover .cg-ch-label { color: rgba(220,200,160,.85); }
.cg-main { overflow-y: auto; max-height: 82vh; background: rgba(6,8,18,.4); }
.cg-content { padding: 32px 40px 48px; }
.cg-chapter-header {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 28px; padding-bottom: 18px;
  border-bottom: 1px solid rgba(200,155,60,.2);
}
.cg-chapter-emoji { font-size: 1.6em; flex-shrink: 0; }
.cg-chapter-num {
  font-family: 'Cinzel', serif; font-size: 13px; font-weight: 700;
  color: rgba(200,155,60,.5); letter-spacing: .1em; flex-shrink: 0;
}
.cg-chapter-title {
  font-family: 'Cinzel', serif; font-size: 20px; font-weight: 700;
  color: rgba(240,225,190,.95); letter-spacing: .05em; line-height: 1.3;
}
.cg-subheading {
  font-family: 'Cinzel', serif; font-size: 11px; font-weight: 700;
  letter-spacing: .14em; color: rgba(200,155,60,.85); text-transform: uppercase;
  margin: 28px 0 14px; padding: 10px 14px;
  background: rgba(200,155,60,.04); border-left: 3px solid rgba(200,155,60,.4);
}
.cg-para {
  font-family: 'Crimson Pro', serif; font-size: 16px;
  line-height: 1.8; color: rgba(220,200,160,.75); margin: 0 0 12px;
}
.cg-para strong, .cg-list li strong { color: rgba(240,220,180,.95); }
.cg-para em { color: rgba(200,180,140,.8); font-style: italic; }
.cg-list { margin: 0 0 16px 0; padding-left: 22px; }
.cg-list li {
  font-family: 'Crimson Pro', serif; font-size: 15px;
  line-height: 1.75; color: rgba(220,200,160,.7); margin-bottom: 5px; padding-left: 4px;
}
.cg-list li::marker { color: rgba(200,155,60,.5); }
.cg-table-wrap {
  overflow-x: auto; margin: 16px 0 24px;
  border: 1px solid rgba(200,155,60,.12);
}
.cg-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.cg-table th {
  background: rgba(0,0,0,.6); color: rgba(200,155,60,.85);
  font-family: 'Cinzel', serif; font-size: 8px; font-weight: 700;
  letter-spacing: .1em; padding: 10px 14px;
  border: 1px solid rgba(200,155,60,.15);
  text-align: left; text-transform: uppercase; white-space: nowrap;
}
.cg-table td {
  padding: 10px 14px; border: 1px solid rgba(200,155,60,.08);
  color: rgba(220,200,160,.75); font-family: 'Crimson Pro', serif;
  font-size: 14px; line-height: 1.6; vertical-align: top;
}
.cg-table tr:nth-child(even) td { background: rgba(200,155,60,.02); }
.cg-table tr:hover td { background: rgba(200,155,60,.05); }
.cg-table td:first-child {
  font-family: 'Cinzel', serif; font-size: 11px; font-weight: 700;
  color: rgba(240,220,180,.9); letter-spacing: .02em; min-width: 120px;
}
.cg-table td strong { color: rgba(240,220,180,.95); }
.cg-link {
  color: rgba(200,155,60,.8); text-decoration: none;
  border-bottom: 1px solid rgba(200,155,60,.3); transition: .15s;
}
.cg-link:hover { color: rgba(200,155,60,1); border-bottom-color: rgba(200,155,60,.7); }
.cg-loading {
  display: flex; align-items: center; justify-content: center; height: 300px;
  color: rgba(200,155,60,.4); font-family: 'Cinzel', serif;
  font-size: 10px; letter-spacing: .2em; flex-direction: column; gap: 14px;
}
.cg-spin {
  width: 28px; height: 28px; border: 2px solid rgba(200,155,60,.15);
  border-top-color: rgba(200,155,60,.7); border-radius: 50%;
  animation: cg-spin-anim .8s linear infinite;
}
@keyframes cg-spin-anim { to { transform: rotate(360deg); } }
.cg-err {
  padding: 60px 40px; text-align: center;
  font-family: 'Cinzel', serif; font-size: 11px;
  color: rgba(200,155,60,.4); letter-spacing: .1em;
}
@media (max-width: 700px) {
  .cg-layout { grid-template-columns: 1fr; }
  .cg-sidebar { border-right: none; border-bottom: 1px solid rgba(200,155,60,.15); max-height: 220px; }
  .cg-main { max-height: none; }
  .cg-content { padding: 20px 16px 32px; }
  .cg-chapter-title { font-size: 16px; }
  .cg-table td, .cg-table th { padding: 7px 10px; font-size: 12px; }
}
  `;
  document.head.appendChild(s);
}
