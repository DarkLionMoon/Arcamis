// ═══════════════════════════════════════════════════════════
//  reputation-table.js — Tabella reputazione PG per regione
//  Fonte: Google Sheets pubblico (CSV export)
// ═══════════════════════════════════════════════════════════

const REP_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1196WfeJFp4C9QIKnwAR2O3exz3AkfRDvwcBAiIBHV0M/export?format=csv&gid=1284615895';

const REP_CACHE_KEY = 'arcamis_rep_cache';
const REP_CACHE_TTL = 10 * 60 * 1000; // 10 minuti

// ─── Parsing CSV minimale (gestisce virgole dentro virgolette) ───
function parseCSV(text) {
  // Rimuove BOM e normalizza line endings
  text = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = text.trim().split('\n');
  const result = [];
  for (const line of lines) {
    const row = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQ = !inQ; }
      else if (c === ',' && !inQ) { row.push(cur.trim()); cur = ''; }
      else { cur += c; }
    }
    row.push(cur.trim());
    result.push(row);
  }
  return result;
}

// ─── Fetch con cache sessionStorage ───
async function fetchRepData() {
  const cached = sessionStorage.getItem(REP_CACHE_KEY);
  if (cached) {
    try {
      const { ts, data } = JSON.parse(cached);
      if (Date.now() - ts < REP_CACHE_TTL) return data;
    } catch (_) {}
  }
  const res = await fetch(REP_SHEET_URL);
  if (!res.ok) throw new Error('Fetch fallito: ' + res.status);
  const text = await res.text();
  const rows = parseCSV(text);
  sessionStorage.setItem(REP_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: rows }));
  return rows;
}

// ─── Colore del numero ───
function repColor(val) {
  const n = parseInt(val, 10);
  if (isNaN(n) || n === 0) return 'var(--text3)';
  if (n > 0) return '#5ecb8a';
  return '#e05a5a';
}

function repDisplay(val) {
  const n = parseInt(val, 10);
  if (isNaN(n) || n === 0) return '<span style="color:var(--text3);opacity:.45">—</span>';
  return `<span style="color:${repColor(val)};font-weight:600">${n > 0 ? '+' + n : n}</span>`;
}

// ─── Stato ordinamento ───
let _repSortCol = null;
let _repSortAsc = true;
let _repRows = [];
let _repHeaders = [];

function _repRenderBody(tbodyId) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  let rows = [..._repRows];

  // Riga "Totale" sempre in cima
  const totaleIdx = rows.findIndex(r => (r[0] || '').toLowerCase() === 'totale');
  let totaleRow = null;
  if (totaleIdx !== -1) {
    totaleRow = rows.splice(totaleIdx, 1)[0];
  }

  // Ordinamento
  if (_repSortCol !== null) {
    rows.sort((a, b) => {
      const ai = parseInt(a[_repSortCol], 10) || 0;
      const bi = parseInt(b[_repSortCol], 10) || 0;
      const an = isNaN(ai) ? a[_repSortCol] || '' : ai;
      const bn = isNaN(bi) ? b[_repSortCol] || '' : bi;
      if (_repSortCol === 0) {
        return _repSortAsc
          ? String(a[0]).localeCompare(String(b[0]))
          : String(b[0]).localeCompare(String(a[0]));
      }
      return _repSortAsc ? (ai - bi) : (bi - ai);
    });
  }

  if (totaleRow) rows.unshift(totaleRow);

  tbody.innerHTML = rows.map((row, ri) => {
    const isTotale = (row[0] || '').toLowerCase() === 'totale';
    const tClass = isTotale ? 'rep-tr rep-tr-totale' : (ri % 2 === 0 ? 'rep-tr' : 'rep-tr rep-tr-alt');
    const cells = _repHeaders.map((_, ci) => {
      if (ci === 0) return `<td class="rep-td rep-td-name">${row[0] || ''}</td>`;
      return `<td class="rep-td rep-td-val">${repDisplay(row[ci])}</td>`;
    }).join('');
    return `<tr class="${tClass}">${cells}</tr>`;
  }).join('');
}

function _repSetSort(col) {
  if (_repSortCol === col) { _repSortAsc = !_repSortAsc; }
  else { _repSortCol = col; _repSortAsc = col === 0; }

  // Aggiorna frecce
  document.querySelectorAll('.rep-th').forEach((th, i) => {
    th.querySelector('.rep-sort-arrow').textContent =
      i === _repSortCol ? (_repSortAsc ? ' ▲' : ' ▼') : ' ⇅';
  });

  _repRenderBody('rep-tbody');
}

// ─── Entry point principale ───
async function showReputationTable() {
  // Mostra page view con hero
  if (typeof gp === 'function') {
    // Imposta manualmente l'header senza fare una call Notion
    document.getElementById('hv').style.display = 'none';
    document.getElementById('pv').style.display = 'block';
    document.getElementById('ph-icon').textContent = '🗺️';
    document.getElementById('ph-title').textContent = 'REPUTAZIONI';
    document.getElementById('ph-eyebrow').textContent = 'Personaggio';
    document.getElementById('ph-crumb').textContent = 'Il tuo PG';
    document.getElementById('ph-sub').textContent = 'Fama e infamia nelle regioni di Runeterra';
    document.getElementById('ph-covbg').style.backgroundImage = '';
    document.getElementById('ph-overlay').style.opacity = '1';
    // Scroll top
    document.getElementById('main').scrollTo({ top: 0, behavior: 'smooth' });
  }

  const pbody = document.getElementById('pbody');
  pbody.innerHTML = `
    <div class="notion-body" style="padding:32px 0 64px">
      <div id="rep-loading" style="display:flex;align-items:center;justify-content:center;gap:12px;padding:80px 0;color:var(--text3);font-family:'Cinzel',serif;font-size:13px;letter-spacing:.15em">
        <span style="opacity:.6">Caricamento reputazioni…</span>
      </div>
      <div id="rep-content" style="display:none"></div>
    </div>`;

  try {
    const rows = await fetchRepData();
    if (!rows || rows.length < 2) throw new Error('Dati vuoti');

    _repHeaders = rows[0]; // prima riga = intestazioni
    _repRows = rows.slice(1); // dalla seconda riga in poi (include Totale)

    _repSortCol = null;
    _repSortAsc = true;

    const theadCells = _repHeaders.map((h, i) => `
      <th class="rep-th" onclick="_repSetSort(${i})" title="Ordina per ${h}">
        <span class="rep-th-label">${h}</span><span class="rep-sort-arrow"> ⇅</span>
      </th>`).join('');

    document.getElementById('rep-content').innerHTML = `
      <div class="rep-wrap">
        <div class="rep-intro">
          <p>La tabella mostra la <strong>reputazione</strong> di ogni PG nelle principali regioni. I valori positivi indicano fama, quelli negativi infamia.</p>
          <p class="rep-hint">Clicca sulle intestazioni per ordinare.</p>
        </div>
        <div class="rep-table-scroll">
          <table class="rep-table" id="rep-table">
            <thead><tr>${theadCells}</tr></thead>
            <tbody id="rep-tbody"></tbody>
          </table>
        </div>
        <div class="rep-footer">Dati aggiornati in tempo reale dallo sheet ufficiale · <span id="rep-ts"></span></div>
      </div>`;

    _repRenderBody('rep-tbody');

    // Timestamp
    const cached = sessionStorage.getItem(REP_CACHE_KEY);
    if (cached) {
      const { ts } = JSON.parse(cached);
      document.getElementById('rep-ts').textContent =
        'Ultimo aggiornamento: ' + new Date(ts).toLocaleTimeString('it-IT');
    }

    document.getElementById('rep-loading').style.display = 'none';
    document.getElementById('rep-content').style.display = 'block';

  } catch (err) {
    console.error('[RepTable]', err);
    document.getElementById('rep-loading').innerHTML = `
      <div style="color:#e05a5a;font-family:'Crimson Pro',serif;font-size:15px;text-align:center;padding:60px 20px">
        ⚠ Impossibile caricare i dati.<br>
        <span style="font-size:13px;opacity:.7">Controlla che il foglio sia pubblico e riprova.</span>
      </div>`;
  }
}
