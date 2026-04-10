/* ════════════════════════════════════
   ARCAMIS — mestiere.js
   Renderer universale per le pagine
   dei Mestieri. Carica dati da
   Google Sheets (CSV pubblico).
════════════════════════════════════ */

var _MESTIERI = {
  'alchimista': {
    nome: 'Alchimista', emoji: '⚗️',
    sheetId: '1uhrl26JgLv3pkqkqUwJITeVRC66sDsEn_7iRna9bk4Q',
    livelli: [1, 2],
    colore: 'rgba(80,180,160,.8)',
  },
  'architetto': {
    nome: 'Architetto', emoji: '🏛️',
    sheetId: '1lqgabVPdkmxCgAyTS9FJlarpk6kaVUoDEMXd6hF5mps',
    livelli: [1, 2],
    colore: 'rgba(190,140,60,.8)',
  },
  'artigiano': {
    nome: 'Artigiano', emoji: '🔨',
    sheetId: '1pcNTvNKOzV3dl-cwAFcm-r4gxVN-F8_G2tdkvSl_Oss',
    livelli: [1, 2],
    colore: 'rgba(180,110,40,.8)',
  },
  'artista': {
    nome: 'Artista', emoji: '🎨',
    sheetId: '14wN27A8m6_dLCwrqFDRhgt_OsVdOGd0on8s6iuGpkv4',
    livelli: [1, 2],
    colore: 'rgba(240,100,160,.8)',
  },
  'falegname': {
    nome: 'Falegname', emoji: '🪚',
    sheetId: '1TY1jBO27VNy_czEfeLtgJr8f2KQLDospO85sIgLM3Xo',
    livelli: [1, 2],
    colore: 'rgba(160,100,50,.8)',
  },
  'metallurgo': {
    nome: 'Metallurgo', emoji: '⚒️',
    sheetId: '193EbLwI0nkFDhLA4WSeLympCEKtQIXtIuEbrC2fTNLc',
    livelli: [1, 2],
    colore: 'rgba(160,160,180,.8)',
  },
  'oste': {
    nome: 'Oste', emoji: '🍺',
    sheetId: '1jMCKim7y6Z730I92VJdyMBK_JFMdh7PkuALBxOAmHcM',
    livelli: [1, 2],
    colore: 'rgba(200,140,40,.8)',
  },
  'sarto': {
    nome: 'Sarto', emoji: '🧵',
    sheetId: '1Q-YNWmRyIjCO0ReQ8KoYa_bHRxQLJ-DOU7QyDPqJBHU',
    livelli: [1, 2],
    colore: 'rgba(180,80,220,.8)',
  },
  'come-funzionano': {
    nome: 'Come Funzionano i Mestieri', emoji: '📜',
    docId: '1alXhUBS7xRFduBjlN6fwuilIgQDznsOehe4nTiCsIK0',
    colore: 'rgba(200,155,60,.8)',
  }
};

/* ── URL helper ── */
function _csvUrl(sheetId, tab) {
  return 'https://docs.google.com/spreadsheets/d/' + sheetId + '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(tab);
}

/* ── CSV parser robusto — gestisce newline nelle celle quoted ── */
function _parseCsv(text) {
  var rows = [];
  var row = [];
  var cur = '';
  var inQ = false;

  for (var i = 0; i < text.length; i++) {
    var c = text[i];
    var next = text[i + 1];

    if (inQ) {
      if (c === '"' && next === '"') { cur += '"'; i++; }
      else if (c === '"') { inQ = false; }
      else { cur += c; }
    } else {
      if (c === '"') { inQ = true; }
      else if (c === ',') { row.push(cur.trim()); cur = ''; }
      else if (c === '\n') { row.push(cur.trim()); cur = ''; rows.push(row); row = []; }
      else if (c === '\r') { /* skip */ }
      else { cur += c; }
    }
  }
  if (cur || row.length) { row.push(cur.trim()); rows.push(row); }
  return rows;
}

/* ── Normalizza header: rimuove newline e spazi extra ── */
function _normHeader(h) {
  return (h || '').replace(/\n/g, ' ').replace(/\s+/g, ' ').toLowerCase().trim();
}

/* ── CSS injection ── */
function _injectMestiereCSS() {
  if (document.getElementById('mestiere-css')) return;
  var s = document.createElement('style');
  s.id = 'mestiere-css';
  s.textContent = `
.ms-wrap { width: 100%; }

.ms-tabs {
  display: flex; gap: 2px; margin-bottom: 28px;
  border-bottom: 1px solid rgba(200,155,60,.15); flex-wrap: wrap;
}
.ms-tab {
  font-family: 'Cinzel', serif; font-size: 9.5px; letter-spacing: .12em;
  color: rgba(240,230,200,.45); padding: 9px 18px; cursor: pointer;
  border: 1px solid transparent; border-bottom: none;
  border-radius: 4px 4px 0 0; transition: .15s; margin-bottom: -1px; text-transform: uppercase;
}
.ms-tab:hover { color: rgba(240,230,200,.8); background: rgba(200,155,60,.05); border-color: rgba(200,155,60,.1); }
.ms-tab.active {
  color: var(--ms-c, rgba(200,155,60,.9)); background: rgba(6,8,18,.9);
  border-color: rgba(200,155,60,.25); border-bottom-color: rgba(6,8,18,.9);
}

.ms-intro-panel { display: flex; flex-direction: column; gap: 16px; }
.ms-intro-section {
  background: rgba(200,155,60,.03); border: 1px solid rgba(200,155,60,.1);
  border-left: 3px solid var(--ms-c, rgba(200,155,60,.5)); padding: 16px 20px;
}
.ms-intro-section-title {
  font-family: 'Cinzel', serif; font-size: 9px; font-weight: 700;
  letter-spacing: .22em; color: var(--ms-c, rgba(200,155,60,.7));
  text-transform: uppercase; margin-bottom: 10px;
  display: flex; align-items: center; gap: 8px;
}
.ms-intro-section-title::before { content: '◆'; font-size: 6px; opacity: .6; }
.ms-intro-section-body {
  font-family: 'Crimson Pro', serif; font-size: 16px;
  line-height: 1.75; color: rgba(220,200,160,.75);
}

.ms-table-wrap { overflow-x: auto; }
.ms-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.ms-table thead th {
  background: rgba(0,0,0,.5); color: var(--ms-c, rgba(200,155,60,.8));
  font-family: 'Cinzel', serif; font-size: 8px; font-weight: 700;
  letter-spacing: .14em; padding: 10px 14px;
  border: 1px solid rgba(200,155,60,.15);
  text-align: left; text-transform: uppercase; white-space: nowrap;
}
.ms-table tbody td {
  padding: 9px 14px; border: 1px solid rgba(200,155,60,.08);
  color: rgba(220,200,160,.8); font-family: 'Crimson Pro', serif;
  font-size: 15px; line-height: 1.4; vertical-align: top;
}
.ms-table tbody tr:nth-child(odd) td { background: rgba(200,155,60,.02); }
.ms-table tbody tr:hover td { background: rgba(200,155,60,.06); }
.ms-table tbody td:first-child {
  font-family: 'Cinzel', serif; font-size: 11px; font-weight: 700;
  color: rgba(240,220,180,.9); letter-spacing: .04em;
}

.ms-badge-prog {
  display: inline-block; padding: 2px 8px;
  background: rgba(200,155,60,.1); border: 1px solid rgba(200,155,60,.25);
  color: rgba(200,155,60,.8); font-family: 'Cinzel', serif;
  font-size: 7.5px; letter-spacing: .1em; text-transform: uppercase;
  margin-left: 6px; vertical-align: middle;
}
.ms-badge-tipo {
  display: inline-block; padding: 2px 8px; font-family: 'Cinzel', serif;
  font-size: 7.5px; letter-spacing: .08em; text-transform: uppercase; border: 1px solid;
}
.ms-badge-common    { border-color:rgba(160,160,160,.3);color:rgba(180,180,180,.7);background:rgba(150,150,150,.06); }
.ms-badge-uncommon  { border-color:rgba(80,200,80,.3);color:rgba(80,220,80,.8);background:rgba(60,180,60,.06); }
.ms-badge-rare      { border-color:rgba(80,120,220,.3);color:rgba(100,140,240,.8);background:rgba(60,100,200,.06); }
.ms-badge-very-rare { border-color:rgba(160,60,220,.3);color:rgba(180,80,240,.8);background:rgba(140,40,200,.06); }
.ms-badge-legendary { border-color:rgba(220,160,40,.3);color:rgba(240,180,60,.8);background:rgba(200,140,20,.06); }
.ms-badge-adventuring { border-color:rgba(80,160,220,.3);color:rgba(100,180,240,.8);background:rgba(60,140,200,.06); }

.ms-dt-cell { text-align:center; font-family:'Cinzel',serif; font-size:13px; color:var(--ms-c,rgba(200,155,60,.7)); }
.ms-dt-lv-header { text-align:center; min-width:55px; }
.ms-val-mo { font-family:'Cinzel',serif; font-size:12px; color:rgba(200,155,60,.9); white-space:nowrap; }

.ms-loading {
  display:flex; align-items:center; justify-content:center; height:200px;
  color:rgba(200,155,60,.4); font-family:'Cinzel',serif;
  font-size:10px; letter-spacing:.2em; flex-direction:column; gap:14px;
}
.ms-loading-spin {
  width:28px; height:28px; border:2px solid rgba(200,155,60,.15);
  border-top-color:rgba(200,155,60,.7); border-radius:50%;
  animation:ms-spin .8s linear infinite;
}
@keyframes ms-spin { to { transform:rotate(360deg); } }
.ms-empty { text-align:center; padding:60px 20px; color:rgba(200,155,60,.3); font-family:'Cinzel',serif; font-size:11px; letter-spacing:.15em; }

.ms-doc-panel { font-family:'Crimson Pro',serif; font-size:16px; line-height:1.8; color:rgba(220,200,160,.75); }
.ms-doc-panel h2 {
  font-family:'Cinzel',serif; font-size:15px; color:var(--ms-c,rgba(200,155,60,.9));
  letter-spacing:.08em; margin:24px 0 10px; padding-bottom:8px;
  border-bottom:1px solid rgba(200,155,60,.12);
}
.ms-doc-panel p { margin:0 0 12px; }

@media(max-width:700px){
  .ms-table thead th,.ms-table tbody td{padding:7px 10px;font-size:12px;}
  .ms-table tbody td:first-child{font-size:10px;}
  .ms-tab{padding:7px 12px;font-size:8.5px;}
}
  `;
  document.head.appendChild(s);
}

/* ── Tipologia → badge ── */
function _tipoBadge(tipo) {
  if (!tipo) return '';
  var t = tipo.toLowerCase();
  var cls = 'ms-badge-tipo ';
  if (t.indexOf('adventuring') > -1) cls += 'ms-badge-adventuring';
  else if (t.indexOf('very rare') > -1 || t.indexOf('very-rare') > -1) cls += 'ms-badge-very-rare';
  else if (t.indexOf('uncommon') > -1) cls += 'ms-badge-uncommon';
  else if (t.indexOf('rare') > -1) cls += 'ms-badge-rare';
  else if (t.indexOf('legendary') > -1) cls += 'ms-badge-legendary';
  else cls += 'ms-badge-common';
  return '<span class="' + cls + '">' + tipo + '</span>';
}

/* ── Render tab Introduzione ── */
function _renderIntro(rows) {
  var validRows = rows.filter(function(r) { return r[0] && r[0].trim(); });
  if (!validRows.length) return '<div class="ms-empty">Nessun contenuto disponibile.</div>';

  var sections = [];
  var current = null;

  validRows.forEach(function(row) {
    var cell = row[0].trim();
    /* Titolo: breve, non inizia con parole di testo descrittivo */
    var isTitolo = cell.length < 80
      && !cell.match(/[.,]$/)
      && cell.length > 3
      && !cell.match(/^(Il |La |Lo |Un |Una |Ogni |Per |Imparare |Livello PG)/i);
    if (isTitolo) {
      current = { titolo: cell, testo: [] };
      sections.push(current);
    } else {
      if (!current) { current = { titolo: '', testo: [] }; sections.push(current); }
      current.testo.push(cell);
    }
  });

  var h = '<div class="ms-intro-panel">';
  sections.forEach(function(sec) {
    h += '<div class="ms-intro-section">';
    if (sec.titolo) h += '<div class="ms-intro-section-title">' + sec.titolo + '</div>';
    if (sec.testo.length) h += '<div class="ms-intro-section-body">' + sec.testo.join('<br><br>') + '</div>';
    h += '</div>';
  });
  h += '</div>';
  return h;
}

/* ── Render tab Livello ── */
function _renderLivello(rows) {
  if (!rows || rows.length < 2) return '<div class="ms-empty">Nessun dato per questo livello.</div>';

  var rawHeaders = rows[0];
  var headers = rawHeaders.map(_normHeader);

  var data = rows.slice(1).filter(function(r) {
    return r.some(function(c) { return c && c.trim(); });
  });

  if (!data.length) return '<div class="ms-empty">⏳ Contenuto in arrivo...</div>';

  /* Mappa colonne */
  var colNome = -1, colProgetto = -1, colMatPrinc = -1, colMatSec = -1;
  var colTipo = -1, colDesc = -1, colValCraft = -1, colValVend = -1;
  var colDtLv = {};

  headers.forEach(function(h, i) {
    if (h === 'nome') colNome = i;
    else if (h === 'progetto') colProgetto = i;
    else if (h.indexOf('principale') > -1) colMatPrinc = i;
    else if (h.indexOf('secondari') > -1) colMatSec = i;
    else if (h === 'tipologia') colTipo = i;
    else if (h === 'descrizione') colDesc = i;
    else if (h.indexOf('crafting') > -1) colValCraft = i;
    else if (h.indexOf('vendita') > -1) colValVend = i;
    else {
      /* DT columns: "n° di dt prof lv1", "n° di dt prof lv2+", ecc. */
      var m = h.match(/lv\s*(\d+)/i);
      if (m && (h.indexOf('dt') > -1 || h.indexOf('prof') > -1)) {
        colDtLv[m[1]] = i;
      }
    }
  });

  var lvKeys = Object.keys(colDtLv).sort(function(a, b) { return parseInt(a) - parseInt(b); });

  var h = '<div class="ms-table-wrap"><table class="ms-table"><thead><tr>';
  h += '<th>Nome</th>';
  if (colMatPrinc > -1) h += '<th>Mat. Principale</th>';
  if (colMatSec > -1) h += '<th>Mat. Secondario</th>';
  if (colTipo > -1) h += '<th>Tipologia</th>';
  if (colValCraft > -1) h += '<th>Crafting</th>';
  if (colValVend > -1) h += '<th>Vendita</th>';
  lvKeys.forEach(function(lv) {
    h += '<th class="ms-dt-lv-header">DT LV' + lv + (parseInt(lv) > 1 ? '+' : '') + '</th>';
  });
  h += '</tr></thead><tbody>';

  data.forEach(function(row) {
    var nome = colNome > -1 ? (row[colNome] || '').trim() : '';
    if (!nome) return;

    var isProgetto = colProgetto > -1 && (row[colProgetto] || '').toLowerCase().trim() === 'si';
    var desc = colDesc > -1 ? (row[colDesc] || '').trim() : '';
    var descIsLink = desc.toLowerCase().indexOf('http') > -1 || desc.toLowerCase() === 'clicca qui';

    h += '<tr>';
    h += '<td>' + nome;
    if (isProgetto) h += '<span class="ms-badge-prog">Progetto</span>';
    if (desc && !descIsLink) {
      h += '<br><span style="font-family:\'Crimson Pro\',serif;font-size:13px;color:rgba(200,180,140,.55);font-style:italic">' + desc + '</span>';
    }
    h += '</td>';

    if (colMatPrinc > -1) h += '<td>' + (row[colMatPrinc] || '—') + '</td>';
    if (colMatSec > -1) h += '<td>' + (row[colMatSec] || '—') + '</td>';
    if (colTipo > -1) h += '<td>' + _tipoBadge(row[colTipo] || '') + '</td>';
    if (colValCraft > -1) h += '<td class="ms-val-mo">' + (row[colValCraft] || '—') + ' mo</td>';
    if (colValVend > -1) h += '<td class="ms-val-mo">' + (row[colValVend] || '—') + ' mo</td>';
    lvKeys.forEach(function(lv) {
      var val = colDtLv[lv] !== undefined ? (row[colDtLv[lv]] || '').trim() : '';
      h += '<td class="ms-dt-cell">' + (val || '—') + '</td>';
    });
    h += '</tr>';
  });

  h += '</tbody></table></div>';
  return h;
}

/* ── Mostra tab ── */
function _msShowTab(key, tabName, container, mestiere) {
  container.querySelectorAll('.ms-tab').forEach(function(t) {
    t.classList.toggle('active', t.getAttribute('data-tab') === tabName);
  });

  var panel = container.querySelector('.ms-panel');
  if (!panel) return;
  panel.innerHTML = '<div class="ms-loading"><div class="ms-loading-spin"></div><span>Caricamento...</span></div>';

  fetch(_csvUrl(mestiere.sheetId, tabName))
    .then(function(r) { return r.text(); })
    .then(function(text) {
      var rows = _parseCsv(text);
      panel.innerHTML = tabName === 'Introduzione' ? _renderIntro(rows) : _renderLivello(rows);
    })
    .catch(function() {
      panel.innerHTML = '<div class="ms-empty">⚠️ Errore caricamento dati.</div>';
    });
}

/* ── Come funzionano: Google Doc ── */
function _showComeFunzionano(container, mestiere) {
  var panel = container.querySelector('.ms-panel');
  if (!panel) return;
  panel.innerHTML = '<div class="ms-loading"><div class="ms-loading-spin"></div><span>Caricamento...</span></div>';

  fetch('https://docs.google.com/document/d/' + mestiere.docId + '/export?format=txt')
    .then(function(r) { return r.text(); })
    .then(function(text) {
      var lines = text.split('\n');
      var html = '<div class="ms-doc-panel">';
      lines.forEach(function(line) {
        line = line.trim();
        if (!line) return;
        var isTitolo = line.length < 80 && line === line.toUpperCase() && line.length > 3;
        html += isTitolo ? '<h2>' + line + '</h2>' : '<p>' + line + '</p>';
      });
      html += '</div>';
      panel.innerHTML = html;
    })
    .catch(function() {
      panel.innerHTML = '<div class="ms-intro-section"><div class="ms-intro-section-body">'
        + 'Non è stato possibile caricare il documento. '
        + '<a href="https://docs.google.com/document/d/' + mestiere.docId + '/view" target="_blank" rel="noopener" style="color:var(--ms-c);font-family:Cinzel,serif;font-size:11px;opacity:.7">Aprilo su Google Docs →</a>'
        + '</div></div>';
    });
}

/* ════════════════════════════════════
   FUNZIONE PRINCIPALE — showMestiere()
════════════════════════════════════ */
window.showMestiere = function(key) {
  var mestiere = _MESTIERI[key];
  if (!mestiere) return;

  _injectMestiereCSS();
  if (typeof closeDd === 'function') closeDd();

  var fakeId = 'mestiere-' + key;
  navStack.push({ id: fakeId, label: mestiere.nome, icon: mestiere.emoji });
  history.pushState(
    { id: fakeId, label: mestiere.nome, icon: mestiere.emoji, stack: navStack.slice(0, -1) },
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

  phTitle.textContent   = mestiere.nome;
  phIcon.textContent    = mestiere.emoji;
  phEyebrow.textContent = 'Mestieri di Arcamis';
  phSub.textContent     = '';
  phCovbg.style.backgroundImage = '';
  phOverlay.style.opacity = '0';
  phIcon.style.opacity    = '0.06';
  phCrumb.innerHTML = buildCrumb(mestiere.nome);
  document.title = mestiere.nome + ' — Arcamis';
  phHero.style.setProperty('--ph-acc', mestiere.colore);
  phHero.style.setProperty('--ph-accbg', mestiere.colore.replace('.8', '.06'));

  var pbody = document.getElementById('pbody');

  if (hv && hv.style.display === 'block') {
    xfade(hv, document.getElementById('pv'));
    document.getElementById('main').scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    document.getElementById('main').scrollTo({ top: 0, behavior: 'smooth' });
    pbody.style.opacity = '0';
    pbody.style.transition = 'opacity .15s ease';
    setTimeout(function() { pbody.style.opacity = '1'; }, 50);
  }

  /* Larghezza piena per la tabella */
  pbody.style.maxWidth = 'none';
  pbody.style.width = '100%';

  var html = '<div class="ms-wrap nc" style="--ms-c:' + mestiere.colore + ';animation:fi .22s ease forwards">';

  if (mestiere.docId) {
    html += '<div class="ms-panel"></div></div>';
    pbody.innerHTML = html;
    _showComeFunzionano(pbody.querySelector('.ms-wrap'), mestiere);
  } else {
    var tabs = ['Introduzione'];
    mestiere.livelli.forEach(function(lv) { tabs.push('LV ' + lv); });

    html += '<div class="ms-tabs">';
    tabs.forEach(function(tab, idx) {
      html += '<div class="ms-tab' + (idx === 0 ? ' active' : '') + '" data-tab="' + tab + '" onclick="msTabClick(this)">' + tab + '</div>';
    });
    html += '</div><div class="ms-panel"></div></div>';
    pbody.innerHTML = html;

    var container = pbody.querySelector('.ms-wrap');
    window.msTabClick = function(el) {
      _msShowTab(key, el.getAttribute('data-tab'), container, mestiere);
    };
    _msShowTab(key, 'Introduzione', container, mestiere);
  }

  if (typeof afterPageRender === 'function') afterPageRender();
};
