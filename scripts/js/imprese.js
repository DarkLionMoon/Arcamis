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
    ],
  };

  /* ══════════════════════════════════
     DATA
     ══════════════════════════════════ */
  /* Dati di gioco: arrivano da content/pages/imprese.json (Admin → Imprese).
     Il montaggio in notion-nav passa la pagina a `window._impresePage`. */
  var DATA = (window._impresePage && window._impresePage.data) || {
    livelli: [],
    patenti: [],
    strutture: [],
    fornitura: [],
    sanzioni: [],
    eventi: [],
    tiriEvento: [],
    conflitti: {},
    sponsaggio: [],
    fondi: {}
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

    + '<div class="imp-note-box" style="margin-top:16px">\uD83D\uDCA1 <strong>Suggerimento:</strong> verifica i requisiti del livello qui sotto prima di presentare la domanda al Castello.</div>'
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


  /* ══════════════════════════════════
     RENDER CONTENT
     ══════════════════════════════════ */
  function renderTabs() {
    var labels = { gilde:'\uD83C\uDFDB\uFE0F Imprese', licenze:'\u2696\uFE0F Licenze & Patenti' };
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
  }

  function render() {
    renderTabs();
    renderSideNav();
    renderContent();
    syncMobile();
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
      case 'clearSearch':
        var _si = $('globalSearch');
        if (_si) _si.value = '';
        applySearch('');
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
    if (e.target.id === 'imp-globalSearch') applySearch(e.target.value);
  }

  /* ══════════════════════════════════
     RICERCA GLOBALE
     Filtra i blocchi di contenuto della sezione corrente: nasconde le
     unità che non contengono la query e le sezioni rimaste vuote,
     mostrando il conteggio nel pill di filtro. Soglia: 2 caratteri.
     ══════════════════════════════════ */
  var SEARCH_SEL = '.imp-rule-box, .imp-note-box, .imp-tbl tbody tr, .imp-hero-links a, .imp-stat-card';
  function applySearch(raw) {
    var content = $('content');
    var f = $('activeFilters');
    if (!content || !content.querySelectorAll) { if (f) f.innerHTML = ''; return 0; }
    var q = (raw == null ? '' : String(raw)).trim().toLowerCase();
    var units = content.querySelectorAll(SEARCH_SEL);
    var i, k;
    if (q.length < 2) {
      for (i = 0; i < units.length; i++) units[i].classList.remove('imp-hide');
      var allSecs = content.querySelectorAll('.imp-doc-section');
      for (i = 0; i < allSecs.length; i++) allSecs[i].classList.remove('imp-hide');
      if (f) f.innerHTML = '';
      return units.length;
    }
    var hits = 0;
    for (i = 0; i < units.length; i++) {
      var hit = (units[i].textContent || '').toLowerCase().indexOf(q) !== -1;
      units[i].classList.toggle('imp-hide', !hit);
      if (hit) hits++;
    }
    /* Nasconde le sezioni il cui titolo non matcha e che non hanno più unità visibili. */
    var sections = content.querySelectorAll('.imp-doc-section');
    for (i = 0; i < sections.length; i++) {
      var sec = sections[i];
      var titleEl = sec.querySelector('.imp-doc-section-title');
      var titleHit = titleEl && (titleEl.textContent || '').toLowerCase().indexOf(q) !== -1;
      var kids = sec.querySelectorAll('.imp-rule-box, .imp-note-box, .imp-tbl tbody tr');
      var vis = 0;
      for (k = 0; k < kids.length; k++) { if (!kids[k].classList.contains('imp-hide')) vis++; }
      sec.classList.toggle('imp-hide', !titleHit && kids.length > 0 && vis === 0);
    }
    if (f) {
      var label = hits === 1 ? '1 risultato' : hits + ' risultati';
      var cls = hits ? 'imp-filter-pill' : 'imp-filter-pill imp-filter-none';
      f.innerHTML = '<span class="' + cls + '">' + label + ' per \u201C' + escH(String(raw).trim()) + '\u201D'
        + ' <button class="imp-filter-x" data-imp-action="clearSearch" title="Azzera ricerca">\u2715</button></span>';
    }
    return hits;
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
     I listener vivono sul container (delegation): un'unica coppia
     click/input serve tab, sidenav, modal, drawer e form del gestore.
     ══════════════════════════════════ */
  var _onClickBound = null;
  var _onInputBound = null;
  window._impreseInit = function(container) {
    window._impreseDestroy();
    /* Lo script è caricato prima della pagina: i dati vanno presi qui,
       non alla valutazione del file, altrimenti resta il fallback vuoto. */
    if (window._impresePage && window._impresePage.data) {
      /* Nel browser DATA è il fallback vuoto; nei test può già essere la
         stessa pagina, quindi si copia senza svuotare la sorgente. */
      var source = window._impresePage.data;
      var next = {};
      Object.keys(source).forEach(function(key) { next[key] = source[key]; });
      Object.keys(DATA).forEach(function(key) { delete DATA[key]; });
      Object.keys(next).forEach(function(key) { DATA[key] = next[key]; });
    }
    _container = container;
    container.innerHTML = shellHTML();
    _onClickBound = function(e) { onClick(e); };
    _onInputBound = function(e) { onInput(e); };
    if (container.addEventListener) {
      container.addEventListener('click', _onClickBound);
      container.addEventListener('input', _onInputBound);
    }
    render();
  };

  window._impreseDestroy = function() {
    if (_container && _container.removeEventListener) {
      if (_onClickBound) _container.removeEventListener('click', _onClickBound);
      if (_onInputBound) _container.removeEventListener('input', _onInputBound);
    }
    _container = null;
    _onClickBound = null;
    _onInputBound = null;
  };

  /* Smistamento azioni e ricerca, esposti per i test automatici (vm senza DOM). */
  window._impHandle = handleAction;
  window._impSearch = applySearch;

})();
