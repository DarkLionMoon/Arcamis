/* ════════════════════════════════════
   ARCAMIS — Imprese & Licenze
   App integrata, inizializzata on-demand
════════════════════════════════════ */
(function() {
  var _impInit = false;

  window.initImprese = function(container) {
    if (_impInit) return;
    _impInit = true;
    container.classList.add('imprese-app');
    container.innerHTML = `${template}`;

    // ── Override render for this scope ──
    var _origRender = window.render;
    window.render = function() {
      renderTabs();
      renderSideNav();
      renderContent();
    };

    // ── Override tabs rendering ──
    var _origRenderTabs = window.renderTabs;
    window.renderTabs = function() {
      var el = document.getElementById('tabs');
      if (!el) return;
      var labels = { gilde: '🏛️ Imprese', licenze: '⚖️ Licenze' };
      var h = '<div class="imp-tabs-row">';
      PAGES.forEach(function(p) {
        h += '<button class="imp-tab ' + (p === currentPage ? 'active' : '') + '" onclick="window._impSetPage("' + p + '")">' + labels[p] + '</button>';
      });
      h += '</div>';
      el.innerHTML = h;
    };

    // ── Override sidenav rendering ──
    var _origRenderSideNav = window.renderSideNav;
    window.renderSideNav = function() {
      var el = document.getElementById('sidenav');
      if (!el) return;
      var nav = NAV[currentPage];
      var h = '';
      nav.forEach(function(n) {
        h += '<button class="imp-sidenav-btn ' + (currentSection === n.id ? 'active' : '') + '" onclick="window._impSetSection("' + n.id + '")">' + n.label + '</button>';
      });
      el.innerHTML = h;
    };

    // ── Override content rendering ──
    var _origRenderContent = window.renderContent;
    window.renderContent = function() {
      var el = document.getElementById('content');
      if (!el) return;
      var map = currentPage === 'gilde' ? RENDER_GILDE : RENDER_LICENZE;
      var fn = map[currentSection];
      el.innerHTML = fn ? fn() : '<div style="color:var(--text3);padding:40px;text-align:center">Sezione non trovata.</div>';
      if (currentPage === 'gilde' && currentSection === 'gestore') gInit();
    };

    // ── Nav setters ──
    window._impSetPage = function(p) {
      currentPage = p;
      currentSection = 'panoramica';
      render();
    };
    window._impSetSection = function(s) {
      currentSection = s;
      render();
    };

    // ── Theme: use site theme (no-op for this app) ──
    window.applyTheme = function() {};

    // ── INIT ──
    render();
  };

  window.destroyImprese = function() {
    _impInit = false;
  };

  // ═══════════════════════════════════════
  //  CORE CODE
  // ═══════════════════════════════════════


// ════════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════════
var currentPage = 'gilde'; // 'gilde' | 'licenze'
var currentSection = 'panoramica';

const PAGES = ['gilde', 'licenze'];

const NAV = {
  gilde: [
    { id:'panoramica',  label:'📖 Panoramica' },
    { id:'livelli',     label:'🏪 I 3 Livelli' },
    { id:'procedura',   label:'📜 Procedura Passo-Passo' },
    { id:'entrate',     label:'💰 Entrate' },
    { id:'riferimenti', label:'📚 Riferimenti (Avanzato)' },
    { id:'gestore',     label:'🎛️ Gestore di Società' },
  ],
  licenze: [
    { id:'panoramica',  label:'📖 Panoramica' },
    { id:'vantaggi',    label:'✦ Vantaggi' },
    { id:'quadro',      label:'📋 Quadro Patenti' },
    { id:'pmc',         label:'🟢 P.M.C.' },
    { id:'pmt',         label:'🔵 P.M.T.' },
    { id:'pasv',        label:'🟠 P.A.S.V.' },
    { id:'poe',         label:'🟡 P.O.E.' },
    { id:'inchiostri',  label:'🖋️ Inchiostri' },
    { id:'strumenti',   label:'🛠️ Strumenti Patenti' },
  ],
};

// ════════════════════════════════════════════════
//  DATA CENTRALIZZATI
// ════════════════════════════════════════════════
const DATA = {
  livelli: [
    { id:1, name:'Bottega', patente:'P.M.C.', patHref:'pmc', fee:75, sumFee:75, deposit:0,
      motto:'Fondazione: un gruppo di artigiani con una sede e una patente.',
      structReqs:'una sede (Magazzino 150 Mo)',
      soci:'2-6 soci · almeno 1 con Patente valida',
      ruoloObb:'un Responsabile + un Mastro Artigiano',
      beneficio:'Accesso ai mercati comunali <strong>senza commissione</strong> e sconto del 10% sulle materie prime ordinarie.',
      limite:'Non puoi produrre né vendere <strong>oggetti magici</strong>.' },
    { id:2, name:'Officina', patente:'P.M.T.', patHref:'pmt', fee:100, sumFee:175, deposit:0,
      motto:'Espansione: più mestieri, struttura avanzata, lavori militari.',
      structReqs:'una struttura LV2 (es. Forgia o Laboratorio, 250 Mo)',
      soci:'tutti i requisiti precedenti',
      ruoloObb:'almeno 1 socio con P.M.T.',
      beneficio:'Ottieni il <strong>Timbro Imperiale</strong> (+15% valore percepito) e accesso ai lavori militari e alle armi.',
      limite:'La produzione di armi in serie va <strong>dichiarata ogni mese</strong> all\u0027U.R.V.' },
    { id:3, name:'Corporazione', patente:'P.O.E.', patHref:'poe', fee:200, sumFee:375, deposit:300,
      motto:'La vetta: monopolio, seggio al Consiglio, prestigio.',
      structReqs:'Statuto formale',
      soci:'minimo 4 soci',
      ruoloObb:'il Responsabile ha la P.O.E.',
      beneficio:'<strong>Monopolio di categoria</strong> (le commesse pubbliche del tuo settore vanno prima a te) e un seggio al Consiglio dei Mercanti.',
      limite:'Ispezione U.R.V. <strong>annuale senza preavviso</strong>; la cauzione viene confiscata solo in caso di sanzione <strong>Gravissima</strong>.' },
  ],
  fondi: { init: 30, deposit: 300 },
  fornitura: [
    { pat:'P.M.C.',  cost:45,  rent:15  },
    { pat:'P.M.T.',  cost:120, rent:40  },
    { pat:'P.A.S.V.',cost:300, rent:100 },
    { pat:'P.O.E.',  cost:750, rent:250 },
  ],
  patenti: [
    { sigla:'P.M.C.',  nome:'Manifattura Comune',                 costo:40, cauzione:10, totale:50,  durata:'3 anni', cls:'row-pmc',  col:'var(--common)',    sezione:'pmc',  destinatari:'Osti, Sarti, Falegnami e Artisti' },
    { sigla:'P.M.T.',  nome:'Manifattura Tecnica',                costo:85, cauzione:25, totale:110, durata:'3 anni', cls:'row-pmt',  col:'var(--uncommon)',  sezione:'pmt',  destinatari:'Fabbri, Gioiellieri, Architetti e Cartografi' },
    { sigla:'P.A.S.V.',nome:'Alchimia e Sostanze Vincolate',      costo:140,cauzione:40, totale:180, durata:'3 anni', cls:'row-pasv', col:'var(--amber)',     sezione:'pasv', destinatari:'Alchimisti e Artigiani Hextech' },
    { sigla:'P.O.E.',  nome:'Opere Eccezionali',                  costo:300,cauzione:100,totale:400, durata:'3 anni', cls:'row-poe',  col:'var(--legendary)', sezione:'poe',  destinatari:'Maestri Artigiani (LV4+)' },
  ],
  strutture: [
    { nome:'Magazzino', lv:1, cost:150, effetto:'Stoccaggio materiali, approvvigionamento più rapido.' },
    { nome:'Cucina', lv:1, cost:70, effetto:'Permette all\u0027Oste di produrre ricette (4 Mo carbone/sett.).' },
    { nome:'Orto', lv:1, cost:80, effetto:'+15 Mo di erbe/mese (max 2 per sede).' },
    { nome:'Stalla', lv:1, cost:70, effetto:'Fino a 5 animali, consegne più economiche.' },
    { nome:'Scantinato', lv:1, cost:100, effetto:'Deposito nascosto: capienza extra e meno controlli.' },
    { nome:'Recinzione', lv:1, cost:70, effetto:'Delimita il perimetro, riduce il rischio di furti.' },
    { nome:'Forgia Noxiana', lv:2, cost:250, effetto:'Bonus meccanico di classe per un PG (mestiere metallurgico), 1× per Riposo Lungo.' },
    { nome:'Laboratorio', lv:2, cost:250, effetto:'Bonus meccanico di classe per un PG (alchimia/incantesimi), 1× per Riposo Lungo.' },
    { nome:'Torre Difensiva', lv:2, cost:250, effetto:'Bonus meccanico di classe per un PG (difesa/guardia), 1× per Riposo Lungo.' },
    { nome:'Cucina Professionale', lv:2, cost:250, effetto:'Bonus meccanico di classe per un PG (mestiere culinario), 1× per Riposo Lungo.' },
    { nome:'Covo Arcano', lv:2, cost:250, effetto:'Bonus meccanico di classe per un PG (mestiere arcano), 1× per Riposo Lungo.' },
    { nome:'Altare del Devoto', lv:2, cost:250, effetto:'Bonus meccanico di classe per un PG (mestiere religioso), 1× per Riposo Lungo.' },
    { nome:'Sala della Musica', lv:2, cost:250, effetto:'Bonus meccanico di classe per un PG (mestiere artistico), 1× per Riposo Lungo.' },
    { nome:'Stanza degli Esperimenti', lv:2, cost:250, effetto:'Bonus meccanico di classe per un PG (ingegneria/hextech), 1× per Riposo Lungo.' },
    { nome:'Campo di Addestramento', lv:2, cost:250, effetto:'Bonus meccanico di classe per un PG (combattimento), 1× per Riposo Lungo.' },
    { nome:'Covo del Fuorilegge', lv:2, cost:250, effetto:'Bonus meccanico di classe per un PG (traffici ombra), 1× per Riposo Lungo.' },
  ],
  sanzioni: [
    { tipo:'Lieve', name:'Atto Costitutivo o Registro non aggiornato', multa:50, sosp:'—', effetto:'Regolarizzazione entro 15 giorni.', cls:'sanz-lieve' },
    { tipo:'Lieve', name:'Tassa Camera non pagata (primo richiamo)', multa:50, sosp:'—', effetto:'Pagamento arretrati + regolarizzazione entro 15 giorni.', cls:'sanz-lieve' },
    { tipo:'Lieve', name:'Insegna o segnaletica non conforme', multa:50, sosp:'—', effetto:'Sostituzione entro 15 giorni.', cls:'sanz-lieve' },
    { tipo:'Lieve', name:'Apprendista senza contratto di apprendistato', multa:50, sosp:'—', effetto:'Contratto entro 15 giorni.', cls:'sanz-lieve' },
    { tipo:'Lieve', name:'Mancata dichiarazione mensile delle armi (prima volta)', multa:50, sosp:'—', effetto:'Dichiarazione immediata.', cls:'sanz-lieve' },
    { tipo:'Grave', name:'Registro Entrate/Uscite falsificato', multa:200, sosp:'3 mesi', effetto:'Sospensione attività e controlli.', cls:'sanz-grave' },
    { tipo:'Grave', name:'Dichiarazione armi ripetutamente mancata', multa:200, sosp:'3 mesi', effetto:'Sospensione attività.', cls:'sanz-grave' },
    { tipo:'Grave', name:'Produzione magica fuori dai permessi della patente', multa:200, sosp:'3 mesi', effetto:'Sospensione + verifica requisiti.', cls:'sanz-grave' },
    { tipo:'Grave', name:'Ispezione U.R.V. fallita (requisiti non rispettati)', multa:200, sosp:'3 mesi', effetto:'Sospensione fino a regolarizzazione.', cls:'sanz-grave' },
    { tipo:'Grave', name:'Spionaggio / infiltrazione fallita', multa:200, sosp:'3 mesi', effetto:'Sanzione dello spionaggio illecito.', cls:'sanz-grave' },
    { tipo:'Grave', name:'Corporazione: Fondo di Categoria mancante', multa:200, sosp:'3 mesi', effetto:'Integrazione del fondo + verifica.', cls:'sanz-grave' },
    { tipo:'Gravissima', name:'Contraffazione del Timbro d\u0027Impresa', multa:0, sosp:'Scioglimento', effetto:'Scioglimento coatto + confisca cassa.', cls:'sanz-graviss' },
    { tipo:'Gravissima', name:'Esercizio senza patente valida per la categoria', multa:0, sosp:'Scioglimento', effetto:'Scioglimento coatto + Sigillo Spezzato ai soci.', cls:'sanz-graviss' },
    { tipo:'Gravissima', name:'Corporazione: uso scorretto del Sigillo', multa:0, sosp:'Scioglimento', effetto:'Confisca cauzione (300 Mo) + scioglimento.', cls:'sanz-graviss' },
    { tipo:'Gravissima', name:'Corporazione: abuso del Monopolio (commesse)', multa:0, sosp:'Scioglimento', effetto:'Perdita del monopolio + scioglimento.', cls:'sanz-graviss' },
  ],
  eventi: [
    { nome:'Prima Fiera della Rinascita', stagione:'Primavera', mese:'1° mese', effetto:'+15% ai prezzi di vendita per il mese.', entita:15 },
    { nome:'Grande Mercato dei Popoli', stagione:'Primavera', mese:'2° mese', effetto:'+20% alle vendite per 1 mese.', entita:20 },
    { nome:'Fiera dei Mestieri', stagione:'Primavera', mese:'3° mese', effetto:'Un apprendista gratis per un mese.', entita:0 },
    { nome:'Carovane del Marchesato', stagione:'Estate', mese:'1° mese', effetto:'Commesse militari raddoppiate per il mese.', entita:50 },
    { nome:'Carestia degli Anni Grigi', stagione:'Estate', mese:'2° mese', effetto:'−20% alle vendite di cibo per il mese; +20% prezzi materiali.', entita:-20 },
    { nome:'Dazi Imperiali', stagione:'Estate', mese:'3° mese', effetto:'+5% ai costi delle materie prime per il mese.', entita:-5 },
    { nome:'Gloria Arcana', stagione:'Autunno', mese:'1° mese', effetto:'+25% alle vendite per 3 mesi.', entita:25 },
    { nome:'Festa del Raccolto', stagione:'Autunno', mese:'2° mese', effetto:'+30% alle vendite per 1 mese.', entita:30 },
    { nome:'Assedio alle Frontiere', stagione:'Autunno', mese:'3° mese', effetto:'Commesse di difesa triplicate; +5% costi.', entita:0 },
    { nome:'Nevi Interminabili', stagione:'Inverno', mese:'1° mese', effetto:'−15% alle vendite; consegne più costose.', entita:-15 },
    { nome:'Notte delle Candele', stagione:'Inverno', mese:'2° mese', effetto:'+10% alle vendite artistiche per il mese.', entita:10 },
    { nome:'Rinascita del Regno', stagione:'Inverno', mese:'3° mese', effetto:'Fine anno: +1 tasso di Prestigio o tassa esente.', entita:10 },
  ],
  tiriEvento: [
    { range:'1',    nome:'Catastrofe', effetto:'Un focolaio colpisce l\u0027Impresa: −25% fatturato; possibile sanzione Lieve se non segnali.' },
    { range:'2–4',  nome:'Momento difficile', effetto:'Malopera o rottura: −10% fatturato per il mese.' },
    { range:'5–9',  nome:'Nulla di notevole', effetto:'Il mese scorre normale.' },
    { range:'10–14',nome:'Occasione', effetto:'Una commessa in più: +10% fatturato.' },
    { range:'15–18',nome:'Buona stella', effetto:'+20% alle vendite per il mese.' },
    { range:'19+',  nome:'Evento leggendario', effetto:'Scelta tra +40% fatturato o un rapporto autorevole al Consiglio (Prestigio).' },
  ],
  conflitti: { dichiarazione: 10, escalation: 50, mediazione: 25, durataMax: 6, perditaPct: 10 },
  sponsaggio: [
    { livello:'Ricerca di mercato (lecita)', dt:'1 DT', costo:'—', cd:'—', san:'Lecita' },
    { livello:'Contatto informatore', dt:'2 DT + 20 Mo', costo:'20 Mo', cd:'—', san:'Lieve se scoperto' },
    { livello:'Infiltrazione illegale', dt:'4 DT', costo:'—', cd:'15', san:'Grave se fallita' },
  ],
};

const PATENTI_DATA = DATA.patenti; // alias per compatibilità

// Abbreviazioni con tooltip
const TIP_SIGLE = {
  'P.M.C.':'Manifattura Comune',
  'P.M.T.':'Manifattura Tecnica',
  'P.A.S.V.':'Alchimia e Sostanze Vincolate',
  'P.O.E.':'Opere Eccezionali',
  'U.R.V.':'Ufficio del Registro e della Vigilanza',
  'Mo':'Monete d\u0027oro: la valuta del Codice',
  'DT':'Downtime: tempo libero tra le avventure',
};
function abbr(s) {
  var m = TIP_SIGLE[s];
  return m ? '<span class="tip" data-tip="'+m+'">'+s+'</span>' : s;
}
function patBtn(sigla) {
  var p = DATA.patenti.filter(function(x){ return x.sigla === sigla; })[0];
  if (!p) return abbr(sigla);
  return '<button class="patente-badge '+p.cls+' tip" data-tip="Vai alla Patente '+sigla+'" onclick="goto(\u0027licenze\u0027,\u0027'+p.sezione+'\u0027)">'+sigla+'</button>';
}
function patLink(sigla) {
  var p = DATA.patenti.filter(function(x){ return x.sigla === sigla; })[0];
  if (!p) return abbr(sigla);
  return '<button class="pat-link tip" data-tip="Vai alla Patente '+sigla+'" onclick="goto(\u0027licenze\u0027,\u0027'+p.sezione+'\u0027)">'+sigla+'</button>';
}
function goto(pg, sec) {
  if (PAGES.indexOf(pg) === -1) pg = 'gilde';
  currentPage = pg;
  currentSection = sec || 'panoramica';
  closeModal();
  closeDrawer();
  render();
  window.scrollTo({ top:0, behavior:'smooth' });
}

// ════════════════════════════════════════════════
//  MOBILE
// ════════════════════════════════════════════════
function openDrawer() { document.getElementById('mobileDrawer').classList.add('open'); document.getElementById('drawerOverlay').classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeDrawer() { document.getElementById('mobileDrawer').classList.remove('open'); document.getElementById('drawerOverlay').classList.remove('open'); document.body.style.overflow = ''; }
function syncMobile() { const d = document.getElementById('mobileDrawerNav'); const s = document.getElementById('sidenav'); if (d && s) d.innerHTML = s.innerHTML; }

// ════════════════════════════════════════════════
//  RENDER TABS
// ════════════════════════════════════════════════
function renderTabs() {
  const labels = { gilde:'🏛️ Società & Imprese', licenze:'⚖️ Licenze & Patenti' };
  const tabsRow = document.getElementById('tabsRow');
  tabsRow.innerHTML = PAGES.map(p =>
    `<button class="tab-btn ${p===currentPage?'active':''}" onclick="setPage('${p}')">${labels[p]}</button>`
  ).join('');
  document.getElementById('searchRow').style.display = currentPage === 'gilde' ? 'flex' : 'none';
  setupGlobalSearch();
  setupTableSort();
}

// ════════════════════════════════════════════════
//  RENDER SIDENAV
// ════════════════════════════════════════════════
function renderSideNav() {
  const el = document.getElementById('sidenav');
  const nav = NAV[currentPage];
  let h = '<div class="sidenav-section"><div class="sidenav-title">Sezioni</div>';
  nav.forEach(n => {
    h += `<button class="sidenav-btn ${currentSection===n.id?'active':''}" onclick="setSection('${n.id}')">${n.label}</button>`;
  });
  h += '</div>';
  el.innerHTML = h;
}

// ════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════
function sectionTitle(icon, label) {
  return `<div class="doc-section-title">${icon} ${label}</div>`;
}
function tableWrap(inner) { return `<div class="table-wrap">${inner}</div>`; }
function escHtml(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ════════════════════════════════════════════════
//  SEARCH / FILTER / SORT
// ════════════════════════════════════════════════
let searchState = { query: '', filters: {} };

function setupGlobalSearch() {
  const input = document.getElementById('globalSearch');
  if (!input) return;
  input.value = searchState.query;
  input.oninput = (e) => {
    searchState.query = e.target.value.toLowerCase();
    applyGlobalSearch();
  };
  input.onkeydown = (e) => { if (e.key === 'Escape') { input.value = ''; searchState.query = ''; applyGlobalSearch(); input.blur(); }};
}

function applyGlobalSearch() {
  const content = document.getElementById('content');
  const query = searchState.query;
  const filterEl = document.getElementById('activeFilters');

  const filterCount = Object.keys(searchState.filters).length;
  filterEl.innerHTML = (query || filterCount)
    ? `<span class="filter-badge">Filtri attivi: ${query ? `testo "${query}"` : ''}${query && filterCount ? ' + ' : ''}${filterCount > 0 ? `${filterCount} colonna/e` : ''} <button onclick="clearAllFilters()" title="Clear all">✕</button></span>`
    : '';

  if (!query && filterCount === 0) {
    content.querySelectorAll('.highlight').forEach(el => el.outerHTML = el.innerHTML);
    content.querySelectorAll('tbody tr').forEach(tr => tr.style.display = '');
    return;
  }

  const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, null, false);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  textNodes.forEach(node => {
    if (node.parentElement.closest('table') || node.parentElement.closest('script') || node.parentElement.closest('style')) return;
    const text = node.textContent;
    if (query && text.toLowerCase().includes(query)) {
      const span = document.createElement('span');
      span.innerHTML = text.replace(new RegExp(`(${escapeRegExp(query)})`, 'gi'), '<mark class="highlight">$1</mark>');
      node.parentNode.replaceChild(span, node);
    }
  });

  content.querySelectorAll('tbody tr').forEach(tr => {
    const text = tr.textContent.toLowerCase();
    const matchesQuery = !query || text.includes(query);
    const matchesFilters = Object.entries(searchState.filters).every(([colIdx, val]) => {
      const cell = tr.cells[colIdx];
      return !cell || !val || cell.textContent.toLowerCase().includes(val);
    });
    tr.style.display = (matchesQuery && matchesFilters) ? '' : 'none';
  });
}

function clearAllFilters() {
  searchState.query = '';
  searchState.filters = {};
  const input = document.getElementById('globalSearch');
  if (input) input.value = '';
  applyGlobalSearch();
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function setupTableSort() {
  document.querySelectorAll('thead th').forEach((th, colIdx) => {
    if (th.classList.contains('sortable')) return;
    th.classList.add('sortable');
    th.onclick = () => sortTable(th, colIdx);
  });
  document.querySelectorAll('table').forEach(table => {
    if (table.querySelector('.table-filter-row')) return;
    const thead = table.querySelector('thead');
    if (!thead || !thead.rows[0]) return;
    const filterRow = document.createElement('tr');
    filterRow.className = 'table-filter-row';
    thead.rows[0].querySelectorAll('th').forEach((th, i) => {
      const td = document.createElement('td');
      td.style.padding = '4px 12px';
      const input = document.createElement('input');
      input.type = 'search';
      input.placeholder = 'Filtra...';
      input.style.width = '100%';
      input.oninput = (e) => {
        searchState.filters[i] = e.target.value.toLowerCase() || null;
        if (!e.target.value) delete searchState.filters[i];
        applyGlobalSearch();
      };
      td.appendChild(input);
      filterRow.appendChild(td);
    });
    thead.appendChild(filterRow);
  });
}

function sortTable(th, colIdx) {
  const table = th.closest('table');
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.rows);
  const isAsc = th.classList.contains('sort-asc');

  table.querySelectorAll('thead th').forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
  th.classList.add(isAsc ? 'sort-desc' : 'sort-asc');

  const direction = isAsc ? -1 : 1;
  const getCellValue = (row, idx) => row.cells[idx]?.textContent.trim() || '';

  rows.sort((a, b) => {
    const aVal = getCellValue(a, colIdx);
    const bVal = getCellValue(b, colIdx);
    const aNum = parseFloat(aVal.replace(/[^0-9.-]/g, ''));
    const bNum = parseFloat(bVal.replace(/[^0-9.-]/g, ''));
    if (!isNaN(aNum) && !isNaN(bNum)) return (aNum - bNum) * direction;
    return aVal.localeCompare(bVal, 'it', {numeric: true}) * direction;
  });

  rows.forEach(row => tbody.appendChild(row));
}

// ════════════════════════════════════════════════
//  STATS IMPRESA (formula unica, riusata ovunque)
// ════════════════════════════════════════════════
function impresaStats(data) {
  data = data || {};
  var fatt = +data.fatturato || 0;
  var rendita = (data.contratti || []).reduce(function(s,c){ return s + (+c.rendita || 0); }, 0);
  var sospeso = data.stato === 'sospesa' || data.stato === 'sanzione';
  var rendEff = sospeso ? 0 : rendita;
  var lordo = fatt + rendEff;
  var tassa = Math.round(lordo * 0.01);
  var appPG = (data.soci || []).filter(function(s){ return s.isApprendista && s.tipo === 'PG'; }).length;
  var appNPC = (data.soci || []).filter(function(s){ return s.isApprendista && s.tipo !== 'PG'; }).length;
  var apprCost = appPG * 20 + appNPC * 8;
  var riserva = Math.round(Math.max(0, lordo - tassa - apprCost) * 0.1);
  var netto = lordo - tassa - apprCost - riserva;
  return { fatt:fatt, rendita:rendita, rendEff:rendEff, sospeso:sospeso, lordo:lordo, tassa:tassa, apprCost:apprCost, riserva:riserva, netto:netto };
}

// ════════════════════════════════════════════════
//  RENDER GILDE
// ════════════════════════════════════════════════
const RENDER_GILDE = {

// ─────────────────────────────────────────────
panoramica: () => `
  <div class="page-hero gilde">
    <h2>🏛️ Le Imprese di Arcadia<br><small style="font-size:.55em;color:var(--text3);letter-spacing:.08em">Camera del Commercio e dei Mestieri — Regno di Arcadia</small></h2>
    <p><strong style="color:var(--gold)">Che cos'è un'Impresa?</strong> È un gruppo di <strong>2 o più personaggi</strong> che si mettono insieme per produrre e vendere i propri mestieri, con una sede fisica e una cassa comune. Tutto qui.</p>
    <p style="margin-top:8px">Un'Impresa nasce come una piccola <strong style="color:var(--gold)">Bottega</strong> e cresce fino a diventare una potente <strong style="color:var(--gold)">Corporazione</strong>. Ogni passaggio è semplice: <em>paghi una tassa, allarghi la sede, ottieni un nuovo beneficio</em>.</p>
    <div class="hero-links">
      ${DATA.patenti.map(p => `<button class="hero-link-btn" onclick="goto('licenze','${p.sezione}')">${p.sigla} · ${p.nome}</button>`).join('')}
    </div>
  </div>

  <div class="doc-section">
    ${sectionTitle('📋', 'Come Creare un\u0027Impresa')}
    <div class="rule-box" style="margin-bottom:16px">
      <h4>🏦 Dove si fa la pratica</h4>
      <p>I personaggi interessati devono recarsi <strong>al Castello</strong> e parlare con il <strong>Reparto Finanze</strong>. È l\u0027unico ufficio che rilascia le licenze di esercizio e registra le nuove Imprese nel Libro delle Corporazioni.</p>
    </div>

    <div class="rules-grid">
      <div class="rule-box">
        <h4>👥 Requisiti minimi (Livello 1 — Bottega)</h4>
        <ul>
          <li>Almeno <strong>2 personaggi</strong> (il responsabile e almeno un socio)</li>
          <li>Un <strong>Responsabile</strong> con la patente <strong>${patLink('P.M.C.')}</strong></li>
          <li>Un <strong>Mastro Artigiano</strong> (♦) in organico</li>
          <li>Almeno un socio non-apprendista con una <strong>Patente valida</strong></li>
          <li>Una <strong>sede fisica</strong>: Magazzino (150 Mo)</li>
        </ul>
      </div>
      <div class="rule-box">
        <h4>💰 Costi di fondazione</h4>
        <ul>
          <li><strong>Tassa di registrazione</strong>: ${DATA.livelli[0].fee} Mo</li>
          <li><strong>Magazzino</strong> (sede obbligatoria): 150 Mo</li>
          <li><strong>Fondo iniziale</strong> per la cassa comune: ${DATA.fondi.init} Mo</li>
          <li style="color:var(--amber)">Totale minimo: ${DATA.livelli[0].fee + 150 + DATA.fondi.init} Mo da investire subito</li>
        </ul>
      </div>
      <div class="rule-box">
        <h4>📝 Cosa portare al Castello</h4>
        <ul>
          <li>I <strong>personaggi</strong> presenti con le loro patenti</li>
          <li>La <strong>lista dei soci</strong> con nome, mestiere, ruolo e patente</li>
          <li>Il <strong>fondo comune</strong> in Mo (cassa + investimenti)</li>
          <li>La <strong>scelta del settore</strong> (mestiere principale dell\u0027Impresa)</li>
        </ul>
      </div>
      <div class="rule-box">
        <h4>⚠️ Note importanti</h4>
        <ul>
          <li>La <strong>tassa si paga una volta</strong> al momento della fondazione</li>
          <li>Il <strong>Fondo Iniziale</strong> (30 Mo) è separato dalla cassa</li>
          <li>Gli <strong>apprendisti</strong> costano 8 Mo/NPC o 20 Mo/PG al mese</li>
          <li>La <strong>tassa Camera</strong> è dell\u00271% sul fatturato lordo mensile</li>
        </ul>
      </div>
    </div>

    <div class="note-box" style="margin-top:16px">
      💡 <strong>Suggerimento:</strong> usa il <strong>Gestore di Società</strong> per simulare la creazione e verificare che tutti i requisiti siano soddisfatti prima di andare al Castello. Puoi anche generare un\u0027Impresa casuale con il pulsante 🎲 per avere un\u0027ispirazione.
    </div>
  </div>

  <div class="doc-section">
    ${sectionTitle('⚖️', 'I 3 Livelli in Sintesi')}
    <div class="note-box" style="margin-bottom:18px">💡 <strong>Regola d'oro:</strong> sali di livello quando hai soddisfatto i requisiti e paghi la tassa. Più è alto il Livello, più privilegi ottieni — ma anche più controlli. Ogni sigla è un pulsante: il gioco è <strong>intrecciato con le Patenti</strong>, clicca per approfondire.</div>
    ${tableWrap(`<table>
      <thead><tr><th>Livello</th><th>Nome</th><th>Patente legata</th><th>In una frase</th></tr></thead>
      <tbody>
        <tr class="row-pmc"><td>1</td><td>Bottega</td><td>${patLink('P.M.C.')}</td><td>Fondazione: un gruppo di artigiani con una sede e una patente.</td></tr>
        <tr class="row-pmt"><td>2</td><td>Officina</td><td>${patLink('P.M.T.')}</td><td>Espansione: più mestieri, struttura avanzata, lavori militari.</td></tr>
        <tr class="row-poe"><td>3</td><td>Corporazione</td><td>${patLink('P.O.E.')}</td><td>La vetta: monopolio, seggio al Consiglio, prestigio.</td></tr>
      </tbody>
    </table>`)}
  </div>
`,
// ─────────────────────────────────────────────
livelli: () => `
  <div class="page-hero gilde">
    <h2>🏪 I 3 Livelli dell'Impresa</h2>
    <p>Ogni Impresa parte dal Livello 1. Ogni Livello dà <strong>1 beneficio</strong> e impone <strong>1 limite</strong>. Semplice da ricordare. Clicca il badge della patente per aprire la pagina relativa.</p>
  </div>

  ${DATA.livelli.map(l => `
  <div class="impresa-card">
    <div class="impresa-header">
      <h3>Livello ${l.id} — ${l.name}</h3>
      ${patBtn(l.patente)}
    </div>
    <div class="impresa-body">
      <div class="info-block">
        <p><strong>Costo ${l.id === 1 ? 'di fondazione' : 'di salita'} ${l.id > 1 ? `(+${l.fee} Mo, totale ${l.sumFee} Mo)` : ''}:</strong> ${l.fee} Mo</p>
        <p><strong>Requisiti:</strong> ${l.soci} · ${l.structReqs}${l.id > 1 ? ' · ' + l.ruoloObb : ''}</p>
        ${l.id === 1 ? `<p><strong>Ruoli obbligatori:</strong> ${l.ruoloObb}</p>` : `<p><strong>Requirement socio:</strong> ${l.ruoloObb}</p>`}
        ${l.id === 3 ? `<p><strong>Tasse totali:</strong> ${l.sumFee} Mo + ${DATA.fondi.deposit} Mo cauzione</p>` : ''}
        <h5 style="margin-top:12px">Beneficio</h5>
        <ul class="benefit-list"><li>${l.beneficio}</li></ul>
      </div>
      <div class="info-block">
        <h5>Limite</h5>
        <ul class="limit-list"><li>${l.limite}</li></ul>
      </div>
    </div>
  </div>`).join('')}

  <div class="note-box" style="margin-top:16px">⚠ <strong>Le tasse si sommano:</strong> per arrivare alla Corporazione paghi ${DATA.livelli.map(l => `${l.fee}`).join(' + ')} = <strong>${DATA.livelli[2].sumFee} Mo</strong> di tasse, più <strong>${DATA.fondi.deposit} Mo</strong> di cauzione (restituita allo scioglimento regolare). Il Fondo Iniziale di <strong>${DATA.fondi.init} Mo</strong> è separato.</div>

  <div class="doc-section" style="margin-top:22px">
    ${sectionTitle('🧮', 'Esempio Pratico — La Bottega dei Martelli')}
    <div class="rule-box" style="margin-top:8px">
      <p>Hai <strong>3+ società</strong> con due Osti e un Sarto? No — ecco un percorso concreto:</p>
      <p style="margin-top:6px"><strong style="color:var(--gold2)">L1 — Bottega:</strong> Aldric (Responsabile, P.M.C. 50 Mo), Brenna (Mastro Artigiano, P.M.C. 50 Mo), Calla (Apprendista, nessuna patente). Paghi <strong>75</strong> tassa + <strong>150</strong> Magazzino + <strong>30</strong> Fondo = <strong>355 Mo</strong>. Fatturato 200/mese → tassa 2 Mo, Fondo di Riserva ~20 Mo, utile ~105 Mo/mese.</p>
      <p style="margin-top:6px"><strong style="color:var(--gold2)">L2 — Officina (dopo ~3 mesi):</strong> +100 tassa, Forgia Noxiana 250 Mo, P.M.T. per il Responsabile 110 Mo = <strong>+460 Mo</strong> (totale investito 815 Mo). Con il Timbro Imperiale (+15%) il fatturato sale a 230/mese.</p>
      <p style="margin-top:6px"><strong style="color:var(--gold2)">L3 — Corporazione (dopo altri ~4 mesi):</strong> +200 tassa + 300 cauzione (restituita) + P.O.E. 400 Mo + seconda struttura LV2 250 Mo = <strong>+1.150 Mo</strong>. Totale investito ≈ <strong>1.965 Mo</strong>, di cui 300 Mo rimborsabili. In cambio: monopolio e seggio al Consiglio.</p>
      <p style="margin-top:6px;color:var(--text3);font-size:.82rem">I numeri sono indicativi: regolate prezzi e tempistiche in base alla vostra campagna.</p>
    </div>
  </div>
`,
// ─────────────────────────────────────────────
procedura: () => `
  <div class="page-hero gilde">
    <h2>📜 Come si fonda e si gestisce</h2>
    <p>Tutto quello che serve per creare e far funzionare un'Impresa, in pochi passi.</p>
  </div>

  <div class="doc-section">
    ${sectionTitle('📜', 'Passo 1 — Fondazione')}
    <p style="color:var(--text2);font-size:.9rem;margin-bottom:16px;line-height:1.6">Per fondare: <strong>soci</strong> (2-6), una <strong>patente</strong> valida, una <strong>sede</strong>, e l'<strong>Atto Costitutivo</strong> (documento con nome, mestieri, quote e Responsabile).</p>
    ${tableWrap(`<table>
      <thead><tr><th>Cosa serve</th><th>Costo</th></tr></thead>
      <tbody>
        <tr><td>Tassa di registrazione (Livello 1)</td><td><strong>${DATA.livelli[0].fee} Mo</strong></td></tr>
        <tr><td>Sede minima: Magazzino</td><td><strong>150 Mo</strong></td></tr>
        <tr><td>Fondo Iniziale (cassa comune)</td><td><strong>${DATA.fondi.init} Mo</strong></td></tr>
      </tbody>
    </table>`)}
    <p style="color:var(--text3);font-size:.86rem;margin-top:10px">Presenti l'Atto alla Camera del Commercio, paghi, e ricevi il <strong>Certificato</strong> e il <strong>Timbro d'Impresa</strong>. Un socio può entrare/uscire in seguito (ingresso: voto di 2/3 dei soci, 20 Mo).</p>
  </div>

  <div class="doc-section">
    ${sectionTitle('💰', 'Passo 2 — Gestione semplice')}
    ${tableWrap(`<table>
      <thead><tr><th>Voce</th><th>Regola</th></tr></thead>
      <tbody>
        <tr><td>Registro Entrate/Uscite</td><td>Tienilo aggiornato: l'${abbr('U.R.V.')} può chiederlo. <button class="btn secondary small" style="margin-left:6px" onclick="goto('gilde','gestore')">📗 Apri Gestore</button></td></tr>
        <tr><td>Fondo di Riserva</td><td>Accantona il <strong>10%</strong> dei profitti mensili.</td></tr>
        <tr><td>Tassa alla Camera</td><td><strong>1% del fatturato complessivo</strong> (vendite + contratti + affitti), trimestrale (esente i primi 3 mesi).</td></tr>
        <tr><td>Apprendisti</td><td>PG LV1 o NPC assunti. Non firmano documenti legali. Costi: NPC 8 Mo/mese, PG 20 Mo/mese.</td></tr>
      </tbody>
    </table>`)}
  </div>

  <div class="doc-section">
    ${sectionTitle('🏗️', 'Passo 3 — Sede e Strutture')}
    <p style="color:var(--text2);font-size:.9rem;margin-bottom:14px;line-height:1.6">Le strutture della sede danno <strong>bonus concreti</strong>. Le LV1 sono economiche; le LV2 costano 250 Mo ciascuna e danno un <strong>bonus meccanico di classe per un PG, una volta per Riposo Lungo</strong> (tematico per ogni struttura).</p>
    ${tableWrap(`<table>
      <thead><tr><th>Struttura</th><th>Liv</th><th style="text-align:right">Costo</th><th>Effetto</th></tr></thead>
      <tbody>
        ${DATA.strutture.map(s => `<tr class="${s.lv === 2 ? 'row-pmt' : ''}"><td>${s.nome}</td><td>${s.lv}</td><td style="text-align:right">${s.cost} Mo</td><td>${s.effetto}</td></tr>`).join('')}
      </tbody>
    </table>`)}
    <p style="color:var(--text3);font-size:.86rem;margin-top:10px">Max <strong>1 struttura LV2 per tipo</strong> per sede. Costo di costruzione (Downtime) a carico dell'Architetto.</p>
  </div>

  <div class="doc-section">
    ${sectionTitle('⚠️', 'Passo 4 — Sanzioni (in breve)')}
    ${tableWrap(`<table>
      <thead><tr><th>Gravità</th><th>Sanzione</th></tr></thead>
      <tbody>
        <tr class="sanz-lieve"><td>Lieve</td><td>Multa <strong>50 Mo</strong> + regolarizzazione in 15 giorni.</td></tr>
        <tr class="sanz-grave"><td>Grave</td><td>Multa <strong>200 Mo</strong> + sospensione 3 mesi (contratti e affitti sospesi).</td></tr>
        <tr class="sanz-graviss"><td>Gravissima</td><td>Scioglimento coatto + confisca cassa (+ cauzione per la Corporazione) + Sigillo Spezzato ai soci.</td></tr>
      </tbody>
    </table>`)}
    <button class="btn secondary" style="margin-top:10px" onclick="goto('gilde','gestore')">⚠️ Gestione sanzioni nel Gestore</button>
    <p style="color:var(--text3);font-size:.86rem;margin-top:10px"><strong>Corporazione:</strong> uso scorretto del Sigillo → Gravissima (confisca cauzione); Fondo di Categoria mancante → Grave. Vedi l'elenco completo nello strumento qui sopra.</p>
  </div>
`,
// ─────────────────────────────────────────────
entrate: () => `
  <div class="page-hero gilde">
    <h2>💰 Entrate dell'Impresa</h2>
    <p>Come guadagna un'Impresa, senza regole complicate.</p>
  </div>

  <div class="doc-section">
    ${sectionTitle('💵', 'Contratti di Fornitura')}
    <p style="color:var(--text2);font-size:.9rem;margin-bottom:16px;line-height:1.6">Negozi <strong>una volta</strong> (con un roleplay o un Downtime) e ottieni una rendita <strong>automatica ogni mese</strong>, finché l'Impresa resta attiva. Investimento a rientro rapido (≈ 3 mesi).</p>
    ${tableWrap(`<table>
      <thead><tr><th>Patente richiesta</th><th style="text-align:right">Investimento</th><th style="text-align:right">Rendita/mese</th><th style="text-align:right">Rientro</th></tr></thead>
      <tbody>
        ${DATA.fornitura.map(f => {
          const mesi = Math.ceil(f.cost / f.rent);
          return `<tr class="${dataCls(f.pat)}"><td>${patLink(f.pat)}</td><td style="text-align:right">${f.cost} Mo</td><td style="text-align:right"><strong>${f.rent} Mo</strong></td><td style="text-align:right">${mesi} mesi</td></tr>`;
        }).join('')}
      </tbody>
    </table>`)}
    <p style="color:var(--text3);font-size:.86rem;margin-top:10px">Un solo contratto attivo per socio che possiede la Patente richiesta. <strong>Tetto massimo:</strong> i Contratti attivi non possono superare il Livello dell'Impresa (max 1 al Livello 1, max 3 alla Corporazione).</p>
  </div>

  <div class="doc-section">
    ${sectionTitle('🏠', 'Affitto di Struttura')}
    <p style="color:var(--text2);font-size:.9rem;line-height:1.6">Una struttura inutilizzata può essere affittata: rendita del <strong>5–10%</strong> del suo valore, ogni mese.</p>
  </div>

  <div class="doc-section">
    ${sectionTitle('🛍️', 'Vendita diretta a Bottega')}
    <p style="color:var(--text2);font-size:.9rem;margin-bottom:14px;line-height:1.6">La vendita diretta è il pane quotidiano. Regole semplici consigliate:</p>
    ${tableWrap(`<table>
      <thead><tr><th>Voce</th><th>Regola</th></tr></thead>
      <tbody>
        <tr><td>Margine tipico</td><td><strong>+20–40%</strong> sul costo delle materie prime usate (a mano libera del DM).</td></tr>
        <tr><td>In Bottega (sede)</td><td>Senza commissione se l'Impresa ha accesso al mercato comunale (Livello 1+).</td></tr>
        <tr><td>Fuori sede</td><td>Al mercato di un'altra città: <strong>10% di commissione</strong> sulle vendite.</td></tr>
        <tr><td>Contratti a termine</td><td>Ordini che richiedono più Downtime: paga anticipata <strong>50%</strong>, saldo a consegna.</td></tr>
      </tbody>
    </table>`)}
  </div>

  <div class="doc-section">
    ${sectionTitle('📝', 'Lavori su Commissione privata')}
    <p style="color:var(--text2);font-size:.9rem;line-height:1.6">Prezzi orientativi <em>(adattate alla campagna)</em>: oggetto comune 1–20 Mo, oggetto non comune 20–80 Mo, oggetto raro 80–200 Mo, oggetto molto raro 200–500 Mo, leggendario: trattativa. La <strong style="color:var(--gold2)">P.O.E.</strong> può certificare (+20% valore).</p>
  </div>

  <div class="doc-section">
    ${sectionTitle('🧮', 'Come calcolare il Fatturato mensile')}
    <div class="rule-box" style="margin-top:8px">
      <p><strong>Fatturato = Vendite dirette + Rendita Contratti + Affitti</strong></p>
      <p style="margin-top:6px;color:var(--text2)">La <strong>Tassa Camera (1%)</strong> si calcola sul fatturato complessivo (quindi anche su contratti e affitti). Il <strong>Fondo di Riserva (10%)</strong> si accantona sull'utile netto. Durante una sospensione (sanzione Grave o superiore) i contratti e gli affitti <strong>si sospendono</strong>.</p>
    </div>
  </div>

  <div class="note-box">⚠ <strong>Sospensione:</strong> contratti e affitti si sospendono se l'Impresa riceve una sanzione <strong>Grave</strong> o superiore.</div>
`,
// ─────────────────────────────────────────────
riferimenti: () => `
  <div class="page-hero gilde">
    <h2>📚 Riferimenti Avanzati</h2>
    <p>Tutto il resto, per chi gioca da più tempo o vuole approfondire. Qui trovi alleanze, conflitti, eventi, organizzazioni e glossario.</p>
  </div>

  <div class="doc-section">
    ${sectionTitle('🤝', 'Alleanze e Joint Venture')}
    <p style="color:var(--text2);font-size:.9rem;margin-bottom:14px;line-height:1.6"><strong>Alleanza Commerciale</strong> (fino a 3 Imprese): registrazione 20 Mo/impresa, sconto 5% su acquisti congiunti, bandi oltre 1.000 Mo, durata 3 mesi-1 anno.</p>
    <p style="color:var(--text2);font-size:.9rem;line-height:1.6"><strong>Joint Venture:</strong> progetto condiviso con budget dedicato. Registrazione 30 Mo alla Camera, Amministratore eletto, responsabilità separate.</p>
  </div>

  <div class="doc-section">
    ${sectionTitle('⚔️', 'Conflitti e Spionaggio')}
    <p style="color:var(--text2);font-size:.9rem;margin-bottom:14px;line-height:1.6"><strong>Conflitto Commerciale:</strong> dichiarazione ${DATA.conflitti.dichiarazione} Mo, poi −10% prezzi vendita per 3 mesi. Escalation ${DATA.conflitti.escalation} Mo/mese, mediazione ${DATA.conflitti.mediazione} Mo. Dopo ${DATA.conflitti.durataMax} mesi termina da solo e il vincitore ottiene Privilegio di Preferenza. Max 1 conflitto attivo.</p>
    <button class="btn secondary small" style="margin-bottom:12px" onclick="goto('gilde','gestore')">⚔️ Registra un conflitto nel Gestore</button>
    ${tableWrap(`<table>
      <thead><tr><th>Mezzo</th><th>Costo/Durata</th><th>CD</th><th>Se scoperti</th></tr></thead>
      <tbody>
        ${DATA.sponsaggio.map(s => `<tr><td>${s.livello}</td><td>${s.dt}</td><td>${s.cd}</td><td>${s.san}</td></tr>`).join('')}
      </tbody>
    </table>`)}
  </div>

  <div class="doc-section">
    ${sectionTitle('🎲', 'Eventi Stagionali')}
    <p style="color:var(--text2);font-size:.9rem;margin-bottom:14px;line-height:1.6">Tira <strong>1d20</strong> a inizio mese (+2 per ogni Livello dell'Impresa) o usa gli eventi stagionali fissi qui sotto. <button class="btn secondary small" style="margin-left:4px" onclick="goto('gilde','gestore')">🎲 Tira l'evento nel Gestore</button></p>
    ${tableWrap(`<table>
      <thead><tr><th>Evento</th><th>Stagione</th><th>Effetto</th></tr></thead>
      <tbody>
        ${DATA.eventi.map(e => `<tr><td>${e.nome}</td><td>${e.stagione} (${e.mese})</td><td>${e.effetto}</td></tr>`).join('')}
      </tbody>
    </table>`)}
  </div>

  <div class="doc-section">
    ${sectionTitle('🏛️', 'Organizzazioni di Arcadia')}
    <p style="color:var(--text2);font-size:.9rem;margin-bottom:14px;line-height:1.6">Nomi di categoria e lore (es. Società dei Fabbri, dei Tessitori, dell'Osteria): un'Impresa di alto livello può usarli come titolo di prestigio, <strong>senza effetti meccanici extra</strong>.</p>
  </div>

  <div class="doc-section">
    ${sectionTitle('📚', 'Glossario Essenziale')}
    ${tableWrap(`<table>
      <thead><tr><th>Termine</th><th>Cosa significa</th></tr></thead>
      <tbody>
        <tr><td><strong>Camera del Commercio</strong></td><td>Dove fondi, registri e fai salire di livello l'Impresa.</td></tr>
        <tr><td><strong>U.R.V.</strong></td><td>Organo di controllo: verifica i requisiti, fa ispezioni, applica le sanzioni.</td></tr>
        <tr><td><strong>Timbro d'Impresa</strong></td><td>Marchio in ottone da apporre su ogni opera venduta.</td></tr>
        <tr><td><strong>Timbro Imperiale</strong></td><td>Sigillo premium (Livello 2) che aumenta del 15% il valore percepito.</td></tr>
        <tr><td><strong>Fondo di Categoria</strong></td><td>Riserva obbligatoria delle Corporazioni per le commesse pubbliche.</td></tr>
        <tr><td><strong>Sigillo Spezzato</strong></td><td>Bollo di disonore su un ex socio dopo uno scioglimento coatto.</td></tr>
        <tr><td><strong>Monopolio</strong></td><td>Privilegio della Corporazione sulle commesse pubbliche del proprio settore.</td></tr>
        <tr><td><strong>Mo</strong></td><td>Monete d'oro: tutta la valuta del Codice.</td></tr>
        <tr><td><strong>DT (Downtime)</strong></td><td>Tempo libero tra le avventure, per costruire, produrre o negoziare.</td></tr>
      </tbody>
    </table>`)}
  </div>
`,
// ─────────────────────────────────────────────
gestore: () => gestoreShell(),
};

function dataCls(sigla) {
  var p = DATA.patenti.filter(function(x){ return x.sigla === sigla; })[0];
  return p ? p.cls : 'row-app';
}

// ════════════════════════════════════════════════
//  RENDER LICENZE
// ════════════════════════════════════════════════
const RENDER_LICENZE = {

panoramica: () => `
  <div class="page-hero licenze">
    <h2>⚖️ Codice Patenti di Arcadia<br><small style="font-size:.55em;color:var(--text3);letter-spacing:.08em">Ufficio del Registro e della Vigilanza (U.R.V.) — Regno di Arcadia</small></h2>
    <p>Il presente sistema regola l'esercizio dei mestieri, la compravendita di manufatti e l'uso di sostanze speciali nel Regno. Ogni licenza ha una <strong style="color:var(--gold)">durata triennale</strong> e il possesso del <strong style="color:var(--gold)">Sigillo di Riconoscimento</strong> (medaglione incantato) garantisce lo status legale dell'artigiano.</p>
  </div>`,

vantaggi: () => `
  <div class="doc-section">
    ${sectionTitle('✦', 'Vantaggi Generali del Licenziatario')}
    <p style="color:var(--text2);font-size:.9rem;margin-bottom:16px">Il possesso di una patente valida offre benefici immediati a ogni cittadino di Arcadia:</p>
    <div class="card-grid">
      ${[
        ['🛡️','Protezione Legale','Intervento prioritario della Guardia cittadina in caso di truffe o controversie commerciali.'],
        ['📋','Accesso ai Grandi Appalti','Solo i licenziatari possono partecipare a commesse statali superiori alle <strong>1.000 Mo</strong>.'],
        ['⭐','Prestigio Professionale','Vantaggio alle prove di <strong>Persuasione</strong> legate al proprio mestiere mostrando il Sigillo.'],
        ['🏥','Assicurazione Statale','Copertura del <strong>30% dei danni</strong> in caso di incidenti documentati in laboratorio.'],
        ['🏠','Diritto di Bottega','Esenzione dai controlli arbitrari e diritto di esporre l\u0027insegna ufficiale.'],
      ].map(([e,t,d]) => `<div class="card"><h4>${e} ${t}</h4><p>${d}</p></div>`).join('')}
    </div>
  </div>`,

quadro: () => `
  <div class="doc-section">
    ${sectionTitle('📋', 'Quadro Generale delle Patenti')}
    ${tableWrap(`<table>
      <thead><tr><th>Sigla</th><th>Denominazione</th><th style="text-align:right">Costo (3 anni)</th><th style="text-align:right">Cauzione</th><th style="text-align:right">Totale</th></tr></thead>
      <tbody>
        ${DATA.patenti.map(p => `<tr class="${p.cls}"><td>${abbr(p.sigla)}</td><td>${p.nome}</td><td style="text-align:right">${p.costo} Mo</td><td style="text-align:right">${p.cauzione} Mo</td><td style="text-align:right"><strong>${p.totale} Mo</strong></td></tr>`).join('')}
      </tbody>
    </table>`)}
  </div>`,

pmc: () => `
  <div class="licenza-card" style="border-color:var(--common)">
    <div class="licenza-header" style="background:rgba(96,184,64,.07)">
      <h3 style="color:var(--common)">🟢 P.M.C. — Manifattura Comune</h3>
      <p class="lh-meta">Costo: 40 Mo · Cauzione: 10 Mo · <strong style="color:var(--text2)">Totale: 50 Mo</strong> · Durata: 3 anni</p>
      <p class="lh-meta" style="margin-top:4px">Ideale per: Osti, Sarti, Falegnami e Artisti.</p>
    </div>
    <div class="licenza-body">
      <div class="licenza-block">
        <h5>✦ Permessi</h5>
        <ul>
          <li>Vendita di beni comuni (cibo, abiti, mobili, arte non magica).</li>
          <li>Commesse fino a <strong style="color:var(--gold)">500 Mo</strong>.</li>
        </ul>
      </div>
      <div class="licenza-block">
        <h5>📦 Materiali</h5>
        <ul>
          <li>Acquisto libero di materie prime ordinarie.</li>
          <li>Alcol fino al Grado II.</li>
        </ul>
      </div>
      <div class="licenza-block">
        <h5>⚠ Limiti</h5>
        <ul>
          <li>Divieto assoluto di produrre veleni o sostanze alchemiche pure.</li>
        </ul>
      </div>
    </div>
    <div class="note-box" style="margin:0 24px 20px">⚠ <strong>Nota:</strong> Ciò che il licenziatario può craftare e vendere è sempre limitato dal <strong>livello del mestiere</strong> posseduto: la Patente abilita all'esercizio dell'attività, ma non sblocca da sola le ricette o gli oggetti di livello superiore. Mestiere e Patente avanzano di pari passo.</div>
  </div>`,

pmt: () => `
  <div class="licenza-card" style="border-color:var(--uncommon)">
    <div class="licenza-header" style="background:rgba(90,138,216,.07)">
      <h3 style="color:var(--uncommon)">🔵 P.M.T. — Manifattura Tecnica</h3>
      <p class="lh-meta">Costo: 85 Mo · Cauzione: 25 Mo · <strong style="color:var(--text2)">Totale: 110 Mo</strong> · Durata: 3 anni</p>
      <p class="lh-meta" style="margin-top:4px">Ideale per: Fabbri, Gioiellieri, Architetti e Cartografi ufficiali.</p>
    </div>
    <div class="licenza-body">
      <div class="licenza-block">
        <h5>✦ Permessi</h5>
        <ul>
          <li>Produzione di armi, armature pesanti, strutture civili/militari.</li>
          <li>Oggetti magici <strong style="color:var(--gold)">Comuni</strong>.</li>
          <li>Emissione di documenti legali e mappe ufficiali.</li>
        </ul>
      </div>
      <div class="licenza-block">
        <h5>📦 Materiali</h5>
        <ul>
          <li>Cristalli conduttori (Hextech Grado I).</li>
          <li>Leghe speciali (Acciaio di Noxus, ecc.).</li>
        </ul>
      </div>
      <div class="licenza-block">
        <h5>⚠ Obblighi</h5>
        <ul>
          <li>Responsabilità legale sulla stabilità delle strutture costruite.</li>
          <li>Tracciabilità delle armi da guerra.</li>
        </ul>
      </div>
    </div>
    <div class="note-box" style="margin:0 24px 20px">⚠ <strong>Nota:</strong> Ciò che il licenziatario può craftare e vendere è sempre limitato dal <strong>livello del mestiere</strong> posseduto: la Patente abilita all'esercizio dell'attività, ma non sblocca da sola le ricette o gli oggetti di livello superiore. Mestiere e Patente avanzano di pari passo.</div>
  </div>`,

pasv: () => `
  <div class="licenza-card" style="border-color:var(--amber)">
    <div class="licenza-header" style="background:rgba(212,149,74,.07)">
      <h3 style="color:var(--amber)">🟠 P.A.S.V. — Alchimia e Sostanze Vincolate</h3>
      <p class="lh-meta">Costo: 140 Mo · Cauzione: 40 Mo · <strong style="color:var(--text2)">Totale: 180 Mo</strong> · Durata: 3 anni</p>
      <p class="lh-meta" style="margin-top:4px">Ideale per: Alchimisti e Artigiani Hextech.</p>
    </div>
    <div class="licenza-body">
      <div class="licenza-block">
        <h5>✦ Permessi</h5>
        <ul>
          <li>Produzione di pozioni fino a <strong style="color:var(--gold)">Non Comuni</strong>.</li>
          <li>Veleni etichettati e motori Hextech.</li>
          <li><strong style="color:var(--gold)">Unica licenza</strong> che permette l'acquisto di Inchiostri Magici.</li>
        </ul>
      </div>
      <div class="licenza-block">
        <h5>📦 Materiali</h5>
        <ul>
          <li>Reagenti rari (Sangue di Demone, Ghiandola di Drago).</li>
          <li>Inchiostri fino al Grado III.</li>
        </ul>
      </div>
      <div class="licenza-block">
        <h5>⚠ Rigore</h5>
        <ul>
          <li>Ogni boccetta è tracciata tramite il <strong style="color:var(--gold)">Marchio Spettrale</strong>.</li>
          <li>Ogni transazione registrata nel Libretto degli Acquisti.</li>
        </ul>
      </div>
    </div>
    <div class="note-box" style="margin:0 24px 20px">⚠ <strong>Nota:</strong> Ciò che il licenziatario può craftare e vendere è sempre limitato dal <strong>livello del mestiere</strong> posseduto: la Patente abilita all'esercizio dell'attività, ma non sblocca da sola le ricette o gli oggetti di livello superiore. Mestiere e Patente avanzano di pari passo.</div>
  </div>`,

poe: () => `
  <div class="licenza-card" style="border-color:var(--legendary)">
    <div class="licenza-header" style="background:rgba(216,176,32,.07)">
      <h3 style="color:var(--legendary)">🟡 P.O.E. — Opere Eccezionali</h3>
      <p class="lh-meta">Costo: 300 Mo · Cauzione: 100 Mo · <strong style="color:var(--text2)">Totale: 400 Mo</strong> · Durata: 3 anni</p>
      <p class="lh-meta" style="margin-top:4px">Riservata ai Maestri Artigiani (Livello 4+).</p>
    </div>
    <div class="licenza-body">
      <div class="licenza-block">
        <h5>✦ Permessi</h5>
        <ul>
          <li>Accesso alle commesse della Corte e titoli onorifici.</li>
        </ul>
      </div>
      <div class="licenza-block">
        <h5>🏆 Privilegi</h5>
        <ul>
          <li>Diritto di formare fino a <strong style="color:var(--gold)">3 apprendisti</strong>.</li>
          <li>Certificare la qualità delle opere (<strong style="color:var(--gold)">+20% valore di mercato</strong>).</li>
        </ul>
      </div>
      <div class="licenza-block">
        <h5>📦 Materiali</h5>
        <ul>
          <li>Accesso a materiali speciali su approvazione del Consiglio.</li>
        </ul>
      </div>
    </div>
    <div class="note-box" style="margin:0 24px 20px">⚠ <strong>Nota:</strong> Ciò che il licenziatario può craftare e vendere è sempre limitato dal <strong>livello del mestiere</strong> posseduto: la Patente abilita all'esercizio dell'attività, ma non sblocca da sola le ricette o gli oggetti di livello superiore. Mestiere e Patente avanzano di pari passo.</div>
  </div>`,

inchiostri: () => `
  <div class="doc-section">
    ${sectionTitle('🖋️', 'Sezione Tecnica: Materiali Vincolati e Inchiostri')}
    <p style="color:var(--text2);font-size:.9rem;margin-bottom:16px">L'uso di inchiostri magici è strettamente regolamentato per evitare abusi arcani. <strong style="color:var(--gold)">Solo la P.A.S.V.</strong> permette l'acquisto di inchiostri magici.</p>
    ${tableWrap(`<table>
      <thead><tr><th>Grado Inchiostro</th><th>Patente Richiesta</th><th>Limite (3 anni)</th><th>Uso Tipico</th></tr></thead>
      <tbody>
        <tr class="row-pmc">
          <td><span class="dot-i" style="background:var(--common)"></span>Grado I</td>
          <td>${abbr('P.M.C.')}</td>
          <td>Uso libero entro soglie ordinarie</td>
          <td>Inchiostri comuni, scrittura base, documenti</td>
        </tr>
        <tr class="row-pmt">
          <td><span class="dot-i" style="background:var(--uncommon)"></span>Grado II</td>
          <td>${abbr('P.M.T.')}</td>
          <td>Tracciato nel Libretto degli Acquisti</td>
          <td>Mappe ufficiali, documenti legali sigillati, Hextech Grado I</td>
        </tr>
        <tr class="row-pasv">
          <td><span class="dot-i" style="background:var(--amber)"></span>Grado III</td>
          <td>${abbr('P.A.S.V.')}</td>
          <td>Tracciato con Marchio Spettrale</td>
          <td>Pergamene magiche, Tattoo magici, componenti alchemici avanzati</td>
        </tr>
        <tr class="row-poe">
          <td><span class="dot-i" style="background:var(--legendary)"></span>Grado IV+</td>
          <td>${abbr('P.O.E.')} + approvazione U.R.V.</td>
          <td>Approvazione caso per caso</td>
          <td>Manufatti leggendari, opere della Corte, Grimori avanzati</td>
        </tr>
      </tbody>
    </table>`)}
    <div class="note-box">⚠ <strong>Marchio Spettrale:</strong> Ogni fiala di inchiostro di Grado III o superiore viene marchiata spettralmente dall'U.R.V. al momento dell'acquisto. Il marchio registra automaticamente data, acquirente e quantità. La rimozione del marchio è un reato grave.</div>
  </div>`,

strumenti: () => `
  <div class="page-hero licenze">
    <h2>🛠️ Strumenti per Patenti</h2>
    <p>Calcolatori e tracker per gestire le Patenti dei licenziatari di Arcadia.</p>
  </div>

  <div class="doc-section">
    ${sectionTitle('🧮', 'Confronto & Costi Patenti')}
    <p style="color:var(--text2);font-size:.9rem;margin-bottom:16px;line-height:1.6">I dati delle 4 Patenti, aggregati e confrontabili. Inchiostri e materiali inclusi.</p>
    ${tableWrap(`<table>
      <thead><tr><th>Patente</th><th>Costo (3 anni)</th><th>Cauzione</th><th>Totale</th><th>Durata</th><th>Destinatari</th></tr></thead>
      <tbody>
        ${DATA.patenti.map(p => `<tr class="${p.cls}"><td><strong>${p.sigla}</strong> — ${p.nome}</td><td>${p.costo} Mo</td><td>${p.cauzione} Mo</td><td><strong>${p.totale} Mo</strong></td><td>${p.durata}</td><td>${p.destinatari}</td></tr>`).join('')}
      </tbody>
    </table>`)}
  </div>

  <div class="doc-section">
    ${sectionTitle('📊', 'Tracker Patenti dei Licenziatari')}
    <p style="color:var(--text2);font-size:.9rem;margin-bottom:16px;line-height:1.6">Tieni traccia delle Patenti di ogni personaggio: tipo, costo, scadenza triennale e stato. Dati salvati in locale (localStorage) con export/import JSON.</p>
    <button class="btn" onclick="openPatentiTracker()">Apri Tracker Patenti</button>
  </div>
`,
};

// ════════════════════════════════════════════════
//  RENDER CONTENT
// ════════════════════════════════════════════════
function renderContent() {
  const el = document.getElementById('content');
  const map = currentPage === 'gilde' ? RENDER_GILDE : RENDER_LICENZE;
  const fn = map[currentSection];
  el.innerHTML = fn ? fn() : '<div style="color:var(--text3);padding:40px;text-align:center">Sezione non trovata.</div>';
  if (currentPage === 'gilde' && currentSection === 'gestore') gInit();
  setupTableSort();
  applyGlobalSearch();
}

// ════════════════════════════════════════════════
//  STATE SETTERS
// ════════════════════════════════════════════════
function setPage(p) {
  currentPage = p;
  currentSection = 'panoramica';
  render();
  window.scrollTo({top:0,behavior:'smooth'});
}

function setSection(s) {
  currentSection = s;
  render();
  closeDrawer();
  window.scrollTo({top:0,behavior:'smooth'});
}

// ════════════════════════════════════════════════
//  MODAL HELPERS
// ════════════════════════════════════════════════
function openModal(title, bodyHtml, footerHtml) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHtml;
  document.getElementById('modalFooter').innerHTML = footerHtml || '<button class="btn secondary" onclick="closeModal()">Chiudi</button>';
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}
document.getElementById('modalOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ════════════════════════════════════════════════
//  GESTORE DI SOCIETÀ — motore unico
//  Fondazione, gestione e progressione nel rispetto
//  del Codice di Arcadia (Camera del Commercio / U.R.V.)
// ════════════════════════════════════════════════

function patTotale(sigla) {
  var p = DATA.patenti.filter(function(x){ return x.sigla === sigla; })[0];
  return p ? p.totale : 0;
}
function isLv2Struttura(nome) {
  return DATA.strutture.some(function(s){ return s.nome === nome && s.lv === 2; });
}
function statoBadge(stato) {
  var map = { attiva:['Attiva','stato-attiva'], sospesa:['Sospesa','stato-sospesa'], sanzione:['In sanzione','stato-sanzione'], sciolta:['Sciolta','stato-sciolta'] };
  var m = map[stato] || map.attiva;
  return '<span class="stato-badge ' + m[1] + '">' + m[0] + '</span>';
}
function att(v) { return escHtml(String(v == null ? '' : v)); }

// ── Storage (compatibile con il vecchio Tracker) ──
var TRACKER_KEY = 'arcamis_imprese_store';
var TRACKER_ACTIVE_KEY = 'arcamis_impresa_attiva';
var TRACKER_BACKUP_KEY = 'arcamis_imprese_autobackup';
var TRACKER_DEFAULT = { nome:'Nuova Società', livello:1, stato:'attiva', settore:'', cassa:30, fatturato:0, fondo:30, soci:[], strutture:[], contratti:[], transazioni:[], sanzioni:[], note:'', notes:'' };

function trackerStore() {
  try { var s = JSON.parse(localStorage.getItem(TRACKER_KEY)); return (s && s.imprese) ? s : { imprese:{}, ordine:[] }; }
  catch(e) { return { imprese:{}, ordine:[] }; }
}
function trackerActiveId() {
  var id = localStorage.getItem(TRACKER_ACTIVE_KEY);
  var store = trackerStore();
  if (id && store.imprese[id]) return id;
  if (store.ordine.length) return store.ordine[0];
  return null;
}
function setTrackerActiveId(id) { localStorage.setItem(TRACKER_ACTIVE_KEY, id); }
function trackerSnapshot() { try { localStorage.setItem(TRACKER_BACKUP_KEY, JSON.stringify(trackerStore())); } catch(e) {} }
function trackerNew(data) {
  var store = trackerStore();
  var id = 'imp' + Date.now();
  store.imprese[id] = Object.assign({}, TRACKER_DEFAULT, data || {});
  if (store.ordine.indexOf(id) === -1) store.ordine.push(id);
  setTrackerActiveId(id);
  localStorage.setItem(TRACKER_KEY, JSON.stringify(store));
  return id;
}
function trackerLoad() {
  var id = trackerActiveId();
  var store = trackerStore();
  var base = Object.assign({}, TRACKER_DEFAULT);
  if (!id) return base;
  var d = Object.assign(base, store.imprese[id]);
  d.sanzioni = Array.isArray(d.sanzioni) ? d.sanzioni : [];
  d.settore = d.settore || '';
  if (d.notes === undefined) d.notes = d.note || '';
  return d;
}
function trackerSave(data) {
  trackerSnapshot();
  var store = trackerStore();
  var id = trackerActiveId();
  if (!id) { return trackerNew(data); }
  store.imprese[id] = Object.assign({}, TRACKER_DEFAULT, data);
  localStorage.setItem(TRACKER_KEY, JSON.stringify(store));
  return id;
}
function trackerDelete(id) {
  var store = trackerStore();
  if (!store.imprese[id]) return;
  if (!confirm('Eliminare la società "' + (store.imprese[id].nome || 'senza nome') + '"? L\u0027operazione non può essere annullata.')) return;
  trackerSnapshot();
  delete store.imprese[id];
  store.ordine = store.ordine.filter(function(o){ return o !== id; });
  localStorage.setItem(TRACKER_KEY, JSON.stringify(store));
  if (trackerActiveId() === id) localStorage.removeItem(TRACKER_ACTIVE_KEY);
  gInit();
}
function trackerRestoreSnapshot() {
  try {
    var s = JSON.parse(localStorage.getItem(TRACKER_BACKUP_KEY));
    if (!s || !s.imprese) { alert('Nessuno snapshot disponibile.'); return; }
    localStorage.setItem(TRACKER_KEY, JSON.stringify(s));
    gInit();
  } catch(e) { alert('Snapshot non valido.'); }
}

// ── Generatore con ruoli e patenti della meccanica ──
var GEN_NAMES_PREFIX = ['Furbo','Rossi','Bianchi','Neri','Dorati','Argentati','Fiammanti','Ombrosi','Sussurranti','Vagabondi','Coraggiosi','Nobili','Luminosi','Tempestosi','Silenti'];
var GEN_NAMES_SUFFIX = ['Martelli','Spade','Fiamme','Stelle','Ombre','Vetri','Pietre','Foglie','Cuori','Scudi','Frecce','Piume','Opere','Sogni','Cristalli'];
var GEN_MESTIERI = [
  { name:'Oste', pat:'P.M.C.', lv:1 },
  { name:'Falegname', pat:'P.M.C.', lv:1 },
  { name:'Sarto', pat:'P.M.C.', lv:1 },
  { name:'Artista', pat:'P.M.C.', lv:1 },
  { name:'Metallurgo', pat:'P.M.T.', lv:2 },
  { name:'Artigiano', pat:'P.M.T.', lv:2 },
  { name:'Architetto', pat:'P.M.T.', lv:2 },
  { name:'Alchimista', pat:'P.A.S.V.', lv:3 },
  { name:'Artigiano Hextech', pat:'P.A.S.V.', lv:3 },
  { name:'Maestro Artigiano', pat:'P.O.E.', lv:3 },
  { name:'Arcanista delle Corporazioni', pat:'P.O.E.', lv:3 },
];
var GEN_SOCIO_NAMES = ['Aldric','Brenna','Calla','Darian','Elara','Finn','Greta','Haldor','Isolde','Jarek','Kira','Loric','Mira','Norvin','Oria','Pellin','Quinn','Renna','Sorin','Thessa','Ulric','Vessa','Wrenn','Xara','Yves','Zara'];
function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function gRandomData() {
  var level = randInt(1, 3);
  var sociCount = randInt(2, 6);
  if (level >= 3 && sociCount < 4) sociCount = 4;
  var name = rand(GEN_NAMES_PREFIX) + ' ' + rand(GEN_NAMES_SUFFIX);
  var pool = GEN_MESTIERI.filter(function(m){ return m.lv <= level; });
  var reqPat = DATA.livelli[level - 1].patente;

  function mestPat(pat) { return GEN_MESTIERI.filter(function(m){ return m.pat === pat; }); }

  var soci = [];
  var resp = rand(mestPat(reqPat).length ? mestPat(reqPat) : pool);
  soci.push({ nome: GEN_SOCIO_NAMES[0], mestiere: resp.name, patente: resp.pat, ruolo: 'Responsabile', tipo: 'PG' });
  var poolNoResp = pool.filter(function(m){ return m.name !== resp.name; });
  var mastro = rand(poolNoResp.length ? poolNoResp : pool);
  soci.push({ nome: GEN_SOCIO_NAMES[1 % GEN_SOCIO_NAMES.length], mestiere: mastro.name, patente: mastro.pat, ruolo: 'Mastro Artigiano', tipo: 'PG' });
  for (var i = 2; i < sociCount; i++) {
    var m = rand(pool);
    if (level < 3 && m.pat === 'P.O.E.') m = rand(pool.filter(function(x){ return x.pat !== 'P.O.E.'; }));
    if (i === sociCount - 1 && sociCount >= 4) {
      soci.push({ nome: GEN_SOCIO_NAMES[i % GEN_SOCIO_NAMES.length], mestiere: m.name, patente: '—', ruolo: 'Apprendista', tipo: Math.random() > .5 ? 'PG' : 'NPC', isApprendista: true });
    } else {
      soci.push({ nome: GEN_SOCIO_NAMES[i % GEN_SOCIO_NAMES.length], mestiere: m.name, patente: m.pat, ruolo: 'Socio', tipo: 'PG' });
    }
  }

  var strutture = [{ nome:'Magazzino', cost:150 }];
  if (soci.some(function(s){ return s.mestiere === 'Oste'; })) strutture.push({ nome:'Cucina', cost:70 });
  var lv2pool = DATA.strutture.filter(function(s){ return s.lv === 2; });
  if (level >= 2 && lv2pool.length) strutture.push({ nome: lv2pool[randInt(0, lv2pool.length - 1)].nome, cost:250 });
  if (level >= 3) {
    var free = lv2pool.filter(function(s){ return !strutture.some(function(x){ return x.nome === s.nome; }); });
    if (free.length) strutture.push({ nome: free[randInt(0, free.length - 1)].nome, cost:250 });
  }

  var pats = [];
  soci.forEach(function(s){ if (!s.isApprendista && s.patente && s.patente !== '—' && pats.indexOf(s.patente) === -1) pats.push(s.patente); });
  var contratti = [];
  DATA.fornitura.forEach(function(f){
    if (contratti.length >= level) return;
    if (pats.indexOf(f.pat) !== -1) contratti.push({ patente:f.pat, cost:f.cost, rendita:f.rent });
  });
  contratti = contratti.slice(0, level);

  var fatturato = 150 + (level - 1) * 50 + contratti.reduce(function(s,c){ return s + c.rendita; }, 0);
  return {
    nome: name, livello: level, stato: 'attiva',
    settore: resp.name, cassa: 30, fatturato: fatturato, fondo: 30,
    soci: soci, strutture: strutture, contratti: contratti,
    transazioni: [], sanzioni: [], note: '', notes: ''
  };
}// ── Verifica automatica dei requisiti di Livello ──
function gRequisiti(d) {
  var lv = Math.min(d.livello || 1, 3);
  var soci = d.soci || [];
  var nApp = soci.filter(function(s){ return s.isApprendista; }).length;
  var resp = soci.filter(function(s){ return s.ruolo === 'Responsabile'; })[0];
  var contr = (d.contratti || []).length;
  var maxApp = (resp && resp.patente === 'P.O.E.') ? 3 : 1;
  var checks = [];
  function add(cond, msg, warnOnly) { checks.push({ ok: !!cond, msg: msg, warn: !!warnOnly }); }

  add(soci.length >= 2, 'Almeno 2 soci all\u0027atto di fondazione.');
  add(!!resp, 'Serve un Responsabile (★) con la patente minima del Livello.');
  add(soci.some(function(s){ return s.ruolo === 'Mastro Artigiano'; }), 'Serve almeno un Mastro Artigiano (♦).');
  add(soci.some(function(s){ return !s.isApprendista && s.patente && s.patente !== '—'; }), 'Almeno un socio non-apprendista con una Patente valida.');
  add((d.strutture || []).some(function(s){ return s.nome === 'Magazzino'; }), 'Sede minima: Magazzino (150 Mo).');
  if (lv >= 2) {
    add((d.strutture || []).some(function(s){ return isLv2Struttura(s.nome); }), 'Officina: serve una struttura LV2 (250 Mo).');
    add(soci.some(function(s){ return s.patente === 'P.M.T.'; }), 'Officina: almeno un socio con P.M.T.');
  }
  if (lv >= 3) {
    add(soci.length >= 4, 'Corporazione: minimo 4 soci.');
    add(!!(resp && resp.patente === 'P.O.E.'), 'Corporazione: il Responsabile deve avere la P.O.E.');
  }
  add(contr <= lv, 'Contratti attivi ≤ Livello (max ' + lv + ').');
  add(nApp <= maxApp, 'Massimo ' + maxApp + ' apprendista/i in organico (la P.O.E. ne consente 3).');
  return { list: checks, ok: checks.filter(function(c){ return !c.ok && !c.warn; }).length === 0 };
}

function gRequisitiHtml(d) {
  var r = gRequisiti(d);
  var sospeso = d.stato === 'sospesa' || d.stato === 'sanzione';
  var html = '<div class="rule-box" style="margin-top:8px">';
  r.list.forEach(function(c) {
    var mark = c.ok ? '<span style="color:var(--green2)">✓</span>' : (c.warn ? '<span style="color:var(--amber)">⚠</span>' : '<span style="color:var(--red2)">✕</span>');
    html += '<div style="padding:2px 0;font-size:.85rem;color:var(--text2)">' + mark + ' ' + c.msg + '</div>';
  });
  html += '</div>';
  html += r.ok
    ? '<div class="note-box" style="margin-top:10px">✅ Requisiti del Livello ' + (d.livello || 1) + ' <strong>soddisfatti</strong> — la società può operare ' + (sospeso ? 'ma è ' + statoBadge(d.stato) + '.' : 'regolarmente.') + '</div>'
    : '<div class="note-box" style="margin-top:10px;border-color:rgba(192,64,64,.4)">⚠ Requisiti <strong>non completi</strong>: non puoi superare il Livello ' + (d.livello || 1) + ' finché non li soddisfi (e attenzione all\u0027ispezione U.R.V.).</div>';
  return html;
}

// ── Percorso di crescita (costi verso i livelli superiori) ──
function gPathHtml(d) {
  var lv = Math.min(d.livello || 1, 3);
  var have = {};
  (d.soci || []).forEach(function(s){ if (!s.isApprendista && s.patente && s.patente !== '—') have[s.patente] = true; });
  var html = '';
  for (var L = lv + 1; L <= 3; L++) {
    var fee = 0, parts = [];
    for (var i = lv; i < L; i++) { fee += DATA.livelli[i].fee; parts.push(DATA.livelli[i].fee + ' (L' + (i + 1) + ')'); }
    var tot = fee, notes = ['Tasse: ' + parts.join(' + ') + ' = ' + fee + ' Mo'];
    if (L >= 3) { tot += DATA.fondi.deposit; notes.push('Cauzione L3 ' + DATA.fondi.deposit + ' Mo (restituita)'); }
    var pats = [];
    for (var j = lv; j < L; j++) {
      var pt = DATA.livelli[j].patente;
      if (!have[pt]) { pats.push(pt + ' ' + patTotale(pt) + ' Mo'); tot += patTotale(pt); }
    }
    if (pats.length) notes.push('Patenti da acquisire: ' + pats.join(', '));
    if (L === 2 && !(d.strutture || []).some(function(s){ return isLv2Struttura(s.nome); })) { tot += 250; notes.push('Struttura LV2 250 Mo'); }
    html += '<div class="calc-row"><span class="label">→ L' + L + ' — ' + DATA.livelli[L - 1].name + '</span><span class="value">' + tot + ' Mo</span></div>';
    html += '<div class="calc-row" style="border-bottom:none;font-size:.74rem;color:var(--text3)"><span class="label">' + notes.join(' · ') + '</span><span class="value"></span></div>';
    for (var k = lv; k < L; k++) have[DATA.livelli[k].patente] = true;
  }
  if (!html) html = '<p style="color:var(--text3);font-size:.82rem">Sei già al livello massimo (Corporazione).</p>';
  return html;
}

// ── Situazione economica (tassa 1%, apprendisti, riserva 10%) ──
function gFinanzeHtml(d) {
  var st = impresaStats(d);
  var appPG = (d.soci || []).filter(function(s){ return s.isApprendista && s.tipo === 'PG'; }).length;
  var appNPC = (d.soci || []).filter(function(s){ return s.isApprendista && s.tipo !== 'PG'; }).length;
  var html = '<div class="calc-row"><span class="label">Vendite dirette (fatturato mensile)</span><span class="value">+' + (d.fatturato || 0) + ' Mo/mese</span></div>';
  html += '<div class="calc-row"><span class="label">Rendita contratti fornitura</span><span class="value">' + (st.sospeso ? '<span style="color:var(--red2)">SOSPESA</span>' : '+' + st.rendita) + ' Mo/mese</span></div>';
  html += '<div class="calc-row"><span class="label">Lordo mensile (fatturato complessivo)</span><span class="value">' + st.lordo + ' Mo</span></div>';
  html += '<div class="calc-row"><span class="label">Tassa Camera (1% lordo)</span><span class="value" style="color:var(--red2)">-' + st.tassa + ' Mo</span></div>';
  html += '<div class="calc-row"><span class="label">Apprendisti (PG ' + appPG + ' × 20 · NPC ' + appNPC + ' × 8)</span><span class="value" style="color:var(--red2)">-' + (appPG * 20 + appNPC * 8) + ' Mo</span></div>';
  html += '<div class="calc-row"><span class="label">Fondo di Riserva (10% netto)</span><span class="value" style="color:var(--red2)">-' + st.riserva + ' Mo</span></div>';
  html += '<div class="calc-row total"><span class="label">Utile Netto Stimato</span><span class="value">' + st.netto + ' Mo/mese</span></div>';
  if (st.sospeso) html += '<div class="note-box" style="margin-top:10px">⚠ <strong>Sospensione attiva:</strong> rendita contratti e affitti azzerata fino a regolarizzazione.</div>';
  if ((d.livello || 1) >= 3) html += '<div class="note-box" style="margin-top:10px">🏛 <strong>Corporazione:</strong> cauzione di ' + DATA.fondi.deposit + ' Mo versata, restituibile allo scioglimento regolare.</div>';
  return html;
}

// ── TOP: elenco società + azioni ──
function gTopHtml() {
  var store = trackerStore();
  var active = trackerActiveId();
  var html = '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px">'
    + '<button class="btn" onclick="trackerNew({}); gInit()">＋ Nuova Società</button>'
    + '<button class="btn" onclick="trackerNew(gRandomData()); gInit()">🎲 Nuova Casuale</button>'
    + '<button class="btn secondary" onclick="gImportCompany()">📂 Import Società</button>'
    + '<button class="btn secondary" onclick="gExportCompany()">💾 Export Attiva</button>'
    + '<button class="btn secondary" onclick="gExportSheet()">🖨️ Scheda Stampa</button>'
    + '<button class="btn secondary" onclick="trackerRestoreSnapshot()">↩ Snapshot</button>'
    + '<button class="btn secondary" onclick="backupAll()">💾 Backup completo</button>'
    + '<button class="btn secondary" onclick="restoreAll()">📂 Ripristina backup</button>'
    + '</div>';
  if (!store.ordine.length) {
    html += '<p style="color:var(--text3);font-size:.84rem">Nessuna società salvata: creane una nuova o generane una casuale.</p>';
    return html;
  }
  html += '<table><thead><tr><th>Società</th><th>Livello</th><th>Stato</th><th>Soci</th><th>Strutture</th><th>Contratti</th><th>Netto/mese</th><th></th></tr></thead><tbody>';
  store.ordine.forEach(function(id) {
    var t = store.imprese[id] || {};
    var st = impresaStats(t);
    var isAct = id === active;
    var emoji = (t.livello || 1) >= 3 ? ' 🏛' : ((t.livello || 1) === 2 ? ' 🔧' : '');
    html += '<tr' + (isAct ? ' style="background:rgba(201,168,76,.12)"' : '') + '>'
      + '<td><button class="btn secondary small" onclick="gSelect(\'' + id + '\')">' + att(t.nome || 'senza nome') + emoji + '</button>' + (isAct ? ' <span style="color:var(--green2)">●</span>' : '') + '</td>'
      + '<td>L' + (t.livello || 1) + '</td>'
      + '<td>' + statoBadge(t.stato) + '</td>'
      + '<td>' + (t.soci || []).length + '</td>'
      + '<td>' + (t.strutture || []).length + '</td>'
      + '<td>' + (t.contratti || []).length + '/' + (t.livello || 1) + '</td>'
      + '<td>' + (t.nome ? st.netto + ' Mo' : '—') + '</td>'
      + '<td>' + (isAct ? '' : '<button class="btn danger small" onclick="trackerDelete(\'' + id + '\')">🗑</button>') + '</td>'
      + '</tr>';
  });
  html += '</tbody></table>';
  return html;
}
function gSelect(id) {
  var store = trackerStore();
  if (store.imprese[id]) { setTrackerActiveId(id); gInit(); }
}

// ── Scheda attiva ──
function gSchedaHtml(d) {
  var lvOpts = '';
  for (var l = 1; l <= 3; l++) lvOpts += '<option value="' + l + '" ' + (l === (d.livello || 1) ? 'selected' : '') + '>L' + l + ' — ' + DATA.livelli[l - 1].name + '</option>';
  var statoOpts = [['attiva','Attiva'],['sospesa','Sospesa'],['sanzione','In sanzione'],['sciolta','Sciolta']]
    .map(function(o){ return '<option value="' + o[0] + '" ' + (d.stato === o[0] ? 'selected' : '') + '>' + o[1] + '</option>'; }).join('');
  var mest = [];
  GEN_MESTIERI.forEach(function(m){ if (mest.indexOf(m.name) === -1) mest.push(m.name); });
  var settore = '<select id="gSettore" onchange="gSave()"><option value="">— Scegli settore —</option>'
    + mest.map(function(m){ return '<option' + (d.settore === m ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select>';
  var html = '<div class="calc-section"><h4>🏷 Anagrafica</h4><div class="calc-grid">'
    + '<div class="calc-field"><label>Nome Società</label><input type="text" id="gNome" value="' + att(d.nome) + '" onchange="gSave()"></div>'
    + '<div class="calc-field"><label>Livello</label><select id="gLivello" onchange="gSave()">' + lvOpts + '</select></div>'
    + '<div class="calc-field"><label>Settore</label>' + settore + '</div>'
    + '<div class="calc-field"><label class="tip" data-tip="Attiva · Sospesa (sanzione Grave) · In sanzione · Sciolta">Stato legale</label><select id="gStato" onchange="gSave()">' + statoOpts + '</select></div>'
    + '<div class="calc-field"><label>Fondo Iniziale (Mo)</label><input type="number" id="gFondo" value="' + (d.fondo || 0) + '" onchange="gSave()"></div>'
    + '<div class="calc-field"><label>Cassa (Mo)</label><input type="number" id="gCassa" value="' + (d.cassa || 0) + '" onchange="gSave()"></div>'
    + '<div class="calc-field"><label>Fatturato mensile (Mo)</label><input type="number" id="gFatt" value="' + (d.fatturato || 0) + '" onchange="gSave()"></div>'
    + '</div></div>';
  html += '<div class="calc-section"><h4>✅ Requisiti del Livello</h4>' + gRequisitiHtml(d) + '</div>';
  html += '<div class="calc-section"><h4>📈 Percorso di crescita</h4>' + gPathHtml(d) + '</div>';
  html += '<div class="calc-section"><h4>💵 Situazione economica</h4>' + gFinanzeHtml(d) + '</div>';
  return html;
}

function gSave() {
  var d = trackerLoad();
  function v(id) { var el = document.getElementById(id); return el ? el.value : undefined; }
  if (document.getElementById('gNome')) d.nome = v('gNome');
  if (document.getElementById('gLivello')) d.livello = parseInt(v('gLivello'), 10);
  if (document.getElementById('gSettore')) d.settore = v('gSettore');
  if (document.getElementById('gStato')) d.stato = v('gStato');
  if (document.getElementById('gFondo')) d.fondo = parseInt(v('gFondo'), 10) || 0;
  if (document.getElementById('gCassa')) d.cassa = parseInt(v('gCassa'), 10) || 0;
  if (document.getElementById('gFatt')) d.fatturato = parseInt(v('gFatt'), 10) || 0;
  if (document.getElementById('gNotes')) d.notes = v('gNotes');
  trackerSave(d);
  gInit();
}

function gestoreShell() {
  return `
  <div class="page-hero gilde">
    <h2>🎛️ Gestore di Società</h2>
    <p>Una sola schermata per fondare, gestire e far crescere le società nel rispetto del Codice di Arcadia: requisiti di Livello verificati in automatico, tasse (1%), riserve (10%), apprendisti, sanzioni, eventi e registro.</p>
  </div>

  <div class="doc-section" id="gTop"></div>
  <div class="doc-section" id="gScheda"></div>
  <div class="doc-section" id="gSoci"></div>
  <div class="doc-section" id="gStrutt"></div>
  <div class="doc-section" id="gContr"></div>
  <div class="doc-section" id="gTrans"></div>
  <div class="doc-section" id="gSan"></div>
  <div class="doc-section" id="gEv"></div>
  <div class="doc-section" id="gNote"></div>`;
}

function gInit() {
  if (!document.getElementById('gTop')) return;
  var d = trackerLoad();
  document.getElementById('gTop').innerHTML = gTopHtml();
  document.getElementById('gScheda').innerHTML = gSchedaHtml(d);
  document.getElementById('gSoci').innerHTML = gSociHtml(d);
  document.getElementById('gStrutt').innerHTML = gStruttHtml(d);
  document.getElementById('gContr').innerHTML = gContrHtml(d);
  document.getElementById('gTrans').innerHTML = gTransHtml(d);
  document.getElementById('gSan').innerHTML = gSanHtml(d);
  document.getElementById('gEv').innerHTML = gEvHtml(d);
  document.getElementById('gNote').innerHTML = gNoteHtml(d);
  if (typeof setupTableSort === 'function') setupTableSort();
}// ── SOCI ──
var RUOLI = ['Responsabile', 'Mastro Artigiano', 'Socio', 'Apprendista'];

function gSociHtml(d) {
  var soci = d.soci || [];
  var html = '<h4>👥 Soci e dipendenti <span class="small" style="color:var(--text3)">(' + soci.length + ' in organico)</span></h4>';
  var maxApp = (soci.some(function(s){ return s.ruolo === 'Responsabile'; }) && soci.filter(function(s){ return s.ruolo === 'Responsabile'; })[0].patente === 'P.O.E.') ? 3 : 1;
  var nApp = soci.filter(function(s){ return s.isApprendista; }).length;
  var addForm = '<div class="add-row"><input type="text" id="sNome" placeholder="Nome socio" value="">'
    + '<select id="sMestiere">' + GEN_MESTIERI.map(function(m){ return '<option>' + m.name + '</option>'; }).join('') + '</select>'
    + '<select id="sPatente" onchange="sSyncPat()">' + DATA.patenti.map(function(p){ return '<option value="' + p.sigla + '">' + p.sigla + '</option>'; }).join('') + '<option value="—">—</option></select>'
    + '<select id="sRuolo">' + RUOLI.map(function(r){ return '<option>' + r + '</option>'; }).join('') + '</select>'
    + '<select id="sTipo"><option>PG</option><option>NPC</option></select>'
    + '<label class="chk"><input type="checkbox" id="sApp"> Apprendista</label>'
    + '<button class="btn" onclick="gAddSocio()">＋ Aggiungi</button></div>';
  if (nApp >= maxApp) addForm = '<div class="note-box" style="margin-bottom:8px">⚠ Limite apprendisti raggiunto (' + nApp + '/' + maxApp + '): serve un Responsabile con P.O.E. per averne 3.</div>' + addForm;
  html += addForm;
  if (!soci.length) return html + '<p style="color:var(--text3);font-size:.82rem">Nessun socio: aggiungi almeno un Responsabile, un Mastro Artigiano e altri soci (min 2).</p>';
  html += '<table><thead><tr><th>Nome</th><th>Mestiere</th><th>Patente</th><th>Ruolo</th><th>Tipo</th><th>Cost. Appr.</th><th></th></tr></thead><tbody>';
  soci.forEach(function(s, i) {
    var cost = s.isApprendista ? (s.tipo === 'PG' ? 20 : 8) + ' Mo' : '—';
    html += '<tr>'
      + '<td><input class="cell" value="' + att(s.nome) + '" onchange="gUpdSocio(' + i + ',\'nome\',this.value)"></td>'
      + '<td>' + s.mestiere + '</td>'
      + '<td><select class="cell" onchange="gUpdSocio(' + i + ',\'patente\',this.value)">' + DATA.patenti.map(function(p){ return '<option' + (s.patente === p.sigla ? ' selected' : '') + '>' + p.sigla + '</option>'; }).join('') + '<option' + (!s.patente || s.patente === '—' ? ' selected' : '') + ' value="">—</option></select></td>'
      + '<td><select class="cell" onchange="gUpdSocio(' + i + ',\'ruolo\',this.value)">' + RUOLI.map(function(r){ return '<option' + (s.ruolo === r ? ' selected' : '') + '>' + r + '</option>'; }).join('') + '</select></td>'
      + '<td><select class="cell" onchange="gUpdSocio(' + i + ',\'tipo\',this.value)"><option' + (s.tipo !== 'NPC' ? ' selected' : '') + '>PG</option><option' + (s.tipo === 'NPC' ? ' selected' : '') + '>NPC</option></select></td>'
      + '<td>' + cost + '</td>'
      + '<td><button class="btn danger small" onclick="gDelSocio(' + i + ')">✕</button></td>'
      + '</tr>';
  });
  html += '</tbody></table>';
  return html;
}
function sSyncPat() {
  var sel = document.getElementById('sMestiere');
  var patSel = document.getElementById('sPatente');
  var m = GEN_MESTIERI.filter(function(x){ return x.name === sel.value; })[0];
  if (m) patSel.value = m.pat;
}
function gAddSocio() {
  var d = trackerLoad();
  var mest = document.getElementById('sMestiere').value;
  var m = GEN_MESTIERI.filter(function(x){ return x.name === mest; })[0];
  var pat = document.getElementById('sPatente').value;
  if (!m) { pat = '—'; }
  d.soci.push({
    nome: document.getElementById('sNome').value || 'Nuovo socio',
    mestiere: mest,
    patente: pat,
    ruolo: document.getElementById('sRuolo').value,
    tipo: document.getElementById('sTipo').value,
    isApprendista: !!document.getElementById('sApp').checked
  });
  trackerSave(d); gInit();
}
function gUpdSocio(i, field, value) {
  var d = trackerLoad();
  if (d.soci[i]) { d.soci[i][field] = value; trackerSave(d); gInit(); }
}
function gDelSocio(i) {
  var d = trackerLoad();
  if (d.soci[i]) {
    d.soci.splice(i, 1);
    if (d.soci.length === 0) d.soci = [];
    trackerSave(d); gInit();
  }
}

// ── STRUTTURE ──
function gStruttHtml(d) {
  var strutt = d.strutture || [];
  var opts = DATA.strutture.map(function(s) {
    return '<option value="' + s.nome + '">' + s.nome + ' · ' + s.cost + ' Mo' + (s.lv === 2 ? ' (LV2)' : '') + '</option>';
  }).join('');
  var html = '<h4>🏗 Strutture e sedi <span class="small" style="color:var(--text3)">(' + strutt.length + ')</span></h4>';
  html += '<div class="add-row"><select id="tNome">' + opts + '</select>'
    + '<button class="btn" onclick="gAddStrutt()">＋ Acquista</button></div>';
  if (!strutt.length) return html + '<p style="color:var(--text3);font-size:.82rem">Nessuna struttura: ogni società deve partire dal Magazzino (150 Mo).</p>';
  html += '<table><thead><tr><th>Struttura</th><th>Costo</th><th>Tipo</th><th></th></tr></thead><tbody>';
  var totCost = 0;
  strutt.forEach(function(s, i) {
    var lv2 = isLv2Struttura(s.nome);
    var info = DATA.strutture.filter(function(x){ return x.nome === s.nome; })[0];
    totCost += s.cost || (info ? info.cost : 0);
    html += '<tr><td>' + att(s.nome) + (lv2 ? ' <span class="lv2-tag">LV2</span>' : '') + '</td>'
      + '<td>' + (s.cost || (info ? info.cost : '—')) + ' Mo</td>'
      + '<td>' + (info ? (info.desc || (lv2 ? 'Officina' : 'Base')) : '—') + '</td>'
      + '<td><button class="btn danger small" onclick="gDelStrutt(' + i + ')">✕</button></td></tr>';
  });
  html += '<tr class="total"><td>Totale investito</td><td>' + totCost + ' Mo</td><td></td><td></td></tr>';
  html += '</tbody></table>';
  return html;
}
function gAddStrutt() {
  var d = trackerLoad();
  var n = document.getElementById('tNome').value;
  var info = DATA.strutture.filter(function(x){ return x.nome === n; })[0];
  if (info && d.strutture.some(function(s){ return s.nome === n; })) { alert('Struttura già posseduta.'); return; }
  var cost = info ? info.cost : 0;
  d.cassa = (d.cassa || 0) - cost;
  d.strutture.push({ nome: n, cost: cost });
  d.transazioni.push({ tipo: ('Struttura: ' + n), importo: -cost, data: (new Date()).toISOString().slice(0, 10) });
  trackerSave(d); gInit();
}
function gDelStrutt(i) {
  var d = trackerLoad();
  if (d.strutture[i]) { d.strutture.splice(i, 1); trackerSave(d); gInit(); }
}

// ── CONTRATTI FORNITURA ──
function gContrHtml(d) {
  var contr = d.contratti || [];
  var max = d.livello || 1;
  var soci = d.soci || [];
  var opts = DATA.fornitura.map(function(f) {
    var has = soci.some(function(s){ return s.patente === f.pat; });
    return '<option value="' + f.pat + '|' + f.cost + '|' + f.rent + '"' + (has ? '' : ' disabled') + '>' + f.name + ' · ' + f.cost + ' Mo · ' + f.rent + ' Mo/ges</option>';
  }).join('');
  var html = '<h4>📜 Contratti di Fornitura <span class="small" style="color:var(--text3)">(' + contr.length + '/' + max + ' — max pari al Livello)</span></h4>';
  var can = contr.length < max;
  html += '<div class="add-row"><select id="cSel">' + opts + '</select>'
    + '<button class="btn" onclick="gAddContratto()" ' + (can ? '' : 'disabled') + '>＋ Stipula</button></div>';
  if (!can) html += '<div class="note-box" style="margin-top:8px">⚠ Hai raggiunto il limite di contratti pari al Livello (' + max + '). Aumenta il Livello per stipularne altri.</div>';
  if (!contr.length) return html + '<p style="color:var(--text3);font-size:.82rem">Nessun contratto attivo con la Camera del Commercio.</p>';
  html += '<table><thead><tr><th>Contratto</th><th>Patente</th><th>Costo stipula</th><th>Rendita</th><th></th></tr></thead><tbody>';
  contr.forEach(function(c, i) {
    html += '<tr><td>' + att(c.name || c.patente) + '</td><td>' + (c.patente || '') + '</td>'
      + '<td>' + (c.cost || '—') + ' Mo</td><td>+' + (c.rent || 0) + ' Mo/ges</td>'
      + '<td><button class="btn danger small" onclick="gDelContratto(' + i + ')">✕</button></td></tr>';
  });
  html += '</tbody></table>';
  return html;
}
function gAddContratto() {
  var d = trackerLoad();
  var sel = document.getElementById('cSel').value.split('|');
  if (d.contratti.length >= (d.livello || 1)) { alert('Limite contratti raggiunto (pari al Livello).'); return; }
  d.contratti.push({ patente: sel[0], cost: parseInt(sel[1], 10), rendita: parseInt(sel[2], 10), name: DATA.fornitura.filter(function(f){ return f.pat === sel[0]; })[0].name });
  d.cassa = (d.cassa || 0) - parseInt(sel[1], 10);
  d.transazioni.push({ tipo: 'Stipula contratto (' + sel[0] + ')', importo: -parseInt(sel[1], 10), data: (new Date()).toISOString().slice(0, 10) });
  trackerSave(d); gInit();
}
function gDelContratto(i) {
  var d = trackerLoad();
  if (d.contratti[i]) {
    var c = d.contratti[i];
    d.cassa = (d.cassa || 0) + (c.rendita || 0) * 0; // nessun rimborso della stipula
    d.transazioni.push({ tipo: 'Annullo contratto (' + (c.name || c.patente) + ')', importo: 0, data: (new Date()).toISOString().slice(0, 10) });
    d.contratti.splice(i, 1);
    trackerSave(d); gInit();
  }
}// ── REGISTRO TRANSAZIONI ──
function gTransHtml(d) {
  var tx = d.transazioni || [];
  var html = '<h4>📔 Registro Entrate/Uscite <span class="small" style="color:var(--text3)">(cassa: <strong>' + (d.cassa || 0) + ' Mo</strong>)</span></h4>';
  html += '<div class="add-row">'
    + '<input type="text" id="xDesc" placeholder="Descrizione" value="">'
    + '<input type="number" id="xImp" placeholder="Importo (+/-)" value="0">'
    + '<button class="btn primary" onclick="gAddTrans(true)">＋ Entrata</button>'
    + '<button class="btn danger" onclick="gAddTrans(false)">− Uscita</button>'
    + '<button class="btn secondary" onclick="gMese()">🗓 Chiudi mese</button>'
    + '</div>';
  html += '<div class="add-row" style="margin-top:4px">'
    + '<label class="chk"><input type="checkbox" id="xAutoRis" checked onchange="gAutoRisToggle()"> Accantonamento automatico Fondo di Riserva (10%)</label>'
    + '<label class="chk"><input type="checkbox" id="xAutoTassa" checked onchange="gAutoTassaToggle()"> Versamento tassa Camera 1%</label>'
    + '</div>';
  if (!tx.length) return html + '<p style="color:var(--text3);font-size:.82rem">Registro vuoto.</p>';
  html += '<table><thead><tr><th>Data</th><th>Voce</th><th>Importo</th><th>Cassa</th><th></th></tr></thead><tbody>';
  var tot = 0;
  var runs = tx.slice().reverse();
  runs.forEach(function(t, idx) {
    tot += (t.importo || 0);
    html += '<tr><td>' + att(t.data || '—') + '</td><td>' + att(t.tipo) + '</td>'
      + '<td style="color:' + ((t.importo || 0) < 0 ? 'var(--red2)' : 'var(--green2)') + '">' + ((t.importo || 0) > 0 ? '+' : '') + (t.importo || 0) + '</td>'
      + '<td>' + tot + '</td>'
      + '<td><button class="btn danger small" onclick="gDelTrans(' + (tx.length - 1 - idx) + ')">✕</button></td></tr>';
  });
  html += '</tbody></table>';
  return html;
}
function gAddTrans(isEntry) {
  var d = trackerLoad();
  var imp = parseInt(document.getElementById('xImp').value, 10) || 0;
  var desc = document.getElementById('xDesc').value || (isEntry ? 'Entrata' : 'Uscita');
  if (!isEntry) imp = -Math.abs(imp);
  if (imp === 0) { alert('Importo nullo.'); return; }
  d.cassa = (d.cassa || 0) + imp;
  d.transazioni.push({ tipo: desc, importo: imp, data: (new Date()).toISOString().slice(0, 10) });
  trackerSave(d); gInit();
}
function gDelTrans(i) {
  var d = trackerLoad();
  if (d.transazioni[i]) {
    d.cassa = (d.cassa || 0) - (d.transazioni[i].importo || 0);
    d.transazioni.splice(i, 1);
    trackerSave(d); gInit();
  }
}
function gMese() {
  var d = trackerLoad();
  var st = impresaStats(d);
  var res = [];
  if (document.getElementById('xAutoTassa') && document.getElementById('xAutoTassa').checked) {
    d.cassa = (d.cassa || 0) - st.tassa;
    res.push({ tipo: 'Tassa Camera 1%', importo: -st.tassa });
  }
  var appCost = st.apprCost;
  if (appCost) { d.cassa = (d.cassa || 0) - appCost; res.push({ tipo: 'Costi apprendisti', importo: -appCost }); }
  if (document.getElementById('xAutoRis') && document.getElementById('xAutoRis').checked && st.riserva) {
    var f = d.fondo || 0;
    d.fondo = f + st.riserva;
    res.push({ tipo: '→ Fondo di Riserva 10%', importo: -st.riserva });
  }
  if (!st.sospeso) {
    d.cassa = (d.cassa || 0) + st.lordo;
    res.push({ tipo: 'Vendite + contratti', importo: st.lordo });
  }
  res.forEach(function(r) {
    d.transazioni.push({ tipo: r.tipo, importo: r.importo, data: (new Date()).toISOString().slice(0, 10) });
  });
  var tick = 'Mese chiuso: ' + (st.sospeso ? 'cassa bloccata (sospensione) — ' : 'incassati ' + st.lordo + ' Mo');
  alert(tick);
  trackerSave(d); gInit();
}

// ── SANZIONI (meccanica U.R.V.) ──
function gSanHtml(d) {
  var san = d.sanzioni || [];
  var attive = san.filter(function(s){ return s.stato !== 'regolarizzata' && s.stato !== 'decaduta'; });
  var html = '<h4>⚖ Sanzioni e Ispezioni U.R.V.</h4>';
  if (attive.length) {
    html += '<div class="calc-row" style="margin-bottom:6px"><span class="label">Stato vigente</span><span class="value">' + statoBadge(d.stato) + '</span></div>';
  }
  html += '<div class="add-row"><select id="sanSel">'
    + DATA.sanzioni.map(function(s, i){ return '<option value="' + i + '">' + s.name + ' (' + s.multa + ' Mo · ' + (s.sosp && s.sosp !== '—' ? s.sosp : '') + ')</option>'; }).join('')
    + '</select>'
    + '<button class="btn" onclick="gAddSanzione()">＋ Applica sanzione</button>'
    + '</div>';
  if (!san.length) return html + '<p style="color:var(--text3);font-size:.82rem">Nessuna sanzione registrata. Società pulita.</p>';
  html += '<table><thead><tr><th>Sanzione</th><th>Tipo</th><th>Penale</th><th>Stato</th><th></th></tr></thead><tbody>';
  san.forEach(function(s, i) {
    html += '<tr><td>' + att(s.name || s.tipo) + '</td><td>' + att(s.tipo) + '</td><td>' + (s.penal || 0) + ' Mo</td>'
      + '<td>' + att(s.stato) + '</td>'
      + '<td>' + (s.stato === 'attiva' && s.tipo !== 'Gravissima' ? '<button class="btn small" onclick="gRegolarizza(' + i + ')">✔ Paga</button>' : '') + ' <button class="btn danger small" onclick="gDelSanzione(' + i + ')">✕</button></td></tr>';
  });
  html += '</tbody></table>';
  return html;
}
function gAddSanzione() {
  var d = trackerLoad();
  var idx = parseInt(document.getElementById('sanSel').value, 10);
  var s = DATA.sanzioni[idx];
  if (!s) return;
  if (s.tipo === 'Gravissima') {
    if (!confirm('Sanzione GRAVISSIMA: scioglimento della società ' + (d.nome || '') + ', confisca della cassa' + ((d.livello || 1) >= 3 ? ' e della cauzione (300 Mo)' : '') + '. Procedere?')) return;
    d.sanzioni.push({ tipo: s.tipo, name: s.name, penal: s.multa || 0, desc: s.effetto, stato: 'attiva' });
    d.cassa = 0;
    if ((d.livello || 1) >= 3) d.fondo = Math.max(0, (d.fondo || 0) - DATA.fondi.deposit);
    d.stato = 'sciolta';
    trackerSave(d); gInit();
    alert('La società è stata sciolta: cassa confiscata' + ((d.livello || 1) >= 3 ? ', cauzione non restituita.' : '.') + ' Puoi ricostituirla da zero o crearne un\u0027altra.');
    return;
  }
  var dPen = s.multa || 0;
  d.sanzioni.push({ tipo: s.tipo, name: s.name, penal: dPen, desc: s.effetto, stato: 'attiva' });
  if (s.tipo === 'Grave') { d.stato = 'sospesa'; }
  d.cassa = Math.max(0, (d.cassa || 0) - dPen);
  d.transazioni.push({ tipo: 'Penale ' + s.name, importo: -dPen, data: (new Date()).toISOString().slice(0, 10) });
  trackerSave(d); gInit();
}
function gRegolarizza(i) {
  var d = trackerLoad();
  var s = d.sanzioni[i];
  if (!s) return;
  var pay = s.penal || 0;
  d.cassa = Math.max(0, (d.cassa || 0) - pay);
  d.transazioni.push({ tipo: 'Risarcimento ' + (s.name || s.tipo), importo: -pay, data: (new Date()).toISOString().slice(0, 10) });
  s.stato = 'regolarizzata';
  if (d.stato === 'sospesa' || d.stato === 'sanzione') d.stato = 'attiva';
  trackerSave(d); gInit();
}
function gDelSanzione(i) {
  var d = trackerLoad();
  if (d.sanzioni[i]) d.sanzioni.splice(i, 1);
  trackerSave(d); gInit();
}

// ── EVENTI STAGIONALI ──
function gEvHtml(d) {
  var html = '<h4>🎲 Eventi stagionali <span class="small" style="color:var(--text3)">(d20 + 2 per Livello)</span></h4>';
  html += '<div class="add-row"><button class="btn" onclick="gRoll()">🎲 Tira d20 per l\u0027evento</button></div>';
  html += '<p style="color:var(--text3);font-size:.82rem;margin-top:6px">A ogni stagione tira il dado: il risultato indica l\u0027evento che coinvolge la società (tabella nella guida). Molti eventi chiedono una parata o una penale: trascrivi l\u0027esito nel registro.</p>';
  return html;
}
function gRoll() {
  var d = trackerLoad();
  var raw = randInt(1, 20);
  var bonus = 2 * (d.livello || 1);
  var roll = raw + bonus;
  function match(item) {
    var r = item.range;
    if (r === '19+') return roll >= 19;
    var m = r.split('\u2013');
    var min = parseInt(m[0], 10), max = m[1] ? parseInt(m[1], 10) : min;
    return roll >= min && roll <= max;
  }
  var e = DATA.tiriEvento.filter(match)[0] || null;
  var msg = 'd20 + 2×Liv' + (d.livello || 1) + ' = ' + raw + ' + ' + bonus + ' → ' + roll + '\n\n';
  if (e) msg += e.nome + ' (' + e.range + '):\n' + e.effetto;
  else msg += 'Lunga pace: nessun evento degno di nota.';
  alert(msg);
}

// ── NOTE ──
function gNoteHtml(d) {
  return '<h4>📝 Note libere</h4>'
    + '<textarea id="gNotes" rows="4" style="width:100%;resize:vertical" onchange="gSave()">' + att(d.notes || '') + '</textarea>'
    + '<p style="color:var(--text3);font-size:.78rem;margin-top:4px">Memorizza accordi, legami, obiettivi e cronaca della società. Il salvataggio è automatico a ogni uscita dal campo.</p>';
}// ── EXPORT / IMPORT singola società ──
function gExportCompany() {
  var d = trackerLoad();
  if (!d.nome) { alert('Nessuna società attiva da esportare.'); return; }
  downloadJson(d, 'societa_' + d.nome.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '.json');
}
function gImportCompany() {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      try {
        var d = JSON.parse(ev.target.result);
        if (!d || typeof d !== 'object' || !('nome' in d)) { alert('File non valido: serve un oggetto società.'); return; }
        d = Object.assign({}, TRACKER_DEFAULT, d);
        d.sanzioni = Array.isArray(d.sanzioni) ? d.sanzioni : [];
        d.transazioni = Array.isArray(d.transazioni) ? d.transazioni : [];
        var n = (d.nome || 'Importata') + ' (importata)';
        var id = trackerNew(d);
        var store = trackerStore();
        store.imprese[id].nome = n;
        localStorage.setItem(TRACKER_KEY, JSON.stringify(store));
        gInit();
        alert('Società importata come "' + n + '".');
      } catch(err) { alert('File JSON non valido.'); }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ── Scheda stampabile (export HTML) ──
function gExportSheet() {
  var data = trackerLoad();
  if (!data.nome) { alert('Nessuna società attiva: creane una prima di esportare la scheda.'); return; }
  var st = impresaStats(data);
  var statoLabels = { attiva:'Attiva', sospesa:'Sospesa', sanzione:'In sanzione', sciolta:'Sciolta' };
  var printContent = '<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><title>Scheda '+escHtml(data.nome)+'</title><style>body{font-family:Georgia,serif;color:#222;max-width:700px;margin:0 auto;padding:30px;line-height:1.5}h1{font-size:1.6rem;border-bottom:2px solid #333;padding-bottom:6px;margin-bottom:4px}h2{font-size:1rem;color:#555;margin-top:20px;margin-bottom:8px;text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid #ccc;padding-bottom:4px}.meta{color:#888;font-size:.85rem;margin-bottom:20px}table{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:.88rem}th,td{border:1px solid #ccc;padding:6px 10px;text-align:left}th{background:#f5f0e8}.total{font-weight:bold;border-top:2px solid #333}.note{color:#666;font-style:italic;font-size:.82rem;margin-top:20px}.badge{display:inline-block;border:1px solid #999;border-radius:10px;padding:1px 8px;font-size:.8rem}</style></head><body>';
  printContent += '<h1>🎛️ '+escHtml(data.nome)+'</h1>';
  printContent += '<p class="meta">'+DATA.livelli[Math.min((data.livello||1),3)-1].name+' · Livello '+(data.livello||1)+' · Settore: '+escHtml(data.settore||'—')+' · Camera del Commercio di Arcadia<br>Stato legale: <span class="badge">'+(statoLabels[data.stato]||'Attiva')+'</span>'+(st.sospeso?' <span class="badge" style="border-color:#c00;color:#c00">CONTRATTI SOSPESI</span>':'')+'</p>';
  printContent += '<h2>📋 Soci</h2><table><thead><tr><th>Nome</th><th>Mestiere</th><th>Patente</th><th>Ruolo</th><th>Tipo</th></tr></thead><tbody>';
  (data.soci||[]).forEach(function(s) { printContent += '<tr><td>'+escHtml(s.nome)+'</td><td>'+escHtml(s.mestiere)+'</td><td>'+escHtml(s.patente||'—')+'</td><td>'+(s.ruolo||'Socio')+'</td><td>'+(s.tipo||'PG')+'</td></tr>'; });
  if (!(data.soci||[]).length) printContent += '<tr><td colspan="5" style="color:#999">Nessun socio</td></tr>';
  printContent += '</tbody></table>';
  printContent += '<h2>🏗️ Sede</h2><table><thead><tr><th>Struttura</th><th>Costo</th></tr></thead><tbody>';
  (data.strutture||[]).forEach(function(s) { printContent += '<tr><td>'+escHtml(s.nome)+'</td><td>'+s.cost+' Mo</td></tr>'; });
  if (!(data.strutture||[]).length) printContent += '<tr><td colspan="2" style="color:#999">Nessuna struttura</td></tr>';
  printContent += '</tbody></table>';
  printContent += '<h2>💵 Finanziario</h2><table><tr><td>Fondo iniziale</td><td>'+(data.fondo||DATA.fondi.init)+' Mo</td></tr><tr><td>Cassa</td><td><strong>'+(data.cassa||0)+' Mo</strong></td></tr><tr><td>Fatturato mensile</td><td>'+(data.fatturato||0)+' Mo</td></tr><tr><td>Rendita contratti fornitura</td><td>'+(st.sospeso?'<span style="color:#c00">SOSPESA</span>':'+'+st.rendita)+' Mo/mese</td></tr><tr><td>Tassa Camera (1% lordo)</td><td>-'+st.tassa+' Mo</td></tr><tr><td>Costi apprendisti (PG20/NPC8)</td><td>-'+st.apprCost+' Mo</td></tr><tr><td>Fondo di Riserva (10%)</td><td>-'+st.riserva+' Mo</td></tr><tr class="total"><td>Utile Netto Stimato</td><td>'+st.netto+' Mo/mese</td></tr></table>';
  printContent += '<h2>📜 Contratti Attivi</h2><table><thead><tr><th>Patente</th><th>Investimento</th><th>Rendita/mese</th></tr></thead><tbody>';
  (data.contratti||[]).forEach(function(c) { printContent += '<tr><td>'+escHtml(c.patente)+'</td><td>'+(c.cost||'—')+' Mo</td><td>'+(st.sospeso?'<span style="color:#c00">—</span>':'+'+c.rendita+' Mo')+'</td></tr>'; });
  if (!(data.contratti||[]).length) printContent += '<tr><td colspan="3" style="color:#999">Nessun contratto</td></tr>';
  printContent += '</tbody></table>';
  if ((data.sanzioni||[]).length) {
    printContent += '<h2>⚖️ Sanzioni U.R.V.</h2><table><thead><tr><th>Sanzione</th><th>Stato</th></tr></thead><tbody>';
    (data.sanzioni||[]).forEach(function(s) { printContent += '<tr><td>'+escHtml(s.name||s.tipo)+'</td><td>'+escHtml(s.stato)+'</td></tr>'; });
    printContent += '</tbody></table>';
  }
  if ((data.transazioni||[]).length) printContent += '<h2>🧾 Registro</h2><div style="font-size:.85rem">Ultime voci: '+(data.transazioni||[]).slice(-8).reverse().map(function(v){ return escHtml(v.data||'?')+' '+escHtml(v.tipo)+' '+(v.importo>0?'+':'')+v.importo+' Mo'; }).join(' · ')+'</div>';
  if (data.notes) printContent += '<h2>📌 Note</h2><p style="font-size:.88rem">'+escHtml(data.notes)+'</p>';
  printContent += '<p class="note">Documento generato da Società & Licenze di Arcamis · '+new Date().toLocaleDateString('it-IT')+'</p></body></html>';
  var win = window.open('', '_blank');
  win.document.write(printContent);
  win.document.close();
  setTimeout(function() { win.print(); }, 300);
}

// ── Backup completo / ripristino ──
function backupAll() {
  var data = {
    imprese: trackerStore(),
    patenti: loadPatenti(),
    pianificatore: loadPlan(),
    theme: localStorage.getItem('arcamis_theme'),
    versione: 'gestore-v1'
  };
  downloadJson(data, 'arcamis_backup.json');
}
function restoreAll() {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      try {
        var d = JSON.parse(ev.target.result);
        if (d.imprese && d.imprese.imprese) { localStorage.setItem(TRACKER_KEY, JSON.stringify(d.imprese)); }
        if (Array.isArray(d.patenti)) { localStorage.setItem(PATENTI_STORE_KEY, JSON.stringify(d.patenti)); }
        if (Array.isArray(d.pianificatore)) { localStorage.setItem(PLAN_KEY, JSON.stringify(d.pianificatore)); }
        if (d.theme) { localStorage.setItem('arcamis_theme', d.theme); }
        if (typeof applyTheme === 'function') applyTheme();
        gInit();
        alert('Backup ripristinato con successo.');
      } catch(err) { alert('File JSON non valido.'); }
    };
    reader.readAsText(file);
  };
  input.click();
}
function downloadJson(obj, filename) {
  var blob = new Blob([JSON.stringify(obj, null, 2)], { type:'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Pianificatore (legacy, mantenuto per backup) ──
var PLAN_KEY = 'arcamis_pianificatore';
function loadPlan() {
  try { var p = JSON.parse(localStorage.getItem(PLAN_KEY)); return Array.isArray(p) ? p : []; }
  catch(e) { return []; }
}
function savePlan(p) { localStorage.setItem(PLAN_KEY, JSON.stringify(p)); }

// ════════════════════════════════════════════════
//  TRACKER PATENTI (pagina Licenze)
// ════════════════════════════════════════════════
var PATENTI_STORE_KEY = 'arcamis_patenti_store';

function loadPatenti() {
  try {
    var s = JSON.parse(localStorage.getItem(PATENTI_STORE_KEY));
    return Array.isArray(s) ? s : [];
  } catch(e) { return []; }
}
function savePatenti(list) { localStorage.setItem(PATENTI_STORE_KEY, JSON.stringify(list)); }

function openPatentiTracker() {
  var list = loadPatenti();
  var body = '<div class="calc-section"><h4>Patenti Registrate (U.R.V.)</h4>';
  if (!list.length) {
    body += '<p style="color:var(--text3);font-size:.82rem">Nessuna patente registrata. Aggiungi la prima patente di un licenziatario.</p>';
  } else {
    body += '<table><thead><tr><th>Licenziatario</th><th>Patente</th><th>Costo</th><th>Scadenza</th><th>Stato</th><th></th></tr></thead><tbody>';
    body += list.map(function(p, i) {
      var cls = DATA.patenti.filter(function(x) { return x.sigla === p.sigla; })[0];
      var rowCls = cls ? cls.cls : '';
      var stato = p.stato || 'attiva';
      var badge = stato === 'attiva' ? '<span style="color:var(--green2);font-weight:700">Attiva</span>' : (stato === 'scaduta' ? '<span style="color:var(--red2);font-weight:700">Scaduta</span>' : '<span style="color:var(--amber);font-weight:700">' + escHtml(stato) + '</span>');
      body += '<tr class="' + rowCls + '"><td><strong>' + escHtml(p.nome) + '</strong></td><td>' + escHtml(p.sigla) + '</td><td>' + (p.costo || '') + ' Mo</td><td>' + escHtml(p.scadenza || '-') + '</td><td>' + badge + '</td><td><button class="btn secondary" style="padding:4px 8px;font-size:.72rem" onclick="togglePatenteStato(' + i + ')">↺</button> <button class="btn danger" style="padding:4px 8px;font-size:.72rem" onclick="removePatente(' + i + ')">✕</button></td></tr>';
    }).join('');
    body += '</tbody></table>';
  }
  body += '<button class="btn secondary" style="margin-top:8px" onclick="addPatente()">+ Aggiungi Patente</button></div>';
  var footer = '<button class="btn secondary" onclick="patentiExport()">💾 Export JSON</button><button class="btn secondary" onclick="patentiImport()">📂 Import JSON</button><button class="btn" onclick="closeModal()">Chiudi</button>';
  openModal('📊 Tracker Patenti', body, footer);
}
function addPatente() {
  var nome = prompt('Nome del licenziatario:');
  if (!nome) return;
  var sigla = prompt('Patente (P.M.C. / P.M.T. / P.A.S.V. / P.O.E.):');
  if (!sigla) return;
  sigla = sigla.toUpperCase();
  var pd = DATA.patenti.filter(function(x) { return x.sigla === sigla; })[0];
  var costo = pd ? pd.totale : (parseInt(prompt('Costo totale (Mo):')) || 0);
  var scadenza = prompt('Data scadenza (es. 01/2029):') || '-';
  var list = loadPatenti();
  list.push({ nome: nome, sigla: sigla, costo: costo, scadenza: scadenza, stato: 'attiva' });
  savePatenti(list);
  openPatentiTracker();
}
function removePatente(i) {
  var list = loadPatenti();
  if (!list[i]) return;
  if (!confirm('Rimuovere la patente di "' + list[i].nome + '"?')) return;
  list.splice(i, 1);
  savePatenti(list);
  openPatentiTracker();
}
function togglePatenteStato(i) {
  var list = loadPatenti();
  if (!list[i]) return;
  list[i].stato = list[i].stato === 'attiva' ? 'scaduta' : 'attiva';
  savePatenti(list);
  openPatentiTracker();
}
function patentiExport() {
  var list = loadPatenti();
  if (!list.length) { alert('Nessuna patente da esportare.'); return; }
  downloadJson(list, 'patenti_arcamis.json');
}
function patentiImport() {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      try {
        var data = JSON.parse(ev.target.result);
        if (Array.isArray(data)) { savePatenti(data); openPatentiTracker(); }
        else alert('File JSON non valido (attesa una lista).');
      }
      catch(err) { alert('File JSON non valido.'); }
    };
    reader.readAsText(file);
  };
  input.click();
}


// ════════════════════════════════════════════════
//  THEME
// ════════════════════════════════════════════════
var THEME_KEY = 'arcamis_theme';
function applyTheme() {
  var light = localStorage.getItem(THEME_KEY) === 'light';
  document.body.classList.toggle('light', light);
  var btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = light ? '☀️' : '🌙';
}
function toggleTheme() {
  var light = document.body.classList.toggle('light');
  localStorage.setItem(THEME_KEY, light ? 'light' : 'dark');
  applyTheme();
}

function render() {
  renderTabs();
  renderSideNav();
  renderContent();
  syncMobile();
  const btn = document.getElementById('mobileNavBtn');
  if (btn) btn.style.display = 'flex';
}



})();