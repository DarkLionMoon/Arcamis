/* ════════════════════════════════════
   npc-gallery.js
   Galleria NPC stile taverna:
   sidebar città + bacheca poster
   raggruppati per location (Lore)
════════════════════════════════════ */

var NPC_PARENT_DB = '3320274fdc1c805090becb2a5a0414e1';

var NPC_LORE_COLORS = {
  'Locanda':                  { c: '#c8a44a', bg: 'rgba(200,164,74,.12)' },
  'Porto':                    { c: '#4a8fc8', bg: 'rgba(74,143,200,.12)' },
  'Forgia':                   { c: '#c86a4a', bg: 'rgba(200,106,74,.12)' },
  'Bazaar':                   { c: '#a44ac8', bg: 'rgba(164,74,200,.12)' },
  'Biblioteca':               { c: '#4ac8a4', bg: 'rgba(74,200,164,.12)' },
  'Caserma':                  { c: '#c84a4a', bg: 'rgba(200,74,74,.12)' },
  'Gilda degli avventurieri': { c: '#c8b44a', bg: 'rgba(200,180,74,.12)' },
  'Sartoria':                 { c: '#c84a8f', bg: 'rgba(200,74,143,.12)' },
  'Bottega Farmaceutica':     { c: '#4ac84a', bg: 'rgba(74,200,74,.12)' },
  'Fuori dalle mura':         { c: '#8fc84a', bg: 'rgba(143,200,74,.12)' },
  'Foresta dello Smarrimento':{ c: '#4a6ec8', bg: 'rgba(74,110,200,.12)' },
  'NPC Evento':               { c: '#c8c84a', bg: 'rgba(200,200,74,.12)' },
  'Marchese':                 { c: '#c89b3c', bg: 'rgba(200,155,60,.12)' },
  'Duca':                     { c: '#c89b3c', bg: 'rgba(200,155,60,.12)' },
};

function _npcLoreColor(lore) {
  return NPC_LORE_COLORS[lore] || { c: 'rgba(200,155,60,.7)', bg: 'rgba(200,155,60,.08)' };
}

var NPC_LORE_ICONS = {
  'Locanda': '🍺', 'Porto': '⚓', 'Forgia': '🔨', 'Bazaar': '🛒',
  'Biblioteca': '📚', 'Caserma': '⚔️', 'Gilda degli avventurieri': '🗡️',
  'Sartoria': '🧵', 'Bottega Farmaceutica': '⚕️', 'Fuori dalle mura': '🌿',
  'Foresta dello Smarrimento': '🌲', 'NPC Evento': '✨', 'Marchese': '👑', 'Duca': '👑',
};
function _npcLoreIcon(lore) { return NPC_LORE_ICONS[lore] || '📍'; }

var NPC_IMPORTANZA_STYLE = {
  'NPC Chiave':      { c: '#f0d060', border: '#c8a44a', label: 'CHIAVE' },
  'NPC Secondario':  { c: '#a0b0c0', border: '#6080a0', label: 'SECONDARIO' },
  'Nobile':          { c: '#e080c0', border: '#c040a0', label: 'NOBILE' },
};
function _npcImpStyle(imp) {
  return NPC_IMPORTANZA_STYLE[imp] || { c: 'rgba(200,155,60,.5)', border: 'rgba(200,155,60,.3)', label: imp || '' };
}

/* ════ ENTRY POINT ════ */
window.loadNpcGallery = async function(container, cities) {
  container.innerHTML = '<div class="npc-loading"><div class="gs-loading-spin"></div></div>';
  _injectNpcCSS();

  if (!cities) {
    try {
      var r = await fetch('/api/notion?dbId=' + NPC_PARENT_DB);
      var data = await r.json();
      cities = data.pages || [];
    } catch(e) {
      container.innerHTML = '<div class="npc-err">⚠️ Errore caricamento città.</div>';
      return;
    }
  }

  if (!cities.length) {
    container.innerHTML = '<div class="npc-err">Nessuna città trovata.</div>';
    return;
  }

  container.innerHTML =
    '<div class="npc-layout">' +
      '<div class="npc-sidebar">' +
        '<div class="npc-sidebar-title">Città</div>' +
        '<ul class="npc-city-list" id="npc-city-list"></ul>' +
      '</div>' +
      '<div class="npc-board" id="npc-board">' +
        '<div class="npc-board-placeholder">← Seleziona una città</div>' +
      '</div>' +
    '</div>';

  var list = container.querySelector('#npc-city-list');
  cities.forEach(function(city, idx) {
    var li = document.createElement('li');
    li.className = 'npc-city-item';
    li.innerHTML = (city.icon && city.icon !== '📄' ? '<span class="npc-city-item-icon">' + city.icon + '</span>' : '') + city.title;
    li.addEventListener('click', function() {
      container.querySelectorAll('.npc-city-item').forEach(function(i) { i.classList.remove('active'); });
      li.classList.add('active');
      _loadCityBoard(container.querySelector('#npc-board'), city);
    });
    list.appendChild(li);
    if (idx === 0) setTimeout(function() { li.click(); }, 0);
  });
};

/* ════ Carica NPC di una città ════ */
async function _loadCityBoard(board, city) {
  board.innerHTML = '<div class="npc-loading"><div class="gs-loading-spin"></div></div>';

  var subDbId = null;
  try {
    var pr = await fetch('/api/notion?pageId=' + city.id);
    var pd = await pr.json();
    var dbBlock = (pd.blocks || []).find(function(b) { return b.type === 'child_database'; });
    if (dbBlock) subDbId = dbBlock.id.replace(/-/g, '');
  } catch(e) {}

  if (!subDbId) {
    board.innerHTML = '<div class="npc-err">Nessun database trovato per ' + city.title + '.</div>';
    return;
  }

  var npcs = [];
  try {
    var nr = await fetch('/api/notion?dbId=' + subDbId);
    var nd = await nr.json();
    npcs = nd.pages || [];
  } catch(e) {
    board.innerHTML = '<div class="npc-err">⚠️ Errore caricamento NPC.</div>';
    return;
  }

  if (!npcs.length) {
    board.innerHTML = '<div class="npc-err">Nessun NPC trovato.</div>';
    return;
  }

  /* Raggruppa per Lore */
  var groups = {}, groupOrder = [];
  npcs.forEach(function(npc) {
    var key = npc.lore || 'Altro';
    if (!groups[key]) { groups[key] = []; groupOrder.push(key); }
    groups[key].push(npc);
  });

  var html = '<div class="npc-city-title">' +
    (city.icon && city.icon !== '📄' ? '<span class="npc-city-icon">' + city.icon + '</span>' : '') +
    city.title + '</div>';

  groupOrder.forEach(function(lore) {
    var col = _npcLoreColor(lore);
    var ico = _npcLoreIcon(lore);
    html += '<div class="npc-section">' +
      '<div class="npc-section-header" style="color:' + col.c + ';border-bottom-color:' + col.c + '40">' +
        '<span class="npc-section-icon">' + ico + '</span>' + lore +
        '<span class="npc-section-count">' + groups[lore].length + '</span>' +
      '</div>' +
      '<div class="npc-posters">';

    groups[lore].forEach(function(npc) {
      var titleSafe = npc.title.replace(/'/g, "\\'").replace(/"/g, '&quot;');
      var imp = npc.importanza || '';
      var impStyle = _npcImpStyle(imp);
      var impBadge = imp ? '<div class="npc-poster-imp" style="color:' + impStyle.c + ';border-color:' + impStyle.border + '">' + impStyle.label + '</div>' : '';
      var loreBadge = '<div class="npc-poster-lore-badge" style="background:' + col.bg + ';color:' + col.c + ';border-color:' + col.c + '60">' + ico + ' ' + lore + '</div>';

      html +=
        '<div class="npc-poster" onclick="gp(\'' + npc.id + '\',\'' + titleSafe + '\',\'' + (npc.icon !== '📄' ? npc.icon : '👤') + '\')">' +
          /* Texture overlay */
          '<div class="npc-poster-texture"></div>' +
          /* Angoli decorativi */
          '<div class="npc-poster-corner npc-corner-tl"></div>' +
          '<div class="npc-poster-corner npc-corner-tr"></div>' +
          '<div class="npc-poster-corner npc-corner-bl"></div>' +
          '<div class="npc-poster-corner npc-corner-br"></div>' +
          /* Contenuto */
          '<div class="npc-poster-inner">' +
            /* Badge importanza in cima */
            impBadge +
            /* Icona grande */
            '<div class="npc-poster-avatar">' + (npc.icon !== '📄' ? npc.icon : '👤') + '</div>' +
            /* Linea decorativa */
            '<div class="npc-poster-divider" style="border-color:' + col.c + '40"></div>' +
            /* Nome */
            '<div class="npc-poster-name">' + npc.title + '</div>' +
            /* Lore badge */
            loreBadge +
          '</div>' +
          /* Footer hover */
          '<div class="npc-poster-footer">LEGGI LA SCHEDA →</div>' +
        '</div>';
    });

    html += '</div></div>';
  });

  board.innerHTML = html;
}

/* ════ CSS ════ */
function _injectNpcCSS() {
  if (document.getElementById('npc-gallery-css')) return;
  var s = document.createElement('style');
  s.id = 'npc-gallery-css';
  s.textContent = `
/* ── Layout ── */
.npc-layout {
  display: grid;
  grid-template-columns: 210px 1fr;
  gap: 0;
  min-height: 600px;
  border: 1px solid rgba(200,155,60,.2);
  border-radius: 2px;
  overflow: hidden;
}

/* ── Sidebar ── */
.npc-sidebar {
  border-right: 1px solid rgba(200,155,60,.15);
  background: rgba(4,3,2,.85);
  overflow-y: auto;
}
.npc-sidebar-title {
  font-family: 'Cinzel', serif;
  font-size: 7px;
  font-weight: 700;
  letter-spacing: .3em;
  color: rgba(200,155,60,.45);
  padding: 18px 18px 10px;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(200,155,60,.1);
}
.npc-city-list { list-style: none; margin: 0; padding: 10px 0; }
.npc-city-item {
  font-family: 'Cinzel', serif;
  font-size: 11px;
  letter-spacing: .05em;
  color: rgba(220,205,170,.55);
  padding: 11px 18px;
  cursor: pointer;
  transition: all .2s;
  border-left: 2px solid transparent;
  display: flex;
  align-items: center;
  gap: 8px;
}
.npc-city-item-icon { font-size: 1em; }
.npc-city-item:hover { color: rgba(220,205,170,.9); background: rgba(200,155,60,.05); }
.npc-city-item.active {
  color: #c89b3c;
  background: rgba(200,155,60,.08);
  border-left-color: #c89b3c;
  font-weight: 600;
}

/* ── Board ── */
.npc-board {
  padding: 30px 36px;
  background: rgba(8,6,3,.7);
  overflow-y: auto;
  max-height: 88vh;
}
.npc-board-placeholder {
  font-family: 'Cinzel', serif;
  font-size: 11px;
  letter-spacing: .12em;
  color: rgba(200,155,60,.2);
  padding: 80px 0;
  text-align: center;
}
.npc-city-title {
  font-family: 'Cinzel', serif;
  font-size: 22px;
  font-weight: 700;
  color: #c89b3c;
  letter-spacing: .08em;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(200,155,60,.25);
  display: flex;
  align-items: center;
  gap: 12px;
}
.npc-city-icon { font-size: 1.2em; }

/* ── Sezione location ── */
.npc-section { margin-bottom: 40px; }
.npc-section-header {
  font-family: 'Cinzel', serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .25em;
  text-transform: uppercase;
  margin-bottom: 18px;
  padding-bottom: 10px;
  border-bottom: 1px solid;
  display: flex;
  align-items: center;
  gap: 8px;
}
.npc-section-icon { font-size: 1.1em; }
.npc-section-count {
  margin-left: auto;
  font-size: 8px;
  opacity: .5;
  font-weight: 400;
  letter-spacing: .1em;
}
.npc-posters {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
}

/* ── Poster carta invecchiata ── */
.npc-poster {
  width: 150px;
  min-height: 210px;
  position: relative;
  cursor: pointer;
  transition: transform .2s ease, box-shadow .2s ease;
  border-radius: 1px;
  display: flex;
  flex-direction: column;
  /* Pergamena scura */
  background:
    linear-gradient(160deg,
      #1e1a0e 0%,
      #161208 40%,
      #100e06 70%,
      #1a1508 100%
    );
  border: 1px solid rgba(200,155,60,.35);
  box-shadow:
    0 4px 20px rgba(0,0,0,.7),
    inset 0 0 40px rgba(0,0,0,.4),
    inset 0 1px 0 rgba(200,155,60,.15);
  overflow: hidden;
}
.npc-poster:hover {
  transform: translateY(-6px) rotate(.4deg);
  box-shadow:
    0 12px 35px rgba(0,0,0,.8),
    0 0 20px rgba(200,155,60,.08),
    inset 0 0 40px rgba(0,0,0,.3);
}

/* Texture pergamena */
.npc-poster-texture {
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(200,155,60,.015) 2px,
      rgba(200,155,60,.015) 4px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 3px,
      rgba(200,155,60,.01) 3px,
      rgba(200,155,60,.01) 6px
    );
  pointer-events: none;
  z-index: 0;
}

/* Angoli decorativi */
.npc-poster-corner {
  position: absolute;
  width: 12px;
  height: 12px;
  border-color: rgba(200,155,60,.5);
  border-style: solid;
  z-index: 2;
}
.npc-corner-tl { top: 6px; left: 6px; border-width: 1px 0 0 1px; }
.npc-corner-tr { top: 6px; right: 6px; border-width: 1px 1px 0 0; }
.npc-corner-bl { bottom: 6px; left: 6px; border-width: 0 0 1px 1px; }
.npc-corner-br { bottom: 6px; right: 6px; border-width: 0 1px 1px 0; }

/* Contenuto */
.npc-poster-inner {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px 12px;
  gap: 8px;
}

/* Badge importanza */
.npc-poster-imp {
  font-family: 'Cinzel', serif;
  font-size: 6px;
  font-weight: 700;
  letter-spacing: .2em;
  text-transform: uppercase;
  padding: 3px 8px;
  border: 1px solid;
  border-radius: 1px;
  opacity: .9;
}

/* Avatar */
.npc-poster-avatar {
  font-size: 2.4em;
  line-height: 1;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,.6));
  margin: 4px 0;
}

/* Linea divisoria */
.npc-poster-divider {
  width: 60%;
  border-top: 1px solid;
  margin: 2px 0;
  opacity: .6;
}

/* Nome */
.npc-poster-name {
  font-family: 'Cinzel', serif;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: .04em;
  color: rgba(235,220,185,.95);
  text-align: center;
  line-height: 1.45;
  text-shadow: 0 1px 4px rgba(0,0,0,.8);
}

/* Lore badge */
.npc-poster-lore-badge {
  font-family: 'Cinzel', serif;
  font-size: 7px;
  letter-spacing: .1em;
  text-transform: uppercase;
  padding: 3px 8px;
  border: 1px solid;
  border-radius: 1px;
  text-align: center;
  opacity: .85;
}

/* Footer hover */
.npc-poster-footer {
  position: relative;
  z-index: 1;
  font-family: 'Cinzel', serif;
  font-size: 7px;
  letter-spacing: .15em;
  color: rgba(200,155,60,.8);
  text-align: center;
  padding: 8px 6px;
  border-top: 1px solid rgba(200,155,60,.15);
  background: rgba(0,0,0,.3);
  opacity: 0;
  transition: opacity .2s;
}
.npc-poster:hover .npc-poster-footer { opacity: 1; }

/* ── Utility ── */
.npc-loading { display: flex; justify-content: center; padding: 60px 0; }
.npc-err {
  font-family: 'Cinzel', serif;
  font-size: 11px;
  color: rgba(200,155,60,.35);
  padding: 60px;
  text-align: center;
}

@media (max-width: 640px) {
  .npc-layout { grid-template-columns: 1fr; }
  .npc-sidebar { border-right: none; border-bottom: 1px solid rgba(200,155,60,.15); max-height: 160px; }
  .npc-board { padding: 20px 16px; max-height: none; }
  .npc-poster { width: 130px; min-height: 185px; }
}
  `;
  document.head.appendChild(s);
}
