// reputation-table.js — Arcamis Wiki
// Legge il nuovo Google Sheet con struttura a doppio header (regione + sotto-fazione)
// Sheet ID: 1196WfeJFp4C9QIKnwAR2O3exz3AkfRDvwcBAiIBHV0M  gid: 1406195911

(function () {
  const SHEET_ID = '1196WfeJFp4C9QIKnwAR2O3exz3AkfRDvwcBAiIBHV0M';
  const GID      = '1406195911';
  const CSV_URL  = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
  const CACHE_KEY   = 'arcamis_rep_v2';
  const CACHE_TS    = 'arcamis_rep_v2_ts';
  const CACHE_TTL   = 5 * 60 * 1000; // 5 minuti

  // ── Regioni e loro colori (ordine come nel CSV) ──────────────────────────
  const REGION_COLORS = {
    'ARCADIA':      '#4a7c59',
    'BANDLE CITY':  '#c9a84c',
    'BILGEWATER':   '#1a6b8a',
    'DEMACIA':      '#3a5fa0',
    'FREJLORD':     '#5b8fa8',
    'ICATHIA':      '#7a3a9e',
    'IONIA':        '#c45b8a',
    'ISOLE OMBRA':  '#4a4a6e',
    'IXTAL':        '#2e7d52',
    'NOXUS':        '#9e2a2a',
    'PILTOVER':     '#c47a1a',
    'SHURIMA':      '#b8872a',
    'TARGON':       '#6a4a9e',
    'ZAUN':         '#3a7a5a',
    'VOID':         '#5a1a7a',
  };

  // ── CSV parser che gestisce virgolette ───────────────────────────────────
  function parseCSV(text) {
    const rows = [];
    const lines = text.split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      const cols = [];
      let cur = '', inQ = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') { inQ = !inQ; }
        else if (c === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
        else { cur += c; }
      }
      cols.push(cur.trim());
      rows.push(cols);
    }
    return rows;
  }

  // ── Trova le righe header nel CSV ────────────────────────────────────────
  // Il CSV ha questa struttura:
  //   riga 0: vuota | Player | ARCADIA | BANDLE CITY | ... (regioni, con merge)
  //   riga 1: vuota | Player | ARCADIA | BANDLE CITY | BILGEWATER | SOLDATI DI. | ...
  // Cerchiamo la riga che inizia con '' e ha 'Player' in pos 1
  function findHeaders(rows) {
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const r = rows[i];
      if (r[1] && r[1].trim().toUpperCase() === 'PLAYER') {
        // riga i = sotto-fazioni (header dettagliato)
        // riga i-1 = regioni (se esiste e ha contenuto)
        const regionRow = i > 0 ? rows[i - 1] : null;
        return { regionRow, subRow: r, dataStart: i + 1 };
      }
    }
    // Fallback: prima riga non vuota come header
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].some(c => c)) return { regionRow: null, subRow: rows[i], dataStart: i + 1 };
    }
    return null;
  }

  // ── Costruisce struttura colonne con raggruppamento per regione ──────────
  function buildColumns(regionRow, subRow) {
    const cols = [];
    let currentRegion = '';
    for (let i = 2; i < subRow.length; i++) {
      const sub = (subRow[i] || '').trim().replace(/\.$/, '');
      if (!sub) continue;
      // regione: prendi da regionRow se disponibile
      if (regionRow) {
        const reg = (regionRow[i] || '').trim().toUpperCase();
        if (reg) currentRegion = reg;
      }
      cols.push({ idx: i, region: currentRegion, sub: sub });
    }
    return cols;
  }

  // ── Render principale ────────────────────────────────────────────────────
  function render(csvText) {
    const container = document.getElementById('rep-table-container');
    if (!container) return;

    const rows = parseCSV(csvText);
    const headers = findHeaders(rows);
    if (!headers) { container.innerHTML = '<p>Errore nel leggere la tabella.</p>'; return; }

    const { subRow, dataStart } = headers;
    const regionRow = headers.regionRow;
    const cols = buildColumns(regionRow, subRow);

    // Filtra righe dati: deve avere un nome PG in pos 1
    const dataRows = rows.slice(dataStart).filter(r => {
      const name = (r[1] || '').trim();
      return name && name.toUpperCase() !== 'PLAYER' && name !== 'Totale' && !name.startsWith('🗺');
    });

    // Raggruppa colonne per regione
    const regionGroups = {};
    const regionOrder = [];
    for (const col of cols) {
      if (!regionGroups[col.region]) {
        regionGroups[col.region] = [];
        regionOrder.push(col.region);
      }
      regionGroups[col.region].push(col);
    }

    // ── Costruisci HTML tabella ──────────────────────────────────────────
    let html = `<div class="rep-table-wrap"><table class="rep-table" id="rep-main-table">`;

    // Header riga 1: regioni
    html += `<thead><tr><th class="rep-th-name" rowspan="2">Nome PG ⇅</th>`;
    for (const region of regionOrder) {
      const grp = regionGroups[region];
      const color = REGION_COLORS[region] || '#555';
      const label = region || '—';
      html += `<th colspan="${grp.length}" class="rep-th-region" style="background:${color}20;border-top:2px solid ${color};color:${color}">${label}</th>`;
    }
    html += `</tr>`;

    // Header riga 2: sotto-fazioni
    html += `<tr>`;
    for (const region of regionOrder) {
      const color = REGION_COLORS[region] || '#555';
      for (const col of regionGroups[region]) {
        html += `<th class="rep-th-sub" style="border-bottom:2px solid ${color}" data-col="${col.idx}" data-region="${region}">${col.sub} ⇅</th>`;
      }
    }
    html += `</tr></thead>`;

    // Body
    html += `<tbody>`;
    for (const row of dataRows) {
      const name = (row[1] || '').trim();
      html += `<tr><td class="rep-td-name">${name}</td>`;
      for (const region of regionOrder) {
        for (const col of regionGroups[region]) {
          const raw = (row[col.idx] || '').trim().replace(/\\/g, '').replace(/\+/g, '');
          const val = parseInt(raw, 10);
          if (!raw || isNaN(val) || val === 0) {
            html += `<td class="rep-td rep-zero">—</td>`;
          } else if (val > 0) {
            html += `<td class="rep-td rep-pos">+${val}</td>`;
          } else {
            html += `<td class="rep-td rep-neg">${val}</td>`;
          }
        }
      }
      html += `</tr>`;
    }
    html += `</tbody></table></div>`;

    container.innerHTML = html;
    attachSort();
  }

  // ── Ordinamento colonne/nome ─────────────────────────────────────────────
  function attachSort() {
    const table = document.getElementById('rep-main-table');
    if (!table) return;
    let sortCol = -1, sortAsc = true;

    table.querySelectorAll('th').forEach((th, thIdx) => {
      th.style.cursor = 'pointer';
      th.addEventListener('click', () => {
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        if (sortCol === thIdx) { sortAsc = !sortAsc; } else { sortCol = thIdx; sortAsc = true; }
        rows.sort((a, b) => {
          const aCell = a.querySelectorAll('td')[thIdx];
          const bCell = b.querySelectorAll('td')[thIdx];
          const aT = aCell ? aCell.textContent.replace(/[+—]/g, '').trim() : '';
          const bT = bCell ? bCell.textContent.replace(/[+—]/g, '').trim() : '';
          const aN = parseFloat(aT), bN = parseFloat(bT);
          if (!isNaN(aN) && !isNaN(bN)) return sortAsc ? aN - bN : bN - aN;
          return sortAsc ? aT.localeCompare(bT, 'it') : bT.localeCompare(aT, 'it');
        });
        rows.forEach(r => tbody.appendChild(r));
      });
    });
  }

  // ── Ricerca PG ───────────────────────────────────────────────────────────
  function attachSearch() {
    const input = document.getElementById('rep-search');
    if (!input) return;
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase();
      document.querySelectorAll('#rep-main-table tbody tr').forEach(tr => {
        const name = tr.querySelector('td')?.textContent.toLowerCase() || '';
        tr.style.display = name.includes(q) ? '' : 'none';
      });
    });
  }

  // ── Fetch con cache sessionStorage ──────────────────────────────────────
  async function load() {
    const container = document.getElementById('rep-table-container');
    if (!container) return;
    container.innerHTML = '<p class="rep-loading">Caricamento reputazioni...</p>';

    let csv = null;
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      const cachedTs = parseInt(sessionStorage.getItem(CACHE_TS) || '0', 10);
      if (cached && Date.now() - cachedTs < CACHE_TTL) {
        csv = cached;
      }
    } catch (_) {}

    if (!csv) {
      try {
        const resp = await fetch(CSV_URL);
        if (!resp.ok) throw new Error('Fetch failed');
        csv = await resp.text();
        try {
          sessionStorage.setItem(CACHE_KEY, csv);
          sessionStorage.setItem(CACHE_TS, Date.now().toString());
        } catch (_) {}
      } catch (e) {
        container.innerHTML = '<p>Impossibile caricare i dati di reputazione.</p>';
        return;
      }
    }

    render(csv);
    attachSearch();
  }

  // ── CSS inline per la tabella ────────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById('rep-table-style')) return;
    const s = document.createElement('style');
    s.id = 'rep-table-style';
    s.textContent = `
      .rep-table-wrap { overflow-x: auto; max-width: 100%; }
      .rep-table { border-collapse: collapse; width: max-content; font-size: 0.78rem; font-family: 'Crimson Pro', serif; }
      .rep-table th, .rep-table td { padding: 4px 8px; text-align: center; white-space: nowrap; }
      .rep-th-name { position: sticky; left: 0; background: #1a1510; z-index: 3; text-align: left; color: #c9a84c; font-size: 0.8rem; border-bottom: 2px solid #c9a84c; }
      .rep-th-region { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.05em; padding: 6px 4px; }
      .rep-th-sub { font-size: 0.68rem; color: #aaa; padding: 4px 6px; background: #111; }
      .rep-td-name { position: sticky; left: 0; background: #1a1510; z-index: 2; text-align: left; color: #e8d5a3; font-size: 0.82rem; border-right: 1px solid #333; padding-left: 10px; }
      .rep-td { min-width: 38px; border: 1px solid #222; }
      .rep-zero { color: #444; }
      .rep-pos { color: #4caf7d; font-weight: 600; }
      .rep-neg { color: #e05252; font-weight: 600; }
      tbody tr:hover td { background: #1f1a12 !important; }
      .rep-loading { color: #888; font-style: italic; padding: 1rem; }
    `;
    document.head.appendChild(s);
  }

  // ── Entry point ──────────────────────────────────────────────────────────
  injectCSS();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
window.showReputationTable = function() {
    var hv = document.getElementById('hv');
    var pv = document.getElementById('pv');
    var phTitle = document.getElementById('ph-title');
    var phIcon = document.getElementById('ph-icon');
    var phCrumb = document.getElementById('ph-crumb');
    var phEyebrow = document.getElementById('ph-eyebrow');
    var phSub = document.getElementById('ph-sub');
    var phCovbg = document.getElementById('ph-covbg');
    var phOverlay = document.getElementById('ph-overlay');
    var phHero = document.getElementById('page-hero');

    if (phTitle) phTitle.textContent = 'Reputazioni';
    if (phIcon) { phIcon.textContent = '🗺️'; phIcon.style.opacity = '0.06'; }
    if (phEyebrow) phEyebrow.textContent = 'Archivi di Arcamis';
    if (phSub) phSub.textContent = 'Reputazioni dei personaggi nelle regioni del mondo.';
    if (phCovbg) phCovbg.style.backgroundImage = '';
    if (phOverlay) phOverlay.style.opacity = '0';
    if (phHero) { phHero.style.removeProperty('--ph-acc'); phHero.style.removeProperty('--ph-accbg'); }
    if (phCrumb && typeof buildCrumb === 'function') phCrumb.innerHTML = buildCrumb('Reputazioni');
    document.title = 'Reputazioni — Arcamis';

    if (hv && pv) {
      if (hv.style.display === 'block') {
        if (typeof xfade === 'function') xfade(hv, pv);
        else { hv.style.display = 'none'; pv.style.display = 'block'; }
      }
    }

    if (typeof navStack !== 'undefined') {
      navStack.push({ id: 'reputazioni', label: 'Reputazioni', icon: '🗺️' });
    }
    history.pushState({ id: 'reputazioni', label: 'Reputazioni', icon: '🗺️' }, '', '/reputazioni');

    var pbody = document.getElementById('pbody');
    if (pbody) {
      pbody.innerHTML = '<div class="nc" style="animation:fi .22s ease forwards">'
        + '<div style="margin-bottom:1.2rem">'
        + '<input id="rep-search" type="text" placeholder="Cerca personaggio…" '
        + 'style="padding:6px 12px;background:#111;border:1px solid #333;color:#e8d5a3;border-radius:4px;font-family:\'Crimson Pro\',serif;font-size:0.95rem;width:100%;max-width:320px"/>'
        + '</div>'
        + '<div id="rep-table-container"></div>'
        + '</div>';
    }

    load();
    attachSearch();
  };

})();
