// ═══════════════════════════════════════════════════════════
//  reputation-table.js — Tabella reputazione PG per regione
// ═══════════════════════════════════════════════════════════

const REP_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1196WfeJFp4C9QIKnwAR2O3exz3AkfRDvwcBAiIBHV0M/export?format=csv&gid=1284615895';
const REP_CACHE_KEY = 'arcamis_rep_cache';
const REP_CACHE_TTL = 10 * 60 * 1000;

// ─── CSV parser ───
function parseCSV(text) {
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
async function fetchRepData(forceRefresh) {
  if (!forceRefresh) {
    const cached = sessionStorage.getItem(REP_CACHE_KEY);
    if (cached) {
      try {
        const { ts, data } = JSON.parse(cached);
        if (Date.now() - ts < REP_CACHE_TTL) return data;
      } catch (_) {}
    }
  }
  const res = await fetch(REP_SHEET_URL);
  if (!res.ok) throw new Error('Fetch fallito: ' + res.status);
  const text = await res.text();
  const rows = parseCSV(text);
  sessionStorage.setItem(REP_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: rows }));
  return rows;
}

// ─── Colori ───
function repDisplay(val) {
  const n = parseInt(val, 10);
  if (isNaN(n) || n === 0) return '<span style="color:var(--text3);opacity:.45">—</span>';
  const color = n > 0 ? '#5ecb8a' : '#e05a5a';
  return `<span style="color:${color};font-weight:600">${n > 0 ? '+' + n : n}</span>`;
}

// ─── Stato ───
let _repSortCol = null;
let _repSortAsc = true;
let _repRows = [];
let _repHeaders = [];
let _repFilter = '';

// ─── Render body con filtro e ordinamento ───
function _repRenderBody() {
  const tbody = document.getElementById('rep-tbody');
  if (!tbody) return;

  let rows = [..._repRows];

  // Separa Totale
  const totaleIdx = rows.findIndex(r => (r[0] || '').toLowerCase() === 'totale');
  let totaleRow = null;
  if (totaleIdx !== -1) totaleRow = rows.splice(totaleIdx, 1)[0];

  // Filtro ricerca
  if (_repFilter) {
    const q = _repFilter.toLowerCase();
    rows = rows.filter(r => (r[0] || '').toLowerCase().includes(q));
  }

  // Ordinamento
  if (_repSortCol !== null) {
    rows.sort((a, b) => {
      if (_repSortCol === 0) {
        return _repSortAsc
          ? String(a[0]).localeCompare(String(b[0]))
          : String(b[0]).localeCompare(String(a[0]));
      }
      const ai = parseInt(a[_repSortCol], 10) || 0;
      const bi = parseInt(b[_repSortCol], 10) || 0;
      return _repSortAsc ? ai - bi : bi - ai;
    });
  }

  // Totale sempre in cima (solo se non si sta filtrando)
  if (totaleRow && !_repFilter) rows.unshift(totaleRow);

  if (!rows.length) {
    tbody.innerHTML = `<tr><td class="rep-no-results" colspan="${_repHeaders.length}">Nessun personaggio trovato.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map((row, ri) => {
    const isTotale = (row[0] || '').toLowerCase() === 'totale';
    const cls = isTotale ? 'rep-tr rep-tr-totale' : (ri % 2 === 0 ? 'rep-tr' : 'rep-tr rep-tr-alt');
    const cells = _repHeaders.map((_, ci) => {
      if (ci === 0) return `<td class="rep-td rep-td-name">${row[0] || ''}</td>`;
      return `<td class="rep-td rep-td-val">${repDisplay(row[ci])}</td>`;
    }).join('');
    return `<tr class="${cls}">${cells}</tr>`;
  }).join('');
}

function _repSetSort(col) {
  if (_repSortCol === col) { _repSortAsc = !_repSortAsc; }
  else { _repSortCol = col; _repSortAsc = col === 0; }
  document.querySelectorAll('.rep-th').forEach((th, i) => {
    th.querySelector('.rep-sort-arrow').textContent =
      i === _repSortCol ? (_repSortAsc ? ' ▲' : ' ▼') : ' ⇅';
  });
  _repRenderBody();
}

// ─── Refresh dati ───
async function _repRefresh() {
  const btn = document.getElementById('rep-refresh-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Aggiornamento…'; }
  try {
    const rows = await fetchRepData(true);
    const headerRow = rows[1];
    const validCols = [];
    for (let i = 0; i < headerRow.length; i++) {
      if (headerRow[i].trim() !== '') validCols.push(i);
    }
    _repHeaders = validCols.map(i => headerRow[i]);
    _repRows = rows.slice(2)
      .filter(r => r[validCols[0]] && r[validCols[0]].trim() !== '')
      .map(r => validCols.map(i => r[i] || ''));
    _repRenderBody();
    const ts = document.getElementById('rep-ts');
    if (ts) ts.textContent = 'Ultimo aggiornamento: ' + new Date().toLocaleTimeString('it-IT');
  } catch (e) {
    console.error('[RepTable refresh]', e);
  }
  if (btn) { btn.disabled = false; btn.textContent = '↻ Aggiorna'; }
}

// ─── Entry point ───
async function showReputationTable() {
  document.getElementById('hv').style.display = 'none';
  document.getElementById('pv').style.display = 'block';
  document.getElementById('ph-icon').textContent = '🗺️';
  document.getElementById('ph-title').textContent = 'REPUTAZIONI';
  document.getElementById('ph-eyebrow').textContent = 'Personaggio';
  document.getElementById('ph-crumb').textContent = 'Il tuo PG';
  document.getElementById('ph-sub').textContent = 'Fama e infamia nelle regioni di Runeterra';
  document.getElementById('ph-covbg').style.backgroundImage = '';
  document.getElementById('ph-overlay').style.opacity = '1';
  document.getElementById('pbody').style.maxWidth = 'none';
  document.getElementById('pbody').style.width = '100%';
  document.getElementById('main').scrollTo({ top: 0, behavior: 'smooth' });

  // Reset filtro e ordinamento
  _repFilter = '';
  _repSortCol = null;
  _repSortAsc = true;

  const pbody = document.getElementById('pbody');
  pbody.innerHTML = `
    <div class="notion-body" style="padding:32px 0 64px;max-width:100%;width:100%">
      <div id="rep-loading" style="display:flex;align-items:center;justify-content:center;padding:80px 0;color:var(--text3);font-family:'Cinzel',serif;font-size:13px;letter-spacing:.15em">
        <span style="opacity:.6">Caricamento reputazioni…</span>
      </div>
      <div id="rep-content" style="display:none"></div>
    </div>`;

  try {
    const rows = await fetchRepData(false);
    if (!rows || rows.length < 2) throw new Error('Dati vuoti');

    const headerRow = rows[1];
    const validCols = [];
    for (let i = 0; i < headerRow.length; i++) {
      if (headerRow[i].trim() !== '') validCols.push(i);
    }
    _repHeaders = validCols.map(i => headerRow[i]);
    _repRows = rows.slice(2)
      .filter(r => r[validCols[0]] && r[validCols[0]].trim() !== '')
      .map(r => validCols.map(i => r[i] || ''));

    const theadCells = _repHeaders.map((h, i) => `
      <th class="rep-th" onclick="_repSetSort(${i})" title="Ordina per ${h}">
        <span class="rep-th-label">${h}</span><span class="rep-sort-arrow"> ⇅</span>
      </th>`).join('');

    document.getElementById('rep-content').innerHTML = `
      <div class="rep-wrap">
        <div class="rep-intro">
          <p>La tabella mostra la <strong>reputazione</strong> di ogni PG nelle principali regioni. I valori positivi indicano fama, quelli negativi infamia.</p>
        </div>
        <div class="rep-toolbar">
          <input
            class="rep-search"
            id="rep-search"
            type="text"
            placeholder="Cerca personaggio…"
            oninput="_repFilter=this.value;_repRenderBody()"
          />
          <button class="rep-refresh-btn" id="rep-refresh-btn" onclick="_repRefresh()">↻ Aggiorna</button>
        </div>
        <div class="rep-table-scroll">
          <table class="rep-table">
            <thead><tr>${theadCells}</tr></thead>
            <tbody id="rep-tbody"></tbody>
          </table>
        </div>
        <div class="rep-footer">Dati dallo sheet ufficiale · <span id="rep-ts"></span></div>
      </div>`;

    _repRenderBody();

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
