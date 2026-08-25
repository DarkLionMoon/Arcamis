/* ════════════════════════════════════
   npc-gallery.js
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
function _npcLoreColor(lore){ return NPC_LORE_COLORS[lore]||{c:'rgba(200,155,60,.7)',bg:'rgba(200,155,60,.08)'}; }

var NPC_LORE_ICONS = {
  'Locanda':'🍺','Porto':'⚓','Forgia':'🔨','Bazaar':'🛒',
  'Biblioteca':'📚','Caserma':'⚔️','Gilda degli avventurieri':'🗡️',
  'Sartoria':'🧵','Bottega Farmaceutica':'⚕️','Fuori dalle mura':'🌿',
  'Foresta dello Smarrimento':'🌲','NPC Evento':'✨','Marchese':'👑','Duca':'👑',
};
function _npcLoreIcon(lore){ return NPC_LORE_ICONS[lore]||'📍'; }

var NPC_IMP = {
  'NPC Chiave':     { c:'#f0d060', border:'#c8a44a', label:'⭐ CHIAVE' },
  'NPC Secondario': { c:'#a0b0c8', border:'#6080a0', label:'· SECONDARIO' },
  'Nobile':         { c:'#e080c0', border:'#c040a0', label:'♦ NOBILE' },
};
function _npcImpStyle(imp){ return NPC_IMP[imp]||null; }

/* ── Filtro attivo ── */
var _npcActiveFilter = 'tutti';

/* ════ ENTRY POINT ════ */
window.loadNpcGallery = async function(container, cities) {
  container.innerHTML = '<div class="npc-loading"><div class="gs-loading-spin"></div></div>';
  _injectNpcCSS();
  _npcActiveFilter = 'tutti';

  if (!cities) {
    try {
      var r = await fetch('/api/notion?dbId=' + NPC_PARENT_DB);
      cities = (await r.json()).pages || [];
    } catch(e) {
      container.innerHTML = '<div class="npc-err">⚠️ Errore caricamento città.</div>'; return;
    }
  }

  if (!cities.length) { container.innerHTML = '<div class="npc-err">Nessuna città trovata.</div>'; return; }

  container.innerHTML =
    '<div class="npc-layout">' +
      '<div class="npc-sidebar">' +
        '<div class="npc-sidebar-title">Città</div>' +
        '<ul class="npc-city-list" id="npc-city-list"></ul>' +
      '</div>' +
      '<div class="npc-main">' +
        /* Filtro importanza */
        '<div class="npc-filter-bar" id="npc-filter-bar">' +
          '<button class="npc-filter-btn active" data-filter="tutti">Tutti</button>' +
          '<button class="npc-filter-btn" data-filter="NPC Chiave">⭐ Chiave</button>' +
          '<button class="npc-filter-btn" data-filter="NPC Secondario">· Secondario</button>' +
          '<button class="npc-filter-btn" data-filter="Nobile">♦ Nobile</button>' +
        '</div>' +
        '<div class="npc-board" id="npc-board">' +
          '<div class="npc-board-placeholder">← Seleziona una città</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  /* Filtro click */
  container.querySelector('#npc-filter-bar').addEventListener('click', function(e) {
    var btn = e.target.closest('.npc-filter-btn');
    if (!btn) return;
    container.querySelectorAll('.npc-filter-btn').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    _npcActiveFilter = btn.dataset.filter;
    _applyNpcFilter(container);
  });

  var list = container.querySelector('#npc-city-list');
  cities.forEach(function(city, idx) {
    var li = document.createElement('li');
    li.className = 'npc-city-item';
    li.innerHTML = (city.icon && city.icon !== '📄' ? '<span>' + city.icon + '</span>' : '') + city.title;
    li.addEventListener('click', function() {
      container.querySelectorAll('.npc-city-item').forEach(function(i){ i.classList.remove('active'); });
      li.classList.add('active');
      _loadCityBoard(container.querySelector('#npc-board'), city);
    });
    list.appendChild(li);
    if (idx === 0) setTimeout(function(){ li.click(); }, 0);
  });
};

function _applyNpcFilter(container) {
  var f = _npcActiveFilter;
  container.querySelectorAll('.npc-poster').forEach(function(p) {
    if (f === 'tutti' || p.dataset.imp === f) {
      p.style.display = '';
    } else {
      p.style.display = 'none';
    }
  });
  /* Nascondi sezioni vuote */
  container.querySelectorAll('.npc-section').forEach(function(sec) {
    var visible = sec.querySelectorAll('.npc-poster:not([style*="display: none"]):not([style*="display:none"])');
    sec.style.display = visible.length ? '' : 'none';
  });
}

/* ════ Carica NPC città ════ */
async function _loadCityBoard(board, city) {
  board.innerHTML = '<div class="npc-loading"><div class="gs-loading-spin"></div></div>';

  var subDbId = null;
  try {
    var pr = await fetch('/api/notion?pageId=' + city.id);
    var pd = await pr.json();
    var dbBlock = (pd.blocks || []).find(function(b){ return b.type === 'child_database'; });
    if (dbBlock) subDbId = dbBlock.id.replace(/-/g, '');
  } catch(e) {}

  if (!subDbId) { board.innerHTML = '<div class="npc-err">Nessun database trovato.</div>'; return; }

  var npcs = [];
  try {
    var nr = await fetch('/api/notion?dbId=' + subDbId);
    npcs = (await nr.json()).pages || [];
  } catch(e) { board.innerHTML = '<div class="npc-err">⚠️ Errore.</div>'; return; }

  if (!npcs.length) { board.innerHTML = '<div class="npc-err">Nessun NPC trovato.</div>'; return; }

  var groups = {}, groupOrder = [];
  npcs.forEach(function(npc) {
    var key = npc.lore || 'Altro';
    if (!groups[key]) { groups[key] = []; groupOrder.push(key); }
    groups[key].push(npc);
  });

  var html = '<div class="npc-city-title">' +
    (city.icon && city.icon !== '📄' ? '<span>' + city.icon + '</span>' : '') +
    city.title + '</div>';

  groupOrder.forEach(function(lore) {
    var col = _npcLoreColor(lore);
    var ico = _npcLoreIcon(lore);
    html += '<div class="npc-section">' +
      '<div class="npc-section-header" style="color:' + col.c + ';border-bottom-color:' + col.c + '40">' +
        '<span>' + ico + '</span>' + lore +
        '<span class="npc-section-count">' + groups[lore].length + '</span>' +
      '</div>' +
      '<div class="npc-posters">';

    groups[lore].forEach(function(npc) {
      var titleSafe = npc.title.replace(/'/g,"\\'").replace(/"/g,'&quot;');
      var imp = npc.importanza || '';
      var impStyle = imp ? _npcImpStyle(imp) : null;
      var col2 = _npcLoreColor(lore);

      var impBadge = impStyle
        ? '<div class="npc-poster-imp" style="color:' + impStyle.c + ';border-color:' + impStyle.border + '">' + impStyle.label + '</div>'
        : '<div class="npc-poster-imp" style="opacity:0;pointer-events:none">·</div>';

      html +=
        '<div class="npc-poster" data-imp="' + imp + '"' +
          ' onclick="gp(\'' + npc.id + '\',\'' + titleSafe + '\',\'' + (npc.icon !== '📄' ? npc.icon : '👤') + '\')">' +
          '<div class="npc-poster-texture"></div>' +
          '<div class="npc-poster-corner npc-corner-tl"></div>' +
          '<div class="npc-poster-corner npc-corner-tr"></div>' +
          '<div class="npc-poster-corner npc-corner-bl"></div>' +
          '<div class="npc-poster-corner npc-corner-br"></div>' +
          '<div class="npc-poster-inner">' +
            impBadge +
            '<div class="npc-poster-avatar">' + (npc.icon !== '📄' ? npc.icon : '👤') + '</div>' +
            '<div class="npc-poster-divider" style="border-color:' + col2.c + '40"></div>' +
            '<div class="npc-poster-name">' + npc.title + '</div>' +
            '<div class="npc-poster-lore-badge" style="background:' + col2.bg + ';color:' + col2.c + ';border-color:' + col2.c + '60">' + ico + ' ' + lore + '</div>' +
          '</div>' +
          '<div class="npc-poster-footer">LEGGI LA SCHEDA →</div>' +
        '</div>';
    });

    html += '</div></div>';
  });

  board.innerHTML = html;
  _applyNpcFilter(board.closest('.npc-layout').parentElement);
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
  width: calc(100% + 80px);
  margin-left: -40px;
  min-height: 600px;
  border: 1px solid rgba(200,155,60,.2);
  border-radius: 2px;
  overflow: hidden;
}
.npc-sidebar {
  border-right: 1px solid rgba(200,155,60,.15);
  background: rgba(4,3,2,.9);
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
.npc-city-item:hover { color: rgba(220,205,170,.9); background: rgba(200,155,60,.05); }
.npc-city-item.active { color: #c89b3c; background: rgba(200,155,60,.08); border-left-color: #c89b3c; font-weight: 600; }

/* ── Main area ── */
.npc-main {
  display: flex;
  flex-direction: column;
  background: rgba(8,6,3,.7);
  overflow: hidden;
}

/* ── Filtro importanza ── */
.npc-filter-bar {
  display: flex;
  gap: 8px;
  padding: 14px 28px;
  border-bottom: 1px solid rgba(200,155,60,.12);
  background: rgba(4,3,2,.6);
  flex-shrink: 0;
}
.npc-filter-btn {
  font-family: 'Cinzel', serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .15em;
  text-transform: uppercase;
  color: rgba(200,180,140,.45);
  background: transparent;
  border: 1px solid rgba(200,155,60,.15);
  border-radius: 1px;
  padding: 6px 16px;
  cursor: pointer;
  transition: all .2s;
}
.npc-filter-btn:hover { color: rgba(200,180,140,.8); border-color: rgba(200,155,60,.4); }
.npc-filter-btn.active { color: #c89b3c; border-color: #c89b3c; background: rgba(200,155,60,.08); }

/* ── Board ── */
.npc-board {
  padding: 28px 32px;
  overflow-y: auto;
  max-height: 82vh;
  flex: 1;
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
  margin-bottom: 28px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(200,155,60,.25);
  display: flex;
  align-items: center;
  gap: 12px;
}

/* ── Sezione ── */
.npc-section { margin-bottom: 36px; }
.npc-section-header {
  font-family: 'Cinzel', serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .22em;
  text-transform: uppercase;
  margin-bottom: 16px;
  padding-bottom: 9px;
  border-bottom: 1px solid;
  display: flex;
  align-items: center;
  gap: 8px;
}
.npc-section-count { margin-left: auto; font-size: 8px; opacity: .45; font-weight: 400; }
.npc-posters { display: flex; flex-wrap: wrap; gap: 16px; }

/* ── Poster ── */
.npc-poster {
  width: 148px;
  min-height: 215px;
  position: relative;
  cursor: pointer;
  transition: transform .2s ease, box-shadow .2s ease;
  border-radius: 1px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(160deg, #1e1a0e 0%, #161208 40%, #100e06 70%, #1a1508 100%);
  border: 1px solid rgba(200,155,60,.3);
  box-shadow: 0 4px 18px rgba(0,0,0,.65), inset 0 0 40px rgba(0,0,0,.35), inset 0 1px 0 rgba(200,155,60,.12);
  overflow: hidden;
}
.npc-poster:hover {
  transform: translateY(-6px) rotate(.4deg);
  box-shadow: 0 14px 36px rgba(0,0,0,.8), 0 0 18px rgba(200,155,60,.07);
}
.npc-poster-texture {
  position: absolute; inset: 0; pointer-events: none; z-index: 0;
  background-image:
    repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(200,155,60,.013) 2px, rgba(200,155,60,.013) 4px),
    repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(200,155,60,.008) 3px, rgba(200,155,60,.008) 6px);
}
.npc-poster-corner {
  position: absolute; width: 11px; height: 11px;
  border-color: rgba(200,155,60,.45); border-style: solid; z-index: 2;
}
.npc-corner-tl { top:6px; left:6px; border-width:1px 0 0 1px; }
.npc-corner-tr { top:6px; right:6px; border-width:1px 1px 0 0; }
.npc-corner-bl { bottom:6px; left:6px; border-width:0 0 1px 1px; }
.npc-corner-br { bottom:6px; right:6px; border-width:0 1px 1px 0; }

.npc-poster-inner {
  position: relative; z-index: 1; flex: 1;
  display: flex; flex-direction: column; align-items: center;
  padding: 14px 12px 10px; gap: 7px;
}
.npc-poster-imp {
  font-family: 'Cinzel', serif; font-size: 6px; font-weight: 700;
  letter-spacing: .18em; text-transform: uppercase;
  padding: 3px 8px; border: 1px solid; border-radius: 1px;
}
.npc-poster-avatar {
  font-size: 2.5em; line-height: 1;
  filter: drop-shadow(0 2px 5px rgba(0,0,0,.6));
  margin: 2px 0;
}
.npc-poster-divider { width: 55%; border-top: 1px solid; opacity: .5; }
.npc-poster-name {
  font-family: 'Cinzel', serif; font-size: 10.5px; font-weight: 700;
  letter-spacing: .03em; color: rgba(235,220,185,.95);
  text-align: center; line-height: 1.45;
  text-shadow: 0 1px 4px rgba(0,0,0,.8);
}
.npc-poster-lore-badge {
  font-family: 'Cinzel', serif; font-size: 7px; letter-spacing: .09em;
  text-transform: uppercase; padding: 3px 8px;
  border: 1px solid; border-radius: 1px; text-align: center; opacity: .85;
}
.npc-poster-footer {
  position: relative; z-index: 1;
  font-family: 'Cinzel', serif; font-size: 7px; letter-spacing: .14em;
  color: rgba(200,155,60,.8); text-align: center;
  padding: 7px 6px; border-top: 1px solid rgba(200,155,60,.12);
  background: rgba(0,0,0,.3); opacity: 0; transition: opacity .2s;
}
.npc-poster:hover .npc-poster-footer { opacity: 1; }

.npc-loading { display: flex; justify-content: center; padding: 60px 0; }
.npc-err { font-family:'Cinzel',serif; font-size:11px; color:rgba(200,155,60,.35); padding:60px; text-align:center; }

@media (max-width: 640px) {
  .npc-layout { grid-template-columns:1fr; width:100%; margin-left:0; }
  .npc-sidebar { border-right:none; border-bottom:1px solid rgba(200,155,60,.15); max-height:150px; }
  .npc-board { padding:18px 14px; max-height:none; }
  .npc-filter-bar { padding:10px 14px; flex-wrap:wrap; }
  .npc-poster { width:130px; min-height:190px; }
}
  `;
  document.head.appendChild(s);
}
