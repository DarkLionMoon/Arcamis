/* ════════════════════════════════════
   ARCAMIS — mestiere.js
   Renderer universale per le pagine
   dei Mestieri. Carica dati da
   Google Sheets (CSV pubblico).
════════════════════════════════════ */

var _MESTIERI = {
  'alchimista': {
    nome: 'Alchimista',
    emoji: '⚗️',
    sheetId: '1uhrl26JgLv3pkqkqUwJITeVRC66sDsEn_7iRna9bk4Q',
    livelli: [1, 2],
    colore: 'rgba(80,180,160,.8)',
    bg: 'radial-gradient(ellipse 90% 60% at 50% 80%,#061c1a 0%,#040e0e 50%,#020606 100%)',
  },
  'architetto': {
    nome: 'Architetto',
    emoji: '🏛️',
    sheetId: '1lqgabVPdkmxCgAyTS9FJlarpk6kaVUoDEMXd6hF5mps',
    livelli: [1, 2],
    colore: 'rgba(190,140,60,.8)',
    bg: 'radial-gradient(ellipse 90% 60% at 50% 80%,#201408 0%,#120c04 50%,#060400 100%)',
  },
  'artigiano': {
    nome: 'Artigiano',
    emoji: '🔨',
    sheetId: '1pcNTvNKOzV3dl-cwAFcm-r4gxVN-F8_G2tdkvSl_Oss',
    livelli: [1, 2],
    colore: 'rgba(180,110,40,.8)',
    bg: 'radial-gradient(ellipse 90% 60% at 50% 80%,#1e1006 0%,#100804 50%,#060200 100%)',
  },
  'artista': {
    nome: 'Artista',
    emoji: '🎨',
    sheetId: '14wN27A8m6_dLCwrqFDRhgt_OsVdOGd0on8s6iuGpkv4',
    livelli: [1, 2],
    colore: 'rgba(240,100,160,.8)',
    bg: 'radial-gradient(ellipse 90% 60% at 50% 80%,#200814 0%,#120408 50%,#060204 100%)',
  },
  'falegname': {
    nome: 'Falegname',
    emoji: '🪚',
    sheetId: '1TY1jBO27VNy_czEfeLtgJr8f2KQLDospO85sIgLM3Xo',
    livelli: [1, 2],
    colore: 'rgba(160,100,50,.8)',
    bg: 'radial-gradient(ellipse 90% 60% at 50% 80%,#180c04 0%,#0e0802 50%,#060400 100%)',
  },
  'metallurgo': {
    nome: 'Metallurgo',
    emoji: '⚒️',
    sheetId: '193EbLwI0nkFDhLA4WSeLympCEKtQIXtIuEbrC2fTNLc',
    livelli: [1, 2],
    colore: 'rgba(160,160,180,.8)',
    bg: 'radial-gradient(ellipse 90% 60% at 50% 80%,#0e0e14 0%,#080810 50%,#040408 100%)',
  },
  'oste': {
    nome: 'Oste',
    emoji: '🍺',
    sheetId: '1jMCKim7y6Z730I92VJdyMBK_JFMdh7PkuALBxOAmHcM',
    livelli: [1, 2],
    colore: 'rgba(200,140,40,.8)',
    bg: 'radial-gradient(ellipse 90% 60% at 50% 80%,#1e1006 0%,#100802 50%,#060400 100%)',
  },
  'sarto': {
    nome: 'Sarto',
    emoji: '🧵',
    sheetId: '1Q-YNWmRyIjCO0ReQ8KoYa_bHRxQLJ-DOU7QyDPqJBHU',
    livelli: [1, 2],
    colore: 'rgba(180,80,220,.8)',
    bg: 'radial-gradient(ellipse 90% 60% at 50% 80%,#14083c 0%,#0a0420 50%,#04020e 100%)',
  },
  'come-funzionano': {
    nome: 'Come Funzionano i Mestieri',
    emoji: '📜',
    docId: '1alXhUBS7xRFduBjlN6fwuilIgQDznsOehe4nTiCsIK0',
    colore: 'rgba(200,155,60,.8)',
    bg: 'radial-gradient(ellipse 90% 60% at 50% 80%,#0e0c04 0%,#080602 50%,#040200 100%)',
  }
};

/* ── URL helper ── */
function _csvUrl(sheetId, tab) {
  return 'https://docs.google.com/spreadsheets/d/' + sheetId + '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(tab);
}

/* ── CSV parser semplice ── */
function _parseCsv(text) {
  var rows = [];
  var lines = text.split('\n');
  lines.forEach(function(line) {
    if (!line.trim()) return;
    var row = [];
    var inQ = false, cur = '';
    for (var i = 0; i < line.length; i++) {
      var c = line[i];
      if (c === '"') { inQ = !inQ; }
      else if (c === ',' && !inQ) { row.push(cur.trim()); cur = ''; }
      else { cur += c; }
    }
    row.push(cur.trim());
    rows.push(row);
  });
  return rows;
}

/* ── CSS injection ── */
function _injectMestiereCSS() {
  if (document.getElementById('mestiere-css')) return;
  var s = document.createElement('style');
  s.id = 'mestiere-css';
  s.textContent = `
.ms-wrap { width: 100%; }

/* Header mestiere */
.ms-header {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(200,155,60,.15);
}
.ms-header-icon {
  font-size: 36px;
  flex-shrink: 0;
  filter: drop-shadow(0 0 12px var(--ms-c, rgba(200,155,60,.5)));
}
.ms-header-body { flex: 1; }
.ms-header-title {
  font-family: 'Cinzel', serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--ms-c, rgba(200,155,60,.9));
  letter-spacing: .06em;
  margin-bottom: 4px;
}
.ms-header-sub {
  font-family: 'Crimson Pro', serif;
  font-size: 14px;
  color: rgba(200,180,140,.5);
  font-style: italic;
}

/* Tab bar */
.ms-tabs {
  display: flex;
  gap: 2px;
  margin-bottom: 28px;
  border-bottom: 1px solid rgba(200,155,60,.15);
  flex-wrap: wrap;
}
.ms-tab {
  font-family: 'Cinzel', serif;
  font-size: 9.5px;
  letter-spacing: .12em;
  color: rgba(240,230,200,.45);
  padding: 9px 18px;
  cursor: pointer;
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  transition: .15s;
  margin-bottom: -1px;
  text-transform: uppercase;
}
.ms-tab:hover {
  color: rgba(240,230,200,.8);
  background: rgba(200,155,60,.05);
  border-color: rgba(200,155,60,.1);
}
.ms-tab.active {
  color: var(--ms-c, rgba(200,155,60,.9));
  background: rgba(6,8,18,.9);
  border-color: rgba(200,155,60,.25);
  border-bottom-color: rgba(6,8,18,.9);
}

/* Pannello intro */
.ms-intro-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.ms-intro-section {
  background: rgba(200,155,60,.03);
  border: 1px solid rgba(200,155,60,.1);
  border-left: 3px solid var(--ms-c, rgba(200,155,60,.5));
  padding: 18px 22px;
}
.ms-intro-section-title {
  font-family: 'Cinzel', serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .22em;
  color: var(--ms-c, rgba(200,155,60,.7));
  text-transform: uppercase;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.ms-intro-section-title::before {
  content: '◆';
  font-size: 6px;
  opacity: .6;
}
.ms-intro-section-body {
  font-family: 'Crimson Pro', serif;
  font-size: 16px;
  line-height: 1.75;
  color: rgba(220,200,160,.75);
}

/* Livelli badges */
.ms-level-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}
.ms-level-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border: 1px solid var(--ms-c, rgba(200,155,60,.3));
  background: rgba(0,0,0,.4);
  font-family: 'Cinzel', serif;
  font-size: 9px;
  letter-spacing: .1em;
  color: var(--ms-c, rgba(200,155,60,.8));
}
.ms-level-badge span:first-child { opacity: .5; font-size: 8px; }

/* Tabella oggetti */
.ms-table-wrap {
  overflow-x: auto;
  margin: 0;
}
.ms-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.ms-table thead th {
  background: rgba(0,0,0,.5);
  color: var(--ms-c, rgba(200,155,60,.8));
  font-family: 'Cinzel', serif;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: .14em;
  padding: 10px 14px;
  border: 1px solid rgba(200,155,60,.15);
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}
.ms-table tbody td {
  padding: 9px 14px;
  border: 1px solid rgba(200,155,60,.08);
  color: rgba(220,200,160,.8);
  font-family: 'Crimson Pro', serif;
  font-size: 15px;
  line-height: 1.4;
  vertical-align: top;
}
.ms-table tbody tr:nth-child(odd) td {
  background: rgba(200,155,60,.02);
}
.ms-table tbody tr:hover td {
  background: rgba(200,155,60,.06);
}
.ms-table tbody td:first-child {
  font-family: 'Cinzel', serif;
  font-size: 11px;
  font-weight: 700;
  color: rgba(240,220,180,.9);
  letter-spacing: .04em;
  white-space: nowrap;
}

/* Badge Progetto */
.ms-badge-prog {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(200,155,60,.1);
  border: 1px solid rgba(200,155,60,.25);
  color: rgba(200,155,60,.8);
  font-family: 'Cinzel', serif;
  font-size: 7.5px;
  letter-spacing: .1em;
  text-transform: uppercase;
  margin-left: 6px;
  vertical-align: middle;
}

/* Badge tipologia */
.ms-badge-tipo {
  display: inline-block;
  padding: 2px 8px;
  font-family: 'Cinzel', serif;
  font-size: 7.5px;
  letter-spacing: .08em;
  text-transform: uppercase;
  border: 1px solid;
}
.ms-badge-common { border-color: rgba(160,160,160,.3); color: rgba(180,180,180,.7); background: rgba(150,150,150,.06); }
.ms-badge-uncommon { border-color: rgba(80,200,80,.3); color: rgba(80,220,80,.8); background: rgba(60,180,60,.06); }
.ms-badge-rare { border-color: rgba(80,120,220,.3); color: rgba(100,140,240,.8); background: rgba(60,100,200,.06); }
.ms-badge-very-rare { border-color: rgba(160,60,220,.3); color: rgba(180,80,240,.8); background: rgba(140,40,200,.06); }
.ms-badge-legendary { border-color: rgba(220,160,40,.3); color: rgba(240,180,60,.8); background: rgba(200,140,20,.06); }
.ms-badge-adventuring { border-color: rgba(80,160,220,.3); color: rgba(100,180,240,.8); background: rgba(60,140,200,.06); }

/* DT columns */
.ms-dt-cell {
  text-align: center;
  font-family: 'Cinzel', serif;
  font-size: 12px;
  color: var(--ms-c, rgba(200,155,60,.7));
}
.ms-dt-lv-header {
  text-align: center;
  min-width: 60px;
}

/* Valore celle */
.ms-val-mo {
  font-family: 'Cinzel', serif;
  font-size: 12px;
  color: rgba(200,155,60,.9);
  white-space: nowrap;
}

/* Loading */
.ms-loading {
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
.ms-loading-spin {
  width: 28px;
  height: 28px;
  border: 2px solid rgba(200,155,60,.15);
  border-top-color: rgba(200,155,60,.7);
  border-radius: 50%;
  animation: ms-spin .8s linear infinite;
}
@keyframes ms-spin { to { transform: rotate(360deg); } }

/* Doc panel */
.ms-doc-panel {
  font-family: 'Crimson Pro', serif;
  font-size: 16px;
  line-height: 1.8;
  color: rgba(220,200,160,.75);
}
.ms-doc-panel h2 {
  font-family: 'Cinzel', serif;
  font-size: 15px;
  color: var(--ms-c, rgba(200,155,60,.9));
  letter-spacing: .08em;
  margin: 24px 0 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(200,155,60,.12);
}
.ms-doc-panel p { margin: 0 0 12px; }

/* Descrizione tooltip */
.ms-desc-cell {
  max-width: 260px;
  font-size: 13px;
  color: rgba(200,180,140,.6);
  font-style: italic;
}

/* Link descrizione */
.ms-desc-link {
  color: var(--ms-c, rgba(200,155,60,.7));
  font-family: 'Cinzel', serif;
  font-size: 8px;
  letter-spacing: .1em;
  text-decoration: none;
  border-bottom: 1px dotted currentColor;
  opacity: .7;
  transition: opacity .15s;
}
.ms-desc-link:hover { opacity: 1; }

/* Empty state */
.ms-empty {
  text-align: center;
  padding: 60px 20px;
  color: rgba(200,155,60,.3);
  font-family: 'Cinzel', serif;
  font-size: 11px;
  letter-spacing: .15em;
}

@media (max-width: 700px) {
  .ms-table thead th, .ms-table tbody td { padding: 7px 10px; font-size: 12px; }
  .ms-table tbody td:first-child { font-size: 10px; }
  .ms-tabs { gap: 1px; }
  .ms-tab { padding: 7px 12px; font-size: 8.5px; }
  .ms-intro-section { padding: 14px 16px; }
}
  `;
  document.head.appendChild(s);
}

/* ── Tipologia → badge CSS class ── */
function _tipoBadge(tipo) {
  if (!tipo) return '';
  var t = tipo.toLowerCase().replace(/\s+/g, '-');
  var cls = 'ms-badge-tipo ';
  if (t.indexOf('common') > -1 && t.indexOf('un') === -1) cls += 'ms-badge-common';
  else if (t.indexOf('uncommon') > -1) cls += 'ms-badge-uncommon';
  else if (t.indexOf('very') > -1) cls += 'ms-badge-very-rare';
  else if (t.indexOf('rare') > -1) cls += 'ms-badge-rare';
  else if (t.indexOf('legendary') > -1) cls += 'ms-badge-legendary';
  else if (t.indexOf('adventuring') > -1) cls += 'ms-badge-adventuring';
  else cls += 'ms-badge-common';
  return '<span class="' + cls + '">' + tipo + '</span>';
}

/* ── Render tab Introduzione ── */
function _renderIntro(rows, mestiere) {
  /* Il CSV dell'intro ha testo libero in colonna A */
  var sections = [];
  var current = null;

  rows.forEach(function(row) {
    var cell = (row[0] || '').trim();
    if (!cell) return;

    /* Heuristica: righe brevi senza punto finale = titolo sezione */
    var isTitolo = cell.length < 80 && cell.indexOf('.') === -1 && cell.indexOf(',') === -1;

    if (isTitolo && cell.length > 2) {
      current = { titolo: cell, testo: [] };
      sections.push(current);
    } else if (current) {
      current.testo.push(cell);
    } else {
      current = { titolo: '', testo: [cell] };
      sections.push(current);
    }
  });

  if (!sections.length) {
    return '<div class="ms-empty">Nessun contenuto disponibile.</div>';
  }

  var h = '<div class="ms-intro-panel">';
  sections.forEach(function(sec) {
    if (!sec.titolo && !sec.testo.length) return;
    h += '<div class="ms-intro-section">';
    if (sec.titolo) {
      h += '<div class="ms-intro-section-title">' + sec.titolo + '</div>';
    }
    if (sec.testo.length) {
      h += '<div class="ms-intro-section-body">' + sec.testo.join('<br><br>') + '</div>';
    }
    h += '</div>';
  });
  h += '</div>';
  return h;
}

/* ── Render tab Livello ── */
function _renderLivello(rows, mestiere) {
  if (!rows || rows.length < 2) {
    return '<div class="ms-empty">Nessun dato per questo livello.</div>';
  }

  /* Prima riga = intestazioni */
  var headers = rows[0];
  var data = rows.slice(1).filter(function(r) {
    return r.some(function(c) { return c && c.trim(); });
  });

  if (!data.length) {
    return '<div class="ms-empty">⏳ Contenuto in arrivo...</div>';
  }

  /* Identifica colonne */
  var colNome = -1, colProgetto = -1, colMatPrinc = -1, colMatSec = -1;
  var colTipo = -1, colDesc = -1, colValCraft = -1, colValVend = -1;
  var colDtLv = {};

  headers.forEach(function(h, i) {
    var hn = (h || '').toLowerCase().trim();
    if (hn === 'nome' || hn === 'home') colNome = i;
    else if (hn === 'progetto') colProgetto = i;
    else if (hn.indexOf('principale') > -1) colMatPrinc = i;
    else if (hn.indexOf('secondario') > -1) colMatSec = i;
    else if (hn === 'tipologia') colTipo = i;
    else if (hn === 'descrizione') colDesc = i;
    else if (hn.indexOf('crafting') > -1) colValCraft = i;
    else if (hn.indexOf('vendita') > -1) colValVend = i;
    else if (hn.indexOf('dt') > -1 || hn.indexOf('n°') > -1) {
      /* Colonne DT per livello maestro */
      var lvMatch = hn.match(/lv(\d+)/i);
      if (lvMatch) colDtLv[lvMatch[1]] = i;
    }
  });

  /* Costruisci tabella */
  var h = '<div class="ms-table-wrap"><table class="ms-table"><thead><tr>';

  /* Colonne sempre visibili */
  h += '<th>Nome</th>';
  if (colMatPrinc > -1) h += '<th>Materiale Principale</th>';
  if (colMatSec > -1) h += '<th>Materiale Secondario</th>';
  if (colTipo > -1) h += '<th>Tipologia</th>';
  if (colValCraft > -1) h += '<th>Valore Crafting</th>';
  if (colValVend > -1) h += '<th>Valore Vendita</th>';

  /* Colonne DT */
  var lvKeys = Object.keys(colDtLv).sort();
  lvKeys.forEach(function(lv) {
    h += '<th class="ms-dt-lv-header">DT LV' + lv + '</th>';
  });

  h += '</tr></thead><tbody>';

  data.forEach(function(row) {
    var nome = colNome > -1 ? (row[colNome] || '') : '';
    if (!nome.trim()) return;

    var isProgetto = colProgetto > -1 && (row[colProgetto] || '').toLowerCase().trim() === 'si';
    var descLink = colDesc > -1 ? (row[colDesc] || '') : '';

    h += '<tr>';

    /* Nome + badge progetto */
    h += '<td>' + nome;
    if (isProgetto) h += '<span class="ms-badge-prog">Progetto</span>';
    if (descLink && descLink.toLowerCase().indexOf('http') > -1) {
      h += '<br><a href="' + descLink + '" target="_blank" rel="noopener" class="ms-desc-link">Descrizione →</a>';
    }
    h += '</td>';

    if (colMatPrinc > -1) h += '<td>' + (row[colMatPrinc] || '—') + '</td>';
    if (colMatSec > -1) h += '<td>' + (row[colMatSec] || '—') + '</td>';
    if (colTipo > -1) h += '<td>' + _tipoBadge(row[colTipo] || '') + '</td>';
    if (colValCraft > -1) h += '<td class="ms-val-mo">' + (row[colValCraft] || '—') + ' MO</td>';
    if (colValVend > -1) h += '<td class="ms-val-mo">' + (row[colValVend] || '—') + ' MO</td>';

    lvKeys.forEach(function(lv) {
      var val = colDtLv[lv] > -1 ? (row[colDtLv[lv]] || '') : '';
      h += '<td class="ms-dt-cell">' + (val || '—') + '</td>';
    });

    h += '</tr>';
  });

  h += '</tbody></table></div>';
  return h;
}

/* ── Mostra tab ── */
function _msShowTab(key, tabName, container, mestiere) {
  /* Aggiorna active tab */
  container.querySelectorAll('.ms-tab').forEach(function(t) {
    t.classList.toggle('active', t.getAttribute('data-tab') === tabName);
  });

  var panel = container.querySelector('.ms-panel');
  if (!panel) return;

  panel.innerHTML = '<div class="ms-loading"><div class="ms-loading-spin"></div><span>Caricamento...</span></div>';

  var url;
  if (tabName === 'Introduzione') {
    url = _csvUrl(mestiere.sheetId, 'Introduzione');
  } else {
    url = _csvUrl(mestiere.sheetId, tabName);
  }

  fetch(url)
    .then(function(r) { return r.text(); })
    .then(function(text) {
      var rows = _parseCsv(text);
      var html;
      if (tabName === 'Introduzione') {
        html = _renderIntro(rows, mestiere);
      } else {
        html = _renderLivello(rows, mestiere);
      }
      panel.innerHTML = html;
    })
    .catch(function(e) {
      panel.innerHTML = '<div class="ms-empty">⚠️ Errore caricamento dati.</div>';
    });
}

/* ── Mostra "Come funzionano" da Google Doc ── */
function _showComeFunzionano(container, mestiere) {
  var panel = container.querySelector('.ms-panel');
  if (!panel) return;

  panel.innerHTML = '<div class="ms-loading"><div class="ms-loading-spin"></div><span>Caricamento...</span></div>';

  /* Usa l'export come testo plain del Google Doc */
  var url = 'https://docs.google.com/document/d/' + mestiere.docId + '/export?format=txt';

  fetch(url)
    .then(function(r) { return r.text(); })
    .then(function(text) {
      /* Converte testo plain in HTML semplice */
      var lines = text.split('\n');
      var html = '<div class="ms-doc-panel">';
      lines.forEach(function(line) {
        line = line.trim();
        if (!line) return;
        /* Heuristica titoli: breve, tutto maiuscolo o senza punto */
        if (line.length < 80 && (line === line.toUpperCase() || line.indexOf('.') === -1) && line.length > 3) {
          html += '<h2>' + line + '</h2>';
        } else {
          html += '<p>' + line + '</p>';
        }
      });
      html += '</div>';
      panel.innerHTML = html;
    })
    .catch(function() {
      /* Fallback: link diretto */
      panel.innerHTML = '<div class="ms-intro-section">'
        + '<div class="ms-intro-section-body">Non è stato possibile caricare il documento direttamente.'
        + ' <a href="https://docs.google.com/document/d/' + mestiere.docId + '/view" target="_blank" rel="noopener" class="ms-desc-link">Aprilo su Google Docs →</a>'
        + '</div></div>';
    });
}

/* ════════════════════════════════════
   FUNZIONE PRINCIPALE
   showMestiere(key)
   key = 'alchimista' | 'architetto' | ecc.
════════════════════════════════════ */
window.showMestiere = function(key) {
  var mestiere = _MESTIERI[key];
  if (!mestiere) return;

  _injectMestiereCSS();

  /* Naviga tramite il sistema SPA esistente */
  var fakeId = 'mestiere-' + key;

  /* Prepara UI come se fosse una pagina */
  var phTitle = document.getElementById('ph-title');
  var phIcon = document.getElementById('ph-icon');
  var phCovbg = document.getElementById('ph-covbg');
  var phOverlay = document.getElementById('ph-overlay');
  var phEyebrow = document.getElementById('ph-eyebrow');
  var phSub = document.getElementById('ph-sub');
  var phHero = document.getElementById('page-hero');
  var phCrumb = document.getElementById('ph-crumb');
  var hv = document.getElementById('hv');
  var pv = document.getElementById('pv');

  if (!phTitle) return;

  navStack.push({ id: fakeId, label: mestiere.nome, icon: mestiere.emoji });
  history.pushState(
    { id: fakeId, label: mestiere.nome, icon: mestiere.emoji, stack: navStack.slice(0, -1) },
    '',
    location.pathname + '?p=' + fakeId
  );

  closeDd && closeDd();

  phTitle.textContent = mestiere.nome;
  phIcon.textContent = mestiere.emoji;
  phEyebrow.textContent = 'Mestieri di Arcamis';
  phSub.textContent = '';
  phCovbg.style.backgroundImage = '';
  phOverlay.style.opacity = '0';
  phIcon.style.opacity = '0.06';
  phCrumb.innerHTML = buildCrumb(mestiere.nome);
  document.title = mestiere.nome + ' — Arcamis';

  var acc = { c: mestiere.colore, bg: mestiere.colore.replace('.8', '.06') };
  phHero.style.setProperty('--ph-acc', acc.c);
  phHero.style.setProperty('--ph-accbg', acc.bg);

  if (hv && hv.style.display === 'block') {
    xfade(hv, pv);
    document.getElementById('main').scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    document.getElementById('main').scrollTo({ top: 0, behavior: 'smooth' });
    var pb = document.getElementById('pbody');
    pb.style.opacity = '0';
    pb.style.transition = 'opacity .15s ease';
    setTimeout(function() { pb.style.opacity = '1'; }, 50);
  }

  var pbody = document.getElementById('pbody');
  pbody.style.maxWidth = '';
  pbody.style.width = '';

  /* Render contenuto */
  var html = '<div class="ms-wrap nc" style="--ms-c:' + mestiere.colore + ';animation:fi .22s ease forwards">';

  if (mestiere.docId) {
    /* Documento "Come funzionano" — niente tab */
    html += '<div class="ms-panel"></div>';
    html += '</div>';
    pbody.innerHTML = html;
    var container = pbody.querySelector('.ms-wrap');
    _showComeFunzionano(container, mestiere);
  } else {
    /* Mestiere con sheet — tab bar */
    var tabs = ['Introduzione'];
    mestiere.livelli.forEach(function(lv) { tabs.push('LV ' + lv); });

    html += '<div class="ms-tabs">';
    tabs.forEach(function(tab, idx) {
      html += '<div class="ms-tab' + (idx === 0 ? ' active' : '') + '" data-tab="' + tab + '" onclick="msTabClick(this)">' + tab + '</div>';
    });
    html += '</div>';
    html += '<div class="ms-panel"></div>';
    html += '</div>';

    pbody.innerHTML = html;

    var container = pbody.querySelector('.ms-wrap');

    /* Funzione onclick tab */
    window.msTabClick = function(el) {
      var tabName = el.getAttribute('data-tab');
      _msShowTab(key, tabName, container, mestiere);
    };

    /* Carica primo tab */
    _msShowTab(key, 'Introduzione', container, mestiere);
  }

  if (typeof afterPageRender === 'function') afterPageRender();
};
