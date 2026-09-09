/* ════════════════════════════════════
   imprese.js — Imprese & Licenze
   Sezione dedicata del sito Arcamis
   (estratta da imprese-standalone)
   ════════════════════════════════════ */
(function () {
  'use strict';

  /* ── HELPERS ── */
  function $(id) { return document.getElementById('imp-' + id); }
  function escH(s) { return (s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function escA(s) { return escH(s).replace(/'/g, '&#39;'); }
  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  /* ══════════════════════════════════
     STATE
     ══════════════════════════════════ */
  var currentPage = 'gilde';
  var currentSection = 'panoramica';
  var PAGES = ['gilde', 'licenze'];
  var _container = null;

  var NAV = {
    gilde: [
      { id: 'panoramica',  label: '\uD83D\uDCD6 Panoramica' },
      { id: 'livelli',     label: '\uD83C\uDFEA I 3 Livelli' },
      { id: 'procedura',   label: '\uD83D\uDCDC Procedura Passo-Passo' },
      { id: 'entrate',     label: '\uD83D\uDCB0 Entrate' },
      { id: 'riferimenti', label: '\uD83D\uDCDA Riferimenti (Avanzato)' },
      { id: 'gestore',     label: '\uD83C\uDF9B\uFE0F Gestore di Societ\u00e0' },
    ],
    licenze: [
      { id: 'panoramica',  label: '\uD83D\uDCD6 Panoramica' },
      { id: 'vantaggi',    label: '\u2726 Vantaggi' },
      { id: 'quadro',      label: '\uD83D\uDCCB Quadro Patenti' },
      { id: 'pmc',         label: '\uD83D\uDFE2 P.M.C.' },
      { id: 'pmt',         label: '\uD83D\uDD35 P.M.T.' },
      { id: 'pasv',        label: '\uD83D\uDFE0 P.A.S.V.' },
      { id: 'poe',         label: '\uD83D\uDFE1 P.O.E.' },
      { id: 'inchiostri',  label: '\uD83D\uDD8B\uFE0F Inchiostri' },
      { id: 'strumenti',   label: '\uD83D\uDEE0\uFE0F Strumenti Patenti' },
    ],
  };

  /* ══════════════════════════════════
     DATA
     ══════════════════════════════════ */
  var DATA = {
    livelli: [
      { id:1, name:'Bottega', patente:'P.M.C.', patHref:'pmc', fee:75, sumFee:75, deposit:0, motto:'Fondazione: un gruppo di artigiani con una sede e una patente.', structReqs:'una sede (Magazzino 150 Mo)', soci:'2-6 soci \u00B7 almeno 1 con Patente valida', ruoloObb:'un Responsabile + un Mastro Artigiano', beneficio:'Accesso ai mercati comunali <strong>senza commissione</strong> e sconto del 10% sulle materie prime ordinarie.', limite:'Non puoi produrre n\u00E8 vendere <strong>oggetti magici</strong>.' },
      { id:2, name:'Officina', patente:'P.M.T.', patHref:'pmt', fee:100, sumFee:175, deposit:0, motto:'Espansione: pi\u00F9 mestieri, struttura avanzata, lavori militari.', structReqs:'una struttura LV2 (es. Forgia o Laboratorio, 250 Mo)', soci:'tutti i requisiti precedenti', ruoloObb:'almeno 1 socio con P.M.T.', beneficio:'Ottieni il <strong>Timbro Imperiale</strong> (+15% valore percepito) e accesso ai lavori militari e alle armi.', limite:'La produzione di armi in serie va <strong>dichiarata ogni mese</strong> all\u2019U.R.V.' },
      { id:3, name:'Corporazione', patente:'P.O.E.', patHref:'poe', fee:200, sumFee:375, deposit:300, motto:'La vetta: monopolio, seggio al Consiglio, prestigio.', structReqs:'Statuto formale', soci:'minimo 4 soci', ruoloObb:'il Responsabile ha la P.O.E.', beneficio:'<strong>Monopolio di categoria</strong> (le commesse pubbliche del tuo settore vanno prima a te) e un seggio al Consiglio dei Mercanti.', limite:'Ispezione U.R.V. <strong>annuale senza preavviso</strong>; la cauzione viene confiscata solo in caso di sanzione <strong>Gravissima</strong>.' },
    ],
    fondi: { init: 30, deposit: 300 },
    fornitura: [
      { pat:'P.M.C.', cost:45, rent:15 },
      { pat:'P.M.T.', cost:120, rent:40 },
      { pat:'P.A.S.V.', cost:300, rent:100 },
      { pat:'P.O.E.', cost:750, rent:250 },
    ],
    patenti: [
      { sigla:'P.M.C.',  nome:'Manifattura Comune',          costo:40, cauzione:10, totale:50,  durata:'3 anni', cls:'imp-row-pmc',  col:'var(--imp-common)',    sezione:'pmc',  destinatari:'Osti, Sarti, Falegnami e Artisti' },
      { sigla:'P.M.T.',  nome:'Manifattura Tecnica',         costo:85, cauzione:25, totale:110, durata:'3 anni', cls:'imp-row-pmt',  col:'var(--imp-uncommon)',  sezione:'pmt',  destinatari:'Fabbri, Gioiellieri, Architetti e Cartografi' },
      { sigla:'P.A.S.V.',nome:'Alchimia e Sostanze Vincolate', costo:140,cauzione:40, totale:180, durata:'3 anni', cls:'imp-row-pasv', col:'var(--imp-amber)',     sezione:'pasv', destinatari:'Alchimisti e Artigiani Hextech' },
      { sigla:'P.O.E.',  nome:'Opere Eccezionali',           costo:300,cauzione:100,totale:400, durata:'3 anni', cls:'imp-row-poe',  col:'var(--imp-legendary)', sezione:'poe',  destinatari:'Maestri Artigiani (LV4+)' },
    ],
    strutture: [
      { nome:'Magazzino', lv:1, cost:150, effetto:'Stoccaggio materiali, approvvigionamento pi\u00F9 rapido.' },
      { nome:'Cucina', lv:1, cost:70, effetto:'Permette all\u2019Oste di produrre ricette (4 Mo carbone/sett.).' },
      { nome:'Orto', lv:1, cost:80, effetto:'+15 Mo di erbe/mese (max 2 per sede).' },
      { nome:'Stalla', lv:1, cost:70, effetto:'Fino a 5 animali, consegne pi\u00F9 economiche.' },
      { nome:'Scantinato', lv:1, cost:100, effetto:'Deposito nascosto: capienza extra e meno controlli.' },
      { nome:'Recinzione', lv:1, cost:70, effetto:'Delimita il perimetro, riduce il rischio di furti.' },
      { nome:'Forgia Noxiana', lv:2, cost:250, effetto:'Bonus meccanico di classe per un PG (mestiere metallurgico), 1\u00D7 per Riposo Lungo.' },
      { nome:'Laboratorio', lv:2, cost:250, effetto:'Bonus meccanico di classe per un PG (alchimia/incantesimi), 1\u00D7 per Riposo Lungo.' },
      { nome:'Torre Difensiva', lv:2, cost:250, effetto:'Bonus meccanico di classe per un PG (difesa/guardia), 1\u00D7 per Riposo Lungo.' },
      { nome:'Cucina Professionale', lv:2, cost:250, effetto:'Bonus meccanico di classe per un PG (mestiere culinario), 1\u00D7 per Riposo Lungo.' },
      { nome:'Covo Arcano', lv:2, cost:250, effetto:'Bonus meccanico di classe per un PG (mestiere arcano), 1\u00D7 per Riposo Lungo.' },
      { nome:'Altare del Devoto', lv:2, cost:250, effetto:'Bonus meccanico di classe per un PG (mestiere religioso), 1\u00D7 per Riposo Lungo.' },
      { nome:'Sala della Musica', lv:2, cost:250, effetto:'Bonus meccanico di classe per un PG (mestiere artistico), 1\u00D7 per Riposo Lungo.' },
      { nome:'Stanza degli Esperimenti', lv:2, cost:250, effetto:'Bonus meccanico di classe per un PG (ingegneria/hextech), 1\u00D7 per Riposo Lungo.' },
      { nome:'Campo di Addestramento', lv:2, cost:250, effetto:'Bonus meccanico di classe per un PG (combattimento), 1\u00D7 per Riposo Lungo.' },
      { nome:'Covo del Fuorilegge', lv:2, cost:250, effetto:'Bonus meccanico di classe per un PG (traffici ombra), 1\u00D7 per Riposo Lungo.' },
    ],
    sanzioni: [
      { tipo:'Lieve', name:'Atto Costitutivo o Registro non aggiornato', multa:50, sosp:'\u2014', effetto:'Regolarizzazione entro 15 giorni.', cls:'imp-sanz-lieve' },
      { tipo:'Lieve', name:'Tassa Camera non pagata (primo richiamo)', multa:50, sosp:'\u2014', effetto:'Pagamento arretrati + regolarizzazione entro 15 giorni.', cls:'imp-sanz-lieve' },
      { tipo:'Lieve', name:'Insegna o segnaletica non conforme', multa:50, sosp:'\u2014', effetto:'Sostituzione entro 15 giorni.', cls:'imp-sanz-lieve' },
      { tipo:'Lieve', name:'Apprendista senza contratto di apprendistato', multa:50, sosp:'\u2014', effetto:'Contratto entro 15 giorni.', cls:'imp-sanz-lieve' },
      { tipo:'Lieve', name:'Mancata dichiarazione mensile delle armi (prima volta)', multa:50, sosp:'\u2014', effetto:'Dichiarazione immediata.', cls:'imp-sanz-lieve' },
      { tipo:'Grave', name:'Registro Entrate/Uscite falsificato', multa:200, sosp:'3 mesi', effetto:'Sospensione attivit\u00E0 e controlli.', cls:'imp-sanz-grave' },
      { tipo:'Grave', name:'Dichiarazione armi ripetutamente mancata', multa:200, sosp:'3 mesi', effetto:'Sospensione attivit\u00E0.', cls:'imp-sanz-grave' },
      { tipo:'Grave', name:'Produzione magica fuori dai permessi della patente', multa:200, sosp:'3 mesi', effetto:'Sospensione + verifica requisiti.', cls:'imp-sanz-grave' },
      { tipo:'Grave', name:'Ispezione U.R.V. fallita (requisiti non rispettati)', multa:200, sosp:'3 mesi', effetto:'Sospensione fino a regolarizzazione.', cls:'imp-sanz-grave' },
      { tipo:'Grave', name:'Spionaggio / infiltrazione fallita', multa:200, sosp:'3 mesi', effetto:'Sanzione dello spionaggio illecito.', cls:'imp-sanz-grave' },
      { tipo:'Grave', name:'Corporazione: Fondo di Categoria mancante', multa:200, sosp:'3 mesi', effetto:'Integrazione del fondo + verifica.', cls:'imp-sanz-grave' },
      { tipo:'Gravissima', name:'Contraffazione del Timbro d\u2019Impresa', multa:0, sosp:'Scioglimento', effetto:'Scioglimento coatto + confisca cassa.', cls:'imp-sanz-graviss' },
      { tipo:'Gravissima', name:'Esercizio senza patente valida per la categoria', multa:0, sosp:'Scioglimento', effetto:'Scioglimento coatto + Sigillo Spezzato ai soci.', cls:'imp-sanz-graviss' },
      { tipo:'Gravissima', name:'Corporazione: uso scorretto del Sigillo', multa:0, sosp:'Scioglimento', effetto:'Confisca cauzione (300 Mo) + scioglimento.', cls:'imp-sanz-graviss' },
      { tipo:'Gravissima', name:'Corporazione: abuso del Monopolio (commesse)', multa:0, sosp:'Scioglimento', effetto:'Perdita del monopolio + scioglimento.', cls:'imp-sanz-graviss' },
    ],
    eventi: [
      { nome:'Prima Fiera della Rinascita', stagione:'Primavera', mese:'1\u00B0 mese', effetto:'+15% ai prezzi di vendita per il mese.', entita:15 },
      { nome:'Grande Mercato dei Popoli', stagione:'Primavera', mese:'2\u00B0 mese', effetto:'+20% alle vendite per 1 mese.', entita:20 },
      { nome:'Fiera dei Mestieri', stagione:'Primavera', mese:'3\u00B0 mese', effetto:'Un apprendista gratis per un mese.', entita:0 },
      { nome:'Carovane del Marchesato', stagione:'Estate', mese:'1\u00B0 mese', effetto:'Commesse militari raddoppiate per il mese.', entita:50 },
      { nome:'Carestia degli Anni Grigi', stagione:'Estate', mese:'2\u00B0 mese', effetto:'\u221220% alle vendite di cibo per il mese; +20% prezzi materiali.', entita:-20 },
      { nome:'Dazi Imperiali', stagione:'Estate', mese:'3\u00B0 mese', effetto:'+5% ai costi delle materie prime per il mese.', entita:-5 },
      { nome:'Gloria Arcana', stagione:'Autunno', mese:'1\u00B0 mese', effetto:'+25% alle vendite per 3 mesi.', entita:25 },
      { nome:'Festa del Raccolto', stagione:'Autunno', mese:'2\u00B0 mese', effetto:'+30% alle vendite per 1 mese.', entita:30 },
      { nome:'Assedio alle Frontiere', stagione:'Autunno', mese:'3\u00B0 mese', effetto:'Commesse di difesa triplicate; +5% costi.', entita:0 },
      { nome:'Nevi Interminabili', stagione:'Inverno', mese:'1\u00B0 mese', effetto:'\u221215% alle vendite; consegne pi\u00F9 costose.', entita:-15 },
      { nome:'Notte delle Candele', stagione:'Inverno', mese:'2\u00B0 mese', effetto:'+10% alle vendite artistiche per il mese.', entita:10 },
      { nome:'Rinascita del Regno', stagione:'Inverno', mese:'3\u00B0 mese', effetto:'Fine anno: +1 tasso di Prestigio o tassa esente.', entita:10 },
    ],
    tiriEvento: [
      { range:'1',    nome:'Catastrofe', effetto:'Un focolaio colpisce l\u2019Impresa: \u221225% fatturato; possibile sanzione Lieve se non segnali.' },
      { range:'2\u20134',  nome:'Momento difficile', effetto:'Malopera o rottura: \u221210% fatturato per il mese.' },
      { range:'5\u20139',  nome:'Nulla di notevole', effetto:'Il mese scorre normale.' },
      { range:'10\u201314',nome:'Occasione', effetto:'Una commessa in pi\u00F9: +10% fatturato.' },
      { range:'15\u201318',nome:'Buona stella', effetto:'+20% alle vendite per il mese.' },
      { range:'19+',  nome:'Evento leggendario', effetto:'Scelta tra +40% fatturato o un rapporto autorevole al Consiglio (Prestigio).' },
    ],
    conflitti: { dichiarazione: 10, escalation: 50, mediazione: 25, durataMax: 6, perditaPct: 10 },
    sponsaggio: [
      { livello:'Ricerca di mercato (lecita)', dt:'1 DT', costo:'\u2014', cd:'\u2014', san:'Lecita' },
      { livello:'Contatto informatore', dt:'2 DT + 20 Mo', costo:'20 Mo', cd:'\u2014', san:'Lieve se scoperto' },
      { livello:'Infiltrazione illegale', dt:'4 DT', costo:'\u2014', cd:'15', san:'Grave se fallita' },
    ],
  };

  var TIP_SIGLE = {
    'P.M.C.':'Manifattura Comune',
    'P.M.T.':'Manifattura Tecnica',
    'P.A.S.V.':'Alchimia e Sostanze Vincolate',
    'P.O.E.':'Opere Eccezionali',
    'U.R.V.':'Ufficio del Registro e della Vigilanza',
    'Mo':'Monete d\u2019oro: la valuta del Codice',
    'DT':'Downtime: tempo libero tra le avventure',
  };

  /* ── ABBREVIATIONS / PATENTE BUTTONS ── */
  function abbr(s) {
    var m = TIP_SIGLE[s];
    return m ? '<span class="imp-tip" data-imp-tip="'+escA(m)+'">'+s+'</span>' : s;
  }
  function patBtn(sigla) {
    var p = DATA.patenti.filter(function(x){ return x.sigla === sigla; })[0];
    if (!p) return abbr(sigla);
    return '<button class="imp-patente-badge '+p.cls+'" data-imp-tip="Vai alla Patente '+escA(sigla)+'" data-imp-goto="licenze,'+p.sezione+'">'+sigla+'</button>';
  }
  function patLink(sigla) {
    var p = DATA.patenti.filter(function(x){ return x.sigla === sigla; })[0];
    if (!p) return abbr(sigla);
    return '<button class="imp-pat-link imp-tip" data-imp-tip="Vai alla Patente '+escA(sigla)+'" data-imp-goto="licenze,'+p.sezione+'">'+sigla+'</button>';
  }
  function dataCls(sigla) {
    var p = DATA.patenti.filter(function(x){ return x.sigla === sigla; })[0];
    return p ? p.cls : 'imp-row-app';
  }
  function patTotale(sigla) {
    var p = DATA.patenti.filter(function(x){ return x.sigla === sigla; })[0];
    return p ? p.totale : 0;
  }
  function isLv2Struttura(nome) {
    return DATA.strutture.some(function(s){ return s.nome === nome && s.lv === 2; });
  }
  function statoBadge(stato) {
    var map = { attiva:['Attiva','imp-stato-attiva'], sospesa:['Sospesa','imp-stato-sospesa'], sanzione:['In sanzione','imp-stato-sanzione'], sciolta:['Sciolta','imp-stato-sciolta'] };
    var m = map[stato] || map.attiva;
    return '<span class="imp-stato-badge ' + m[1] + '">' + m[0] + '</span>';
  }

  function sectionTitle(icon, label) {
    return '<div class="imp-doc-section-title">' + icon + ' ' + label + '</div>';
  }
  function tableWrap(inner) { return '<div class="imp-table-wrap">' + inner + '</div>'; }

  /* ── NAVIGATION ── */
  function gotoImp(pg, sec) {
    if (PAGES.indexOf(pg) === -1) pg = 'gilde';
    currentPage = pg;
    currentSection = sec || 'panoramica';
    closeModal();
    closeDrawer();
    render();
    if (_container) _container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ══════════════════════════════════
     MOBILE
     ══════════════════════════════════ */
  function openDrawer() { var d = $('mobileDrawer'); var o = $('drawerOverlay'); if(d) d.classList.add('open'); if(o) o.classList.add('open'); }
  function closeDrawer() { var d = $('mobileDrawer'); var o = $('drawerOverlay'); if(d) d.classList.remove('open'); if(o) o.classList.remove('open'); }
  function syncMobile() { var d = $('mobileDrawerNav'); var s = $('sidenav'); if (d && s) d.innerHTML = s.innerHTML; }

  /* ══════════════════════════════════
     MODAL
     ══════════════════════════════════ */
  function openModal(title, bodyHtml, footerHtml) {
    var t = $('modalTitle'), b = $('modalBody'), f = $('modalFooter'), o = $('modalOverlay');
    if(t) t.textContent = title;
    if(b) b.innerHTML = bodyHtml;
    if(f) f.innerHTML = footerHtml || '<button class="imp-btn secondary" data-imp-action="closeModal">Chiudi</button>';
    if(o) o.classList.add('open');
  }
  function closeModal() { var o = $('modalOverlay'); if(o) o.classList.remove('open'); }

  /* ══════════════════════════════════
     STATS IMPRESA
     ══════════════════════════════════ */
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

  /* ══════════════════════════════════
     RENDER GILDE
     ══════════════════════════════════ */
  var RENDER_GILDE = {};

  RENDER_GILDE.panoramica = function() {
    return ''
    + '<div class="imp-section-hero">'
    + '<h2>Le Imprese di Arcadia<small>Camera del Commercio e dei Mestieri \u2014 Regno di Arcadia</small></h2>'
    + '<p><strong style="color:var(--imp-gold)">Che cos\u00E8 un\u2019Impresa?</strong> \u00C8 un gruppo di <strong>2 o pi\u00F9 personaggi</strong> che si mettono insieme per produrre e vendere i propri mestieri, con una sede fisica e una cassa comune. Tutto qui.</p>'
    + '<p style="margin-top:8px">Un\u2019Impresa nasce come una piccola <strong style="color:var(--imp-gold)">Bottega</strong> e cresce fino a diventare una potente <strong style="color:var(--imp-gold)">Corporazione</strong>. Ogni passaggio \u00E8 semplice: <em>paghi una tassa, allarghi la sede, ottieni un nuovo beneficio</em>.</p>'
    + '<div class="imp-hero-links">'
    + DATA.patenti.map(function(p){ return '<button class="imp-hero-link-btn" data-imp-goto="licenze,'+p.sezione+'">'+p.sigla+' \u00B7 '+p.nome+'</button>'; }).join('')
    + '</div></div>'

    + '<div class="imp-doc-section">'
    + sectionTitle('\uD83D\uDCCB', 'Come Creare un\u2019Impresa')
    + '<div class="imp-rule-box" style="margin-bottom:16px"><h4>\uD83C\uDFE6 Dove si fa la pratica</h4><p>I personaggi interessati devono recarsi <strong>al Castello</strong> e parlare con il <strong>Reparto Finanze</strong>. \u00C8 l\u2019unico ufficio che rilascia le licenze di esercizio e registra le nuove Imprese nel Libro delle Corporazioni.</p></div>'

    + '<div class="imp-rules-grid">'
    + '<div class="imp-rule-box"><h4>\uD83D\uDC65 Requisiti minimi (Livello 1 \u2014 Bottega)</h4><ul>'
    + '<li>Almeno <strong>2 personaggi</strong> (il responsabile e almeno un socio)</li>'
    + '<li>Un <strong>Responsabile</strong> con la patente <strong>'+patLink('P.M.C.')+'</strong></li>'
    + '<li>Un <strong>Mastro Artigiano</strong> (\u2666) in organico</li>'
    + '<li>Almeno un socio non-apprendista con una <strong>Patente valida</strong></li>'
    + '<li>Una <strong>sede fisica</strong>: Magazzino (150 Mo)</li>'
    + '</ul></div>'

    + '<div class="imp-rule-box"><h4>\uD83D\uDCB0 Costi di fondazione</h4><ul>'
    + '<li><strong>Tassa di registrazione</strong>: '+DATA.livelli[0].fee+' Mo</li>'
    + '<li><strong>Magazzino</strong> (sede obbligatoria): 150 Mo</li>'
    + '<li><strong>Fondo iniziale</strong> per la cassa comune: '+DATA.fondi.init+' Mo</li>'
    + '<li style="color:var(--imp-amber)">Totale minimo: '+(DATA.livelli[0].fee + 150 + DATA.fondi.init)+' Mo da investire subito</li>'
    + '</ul></div>'

    + '<div class="imp-rule-box"><h4>\uD83D\uDCDD Cosa portare al Castello</h4><ul>'
    + '<li>I <strong>personaggi</strong> presenti con le loro patenti</li>'
    + '<li>La <strong>lista dei soci</strong> con nome, mestiere, ruolo e patente</li>'
    + '<li>Il <strong>fondo comune</strong> in Mo (cassa + investimenti)</li>'
    + '<li>La <strong>scelta del settore</strong> (mestiere principale dell\u2019Impresa)</li>'
    + '</ul></div>'

    + '<div class="imp-rule-box"><h4>\u26A0\uFE0F Note importanti</h4><ul>'
    + '<li>La <strong>tassa si paga una volta</strong> al momento della fondazione</li>'
    + '<li>Il <strong>Fondo Iniziale</strong> (30 Mo) \u00E8 separato dalla cassa</li>'
    + '<li>Gli <strong>apprendisti</strong> costano 8 Mo/NPC o 20 Mo/PG al mese</li>'
    + '<li>La <strong>tassa Camera</strong> \u00E8 dell\u20191% sul fatturato lordo mensile</li>'
    + '</ul></div></div>'

    + '<div class="imp-note-box" style="margin-top:16px">\uD83D\uDCA1 <strong>Suggerimento:</strong> usa il <strong>Gestore di Societ\u00E0</strong> per simulare la creazione e verificare che tutti i requisiti siano soddisfatti prima di andare al Castello.</div>'
    + '</div>'

    + '<div class="imp-doc-section">'
    + sectionTitle('\u2696\uFE0F', 'I 3 Livelli in Sintesi')
    + '<div class="imp-note-box" style="margin-bottom:18px">\uD83D\uDCA1 <strong>Regola d\u2019oro:</strong> sali di livello quando hai soddisfatto i requisiti e paghi la tassa.</div>'
    + tableWrap('<table class="imp-tbl"><thead><tr><th>Livello</th><th>Nome</th><th>Patente legata</th><th>In una frase</th></tr></thead><tbody>'
    + '<tr class="imp-row-pmc"><td>1</td><td>Bottega</td><td>'+patLink('P.M.C.')+'</td><td>Fondazione: un gruppo di artigiani con una sede e una patente.</td></tr>'
    + '<tr class="imp-row-pmt"><td>2</td><td>Officina</td><td>'+patLink('P.M.T.')+'</td><td>Espansione: pi\u00F9 mestieri, struttura avanzata, lavori militari.</td></tr>'
    + '<tr class="imp-row-poe"><td>3</td><td>Corporazione</td><td>'+patLink('P.O.E.')+'</td><td>La vetta: monopolio, seggio al Consiglio, prestigio.</td></tr>'
    + '</tbody></table>')
    + '</div>';
  };

  RENDER_GILDE.livelli = function() {
    var html = '<div class="imp-section-hero"><h2>I 3 Livelli dell\u2019Impresa</h2><p>Ogni Impresa parte dal Livello 1. Ogni Livello d\u00E0 <strong>1 beneficio</strong> e impone <strong>1 limite</strong>.</p></div>';
    DATA.livelli.forEach(function(l){
      html += '<div class="imp-card-type">'
      + '<div class="imp-card-type-header"><h3>Livello '+l.id+' \u2014 '+l.name+'</h3>'+patBtn(l.patente)+'</div>'
      + '<div class="imp-card-type-body"><div class="info-block">'
      + '<p><strong>Costo '+(l.id===1?'di fondazione':('di salita (+'+l.fee+' Mo, totale '+l.sumFee+' Mo)'))+':</strong> '+l.fee+' Mo</p>'
      + '<p><strong>Requisiti:</strong> '+l.soci+' \u00B7 '+l.structReqs+(l.id>1?' \u00B7 '+l.ruoloObb:'')+'</p>'
      + '<h5 style="margin-top:12px">Beneficio</h5><ul class="imp-benefit-list"><li>'+l.beneficio+'</li></ul>'
      + '</div><div class="info-block"><h5>Limite</h5><ul class="imp-limit-list"><li>'+l.limite+'</li></ul></div></div></div>';
    });
    html += '<div class="imp-note-box" style="margin-top:16px">\u26A0 <strong>Le tasse si sommano:</strong> per arrivare alla Corporazione paghi '+DATA.livelli.map(function(l){return l.fee;}).join(' + ')+' = <strong>'+DATA.livelli[2].sumFee+' Mo</strong> di tasse, pi\u00F9 <strong>'+DATA.fondi.deposit+' Mo</strong> di cauzione.</div>';
    return html;
  };

  RENDER_GILDE.procedura = function() {
    return '<div class="imp-section-hero"><h2>Come si fonda e si gestisce</h2><p>Tutto quello che serve per creare e far funzionare un\u2019Impresa, in pochi passi.</p></div>'

    + '<div class="imp-doc-section">' + sectionTitle('\uD83D\uDCDC', 'Passo 1 \u2014 Fondazione')
    + tableWrap('<table class="imp-tbl"><thead><tr><th>Cosa serve</th><th>Costo</th></tr></thead><tbody>'
    + '<tr><td>Tassa di registrazione (Livello 1)</td><td><strong>'+DATA.livelli[0].fee+' Mo</strong></td></tr>'
    + '<tr><td>Sede minima: Magazzino</td><td><strong>150 Mo</strong></td></tr>'
    + '<tr><td>Fondo Iniziale (cassa comune)</td><td><strong>'+DATA.fondi.init+' Mo</strong></td></tr>'
    + '</tbody></table>') + '</div>'

    + '<div class="imp-doc-section">' + sectionTitle('\uD83D\uDCB0', 'Passo 2 \u2014 Gestione semplice')
    + tableWrap('<table class="imp-tbl"><thead><tr><th>Voce</th><th>Regola</th></tr></thead><tbody>'
    + '<tr><td>Registro Entrate/Uscite</td><td>Tienilo aggiornato: l\u2019'+abbr('U.R.V.')+' pu\u00F2 chiederlo.</td></tr>'
    + '<tr><td>Fondo di Riserva</td><td>Accantona il <strong>10%</strong> dei profitti mensili.</td></tr>'
    + '<tr><td>Tassa alla Camera</td><td><strong>1% del fatturato complessivo</strong>, trimestrale (esente i primi 3 mesi).</td></tr>'
    + '<tr><td>Apprendisti</td><td>PG LV1 o NPC assunti. Costi: NPC 8 Mo/mese, PG 20 Mo/mese.</td></tr>'
    + '</tbody></table>') + '</div>'

    + '<div class="imp-doc-section">' + sectionTitle('\uD83C\uDFD7\uFE0F', 'Passo 3 \u2014 Sede e Strutture')
    + tableWrap('<table class="imp-tbl"><thead><tr><th>Struttura</th><th>Liv</th><th style="text-align:right">Costo</th><th>Effetto</th></tr></thead><tbody>'
    + DATA.strutture.map(function(s){ return '<tr class="'+(s.lv===2?'imp-row-pmt':'')+'"><td>'+s.nome+'</td><td>'+s.lv+'</td><td style="text-align:right">'+s.cost+' Mo</td><td>'+s.effetto+'</td></tr>'; }).join('')
    + '</tbody></table>') + '</div>'

    + '<div class="imp-doc-section">' + sectionTitle('\u26A0\uFE0F', 'Passo 4 \u2014 Sanzioni (in breve)')
    + tableWrap('<table class="imp-tbl"><thead><tr><th>Gravit\u00E0</th><th>Sanzione</th></tr></thead><tbody>'
    + '<tr class="imp-sanz-lieve"><td>Lieve</td><td>Multa <strong>50 Mo</strong> + regolarizzazione in 15 giorni.</td></tr>'
    + '<tr class="imp-sanz-grave"><td>Grave</td><td>Multa <strong>200 Mo</strong> + sospensione 3 mesi.</td></tr>'
    + '<tr class="imp-sanz-graviss"><td>Gravissima</td><td>Scioglimento coatto + confisca cassa + Sigillo Spezzato ai soci.</td></tr>'
    + '</tbody></table>') + '</div>';
  };

  RENDER_GILDE.entrate = function() {
    return '<div class="imp-section-hero"><h2>Entrate dell\u2019Impresa</h2><p>Come guadagna un\u2019Impresa, senza regole complicate.</p></div>'

    + '<div class="imp-doc-section">' + sectionTitle('\uD83D\uDCB5', 'Contratti di Fornitura')
    + '<p style="color:var(--imp-text2);font-size:.9rem;margin-bottom:16px;line-height:1.6">Negozi <strong>una volta</strong> e ottieni una rendita <strong>automatica ogni mese</strong>.</p>'
    + tableWrap('<table class="imp-tbl"><thead><tr><th>Patente richiesta</th><th style="text-align:right">Investimento</th><th style="text-align:right">Rendita/mese</th><th style="text-align:right">Rientro</th></tr></thead><tbody>'
    + DATA.fornitura.map(function(f){
      var mesi = Math.ceil(f.cost / f.rent);
      return '<tr class="'+dataCls(f.pat)+'"><td>'+patLink(f.pat)+'</td><td style="text-align:right">'+f.cost+' Mo</td><td style="text-align:right"><strong>'+f.rent+' Mo</strong></td><td style="text-align:right">'+mesi+' mesi</td></tr>';
    }).join('')
    + '</tbody></table>') + '</div>'

    + '<div class="imp-doc-section">' + sectionTitle('\uD83C\uDFE0', 'Affitto di Struttura')
    + '<p style="color:var(--imp-text2);font-size:.9rem;line-height:1.6">Una struttura inutilizzata pu\u00F2 essere affittata: rendita del <strong>5\u201310%</strong> del suo valore, ogni mese.</p></div>'

    + '<div class="imp-doc-section">' + sectionTitle('\uD83D\uDECD\uFE0F', 'Vendita diretta a Bottega')
    + tableWrap('<table class="imp-tbl"><thead><tr><th>Voce</th><th>Regola</th></tr></thead><tbody>'
    + '<tr><td>Margine tipico</td><td><strong>+20\u201340%</strong> sul costo delle materie prime usate.</td></tr>'
    + '<tr><td>In Bottega (sede)</td><td>Senza commissione se l\u2019Impresa ha accesso al mercato comunale.</td></tr>'
    + '<tr><td>Fuori sede</td><td>Al mercato di un\u2019altra citt\u00E0: <strong>10% di commissione</strong>.</td></tr>'
    + '<tr><td>Contratti a termine</td><td>Ordini che richiedono pi\u00F9 Downtime: paga anticipata <strong>50%</strong>, saldo a consegna.</td></tr>'
    + '</tbody></table>') + '</div>'

    + '<div class="imp-doc-section">' + sectionTitle('\uD83D\uDCDD', 'Lavori su Commissione privata')
    + '<p style="color:var(--imp-text2);font-size:.9rem;line-height:1.6">Prezzi orientativi: oggetto comune 1\u201320 Mo, non comune 20\u201380 Mo, raro 80\u2013200 Mo, molto raro 200\u2013500 Mo, leggendario: trattativa. La <strong style="color:var(--imp-gold2)">P.O.E.</strong> pu\u00F2 certificare (+20% valore).</p></div>'

    + '<div class="imp-doc-section">' + sectionTitle('\uD83E\uDDEE', 'Come calcolare il Fatturato mensile')
    + '<div class="imp-rule-box" style="margin-top:8px"><p><strong>Fatturato = Vendite dirette + Rendita Contratti + Affitti</strong></p>'
    + '<p style="margin-top:6px;color:var(--imp-text2)">La <strong>Tassa Camera (1%)</strong> si calcola sul fatturato complessivo. Il <strong>Fondo di Riserva (10%)</strong> si accantona sull\u2019utile netto.</p></div></div>'

    + '<div class="imp-note-box">\u26A0 <strong>Sospensione:</strong> contratti e affitti si sospendono se l\u2019Impresa riceve una sanzione <strong>Grave</strong> o superiore.</div>';
  };

  RENDER_GILDE.riferimenti = function() {
    return '<div class="imp-section-hero"><h2>Riferimenti Avanzati</h2><p>Tutto il resto, per chi vuole approfondire.</p></div>'

    + '<div class="imp-doc-section">' + sectionTitle('\uD83E\uDD1D', 'Alleanze e Joint Venture')
    + '<p style="color:var(--imp-text2);font-size:.9rem;margin-bottom:14px;line-height:1.6"><strong>Alleanza Commerciale</strong> (fino a 3 Imprese): registrazione 20 Mo/impresa, sconto 5% su acquisti congiunti.</p>'
    + '<p style="color:var(--imp-text2);font-size:.9rem;line-height:1.6"><strong>Joint Venture:</strong> progetto condiviso con budget dedicato. Registrazione 30 Mo alla Camera.</p></div>'

    + '<div class="imp-doc-section">' + sectionTitle('\u2694\uFE0F', 'Conflitti e Spionaggio')
    + '<p style="color:var(--imp-text2);font-size:.9rem;margin-bottom:14px;line-height:1.6"><strong>Conflitto Commerciale:</strong> dichiarazione '+DATA.conflitti.dichiarazione+' Mo, poi \u221210% prezzi vendita per 3 mesi. Escalation '+DATA.conflitti.escalation+' Mo/mese, mediazione '+DATA.conflitti.mediazione+' Mo.</p>'
    + tableWrap('<table class="imp-tbl"><thead><tr><th>Mezzo</th><th>Costo/Durata</th><th>CD</th><th>Se scoperti</th></tr></thead><tbody>'
    + DATA.sponsaggio.map(function(s){ return '<tr><td>'+s.livello+'</td><td>'+s.dt+'</td><td>'+s.cd+'</td><td>'+s.san+'</td></tr>'; }).join('')
    + '</tbody></table>') + '</div>'

    + '<div class="imp-doc-section">' + sectionTitle('\uD83C\uDFB2', 'Eventi Stagionali')
    + '<p style="color:var(--imp-text2);font-size:.9rem;margin-bottom:14px;line-height:1.6">Tira <strong>1d20</strong> a inizio mese (+2 per ogni Livello dell\u2019Impresa).</p>'
    + tableWrap('<table class="imp-tbl"><thead><tr><th>Evento</th><th>Stagione</th><th>Effetto</th></tr></thead><tbody>'
    + DATA.eventi.map(function(e){ return '<tr><td>'+e.nome+'</td><td>'+e.stagione+' ('+e.mese+')</td><td>'+e.effetto+'</td></tr>'; }).join('')
    + '</tbody></table>') + '</div>'

    + '<div class="imp-doc-section">' + sectionTitle('\uD83D\uDCDA', 'Glossario Essenziale')
    + tableWrap('<table class="imp-tbl"><thead><tr><th>Termine</th><th>Cosa significa</th></tr></thead><tbody>'
    + '<tr><td><strong>Camera del Commercio</strong></td><td>Dove fondi, registri e fai salire di livello l\u2019Impresa.</td></tr>'
    + '<tr><td><strong>U.R.V.</strong></td><td>Organo di controllo: verifica i requisiti, fa ispezioni.</td></tr>'
    + '<tr><td><strong>Timbro d\u2019Impresa</strong></td><td>Marchio in ottone da apporre su ogni opera venduta.</td></tr>'
    + '<tr><td><strong>Timbro Imperiale</strong></td><td>Sigillo premium (Livello 2) che aumenta del 15% il valore percepito.</td></tr>'
    + '<tr><td><strong>Monopolio</strong></td><td>Privilegio della Corporazione sulle commesse pubbliche del proprio settore.</td></tr>'
    + '<tr><td><strong>Mo</strong></td><td>Monete d\u2019oro: tutta la valuta del Codice.</td></tr>'
    + '<tr><td><strong>DT (Downtime)</strong></td><td>Tempo libero tra le avventure.</td></tr>'
    + '</tbody></table>') + '</div>';
  };

  RENDER_GILDE.gestore = function() { return gestoreShell(); };

  /* ══════════════════════════════════
     RENDER LICENZE
     ══════════════════════════════════ */
  var RENDER_LICENZE = {};

  RENDER_LICENZE.panoramica = function() {
    return '<div class="imp-section-hero"><h2>Codice Patenti di Arcadia<small>Ufficio del Registro e della Vigilanza (U.R.V.) \u2014 Regno di Arcadia</small></h2>'
    + '<p>Ogni licenza ha una <strong style="color:var(--imp-gold)">durata triennale</strong> e il possesso del <strong style="color:var(--imp-gold)">Sigillo di Riconoscimento</strong> garantisce lo status legale dell\u2019artigiano.</p></div>';
  };

  RENDER_LICENZE.vantaggi = function() {
    return '<div class="imp-doc-section">' + sectionTitle('\u2726', 'Vantaggi Generali del Licenziatario')
    + '<div class="imp-card-grid">'
    + [['\uD83D\uDEE1\uFE0F','Protezione Legale','Intervento prioritario della Guardia cittadina in caso di truffe.'],
       ['\uD83D\uDCCB','Accesso ai Grandi Appalti','Solo i licenziatari possono partecipare a commesse statali superiori alle <strong>1.000 Mo</strong>.'],
       ['\u2B50','Prestigio Professionale','Vantaggio alle prove di <strong>Persuasione</strong> legate al proprio mestiere.'],
       ['\uD83C\uDFE5','Assicurazione Statale','Copertura del <strong>30% dei danni</strong> in caso di incidenti documentati.'],
       ['\uD83C\uDFE0','Diritto di Bottega','Esenzione dai controlli arbitrari e diritto di esporre l\u2019insegna ufficiale.']
    ].map(function(x){ return '<div class="imp-card"><h4>'+x[0]+' '+x[1]+'</h4><p>'+x[2]+'</p></div>'; }).join('')
    + '</div></div>';
  };

  RENDER_LICENZE.quadro = function() {
    return '<div class="imp-doc-section">' + sectionTitle('\uD83D\uDCCB', 'Quadro Generale delle Patenti')
    + tableWrap('<table class="imp-tbl"><thead><tr><th>Sigla</th><th>Denominazione</th><th style="text-align:right">Costo (3 anni)</th><th style="text-align:right">Cauzione</th><th style="text-align:right">Totale</th></tr></thead><tbody>'
    + DATA.patenti.map(function(p){ return '<tr class="'+p.cls+'"><td>'+abbr(p.sigla)+'</td><td>'+p.nome+'</td><td style="text-align:right">'+p.costo+' Mo</td><td style="text-align:right">'+p.cauzione+' Mo</td><td style="text-align:right"><strong>'+p.totale+' Mo</strong></td></tr>'; }).join('')
    + '</tbody></table>') + '</div>';
  };

  function renderLicenzaCard(p, headerBg, blocks) {
    return '<div class="imp-licenza-card" style="border-color:'+p.col+'">'
    + '<div class="imp-licenza-header" style="background:'+headerBg+'"><h3 style="color:'+p.col+'">'+p.sigla+' \u2014 '+p.nome+'</h3>'
    + '<p class="imp-lh-meta">Costo: '+p.costo+' Mo \u00B7 Cauzione: '+p.cauzione+' Mo \u00B7 <strong style="color:var(--imp-text2)">Totale: '+p.totale+' Mo</strong> \u00B7 Durata: '+p.durata+'</p>'
    + '<p class="imp-lh-meta" style="margin-top:4px">Ideale per: '+p.destinatari+'.</p></div>'
    + '<div class="imp-licenza-body">' + blocks + '</div>'
    + '<div class="imp-note-box" style="margin:0 24px 20px">Nota: Ci\u00F2 che il licenziatario pu\u00F2 craftare e vendere \u00E8 sempre limitato dal <strong>livello del mestiere</strong> posseduto.</div></div>';
  }

  RENDER_LICENZE.pmc = function() {
    var p = DATA.patenti[0];
    return renderLicenzaCard(p, 'rgba(96,184,64,.07)',
      '<div class="imp-licenza-block"><h5>\u2726 Permessi</h5><ul><li>Vendita di beni comuni (cibo, abiti, mobili, arte non magica).</li><li>Commesse fino a <strong style="color:var(--imp-gold)">500 Mo</strong>.</li></ul></div>'
      + '<div class="imp-licenza-block"><h5>\uD83D\uDCE6 Materiali</h5><ul><li>Acquisto libero di materie prime ordinarie.</li><li>Alcol fino al Grado II.</li></ul></div>'
      + '<div class="imp-licenza-block"><h5>\u26A0 Limiti</h5><ul><li>Divieto assoluto di produrre veleni o sostanze alchemiche pure.</li></ul></div>'
    );
  };

  RENDER_LICENZE.pmt = function() {
    var p = DATA.patenti[1];
    return renderLicenzaCard(p, 'rgba(90,138,216,.07)',
      '<div class="imp-licenza-block"><h5>\u2726 Permessi</h5><ul><li>Produzione di armi, armature pesanti, strutture civili/militari.</li><li>Oggetti magici <strong style="color:var(--imp-gold)">Comuni</strong>.</li><li>Emissione di documenti legali e mappe ufficiali.</li></ul></div>'
      + '<div class="imp-licenza-block"><h5>\uD83D\uDCE6 Materiali</h5><ul><li>Cristalli conduttori (Hextech Grado I).</li><li>Leghe speciali (Acciaio di Noxus, ecc.).</li></ul></div>'
      + '<div class="imp-licenza-block"><h5>\u26A0 Obblighi</h5><ul><li>Responsabilit\u00E0 legale sulla stabilit\u00E0 delle strutture.</li><li>Tracciabilit\u00E0 delle armi da guerra.</li></ul></div>'
    );
  };

  RENDER_LICENZE.pasv = function() {
    var p = DATA.patenti[2];
    return renderLicenzaCard(p, 'rgba(212,149,74,.07)',
      '<div class="imp-licenza-block"><h5>\u2726 Permessi</h5><ul><li>Produzione di pozioni fino a <strong style="color:var(--imp-gold)">Non Comuni</strong>.</li><li>Veleni etichettati e motori Hextech.</li><li><strong style="color:var(--imp-gold)">Unica licenza</strong> che permette l\u2019acquisto di Inchiostri Magici.</li></ul></div>'
      + '<div class="imp-licenza-block"><h5>\uD83D\uDCE6 Materiali</h5><ul><li>Reagenti rari (Sangue di Demone, Ghiandola di Drago).</li><li>Inchiostri fino al Grado III.</li></ul></div>'
      + '<div class="imp-licenza-block"><h5>\u26A0 Rigore</h5><ul><li>Ogni boccetta \u00E8 tracciata tramite il <strong style="color:var(--imp-gold)">Marchio Spettrale</strong>.</li><li>Ogni transazione registrata nel Libretto degli Acquisti.</li></ul></div>'
    );
  };

  RENDER_LICENZE.poe = function() {
    var p = DATA.patenti[3];
    return renderLicenzaCard(p, 'rgba(216,176,32,.07)',
      '<div class="imp-licenza-block"><h5>\u2726 Permessi</h5><ul><li>Accesso alle commesse della Corte e titoli onorifici.</li></ul></div>'
      + '<div class="imp-licenza-block"><h5>\uD83C\uDFC6 Privilegi</h5><ul><li>Diritto di formare fino a <strong style="color:var(--imp-gold)">3 apprendisti</strong>.</li><li>Certificare la qualit\u00E0 delle opere (<strong style="color:var(--imp-gold)">+20% valore di mercato</strong>).</li></ul></div>'
      + '<div class="imp-licenza-block"><h5>\uD83D\uDCE6 Materiali</h5><ul><li>Accesso a materiali speciali su approvazione del Consiglio.</li></ul></div>'
    );
  };

  RENDER_LICENZE.inchiostri = function() {
    return '<div class="imp-doc-section">' + sectionTitle('\uD83D\uDD8B\uFE0F', 'Sezione Tecnica: Materiali Vincolati e Inchiostri')
    + '<p style="color:var(--imp-text2);font-size:.9rem;margin-bottom:16px">L\u2019uso di inchiostri magici \u00E8 strettamente regolamentato. <strong style="color:var(--imp-gold)">Solo la P.A.S.V.</strong> permette l\u2019acquisto di inchiostri magici.</p>'
    + tableWrap('<table class="imp-tbl"><thead><tr><th>Grado Inchiostro</th><th>Patente Richiesta</th><th>Limite (3 anni)</th><th>Uso Tipico</th></tr></thead><tbody>'
    + '<tr class="imp-row-pmc"><td><span class="imp-dot-i" style="background:var(--imp-common)"></span>Grado I</td><td>'+abbr('P.M.C.')+'</td><td>Uso libero entro soglie ordinarie</td><td>Inchiostri comuni, scrittura base, documenti</td></tr>'
    + '<tr class="imp-row-pmt"><td><span class="imp-dot-i" style="background:var(--imp-uncommon)"></span>Grado II</td><td>'+abbr('P.M.T.')+'</td><td>Tracciato nel Libretto degli Acquisti</td><td>Mappe ufficiali, documenti legali sigillati</td></tr>'
    + '<tr class="imp-row-pasv"><td><span class="imp-dot-i" style="background:var(--imp-amber)"></span>Grado III</td><td>'+abbr('P.A.S.V.')+'</td><td>Tracciato con Marchio Spettrale</td><td>Pergamene magiche, Tattoo magici, componenti alchemici</td></tr>'
    + '<tr class="imp-row-poe"><td><span class="imp-dot-i" style="background:var(--imp-legendary)"></span>Grado IV+</td><td>'+abbr('P.O.E.')+' + approvazione U.R.V.</td><td>Approvazione caso per caso</td><td>Manufatti leggendari, opere della Corte</td></tr>'
    + '</tbody></table>') + '</div>'
    + '<div class="imp-note-box">\u26A0 <strong>Marchio Spettrale:</strong> Ogni fiala di inchiostro di Grado III o superiore viene marchiata spettralmente dall\u2019U.R.V.</div>';
  };

  RENDER_LICENZE.strumenti = function() {
    return '<div class="imp-section-hero"><h2>Strumenti per Patenti</h2><p>Calcolatori e tracker per gestire le Patenti.</p></div>'
    + '<div class="imp-doc-section">' + sectionTitle('\uD83E\uDDEA', 'Confronto & Costi Patenti')
    + tableWrap('<table class="imp-tbl"><thead><tr><th>Patente</th><th>Costo (3 anni)</th><th>Cauzione</th><th>Totale</th><th>Durata</th><th>Destinatari</th></tr></thead><tbody>'
    + DATA.patenti.map(function(p){ return '<tr class="'+p.cls+'"><td><strong>'+p.sigla+'</strong> \u2014 '+p.nome+'</td><td>'+p.costo+' Mo</td><td>'+p.cauzione+' Mo</td><td><strong>'+p.totale+' Mo</strong></td><td>'+p.durata+'</td><td>'+p.destinatari+'</td></tr>'; }).join('')
    + '</tbody></table>') + '</div>'
    + '<div class="imp-doc-section">' + sectionTitle('\uD83D\uDCCA', 'Tracker Patenti dei Licenziatari')
    + '<p style="color:var(--imp-text2);font-size:.9rem;margin-bottom:16px">Tieni traccia delle Patenti di ogni personaggio. Dati salvati in locale (localStorage).</p>'
    + '<button class="imp-btn" data-imp-action="openPatentiTracker">Apri Tracker Patenti</button></div>';
  };

  /* ══════════════════════════════════
     RENDER CONTENT
     ══════════════════════════════════ */
  function renderTabs() {
    var labels = { gilde:'\uD83C\uDFDB\uFE0F Societ\u00E0 & Imprese', licenze:'\u2696\uFE0F Licenze & Patenti' };
    var row = $('tabsRow');
    if (!row) return;
    row.innerHTML = PAGES.map(function(p){
      return '<button class="imp-tab-btn '+(p===currentPage?'active':'')+'" data-imp-setpage="'+p+'">'+labels[p]+'</button>';
    }).join('');
    var sr = $('searchRow');
    if (sr) sr.style.display = currentPage === 'gilde' ? 'flex' : 'none';
  }

  function renderSideNav() {
    var el = $('sidenav');
    if (!el) return;
    var nav = NAV[currentPage];
    var h = '<div class="imp-sidenav-title">Sezioni</div>';
    nav.forEach(function(n){
      h += '<button class="imp-sidenav-btn '+(currentSection===n.id?'active':'')+'" data-imp-setsection="'+n.id+'">'+n.label+'</button>';
    });
    el.innerHTML = h;
  }

  function renderContent() {
    var el = $('content');
    if (!el) return;
    var map = currentPage === 'gilde' ? RENDER_GILDE : RENDER_LICENZE;
    var fn = map[currentSection];
    el.innerHTML = fn ? fn() : '<div style="color:var(--imp-text3);padding:40px;text-align:center">Sezione non trovata.</div>';
    if (currentPage === 'gilde' && currentSection === 'gestore') gInit();
  }

  function render() {
    renderTabs();
    renderSideNav();
    renderContent();
    syncMobile();
  }

  /* ══════════════════════════════════
     GESTORE DI SOCIETA
     ══════════════════════════════════ */
  var TRACKER_KEY = 'arcamis_imprese_store';
  var TRACKER_ACTIVE_KEY = 'arcamis_impresa_attiva';
  var TRACKER_BACKUP_KEY = 'arcamis_imprese_autobackup';
  var TRACKER_DEFAULT = { nome:'Nuova Societ\u00E0', livello:1, stato:'attiva', settore:'', cassa:30, fatturato:0, fondo:30, soci:[], strutture:[], contratti:[], transazioni:[], sanzioni:[], note:'', notes:'' };

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
    if (!confirm('Eliminare la societ\u00E0 "' + (store.imprese[id].nome || 'senza nome') + '"?')) return;
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

  /* ── Generator ── */
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
      if (i === sociCount - 1 && sociCount >= 4) {
        soci.push({ nome: GEN_SOCIO_NAMES[i % GEN_SOCIO_NAMES.length], mestiere: m.name, patente: '\u2014', ruolo: 'Apprendista', tipo: Math.random() > .5 ? 'PG' : 'NPC', isApprendista: true });
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
    soci.forEach(function(s){ if (!s.isApprendista && s.patente && s.patente !== '\u2014' && pats.indexOf(s.patente) === -1) pats.push(s.patente); });
    var contratti = [];
    DATA.fornitura.forEach(function(f){
      if (contratti.length >= level) return;
      if (pats.indexOf(f.pat) !== -1) contratti.push({ patente:f.pat, cost:f.cost, rendita:f.rent });
    });
    contratti = contratti.slice(0, level);
    var fatturato = 150 + (level - 1) * 50 + contratti.reduce(function(s,c){ return s + c.rendita; }, 0);
    return { nome: name, livello: level, stato: 'attiva', settore: resp.name, cassa: 30, fatturato: fatturato, fondo: 30, soci: soci, strutture: strutture, contratti: contratti, transazioni: [], sanzioni: [], note: '', notes: '' };
  }

  function gRequisiti(d) {
    var lv = Math.min(d.livello || 1, 3);
    var soci = d.soci || [];
    var resp = soci.filter(function(s){ return s.ruolo === 'Responsabile'; })[0];
    var contr = (d.contratti || []).length;
    var maxApp = (resp && resp.patente === 'P.O.E.') ? 3 : 1;
    var nApp = soci.filter(function(s){ return s.isApprendista; }).length;
    var checks = [];
    function add(cond, msg) { checks.push({ ok: !!cond, msg: msg }); }
    add(soci.length >= 2, 'Almeno 2 soci all\u2019atto di fondazione.');
    add(!!resp, 'Serve un Responsabile (\u2605) con la patente minima del Livello.');
    add(soci.some(function(s){ return s.ruolo === 'Mastro Artigiano'; }), 'Serve almeno un Mastro Artigiano (\u2666).');
    add(soci.some(function(s){ return !s.isApprendista && s.patente && s.patente !== '\u2014'; }), 'Almeno un socio non-apprendista con una Patente valida.');
    add((d.strutture || []).some(function(s){ return s.nome === 'Magazzino'; }), 'Sede minima: Magazzino (150 Mo).');
    if (lv >= 2) {
      add((d.strutture || []).some(function(s){ return isLv2Struttura(s.nome); }), 'Officina: serve una struttura LV2 (250 Mo).');
      add(soci.some(function(s){ return s.patente === 'P.M.T.'; }), 'Officina: almeno un socio con P.M.T.');
    }
    if (lv >= 3) {
      add(soci.length >= 4, 'Corporazione: minimo 4 soci.');
      add(!!(resp && resp.patente === 'P.O.E.'), 'Corporazione: il Responsabile deve avere la P.O.E.');
    }
    add(contr <= lv, 'Contratti attivi \u2264 Livello (max ' + lv + ').');
    add(nApp <= maxApp, 'Massimo ' + maxApp + ' apprendista/i in organico.');
    return { list: checks, ok: checks.filter(function(c){ return !c.ok; }).length === 0 };
  }

  function gRequisitiHtml(d) {
    var r = gRequisiti(d);
    var sospeso = d.stato === 'sospesa' || d.stato === 'sanzione';
    var html = '<div class="imp-rule-box" style="margin-top:8px">';
    r.list.forEach(function(c) {
      var mark = c.ok ? '<span style="color:var(--imp-green2)">\u2713</span>' : '<span style="color:var(--imp-red2)">\u2715</span>';
      html += '<div style="padding:2px 0;font-size:.85rem;color:var(--imp-text2)">' + mark + ' ' + c.msg + '</div>';
    });
    html += '</div>';
    html += r.ok
      ? '<div class="imp-note-box" style="margin-top:10px">\u2705 Requisiti del Livello ' + (d.livello || 1) + ' <strong>soddisfatti</strong></div>'
      : '<div class="imp-note-box" style="margin-top:10px;border-color:rgba(192,64,64,.4)">\u26A0 Requisiti <strong>non completi</strong></div>';
    return html;
  }

  function gPathHtml(d) {
    var lv = Math.min(d.livello || 1, 3);
    var have = {};
    (d.soci || []).forEach(function(s){ if (!s.isApprendista && s.patente && s.patente !== '\u2014') have[s.patente] = true; });
    var html = '';
    for (var L = lv + 1; L <= 3; L++) {
      var fee = 0, notes = [];
      for (var i = lv; i < L; i++) { fee += DATA.livelli[i].fee; notes.push(DATA.livelli[i].fee + ' (L' + (i + 1) + ')'); }
      var tot = fee;
      if (L >= 3) { tot += DATA.fondi.deposit; notes.push('Cauzione L3 ' + DATA.fondi.deposit + ' Mo (restituita)'); }
      for (var j = lv; j < L; j++) {
        var pt = DATA.livelli[j].patente;
        if (!have[pt]) { tot += patTotale(pt); }
      }
      html += '<div class="imp-calc-row"><span class="imp-label">\u2192 L' + L + ' \u2014 ' + DATA.livelli[L - 1].name + '</span><span class="imp-value">' + tot + ' Mo</span></div>';
      for (var k = lv; k < L; k++) have[DATA.livelli[k].patente] = true;
    }
    if (!html) html = '<p style="color:var(--imp-text3);font-size:.82rem">Sei gi\u00E0 al livello massimo (Corporazione).</p>';
    return html;
  }

  function gFinanzeHtml(d) {
    var st = impresaStats(d);
    var appPG = (d.soci || []).filter(function(s){ return s.isApprendista && s.tipo === 'PG'; }).length;
    var appNPC = (d.soci || []).filter(function(s){ return s.isApprendista && s.tipo !== 'PG'; }).length;
    var html = '<div class="imp-calc-row"><span class="imp-label">Vendite dirette (fatturato mensile)</span><span class="imp-value">+' + (d.fatturato || 0) + ' Mo/mese</span></div>';
    html += '<div class="imp-calc-row"><span class="imp-label">Rendita contratti fornitura</span><span class="imp-value">' + (st.sospeso ? '<span style="color:var(--imp-red2)">SOSPESA</span>' : '+' + st.rendita) + ' Mo/mese</span></div>';
    html += '<div class="imp-calc-row"><span class="imp-label">Lordo mensile</span><span class="imp-value">' + st.lordo + ' Mo</span></div>';
    html += '<div class="imp-calc-row"><span class="imp-label">Tassa Camera (1% lordo)</span><span class="imp-value" style="color:var(--imp-red2)">-' + st.tassa + ' Mo</span></div>';
    html += '<div class="imp-calc-row"><span class="imp-label">Apprendisti (PG ' + appPG + ' \u00D7 20 \u00B7 NPC ' + appNPC + ' \u00D7 8)</span><span class="imp-value" style="color:var(--imp-red2)">-' + (appPG * 20 + appNPC * 8) + ' Mo</span></div>';
    html += '<div class="imp-calc-row"><span class="imp-label">Fondo di Riserva (10% netto)</span><span class="imp-value" style="color:var(--imp-red2)">-' + st.riserva + ' Mo</span></div>';
    html += '<div class="imp-calc-row total"><span class="imp-label">Utile Netto Stimato</span><span class="imp-value">' + st.netto + ' Mo/mese</span></div>';
    if (st.sospeso) html += '<div class="imp-note-box" style="margin-top:10px">\u26A0 <strong>Sospensione attiva:</strong> rendita contratti e affitti azzerata.</div>';
    return html;
  }

  function gTopHtml() {
    var store = trackerStore();
    var active = trackerActiveId();
    var html = '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px">'
      + '<button class="imp-btn" data-imp-action="newEmpty">+ Nuova Societ\u00E0</button>'
      + '<button class="imp-btn" data-imp-action="newRandom">🎲 Nuova Casuale</button>'
      + '<button class="imp-btn secondary" data-imp-action="importCompany">📂 Import</button>'
      + '<button class="imp-btn secondary" data-imp-action="exportCompany">💾 Export</button>'
      + '<button class="imp-btn secondary" data-imp-action="exportSheet">🖨️ Scheda Stampa</button>'
      + '<button class="imp-btn secondary" data-imp-action="restoreSnapshot">↩ Snapshot</button>'
      + '</div>';
    if (!store.ordine.length) {
      html += '<p style="color:var(--imp-text3);font-size:.84rem">Nessuna societ\u00E0 salvata: creane una nuova o generane una casuale.</p>';
      return html;
    }
    html += '<table class="imp-tbl"><thead><tr><th>Societ\u00E0</th><th>Livello</th><th>Stato</th><th>Soci</th><th>Contratti</th><th>Netto/mese</th><th></th></tr></thead><tbody>';
    store.ordine.forEach(function(id) {
      var t = store.imprese[id] || {};
      var st = impresaStats(t);
      var isAct = id === active;
      html += '<tr' + (isAct ? ' style="background:rgba(201,168,76,.12)"' : '') + '>'
        + '<td><button class="imp-btn secondary small" data-imp-action="select" data-imp-id="' + id + '">' + escH(t.nome || 'senza nome') + '</button>' + (isAct ? ' <span style="color:var(--imp-green2)">\u25CF</span>' : '') + '</td>'
        + '<td>L' + (t.livello || 1) + '</td>'
        + '<td>' + statoBadge(t.stato) + '</td>'
        + '<td>' + (t.soci || []).length + '</td>'
        + '<td>' + (t.contratti || []).length + '/' + (t.livello || 1) + '</td>'
        + '<td>' + (t.nome ? st.netto + ' Mo' : '\u2014') + '</td>'
        + '<td>' + (isAct ? '' : '<button class="imp-btn danger small" data-imp-action="delete" data-imp-id="' + id + '">\uD83D\uDDD1</button>') + '</td>'
        + '</tr>';
    });
    html += '</tbody></table>';
    return html;
  }

  function gSchedaHtml(d) {
    var lvOpts = '';
    for (var l = 1; l <= 3; l++) lvOpts += '<option value="' + l + '" ' + (l === (d.livello || 1) ? 'selected' : '') + '>L' + l + ' \u2014 ' + DATA.livelli[l - 1].name + '</option>';
    var statoOpts = [['attiva','Attiva'],['sospesa','Sospesa'],['sanzione','In sanzione'],['sciolta','Sciolta']]
      .map(function(o){ return '<option value="' + o[0] + '" ' + (d.stato === o[0] ? 'selected' : '') + '>' + o[1] + '</option>'; }).join('');
    var mest = [];
    GEN_MESTIERI.forEach(function(m){ if (mest.indexOf(m.name) === -1) mest.push(m.name); });
    var settore = '<select id="imp-gSettore" data-imp-save><option value="">\u2014 Scegli settore \u2014</option>'
      + mest.map(function(m){ return '<option' + (d.settore === m ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select>';
    var html = '<div class="imp-calc-section"><h4>\uD83C\uDFF7 Anagrafica</h4><div class="imp-calc-grid">'
      + '<div class="imp-calc-field"><label>Nome Societ\u00E0</label><input type="text" id="imp-gNome" value="' + escA(d.nome) + '" data-imp-save></div>'
      + '<div class="imp-calc-field"><label>Livello</label><select id="imp-gLivello" data-imp-save>' + lvOpts + '</select></div>'
      + '<div class="imp-calc-field"><label>Settore</label>' + settore + '</div>'
      + '<div class="imp-calc-field"><label>Stato legale</label><select id="imp-gStato" data-imp-save>' + statoOpts + '</select></div>'
      + '<div class="imp-calc-field"><label>Fondo Iniziale (Mo)</label><input type="number" id="imp-gFondo" value="' + (d.fondo || 0) + '" data-imp-save></div>'
      + '<div class="imp-calc-field"><label>Cassa (Mo)</label><input type="number" id="imp-gCassa" value="' + (d.cassa || 0) + '" data-imp-save></div>'
      + '<div class="imp-calc-field"><label>Fatturato mensile (Mo)</label><input type="number" id="imp-gFatt" value="' + (d.fatturato || 0) + '" data-imp-save></div>'
      + '</div></div>';
    html += '<div class="imp-calc-section"><h4>\u2705 Requisiti del Livello</h4>' + gRequisitiHtml(d) + '</div>';
    html += '<div class="imp-calc-section"><h4>\uD83D\uDCC8 Percorso di crescita</h4>' + gPathHtml(d) + '</div>';
    html += '<div class="imp-calc-section"><h4>\uD83D\uDCB5 Situazione economica</h4>' + gFinanzeHtml(d) + '</div>';
    return html;
  }

  function gestoreShell() {
    return '<div class="imp-section-hero"><h2>Gestore di Societ\u00E0</h2><p>Una sola schermata per fondare, gestire e far crescere le societ\u00E0.</p></div>'
    + '<div class="imp-doc-section" id="imp-gTop"></div>'
    + '<div class="imp-doc-section" id="imp-gScheda"></div>'
    + '<div class="imp-doc-section" id="imp-gSoci"></div>'
    + '<div class="imp-doc-section" id="imp-gStrutt"></div>'
    + '<div class="imp-doc-section" id="imp-gContr"></div>'
    + '<div class="imp-doc-section" id="imp-gTrans"></div>'
    + '<div class="imp-doc-section" id="imp-gSan"></div>'
    + '<div class="imp-doc-section" id="imp-gEv"></div>'
    + '<div class="imp-doc-section" id="imp-gNote"></div>';
  }

  function gInit() {
    var gTop = $('gTop');
    if (!gTop) return;
    var d = trackerLoad();
    gTop.innerHTML = gTopHtml();
    var el = $('gScheda'); if(el) el.innerHTML = gSchedaHtml(d);
    el = $('gSoci'); if(el) el.innerHTML = gSociHtml(d);
    el = $('gStrutt'); if(el) el.innerHTML = gStruttHtml(d);
    el = $('gContr'); if(el) el.innerHTML = gContrHtml(d);
    el = $('gTrans'); if(el) el.innerHTML = gTransHtml(d);
    el = $('gSan'); if(el) el.innerHTML = gSanHtml(d);
    el = $('gEv'); if(el) el.innerHTML = gEvHtml(d);
    el = $('gNote'); if(el) el.innerHTML = gNoteHtml(d);
  }

  var RUOLI = ['Responsabile', 'Mastro Artigiano', 'Socio', 'Apprendista'];

  function gSociHtml(d) {
    var soci = d.soci || [];
    var maxApp = (soci.some(function(s){ return s.ruolo === 'Responsabile'; }) && soci.filter(function(s){ return s.ruolo === 'Responsabile'; })[0].patente === 'P.O.E.') ? 3 : 1;
    var nApp = soci.filter(function(s){ return s.isApprendista; }).length;
    var addForm = '<div class="imp-add-row"><input type="text" id="imp-sNome" placeholder="Nome socio">'
      + '<select id="imp-sMestiere">' + GEN_MESTIERI.map(function(m){ return '<option>' + m.name + '</option>'; }).join('') + '</select>'
      + '<select id="imp-sPatente">' + DATA.patenti.map(function(p){ return '<option value="' + p.sigla + '">' + p.sigla + '</option>'; }).join('') + '<option value="\u2014">\u2014</option></select>'
      + '<select id="imp-sRuolo">' + RUOLI.map(function(r){ return '<option>' + r + '</option>'; }).join('') + '</select>'
      + '<select id="imp-sTipo"><option>PG</option><option>NPC</option></select>'
      + '<label class="imp-chk"><input type="checkbox" id="imp-sApp"> Apprendista</label>'
      + '<button class="imp-btn" data-imp-action="addSocio">+ Aggiungi</button></div>';
    var html = '<h4>\uD83D\uDC65 Soci e dipendenti <span style="color:var(--imp-text3)">(' + soci.length + ')</span></h4>' + addForm;
    if (!soci.length) return html + '<p style="color:var(--imp-text3);font-size:.82rem">Nessun socio.</p>';
    html += '<table class="imp-tbl"><thead><tr><th>Nome</th><th>Mestiere</th><th>Patente</th><th>Ruolo</th><th>Tipo</th><th>Costo</th><th></th></tr></thead><tbody>';
    soci.forEach(function(s, i) {
      var cost = s.isApprendista ? (s.tipo === 'PG' ? 20 : 8) + ' Mo' : '\u2014';
      html += '<tr>'
        + '<td><input class="imp-cell" value="' + escA(s.nome) + '" data-imp-action="updSocio" data-imp-idx="' + i + '" data-imp-field="nome"></td>'
        + '<td>' + s.mestiere + '</td>'
        + '<td><select class="imp-cell" data-imp-action="updSocio" data-imp-idx="' + i + '" data-imp-field="patente">' + DATA.patenti.map(function(p){ return '<option' + (s.patente === p.sigla ? ' selected' : '') + '>' + p.sigla + '</option>'; }).join('') + '<option' + (!s.patente || s.patente === '\u2014' ? ' selected' : '') + ' value="">\u2014</option></select></td>'
        + '<td><select class="imp-cell" data-imp-action="updSocio" data-imp-idx="' + i + '" data-imp-field="ruolo">' + RUOLI.map(function(r){ return '<option' + (s.ruolo === r ? ' selected' : '') + '>' + r + '</option>'; }).join('') + '</select></td>'
        + '<td><select class="imp-cell" data-imp-action="updSocio" data-imp-idx="' + i + '" data-imp-field="tipo"><option' + (s.tipo !== 'NPC' ? ' selected' : '') + '>PG</option><option' + (s.tipo === 'NPC' ? ' selected' : '') + '>NPC</option></select></td>'
        + '<td>' + cost + '</td>'
        + '<td><button class="imp-btn danger small" data-imp-action="delSocio" data-imp-idx="' + i + '">\u2715</button></td></tr>';
    });
    html += '</tbody></table>';
    return html;
  }

  function gStruttHtml(d) {
    var strutt = d.strutture || [];
    var opts = DATA.strutture.map(function(s) {
      return '<option value="' + s.nome + '">' + s.nome + ' \u00B7 ' + s.cost + ' Mo' + (s.lv === 2 ? ' (LV2)' : '') + '</option>';
    }).join('');
    var html = '<h4>\uD83C\uDFD7 Strutture e sedi <span style="color:var(--imp-text3)">(' + strutt.length + ')</span></h4>';
    html += '<div class="imp-add-row"><select id="imp-tNome">' + opts + '</select>'
      + '<button class="imp-btn" data-imp-action="addStrutt">+ Acquista</button></div>';
    if (!strutt.length) return html + '<p style="color:var(--imp-text3);font-size:.82rem">Nessuna struttura.</p>';
    html += '<table class="imp-tbl"><thead><tr><th>Struttura</th><th>Costo</th><th>Tipo</th><th></th></tr></thead><tbody>';
    var totCost = 0;
    strutt.forEach(function(s, i) {
      var lv2 = isLv2Struttura(s.nome);
      var info = DATA.strutture.filter(function(x){ return x.nome === s.nome; })[0];
      totCost += s.cost || (info ? info.cost : 0);
      html += '<tr><td>' + escH(s.nome) + (lv2 ? ' <span class="imp-lv2-tag">LV2</span>' : '') + '</td>'
        + '<td>' + (s.cost || (info ? info.cost : '\u2014')) + ' Mo</td>'
        + '<td>' + (lv2 ? 'Officina' : 'Base') + '</td>'
        + '<td><button class="imp-btn danger small" data-imp-action="delStrutt" data-imp-idx="' + i + '">\u2715</button></td></tr>';
    });
    html += '</tbody></table>';
    return html;
  }

  function gContrHtml(d) {
    var contr = d.contratti || [];
    var max = d.livello || 1;
    var soci = d.soci || [];
    var opts = DATA.fornitura.map(function(f) {
      var has = soci.some(function(s){ return s.patente === f.pat; });
      return '<option value="' + f.pat + '|' + f.cost + '|' + f.rent + '"' + (has ? '' : ' disabled') + '>' + f.pat + ' \u00B7 ' + f.cost + ' Mo \u00B7 ' + f.rent + ' Mo/ges</option>';
    }).join('');
    var can = contr.length < max;
    var html = '<h4>\uD83D\uDCDC Contratti di Fornitura <span style="color:var(--imp-text3)">(' + contr.length + '/' + max + ')</span></h4>';
    html += '<div class="imp-add-row"><select id="imp-cSel">' + opts + '</select>'
      + '<button class="imp-btn" data-imp-action="addContratto"' + (can ? '' : ' disabled') + '>+ Stipula</button></div>';
    if (!can) html += '<div class="imp-note-box" style="margin-top:8px">\u26A0 Limite contratti raggiunto (' + max + ').</div>';
    if (!contr.length) return html + '<p style="color:var(--imp-text3);font-size:.82rem">Nessun contratto attivo.</p>';
    html += '<table class="imp-tbl"><thead><tr><th>Contratto</th><th>Patente</th><th>Costo</th><th>Rendita</th><th></th></tr></thead><tbody>';
    contr.forEach(function(c, i) {
      html += '<tr><td>' + escH(c.patente) + '</td><td>' + (c.patente || '') + '</td>'
        + '<td>' + (c.cost || '\u2014') + ' Mo</td><td>+' + (c.rent || 0) + ' Mo/ges</td>'
        + '<td><button class="imp-btn danger small" data-imp-action="delContratto" data-imp-idx="' + i + '">\u2715</button></td></tr>';
    });
    html += '</tbody></table>';
    return html;
  }

  function gTransHtml(d) {
    var tx = d.transazioni || [];
    var html = '<h4>\uD83D\uDCD4 Registro Entrate/Uscite <span style="color:var(--imp-text3)">(cassa: <strong>' + (d.cassa || 0) + ' Mo</strong>)</span></h4>';
    html += '<div class="imp-add-row">'
      + '<input type="text" id="imp-xDesc" placeholder="Descrizione">'
      + '<input type="number" id="imp-xImp" placeholder="Importo (+/-)" value="0">'
      + '<button class="imp-btn" data-imp-action="addTrans" data-imp-entry="true">+ Entrata</button>'
      + '<button class="imp-btn danger" data-imp-action="addTrans" data-imp-entry="false">\u2212 Uscita</button>'
      + '<button class="imp-btn secondary" data-imp-action="closeMonth">\uD83D\uDDD3 Chiudi mese</button>'
      + '</div>';
    if (!tx.length) return html + '<p style="color:var(--imp-text3);font-size:.82rem">Registro vuoto.</p>';
    html += '<table class="imp-tbl"><thead><tr><th>Data</th><th>Voce</th><th>Importo</th><th>Cassa</th><th></th></tr></thead><tbody>';
    var tot = 0;
    var runs = tx.slice().reverse();
    runs.forEach(function(t, idx) {
      tot += (t.importo || 0);
      html += '<tr><td>' + escH(t.data || '\u2014') + '</td><td>' + escH(t.tipo) + '</td>'
        + '<td style="color:' + ((t.importo || 0) < 0 ? 'var(--imp-red2)' : 'var(--imp-green2)') + '">' + ((t.importo || 0) > 0 ? '+' : '') + (t.importo || 0) + '</td>'
        + '<td>' + tot + '</td>'
        + '<td><button class="imp-btn danger small" data-imp-action="delTrans" data-imp-idx="' + (tx.length - 1 - idx) + '">\u2715</button></td></tr>';
    });
    html += '</tbody></table>';
    return html;
  }

  function gSanHtml(d) {
    var san = d.sanzioni || [];
    var html = '<h4>\u2696 Sanzioni e Ispezioni U.R.V.</h4>';
    html += '<div class="imp-add-row"><select id="imp-sanSel">'
      + DATA.sanzioni.map(function(s, i){ return '<option value="' + i + '">' + s.name + ' (' + s.multa + ' Mo)</option>'; }).join('')
      + '</select><button class="imp-btn" data-imp-action="addSanzione">+ Applica sanzione</button></div>';
    if (!san.length) return html + '<p style="color:var(--imp-text3);font-size:.82rem">Nessuna sanzione registrata.</p>';
    html += '<table class="imp-tbl"><thead><tr><th>Sanzione</th><th>Tipo</th><th>Penale</th><th>Stato</th><th></th></tr></thead><tbody>';
    san.forEach(function(s, i) {
      html += '<tr><td>' + escH(s.name || s.tipo) + '</td><td>' + escH(s.tipo) + '</td><td>' + (s.penal || 0) + ' Mo</td>'
        + '<td>' + escH(s.stato) + '</td>'
        + '<td>' + (s.stato === 'attiva' && s.tipo !== 'Gravissima' ? '<button class="imp-btn small" data-imp-action="regolarizza" data-imp-idx="' + i + '">\u2714 Paga</button> ' : '') + '<button class="imp-btn danger small" data-imp-action="delSanzione" data-imp-idx="' + i + '">\u2715</button></td></tr>';
    });
    html += '</tbody></table>';
    return html;
  }

  function gEvHtml(d) {
    return '<h4>\uD83C\uDFB2 Eventi stagionali <span style="color:var(--imp-text3)">(d20 + 2 per Livello)</span></h4>'
    + '<div class="imp-add-row"><button class="imp-btn" data-imp-action="rollEvent">\uD83C\uDFB2 Tira d20 per l\u2019evento</button></div>';
  }

  function gNoteHtml(d) {
    return '<h4>\uD83D\uDCDD Note libere</h4>'
    + '<textarea id="imp-gNotes" rows="4" style="width:100%;resize:vertical" data-imp-save>' + escH(d.notes || '') + '</textarea>'
    + '<p style="color:var(--imp-text3);font-size:.78rem;margin-top:4px">Il salvataggio \u00E8 automatico a ogni uscita dal campo.</p>';
  }

  /* ── GESTORE ACTIONS ── */
  function gSave() {
    var d = trackerLoad();
    function v(id) { var el = $(id); return el ? el.value : undefined; }
    if ($('gNome')) d.nome = v('gNome');
    if ($('gLivello')) d.livello = parseInt(v('gLivello'), 10);
    if ($('gSettore')) d.settore = v('gSettore');
    if ($('gStato')) d.stato = v('gStato');
    if ($('gFondo')) d.fondo = parseInt(v('gFondo'), 10) || 0;
    if ($('gCassa')) d.cassa = parseInt(v('gCassa'), 10) || 0;
    if ($('gFatt')) d.fatturato = parseInt(v('gFatt'), 10) || 0;
    if ($('gNotes')) d.notes = v('gNotes');
    trackerSave(d);
    gInit();
  }

  function gAddSocio() {
    var d = trackerLoad();
    var nome = ($('sNome') || {}).value || 'Nuovo socio';
    var mest = ($('sMestiere') || {}).value;
    var pat = ($('sPatente') || {}).value;
    var ruolo = ($('sRuolo') || {}).value;
    var tipo = ($('sTipo') || {}).value;
    var isApp = ($('sApp') || {}).checked;
    d.soci.push({ nome: nome, mestiere: mest, patente: pat, ruolo: ruolo, tipo: tipo, isApprendista: !!isApp });
    trackerSave(d); gInit();
  }

  function gUpdSocio(i, field, value) {
    var d = trackerLoad();
    if (d.soci[i]) { d.soci[i][field] = value; trackerSave(d); gInit(); }
  }

  function gDelSocio(i) {
    var d = trackerLoad();
    if (d.soci[i]) { d.soci.splice(i, 1); trackerSave(d); gInit(); }
  }

  function gAddStrutt() {
    var d = trackerLoad();
    var n = ($('tNome') || {}).value;
    var info = DATA.strutture.filter(function(x){ return x.nome === n; })[0];
    if (info && d.strutture.some(function(s){ return s.nome === n; })) { alert('Struttura gi\u00E0 posseduta.'); return; }
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

  function gAddContratto() {
    var d = trackerLoad();
    var sel = (($('cSel') || {}).value || '').split('|');
    if (d.contratti.length >= (d.livello || 1)) { alert('Limite contratti raggiunto.'); return; }
    d.contratti.push({ patente: sel[0], cost: parseInt(sel[1], 10), rendita: parseInt(sel[2], 10) });
    d.cassa = (d.cassa || 0) - parseInt(sel[1], 10);
    d.transazioni.push({ tipo: 'Stipula contratto (' + sel[0] + ')', importo: -parseInt(sel[1], 10), data: (new Date()).toISOString().slice(0, 10) });
    trackerSave(d); gInit();
  }

  function gDelContratto(i) {
    var d = trackerLoad();
    if (d.contratti[i]) { d.contratti.splice(i, 1); trackerSave(d); gInit(); }
  }

  function gAddTrans(isEntry) {
    var d = trackerLoad();
    var imp = parseInt(($('xImp') || {}).value, 10) || 0;
    var desc = (($('xDesc') || {}).value) || (isEntry ? 'Entrata' : 'Uscita');
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
    d.cassa = (d.cassa || 0) + st.lordo - st.tassa - st.apprCost;
    d.fondo = (d.fondo || 0) + st.riserva;
    d.transazioni.push({ tipo: 'Chiusura mese: vendite+contratti', importo: st.lordo, data: (new Date()).toISOString().slice(0, 10) });
    d.transazioni.push({ tipo: 'Tassa Camera 1%', importo: -st.tassa, data: (new Date()).toISOString().slice(0, 10) });
    if (st.apprCost) d.transazioni.push({ tipo: 'Costi apprendisti', importo: -st.apprCost, data: (new Date()).toISOString().slice(0, 10) });
    d.transazioni.push({ tipo: '\u2192 Fondo di Riserva 10%', importo: -st.riserva, data: (new Date()).toISOString().slice(0, 10) });
    alert('Mese chiuso: incassati ' + st.lordo + ' Mo');
    trackerSave(d); gInit();
  }

  function gAddSanzione() {
    var d = trackerLoad();
    var idx = parseInt(($('sanSel') || {}).value, 10);
    var s = DATA.sanzioni[idx];
    if (!s) return;
    if (s.tipo === 'Gravissima') {
      if (!confirm('Sanzione GRAVISSIMA: scioglimento della societ\u00E0. Procedere?')) return;
      d.sanzioni.push({ tipo: s.tipo, name: s.name, penal: 0, desc: s.effetto, stato: 'attiva' });
      d.cassa = 0;
      d.stato = 'sciolta';
      trackerSave(d); gInit();
      alert('La societ\u00E0 \u00E8 stata sciolta.');
      return;
    }
    d.sanzioni.push({ tipo: s.tipo, name: s.name, penal: s.multa || 0, desc: s.effetto, stato: 'attiva' });
    if (s.tipo === 'Grave') d.stato = 'sospesa';
    d.cassa = Math.max(0, (d.cassa || 0) - (s.multa || 0));
    d.transazioni.push({ tipo: 'Penale ' + s.name, importo: -(s.multa || 0), data: (new Date()).toISOString().slice(0, 10) });
    trackerSave(d); gInit();
  }

  function gRegolarizza(i) {
    var d = trackerLoad();
    var s = d.sanzioni[i];
    if (!s) return;
    d.cassa = Math.max(0, (d.cassa || 0) - (s.penal || 0));
    d.transazioni.push({ tipo: 'Risarcimento ' + (s.name || s.tipo), importo: -(s.penal || 0), data: (new Date()).toISOString().slice(0, 10) });
    s.stato = 'regolarizzata';
    if (d.stato === 'sospesa' || d.stato === 'sanzione') d.stato = 'attiva';
    trackerSave(d); gInit();
  }

  function gDelSanzione(i) {
    var d = trackerLoad();
    if (d.sanzioni[i]) d.sanzioni.splice(i, 1);
    trackerSave(d); gInit();
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
    var msg = 'd20 + 2\u00D7Liv' + (d.livello || 1) + ' = ' + raw + ' + ' + bonus + ' \u2192 ' + roll + '\n\n';
    if (e) msg += e.nome + ' (' + e.range + '):\n' + e.effetto;
    else msg += 'Lunga pace: nessun evento degno di nota.';
    alert(msg);
  }

  /* ── TRACKER PATENTI ── */
  var PATENTI_STORE_KEY = 'arcamis_patenti_store';
  function loadPatenti() { try { var s = JSON.parse(localStorage.getItem(PATENTI_STORE_KEY)); return Array.isArray(s) ? s : []; } catch(e) { return []; } }
  function savePatenti(list) { localStorage.setItem(PATENTI_STORE_KEY, JSON.stringify(list)); }

  function openPatentiTracker() {
    var list = loadPatenti();
    var body = '<div class="imp-calc-section"><h4>Patenti Registrate (U.R.V.)</h4>';
    if (!list.length) {
      body += '<p style="color:var(--imp-text3)">Nessuna patente registrata.</p>';
    } else {
      body += '<table class="imp-tbl"><thead><tr><th>Licenziatario</th><th>Patente</th><th>Costo</th><th>Scadenza</th><th>Stato</th></tr></thead><tbody>';
      body += list.map(function(p) {
        var cls = DATA.patenti.filter(function(x) { return x.sigla === p.sigla; })[0];
        var rowCls = cls ? cls.cls : '';
        return '<tr class="' + rowCls + '"><td><strong>' + escH(p.nome) + '</strong></td><td>' + escH(p.sigla) + '</td><td>' + (p.costo || '') + ' Mo</td><td>' + escH(p.scadenza || '-') + '</td><td>' + (p.stato === 'attiva' ? '\u2705 Attiva' : '\u274C Scaduta') + '</td></tr>';
      }).join('');
      body += '</tbody></table>';
    }
    body += '</div>';
    openModal('\uD83D\uDCCA Tracker Patenti', body);
  }

  /* ══════════════════════════════════
     EVENT DELEGATION
     ══════════════════════════════════ */
  function handleAction(action, el) {
    switch(action) {
      case 'setPage':
        currentPage = el.getAttribute('data-imp-setpage');
        currentSection = 'panoramica';
        render();
        break;
      case 'setSection':
        currentSection = el.getAttribute('data-imp-setsection');
        render();
        closeDrawer();
        break;
      case 'goto':
        var parts = (el.getAttribute('data-imp-goto') || '').split(',');
        gotoImp(parts[0], parts[1]);
        break;
      case 'closeModal': closeModal(); break;
      case 'openDrawer': openDrawer(); break;
      case 'closeDrawer': closeDrawer(); break;
      case 'newEmpty': trackerNew({}); gInit(); break;
      case 'newRandom': trackerNew(gRandomData()); gInit(); break;
      case 'select':
        var sid = el.getAttribute('data-imp-id');
        var store = trackerStore();
        if (store.imprese[sid]) { setTrackerActiveId(sid); gInit(); }
        break;
      case 'delete':
        trackerDelete(el.getAttribute('data-imp-id'));
        break;
      case 'addSocio': gAddSocio(); break;
      case 'updSocio':
        gUpdSocio(parseInt(el.getAttribute('data-imp-idx'), 10), el.getAttribute('data-imp-field'), el.value);
        break;
      case 'delSocio': gDelSocio(parseInt(el.getAttribute('data-imp-idx'), 10)); break;
      case 'addStrutt': gAddStrutt(); break;
      case 'delStrutt': gDelStrutt(parseInt(el.getAttribute('data-imp-idx'), 10)); break;
      case 'addContratto': gAddContratto(); break;
      case 'delContratto': gDelContratto(parseInt(el.getAttribute('data-imp-idx'), 10)); break;
      case 'addTrans': gAddTrans(el.getAttribute('data-imp-entry') === 'true'); break;
      case 'delTrans': gDelTrans(parseInt(el.getAttribute('data-imp-idx'), 10)); break;
      case 'closeMonth': gMese(); break;
      case 'addSanzione': gAddSanzione(); break;
      case 'regolarizza': gRegolarizza(parseInt(el.getAttribute('data-imp-idx'), 10)); break;
      case 'delSanzione': gDelSanzione(parseInt(el.getAttribute('data-imp-idx'), 10)); break;
      case 'rollEvent': gRoll(); break;
      case 'openPatentiTracker': openPatentiTracker(); break;
      case 'restoreSnapshot': trackerRestoreSnapshot(); break;
      case 'exportSheet':
        alert('Funzione di stampa: apri la pagina della societ\u00E0 attiva e usa Ctrl+P.');
        break;
    }
  }

  function onClick(e) {
    var el = e.target.closest('[data-imp-action]');
    if (el) { handleAction(el.getAttribute('data-imp-action'), el); return; }
    el = e.target.closest('[data-imp-setpage]');
    if (el) { handleAction('setPage', el); return; }
    el = e.target.closest('[data-imp-setsection]');
    if (el) { handleAction('setSection', el); return; }
    el = e.target.closest('[data-imp-goto]');
    if (el) { handleAction('goto', el); return; }
  }

  function onInput(e) {
    if (e.target.matches('[data-imp-save]')) gSave();
  }

  /* ══════════════════════════════════
     SHELL HTML
     ══════════════════════════════════ */
  function shellHTML() {
    return '<div class="imp-tabs" id="imp-tabs">'
      + '<div class="imp-tabs-row" id="imp-tabsRow"></div>'
      + '<div class="imp-tabs-row" id="imp-searchRow" style="display:none;padding:8px 0 12px;border-top:1px solid var(--imp-border);">'
      + '<div class="imp-search-wrap"><input type="search" class="imp-search-input" id="imp-globalSearch" placeholder="Cerca..."></div>'
      + '<div id="imp-activeFilters"></div></div></div>'

      + '<div class="imp-mobile-drawer-overlay" id="imp-drawerOverlay" data-imp-action="closeDrawer"></div>'
      + '<div class="imp-mobile-drawer" id="imp-mobileDrawer">'
      + '<div class="imp-mobile-drawer-header"><h3>Navigazione</h3>'
      + '<button class="imp-mobile-drawer-close" data-imp-action="closeDrawer">\u2715</button></div>'
      + '<nav id="imp-mobileDrawerNav"></nav></div>'
      + '<button class="imp-mobile-nav-btn" id="imp-mobileNavBtn" data-imp-action="openDrawer" title="Navigazione">\u2630</button>'

      + '<div class="imp-modal-overlay" id="imp-modalOverlay">'
      + '<div class="imp-modal" id="imp-modalBox">'
      + '<div class="imp-modal-header"><h3 id="imp-modalTitle">Strumento</h3>'
      + '<button class="imp-modal-close" data-imp-action="closeModal">\u2715</button></div>'
      + '<div class="imp-modal-body" id="imp-modalBody"></div>'
      + '<div class="imp-modal-footer" id="imp-modalFooter"></div></div></div>'

      + '<div class="imp-main">'
      + '<nav class="imp-sidenav" id="imp-sidenav"></nav>'
      + '<div class="imp-content" id="imp-content"></div></div>';
  }

  /* ══════════════════════════════════
     PUBLIC INIT
     ══════════════════════════════════ */
  window._impreseInit = function(container) {
    _container = container;
    container.innerHTML = shellHTML();
    render();
  };

  window._impreseDestroy = function() {
    _container = null;
  };

})();
