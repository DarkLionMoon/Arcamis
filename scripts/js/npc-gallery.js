/* ════════════════════════════════════
   npc-gallery.js
   Galleria NPC stile taverna:
   sidebar città + bacheca poster
   raggruppati per location (Lore)
════════════════════════════════════ */

var NPC_PARENT_DB = '3320274fdc1c805090becb2a5a0414e1';

/* ── Colori per location ── */
var NPC_LORE_COLORS = {
  'Locanda':                  { c: '#c8a44a', bg: 'rgba(200,164,74,.10)' },
  'Porto':                    { c: '#4a8fc8', bg: 'rgba(74,143,200,.10)' },
  'Forgia':                   { c: '#c86a4a', bg: 'rgba(200,106,74,.10)' },
  'Bazaar':                   { c: '#a44ac8', bg: 'rgba(164,74,200,.10)' },
  'Biblioteca':               { c: '#4ac8a4', bg: 'rgba(74,200,164,.10)' },
  'Caserma':                  { c: '#c84a4a', bg: 'rgba(200,74,74,.10)' },
  'Gilda degli avventurieri': { c: '#c8b44a', bg: 'rgba(200,180,74,.10)' },
  'Sartoria':                 { c: '#c84a8f', bg: 'rgba(200,74,143,.10)' },
  'Bottega Farmaceutica':     { c: '#4ac84a', bg: 'rgba(74,200,74,.10)' },
  'Fuori dalle mura':         { c: '#8fc84a', bg: 'rgba(143,200,74,.10)' },
  'Foresta dello Smarrimento':{ c: '#4a6ec8', bg: 'rgba(74,110,200,.10)' },
  'NPC Evento':               { c: '#c8c84a', bg: 'rgba(200,200,74,.10)' },
  'Marchese':                 { c: '#c89b3c', bg: 'rgba(200,155,60,.10)' },
  'Duca':                     { c: '#c89b3c', bg: 'rgba(200,155,60,.10)' },
};

function _npcLoreColor(lore) {
  return NPC_LORE_COLORS[lore] || { c: 'rgba(200,155,60,.7)', bg: 'rgba(200,155,60,.08)' };
}

/* ── Icone per location ── */
var NPC_LORE_ICONS = {
  'Locanda': '🍺',
  'Porto': '⚓',
  'Forgia': '🔨',
  'Bazaar': '🛒',
  'Biblioteca': '📚',
  'Caserma': '⚔️',
  'Gilda degli avventurieri': '🗡️',
  'Sartoria': '🧵',
  'Bottega Farmaceutica': '⚕️',
  'Fuori dalle mura': '🌿',
  'Foresta dello Smarrimento': '🌲',
  'NPC Evento': '✨',
  'Marchese': '👑',
  'Duca': '👑',
};

function _npcLoreIcon(lore) {
  return NPC_LORE_ICONS[lore] || '📍';
}

/* ════ ENTRY POINT ════ */
window.loadNpcGallery = async function(container, cities) {
  container.innerHTML = '<div class="npc-loading"><div class="gs-loading-spin"></div></div>';
  _injectNpcCSS();

  /* Se cities non passate, caricale */
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

  /* Layout */
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
    li.innerHTML = (city.icon && city.icon !== '📄' ? city.icon + ' ' : '') + city.title;
    li.addEventListener('click', function() {
      container.querySelectorAll('.npc-city-item').forEach(function(i) { i.classList.remove('active'); });
      li.classList.add('active');
      _loadCityBoard(container.querySelector('#npc-board'), city);
    });
    list.appendChild(li);
    if (idx === 0) {
      setTimeout(function() { li.click(); }, 0);
    }
  });
};

/* ════ Carica NPC di una città ════ */
async function _loadCityBoard(board, city) {
  board.innerHTML = '<div class="npc-loading"><div class="gs-loading-spin"></div></div>';

  /* Trova il sotto-database dentro la pagina della città */
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
  var groups = {};
  var groupOrder = [];
  npcs.forEach(function(npc) {
    var key = npc.lore || 'Altro';
    if (!groups[key]) { groups[key] = []; groupOrder.push(key); }
    groups[key].push(npc);
  });

  /* Render bacheca */
  var html = '<div class="npc-city-title">' +
    (city.icon && city.icon !== '📄' ? '<span class="npc-city-icon">' + city.icon + '</span>' : '') +
    city.title + '</div>';

  groupOrder.forEach(function(lore) {
    var col = _npcLoreColor(lore);
    var ico = _npcLoreIcon(lore);
    html += '<div class="npc-section">' +
      '<div class="npc-section-header" style="color:' + col.c + '">' +
        '<span class="npc-section-icon">' + ico + '</span>' + lore +
      '</div>' +
      '<div class="npc-posters">';

    groups[lore].forEach(function(npc) {
      var titleSafe = npc.title.replace(/'/g, "\\'").replace(/"/g, '&quot;');
      html += '<div class="npc-poster" style="--npc-acc:' + col.c + ';--npc-bg:' + col.bg + '"' +
        ' onclick="gp(\'' + npc.id + '\',\'' + titleSafe + '\',\'' + (npc.icon || '👤') + '\')">' +
        '<div class="npc-poster-pin"></div>' +
        '<div class="npc-poster-body">' +
          '<div class="npc-poster-icon">' + (npc.icon !== '📄' ? npc.icon : '👤') + '</div>' +
          '<div class="npc-poster-name">' + npc.title + '</div>' +
          '<div class="npc-poster-lore" style="color:' + col.c + '">' + lore + '</div>' +
        '</div>' +
        '<div class="npc-poster-cta">LEGGI →</div>' +
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
.npc-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 0;
  min-height: 600px;
  border: 1px solid rgba(200,155,60,.15);
  width: 100%;
}
.npc-sidebar {
  border-right: 1px solid rgba(200,155,60,.15);
  background: rgba(4,6,14,.6);
  overflow-y: auto;
}
.npc-sidebar-title {
  font-family: 'Cinzel', serif;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: .25em;
  color: rgba(200,155,60,.5);
  padding: 16px 18px 10px;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(200,155,60,.1);
}
.npc-city-list {
  list-style: none;
  margin: 0;
  padding: 8px 0;
}
.npc-city-item {
  font-family: 'Cinzel', serif;
  font-size: 11px;
  letter-spacing: .04em;
  color: rgba(240,230,200,.6);
  padding: 10px 18px;
  cursor: pointer;
  transition: .15s;
  border-left: 2px solid transparent;
}
.npc-city-item:hover { color: rgba(240,230,200,.95); background: rgba(200,155,60,.06); }
.npc-city-item.active { color: var(--gold2,#c89b3c); background: rgba(200,155,60,.1); border-left-color: rgba(200,155,60,.7); }

.npc-board {
  padding: 28px 32px;
  background: rgba(6,8,18,.4);
  overflow-y: auto;
  max-height: 90vh;
}
.npc-board-placeholder {
  font-family: 'Cinzel', serif;
  font-size: 11px;
  letter-spacing: .1em;
  color: rgba(200,155,60,.25);
  padding: 60px 0;
  text-align: center;
}
.npc-city-title {
  font-family: 'Cinzel', serif;
  font-size: 20px;
  font-weight: 700;
  color: var(--gold2,#c89b3c);
  letter-spacing: .06em;
  margin-bottom: 28px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(200,155,60,.2);
  display: flex;
  align-items: center;
  gap: 10px;
}
.npc-city-icon { font-size: 1.3em; }

.npc-section { margin-bottom: 32px; }
.npc-section-header {
  font-family: 'Cinzel', serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .2em;
  text-transform: uppercase;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: .85;
}
.npc-section-icon { font-size: 1.1em; }

.npc-posters {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

/* Poster stile carta da taverna */
.npc-poster {
  width: 130px;
  min-height: 170px;
  background: linear-gradient(160deg, #1a1508 0%, #0e0c04 60%, #080602 100%);
  border: 1px solid var(--npc-acc);
  border-top: 3px solid var(--npc-acc);
  border-radius: 2px;
  position: relative;
  cursor: pointer;
  transition: transform .18s ease, box-shadow .18s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,.5), inset 0 0 30px rgba(0,0,0,.3);
}
.npc-poster::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--npc-bg);
  opacity: 0;
  transition: opacity .18s;
}
.npc-poster:hover { transform: translateY(-4px) rotate(.5deg); box-shadow: 0 8px 24px rgba(0,0,0,.6); }
.npc-poster:hover::before { opacity: 1; }

.npc-poster-pin {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--npc-acc);
  opacity: .7;
  margin: 10px auto 0;
  box-shadow: 0 0 6px var(--npc-acc);
  flex-shrink: 0;
}

.npc-poster-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 10px 8px;
  text-align: center;
}
.npc-poster-icon {
  font-size: 1.8em;
  margin-bottom: 8px;
  filter: drop-shadow(0 0 4px var(--npc-acc));
}
.npc-poster-name {
  font-family: 'Cinzel', serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .04em;
  color: rgba(240,230,200,.9);
  line-height: 1.4;
  margin-bottom: 6px;
}
.npc-poster-lore {
  font-family: 'Cinzel', serif;
  font-size: 8px;
  letter-spacing: .1em;
  text-transform: uppercase;
  opacity: .75;
}

.npc-poster-cta {
  font-family: 'Cinzel', serif;
  font-size: 7px;
  letter-spacing: .15em;
  color: var(--npc-acc);
  text-align: center;
  padding: 6px;
  border-top: 1px solid rgba(200,155,60,.1);
  opacity: 0;
  transition: opacity .18s;
}
.npc-poster:hover .npc-poster-cta { opacity: 1; }

.npc-loading { display: flex; justify-content: center; padding: 60px 0; }
.npc-err { font-family: 'Cinzel', serif; font-size: 11px; color: rgba(200,155,60,.4); padding: 40px; text-align: center; }

@media (max-width: 600px) {
  .npc-layout { grid-template-columns: 1fr; }
  .npc-sidebar { border-right: none; border-bottom: 1px solid rgba(200,155,60,.15); max-height: 160px; }
  .npc-board { padding: 20px 16px; }
  .npc-poster { width: 110px; min-height: 150px; }
}
  `;
  document.head.appendChild(s);
}
