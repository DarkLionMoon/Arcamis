/* ════════════════════════════════════
   ARCAMIS — societa-licenze.js
   Società, Imprese, Patenti e Licenze
   di Arcamis. SPA entry:
   window.showSocietaLicenze
════════════════════════════════════ */

// ═══════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════

var _slCurrentTab = 'guide';
var _slCurrentSection = 'panoramica';

var _slPages = ['gilde', 'licenze'];

var _slNav = {
  gilde: [
    { id:'panoramica',  label:'📖 Panoramica' },
    { id:'impresa',     label:'🏢 Imprese' },
    { id:'fondazione',  label:'📜 Fondazione' },
    { id:'tipologie',   label:'⚒️ Tipologie' },
    { id:'gestione',    label:'💰 Gestione' },
    { id:'sede',        label:'🏗️ Sede Fisica' },
    { id:'gilda',       label:'🏛️ Costituzione Società' },
    { id:'benefici',    label:'✦ Benefici Società' },
    { id:'sanzioni',    label:'⚠️ Sanzioni' },
    { id:'costi',       label:'🪙 Riepilogo Costi' },
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
  ],
};

// ═══════════════════════════════════════════════
//  MOBILE
// ═══════════════════════════════════════════════

function _slOpenDrawer() {
  var d = document.getElementById('sl-mobile-drawer');
  var o = document.getElementById('sl-drawer-overlay');
  if (d) d.classList.add('open');
  if (o) o.classList.add('open');
}

function _slCloseDrawer() {
  var d = document.getElementById('sl-mobile-drawer');
  var o = document.getElementById('sl-drawer-overlay');
  if (d) d.classList.remove('open');
  if (o) o.classList.remove('open');
}

function _slSyncMobileDrawer() {
  var desktopNav = document.getElementById('sl-sidenav');
  var mobileNav = document.getElementById('sl-mobile-drawer-nav');
  if (mobileNav && desktopNav) mobileNav.innerHTML = desktopNav.innerHTML;
}

// ═══════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════

function _slSectionTitle(icon, label) {
  return '<div class="sl-section-title">' + icon + ' ' + label + '</div>';
}

function _slTableWrap(inner) {
  return '<div class="cmp-table-wrap">' + inner + '</div>';
}

// ═══════════════════════════════════════════════
//  RENDER TABS
// ═══════════════════════════════════════════════

function _slRenderTabs() {
  var el = document.getElementById('sl-tabs');
  if (!el) return;
  var labels = { gilde:'🏛️ Società &amp; Imprese', licenze:'⚖️ Licenze &amp; Patenti' };
  var html = '';
  for (var i = 0; i < _slPages.length; i++) {
    var p = _slPages[i];
    var active = p === _slCurrentTab ? ' active' : '';
    html += '<button class="sl-tab' + active + '" onclick="_slSetTab(\'' + p + '\')">' + labels[p] + '</button>';
  }
  el.innerHTML = html;
}

// ═══════════════════════════════════════════════
//  RENDER SIDENAV
// ═══════════════════════════════════════════════

function _slRenderSideNav() {
  var el = document.getElementById('sl-sidenav');
  if (!el) return;
  var nav = _slNav[_slCurrentTab];
  var html = '<div class="sl-sidenav-title">Sezioni</div>';
  for (var i = 0; i < nav.length; i++) {
    var n = nav[i];
    var active = _slCurrentSection === n.id ? ' active' : '';
    html += '<button class="sl-sidenav-btn' + active + '" onclick="_slSetSection(\'' + n.id + '\')">' + n.label + '</button>';
  }
  el.innerHTML = html;
}

// ═══════════════════════════════════════════════
//  DATA — RENDER GILDE
// ═══════════════════════════════════════════════

var _slRenderGilde = {

  panoramica: function() { return ''
  + '<div class="sl-page-hero gilde">'
  + '<h2>🏛️ Codice delle Imprese e delle Società<br><small style="font-size:.55em;color:rgba(200,155,60,.4);letter-spacing:.08em">Camera del Commercio e dei Mestieri — Arcadia</small></h2>'
  + '<p>Il presente Codice regola la <strong style="color:rgba(200,155,60,.9)">costituzione, l\'operatività e lo scioglimento</strong> delle Imprese e delle Società nel regno di Arcadia.<br>'
  + 'Un\'<strong style="color:rgba(200,155,60,.9)">Impresa</strong> è una società formale tra due o più personaggi con sede fisica, capacità produttiva condivisa e responsabilità collettiva verso l\'U.R.V. e il Marchesato.<br>'
  + 'Una <strong style="color:rgba(200,155,60,.9)">Società</strong> è invece un\'associazione di categoria che raggruppa più Imprese o artigiani indipendenti sotto un marchio comune, con accesso a privilegi esclusivi.</p>'
  + '</div>'

  + '<div class="cmp-guide-section">'
  + _slSectionTitle('⚖️', 'Impresa vs Società — Differenze Fondamentali')
  + _slTableWrap('<table class="cmp-table">'
  + '<thead><tr><th>Aspetto</th><th>Impresa</th><th>Società</th></tr></thead>'
  + '<tbody>'
  + '<tr><td>Definizione</td><td>Società tra 2–6 PG con mestiere comune o complementare, sede fisica e cassa condivisa.</td><td>Associazione che unisce più Imprese (o artigiani indip.) sotto un simbolo e regolamento comune.</td></tr>'
  + '<tr><td>Fondatori</td><td>Min. 2, max 6 PG. Almeno uno deve avere una Patente attiva.</td><td>Min. 3 Imprese registrate, oppure min. 5 artigiani indip. con Patente.</td></tr>'
  + '<tr><td>Sede</td><td>Obbligatoria. Almeno una struttura LV1 costruita dall\'Architetto.</td><td>Obbligatoria. Sede propria + sede delle Imprese affiliate.</td></tr>'
  + '<tr><td>Registrazione</td><td>Camera del Commercio di Arcadia. Costo una tantum.</td><td>Camera del Commercio + approvazione dell\'U.R.V. Costo più elevato.</td></tr>'
  + '<tr><td>Cassa Comune</td><td>Sì. Gestita dal Responsabile Finanziario eletto dai soci.</td><td>Sì, con Fondo di Categoria aggiuntivo (quota mensile delle Imprese affiliate).</td></tr>'
  + '<tr><td>Marchio</td><td>Timbro d\'Impresa (ottone). Apposto su ogni opera venduta.</td><td>Sigillo di Società (argento incantato). Apposto su opere di Imprese affiliate.</td></tr>'
  + '<tr><td>Scioglimento</td><td>Voto unanime dei soci oppure revoca dall\'U.R.V.</td><td>Voto di 2/3 delle Imprese affiliate oppure intervento del Marchesato.</td></tr>'
  + '</tbody></table>')
  + '</div>';
  },

  impresa: function() { return ''
  + '<div class="cmp-guide-section">'
  + _slSectionTitle('🏢', '2. Costituzione di un\'Impresa')
  + '<p style="color:rgba(220,200,160,.7);font-size:15px;margin-bottom:16px;line-height:1.6">Fondare un\'Impresa ad Arcadia è un atto giuridico formale. Non basta accordarsi tra avventurieri: serve carta, sigillo e struttura.</p>'

  + '<h4 style="font-family:\'Cinzel\',serif;color:rgba(200,155,60,.7);font-size:10px;letter-spacing:.12em;text-transform:uppercase;margin-bottom:10px">2.1 Requisiti per la Fondazione</h4>'
  + _slTableWrap('<table class="cmp-table">'
  + '<thead><tr><th>Requisito</th><th>Dettaglio</th></tr></thead>'
  + '<tbody>'
  + '<tr><td>Numero Soci</td><td>Minimo 2, massimo 6 PG fondatori. Possono essere ammessi soci di minoranza successivamente.</td></tr>'
  + '<tr><td>Patente Attiva</td><td>Almeno il <strong style="color:rgba(200,155,60,.9)">50% dei soci fondatori</strong> deve possedere una Patente valida (P.M.C., P.M.T., P.A.S.V. o P.O.E.).</td></tr>'
  + '<tr><td>Sede Fisica</td><td>Almeno una struttura LV1 costruita da un Architetto iscritto alla Camera del Commercio. Minimo consigliato: <strong style="color:rgba(200,155,60,.9)">Magazzino (150 Mo) + Cucina (70 Mo)</strong>.</td></tr>'
  + '<tr><td>Atto Costitutivo</td><td>Documento scritto e firmato da tutti i soci, con: nome dell\'Impresa, mestieri esercitati, quote di partecipazione, nome del Responsabile, sede legale.</td></tr>'
  + '<tr><td>Tassa di Registrazione</td><td><strong style="color:rgba(200,155,60,.9)">75 Mo</strong> (una tantum). Include: emissione del Timbro d\'Impresa, iscrizione al Registro delle Imprese, copia autenticata dell\'Atto.</td></tr>'
  + '<tr><td>Fondo Iniziale</td><td>Cassa comune di avvio: minimo <strong style="color:rgba(200,155,60,.9)">50 Mo</strong> versati collettivamente. Serve come garanzia per i primi fornitori.</td></tr>'
  + '</tbody></table>')

  + '<h4 style="font-family:\'Cinzel\',serif;color:rgba(200,155,60,.7);font-size:10px;letter-spacing:.12em;text-transform:uppercase;margin:20px 0 10px">2.2 Procedura di Registrazione</h4>'
  + '<div class="cmp-rules-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">'
  + '<div class="cmp-rule-box"><h4>1️⃣ Atto Costitutivo</h4><p>I soci redigono l\'Atto in triplice copia: una per la Camera del Commercio, una per l\'U.R.V., una per l\'Impresa.</p></div>'
  + '<div class="cmp-rule-box"><h4>2️⃣ Presentazione</h4><p>Il Responsabile si presenta fisicamente alla Camera del Commercio con l\'Atto e le Patenti di tutti i soci.</p></div>'
  + '<div class="cmp-rule-box"><h4>3️⃣ Verifica</h4><p>Il funzionario verifica i requisiti ed emette il Certificato di Impresa e il Timbro d\'Impresa in ottone.</p></div>'
  + '<div class="cmp-rule-box"><h4>4️⃣ Iscrizione</h4><p>L\'Impresa viene inscritta nel Registro Pubblico delle Imprese di Arcadia (consultabile da chiunque).</p></div>'
  + '<div class="cmp-rule-box"><h4>5️⃣ Notifica U.R.V.</h4><p>La Camera del Commercio notifica l\'U.R.V., che aggiorna i fascicoli delle Patenti di ciascun socio.</p></div>'
  + '</div>'

  + '<h4 style="font-family:\'Cinzel\',serif;color:rgba(200,155,60,.7);font-size:10px;letter-spacing:.12em;text-transform:uppercase;margin:20px 0 10px">2.3 Struttura Interna Obbligatoria</h4>'
  + _slTableWrap('<table class="cmp-table">'
  + '<thead><tr><th>Ruolo</th><th>Funzioni e Responsabilità</th></tr></thead>'
  + '<tbody>'
  + '<tr><td>Responsabile</td><td>Firma l\'Atto Costitutivo. Rappresenta legalmente l\'Impresa davanti all\'U.R.V. e alla Camera del Commercio. In caso di infrazioni, risponde personalmente in prima istanza.</td></tr>'
  + '<tr><td>Resp. Finanziario</td><td>Gestisce la cassa comune, tiene il Registro delle Entrate e Uscite. Può coincidere col Responsabile in Imprese con meno di 3 soci.</td></tr>'
  + '<tr><td>Mastro Artigiano</td><td>Il socio col livello di mestiere più alto. Coordina la produzione, approva l\'uso dei materiali vincolati, firma il Libretto degli Acquisti per conto dell\'Impresa.</td></tr>'
  + '<tr><td>Soci Ordinari</td><td>Contribuiscono con Downtime, risorse e competenze. Partecipano ai profitti secondo le quote stabilite nell\'Atto Costitutivo.</td></tr>'
  + '<tr><td>Apprendisti (opz.)</td><td>PG con Mestiere LV1 o NPC assunti. Non possono firmare documenti legali. Max 2 per ogni socio con P.O.E., max 1 per ogni socio con P.M.T./P.A.S.V.</td></tr>'
  + '</tbody></table>')
  + '</div>';
  },

  fondazione: function() { return ''
  + '<div class="cmp-guide-section">'
  + _slSectionTitle('📜', '4.2 Ingresso e Uscita dei Soci')
  + _slTableWrap('<table class="cmp-table">'
  + '<thead><tr><th>Evento</th><th>Procedura</th></tr></thead>'
  + '<tbody>'
  + '<tr><td>Ingresso nuovo socio</td><td>Voto favorevole di almeno 2/3 dei soci esistenti. Aggiornamento dell\'Atto Costitutivo presso la Camera del Commercio (costo: <strong style="color:rgba(200,155,60,.9)">20 Mo</strong>). Il nuovo socio porta la propria Patente.</td></tr>'
  + '<tr><td>Uscita volontaria</td><td>Il socio uscente deve comunicarlo formalmente con <strong style="color:rgba(200,155,60,.9)">30 giorni di preavviso</strong>. Riceve la sua quota dalla cassa comune (al netto dei debiti). L\'Atto viene aggiornato.</td></tr>'
  + '<tr><td>Espulsione</td><td>Voto unanime degli altri soci, motivato da: infrazione grave, revoca della Patente, mancato contributo per 2+ mesi. Il socio espulso perde la quota solo se indicato nell\'Atto.</td></tr>'
  + '<tr><td>Morte / Assenza prolungata</td><td>Dopo 6 mesi di assenza non giustificata, i restanti soci possono richiedere alla Camera del Commercio la rimozione del socio. La sua quota viene distribuita proporzionalmente.</td></tr>'
  + '<tr><td>Scioglimento consensuale</td><td>Voto unanime. L\'Impresa viene cancellata dal Registro. La cassa viene divisa per quote. I debiti verso l\'U.R.V. e la Camera vengono saldati prima.</td></tr>'
  + '</tbody></table>')
  + '</div>';
  },

  tipologie: function() { return ''
  + '<div class="cmp-guide-section">'
  + _slSectionTitle('⚒️', '3. Tipologie di Impresa')
  + '<p style="color:rgba(200,155,60,.4);font-size:14px;margin-bottom:20px;font-style:italic">Non tutte le Imprese sono uguali: il tipo dipende dai mestieri esercitati e dalle Patenti possedute.</p>'
  + '<div class="sl-impresa-card">'
  + '<div class="sl-impresa-header"><h3>Bottega Artigiana</h3><span class="sl-patente-badge sl-pat-pmc">P.M.C.</span></div>'
  + '<div class="sl-impresa-body"><div class="info-block"><p><strong>Tassa:</strong> 75 Mo + struttura LV1</p><p style="margin-top:4px"><strong>Mestieri:</strong> Oste · Falegname · Sarto · Artista</p><p style="margin-top:4px"><strong>Produzione:</strong> Beni comuni, cibo, abiti, armi in legno, opere d\'arte</p><h5 style="margin-top:12px">Benefici</h5><ul class="sl-benefit-list"><li>Accesso ai mercati comunali di Arcadia senza commissione extra.</li><li>Sconto del 10% sull\'acquisto di materie prime ordinarie (min. 100 Mo).</li><li>Priorità nelle commesse pubbliche di basso livello (fino a 200 Mo).</li></ul></div><div class="info-block"><h5>Limiti</h5><ul class="sl-limit-list"><li>Non può produrre né vendere oggetti magici senza upgrade a Bottega Tecnica.</li><li>Massimo 2 apprendisti NPC per Impresa.</li></ul></div></div>'
  + '</div>'
  + '<div class="sl-impresa-card">'
  + '<div class="sl-impresa-header"><h3>Officina Tecnica</h3><span class="sl-patente-badge sl-pat-pmt">P.M.T. (almeno 1 socio)</span></div>'
  + '<div class="sl-impresa-body"><div class="info-block"><p><strong>Tassa:</strong> 150 Mo + struttura LV1 + Forgia o strumento equivalente</p><p style="margin-top:4px"><strong>Mestieri:</strong> Metallurgo · Artigiano · Architetto</p><p style="margin-top:4px"><strong>Produzione:</strong> Armi, armature, strutture, oggetti magici Comuni, documenti legali</p><h5 style="margin-top:12px">Benefici</h5><ul class="sl-benefit-list"><li>Contratti preferenziali con i fornitori di metalli e cristalli del Marchesato.</li><li>Accesso ai bandi di gara militari (commesse fino a 2.000 Mo).</li><li>Diritto a esporre il Timbro Imperiale (+15% valore percepito).</li><li>Un socio con P.M.T. può assumere fino a 2 apprendisti PG.</li></ul></div><div class="info-block"><h5>Limiti</h5><ul class="sl-limit-list"><li>La produzione di armi in serie (10+/mese) richiede dichiarazione mensile all\'U.R.V.</li><li>Ogni struttura costruita per conto terzi deve essere registrata con numero di progetto.</li></ul></div></div>'
  + '</div>'
  + '<div class="sl-impresa-card">'
  + '<div class="sl-impresa-header"><h3>Studio Alchemico</h3><span class="sl-patente-badge sl-pat-pasv">P.A.S.V. (almeno 1 socio)</span></div>'
  + '<div class="sl-impresa-body"><div class="info-block"><p><strong>Tassa:</strong> 200 Mo + struttura LV1 + Stanza degli Esperimenti o equivalente</p><p style="margin-top:4px"><strong>Mestieri:</strong> Alchimista · Artigiano Hextech</p><p style="margin-top:4px"><strong>Produzione:</strong> Pozioni, veleni registrati, inchiostri magici, componenti Hextech</p><h5 style="margin-top:12px">Benefici</h5><ul class="sl-benefit-list"><li>Libretto degli Acquisti Collettivo: un unico Libretto per tutta l\'Impresa.</li><li>Limite di acquisto inchiostri aumentato del 30%.</li><li>Accesso al Catalogo Riservato dei Reagenti dell\'U.R.V. (prezzi calmierati).</li><li>Possibilità di contratti di fornitura continuativa con ospedali e società militari.</li></ul></div><div class="info-block"><h5>Limiti</h5><ul class="sl-limit-list"><li>Ispezione U.R.V. obbligatoria ogni 6 mesi.</li><li>Il Mastro Artigiano risponde penalmente di ogni sostanza prodotta.</li><li>Produzione di veleni vietata senza registro firmato per ogni vendita.</li></ul></div></div>'
  + '</div>'
  + '<div class="sl-impresa-card">'
  + '<div class="sl-impresa-header"><h3>Bottega Mastrale</h3><span class="sl-patente-badge sl-pat-poe">P.O.E. (almeno 1 socio)</span></div>'
  + '<div class="sl-impresa-body"><div class="info-block"><p><strong>Tassa:</strong> 400 Mo + struttura LV2 minima</p><p style="margin-top:4px"><strong>Mestieri:</strong> Tutti i mestieri (LV4+)</p><p style="margin-top:4px"><strong>Produzione:</strong> Oggetti magici Rari e Molto Rari, commesse della Corte, opere numerate</p><h5 style="margin-top:12px">Benefici</h5><ul class="sl-benefit-list"><li>Accesso esclusivo ai bandi della Corte del Marchesato (nessun limite di valore).</li><li>Certificati di autenticità con sigillo della Camera del Commercio (+25% valore).</li><li>Titolo collettivo di Manifattura d\'Eccellenza di Arcadia.</li><li>Accesso all\'Archivio Tecnico Segreto dell\'U.R.V.</li><li>Fino a 3 apprendisti PG per ogni socio con P.O.E.</li></ul></div><div class="info-block"><h5>Limiti</h5><ul class="sl-limit-list"><li>Ogni opera Rara deve essere numerata e registrata singolarmente.</li><li>Ispezione U.R.V. annuale obbligatoria senza preavviso.</li><li>Revoca automatica se nessun socio mantiene la P.O.E. attiva.</li></ul></div></div>'
  + '</div>'
  + '<div class="sl-impresa-card">'
  + '<div class="sl-impresa-header"><h3>Impresa Mista</h3><span class="sl-patente-badge sl-pat-mista">Combinazione di patenti diverse</span></div>'
  + '<div class="sl-impresa-body"><div class="info-block"><p><strong>Tassa:</strong> Somma delle tasse dei mestieri coinvolti + 50 Mo di coordinamento</p><p style="margin-top:4px"><strong>Mestieri:</strong> Combinazione libera (es. Metallurgo + Alchimista + Artista)</p><p style="margin-top:4px"><strong>Produzione:</strong> Dipende dai mestieri: ogni socio produce solo ciò che la sua Patente consente</p><h5 style="margin-top:12px">Benefici</h5><ul class="sl-benefit-list"><li>Possibilità di coprire l\'intera filiera produttiva.</li><li>Sinergia di mestieri (es. Falegname + Metallurgo → carrozze armate).</li><li>Accesso ai bandi inter-categoriali del Marchesato (commesse miste, alto valore).</li></ul></div><div class="info-block"><h5>Limiti</h5><ul class="sl-limit-list"><li>Ogni socio risponde individualmente per la propria Patente.</li><li>La produzione multi-mestiere deve documentare il contributo di ogni socio.</li><li>L\'U.R.V. può sospendere l\'intera Impresa anche per il reato di un solo socio.</li></ul></div></div>'
  + '</div>'
  + '</div>';
  },

  gestione: function() { return ''
  + '<div class="cmp-guide-section">'
  + _slSectionTitle('💰', '4. Gestione Economica dell\'Impresa')

  + '<h4 style="font-family:\'Cinzel\',serif;color:rgba(200,155,60,.7);font-size:10px;letter-spacing:.12em;text-transform:uppercase;margin-bottom:10px">4.1 Cassa Comune e Quote</h4>'
  + '<p style="color:rgba(200,155,60,.4);font-size:14px;margin-bottom:12px;font-style:italic">Ogni Impresa deve tenere un Registro delle Entrate e Uscite aggiornato. L\'U.R.V. può richiederne la visione in qualsiasi momento.</p>'
  + _slTableWrap('<table class="cmp-table">'
  + '<thead><tr><th>Voce</th><th>Regola</th></tr></thead>'
  + '<tbody>'
  + '<tr><td>Quote di partecipazione</td><td>Stabilite nell\'Atto Costitutivo. Possono essere uguali (es. 50/50) o proporzionali al contributo (Downtime, materiali, capitale). <strong style="color:rgba(200,155,60,.9)">Non modificabili senza nuovo Atto.</strong></td></tr>'
  + '<tr><td>Distribuzione profitti</td><td>Proporzionale alle quote. Avviene su base mensile o a discrezione dei soci, previa riunione formale. Deve essere documentata nel Registro Finanziario.</td></tr>'
  + '<tr><td>Spese comuni</td><td>Manutenzione sede, acquisto materiali, tasse e licenze, stipendi apprendisti NPC. Pagate dalla cassa comune.</td></tr>'
  + '<tr><td>Fondo di Riserva</td><td>Obbligatorio: almeno il <strong style="color:rgba(200,155,60,.9)">10% dei profitti mensili</strong> viene accantonato. Serve per coprire sanzioni, riparazioni urgenti o periodi di inattività.</td></tr>'
  + '<tr><td>Tasse alla Camera</td><td><strong style="color:rgba(200,155,60,.9)">1% del fatturato mensile</strong> dichiarato, versato trimestralmente. Esenzione per i primi 3 mesi dalla fondazione.</td></tr>'
  + '<tr><td>Dichiarazione annuale</td><td>Ogni anno il Responsabile Finanziario presenta alla Camera del Commercio un rendiconto del fatturato. <strong style="color:rgba(200,155,60,.9)">Falsa dichiarazione = sanzione grave.</strong></td></tr>'
  + '</tbody></table>')
  + '</div>';
  },

  sede: function() { return ''
  + '<div class="cmp-guide-section">'
  + _slSectionTitle('🏗️', '5. Sede Fisica — Strutture e Upgrade')
  + '<p style="color:rgba(220,200,160,.7);font-size:15px;margin-bottom:20px;line-height:1.6">Ogni Impresa deve avere una sede fisica costruita da un Architetto. La sede non è solo un requisito burocratico: le strutture costruite al suo interno danno <strong style="color:rgba(200,155,60,.9)">bonus produttivi concreti</strong>. L\'upgrade della sede è quindi un investimento strategico.</p>'

  + '<h4 style="font-family:\'Cinzel\',serif;color:rgba(200,155,60,.7);font-size:10px;letter-spacing:.12em;text-transform:uppercase;margin-bottom:12px">5.1 Strutture Base (LV1 Architetto)</h4>'
  + '<div class="sl-strutt-grid">'
  + '<div class="sl-strutt-card"><h5>Magazzino</h5><div class="strutt-cost">💰 150 Mo</div><p>Capacità di stoccaggio materiali fino a 500 Mo di valore. Riduce i tempi di approvvigionamento.</p></div>'
  + '<div class="sl-strutt-card"><h5>Cucina</h5><div class="strutt-cost">💰 70 Mo</div><p>Permette all\'Oste di produrre ricette. Necessità carbone (4 Mo/settimana).</p></div>'
  + '<div class="sl-strutt-card"><h5>Orto</h5><div class="strutt-cost">💰 80 Mo</div><p>Produce 15 Mo di erbe al mese (8h DT semina + 8h DT raccolta). Max 2 per sede.</p></div>'
  + '<div class="sl-strutt-card"><h5>Stalla</h5><div class="strutt-cost">💰 70 Mo</div><p>Contenitore per fino a 5 animali da trasporto/lavoro. Riduce i costi di consegna.</p></div>'
  + '<div class="sl-strutt-card"><h5>Scantinato</h5><div class="strutt-cost">💰 100 Mo</div><p>Conservazione indefinita delle cibarie. Ideale per Oste e Alchimista.</p></div>'
  + '<div class="sl-strutt-card"><h5>Recinzione / Mura</h5><div class="strutt-cost">💰 70–200 Mo</div><p>Protegge la sede da intrusioni. Le Mura LV2 richiedono un Architetto LV2.</p></div>'
  + '</div>'

  + '<h4 style="font-family:\'Cinzel\',serif;color:rgba(200,155,60,.7);font-size:10px;letter-spacing:.12em;text-transform:uppercase;margin:20px 0 8px">5.2 Strutture Avanzate (LV2 Architetto) — Bonus Meccanici</h4>'
  + '<p style="color:rgba(200,155,60,.4);font-size:14px;margin-bottom:14px;font-style:italic">Le strutture LV2 sblocano bonus meccanici permanenti per la classe del personaggio, utilizzabili una volta per Riposo Lungo.</p>'
  + '<div class="sl-strutt-grid">'
  + '<div class="sl-strutt-card lv2"><h5>Forgia Noxiana</h5><div class="strutt-cost">💰 250 Mo</div><p>Riparazioni armature/armi a Riposo Breve. +2 danni contro strutture per 24h.</p></div>'
  + '<div class="sl-strutt-card lv2"><h5>Torre Difensiva</h5><div class="strutt-cost">💰 250 Mo</div><p>Torretta automatica: Azione Bonus, +6 a colpire, 2d6 fulmine (60/120 ft).</p></div>'
  + '<div class="sl-strutt-card lv2"><h5>Cucina Professionale</h5><div class="strutt-cost">💰 Upgrade +75 Mo</div><p>Sblocca ricette Oste LV2+. Carbone 8 Mo/settimana.</p></div>'
  + '<div class="sl-strutt-card lv2"><h5>Covo Arcano</h5><div class="strutt-cost">💰 250 Mo</div><p>Mago: d4 extra a Intelligenza(Arcano), +1 CD e TS incantesimi.</p></div>'
  + '<div class="sl-strutt-card lv2"><h5>Altare del Devoto</h5><div class="strutt-cost">💰 250 Mo</div><p>Paladino: +1 ai colpire, d4 Carisma in aura (CD 20 − livello Paladino).</p></div>'
  + '<div class="sl-strutt-card lv2"><h5>Sala della Musica</h5><div class="strutt-cost">💰 250 Mo</div><p>Bardo: Dadi Ispirazione ritirati se 1–2. +1 colpire/TS incantesimi.</p></div>'
  + '<div class="sl-strutt-card lv2"><h5>Stanza degli Esperimenti</h5><div class="strutt-cost">💰 250 Mo</div><p>Artefice: d4 extra agli strumenti, +1 colpire/TS incantesimi.</p></div>'
  + '<div class="sl-strutt-card lv2"><h5>Campo di Addestramento</h5><div class="strutt-cost">💰 250 Mo</div><p>Guerriero/Barbaro: d4 contro Spaventato, +1 colpire/TS abilità di classe.</p></div>'
  + '<div class="sl-strutt-card lv2"><h5>Covo del Fuorilegge</h5><div class="strutt-cost">💰 250 Mo</div><p>Ladro: d4 Iniziativa, d4 Strumenti da Scasso, +1 colpire e danni.</p></div>'
  + '</div>'
  + '<div class="sl-guide-note">⚠ <strong>Nota:</strong> Le strutture LV2 sono accessibili solo alle Imprese con almeno un socio Architetto LV2+. Ogni struttura conta come una stanza separata della sede. Il costo indicato è il costo dei <strong style="color:rgba(200,155,60,.9)">materiali</strong>: il Downtime di costruzione è a carico dell\'Architetto.</div>'
  + '</div>';
  },

  gilda: function() { return ''
  + '<div class="cmp-guide-section">'
  + _slSectionTitle('🏛️', '6. Costituzione di una Società')
  + '<p style="color:rgba(220,200,160,.7);font-size:15px;margin-bottom:16px;line-height:1.6">Una Società è il passo successivo: non più una singola Impresa, ma un\'organizzazione che raggruppa più artigiani o Imprese sotto un simbolo comune. Le Società sono riconosciute dal Marchesato e godono di <strong style="color:rgba(200,155,60,.9)">privilegi esclusivi</strong>, ma sono sottoposte a controlli più stringenti.</p>'

  + '<h4 style="font-family:\'Cinzel\',serif;color:rgba(200,155,60,.7);font-size:10px;letter-spacing:.12em;text-transform:uppercase;margin-bottom:10px">6.1 Requisiti di Fondazione</h4>'
  + _slTableWrap('<table class="cmp-table">'
  + '<thead><tr><th>Requisito</th><th>Dettaglio</th></tr></thead>'
  + '<tbody>'
  + '<tr><td>Imprese Affiliate</td><td>Minimo 3 Imprese registrate (o 5 artigiani indipendenti con Patente). Almeno una deve avere soci con P.M.T. o superiore.</td></tr>'
  + '<tr><td>Sede della Società</td><td>Struttura LV2 dedicata, non condivisa con le Imprese affiliate. Costruita ex-novo o acquistata.</td></tr>'
  + '<tr><td>Statuto di Società</td><td>Documento con: nome, emblema, categoria, norme interne, quote mensili delle affiliate, regole di espulsione.</td></tr>'
  + '<tr><td>Approvazione U.R.V.</td><td>A differenza delle Imprese, la Società richiede l\'approvazione esplicita dell\'U.R.V. Una commissione di 3 funzionari esamina lo Statuto entro <strong style="color:rgba(200,155,60,.9)">30 giorni</strong>.</td></tr>'
  + '<tr><td>Tassa di Fondazione</td><td><strong style="color:rgba(200,155,60,.9)">200 Mo</strong> una tantum + <strong style="color:rgba(200,155,60,.9)">10 Mo mensili</strong> (Fondo di Categoria). Include: emissione del Sigillo di Società in argento incantato.</td></tr>'
  + '<tr><td>Cauzione di Società</td><td><strong style="color:rgba(200,155,60,.9)">500 Mo</strong> trattenuti dall\'U.R.V. come garanzia collettiva. Restituiti allo scioglimento regolare.</td></tr>'
  + '</tbody></table>')

  + '<h4 style="font-family:\'Cinzel\',serif;color:rgba(200,155,60,.7);font-size:10px;letter-spacing:.12em;text-transform:uppercase;margin:20px 0 10px">6.2 Gradi Interni della Società</h4>'
  + '<p style="color:rgba(200,155,60,.4);font-size:14px;margin-bottom:12px;font-style:italic">Ogni Società ha una gerarchia interna formale, riconosciuta dalla Camera del Commercio.</p>'
  + _slTableWrap('<table class="cmp-table">'
  + '<thead><tr><th>Grado</th><th>Requisito</th><th>Privilegi e Doveri</th></tr></thead>'
  + '<tbody>'
  + '<tr class="sl-row-app"><td>Apprendista</td><td>Mestiere LV1</td><td>Accesso alla sede e ai materiali comuni. Nessun voto nelle riunioni. Quota: <strong style="color:rgba(200,155,60,.9)">5 Mo/mese</strong>.</td></tr>'
  + '<tr class="sl-row-art"><td>Artigiano</td><td>Mestiere LV2 + P.M.C.</td><td>Voto consultivo nelle riunioni. Accesso ai bandi della Società. Quota: <strong style="color:rgba(200,155,60,.9)">15 Mo/mese</strong>.</td></tr>'
  + '<tr class="sl-row-mst"><td>Mastro</td><td>Mestiere LV3 + P.M.T. o P.A.S.V.</td><td>Voto deliberativo. Può proporre cambiamenti allo Statuto. Accesso a commesse riservate. Quota: <strong style="color:rgba(200,155,60,.9)">30 Mo/mese</strong>.</td></tr>'
  + '<tr class="sl-row-gran"><td>Gran Mastro</td><td>Mestiere LV4 + P.O.E.</td><td>Uno per Società. Eletto dai Mastri. Rappresenta la Società davanti al Marchesato. Quota: <strong style="color:rgba(200,155,60,.9)">0</strong> (esentato, ma dedica 1 DT/mese alla Società).</td></tr>'
  + '<tr class="sl-row-on"><td>Membro Onorario</td><td>Assegnato dal Gran Mastro</td><td>Titolo onorifico senza doveri. Può consultare l\'Archivio della Società. Nessuna quota.</td></tr>'
  + '</tbody></table>')

  + '<h4 style="font-family:\'Cinzel\',serif;color:rgba(200,155,60,.7);font-size:10px;letter-spacing:.12em;text-transform:uppercase;margin:20px 0 10px">6.3 Società Riconosciute di Arcadia</h4>'
  + '<div class="sl-gilde-table">'
  + _slTableWrap('<table class="cmp-table">'
  + '<thead><tr><th>Nome Società</th><th>Mestieri Primari</th><th>Ruolo nel Marchesato</th></tr></thead>'
  + '<tbody>'
  + '<tr><td>Società dei Fabbri e Corazzai</td><td>Metallurgo · Artigiano</td><td style="color:rgba(220,200,160,.7)">Forniture militari, armature su commissione, manutenzione arsenale cittadino.</td></tr>'
  + '<tr><td>Società delle Spezie e dei Veleni</td><td>Alchimista</td><td style="color:rgba(220,200,160,.7)">Fornitura ospedali, commercio di pozioni, controllo del mercato nero alchemico.</td></tr>'
  + '<tr><td>Società dei Costruttori</td><td>Architetto · Falegname</td><td style="color:rgba(220,200,160,.7)">Opere pubbliche, edifici civili, manutenzione delle mura cittadine.</td></tr>'
  + '<tr><td>Società dei Tessitori e Pellicciai</td><td>Sarto</td><td style="color:rgba(220,200,160,.7)">Abiti nobiliari, armature leggere, forniture per le cerimonie di Corte.</td></tr>'
  + '<tr><td>Società degli Scribi e Cartografi</td><td>Artista</td><td style="color:rgba(220,200,160,.7)">Mappe ufficiali, pergamene legali, archivio storico del Marchesato.</td></tr>'
  + '<tr><td>Società dell\'Osteria e del Gusto</td><td>Oste</td><td style="color:rgba(220,200,160,.7)">Standard gastronomici, taverne certificate, forniture per banchetti della Corte.</td></tr>'
  + '<tr><td>Società delle Arti Combinate</td><td>Mista (tutte le categorie)</td><td style="color:rgba(220,200,160,.7)">Commesse multidisciplinari, grandi opere che richiedono più mestieri.</td></tr>'
  + '</tbody></table>')
  + '</div>'
  + '</div>';
  },

  benefici: function() { return ''
  + '<div class="cmp-guide-section">'
  + _slSectionTitle('✦', '7. Benefici Esclusivi delle Società')
  + '<div class="sl-card-grid">'
  + '<div class="sl-card gold-border"><h4>🏆 Monopolio di Categoria</h4><p>La Società può richiedere all\'U.R.V. un <strong style="color:rgba(200,155,60,.9)">Privilegio di Settore</strong>: per 1 anno, le commesse pubbliche di quel tipo vengono assegnate preferenzialmente alle Imprese affiliate. Costo: 100 Mo + voto del Consiglio.</p></div>'
  + '<div class="sl-card gold-border"><h4>📚 Archivio della Società</h4><p>Le Società riconosciute mantengono un archivio di Progetti (ricette, schemi, planimetrie). I membri possono studiarli riducendo del <strong style="color:rgba(200,155,60,.9)">50% il costo in Mo e DT</strong> per imparare un Progetto.</p></div>'
  + '<div class="sl-card gold-border"><h4>🤝 Fondo di Solidarietà</h4><p>Se un\'Impresa affiliata subisce una sanzione grave, il Fondo di Categoria può coprire fino al <strong style="color:rgba(200,155,60,.9)">40% della multa</strong>, a discrezione del Gran Mastro e previo voto dei Mastri.</p></div>'
  + '<div class="sl-card gold-border"><h4>🔖 Certificazione di Qualità</h4><p>Un\'opera marcheggiata col Sigillo di Società vale il <strong style="color:rgba(200,155,60,.9)">+20% sul mercato</strong>. Il Gran Mastro può revocare il diritto al Sigillo a un\'Impresa che abbassa la qualità.</p></div>'
  + '<div class="sl-card gold-border"><h4>📰 Rete di Informazioni</h4><p>Le Società hanno accesso a informazioni di mercato privilegiate: prezzi all\'ingrosso, arrivi di materie prime, nuovi bandi del Marchesato. I membri ricevono un <strong style="color:rgba(200,155,60,.9)">Bollettino mensile</strong>.</p></div>'
  + '<div class="sl-card gold-border"><h4>🏛️ Rappresentanza al Consiglio</h4><p>Ogni Società riconosciuta ha un seggio nel <strong style="color:rgba(200,155,60,.9)">Consiglio dei Mercanti di Arcadia</strong>. Il Gran Mastro partecipa alle riunioni mensili sulle politiche commerciali.</p></div>'
  + '<div class="sl-card gold-border"><h4>⚖️ Protezione Legale Collettiva</h4><p>Se un membro viene accusato ingiustamente, la Società può fornire un <strong style="color:rgba(200,155,60,.9)">Avvocato del Marchesato</strong> (costo coperto dal Fondo di Categoria) e testimoniare davanti all\'U.R.V.</p></div>'
  + '</div>'
  + '</div>';
  },

  sanzioni: function() { return ''
  + '<div class="cmp-guide-section">'
  + _slSectionTitle('⚠️', '8. Sanzioni Specifiche per Imprese e Società')
  + '<p style="color:rgba(200,155,60,.4);font-size:14px;margin-bottom:14px;font-style:italic">Le sanzioni del Codice delle Patenti si applicano ai singoli artigiani. Quelle qui elencate si applicano invece all\'Impresa o alla Società come entità giuridica.</p>'
  + _slTableWrap('<table class="cmp-table">'
  + '<thead><tr><th>Gravità</th><th>Infrazione</th><th>Sanzione</th></tr></thead>'
  + '<tbody>'
  + '<tr class="sl-sanz-lieve"><td>Lieve</td><td>Mancata dichiarazione annuale. Ritardo tassa trimestrale (fino a 30 gg). Timbro d\'Impresa non apposto su un\'opera.</td><td>Multa: <strong style="color:rgba(200,155,60,.9)">50 Mo</strong>. Obbligo di regolarizzazione entro 15 giorni.</td></tr>'
  + '<tr class="sl-sanz-grave"><td>Grave</td><td>Falsa dichiarazione di fatturato. Utilizzo del Timbro dopo la scadenza. Produzione oltre il livello delle Patenti. Socio non registrato che esercita come socio.</td><td>Multa: <strong style="color:rgba(200,155,60,.9)">200 Mo</strong>. Sospensione 3 mesi. Revisione dell\'Atto Costitutivo obbligatoria.</td></tr>'
  + '<tr class="sl-sanz-graviss"><td>Gravissima</td><td>Frode ai danni del Marchesato. Produzione di materiali vietati. Protezione di un socio con Patente revocata.</td><td>Scioglimento coatto. Confisca della cassa comune. Tutti i soci ricevono il 2° Sigillo Spezzato. Il Responsabile riceve il 3°.</td></tr>'
  + '<tr class="sl-sanz-gilda-g"><td>Società — Grave</td><td>Società che copre infrazioni di una Impresa affiliata. Uso del Sigillo su opere non qualificate. Mancato pagamento Fondo Categoria per 3+ mesi.</td><td>Multa: <strong style="color:rgba(200,155,60,.9)">500 Mo</strong>. Sospensione Sigillo 6 mesi. Il Gran Mastro riceve il 1° Sigillo Spezzato.</td></tr>'
  + '<tr class="sl-sanz-gilda-r"><td>Società — Revoca</td><td>Gestione sistematica di attività illegali. Coinvolgimento in eversione contro il Marchesato.</td><td>Scioglimento coatto. Cauzione 500 Mo confiscata. Tutte le Imprese affiliate perdono i benefici e vengono revisionate singolarmente.</td></tr>'
  + '</tbody></table>')
  + '</div>';
  },

  costi: function() { return ''
  + '<div class="cmp-guide-section">'
  + _slSectionTitle('🪙', '9. Riepilogo Costi di Fondazione')
  + _slTableWrap('<table class="cmp-table">'
  + '<thead><tr><th>Ente</th><th>Tassa una tantum</th><th>Struttura Minima</th><th>Ricorrente</th></tr></thead>'
  + '<tbody>'
  + '<tr class="sl-row-pmc"><td>Bottega Artigiana (P.M.C.)</td><td>75 Mo</td><td>LV1 (es. Magazzino 150 Mo)</td><td>Tassa 1%/mese</td></tr>'
  + '<tr class="sl-row-pmt"><td>Officina Tecnica (P.M.T.)</td><td>150 Mo</td><td>LV1 + Forgia (400+ Mo)</td><td>Tassa 1%/mese</td></tr>'
  + '<tr class="sl-row-pasv"><td>Studio Alchemico (P.A.S.V.)</td><td>200 Mo</td><td>LV1 + Stanza Esp. (400+ Mo)</td><td>Tassa 1%/mese</td></tr>'
  + '<tr class="sl-row-poe"><td>Bottega Mastrale (P.O.E.)</td><td>400 Mo</td><td>LV2 minima (700+ Mo)</td><td>Tassa 1%/mese</td></tr>'
  + '<tr><td style="color:rgba(160,112,200,.8)">Impresa Mista</td><td>Somma patenti + 50 Mo</td><td>LV1 (adeguata ai mestieri)</td><td>Tassa 1%/mese</td></tr>'
  + '<tr class="sl-row-gran"><td>Società (qualsiasi categoria)</td><td>200 Mo + 500 Mo cauzione</td><td>LV2 dedicata (700+ Mo)</td><td>10 Mo/mese fisso + 1%</td></tr>'
  + '</tbody></table>')
  + '<div class="sl-guide-note">⚠ <strong>Nota:</strong> Il costo delle strutture riportato è il costo dei <strong style="color:rgba(200,155,60,.9)">materiali</strong>. Il Downtime di costruzione è a carico dell\'Architetto socio (o commissionato a un Architetto esterno). La tassa dell\'1% mensile si applica al <strong style="color:rgba(200,155,60,.9)">fatturato dichiarato</strong>, non ai profitti.</div>'
  + '</div>';
  },
};

// ═══════════════════════════════════════════════
//  DATA — RENDER LICENZE
// ═══════════════════════════════════════════════

var _slRenderLicenze = {

  panoramica: function() { return ''
  + '<div class="sl-page-hero licenze">'
  + '<h2>⚖️ Codice Patenti di Arcadia<br><small style="font-size:.55em;color:rgba(200,155,60,.4);letter-spacing:.08em">Ufficio del Registro e della Vigilanza (U.R.V.) — Regno di Arcadia</small></h2>'
  + '<p>Il presente sistema regola l\'esercizio dei mestieri, la compravendita di manufatti e l\'uso di sostanze speciali nel Regno. Ogni licenza ha una <strong style="color:rgba(200,155,60,.9)">durata triennale</strong> e il possesso del <strong style="color:rgba(200,155,60,.9)">Sigillo di Riconoscimento</strong> (medaglione incantato) garantisce lo status legale dell\'artigiano.</p>'
  + '</div>';
  },

  vantaggi: function() { return ''
  + '<div class="cmp-guide-section">'
  + _slSectionTitle('✦', 'Vantaggi Generali del Licenziatario')
  + '<p style="color:rgba(220,200,160,.7);font-size:15px;margin-bottom:16px">Il possesso di una patente valida offre benefici immediati a ogni cittadino di Arcadia:</p>'
  + '<div class="sl-card-grid">'
  + '<div class="sl-card"><h4>🛡️ Protezione Legale</h4><p>Intervento prioritario della Guardia cittadina in caso di truffe o controversie commerciali.</p></div>'
  + '<div class="sl-card"><h4>📋 Accesso ai Grandi Appalti</h4><p>Solo i licenziatari possono partecipare a commesse statali superiori alle <strong style="color:rgba(200,155,60,.9)">1.000 Mo</strong>.</p></div>'
  + '<div class="sl-card"><h4>⭐ Prestigio Professionale</h4><p>Vantaggio alle prove di <strong style="color:rgba(200,155,60,.9)">Persuasione</strong> legate al proprio mestiere mostrando il Sigillo.</p></div>'
  + '<div class="sl-card"><h4>🏥 Assicurazione Statale</h4><p>Copertura del <strong style="color:rgba(200,155,60,.9)">30% dei danni</strong> in caso di incidenti documentati in laboratorio.</p></div>'
  + '<div class="sl-card"><h4>🏠 Diritto di Bottega</h4><p>Esenzione dai controlli arbitrari e diritto di esporre l\'insegna ufficiale.</p></div>'
  + '</div>'
  + '</div>';
  },

  quadro: function() { return ''
  + '<div class="cmp-guide-section">'
  + _slSectionTitle('📋', 'Quadro Generale delle Patenti')
  + _slTableWrap('<table class="cmp-table">'
  + '<thead><tr><th>Sigla</th><th>Denominazione</th><th style="text-align:right">Costo (3 anni)</th><th style="text-align:right">Cauzione</th><th style="text-align:right">Totale</th></tr></thead>'
  + '<tbody>'
  + '<tr class="sl-row-pmc"><td>P.M.C.</td><td>Manifattura Comune</td><td style="text-align:right">40 Mo</td><td style="text-align:right">10 Mo</td><td style="text-align:right"><strong style="color:rgba(200,155,60,.9)">50 Mo</strong></td></tr>'
  + '<tr class="sl-row-pmt"><td>P.M.T.</td><td>Manifattura Tecnica</td><td style="text-align:right">85 Mo</td><td style="text-align:right">25 Mo</td><td style="text-align:right"><strong style="color:rgba(200,155,60,.9)">110 Mo</strong></td></tr>'
  + '<tr class="sl-row-pasv"><td>P.A.S.V.</td><td>Alchimia e Sostanze Vincolate</td><td style="text-align:right">140 Mo</td><td style="text-align:right">40 Mo</td><td style="text-align:right"><strong style="color:rgba(200,155,60,.9)">180 Mo</strong></td></tr>'
  + '<tr class="sl-row-poe"><td>P.O.E.</td><td>Opere Eccezionali</td><td style="text-align:right">300 Mo</td><td style="text-align:right">100 Mo</td><td style="text-align:right"><strong style="color:rgba(200,155,60,.9)">400 Mo</strong></td></tr>'
  + '</tbody></table>')
  + '</div>';
  },

  pmc: function() { return ''
  + '<div class="sl-licenza-card" style="border-color:rgba(96,184,64,.4)">'
  + '<div class="sl-licenza-header" style="background:rgba(96,184,64,.05)">'
  + '<h3 style="color:rgba(96,184,64,.9)">🟢 P.M.C. — Manifattura Comune</h3>'
  + '<p class="lh-meta">Costo: 40 Mo · Cauzione: 10 Mo · <strong style="color:rgba(220,200,160,.7)">Totale: 50 Mo</strong> · Durata: 3 anni</p>'
  + '<p class="lh-meta" style="margin-top:4px">Ideale per: Osti, Sarti, Falegnami e Artisti.</p>'
  + '</div>'
  + '<div class="sl-licenza-body">'
  + '<div class="sl-licenza-block"><h5>✦ Permessi</h5><ul><li>Vendita di beni comuni (cibo, abiti, mobili, arte non magica).</li><li>Commesse fino a <strong style="color:rgba(200,155,60,.9)">500 Mo</strong>.</li></ul></div>'
  + '<div class="sl-licenza-block"><h5>📦 Materiali</h5><ul><li>Acquisto libero di materie prime ordinarie.</li><li>Alcol fino al Grado II.</li></ul></div>'
  + '<div class="sl-licenza-block"><h5>⚠ Limiti</h5><ul><li>Divieto assoluto di produrre veleni o sostanze alchemiche pure.</li></ul></div>'
  + '</div>'
  + '<div class="sl-guide-note" style="margin:0 24px 20px">⚠ <strong>Nota:</strong> Ciò che il licenziatario può craftare e vendere è sempre limitato dal <strong style="color:rgba(200,155,60,.9)">livello del mestiere</strong> posseduto: la Patente abilita all\'esercizio dell\'attività, ma non sblocca da sola le ricette o gli oggetti di livello superiore. Mestiere e Patente avanzano di pari passo.</div>'
  + '</div>';
  },

  pmt: function() { return ''
  + '<div class="sl-licenza-card" style="border-color:rgba(90,138,216,.4)">'
  + '<div class="sl-licenza-header" style="background:rgba(90,138,216,.05)">'
  + '<h3 style="color:rgba(90,138,216,.9)">🔵 P.M.T. — Manifattura Tecnica</h3>'
  + '<p class="lh-meta">Costo: 85 Mo · Cauzione: 25 Mo · <strong style="color:rgba(220,200,160,.7)">Totale: 110 Mo</strong> · Durata: 3 anni</p>'
  + '<p class="lh-meta" style="margin-top:4px">Ideale per: Fabbri, Gioiellieri, Architetti e Cartografi ufficiali.</p>'
  + '</div>'
  + '<div class="sl-licenza-body">'
  + '<div class="sl-licenza-block"><h5>✦ Permessi</h5><ul><li>Produzione di armi, armature pesanti, strutture civili/militari.</li><li>Oggetti magici <strong style="color:rgba(200,155,60,.9)">Comuni</strong>.</li><li>Emissione di documenti legali e mappe ufficiali.</li></ul></div>'
  + '<div class="sl-licenza-block"><h5>📦 Materiali</h5><ul><li>Cristalli conduttori (Hextech Grado I).</li><li>Leghe speciali (Acciaio di Noxus, ecc.).</li></ul></div>'
  + '<div class="sl-licenza-block"><h5>⚠ Obblighi</h5><ul><li>Responsabilità legale sulla stabilità delle strutture costruite.</li><li>Tracciabilità delle armi da guerra.</li></ul></div>'
  + '</div>'
  + '<div class="sl-guide-note" style="margin:0 24px 20px">⚠ <strong>Nota:</strong> Ciò che il licenziatario può craftare e vendere è sempre limitato dal <strong style="color:rgba(200,155,60,.9)">livello del mestiere</strong> posseduto: la Patente abilita all\'esercizio dell\'attività, ma non sblocca da sola le ricette o gli oggetti di livello superiore. Mestiere e Patente avanzano di pari passo.</div>'
  + '</div>';
  },

  pasv: function() { return ''
  + '<div class="sl-licenza-card" style="border-color:rgba(212,149,74,.4)">'
  + '<div class="sl-licenza-header" style="background:rgba(212,149,74,.05)">'
  + '<h3 style="color:rgba(212,149,74,.9)">🟠 P.A.S.V. — Alchimia e Sostanze Vincolate</h3>'
  + '<p class="lh-meta">Costo: 140 Mo · Cauzione: 40 Mo · <strong style="color:rgba(220,200,160,.7)">Totale: 180 Mo</strong> · Durata: 3 anni</p>'
  + '<p class="lh-meta" style="margin-top:4px">Ideale per: Alchimisti e Artigiani Hextech.</p>'
  + '</div>'
  + '<div class="sl-licenza-body">'
  + '<div class="sl-licenza-block"><h5>✦ Permessi</h5><ul><li>Produzione di pozioni fino a <strong style="color:rgba(200,155,60,.9)">Non Comuni</strong>.</li><li>Veleni etichettati e motori Hextech.</li><li><strong style="color:rgba(200,155,60,.9)">Unica licenza</strong> che permette l\'acquisto di Inchiostri Magici.</li></ul></div>'
  + '<div class="sl-licenza-block"><h5>📦 Materiali</h5><ul><li>Reagenti rari (Sangue di Demone, Ghiandola di Drago).</li><li>Inchiostri fino al Grado III.</li></ul></div>'
  + '<div class="sl-licenza-block"><h5>⚠ Rigore</h5><ul><li>Ogni boccetta è tracciata tramite il <strong style="color:rgba(200,155,60,.9)">Marchio Spettrale</strong>.</li><li>Ogni transazione registrata nel Libretto degli Acquisti.</li></ul></div>'
  + '</div>'
  + '<div class="sl-guide-note" style="margin:0 24px 20px">⚠ <strong>Nota:</strong> Ciò che il licenziatario può craftare e vendere è sempre limitato dal <strong style="color:rgba(200,155,60,.9)">livello del mestiere</strong> posseduto: la Patente abilita all\'esercizio dell\'attività, ma non sblocca da sola le ricette o gli oggetti di livello superiore. Mestiere e Patente avanzano di pari passo.</div>'
  + '</div>';
  },

  poe: function() { return ''
  + '<div class="sl-licenza-card" style="border-color:rgba(216,176,32,.4)">'
  + '<div class="sl-licenza-header" style="background:rgba(216,176,32,.05)">'
  + '<h3 style="color:rgba(216,176,32,.9)">🟡 P.O.E. — Opere Eccezionali</h3>'
  + '<p class="lh-meta">Costo: 300 Mo · Cauzione: 100 Mo · <strong style="color:rgba(220,200,160,.7)">Totale: 400 Mo</strong> · Durata: 3 anni</p>'
  + '<p class="lh-meta" style="margin-top:4px">Riservata ai Maestri Artigiani (Livello 4+).</p>'
  + '</div>'
  + '<div class="sl-licenza-body">'
  + '<div class="sl-licenza-block"><h5>✦ Permessi</h5><ul><li>Accesso alle commesse della Corte e titoli onorifici.</li></ul></div>'
  + '<div class="sl-licenza-block"><h5>🏆 Privilegi</h5><ul><li>Diritto di formare fino a <strong style="color:rgba(200,155,60,.9)">3 apprendisti</strong>.</li><li>Certificare la qualità delle opere (<strong style="color:rgba(200,155,60,.9)">+20% valore di mercato</strong>).</li></ul></div>'
  + '<div class="sl-licenza-block"><h5>📦 Materiali</h5><ul><li>Accesso a materiali speciali su approvazione del Consiglio.</li></ul></div>'
  + '</div>'
  + '<div class="sl-guide-note" style="margin:0 24px 20px">⚠ <strong>Nota:</strong> Ciò che il licenziatario può craftare e vendere è sempre limitato dal <strong style="color:rgba(200,155,60,.9)">livello del mestiere</strong> posseduto: la Patente abilita all\'esercizio dell\'attività, ma non sblocca da sola le ricette o gli oggetti di livello superiore. Mestiere e Patente avanzano di pari passo.</div>'
  + '</div>';
  },

  inchiostri: function() { return ''
  + '<div class="cmp-guide-section">'
  + _slSectionTitle('🖋️', 'Sezione Tecnica: Materiali Vincolati e Inchiostri')
  + '<p style="color:rgba(220,200,160,.7);font-size:15px;margin-bottom:16px">L\'uso di inchiostri magici è strettamente regolamentato per evitare abusi arcani. <strong style="color:rgba(200,155,60,.9)">Solo la P.A.S.V.</strong> permette l\'acquisto di inchiostri magici.</p>'
  + _slTableWrap('<table class="cmp-table">'
  + '<thead><tr><th>Grado Inchiostro</th><th>Patente Richiesta</th><th>Limite (3 anni)</th><th>Uso Tipico</th></tr></thead>'
  + '<tbody>'
  + '<tr class="sl-row-pmc"><td><span class="sl-dot-i" style="background:rgba(96,184,64,.8)"></span>Grado I</td><td>P.M.C.</td><td>Uso libero entro soglie ordinarie</td><td>Inchiostri comuni, scrittura base, documenti</td></tr>'
  + '<tr class="sl-row-pmt"><td><span class="sl-dot-i" style="background:rgba(90,138,216,.8)"></span>Grado II</td><td>P.M.T.</td><td>Tracciato nel Libretto degli Acquisti</td><td>Mappe ufficiali, documenti legali sigillati, Hextech Grado I</td></tr>'
  + '<tr class="sl-row-pasv"><td><span class="sl-dot-i" style="background:rgba(212,149,74,.8)"></span>Grado III</td><td>P.A.S.V.</td><td>Tracciato con Marchio Spettrale</td><td>Pergamene magiche, Tattoo magici, componenti alchemici avanzati</td></tr>'
  + '<tr class="sl-row-poe"><td><span class="sl-dot-i" style="background:rgba(216,176,32,.8)"></span>Grado IV+</td><td>P.O.E. + approvazione U.R.V.</td><td>Approvazione caso per caso</td><td>Manufatti leggendari, opere della Corte, Grimori avanzati</td></tr>'
  + '</tbody></table>')
  + '<div class="sl-guide-note">⚠ <strong>Marchio Spettrale:</strong> Ogni fiala di inchiostro di Grado III o superiore viene marchiata spettralmente dall\'U.R.V. al momento dell\'acquisto. Il marchio registra automaticamente data, acquirente e quantità. La rimozione del marchio è un reato grave.</div>'
  + '</div>';
  },
};

// ═══════════════════════════════════════════════
//  RENDER CONTENT
// ═══════════════════════════════════════════════

function _slRenderContent() {
  var el = document.getElementById('sl-content');
  if (!el) return;
  var map = _slCurrentTab === 'gilde' ? _slRenderGilde : _slRenderLicenze;
  var fn = map[_slCurrentSection];
  el.innerHTML = fn ? fn() : '<div style="color:rgba(200,155,60,.4);padding:60px 20px;text-align:center;font-family:\'Cinzel\',serif;font-size:11px;letter-spacing:.15em">Sezione non trovata.</div>';
}

// ═══════════════════════════════════════════════
//  STATE SETTERS
// ═══════════════════════════════════════════════

function _slSetTab(tab) {
  _slCurrentTab = tab;
  _slCurrentSection = 'panoramica';
  _slRender();
  document.getElementById('main').scrollTo({top:0,behavior:'smooth'});
}

function _slSetSection(s) {
  _slCurrentSection = s;
  _slRender();
  _slCloseDrawer();
  document.getElementById('main').scrollTo({top:0,behavior:'smooth'});
}

// ═══════════════════════════════════════════════
//  RENDER
// ═══════════════════════════════════════════════

function _slRender() {
  _slRenderTabs();
  _slRenderSideNav();
  _slRenderContent();
  _slSyncMobileDrawer();
}

// ═══════════════════════════════════════════════
//  SPA ENTRY POINT
// ═══════════════════════════════════════════════

window.showSocietaLicenze = function() {
  if (typeof navStack === 'undefined') {
    setTimeout(window.showSocietaLicenze, 100);
    return;
  }

  if (typeof closeDd === 'function') closeDd();

  var fakeId = 'societa-licenze';
  var _alreadyIn = navStack.length && navStack[navStack.length-1].id === fakeId;
  if (!_alreadyIn) {
    navStack.push({ id: fakeId, label: 'Società & Licenze', icon: '⚖️' });
  }
  history.pushState(
    { id: fakeId, label: 'Società & Licenze', icon: '⚖️', stack: navStack.slice(0, -1) },
    '', '/societa-licenze'
  );

  var phTitle   = document.getElementById('ph-title');
  var phIcon    = document.getElementById('ph-icon');
  var phCovbg   = document.getElementById('ph-covbg');
  var phOverlay = document.getElementById('ph-overlay');
  var phEyebrow = document.getElementById('ph-eyebrow');
  var phSub     = document.getElementById('ph-sub');
  var phCrumb   = document.getElementById('ph-crumb');
  var pbody     = document.getElementById('pbody');

  if (phTitle)   phTitle.textContent   = 'Società & Licenze di Arcamis';
  if (phIcon)    phIcon.textContent    = '⚖️';
  if (phEyebrow) phEyebrow.textContent = 'Guide Complete';
  if (phSub)     phSub.textContent     = 'Tutte le gilde, licenze, condizioni e regole per aprire un\'attività a Porta di Mezzo.';
  if (phCovbg)   phCovbg.style.backgroundImage = '';
  if (phOverlay) phOverlay.style.opacity = '0';
  if (phIcon)    phIcon.style.opacity   = '0.06';
  if (phCrumb)   phCrumb.innerHTML      = '<span onclick="history.back()" style="cursor:pointer;opacity:.6">← Indietro</span> <span style="opacity:.3">/</span> <span>Società & Licenze</span>';
  document.title = 'Società & Licenze di Arcamis — Arcamis';

  // Build the page HTML
  var html = '<div class="sl-wrap" style="animation:fi .22s ease forwards">';
  html += '<div class="sl-tabs" id="sl-tabs"></div>';
  html += '<div class="sl-main">';
  html += '<nav class="sl-sidenav" id="sl-sidenav"></nav>';
  html += '<div class="sl-content" id="sl-content"></div>';
  html += '</div>';
  // Mobile drawer overlay
  html += '<div class="sl-mobile-drawer-overlay" id="sl-drawer-overlay" onclick="_slCloseDrawer()"></div>';
  // Mobile drawer
  html += '<div class="sl-mobile-drawer" id="sl-mobile-drawer">';
  html += '<div class="sl-mobile-drawer-header"><h3>📑 Navigazione</h3><button class="sl-mobile-drawer-close" onclick="_slCloseDrawer()">✕</button></div>';
  html += '<nav id="sl-mobile-drawer-nav"></nav>';
  html += '</div>';
  // Mobile FAB
  html += '<button class="sl-mobile-fab" id="sl-mobile-fab" onclick="_slOpenDrawer()" title="Navigazione">☰</button>';
  html += '</div>';

  pbody.innerHTML = html;
  pbody.style.maxWidth = 'none';
  pbody.style.width = '100%';

  // Transition
  var hv = document.getElementById('hv');
  if (hv && hv.style.display === 'block') {
    if (typeof xfade === 'function') xfade(hv, document.getElementById('pv'));
    document.getElementById('main').scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    document.getElementById('main').scrollTo({ top: 0, behavior: 'smooth' });
    pbody.style.opacity = '0';
    pbody.style.transition = 'opacity .15s ease';
    setTimeout(function() { pbody.style.opacity = '1'; }, 50);
  }

  _slRender();

  if (typeof afterPageRender === 'function') afterPageRender();
};
