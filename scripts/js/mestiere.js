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
    colore: 'rgba(80,180,160,.8)',
  },
  'architetto': {
    nome: 'Architetto', emoji: '🏛️',
    sheetId: '1lqgabVPdkmxCgAyTS9FJlarpk6kaVUoDEMXd6hF5mps',
    colore: 'rgba(190,140,60,.8)',
  },
  'artigiano': {
    nome: 'Artigiano', emoji: '🔨',
    sheetId: '1pcNTvNKOzV3dl-cwAFcm-r4gxVN-F8_G2tdkvSl_Oss',
    colore: 'rgba(180,110,40,.8)',
  },
  'artista': {
  nome: 'Artista', emoji: '🎨',
  sheetId: '14wN27A8m6_dLCwrqFDRhgt_OsVdOGd0on8s6iuGpkv4',
  
  extra: ['Pergamene'],
  colore: 'rgba(240,100,160,.8)',
  },
  'falegname': {
    nome: 'Falegname', emoji: '🪚',
    sheetId: '1TY1jBO27VNy_czEfeLtgJr8f2KQLDospO85sIgLM3Xo',
    colore: 'rgba(160,100,50,.8)',
  },
  'metallurgo': {
    nome: 'Metallurgo', emoji: '⚒️',
    sheetId: '193EbLwI0nkFDhLA4WSeLympCEKtQIXtIuEbrC2fTNLc',
    colore: 'rgba(160,160,180,.8)',
  },
  'oste': {
    nome: 'Oste', emoji: '🍺',
    sheetId: '1jMCKim7y6Z730I92VJdyMBK_JFMdh7PkuALBxOAmHcM',
    colore: 'rgba(200,140,40,.8)',
  },
  'sarto': {
    nome: 'Sarto', emoji: '🧵',
    sheetId: '1Q-YNWmRyIjCO0ReQ8KoYa_bHRxQLJ-DOU7QyDPqJBHU',  
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
.ms-wrap { width: 100%; max-width: 100%; overflow-x: hidden; }

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
  overflow: hidden; word-break: break-word;
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
  /* Se la cella contiene newline interni, splittala in sotto-righe */
  var subrighe = cell.split('\n').map(function(s) { return s.trim(); }).filter(Boolean);
  var righe = subrighe.length > 1 ? subrighe : [cell];

  righe.forEach(function(sr) {
    var isTitolo = sr.length < 80
      && !sr.match(/[.,]$/)
      && sr.length > 3
      && !sr.match(/^(Il |La |Lo |Un |Una |Ogni |Per |Imparare |Livello PG|Livello \d)/i);
    if (isTitolo) {
      current = { titolo: sr, righe: [] };
      sections.push(current);
    } else {
      if (!current) { current = { titolo: '', righe: [] }; sections.push(current); }
      current.righe.push(sr);
    }
  });
});

  var h = '<div class="ms-intro-panel">';
  sections.forEach(function(sec) {
    h += '<div class="ms-intro-section">';
    if (sec.titolo) h += '<div class="ms-intro-section-title">' + sec.titolo + '</div>';
    if (sec.righe.length) {
      /* Righe "lista" (brevi, tipo "Livello X: ...") → <br> singolo; paragrafi → <br><br> */
      var parts = [];
      var buf = [];
      sec.righe.forEach(function(riga) {
        var isLista = riga.length < 60 && riga.match(/^(Livello |LV\d|LV \d|\d+[.:)])/i);
        if (isLista) {
          if (buf.length) { parts.push({ tipo: 'para', righe: buf.slice() }); buf = []; }
          parts.push({ tipo: 'lista', righe: [riga] });
        } else {
          /* Se la riga precedente era anche lista, aggiungila al gruppo lista */
          var last = parts[parts.length - 1];
          if (last && last.tipo === 'lista') { last.righe.push(riga); }
          else buf.push(riga);
        }
      });
      if (buf.length) parts.push({ tipo: 'para', righe: buf });

      var bodyHtml = '';
      parts.forEach(function(p) {
        if (p.tipo === 'lista') {
          bodyHtml += p.righe.join('<br>');
        } else {
          bodyHtml += p.righe.join('<br><br>');
        }
        bodyHtml += '<br><br>';
      });
      h += '<div class="ms-intro-section-body">' + bodyHtml.replace(/<br><br>$/, '') + '</div>';
    }
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
  var colTipo = -1, colDesc = -1, colValCraft = -1, colValVend = -1, colUrl = -1;
  var colDtLv = {};

  headers.forEach(function(h, i) {
    if (h === 'nome') colNome = i;
    else if (h === 'progetto') colProgetto = i;
    else if (h.indexOf('principale') > -1) colMatPrinc = i;
    else if (h.indexOf('secondari') > -1) colMatSec = i;
    else if (h === 'tipologia') colTipo = i;
    else if (h === 'descrizione') colDesc = i;
    else if (h === 'url') colUrl = i;
    else if (h.indexOf('crafting') > -1) colValCraft = i;
    else if (h.indexOf('vendita') > -1) colValVend = i;
    else {
      var m = h.match(/lv\s*(\d+)/i);
      if (m && (h.indexOf('dt') > -1 || h.indexOf('prof') > -1)) {
        colDtLv[m[1]] = i;
      }
    }
  });

  var lvKeys = Object.keys(colDtLv).sort(function(a, b) { return parseInt(a) - parseInt(b); });

  var h = '<div class="ms-table-wrap"><table class="ms-table"><thead><tr>';
  h += '<th>Nome</th>';
  if (colProgetto > -1) h += '<th>Progetto</th>';
  if (colMatPrinc > -1) h += '<th>Mat. Principale</th>';
  if (colMatSec > -1) h += '<th>Mat. Secondario</th>';
  if (colTipo > -1) h += '<th>Tipologia</th>';
  if (colDesc > -1) h += '<th>Descrizione</th>';
  if (colValCraft > -1) h += '<th>Crafting</th>';
  if (colValVend > -1) h += '<th>Vendita</th>';
  lvKeys.forEach(function(lv) {
    h += '<th class="ms-dt-lv-header">DT LV' + lv + (parseInt(lv) > 1 ? '+' : '') + '</th>';
  });
  h += '</tr></thead><tbody>';

  data.forEach(function(row) {
    var nome = colNome > -1 ? (row[colNome] || '').trim() : '';
    if (!nome) return;

    h += '<tr>';
    h += '<td>' + nome + '</td>';

    /* Colonna Progetto */
    if (colProgetto > -1) {
      var isP = (row[colProgetto] || '').toLowerCase().trim() === 'si';
      h += '<td style="text-align:center">' + (isP ? '<span class="ms-badge-prog">Sì</span>' : '—') + '</td>';
    }

    if (colMatPrinc > -1) h += '<td>' + (row[colMatPrinc] || '—') + '</td>';
    if (colMatSec > -1) h += '<td>' + (row[colMatSec] || '—') + '</td>';
    if (colTipo > -1) h += '<td>' + _tipoBadge(row[colTipo] || '') + '</td>';

    /* Colonna Descrizione */
    if (colDesc > -1) {
  var desc = (row[colDesc] || '').trim();
  var url  = colUrl > -1 ? (row[colUrl] || '').trim() : '';
  var isClicca = desc.toLowerCase() === 'clicca qui';

  if (!desc) {
    h += '<td>—</td>';
  } else if (isClicca && url) {
    h += '<td><a href="' + url + '" target="_blank" rel="noopener" '
       + 'style="color:var(--ms-c);font-family:\'Cinzel\',serif;font-size:11px;opacity:.8;text-decoration:none;border-bottom:1px solid currentColor">'
       + 'Clicca qui →</a></td>';
  } else if (isClicca) {
    h += '<td><span style="color:var(--ms-c);font-family:\'Cinzel\',serif;font-size:11px;opacity:.4;font-style:italic">Clicca qui</span></td>';
  } else {
    h += '<td><span style="font-family:\'Crimson Pro\',serif;font-size:14px;color:rgba(220,200,160,.75);font-style:italic">' + desc + '</span></td>';
  }
}

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
/* ── Render tab Pergamene ── */
function _renderPergamene(rows) {
  var headerIdx = -1;
  for (var i = 0; i < rows.length; i++) {
    var first = (rows[i][0] || '').toLowerCase().trim();
    if (first.indexOf('livello') > -1 && first.indexOf('incantesimo') > -1) {
      headerIdx = i; break;
    }
  }

  /* Testo intro: tutto prima dell'header */
  var introHtml = '';
  if (headerIdx > 0) {
    var paragrafi = [];
    for (var j = 0; j < headerIdx; j++) {
      var cell = (rows[j][0] || '').trim();
      if (!cell) continue;
      /* Salta righe-titolo brevi senza punteggiatura */
      if (cell.length < 60 && !cell.match(/[.!?,]$/)) continue;
      /* Splitta newline interni */
      cell.split('\n').forEach(function(sr) {
        sr = sr.trim();
        if (sr) paragrafi.push(sr);
      });
    }
    if (paragrafi.length) {
      introHtml = '<div class="ms-intro-section" style="margin-bottom:20px">'
        + '<div class="ms-intro-section-body">'
        + paragrafi.join('<br><br>')
        + '</div></div>';
    }
  }

  if (headerIdx === -1) return introHtml || '<div class="ms-empty">⏳ Contenuto in arrivo...</div>';

  var headers = rows[headerIdx].map(_normHeader);
  var data = rows.slice(headerIdx + 1).filter(function(r) {
    return r.some(function(c) { return c && c.trim(); });
  });

  if (!data.length) return introHtml + '<div class="ms-empty">⏳ Contenuto in arrivo...</div>';

  var visibleIdxs = [];
  headers.forEach(function(h, i) { if (h) visibleIdxs.push(i); });

  var h = introHtml + '<div class="ms-table-wrap"><table class="ms-table"><thead><tr>';
  visibleIdxs.forEach(function(i) {
    var label = headers[i].charAt(0).toUpperCase() + headers[i].slice(1);
    h += '<th>' + label + '</th>';
  });
  h += '</tr></thead><tbody>';

  data.forEach(function(row) {
    var firstVal = (row[visibleIdxs[0]] || '').trim();
    if (!firstVal) return;
    h += '<tr>';
    visibleIdxs.forEach(function(ci, ii) {
      var val = (row[ci] || '').trim() || '—';
      h += ii === 0
        ? '<td>' + val + '</td>'
        : '<td class="ms-dt-cell">' + val + '</td>';
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
  panel.innerHTML = tabName === 'Introduzione'
    ? _renderIntro(rows)
    : tabName === 'Pergamene'
      ? _renderPergamene(rows)
      : _renderLivello(rows);
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
function _discoverLevels(key, mestiere, container) {
  var maxLv = 5;
  var found = 0;

  function tryLevel(lv) {
    if (lv > maxLv) return;
    fetch(_csvUrl(mestiere.sheetId, 'LV ' + lv))
      .then(function(r) { return r.text(); })
      .then(function(text) {
        var rows = _parseCsv(text);
        /* Controlla se ci sono dati reali (almeno 2 righe con contenuto) */
        var dataRows = rows.slice(1).filter(function(r) {
          return r.some(function(c) { return c && c.trim(); });
        });
        if (dataRows.length > 0) {
          found++;
          /* Aggiungi il tab */
          var placeholder = container.querySelector('.ms-tabs-lv-placeholder');
          if (placeholder) {
            var tab = document.createElement('div');
            tab.className = 'ms-tab';
            tab.setAttribute('data-tab', 'LV ' + lv);
            tab.setAttribute('onclick', 'msTabClick(this)');
            tab.textContent = 'LV ' + lv;
            placeholder.parentNode.insertBefore(tab, placeholder);
          }
        }
        /* Prova il livello successivo */
        tryLevel(lv + 1);
      })
      .catch(function() {
        tryLevel(lv + 1);
      });
  }

  tryLevel(1);
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
    var html2 = '<div class="ms-wrap nc" style="--ms-c:' + mestiere.colore + ';animation:fi .22s ease forwards">';
    html2 += '<div class="ms-tabs">';
    html2 += '<div class="ms-tab active" data-tab="Introduzione" onclick="msTabClick(this)">Introduzione</div>';
    if (mestiere.extra) {
      mestiere.extra.forEach(function(t) {
        html2 += '<div class="ms-tab" data-tab="' + t + '" onclick="msTabClick(this)">' + t + '</div>';
      });
    }
    html2 += '<div class="ms-tabs-lv-placeholder"></div>';
    html2 += '</div><div class="ms-panel"></div></div>';
    pbody.innerHTML = html2;

    var container = pbody.querySelector('.ms-wrap');
    window.msTabClick = function(el) {
      _msShowTab(key, el.getAttribute('data-tab'), container, mestiere);
    };

    _discoverLevels(key, mestiere, container);
    _msShowTab(key, 'Introduzione', container, mestiere);
  }

  if (typeof afterPageRender === 'function') afterPageRender();
};
