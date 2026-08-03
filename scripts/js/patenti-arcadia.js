/* ════════════════════════════════════
   ARCAMIS — patenti-arcadia.js
   Codice Patenti di Arcadia
   Fetch HTML da Google Docs
════════════════════════════════════ */

var _PATENTI_DOC_ID = '1VHhDaYADbsVu9yq00ESBcVzat2kqWa3NMkPV1tb_ccc';
var _patentiData = null;

/* ════════════════════════════════════
   ENTRY POINT
════════════════════════════════════ */
window.showPatenti = function() {
  if (typeof navStack === 'undefined') {
    setTimeout(window.showPatenti, 100);
    return;
  }

  _injectPatentiCSS();
  if (typeof closeDd === 'function') closeDd();

  var fakeId = 'patenti-arcadia';
  var _alreadyIn = navStack.length && navStack[navStack.length - 1].id === fakeId;
  if (!_alreadyIn) {
    navStack.push({ id: fakeId, label: 'Patenti di Arcadia', icon: '⚖️' });
  }
  history.pushState(
    { id: fakeId, label: 'Patenti di Arcadia', icon: '⚖️', stack: navStack.slice(0, -1) },
    '', '/patenti-arcadia'
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

  phTitle.textContent   = 'Patenti di Arcadia';
  phIcon.textContent    = '⚖️';
  phEyebrow.textContent = 'Mestieri — Arcadia';
  phSub.textContent     = 'Il sistema ufficiale di licenze per l\'esercizio dei mestieri nel Regno di Arcadia.';
  phCovbg.style.backgroundImage = '';
  phOverlay.style.opacity = '0';
  phIcon.style.opacity    = '0.06';
  phCrumb.innerHTML = buildCrumb('Patenti di Arcadia');
  document.title = 'Patenti di Arcadia — Arcamis';
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

  pbody.innerHTML = '<div class="pa-loading"><div class="pa-spin"></div><span>Caricamento patenti...</span></div>';

  if (_patentiData) {
    _renderPatenti(pbody, _patentiData);
    if (typeof afterPageRender === 'function') afterPageRender();
    return;
  }

  fetch('/data/static/patenti.html')
    .then(function(r) { return r.text(); })
    .then(function(html) {
      _patentiData = _parsePatentiHtml(html);
      _renderPatenti(pbody, _patentiData);
      if (typeof afterPageRender === 'function') afterPageRender();
    })
    .catch(function() {
      pbody.innerHTML = '<div class="pa-err">⚠️ Impossibile caricare le patenti. <a href="https://docs.google.com/document/d/' + _PATENTI_DOC_ID + '/view" target="_blank" rel="noopener" style="color:var(--gold2)">Aprilo su Google Docs →</a></div>';
      if (typeof afterPageRender === 'function') afterPageRender();
    });
};

/* ════════════════════════════════════
   PARSER HTML
   Struttura:
   sections[] → { id, title, emoji, level, nodes[] }
   Le H2 diventano sezioni principali (sidebar)
   Le H3 diventano sotto-sezioni (sidebar, indentate)
════════════════════════════════════ */
function _parsePatentiHtml(htmlStr) {
  var parser = new DOMParser();
  var doc = parser.parseFromString(htmlStr, 'text/html');
  var body = doc.body;
  if (!body) return { intro: [], sections: [] };

  /* Emoji map per titoli */
  var emojiMap = {
    'VANTAGGI':    '🌟',
    'QUADRO':      '📊',
    'DETTAGLIO':   '📜',
    'TECNICA':     '🧪',
    'MATERIALI':   '🧪',
    'ESAME':       '⚔️',
    'SANZION':     '🛑',
    'RINNOVI':     '📅',
    'SCADENZE':    '📅',
    'P.M.C':       '🔨',
    'P.M.T':       '⚒️',
    'P.A.S':       '⚗️',
    'P.O.E':       '🏆',
  };

  function _getEmoji(title) {
    var up = (title || '').toUpperCase();
    for (var k in emojiMap) {
      if (up.indexOf(k) > -1) return emojiMap[k];
    }
    return '📋';
  }

  function _paSlugify(str) {
    return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  }

  var intro = [];       /* nodi prima del primo h2 */
  var sections = [];
  var current = null;
  var secCounter = 0;

  Array.from(body.childNodes).forEach(function(node) {
    if (node.nodeType !== 1) return;
    var tag = node.tagName.toLowerCase();
    var text = (node.textContent || '').trim();
    if (!text && tag !== 'table') return;

    if (tag === 'h1') return; /* titolo doc, lo usiamo già nel ph-title */

    if (tag === 'h2') {
      secCounter++;
      var cleanTitle = text.replace(/^[\s⚖️🌟📊📜🧪⚔️🛑📅🔨⚒️⚗️🏆📋◆✦•·\-–—]+/u, '').trim();
      current = {
        id: 'pa-s' + secCounter + '-' + _paSlugify(cleanTitle),
        title: cleanTitle,
        emoji: _getEmoji(cleanTitle),
        level: 'h2',
        nodes: [],
        subsections: []
      };
      sections.push(current);
      return;
    }

    if (tag === 'h3') {
      if (!current) return;
      secCounter++;
      var cleanSub = text.replace(/^[\s⚖️🌟📊📜🧪⚔️🛑📅🔨⚒️⚗️🏆📋◆✦•·\-–—\d\.]+/u, '').trim();
      var sub = {
        id: 'pa-s' + secCounter + '-' + _paSlugify(cleanSub),
        title: cleanSub,
        emoji: _getEmoji(cleanSub),
        level: 'h3',
        nodes: []
      };
      current.subsections.push(sub);
      /* I nodi successivi vanno alla subsection — usiamo un flag */
      current._activeSub = sub;
      return;
    }

    var clone = node.cloneNode(true);

    if (!current) {
      intro.push(clone);
    } else if (current._activeSub) {
      current._activeSub.nodes.push(clone);
    } else {
      current.nodes.push(clone);
    }
  });

  return { intro: intro, sections: sections };
}

/* ════════════════════════════════════
   RENDER LAYOUT
════════════════════════════════════ */
function _renderPatenti(pbody, data) {
  var sections = data.sections;
  if (!sections.length) {
    pbody.innerHTML = '<div class="pa-err">Nessun contenuto trovato.</div>';
    return;
  }

  /* Sidebar */
  var sidebarHtml = sections.map(function(sec, i) {
    var hasSubs = sec.subsections && sec.subsections.length;
    var item =
      '<li class="pa-sec-item' + (i === 0 ? ' active' : '') + '" data-id="' + sec.id + '" onclick="paSelectSection(this,\'' + sec.id + '\')">'
        + '<span class="pa-sec-emoji">' + sec.emoji + '</span>'
        + '<span class="pa-sec-label">' + sec.title + '</span>'
      + '</li>';

    if (hasSubs) {
      var subHtml = sec.subsections.map(function(sub) {
        return '<li class="pa-sub-item" data-parentid="' + sec.id + '" data-id="' + sub.id + '" onclick="paScrollTo(this,\'' + sec.id + '\',\'' + sub.id + '\')">'
          + '<span class="pa-sub-dot"></span>'
          + '<span class="pa-sub-label">' + sub.title + '</span>'
          + '</li>';
      }).join('');
      item += '<ul class="pa-sub-list" data-parentid="' + sec.id + '" style="display:' + (i === 0 ? 'block' : 'none') + '">' + subHtml + '</ul>';
    }

    return item;
  }).join('');

  pbody.innerHTML =
    '<div class="pa-wrap nc" style="animation:fi .22s ease forwards">'
      + '<div class="pa-layout">'
        + '<aside class="pa-sidebar">'
          + '<div class="pa-sidebar-title">Sezioni</div>'
          + '<ul class="pa-sec-list">' + sidebarHtml + '</ul>'
        + '</aside>'
        + '<div class="pa-main">'
          + '<div class="pa-content" id="pa-content"></div>'
        + '</div>'
      + '</div>'
    + '</div>';

  var wrap = pbody.querySelector('.pa-wrap');
  if (wrap) wrap._paData = data;

  var firstItem = pbody.querySelector('.pa-sec-item');
  if (firstItem) paSelectSection(firstItem, sections[0].id);
}

/* ════════════════════════════════════
   SELEZIONE SEZIONE
════════════════════════════════════ */
window.paSelectSection = function(el, sectionId) {
  document.querySelectorAll('.pa-sec-item').forEach(function(i) { i.classList.remove('active'); });
  document.querySelectorAll('.pa-sub-list').forEach(function(ul) { ul.style.display = 'none'; });
  document.querySelectorAll('.pa-sub-item').forEach(function(i) { i.classList.remove('active'); });

  el.classList.add('active');

  var subList = document.querySelector('.pa-sub-list[data-parentid="' + sectionId + '"]');
  if (subList) subList.style.display = 'block';

  var wrap = el.closest('.pa-wrap');
  if (!wrap || !wrap._paData) return;
  var section = wrap._paData.sections.find(function(s) { return s.id === sectionId; });
  if (!section) return;

  _renderSectionContent(section);
};

/* ════════════════════════════════════
   SCROLL A SOTTOSEZIONE
════════════════════════════════════ */
window.paScrollTo = function(el, sectionId, subId) {
  var secItem = document.querySelector('.pa-sec-item[data-id="' + sectionId + '"]');
  if (secItem && !secItem.classList.contains('active')) {
    paSelectSection(secItem, sectionId);
  }
  document.querySelectorAll('.pa-sub-item').forEach(function(i) { i.classList.remove('active'); });
  el.classList.add('active');

  var anchor = document.getElementById(subId);
  if (anchor) {
    var paMain = anchor.closest('.pa-main');
    if (paMain) paMain.scrollTo({ top: anchor.offsetTop - 20, behavior: 'smooth' });
  }
};

/* ════════════════════════════════════
   RENDER CONTENUTO SEZIONE
════════════════════════════════════ */
function _renderSectionContent(section) {
  var content = document.getElementById('pa-content');
  if (!content) return;

  var div = document.createElement('div');
  div.className = 'pa-section';

  /* Header */
  var header = document.createElement('div');
  header.className = 'pa-section-header';
  header.innerHTML =
    '<span class="pa-section-emoji">' + section.emoji + '</span>'
    + '<span class="pa-section-title">' + section.title + '</span>';
  div.appendChild(header);

  /* Nodi diretti della sezione */
  (section.nodes || []).forEach(function(node) {
    var rendered = _paRenderNode(node);
    if (rendered) div.appendChild(rendered);
  });

  /* Sottosezioni */
  (section.subsections || []).forEach(function(sub) {
    var anchor = document.createElement('div');
    anchor.id = sub.id;
    anchor.className = 'pa-anchor';
    div.appendChild(anchor);

    var sh = document.createElement('div');
    sh.className = 'pa-subheading';
    sh.innerHTML = (sub.emoji ? '<span class="pa-sh-emoji">' + sub.emoji + '</span>' : '') + sub.title;
    div.appendChild(sh);

    (sub.nodes || []).forEach(function(node) {
      var rendered = _paRenderNode(node);
      if (rendered) div.appendChild(rendered);
    });
  });

  content.innerHTML = '';
  content.appendChild(div);

  var paMain = content.closest('.pa-main');
  if (paMain) paMain.scrollTop = 0;
}

/* ════════════════════════════════════
   RENDER NODO
════════════════════════════════════ */
function _paRenderNode(node) {
  var tag = node.tagName ? node.tagName.toLowerCase() : '';
  var text = (node.textContent || '').trim();
  if (!text && tag !== 'table') return null;

  if (tag === 'table') return _paRenderTable(node);
  if (tag === 'ul' || tag === 'ol') return _paRenderList(node);

  if (tag === 'h4') {
    var sh = document.createElement('div');
    sh.className = 'pa-subheading pa-subheading--minor';
    sh.innerHTML = _paInlineHtml(node);
    return sh;
  }

  if (tag === 'p') {
    var inline = _paInlineHtml(node);
    if (!inline.trim()) return null;

    /* Paragrafo corsivo → callout descrittivo */
    var isItalic = node.querySelector('em') && !node.querySelector('strong');
    var p = document.createElement('p');
    p.className = isItalic ? 'pa-para pa-para--italic' : 'pa-para';
    p.innerHTML = inline;
    return p;
  }

  if (tag === 'div') {
    var wrapper = document.createElement('div');
    Array.from(node.childNodes).forEach(function(child) {
      if (child.nodeType === 1) {
        var r = _paRenderNode(child);
        if (r) wrapper.appendChild(r);
      }
    });
    return wrapper.childNodes.length ? wrapper : null;
  }

  return null;
}

function _paInlineHtml(node) {
  var result = '';
  Array.from(node.childNodes).forEach(function(child) {
    if (child.nodeType === 3) {
      result += child.textContent;
    } else if (child.nodeType === 1) {
      var ct = child.tagName.toLowerCase();
      var inner = _paInlineHtml(child);
      if (ct === 'b' || ct === 'strong') result += '<strong>' + inner + '</strong>';
      else if (ct === 'i' || ct === 'em') result += '<em>' + inner + '</em>';
      else if (ct === 'a') {
        var href = child.getAttribute('href') || '#';
        result += '<a href="' + href + '" target="_blank" rel="noopener" class="pa-link">' + inner + '</a>';
      } else if (ct === 'br') result += '<br>';
      else result += inner;
    }
  });
  return result;
}

function _paRenderTable(tableNode) {
  var wrap = document.createElement('div');
  wrap.className = 'pa-table-wrap';
  var table = document.createElement('table');
  table.className = 'pa-table';
  var rows = tableNode.querySelectorAll('tr');
  rows.forEach(function(row, ri) {
    var tr = document.createElement('tr');
    row.querySelectorAll('td, th').forEach(function(cell) {
      var isHeader = cell.tagName.toLowerCase() === 'th' || ri === 0;
      var el = document.createElement(isHeader ? 'th' : 'td');
      el.innerHTML = _paInlineHtml(cell);
      if (cell.colSpan > 1) el.colSpan = cell.colSpan;
      if (cell.rowSpan > 1) el.rowSpan = cell.rowSpan;
      tr.appendChild(el);
    });
    if (tr.childNodes.length) table.appendChild(tr);
  });
  wrap.appendChild(table);
  return wrap;
}

function _paRenderList(listNode) {
  var tag = listNode.tagName.toLowerCase();
  var list = document.createElement(tag === 'ol' ? 'ol' : 'ul');
  list.className = 'pa-list';
  listNode.querySelectorAll('li').forEach(function(li) {
    var item = document.createElement('li');
    item.innerHTML = _paInlineHtml(li);
    list.appendChild(item);
  });
  return list;
}

/* ════════════════════════════════════
   CSS
════════════════════════════════════ */
function _injectPatentiCSS() {
  if (document.getElementById('pa-css')) return;
  var s = document.createElement('style');
  s.id = 'pa-css';
  s.textContent = `
.pa-wrap { width: 100%; max-width: 100%; box-sizing: border-box; }
.pa-layout {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  min-height: 70vh;
  border: 1px solid rgba(200,155,60,.15);
  width: 100%;
  overflow: hidden;
}

/* ── Sidebar ── */
.pa-sidebar {
  border-right: 1px solid rgba(200,155,60,.15);
  background: rgba(4,6,14,.7);
  overflow-y: auto;
  max-height: 82vh;
}
.pa-sidebar-title {
  font-family: 'Cinzel', serif;
  font-size: 7px; font-weight: 700;
  letter-spacing: .28em; color: rgba(200,155,60,.45);
  padding: 16px 18px 10px; text-transform: uppercase;
  border-bottom: 1px solid rgba(200,155,60,.1);
  position: sticky; top: 0;
  background: rgba(4,6,14,.97); z-index: 1;
}

/* Sezioni principali */
.pa-sec-list { list-style: none; margin: 0; padding: 8px 0; }
.pa-sec-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 16px; cursor: pointer; transition: .15s;
  border-left: 2px solid transparent;
}
.pa-sec-item:hover { background: rgba(200,155,60,.05); border-left-color: rgba(200,155,60,.2); }
.pa-sec-item.active { background: rgba(200,155,60,.08); border-left-color: rgba(200,155,60,.7); }
.pa-sec-emoji { font-size: .95em; flex-shrink: 0; margin-top: 1px; }
.pa-sec-label {
  font-family: 'Cinzel', serif; font-size: 9.5px;
  letter-spacing: .03em; color: rgba(220,200,160,.55); line-height: 1.4;
}
.pa-sec-item.active .pa-sec-label { color: rgba(220,200,160,.95); }
.pa-sec-item:hover .pa-sec-label { color: rgba(220,200,160,.82); }

/* Sottosezioni */
.pa-sub-list { list-style: none; margin: 0; padding: 0 0 6px 0; border-bottom: 1px solid rgba(200,155,60,.07); }
.pa-sub-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 14px 6px 32px; cursor: pointer; transition: .15s;
  border-left: 2px solid transparent;
}
.pa-sub-item:hover { background: rgba(200,155,60,.04); border-left-color: rgba(200,155,60,.15); }
.pa-sub-item.active { background: rgba(200,155,60,.06); border-left-color: rgba(200,155,60,.5); }
.pa-sub-dot {
  width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0;
  background: rgba(200,155,60,.3);
}
.pa-sub-item.active .pa-sub-dot { background: rgba(200,155,60,.8); }
.pa-sub-label {
  font-family: 'Cinzel', serif; font-size: 8px;
  letter-spacing: .04em; color: rgba(220,200,160,.4); line-height: 1.35;
}
.pa-sub-item:hover .pa-sub-label { color: rgba(220,200,160,.72); }
.pa-sub-item.active .pa-sub-label { color: rgba(220,200,160,.88); }

/* ── Main ── */
.pa-main { overflow-y: auto; max-height: 82vh; background: rgba(6,8,18,.4); }
.pa-content { padding: 32px 40px 48px; }

.pa-section-header {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 28px; padding-bottom: 18px;
  border-bottom: 1px solid rgba(200,155,60,.2);
}
.pa-section-emoji { font-size: 1.5em; flex-shrink: 0; }
.pa-section-title {
  font-family: 'Cinzel', serif; font-size: 19px; font-weight: 700;
  color: rgba(240,225,190,.95); letter-spacing: .05em; line-height: 1.3;
}

.pa-anchor { height: 0; overflow: hidden; display: block; }

.pa-subheading {
  font-family: 'Cinzel', serif; font-size: 10.5px; font-weight: 700;
  letter-spacing: .14em; color: rgba(200,155,60,.85); text-transform: uppercase;
  margin: 28px 0 14px; padding: 10px 14px;
  background: rgba(200,155,60,.04); border-left: 3px solid rgba(200,155,60,.4);
  display: flex; align-items: center; gap: 8px;
}
.pa-subheading--minor {
  font-size: 9px; color: rgba(200,155,60,.65);
  background: transparent; border-left-color: rgba(200,155,60,.2);
  margin-top: 20px;
}
.pa-sh-emoji { font-size: 1.1em; }

.pa-para {
  font-family: 'Crimson Pro', serif; font-size: 16px;
  line-height: 1.8; color: rgba(220,200,160,.75); margin: 0 0 12px;
}
.pa-para--italic { color: rgba(200,180,140,.65); font-style: italic; }
.pa-para strong { color: rgba(240,220,180,.95); }
.pa-para em { color: rgba(200,180,140,.8); }

.pa-list { margin: 0 0 16px 0; padding-left: 22px; }
.pa-list li {
  font-family: 'Crimson Pro', serif; font-size: 15px;
  line-height: 1.75; color: rgba(220,200,160,.7); margin-bottom: 6px; padding-left: 4px;
}
.pa-list li::marker { color: rgba(200,155,60,.5); }
.pa-list li strong { color: rgba(240,220,180,.95); }

/* Tabelle */
.pa-table-wrap {
  overflow-x: auto; margin: 16px 0 24px;
  border: 1px solid rgba(200,155,60,.12);
}
.pa-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.pa-table th {
  background: rgba(0,0,0,.6); color: rgba(200,155,60,.85);
  font-family: 'Cinzel', serif; font-size: 7.5px; font-weight: 700;
  letter-spacing: .1em; padding: 10px 14px;
  border: 1px solid rgba(200,155,60,.15);
  text-align: left; text-transform: uppercase; white-space: nowrap;
}
.pa-table td {
  padding: 10px 14px; border: 1px solid rgba(200,155,60,.08);
  color: rgba(220,200,160,.75); font-family: 'Crimson Pro', serif;
  font-size: 14px; line-height: 1.6; vertical-align: top;
}
.pa-table tr:nth-child(even) td { background: rgba(200,155,60,.02); }
.pa-table tr:hover td { background: rgba(200,155,60,.05); }
.pa-table td:first-child {
  font-family: 'Cinzel', serif; font-size: 10.5px; font-weight: 700;
  color: rgba(240,220,180,.9); letter-spacing: .02em; min-width: 100px;
}
.pa-table td strong { color: rgba(240,220,180,.95); }

.pa-link {
  color: rgba(200,155,60,.8); text-decoration: none;
  border-bottom: 1px solid rgba(200,155,60,.3); transition: .15s;
}
.pa-link:hover { color: rgba(200,155,60,1); border-bottom-color: rgba(200,155,60,.7); }

/* Badge patente inline */
.pa-badge {
  display: inline-block; padding: 2px 8px; margin: 0 3px;
  font-family: 'Cinzel', serif; font-size: 7px; font-weight: 700;
  letter-spacing: .1em; text-transform: uppercase;
  border: 1px solid rgba(200,155,60,.35);
  color: rgba(200,155,60,.85); background: rgba(200,155,60,.07);
  vertical-align: middle;
}

/* Loading / errore */
.pa-loading {
  display: flex; align-items: center; justify-content: center; height: 300px;
  color: rgba(200,155,60,.4); font-family: 'Cinzel', serif;
  font-size: 10px; letter-spacing: .2em; flex-direction: column; gap: 14px;
}
.pa-spin {
  width: 28px; height: 28px; border: 2px solid rgba(200,155,60,.15);
  border-top-color: rgba(200,155,60,.7); border-radius: 50%;
  animation: pa-spin-anim .8s linear infinite;
}
@keyframes pa-spin-anim { to { transform: rotate(360deg); } }
.pa-err {
  padding: 60px 40px; text-align: center;
  font-family: 'Cinzel', serif; font-size: 11px;
  color: rgba(200,155,60,.4); letter-spacing: .1em;
}

/* Responsive */
@media (max-width: 700px) {
  .pa-layout { grid-template-columns: 1fr; }
  .pa-sidebar { border-right: none; border-bottom: 1px solid rgba(200,155,60,.15); max-height: 240px; }
  .pa-main { max-height: none; }
  .pa-content { padding: 20px 16px 32px; }
  .pa-section-title { font-size: 16px; }
  .pa-table td, .pa-table th { padding: 7px 10px; font-size: 12px; }
  .pa-sub-item { padding-left: 24px; }
}
  `;
  document.head.appendChild(s);
}
