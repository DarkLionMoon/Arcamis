/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — editors.js
   Editor CMS con campi strutturati + WYSIWYG per i campi
   testo lungo. 10 layout (pantheon invariato). (v3)
   ════════════════════════════════════════════════════════════════ */

/* ── TIPO CAMPI ── */
var FIELD_TYPES={
  text:{icon:'Aa',placeholder:''},
  number:{icon:'#',placeholder:'0'},
  select:{icon:'▾',placeholder:'Seleziona…'},
  wysiwyg:{icon:'W',placeholder:'Scrivi il contenuto…'},
  image:{icon:'🖼',placeholder:'/images/…'}
};

/* ── LAYOUT REGISTRY (10 layout — pantheon invariato) ── */
var LAYOUT_REGISTRY={
/* ═══ PANTEON — NON CAMBIA ═══ */
  pantheon:{v:'pantheon',l:'Pantheon — Griglia divinità',i:'🛐',
    template:'Divinità\n\nBreve introduzione al pantheon del tuo mondo.\n\n---\n\n# Nome della Divinità\n\n![](/images/nome-divinita.jpg)\n\n> Citazione - Nome\n\n## Identità\n\n- **Nome:** Vero nome\n- **Epiteto:** Titolo\n- **Allineamento:** Legale Buono\n- **Sfere:** Guerra, Onore\n- **Simbolo:** Descrizione\n\n## Personalità\n\nTratti caratteriali.\n\n## Culto\n\n- **Tempio:** Tipo\n- **Rituali:** Cerimonie\n- **Seguaci:** Chi lo adora',
    blockFields:['Nome','Razza','Classe / Livello','Allineamento'],requiredFields:['Nome'],
    editorMode:'pantheon'},

/* ═══ COLLEZIONE — griglia generica stile Pantheon ═══ */
  collezione:{v:'collezione',l:'Collezione — Griglia generica',i:'🗂️',
    template:'Titolo della collezione\n\nBreve introduzione: di cosa parla questa raccolta.\n\n---\n\n# Nome dell\'elemento\n\n![](/images/elemento.jpg)\n\n> Citazione o motto rappresentativo - Nome\n\n## Dettagli\n\n- **Sottotitolo:** Compare sotto il nome nella tile\n- **Categoria:** Tipo / categoria\n\n## Descrizione\n\nTesto libero in markdown.\n\n## Note\n\nPuoi aggiungere sezioni con qualsiasi titolo.',
    blockFields:['Nome','Sottotitolo','Categoria'],requiredFields:['Nome'],
    editorMode:'pantheon'},

/* ═══ PERSONAGGIO (unisce npc + personaggio) ═══ */
  personaggio:{v:'personaggio',l:'Personaggio / NPC',i:'🌟',
    template:'## Nome del Personaggio\n\nBreve descrizione.\n\n- **Razza:** Elfo\n- **Classe:** Ladro\n- **Livello:** 5\n- **Allineamento:** Caotico Neutrale\n- **CA:** 16\n- **PF:** 32\n- **Velocità:** 9 m\n\n### Aspetto\n\nDescrizione fisica.\n\n### Personalità\n\nTratti caratteriali, vizi.\n\n### Abilità\n\nCapacità e talenti speciali.\n\n### Backstory\n\nLa storia del personaggio.',
    blockFields:['Nome','Razza','Classe','Livello','Allineamento','CA','PF','Velocità'],requiredFields:['Nome'],
    fields:[
      {key:'nome',label:'Nome',type:'text',required:true},
      {key:'razza',label:'Razza',type:'text'},
      {key:'classe',label:'Classe',type:'text'},
      {key:'livello',label:'Livello',type:'number'},
      {key:'allineamento',label:'Allineamento',type:'select',options:['Legale Buono','Neutrale Buono','Caotico Buono','Legale Neutrale','Neutrale','Caotico Neutrale','Legale Malvagio','Neutrale Malvagio','Caotico Malvagio']},
      {key:'ca',label:'CA',type:'number'},
      {key:'pf',label:'PF',type:'text'},
      {key:'velocita',label:'Velocità',type:'text'},
      {key:'aspetto',label:'Aspetto',type:'wysiwyg'},
      {key:'personalita',label:'Personalità',type:'wysiwyg'},
      {key:'abilita',label:'Abilità',type:'wysiwyg'},
      {key:'backstory',label:'Backstory',type:'wysiwyg'}
    ],
    sections:['Aspetto','Personalità','Abilità','Backstory'],
    editorMode:'schede'},

/* ═══ BESTIARIO ═══ */
  bestiario:{v:'bestiario',l:'Bestiario — Mostri',i:'🐉',
    template:'## Nome del Mostro\n\nBreve descrizione.\n\n- **Tipo:** Aberrazione\n- **Taglia:** Media\n- **Allineamento:** Qualsiasi\n- **CA:** 15\n- **PF:** 45 (10d10+10)\n- **Velocità:** 9 m\n- **CR:** 2\n\n### Statistiche\n\n- **For:** 16 (+3)\n- **Des:** 14 (+2)\n- **Cos:** 15 (+2)\n- **Int:** 10 (+0)\n- **Sag:** 12 (+1)\n- **Car:** 8 (-1)\n\n### Abilità\n\n- **Percezione passiva:** 12\n- **Linguaggi:** Comune\n\n### Azioni\n\n- **Attacco:** +5, 1d8+3 taglio\n\n### Leggenda\n\nFolklore legato al mostro.',
    blockFields:['Nome','Tipo','CR','Taglia','Allineamento'],requiredFields:['Nome','CR'],
    fields:[
      {key:'nome',label:'Nome',type:'text',required:true},
      {key:'tipo',label:'Tipo',type:'select',options:['Aberrazione','Bestia','Celestiale','Costrutto','Dragonide','Elementale','Fey','Fiend','Gigante','Immortale','Monstruoso','Orrori','Pianta','Tritone','Non-morto','Umanoide']},
      {key:'taglia',label:'Taglia',type:'select',options:['Piccolissimo','Piccolo','Media','Grande','Enorme','Colossale']},
      {key:'allineamento',label:'Allineamento',type:'select',options:['Qualsiasi','Legale Buono','Neutrale Buono','Caotico Buono','Legale Neutrale','Neutrale','Caotico Neutrale','Legale Malvagio','Neutrale Malvagio','Caotico Malvagio','Non allineato']},
      {key:'ca',label:'CA',type:'number'},
      {key:'pf',label:'PF',type:'text'},
      {key:'velocita',label:'Velocità',type:'text'},
      {key:'cr',label:'CR',type:'text'},
      {key:'statistiche',label:'Statistiche (For/Des/Cos/Int/Sag/Car)',type:'wysiwyg'},
      {key:'abilita',label:'Abilità',type:'wysiwyg'},
      {key:'azioni',label:'Azioni',type:'wysiwyg'},
      {key:'leggenda',label:'Leggenda',type:'wysiwyg'}
    ],
    sections:['Statistiche','Abilità','Azioni','Leggenda'],
    editorMode:'schede'},

/* ═══ OGGETTI & INCANTESIMI ═══ */
  oggetti:{v:'oggetti',l:'Oggetti & Incantesimi',i:'⚔️',
    template:'## Nome dell\'Oggetto\n\nDescrizione generale.\n\n- **Tipo:** Arma\n- **Rarità:** Raro\n- **Attunamento:** Sì\n- **Fonte:** PHB\n\n### Effetto\n\nDescrizione dell\'effetto magico.\n\n### Limitazioni\n\n- Limite 1\n\n### Storia\n\nOrigine e leggenda.',
    blockFields:['Nome','Tipo','Rarità/Livello','Fonte'],requiredFields:['Nome'],
    fields:[
      {key:'nome',label:'Nome',type:'text',required:true},
      {key:'tipo',label:'Tipo',type:'select',options:['Arma','Armatura','Scudo','Strumento','Pozione','Pergamena','Bacchetta','Bastone','Orologio','Altro']},
      {key:'rarita',label:'Rarità',type:'select',options:['Comune','Non comune','Raro','Molto raro','Leggendario','Arcaico']},
      {key:'attunamento',label:'Attunamento',type:'select',options:['No','Sì','Sì (con restrizione)']},
      {key:'fonte',label:'Fonte',type:'text'},
      {key:'descrizione',label:'Descrizione',type:'wysiwyg'},
      {key:'effetto',label:'Effetto',type:'wysiwyg'},
      {key:'limitazioni',label:'Limitazioni',type:'wysiwyg'},
      {key:'storia',label:'Storia',type:'wysiwyg'}
    ],
    sections:['Descrizione','Effetto','Limitazioni','Storia'],
    editorMode:'schede'},

/* ═══ LUOGHI (unisce lore + città) ═══ */
  luoghi:{v:'luoghi',l:'Luoghi — Lore & Città',i:'🏰',
    template:'## Nome del Luogo\n\n> Breve descrizione, atmosfera e cosa lo rende speciale.\n\n- **Tipo:** Città\n- **Popolazione:** 5000\n- **Governo:** Consiglio\n\n### Geografia\n\nTerritorio, clima, paesaggio.\n\n### Abitanti\n\nChi vive qui, culture, usanze.\n\n### Storia\n\nEventi importanti.\n\n### Segreti\n\nDettagli nascosti, leggende.\n\n### Punti di interesse\n\nLuoghi principali da visitare.',
    blockFields:['Nome','Tipo','Popolazione','Governo'],requiredFields:['Nome'],
    fields:[
      {key:'nome',label:'Nome',type:'text',required:true},
      {key:'tipo',label:'Tipo',type:'select',options:['Città','Villaggio','Fortezza','Cittadina','Rovine','Dungeon','Regione','Isola','Foresta','Montagna']},
      {key:'popolazione',label:'Popolazione',type:'text'},
      {key:'governo',label:'Governo',type:'text'},
      {key:'geografia',label:'Geografia',type:'wysiwyg'},
      {key:'abitanti',label:'Abitanti',type:'wysiwyg'},
      {key:'storia',label:'Storia',type:'wysiwyg'},
      {key:'segreti',label:'Segreti',type:'wysiwyg'},
      {key:'punti_interesse',label:'Punti di interesse',type:'wysiwyg'}
    ],
    sections:['Geografia','Abitanti','Storia','Segreti','Punti di interesse'],
    editorMode:'schede'},

/* ═══ CRONACHE (sessione + quest + evento + timeline) ═══ */
  cronache:{v:'cronache',l:'Cronache — Sessioni, Quest, Eventi',i:'📅',
    template:'## Titolo della Cronaca\n\nRiassunto in una o due frasi.\n\n- **Tipo:** Sessione\n- **Data:** 2025-01-15\n- **Luogo:** Gandora\n- **Stato:** Completata\n- **Difficoltà:** Media\n\n### Riassunto\n\nResoconto dettagliato degli eventi.\n\n### Eventi chiave\n\n- Evento 1\n- Evento 2\n\n### Risvolti\n\nConseguenze e sviluppi futuri.',
    blockFields:['Titolo','Tipo','Data','Luogo','Stato'],requiredFields:['Titolo'],
    fields:[
      {key:'titolo',label:'Titolo',type:'text',required:true},
      {key:'tipo',label:'Tipo',type:'select',options:['Sessione','Quest','Evento','Timeline']},
      {key:'data',label:'Data',type:'text'},
      {key:'luogo',label:'Luogo',type:'text'},
      {key:'stato',label:'Stato',type:'select',options:['In corso','Completata','Fallita','Annullata','Programmata']},
      {key:'difficolta',label:'Difficoltà',type:'select',options:['Facile','Media','Difficile','Mortale','Leggendaria']},
      {key:'riassunto',label:'Riassunto',type:'wysiwyg'},
      {key:'eventi',label:'Eventi chiave',type:'wysiwyg'},
      {key:'risvolti',label:'Risvolti',type:'wysiwyg'}
    ],
    sections:['Riassunto','Eventi chiave','Risvolti'],
    editorMode:'schede'},

/* ═══ CONTENUTO (generico + regole + lavoro) ═══ */
  contenuto:{v:'contenuto',l:'Contenuto — Testo e regole',i:'📄',
    template:'## Introduzione\n\nTesto introduttivo.\n\n## Sezione 1\n\nContenuto della sezione.\n\n## Sezione 2\n\n- Elemento 1\n- Elemento 2\n\n> Citazione importante.\n\n---\n\n## Sezione 3\n\nAltro contenuto.',
    blockFields:['Titolo','Sottotitolo'],requiredFields:[],
    fields:[
      {key:'titolo',label:'Titolo',type:'text'},
      {key:'sottotitolo',label:'Sottotitolo',type:'text'},
      {key:'body',label:'Contenuto',type:'wysiwyg'}
    ],
    sections:[],
    editorMode:'contenuto'},

/* ═══ FAZIONI ═══ */
  fazioni:{v:'fazioni',l:'Fazioni & Organizzazioni',i:'🏴',
    template:'## Nome della Fazione\n\nDescrizione introduttiva.\n\n- **Simbolo:** Descrizione\n- **Sede:** Luogo principale\n- **Leader:** Nome\n- **Membri:** Numero\n\n### Struttura\n\nCome sono organizzati.\n\n### Obiettivi\n\n- Obiettivo 1\n- Obiettivo 2\n\n### Alleati e Nemici\n\n- **Alleati:** ...\n- **Nemici:** ...\n\n### Storia\n\nCome è nata la fazione.',
    blockFields:['Nome','Simbolo','Sede','Leader','Membri'],requiredFields:['Nome'],
    fields:[
      {key:'nome',label:'Nome',type:'text',required:true},
      {key:'simbolo',label:'Simbolo',type:'image'},
      {key:'sede',label:'Sede',type:'text'},
      {key:'leader',label:'Leader',type:'text'},
      {key:'membri',label:'Membri',type:'text'},
      {key:'struttura',label:'Struttura',type:'wysiwyg'},
      {key:'obiettivi',label:'Obiettivi',type:'wysiwyg'},
      {key:'alleati_nemici',label:'Alleati e Nemici',type:'wysiwyg'},
      {key:'storia',label:'Storia',type:'wysiwyg'}
    ],
    sections:['Struttura','Obiettivi','Alleati e Nemici','Storia'],
    editorMode:'schede'},

/* ═══ MATERIALE (grid speciale) ═══ */
  materiale:{v:'materiale',l:'Materiale — Classi, Specie, Talenti',i:'📋',
    template:'## Specie\n\n- Umano (PHB)\n- Elfo (PHB)\n- Mezzorco (PHB)\n\n## Classi\n\n- Barbarian (PHB)\n- Berserker (PHB)\n- Totem Warrior (PHB)\n\n- Fighter (PHB)\n- Champion (PHB)\n- Battle Master (PHB)\n\n## Talenti\n\n- Talento 1 (PHB)\n- Talento 2 (XGE)\n- Talento 3 (TCE)\n\n## Spell\n\n- Spell 1 (PHB)\n- Spell 2 (XGE)\n- Spell 3 (TCE)\n\n> 💡 Nota su eventuali restrizioni.',
    blockFields:['Nome','Fonte','Categoria'],requiredFields:[],
    fields:[
      {key:'nome',label:'Nome',type:'text'},
      {key:'specie',label:'Specie (sezioni)',type:'wysiwyg'},
      {key:'classi',label:'Classi (sezioni)',type:'wysiwyg'},
      {key:'talenti',label:'Talenti (sezioni)',type:'wysiwyg'},
      {key:'spell',label:'Spell (sezioni)',type:'wysiwyg'}
    ],
    sections:['Specie','Classi','Talenti','Spell'],
    editorMode:'materiale'}
};

/* Array derivato per compatibilità con select/lookup */
var LAYOUTS=[
  {v:'',l:'(Auto — rileva da chiave)',i:'🔍'}
].concat(Object.keys(LAYOUT_REGISTRY).map(function(k){return LAYOUT_REGISTRY[k]}));
var LAYOUT_TEMPLATES=(function(){var t={};Object.keys(LAYOUT_REGISTRY).forEach(function(k){t[k]=LAYOUT_REGISTRY[k].template});return t})();

var _viewMode='md';
var _prevView='md';
var _mdSplit=50;
var _tocOffsets=[];
var _undo=[],_redo=[],_undoBase=null,_lastUndoTs=0;
var _bulkMode=false;
var _bulkSelected={};

/* ── COMANDI EDITOR ── */
function _snapUndo(){
  var ta=document.getElementById('e-md');if(!ta)return;
  var now=Date.now();
  if(_undoBase!==null&&_undoBase!==ta.value&&(now-_lastUndoTs>800)){
    _undo.push(_undoBase);if(_undo.length>60)_undo.shift();_redo=[];
  }
  _lastUndoTs=now;_undoBase=ta.value;
}
var EDITOR_CMDS={
  bold:function(){wrapMd('**','**')},
  italic:function(){wrapMd('*','*')},
  strike:function(){wrapMd('~~','~~')},
  mark:function(){wrapMd('==','==')},
  sup:function(){wrapMd('^','^')},sub:function(){wrapMd('~','~')},
  h1:function(){lineMd('# ')},h2:function(){lineMd('## ')},h3:function(){lineMd('### ')},
  quote:function(){lineMd('> ')},hr:function(){insMd('\n---\n')},
  ul:function(){lineMd('- ')},ol:function(){lineMd('1. ')},todo:function(){lineMd('- [ ] ')},
  link:function(){wrapMd('[','](url)')},img:openImgDialog,table:openTableDialog,
  code:function(){wrapMd('`','`')},codeblock:function(){insMd('\n```\n\n```')},
  callout:openCalloutDialog,details:insertFoldTemplate,footnote:insertFootnote,
  emoji:openEmojiDialog,
  undo:function(){var ta=document.getElementById('e-md');if(!ta)return;_snapUndo();var s=_undo.pop();if(s===undefined){_undoBase=null;return}_redo.push(ta.value);ta.value=s;_undoBase=s;ta.selectionStart=ta.selectionEnd=ta.value.length;onMdInput()},
  redo:function(){var ta=document.getElementById('e-md');if(!ta)return;var s=_redo.pop();if(s===undefined)return;_undo.push(ta.value);ta.value=s;_undoBase=s;ta.selectionStart=ta.selectionEnd=ta.value.length;onMdInput()}
};
var EDITOR_TB=[
  ['undo','redo'],
  ['bold','italic','strike','mark'],
  ['sup','sub'],
  ['h1','h2','h3'],
  ['quote','callout','details'],
  ['hr'],
  ['ul','ol','todo'],
  ['link','img','table'],
  ['code','codeblock'],
  ['footnote'],
  ['emoji']
];
var EDITOR_TB_LABEL={undo:'↩',redo:'↪',bold:'B',italic:'I',strike:'S̶',mark:'==',sup:'x²',sub:'x₂',h1:'H1',h2:'H2',h3:'H3',quote:'❝',callout:'❗',details:'▸',hr:'—',ul:'•',ol:'1.',todo:'☑',link:'🔗',img:'🖼',table:'⊞',code:'</>',codeblock:'```',footnote:'N¹',emoji:'😀'};
var EDITOR_TB_TITLE={undo:'Annulla (Ctrl+Z)',redo:'Ripeti (Ctrl+Y)',bold:'Grassetto (Ctrl+B)',italic:'Corsivo (Ctrl+I)',strike:'Barrato',mark:'Evidenzia (==testo==)',sup:'Apice (^testo^)',sub:'Pedice (~testo~)',h1:'Titolo 1',h2:'Titolo 2',h3:'Titolo 3',quote:'Citazione',callout:'Callout ([!NOTE], [!LORE], …)',details:'Sezione richiudibile',hr:'Divisore',ul:'Lista',ol:'Lista numerata',todo:'Checklist',link:'Link (Ctrl+K)',img:'Immagine',table:'Tabella',code:'Codice inline',codeblock:'Blocco codice',footnote:'Nota a piè di pagina',emoji:'Emoji'};

function _layoutLabel(v){var l=LAYOUTS.find(function(x){return x.v===v});return l?(l.i+' '+l.l):('layout: '+(v||'—'))}

function runCmd(cmd){if(EDITOR_CMDS[cmd])EDITOR_CMDS[cmd]()}

/* ── APERTURA PAGINA ── */
async function openPage(k){
  _mapActive=false;
  var meta=PAGES.find(function(p){return p.k===k});
  var path=CONTENT+'/pages/'+k+'.json';
  var json,sha;
  try{
    var d=await ghGet(path);
    var raw=b64decode(d.content);
    json=JSON.parse(raw);sha=d.sha;
  }catch(e){
    json={k:k,title:meta?meta.l:k,icon:meta?meta.i:'📄',content:'# '+(meta?meta.l:k)+'\n\nInserisci il contenuto qui...',lastModified:new Date().toISOString()};
    sha=null;
  }
  _current={type:'page',k:k,sha:sha,title:json.title,icon:json.icon,layout:json.layout||'',toc:!!json.toc};
  var st=_stLayoutFor(json.layout||'');
  setCrumb('Contenuti','Pagine wiki');
  setTitle((json.icon||'📄')+' '+(json.title||k));
  var layoutOpts='';
  LAYOUTS.forEach(function(l){
    layoutOpts+='<option value="'+l.v+'"'+(l.v===(json.layout||'')?' selected':'')+'>'+l.i+' '+l.l+'</option>';
  });
  var h='<div class="ed-view">';
  h+='<div class="ed-head">';
  h+='<div class="ed-title"><span class="eti" id="ed-icon">'+esc(json.icon||'📄')+'</span><span id="ed-title">'+esc(json.title||k)+'</span><span class="etp">pages/'+esc(k)+'</span></div>';
  h+='<span class="badge badge-idle" id="e-badge">salvato</span>';
  h+='<span class="badge badge-draft" id="e-draft-badge" style="display:none">BOZZA</span>';
  h+='<div class="grow"></div>';
  h+='<div class="ed-actions">';
  h+='<button class="btn btn-soft btn-sm" onclick="saveDraft()" title="Salva come bozza (non pubblicata)">💾 <span class="lbl">SALVA BOZZA</span></button>';
  h+='<button class="btn btn-p btn-sm" id="publish-btn" onclick="publishDraft()" style="display:none" title="Pubblica bozza come versione live">🚀 <span class="lbl">PUBBLICA</span></button>';
  h+='<span class="ed-sep"></span>';
  h+='<button class="btn btn-soft btn-sm" onclick="toggleJson()" title="Modifica il JSON grezzo della pagina">JSON</button>';
  h+='<button class="btn btn-soft btn-sm" onclick="openHistory()" title="Cronologia commit e ripristino versione">📜 <span class="lbl">Storia</span></button>';
  h+='<button class="btn btn-soft btn-sm" onclick="checkLinks()" title="Verifica i link interni del contenuto">🔗 <span class="lbl">Link</span></button>';
  h+='<button class="btn btn-soft btn-sm" onclick="copyPageUrl()" title="Copia URL pulito della pagina">URL</button>';
  h+='<button class="btn btn-soft btn-sm" onclick="openPageOnSite()" title="Apri la pagina sul sito in una nuova scheda">🌐 <span class="lbl">Apri</span></button>';
  h+='<button class="btn btn-soft btn-sm" onclick="openRenameModal()" title="Rinomina sezione / pagina">✏️ <span class="lbl">Rinomina</span></button>';
  h+='<span class="ed-sep"></span>';
  h+='<button class="btn btn-d btn-sm" id="del-btn" onclick="deletePage()" title="Elimina questa pagina (azione irreversibile)">ELIMINA</button>';
  h+='<button class="btn btn-p btn-sm" id="save-btn" onclick="savePage()" title="Salva subito (Ctrl+S)">SALVA</button>';
  h+='</div></div>';
  h+=buildToolbar();
  h+='<div class="ed-body" id="editor-body">';
  h+='<div class="pane" id="md-pane">';
  h+='<div class="pane-head" id="mp-head">'+(st?'Editor':'Markdown')+_paneHeadTools();
  h+=' <span class="ph-info" id="e-stats"></span></div>';
  h+='<div class="ed-meta">';
  h+='<label>Titolo<input id="e-title" class="in mm-t" value="'+escAttr(json.title||'')+'" oninput="onMetaInput()" placeholder="Titolo pagina"></label>';
  h+='<label>Icona<input id="e-icon" class="in mm-icon" value="'+escAttr(json.icon||'')+'" oninput="onMetaInput()" maxlength="6" placeholder="📄"></label>';
  h+='<label>Layout<select id="e-layout" class="in mm-layout" onchange="onLayoutChange(this.value)">'+layoutOpts+'</select></label>';
  h+='<label class="ed-toc-toggle">Sommario<input type="checkbox" id="e-toc" '+(json.toc?'checked':'')+' onchange="_current.toc=this.checked"></label>';
  h+='</div>';
  if(st){
    h+='<textarea id="e-md" style="display:none" placeholder="Contenuto Markdown (sincronizzato dai blocchi)...">'+esc(json.content||'')+'</textarea>';
    h+='<div class="struct-head" id="struct-head"></div>';
    h+='<div class="struct-list" id="st-list"></div>';
  }else{
    h+='<textarea id="e-md" oninput="onMdInput()" onkeydown="onMdKey(event)" onblur="onMdBlur()" placeholder="Scrivi il contenuto in Markdown...">'+esc(json.content||'')+'</textarea>';
  }
  h+='<div class="ln-gutter" id="e-lineno" aria-hidden="true"></div>';
  h+='</div>';
  h+='<div class="divider-v" id="e-divider"></div>';
  h+='<div class="pane" id="pv-pane">';
  h+='<div class="pane-head">Anteprima <span class="ph-info" id="e-pv-info">'+esc(_layoutLabel(json.layout||''))+'</span></div>';
  h+='<div id="e-preview"></div>';
  h+='</div>';
  h+='<div class="md-outline" id="e-outline"><div class="ol-head"><span>☰ Sommario</span><button class="ol-close" onclick="toggleOutline()" title="Chiudi sommario">✕</button></div><div class="ol-body" id="e-ol-body"></div></div>';
  h+='</div>';
  h+='<iframe id="site-frame"></iframe><div id="site-hint"><span>🔎 Anteprima del sito</span><span class="sh-k">· clicca SITO per tornare all\'editor</span></div>';
  h+='<div class="json-pane" id="json-pane"><div class="pane-head">JSON</div><textarea id="e-json"></textarea></div>';
  h+='<div class="ed-statusbar"><span id="e-sb">'+esc(_layoutLabel(json.layout||''))+' · Autosave ogni 5s · SALVA / Ctrl+S salva subito</span><span class="st-r">Ctrl+B grassetto · Ctrl+I corsivo · Ctrl+K link · Ctrl+H cerca · Ctrl+G riga · Ctrl+Shift+F schermo intero</span></div>';
  h+='</div>';
  document.getElementById('main').innerHTML=h;
  if(st){
    initStructuredEditor(json.content);
    setViewMode(_viewMode);
  }else{
    setViewMode(_viewMode);
    renderPreview();
    updateStats();
  }
  _bindDivider();
  var taL=document.getElementById('e-md');
  if(taL){
    taL.addEventListener('scroll',function(){
      var g=document.getElementById('e-lineno');
      if(g)g.scrollTop=this.scrollTop;
    });
    taL.addEventListener('input',_updateLineno);
  }
  _applyEdPrefs();
  _bindEditorEvents();
  _bindEditorKeys();
  _bindSyncScroll();
  _checkDraftStatus();
}
function _paneHeadTools(){
  return '<span class="ed-tools">'
    +'<button type="button" class="tb-btn2 ed-tool" id="tl-ln" title="Numeri di riga" onclick="_toggleLineno()">#</button>'
    +'<button type="button" class="tb-btn2 ed-tool" id="tl-wrap" title="A capo automatico" onclick="_toggleWordwrap()">⤶</button>'
    +'<span class="ed-sep"></span>'
    +'<button type="button" class="tb-btn2 ed-tool" title="Riduci testo" onclick="_edFontSize(-1)">A−</button>'
    +'<button type="button" class="tb-btn2 ed-tool" title="Aumenta testo" onclick="_edFontSize(1)">A+</button>'
    +'</span>';
}

function buildToolbar(){
  var h='<div class="ed-toolbar" id="e-toolbar">';
  if(_current){
    h+='<button class="btn btn-soft btn-sm" onclick="_stToggle()" title="Passa all\'editor a blocchi (disponibile su ogni pagina)">🧱 Blocchi</button>';
  }
  EDITOR_TB.forEach(function(g){
    g.forEach(function(cmd){
      h+='<button class="tb-btn2" data-cmd="'+cmd+'" title="'+EDITOR_TB_TITLE[cmd]+'">'+EDITOR_TB_LABEL[cmd]+'</button>';
    });
    h+='<span class="tb-sep2"></span>';
  });
  h+='<span class="tb-spacer"></span>';
  h+='<button class="tb-btn2" id="tb-outline" title="Sommario sezioni" onclick="toggleOutline()">☰</button>';
  h+='<span class="view-switch">';
  h+='<button class="tb-btn2" data-view="md" title="Solo markdown">SCRIVI</button>';
  h+='<button class="tb-btn2" data-view="pv" title="Solo anteprima">VEDI</button>';
  h+='<button class="tb-btn2" data-view="site" title="Come appare sul sito">SITO</button>';
  h+='</span>';
  h+='</div>';
  return h;
}

function onMdInput(){
  _snapUndo();
  _modified=true;setBadge('dirty','modificato');renderPreview();
  var md=document.getElementById('e-md');
  if(md){_autosaveStore(md.value);_lastSavedContent=md.value}
  updateStats();
}
function onMetaInput(){_modified=true;setBadge('dirty','modificato')}
function onMdBlur(){
  if(_modified&&_current&&!_saveInProgress){
    var md=document.getElementById('e-md');
    if(md){_autosaveStore(md.value);_lastSavedContent=md.value}
  }
}
function onMdKey(e){
  var ta=document.getElementById('e-md');if(!ta)return;
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();savePage();return}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='b'){e.preventDefault();runCmd('bold');return}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='i'){e.preventDefault();runCmd('italic');return}
  if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&e.key.toLowerCase()==='k'){e.preventDefault();runCmd('link');return}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();runCmd(e.shiftKey?'redo':'undo');return}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();runCmd('redo');return}
  if(!e.ctrlKey&&!e.metaKey&&!e.altKey&&_autoPair(e,ta)){onMdInput();return}
  if(e.key==='Enter'&&!e.shiftKey&&!e.ctrlKey&&!e.metaKey&&_mdContinueList(ta)){e.preventDefault();onMdInput();return}
  if(e.key==='Tab'){
    e.preventDefault();
    var s=ta.selectionStart,en=ta.selectionEnd,val=ta.value;
    if(s===en){
      ta.value=val.substring(0,s)+'  '+val.substring(en);
      ta.selectionStart=ta.selectionEnd=s+2;
    }else{
      var ls=val.lastIndexOf('\n',s-1)+1;
      var le=val.indexOf('\n',en);le=le===-1?val.length:le+1;
      var block=val.substring(ls,le);
      var nb=e.shiftKey?block.replace(/^  /gm,''):block.replace(/^/gm,'  ');
      if(e.shiftKey&&nb===block)nb=block.replace(/^\t/gm,'');
      ta.value=val.substring(0,ls)+nb+val.substring(le);
      ta.selectionStart=ls;ta.selectionEnd=ls+nb.length;
    }
    onMdInput();return;
  }
}
function _currentHead(){
  if(_current&&_current.type==='page'){
    return {icon:_current.icon||'📄',title:_current.title||_current.k||''};
  }
  return {icon:'📄',title:'Anteprima'};
}
function mdToHtml(md){
  if(!md)return '';
  if(typeof window.mdRender==='function'){
    try{
      var out=window.mdRender(md);
      if(out)return out;
    }catch(e){}
  }
  md=md.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  md=md.replace(/```(\w*)\n([\s\S]*?)```/g,'<pre><code>$2</code></pre>');
  md=md.replace(/`([^`]+)`/g,'<code>$1</code>');
  md=md.replace(/^#### (.+)$/gm,'<h4>$1</h4>');
  md=md.replace(/^### (.+)$/gm,'<h3>$1</h3>');
  md=md.replace(/^## (.+)$/gm,'<h2>$1</h2>');
  md=md.replace(/^# (.+)$/gm,'<h1>$1</h1>');
  md=md.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  md=md.replace(/\*(.+?)\*/g,'<em>$1</em>');
  md=md.replace(/^> (.+)$/gm,'<blockquote>$1</blockquote>');
  md=md.replace(/^---$/gm,'<hr>');
  md=md.replace(/^- (.+)$/gm,'<li>$1</li>');
  md=md.replace(/^\d+\. (.+)$/gm,'<li>$1</li>');
  function _safeUrl(u){
    u=(u||'').trim();
    if(/^\s*(javascript|data|vbscript):/i.test(u))return '#';
    return u.replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  md=md.replace(/\[([^\]]+)\]\(([^)]+)\)/g,function(m,txt,url){return '<a href="'+_safeUrl(url)+'" target="_blank" rel="noopener noreferrer">'+txt+'</a>'});
  md=md.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,function(m,alt,url){return '<img src="'+_safeUrl(url)+'" alt="'+alt.replace(/"/g,'&quot;')+'" style="max-width:100%;border-radius:4px">'});
  md=md.replace(/((?:^\|.*\|[^\n]*\n?)+)/gm,function(m,t){
    var rows=t.trim().split('\n').filter(function(r){return !/^\|[\s\-:|]+\|$/.test(r)});
    if(!rows.length)return m;
    var h=rows[0].replace(/^\||\|$/g,'').split('|').map(function(c){return '<th>'+c.trim()+'</th>'}).join('');
    var b=rows.slice(1).map(function(r){return '<tr>'+r.replace(/^\||\|$/g,'').split('|').map(function(c){return '<td>'+c.trim()+'</td>'}).join('')+'</tr>'}).join('');
    return '<table><tr>'+h+'</tr>'+b+'</table>';
  });
  md=md.replace(/\n\n/g,'</p><p>');
  md=md.replace(/\n/g,'<br>');
  return '<p>'+md+'</p>';
}
function renderPreview(){
  _updateLineno();
  if(window.__stMode){if(typeof _stSyncPreview==='function')_stSyncPreview();return}
  var md=document.getElementById('e-md');var pv=document.getElementById('e-preview');
  if(!md||!pv)return;
  var hd=_currentHead();
  pv.innerHTML='<div class="e-pv"><div class="e-pv-head"><span class="epv-icon">'+esc(hd.icon)+'</span><div><div class="epv-title">'+esc(hd.title)+'</div><div class="epv-sub">'+esc(_current.k||'')+'</div></div></div>'+mdToHtml(md.value)+'</div>';
  var todos=pv.querySelectorAll('.n-todo');
  var tl=[];var ls=md.value.split('\n');
  for(var i=0;i<ls.length;i++){if(/^\s*[-*+]\s+\[[ xX]\]\s?/.test(ls[i]))tl.push(i)}
  for(var j=0;j<todos.length;j++){if(tl[j]!==undefined)todos[j].setAttribute('data-line',tl[j])}
  buildOutline();
}
function buildOutline(){
  var pv=document.getElementById('e-preview');var body=document.getElementById('e-ol-body');
  if(!pv||!body)return;
  var heads=pv.querySelectorAll('.n-h1,.n-h2,.n-h3,.n-h4');
  var h='';_tocOffsets=[];
  for(var i=0;i<heads.length;i++){
    var el=heads[i];var tag=el.tagName.toLowerCase();
    var txt=(el.textContent||'').replace(/\s+/g,' ').trim();
    var off=el.offsetTop;
    _tocOffsets.push({el:el,off:off});
    h+='<button class="ol-item '+tag+'" data-off="'+off+'" title="'+esc(txt)+'">'+esc(txt)+'</button>';
  }
  body.innerHTML=h||'<div style="padding:10px;color:var(--dim);font-size:11px">Nessuna sezione</div>';
}
function jumpToLine(off){var pv=document.getElementById('e-preview');if(pv){pv.scrollTop=off-90;pv.focus()}}
function toggleOutline(){
  var ol=document.getElementById('e-outline');if(!ol)return;
  ol.classList.toggle('open');
  var btn=document.getElementById('tb-outline');if(btn)btn.classList.toggle('active');
  if(ol.classList.contains('open'))buildOutline();
}
function updateStats(){
  var md=document.getElementById('e-md');var st=document.getElementById('e-stats');if(!md||!st)return;
  var val=md.value;
  var words=(val.trim()===''?0:val.trim().split(/\s+/).length);
  var chars=val.length;
  var lines=val.split('\n').length;
  var mins=Math.max(1,Math.round(words/200));
  st.textContent=words+' parole · '+chars+' caratteri · '+lines+' righe · ~'+mins+' min lettura';
}
function setViewMode(m){
  var eb=document.getElementById('editor-body');
  if(eb&&eb.classList.contains('no-preview')&&m==='pv')m='md';
  if(m==='site'){
    if(_viewMode==='site'){m=_prevView||'md';}
    else{_prevView=_viewMode;}
  }
  _viewMode=m;
  var tb=document.getElementById('e-toolbar');
  if(tb){var vs=tb.querySelectorAll('[data-view]');for(var i=0;i<vs.length;i++)vs[i].classList.toggle('active',vs[i].getAttribute('data-view')===m)}
  var body=document.getElementById('editor-body');if(!body)return;
  var mdP=document.getElementById('md-pane'),pvP=document.getElementById('pv-pane');
  var div=document.getElementById('e-divider'),frame=document.getElementById('site-frame');
  var hint=document.getElementById('site-hint');
  if(m==='site'){
    body.style.display='none';
    if(hint)hint.style.display='flex';
    if(frame){
      frame.style.display='block';
      if(_current&&_current.k){
        _pageCleanPath().then(function(p){frame.src=p});
      }
    }
    return;
  }
  if(frame)frame.style.display='none';
  if(hint)hint.style.display='none';
  body.style.display='flex';
  if(m==='md'){
    if(mdP){mdP.style.display='flex';mdP.style.flex='1 1 auto'}
    if(pvP)pvP.style.display='none';
    if(div)div.style.display='none';
  }else if(m==='pv'){
    if(mdP)mdP.style.display='none';
    if(pvP){pvP.style.display='flex';pvP.style.flex='1 1 auto'}
    if(div)div.style.display='none';
  }else{
    if(mdP){mdP.style.display='flex';mdP.style.flex=_mdSplit+' 1 0%'}
    if(pvP){pvP.style.display='flex';pvP.style.flex='1 1 0%'}
    if(div)div.style.display='block';
    renderPreview();
  }
}
function _bindDivider(){
  var div=document.getElementById('e-divider');if(!div)return;
  div.addEventListener('mousedown',function(e){
    e.preventDefault();
    var body=document.getElementById('editor-body');if(!body)return;
    div.classList.add('dragging');
    function onMove(ev){var rect=body.getBoundingClientRect();var pct=(ev.clientX-rect.left)/rect.width*100;_mdSplit=Math.max(20,Math.min(80,pct));var mdP=document.getElementById('md-pane');if(mdP)mdP.style.flex=_mdSplit+' 1 0%'}
    function onUp(){document.removeEventListener('mousemove',onMove);document.removeEventListener('mouseup',onUp);div.classList.remove('dragging')}
    document.addEventListener('mousemove',onMove);
    document.addEventListener('mouseup',onUp);
  });
}
function _toggleTodo(todoEl){
  var md=document.getElementById('e-md');if(!md)return;
  var nowChecked=!todoEl.classList.contains('checked');
  todoEl.classList.toggle('checked',nowChecked);
  var idx=parseInt(todoEl.getAttribute('data-line'),10);
  var ls=md.value.split('\n');
  if(idx>=0&&idx<ls.length&&/^\s*[-*+]\s+\[[ xX]\]\s?/.test(ls[idx])){
    ls[idx]=ls[idx].replace(/\[[ xX]\]\s?/,nowChecked?'[x] ':'[ ] ');
    md.value=ls.join('\n');
    onMdInput();
  }
}
function zoomPreviewImg(img){
  var pv=document.getElementById('e-preview');if(!pv)return;
  pv.classList.toggle('zoomed');
  img.style.maxWidth='';img.style.width='';img.style.margin='';
  if(pv.classList.contains('zoomed')){img.style.maxWidth='100%';img.style.width='100%';img.style.margin='0'}
}
function _bindEditorEvents(){
  if(window.__arcEditorBound)return;
  window.__arcEditorBound=true;
  document.addEventListener('click',function(ev){
    if(!document.getElementById('e-md'))return;
    var t=ev.target.closest('[data-cmd]');
    if(t&&t.closest('#e-toolbar')){runCmd(t.getAttribute('data-cmd'));return}
    t=ev.target.closest('[data-view]');
    if(t){setViewMode(t.getAttribute('data-view'));return}
    t=ev.target.closest('.ol-item');
    if(t){jumpToLine(parseInt(t.getAttribute('data-off'),10));return}
    t=ev.target.closest('.n-todo');
    if(t&&t.closest('#e-preview')){_toggleTodo(t);ev.preventDefault();return}
    t=ev.target.closest('a');
    if(t&&t.closest('#e-preview')&&!t.classList.contains('n-anchor')){ev.preventDefault();window.open(t.getAttribute('href'),'_blank');return}
    t=ev.target.closest('img');
    if(t&&t.closest('#e-preview')){zoomPreviewImg(t);return}
  });
  document.addEventListener('keydown',function(ev){
    if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==='s'){
      var ta=document.getElementById('e-md');
      if(ta){ev.preventDefault();savePage()}
    }
  });
  window.addEventListener('resize',function(){if(document.getElementById('e-preview'))buildOutline()});
  var pv=document.getElementById('e-preview');
  if(pv){
    pv.addEventListener('scroll',function(){
      var ol=document.getElementById('e-outline');if(!ol||!ol.classList.contains('open'))return;
      var items=ol.querySelectorAll('.ol-item');if(!items.length)return;
      var scrollTop=pv.scrollTop;var bestIdx=0;
      for(var i=0;i<_tocOffsets.length;i++){
        if(_tocOffsets[i].off-60<=scrollTop)bestIdx=i;
      }
      for(var j=0;j<items.length;j++)items[j].classList.toggle('active',j===bestIdx);
    });
  }
}
function onLayoutChange(val,silent){
  _current.layout=val;
  var md=document.getElementById('e-md');
  if(window.__stMode){
    if(!silent&&!confirm('Cambiare layout? I blocchi verranno riparseti con il nuovo template. Le modifiche non salvate andranno perse.')){
      var ls=document.getElementById('e-layout');
      if(ls)ls.value=_current.layout||'';
      return;
    }
    _stSetKind(val);
    initStructuredEditor(md?md.value:'');
    var info=document.getElementById('e-pv-info');
    if(info)info.textContent=_layoutLabel(val);
    var sb=document.getElementById('e-sb');
    if(sb)sb.textContent=_layoutLabel(val)+' · Autosave ogni 5s · SALVA / Ctrl+S salva subito';
    _modified=true;setBadge('dirty','modificato');
    return;
  }
  var current=(md?md.value:'').trim();
  var tpl=LAYOUT_TEMPLATES[val]||'';
  if(!silent&&(!current||confirm('Vuoi applicare il template per questo layout? Il contenuto attuale verra sostituito.'))&&md&&tpl){
    md.value=tpl;onMdInput();
  }
  _modified=true;setBadge('dirty','modificato');
  var info=document.getElementById('e-pv-info');
  if(info)info.textContent=_layoutLabel(val);
  var sb=document.getElementById('e-sb');
  if(sb)sb.textContent=_layoutLabel(val)+' · Autosave ogni 5s · SALVA / Ctrl+S salva subito';
  var tb=document.getElementById('e-toolbar');
  if(tb&&tb.parentNode){tb.outerHTML=buildToolbar();setViewMode(_viewMode)}
}
function wrapMd(before,after){
  var ta=document.getElementById('e-md');if(!ta)return;
  var s=ta.selectionStart,en=ta.selectionEnd;
  var sel=ta.value.substring(s,en);
  ta.value=ta.value.substring(0,s)+before+sel+after+ta.value.substring(en);
  ta.selectionStart=s+before.length;ta.selectionEnd=s+before.length+sel.length;
  ta.focus();onMdInput();
}
function lineMd(prefix){
  var ta=document.getElementById('e-md');if(!ta)return;
  var s=ta.selectionStart;
  var lineStart=ta.value.lastIndexOf('\n',s-1)+1;
  ta.value=ta.value.substring(0,lineStart)+prefix+ta.value.substring(lineStart);
  ta.selectionStart=ta.selectionEnd=s+prefix.length;
  ta.focus();onMdInput();
}
function insMd(text){
  var ta=document.getElementById('e-md');if(!ta)return;
  var s=ta.selectionStart;
  ta.value=ta.value.substring(0,s)+text+ta.value.substring(s);
  ta.selectionStart=ta.selectionEnd=s+text.length;
  ta.focus();onMdInput();
}

/* ── SALVATAGGIO PAGINA ── */
function getTitle(){var el=document.getElementById('e-title');return el?el.value.trim():''}
function getIcon(){var el=document.getElementById('e-icon');return el?el.value.trim():''}
function _saveDelay(ms){return new Promise(function(r){setTimeout(r,ms)})}
async function savePage(){
  if(!_current||_saveInProgress)return;
  var md=document.getElementById('e-md').value;
  _current.title=getTitle()||_current.title;
  _current.icon=getIcon()||_current.icon;
  var json={k:_current.k,title:_current.title,icon:_current.icon,content:md,layout:_current.layout||'',toc:!!_current.toc,lastModified:new Date().toISOString()};
  var path=CONTENT+'/pages/'+_current.k+'.json';
  setStatus('saving','verifica conflitti...');
  var remote=await _checkRemoteSha();
  if(!remote.ok){
    var resolved=await _showConflictModal(md,remote.remoteContent,remote.remoteSha);
    if(!resolved){setStatus('idle','annullato');return}
    if(resolved==='remote'){_current.sha=remote.remoteSha}
  }
  setStatus('saving','salvataggio...');
  var btn=document.getElementById('save-btn');
  if(btn)btn.disabled=true;
  _saveInProgress=true;
  var maxRetries=3,lastErr=null;
  for(var attempt=0;attempt<maxRetries;attempt++){
    try{
      var r=await ghPut(path,'admin: update '+_current.k,JSON.stringify(json,null,2),_current.sha);
      if(r&&r.content&&r.content.sha)_current.sha=r.content.sha;
      /* Sync registry: titolo/icona del menu sito devono seguire la pagina */
      try{
        var rd=await ghGet('content/pages/registry.json');
        var reg=JSON.parse(b64decode(rd.content));
        var rp=reg.pages.find(function(x){return x.k===_current.k});
        if(rp&&(rp.l!==_current.title||rp.i!==_current.icon)){
          rp.l=_current.title;rp.i=_current.icon;
          await ghPut('content/pages/registry.json','admin: sync '+_current.k+' metadata to registry',JSON.stringify(reg,null,2)+'\n',rd.sha);
          var mi=PAGES.find(function(p){return p.k===_current.k});
          if(mi){mi.l=_current.title;mi.i=_current.icon}
          buildSidebar();
        }
      }catch(_re){/* best-effort */}
      _modified=false;_autosaveClear();_lastSavedContent=md;
      setBadge('ok','salvato');setStatus('ok','deploying...');
      await _logAudit('save_page',_current.k,{layout:_current.layout});
      toast('Salvato! Deploy Cloudflare in corso...','success');
      startDeployTimer();
      var edTitle=document.getElementById('ed-title');
      if(edTitle)edTitle.textContent=_current.title;
      var edIcon=document.getElementById('ed-icon');
      if(edIcon)edIcon.textContent=_current.icon||'📄';
      _saveInProgress=false;
      if(btn)btn.disabled=false;
      return;
    }catch(e){
      lastErr=e;
      if(attempt<maxRetries-1){
        var waitMs=Math.pow(2,attempt)*1000;
        setStatus('saving','retry tra '+Math.round(waitMs/1000)+'s…');
        await _saveDelay(waitMs);
      }
    }
  }
  _saveInProgress=false;
  setBadge('err','errore');setStatus('err','errore');
  toast('Salvataggio fallito dopo '+maxRetries+' tentativi: '+((lastErr&&lastErr.message)||'errore sconosciuto'),'error');
  if(btn)btn.disabled=false;
}

/* ── MODALE CONFLITTO CON DIFF ── */
function _lineDiff(localText,remoteText){
  var lLines=(localText||'').split('\n');
  var rLines=(remoteText||'').split('\n');
  var max=Math.max(lLines.length,rLines.length);
  var html='';
  for(var i=0;i<max;i++){
    var l=lLines[i]!==undefined?lLines[i]:null;
    var r=rLines[i]!==undefined?rLines[i]:null;
    if(l===r){
      html+='<div class="diff-line diff-same"><span class="diff-ln">'+(i+1)+'</span><span class="diff-t">'+esc(l||'')+'</span></div>';
    }else{
      if(l!==null)html+='<div class="diff-line diff-del"><span class="diff-ln">'+(i+1)+'</span><span class="diff-t">- '+esc(l)+'</span></div>';
      if(r!==null)html+='<div class="diff-line diff-add"><span class="diff-ln">'+(i+1)+'</span><span class="diff-t">+ '+esc(r)+'</span></div>';
    }
  }
  return html;
}
function _showConflictModal(localContent,remoteContent,remoteSha){
  return new Promise(function(resolve){
    var id='conflict-modal';
    var diffHtml=_lineDiff(localContent,remoteContent);
    var localLines=(localContent||'').split('\n').length;
    var remoteLines=(remoteContent||'').split('\n').length;
    var body='<div class="conflict-info">⚠️ Il file è stato modificato da un\'altra sessione. Confronta le modifiche qui sotto.</div>'
      +'<div class="diff-stats"><span class="diff-stat-local">'+localLines+' righe (la tua versione)</span>'
      +'<span class="diff-stat-remote">'+remoteLines+' righe (versione remota)</span></div>'
      +'<div class="diff-container" id="diff-scroll">'+diffHtml+'</div>';
    var actions='<button class="btn btn-soft" onclick="closeModal(\''+id+'\');window._conflictResolve(null)">Annulla</button>'
      +'<button class="btn btn-soft" onclick="closeModal(\''+id+'\');window._conflictResolve(\'remote\')">Ripristina remota</button>'
      +'<button class="btn btn-p" onclick="closeModal(\''+id+'\');window._conflictResolve(\'overwrite\')">Sovrascrivi</button>';
    window._conflictResolve=resolve;
    modalHtml(id,'⚠️ Conflitto rilevato',body,actions,'md-wide');
  });
}

/* ── DRAFT / PUBLISH ── */
async function _checkDraftStatus(){
  if(!_current||_current.type!=='page')return;
  try{
    var r=await fetch('/api/admin?action=get_draft&pageKey='+encodeURIComponent(_current.k),{credentials:'include'});
    var j=await r.json();
    var badge=document.getElementById('e-draft-badge');
    var pub=document.getElementById('publish-btn');
    if(j&&j.draft){
      if(badge)badge.style.display='';
      if(pub)pub.style.display='';
    }else{
      if(badge)badge.style.display='none';
      if(pub)pub.style.display='none';
    }
  }catch(e){}
}
async function saveDraft(){
  if(!_current||_current.type!=='page')return;
  var md=document.getElementById('e-md');
  var content=md?md.value:'';
  var title=getTitle()||_current.title;
  var icon=getIcon()||_current.icon;
  var layout=_current.layout||'';
  setStatus('saving','salvataggio bozza...');
  try{
    var r=await _authPost('/api/admin?action=save_draft',{pageKey:_current.k,content:content,title:title,icon:icon,layout:layout});
    var j=await r.json();
    if(!j.ok)throw new Error(j.error||'Errore bozza');
    var badge=document.getElementById('e-draft-badge');
    if(badge)badge.style.display='';
    var pub=document.getElementById('publish-btn');
    if(pub)pub.style.display='';
    setBadge('ok','bozza salvata');
    setStatus('ok','bozza salvata');
    setTimeout(function(){setStatus('idle','pronto')},1500);
    toast('Bozza salvata! Non è ancora visibile sul sito.','success');
    await _logAudit('save_draft',_current.k,{});
  }catch(e){setStatus('err','errore');toast('Errore bozza: '+e.message,'error')}
}
async function publishDraft(){
  if(!_current||_current.type!=='page')return;
  if(!confirm('Pubblicare questa bozza?\n\nLa versione attuale sul sito verrà sostituita con il contenuto della bozza e partirà il deploy.'))return;
  setStatus('saving','pubblicazione...');
  try{
    var r=await _authPost('/api/admin?action=publish_draft',{pageKey:_current.k});
    var j=await r.json();
    if(!j.ok)throw new Error(j.error||'Errore pubblicazione');
    var badge=document.getElementById('e-draft-badge');
    if(badge)badge.style.display='none';
    var pub=document.getElementById('publish-btn');
    if(pub)pub.style.display='none';
    setBadge('ok','pubblicato');
    setStatus('ok','deploying...');
    toast('Bozza pubblicata! Deploy in corso…','success');
    startDeployTimer();
    await _logAudit('publish_draft',_current.k,{});
    openPage(_current.k);
  }catch(e){setStatus('err','errore');toast('Errore pubblicazione: '+e.message,'error')}
}

/* ── INSERIMENTO IMMAGINI ── */
var _imgDataUri=null;
function openImgDialog(){
  if(document.getElementById('img-modal'))return;
  modalHtml('img-modal','🖼 Inserisci immagine',
    '<div class="fld"><label>Testo alternativo / didascalia (opzionale)</label><input id="img-alt" class="in" placeholder="es. Mappa della regione"></div>'
    +'<div class="fld"><label>URL immagine</label><input id="img-url" class="in" type="url" placeholder="https://… oppure /images/…" onkeydown="if(event.key===\'Enter\')insertImgFromUrl()">'
    +'<div class="md-actions" style="padding:6px 0 0;border:none"><button class="btn btn-soft btn-sm" onclick="insertImgFromUrl()">Usa URL</button></div></div>'
    +'<div class="or">oppure carica dal PC</div>'
    +'<div class="upload-zone"><input type="file" id="img-file" accept="image/*" aria-label="Carica immagine dal PC" onchange="imgFileSelected(this)"><span class="uzi">🖼</span>Scegli un file immagine<br><small style="color:var(--dim)">viene compresso e caricato su /images/</small></div>'
    +'<img id="img-preview" class="img-prev" alt="anteprima">'
    +'<div class="md-status" id="img-status"></div>',
    '<button class="btn btn-soft" onclick="closeImgDialog()">Annulla</button>'
    +'<button class="btn btn-p" id="img-upload-btn" onclick="insertImgFromUpload()" disabled>Carica e inserisci</button>');
  var alt=document.getElementById('img-alt');
  if(alt)alt.focus();
}
function closeImgDialog(){closeModal('img-modal')}
var _emojiList=['📜','📖','⚔️','🛡️','🏰','🐉','🔮','💀','🗺️','🏹','🗡️','🪄','🧙','🧝','🧟','👑','💰','🔔','⏳','🔥','❄️','⚡','🌙','☀️','⭐','🌿','🕯️','🍷','🍞','🪙','⚒️','🎯','🎲','🧵','🪶','💍','⚗️','🌊','🏔️','🌲','🦌','🐺','🦅','🐎','🧊','🌋','🕸️','🦇','🪓','🛶','🏕️','🎪','📯','⚖️','🗝️','🧭','👁️','🗿','🍖','🫙','🧂'];
function openEmojiDialog(){
  if(document.getElementById('emoji-modal'))return;
  var grid=_emojiList.map(function(e){return '<button type="button" class="em-cell" data-emoji="'+e+'">'+e+'</button>'}).join('');
  modalHtml('emoji-modal','😀 Inserisci emoji','<div class="em-grid">'+grid+'</div>','<button class="btn btn-soft" onclick="closeModal(\'emoji-modal\')">Annulla</button>');
  var cells=document.querySelectorAll('#emoji-modal .em-cell');
  for(var i=0;i<cells.length;i++)cells[i].addEventListener('click',function(){insMd(this.getAttribute('data-emoji'));closeModal('emoji-modal')});
}
function openTableDialog(){
  if(document.getElementById('table-modal'))return;
  modalHtml('table-modal','⊞ Inserisci tabella',
    '<div class="fld"><label>Colonne</label><input id="tbl-cols" class="in" type="number" min="1" max="12" value="3"></div>'
    +'<div class="fld"><label>Righe</label><input id="tbl-rows" class="in" type="number" min="1" max="30" value="3"></div>',
    '<button class="btn btn-soft" onclick="closeModal(\'table-modal\')">Annulla</button>'
    +'<button class="btn btn-p" onclick="insertTable()">Inserisci</button>');
  var c=document.getElementById('tbl-cols');
  if(c)c.focus();
}
function insertTable(){
  var c=parseInt(document.getElementById('tbl-cols').value,10)||3;
  var r=parseInt(document.getElementById('tbl-rows').value,10)||3;
  var pad=new Array(c+1).join('  |');
  var sep='|'+new Array(c+1).join('---|');
  var txt='\n'+sep+'\n|'+pad;
  for(var i=1;i<r;i++)txt+='\n|'+pad;
  txt+='\n';
  insMd(txt);
  closeModal('table-modal');
}

/* ── CALLOUT / SEZIONI RICHIUDIBILI ── */
var EDITOR_CALLOUTS=[
  ['NOTE','💡','Nota'],['INFO','ℹ️','Informazione'],['TIP','💡','Suggerimento'],
  ['WARNING','⚠️','Attenzione'],['CAUTION','⚠️','Caution'],['IMPORTANT','⭐','Importante'],
  ['LORE','📖','Lore'],['QUEST','🗺️','Quest'],['SECRET','🕳️','Segreto'],
  ['MAGIC','🔮','Magia'],['REGOLA','⚖️','Regola'],['TESORO','💰','Tesoro'],
  ['MOSTRO','🐉','Mostro'],['NPC','👤','PNG'],['DM','🎲','Solo Master']
];
function openCalloutDialog(){
  if(document.getElementById('co-modal'))return;
  var opts=EDITOR_CALLOUTS.map(function(c){
    return '<option value="'+c[0]+'">'+c[1]+' '+c[2]+' — [!'+c[0]+']</option>';
  }).join('');
  modalHtml('co-modal','❗ Inserisci callout',
    '<div class="fld"><label>Tipo</label><select id="co-type" class="in">'+opts+'</select></div>'
    +'<div class="fld"><label>Titolo (opzionale)</label><input id="co-title" class="in" placeholder="es. Segreto del GM" onkeydown="if(event.key===\'Enter\')insertCallout()"></div>'
    +'<div class="fld"><label>Contenuto iniziale</label><textarea id="co-body" class="in" rows="4" placeholder="Testo del callout…" style="font-family:var(--mono);font-size:12px;resize:vertical"></textarea></div>'
    +'<div class="fld"><label>Comportamento</label><select id="co-fold" class="in">'
    +'<option value="">Sempre visibile</option>'
    +'<option value="+">Richiudibile — aperto di default</option>'
    +'<option value="-">Richiudibile — chiuso di default</option>'
    +'</select></div>',
    '<button class="btn btn-soft" onclick="closeModal(\'co-modal\')">Annulla</button>'
    +'<button class="btn btn-p" onclick="insertCallout()">INSERISCI</button>');
}
function insertCallout(){
  var type=document.getElementById('co-type').value||'NOTE';
  var title=(document.getElementById('co-title').value||'').trim();
  var body=document.getElementById('co-body').value||'';
  var fold=document.getElementById('co-fold').value||'';
  var head='> [!'+type+']'+fold+(title?' '+title:'');
  var lines=[head];
  body.split('\n').forEach(function(l){lines.push('> '+l)});
  insMd('\n'+lines.join('\n')+'\n');
  closeModal('co-modal');
}
function insertFoldTemplate(){
  insMd('\n> [!NOTE]- Titolo sezione richiudibile\n> Contenuto nascosto: clicca sul titolo per espandere.\n');
}

/* ── NOTE A PIÈ DI PAGINA ── */
function _nextFootnoteNum(val){
  var max=0,m,re=/\[\^(\d+)\]/g;
  while((m=re.exec(val))){var n=parseInt(m[1],10);if(n>max)max=n}
  return max+1;
}
function insertFootnote(){
  var ta=document.getElementById('e-md');if(!ta)return;
  var n=_nextFootnoteNum(ta.value);
  var s=ta.selectionStart,en=ta.selectionEnd;
  ta.value=ta.value.substring(0,s)+'[^'+n+']'+ta.value.substring(en);
  var def='\n\n[^'+n+']: ';
  ta.value+=def;
  var pos=ta.value.length;
  ta.selectionStart=ta.selectionEnd=pos;
  ta.focus();onMdInput();
}
function imgFileSelected(input){
  var file=input.files&&input.files[0];
  if(!file){_imgDataUri=null;return}
  var status=document.getElementById('img-status');
  if(status)status.textContent='Elaborazione…';
  var reader=new FileReader();
  reader.onload=function(e){
    compressImg(e.target.result,function(b64){
      _imgDataUri=b64;
      var pv=document.getElementById('img-preview');
      if(pv){pv.src=b64;pv.classList.add('show')}
      var btn=document.getElementById('img-upload-btn');
      if(btn)btn.disabled=false;
      if(status)status.textContent='Immagine pronta ('+Math.round(b64.length/1024)+' KB)';
    });
  };
  reader.readAsDataURL(file);
}
function compressImg(dataUrl,cb){
  var img=new Image();
  img.onload=function(){
    var MAX=900,w=img.width,h=img.height;
    if(w>MAX){h=Math.round(h*MAX/w);w=MAX}
    if(h>MAX){w=Math.round(w*MAX/h);h=MAX}
    var c=document.createElement('canvas');
    c.width=w;c.height=h;
    c.getContext('2d').drawImage(img,0,0,w,h);
    cb(c.toDataURL('image/jpeg',0.82));
  };
  img.src=dataUrl;
}
function insertImgFromUrl(){
  var url=(document.getElementById('img-url').value||'').trim();
  var alt=(document.getElementById('img-alt').value||'').trim();
  if(!url){toast('Inserisci un URL','error');return}
  insertImageMarkdown(alt,url);
}
async function insertImgFromUpload(){
  if(!_imgDataUri){toast('Scegli prima un file immagine','error');return}
  var btn=document.getElementById('img-upload-btn');
  var status=document.getElementById('img-status');
  if(btn)btn.disabled=true;
  if(status)status.textContent='Caricamento su GitHub…';
  var name=(_current&&_current.k||'img')+'-'+Date.now()+'.'+_imgExt(_imgDataUri);
  try{
    await ghPutBinary('images/'+name,'admin: add image '+name,_imgDataUri);
    if(_current&&_current.type==='images'){
      closeImgDialog();
      toast('Immagine caricata ✓','success');
      setTimeout(openImages,400);
      return;
    }
    var alt=(document.getElementById('img-alt').value||'').trim();
    insertImageMarkdown(alt,'/images/'+name);
    toast('Immagine caricata e inserita ✓','success');
  }catch(e){
    if(btn)btn.disabled=false;
    if(status)status.textContent='';
    toast('Errore caricamento: '+e.message,'error');
  }
}
function _imgExt(dataUri){
  var m=dataUri.match(/^data:image\/([a-zA-Z0-9.+-]+);/);
  var t=m?m[1]:'jpg';
  if(t==='jpeg')t='jpg';
  return t;
}
function insertImageMarkdown(alt,src){
  var a=(alt||'').replace(/\[/g,'(').replace(/\]/g,')');
  insMd('\n!['+a+']('+src+')\n');
  closeImgDialog();
}

/* ── VISTA JSON ── */
function toggleJson(){
  var jp=document.getElementById('json-pane');var body=document.getElementById('editor-body');
  var frame=document.getElementById('site-frame');
  if(!jp)return;
  if(jp.classList.contains('active')){
    jp.classList.remove('active');
    try{
      var j=JSON.parse(document.getElementById('e-json').value);
      var md=document.getElementById('e-md');
      var title=document.getElementById('e-title');
      var icon=document.getElementById('e-icon');
      var ls=document.getElementById('e-layout');
      if(md&&j.content!==undefined)md.value=j.content;
      if(title&&j.title!==undefined)title.value=j.title;
      if(icon&&j.icon!==undefined)icon.value=j.icon;
      if(ls&&j.layout!==undefined){ls.value=j.layout||'';_current.layout=j.layout||'';onLayoutChange(j.layout||'',true)}
      _current.title=j.title||_current.title;
      _current.icon=j.icon||_current.icon;
      onMdInput();
    }catch(e){toast('JSON non valido: '+e.message,'error')}
    setViewMode(_viewMode);
  }else{
    var json={k:_current.k,title:getTitle(),icon:getIcon(),content:document.getElementById('e-md').value,layout:_current.layout||'',lastModified:new Date().toISOString()};
    document.getElementById('e-json').value=JSON.stringify(json,null,2);
    if(body)body.style.display='none';
    if(frame)frame.style.display='none';
    jp.classList.add('active');
  }
}

/* ── NUOVA PAGINA / SEZIONE ── */
var _slugTouched=false;
function slugify(t){
  return (t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').replace(/^-+|-+$/g,'');
}
function _subOptionsForSec(sec,cur){
  var subs={};
  PAGES.forEach(function(p){if(p.sec===sec&&p.sub)subs[p.sub]=1});
  var h='<option value="">— nessuna —</option>';
  Object.keys(subs).sort().forEach(function(k){
    h+='<option value="'+escAttr(k)+'"'+(k===cur?' selected':'')+'>'+esc(k)+'</option>';
  });
  h+='<option value="__new__">➕ nuova…</option>';
  return h;
}
function openNewPageModal(){
  if(document.getElementById('np-modal'))return;
  _slugTouched=false;
  var layoutOpts='';
  LAYOUTS.forEach(function(l){if(l.v)layoutOpts+='<option value="'+l.v+'">'+l.i+' '+l.l+'</option>'});
  var secOpts='';
  SECTIONS.forEach(function(s){secOpts+='<option value="'+s.v+'">'+s.l+'</option>'});
  var subOpts=_subOptionsForSec('','');
  modalHtml('np-modal','➕ Nuova pagina / sezione',
    '<div class="fld"><label>Nome della sezione</label><input id="np-label" class="in" placeholder="es. La Gilda dei Mercanti" onkeydown="if(event.key===\'Enter\')createNewPage()"></div>'
    +'<div class="fld"><label>Icona (emoji)</label><input id="np-icon" class="in" placeholder="es. 🏛️" value="📄" onkeydown="if(event.key===\'Enter\')createNewPage()"></div>'
    +'<div class="fld"><label>Slug / URL</label><input id="np-slug" class="in" placeholder="auto (es. la-gilda-dei-mercanti)" onkeydown="if(event.key===\'Enter\')createNewPage()"></div>'
    +'<div class="fld"><label>Sezione del menu</label><select id="np-sec" class="in">'+secOpts+'</select></div>'
    +'<div class="fld"><label>Sottosezione (opzionale)</label><select id="np-sub" class="in">'+subOpts+'</select></div>'
    +'<div class="fld"><label>Layout</label><select id="np-layout" class="in">'+layoutOpts+'</select></div>',
    '<button class="btn btn-soft" onclick="closeNewPageModal()">Annulla</button>'
    +'<button class="btn btn-p" id="np-save" onclick="createNewPage()">CREA</button>');
  var label=document.getElementById('np-label');
  label.addEventListener('input',function(){
    if(!_slugTouched)document.getElementById('np-slug').value=slugify(label.value);
  });
  document.getElementById('np-slug').addEventListener('input',function(){_slugTouched=true});
  document.getElementById('np-sec').addEventListener('change',function(){
    document.getElementById('np-sub').innerHTML=_subOptionsForSec(this.value,'');
  });
  label.focus();
}
function closeNewPageModal(){closeModal('np-modal')}
function buildNewPageContent(layout,label){
  var tpl=LAYOUT_TEMPLATES[layout]||'';
  if(tpl)return tpl;
  return '# '+label+'\n\nInserisci il contenuto di questa sezione...';
}
async function createNewPage(){
  var label=(document.getElementById('np-label').value||'').trim();
  var icon=(document.getElementById('np-icon').value||'').trim()||'📄';
  var slug=(document.getElementById('np-slug').value||'').trim()||slugify(label);
  var sec=document.getElementById('np-sec').value||'';
  var sub=document.getElementById('np-sub').value||'';
  if(sub==='__new__'){
    var n=prompt('Nome della sottosezione (es. Storia, Razze, Luoghi):');
    if(n===null)return;
    n=n.trim();
    if(!n){toast('Nome non valido','error');return}
    sub=n;
  }
  var layout=document.getElementById('np-layout').value||'';
  if(!label){toast('Inserisci un nome per la sezione','error');return}
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)){toast('Slug non valido: solo minuscole, numeri e trattini','error');return}
  if(PAGES.some(function(p){return p.k===slug})){toast('Esiste già una pagina con slug "'+slug+'"','error');return}
  var id='pag-'+slug;
  var btn=document.getElementById('np-save');
  if(btn)btn.disabled=true;
  setStatus('saving','creazione...');
  try{
    var json={k:slug,title:label,icon:icon,content:buildNewPageContent(layout,label),layout:layout,lastModified:new Date().toISOString()};
    /* Commit atomico: file pagina + registro insieme */
    var d0=await ghGet('content/pages/registry.json');
    var reg=JSON.parse(b64decode(d0.content));
    if(!Array.isArray(reg.pages))reg.pages=[];
    var entry={k:slug,l:label,i:icon,id:id,c:1,menu:true,admin:true};
    if(sec)entry.sec=sec;
    if(sub)entry.sub=sub;
    entry.path=sec?sec+'/'+slug:slug;
    reg.pages.push(entry);
    await ghCommitMulti([
      { path:'content/pages/'+slug+'.json', content:b64encode(JSON.stringify(json,null,2)) },
      { path:'content/pages/registry.json', content:b64encode(JSON.stringify(reg,null,2)+'\n') }
    ],'admin: create page '+slug);
    PAGES.push({k:slug,l:label,i:icon,sec:sec,sub:sub,c:1});
    _contentIndex=null;
    buildSidebar();
    closeNewPageModal();
    toast('Pagina "'+label+'" creata! Deploy in corso (~30s)...','success');
    setStatus('ok','deploying...');
    startDeployTimer();
    _modified=false;
    await openPage(slug);
    setActive('page',slug);
  }catch(e){
    setStatus('err','errore');
    toast('Errore creazione: '+e.message,'error');
    if(btn)btn.disabled=false;
  }
}
function _arrayInsert(s,marker,close,entry){
  var start=s.indexOf(marker);
  if(start===-1)throw new Error('Marker non trovato: '+marker);
  var end=s.indexOf(close,start);
  if(end===-1)throw new Error('Chiusura non trovata: '+close);
  var before=s.slice(0,end).replace(/\s+$/,'');
  if(before.slice(-1)!==',')before+=',';
  return before+'\n'+entry+s.slice(end);
}
/* ── ELIMINA PAGINA / SEZIONE ── */
function _removeLine(s,re){
  var lines=s.split('\n');
  for(var i=0;i<lines.length;i++){
    if(re.test(lines[i])){lines.splice(i,1);return {s:lines.join('\n'),found:true}}
  }
  return {s:s,found:false};
}
function _cleanLastComma(s,marker,close){
  var start=s.indexOf(marker);
  if(start===-1)return s;
  var end=s.indexOf(close,start);
  if(end===-1)return s;
  var before=s.slice(0,end).replace(/\s+$/,'');
  if(before.slice(-1)!==',')return s;
  return before.slice(0,-1)+'\n'+close+s.slice(end+close.length);
}
async function removeFromRegistry(slug){
  var d=await ghGet('content/pages/registry.json');
  var reg=JSON.parse(b64decode(d.content));
  if(!Array.isArray(reg.pages))reg.pages=[];
  var pg=reg.pages.find(function(p){return p.k===slug});
  var id=pg?pg.id:null;
  var before=JSON.stringify(reg);
  reg.pages=reg.pages.filter(function(p){return p.k!==slug});
  (reg.sections||[]).forEach(function(s){
    if(Array.isArray(s.pages))s.pages=s.pages.filter(function(x){return x!==id});
  });
  if(id){
    if(Array.isArray(reg.lavori))reg.lavori=reg.lavori.filter(function(w){return w.id!==id});
    if(Array.isArray(reg.legacySlugs))reg.legacySlugs=reg.legacySlugs.filter(function(x){return x.id!==id});
    if(Array.isArray(reg.layoutDatabases))reg.layoutDatabases=reg.layoutDatabases.filter(function(x){return x.id!==id});
    if(Array.isArray(reg.pathOverrides))reg.pathOverrides=reg.pathOverrides.filter(function(x){return x.id!==id});
    (reg.indexDatabases||[]).forEach(function(db){
      if(Array.isArray(db.ids))db.ids=db.ids.filter(function(x){return x!==id});
    });
  }
  var out=JSON.stringify(reg,null,2)+'\n';
  if(out!==before)await ghPut('content/pages/registry.json','admin: remove page '+slug+' from registry',out,d.sha);
}
async function addToRegistry(slug,label,icon,id,sec,sub){
  var d=await ghGet('content/pages/registry.json');
  var reg=JSON.parse(b64decode(d.content));
  if(!Array.isArray(reg.pages))reg.pages=[];
  var entry={k:slug,l:label,i:icon,id:id,c:1,menu:true,admin:true};
  if(sec)entry.sec=sec;
  if(sub)entry.sub=sub;
  entry.path=sec?sec+'/'+slug:slug;
  reg.pages.push(entry);
  await ghPut('content/pages/registry.json','admin: add page '+slug+' to registry',JSON.stringify(reg,null,2)+'\n',d.sha);
}
async function renameInRegistry(slug,label,icon){
  var d=await ghGet('content/pages/registry.json');
  var reg=JSON.parse(b64decode(d.content));
  var p=reg.pages.find(function(x){return x.k===slug});
  if(!p)throw new Error('registry: pagina '+slug+' non trovata');
  p.l=label;p.i=icon;
  await ghPut('content/pages/registry.json','admin: rename page '+slug,JSON.stringify(reg,null,2)+'\n',d.sha);
}
async function deletePage(){
  if(!_current||_current.type!=='page')return;
  var meta=PAGES.find(function(p){return p.k===_current.k});
  var isCustom=!!(meta&&meta.c);
  var label=_current.title||_current.k;
  var msg=isCustom
    ?'Eliminare definitivamente la pagina "'+label+'"?\n\nVerranno rimossi contenuto, voce del menu e URL dedicato. Questa operazione non è reversibile.'
    :'Eliminare la sezione "'+label+'"?\n\nAttenzione: è una sezione predefinita del sito. Verranno rimossi il contenuto locale, la voce dal menu (desktop e mobile), la card dalla home e l\'URL dedicato. Questa operazione non è reversibile.';
  if(!(await uiConfirm(msg,{title:'Elimina pagina',ok:'ELIMINA'})))return;
  var btn=document.getElementById('del-btn');
  if(btn)btn.disabled=true;
  setStatus('saving','eliminazione...');
  var slug=_current.k;
  try{
    var id=await _getPageId(slug);
    /* Commit atomico: file pagina + registry in un solo commit,
       così il repo non passa mai da uno stato invalido (workflow validate). */
    var d=await ghGet('content/pages/registry.json');
    var reg=JSON.parse(b64decode(d.content));
    reg.pages=(reg.pages||[]).filter(function(p){return p.k!==slug});
    if(id){
      (reg.sections||[]).forEach(function(s){
        if(Array.isArray(s.pages))s.pages=s.pages.filter(function(x){return x!==id});
      });
      if(Array.isArray(reg.lavori))reg.lavori=reg.lavori.filter(function(w){return w.id!==id});
      if(Array.isArray(reg.legacySlugs))reg.legacySlugs=reg.legacySlugs.filter(function(x){return x.id!==id});
      if(Array.isArray(reg.layoutDatabases))reg.layoutDatabases=reg.layoutDatabases.filter(function(x){return x.id!==id});
      if(Array.isArray(reg.pathOverrides))reg.pathOverrides=reg.pathOverrides.filter(function(x){return x.id!==id});
      (reg.indexDatabases||[]).forEach(function(db){
        if(Array.isArray(db.ids))db.ids=db.ids.filter(function(x){return x!==id});
      });
    }
    var files=[{ path:'content/pages/registry.json', content:b64encode(JSON.stringify(reg,null,2)+'\n') }];
    files.push({ path:'content/pages/'+slug+'.json', content:null });
    await ghCommitMulti(files,'admin: delete page '+slug);
    if(id&&id.indexOf('pag-')!==0)await removeFromIndex(slug,id);
    for(var i=0;i<PAGES.length;i++){if(PAGES[i].k===slug){PAGES.splice(i,1);break}}
    _modified=false;
    _contentIndex=null;
    _current=null;
    buildSidebar();
    document.getElementById('main').innerHTML='<div class="empty"><span class="ei">🗑</span>'+esc(label)+' eliminata</div>';
    setTitle('');
    toast('Sezione "'+label+'" eliminata! Deploy in corso (~30s)...','success');
    setStatus('ok','deploying...');
    startDeployTimer();
  }catch(e){
    setStatus('err','errore');
    toast('Errore eliminazione: '+e.message,'error');
    if(btn)btn.disabled=false;
  }
}

/* ── RINOMINA SEZIONE / PAGINA ── */
async function _getPageId(slug){
  try{
    var d=await ghGet('content/pages/registry.json');
    var reg=JSON.parse(b64decode(d.content));
    var p=reg.pages.find(function(x){return x.k===slug});
    return p?p.id:null;
  }catch(e){return null}
}
function _replaceKV(line,key,val){
  var v=JSON.stringify(val);
  return line.replace(new RegExp(key+":(\"[^\"]*\"|'[^']*')"),key+":"+v);
}

function _gpArg(s){return s.replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function _rewriteIndexForPage(html,id,label,icon){
  var L=_gpArg(label),I=_gpArg(icon),LH=esc(label),IH=esc(icon);
  html=html.replace(new RegExp("(<div class=\"tn-item\"[^>]*gp\\('"+id+"','[^']*','[^']*'\\)[^>]*>)<span class=\"tn-ii\">[^<]*</span>[^<]*(</div>)"),
    "$1<span class=\"tn-ii\">"+IH+"</span>"+LH+"$2");
  html=html.replace(new RegExp("(<div class=\"mn-item\"[^>]*gp\\('"+id+"','[^']*','[^']*'\\)[^>]*>)<span class=\"mn-ii\">[^<]*</span>[^<]*(</div>)"),
    "$1<span class=\"mn-ii\">"+IH+"</span>"+LH+"$2");
  html=html.replace(new RegExp("(<div class=\"lcard\"[^>]*gp\\('"+id+"','[^']*','[^']*'\\)[^>]*><div class=\"shine\"></div><div class=\"cthumb\"[^>]*>)<span>[^<]*</span>"),
    "$1<span>"+IH+"</span>");
  html=html.replace(new RegExp("(<div class=\"lcard\"[^>]*gp\\('"+id+"','[^']*','[^']*'\\)[^>]*>[^\\n]*?<div class=\"ctit\">)[^<]*(</div>)"),
    "$1"+LH+"$2");
  html=html.replace(new RegExp("gp\\('"+id+"','[^']*','[^']*'\\)"),"gp('"+id+"','"+L+"','"+I+"')");
  return html;
}
function _removeIndexForPage(html,id){
  html=html.replace(new RegExp("<div class=\"tn-item\"[^>]*gp\\('"+id+"','[^']*','[^']*'\\)[^>]*>[^\\n]*"),'');
  html=html.replace(new RegExp("<div class=\"mn-item\"[^>]*gp\\('"+id+"','[^']*','[^']*'\\)[^>]*>[^\\n]*"),'');
  html=html.replace(new RegExp("<div class=\"lcard\"[^>]*gp\\('"+id+"','[^']*','[^']*'\\)[^>]*>[^\\n]*"),'');
  html=html.replace(new RegExp("<div class=\"bnav-item\"[^>]*gp\\('"+id+"','[^']*','[^']*'\\)[^>]*>[^\\n]*"),'');
  return html;
}
async function renameInIndex(slug,id,label,icon){
  if(id.indexOf('pag-')===0)return;
  var d=await ghGet('index.html');
  var s=b64decode(d.content);
  var out=_rewriteIndexForPage(s,id,label,icon);
  if(out!==s)await ghPut('index.html','admin: rename page '+slug+' in nav',out,d.sha);
}
async function removeFromIndex(slug,id){
  if(id.indexOf('pag-')===0)return;
  var d=await ghGet('index.html');
  var s=b64decode(d.content);
  var out=_removeIndexForPage(s,id);
  if(out!==s)await ghPut('index.html','admin: remove page '+slug+' from nav',out,d.sha);
}
function openRenameModal(){
  if(!_current||_current.type!=='page')return;
  if(document.getElementById('rn-modal'))return;
  var meta=PAGES.find(function(p){return p.k===_current.k});
  var label=_current.title||(meta&&meta.l)||_current.k;
  var icon=_current.icon||(meta&&meta.i)||'📄';
  modalHtml('rn-modal','✏️ Rinomina sezione / pagina',
    '<div class="fld"><label>Nome</label><input id="rn-label" class="in" value="'+escAttr(label)+'" onkeydown="if(event.key===\'Enter\')saveRename()"></div>'
    +'<div class="fld"><label>Icona (emoji)</label><input id="rn-icon" class="in" value="'+escAttr(icon)+'" onkeydown="if(event.key===\'Enter\')saveRename()"></div>',
    '<button class="btn btn-soft" onclick="closeRenameModal()">Annulla</button>'
    +'<button class="btn btn-p" onclick="saveRename()">RINOMINA</button>');
  var l=document.getElementById('rn-label');
  if(l)l.focus();
}
function closeRenameModal(){closeModal('rn-modal')}
async function saveRename(){
  if(!_current||_current.type!=='page')return;
  var label=(document.getElementById('rn-label').value||'').trim();
  var icon=(document.getElementById('rn-icon').value||'').trim()||'📄';
  if(!label){toast('Inserisci un nome','error');return}
  var slug=_current.k;
  var btn=document.querySelector('#rn-modal .btn-p');
  if(btn)btn.disabled=true;
  setStatus('saving','rinomina...');
  try{
    var id=await _getPageId(slug);
    if(_current.sha){
      var d=await ghGet(CONTENT+'/pages/'+slug+'.json');
      var raw=b64decode(d.content);
      var json=JSON.parse(raw);
      json.title=label;json.icon=icon;
      var r=await ghPut(CONTENT+'/pages/'+slug+'.json','admin: rename page '+slug,JSON.stringify(json,null,2),d.sha);
      if(r&&r.content&&r.content.sha)_current.sha=r.content.sha;
    }
    await renameInRegistry(slug,label,icon);
    var mi=PAGES.find(function(p){return p.k===slug});
    if(mi){mi.l=label;mi.i=icon}
    if(id&&id.indexOf('pag-')!==0)await renameInIndex(slug,id,label,icon);
    _current.title=label;_current.icon=icon;
    setTitle(icon+' '+label);
    var h2=document.getElementById('ed-title');
    if(h2)h2.textContent=label;
    var ic=document.getElementById('ed-icon');
    if(ic)ic.textContent=icon;
    var t=document.getElementById('e-title');
    if(t)t.value=label;
    var i2=document.getElementById('e-icon');
    if(i2)i2.value=icon;
    buildSidebar();
    setActive('page',slug);
    closeRenameModal();
    toast('Sezione "'+label+'" rinominata! Deploy in corso (~30s)...','success');
    setStatus('ok','deploying...');
    startDeployTimer();
    _modified=false;
  }catch(e){
    setStatus('err','errore');
    toast('Errore rinomina: '+e.message,'error');
    if(btn)btn.disabled=false;
  }
}

/* ── STORIA / RIPRISTINO VERSIONE ── */
async function openHistory(){
  if(!_current||_current.type!=='page')return;
  if(document.getElementById('hist-modal'))return;
  setStatus('saving','caricamento storia…');
  try{
    var path=CONTENT+'/pages/'+_current.k+'.json';
    var commits=await ghCommits(path);
    var rows=commits&&commits.length?commits.map(function(c,i){
      var msg=c.commit&&c.commit.message||'';
      var date=c.commit&&c.commit.author&&c.commit.author.date?new Date(c.commit.author.date).toLocaleString('it-IT'):'';
      var sha=c.sha?c.sha.slice(0,8):'';
      var prevSha=(i<commits.length-1)?commits[i+1].sha:'';
      var diffBtn=prevSha?'<button class="btn btn-soft btn-sm" onclick="showDiff(\''+prevSha+'\',\''+c.sha+'\')">DIFF</button>':'';
      return '<div class="row" style="cursor:default;background:var(--panel);border:1px solid var(--line)">'
        +'<div class="rmain"><div class="rt">'+esc(msg)+'</div><div class="rs">'+sha+' · '+esc(date)+'</div></div>'
        +'<div class="ract">'+diffBtn
        +'<button class="btn btn-soft btn-sm" onclick="restoreVersion(\''+c.sha+'\')">RIPRISTINA</button></div></div>';
    }).join(''):'<div class="list-empty">Nessun commit trovato</div>';
    modalHtml('hist-modal','📜 Storia — '+esc(_current.title||_current.k),
      '<div class="list-body">'+rows+'</div>',
      '<button class="btn btn-soft" onclick="closeModal(\'hist-modal\')">Chiudi</button>');
    setStatus('idle','pronto');
  }catch(e){setStatus('err','errore');toast(e.message,'error')}
}
async function showDiff(sha1,sha2){
  setStatus('saving','calcolo diff…');
  try{
    var r=await _authPost('/api/admin?action=get_diff',{sha1:sha1,sha2:sha2,path:CONTENT+'/pages/'+_current.k+'.json'});
    var j=await r.json();
    if(!j.ok)throw new Error(j.error||'Diff non disponibile');
    var lines=j.diff||[];
    var h='<div class="diff-view" style="font-family:var(--mono);font-size:12px;max-height:60vh;overflow-y:auto;padding:0">';
    h+='<div style="padding:8px 12px;border-bottom:1px solid var(--line);color:var(--dim);font-size:11px">'
      +sha1.slice(0,8)+' → '+sha2.slice(0,8)+'</div>';
    if(!lines.length){
      h+='<div style="padding:16px;text-align:center;color:var(--dim)">Nessuna differenza</div>';
    }else{
      lines.forEach(function(ln){
        var cls='',prefix=' ';
        if(ln[0]==='+'){cls='diff-add';prefix='+'}
        else if(ln[0]==='-'){cls='diff-del';prefix='-'}
        else if(ln[0]==='@'){cls='diff-hunk';prefix=' '}
        h+='<div class="'+cls+'" style="padding:2px 12px;white-space:pre-wrap;border-bottom:1px solid rgba(255,255,255,0.03)">'+esc(prefix+ln.slice(1))+'</div>';
      });
    }
    h+='</div>';
    modalHtml('diff-modal','🔀 Diff — '+_current.k,h,
      '<button class="btn btn-soft" onclick="closeModal(\'diff-modal\')">Chiudi</button>','md-wide');
  }catch(e){toast('Errore diff: '+e.message,'error')}
  setStatus('idle','pronto');
}
async function restoreVersion(sha){
  if(!confirm('Ripristinare questa versione nell\'editor?\n\nNon viene salvata automaticamente: controlla il contenuto e poi premi SALVA.'))return;
  try{
    var d=await ghGetAt(CONTENT+'/pages/'+_current.k+'.json',sha);
    var raw=b64decode(d.content);
    var json=JSON.parse(raw);
    var md=document.getElementById('e-md');
    if(md)md.value=json.content||'';
    _current.title=json.title;_current.icon=json.icon;_current.layout=json.layout||'';
    setTitle((json.icon||'📄')+' '+(json.title||_current.k));
    var h2=document.getElementById('ed-title');
    if(h2)h2.textContent=json.title||_current.k;
    var ic=document.getElementById('ed-icon');
    if(ic)ic.textContent=json.icon||'📄';
    var t=document.getElementById('e-title');
    if(t)t.value=json.title||'';
    var ic2=document.getElementById('e-icon');
    if(ic2)ic2.value=json.icon||'';
    var ls=document.getElementById('e-layout');
    if(ls){ls.value=json.layout||'';onLayoutChange(ls.value,true)}
    renderPreview();
    _modified=true;setBadge('dirty','ripristinata — salva per applicare');
    closeModal('hist-modal');
    toast('Versione ripristinata nell\'editor. Premi SALVA.','success');
  }catch(e){toast('Errore ripristino: '+e.message,'error')}
}

/* ── LINK CHECKER INTERNO ── */
var _pathMapCached=null;
async function _getPathMap(){
  if(_pathMapCached)return _pathMapCached;
  var d=await ghGet('scripts/js/app.js');
  var s=b64decode(d.content);
  var start=s.indexOf('var _pathMap = {');
  var end=s.indexOf('};',start);
  if(start===-1||end===-1){_pathMapCached={};return _pathMapCached}
  var block=s.slice(start+15,end);
  var pm={};
  block.split('\n').forEach(function(line){
    var m=line.match(/^\s*['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"],?\s*$/);
    if(m)pm[m[1]]=m[2];
  });
  _pathMapCached=pm;
  return pm;
}
async function checkLinks(){
  if(!_current||_current.type!=='page')return;
  var md=document.getElementById('e-md').value;
  var links=[];
  var re=/(?:^|[\s("'`])(\/[a-zA-Z0-9\-_/]+)/g,m;
  while((m=re.exec(md)))links.push(m[1].trim());
  links=links.filter(function(l){return l.indexOf('/images/')!==0&&l.indexOf('/audio/')!==0&&l.indexOf('/scripts/')!==0});
  if(!links.length){toast('Nessun link interno trovato nel contenuto','success');return}
  setStatus('saving','verifica link…');
  try{
    var pm=await _getPathMap();
    var bad=links.filter(function(l){
      var p=l.replace(/^\//,'').replace(/\/+$/,'');
      return !pm.hasOwnProperty(p);
    });
    var rows=bad.length?bad.map(function(l){
      return '<div class="row" style="cursor:default;background:var(--panel);border:1px solid var(--line)">'
        +'<div class="rico">🔗</div><div class="rmain"><div class="rt" style="color:var(--red)">'+esc(l)+'</div>'
        +'<div class="rs">non presente in _pathMap</div></div></div>';
    }).join(''):'<div class="list-empty">Tutti i '+links.length+' link interni risultano validi ✓</div>';
    modalHtml('lk-modal','🔗 Link interni — '+links.length+' trovati, '+bad.length+' sospetti',
      '<div class="list-body">'+rows+'</div>',
      '<button class="btn btn-soft" onclick="closeModal(\'lk-modal\')">Chiudi</button>');
    setStatus('idle','pronto');
  }catch(e){setStatus('err','errore');toast(e.message,'error')}
}

/* ── URL PULITO PAGINA ── */
async function _pageCleanPath(){
  var slug=_current.k;
  var meta=PAGES.find(function(p){return p.k===slug});
  var id=await _getPageId(slug);
  if(!id||id.indexOf('pag-')===0){
    return '/'+((meta&&meta.sec)?meta.sec+'/':'')+slug;
  }
  try{
    var pm=await _getPathMap();
    for(var k in pm){if(pm[k]===id)return '/'+k}
  }catch(e){}
  return '/'+slug;
}
async function copyPageUrl(){
  if(!_current||_current.type!=='page')return;
  var u=location.origin+await _pageCleanPath();
  try{await navigator.clipboard.writeText(u);toast('URL copiato: '+u,'success')}
  catch(e){toast('Errore copia','error')}
}
async function openPageOnSite(){
  if(!_current||_current.type!=='page')return;
  var u=location.origin+await _pageCleanPath();
  window.open(u,'_blank','noopener');
}


/* ── GESTIONE IMMAGINI /images/ ── */
async function openImages(){
  if(_modified&&!confirm('Hai modifiche non salvate. Continuare?'))return;
  _modified=false;
  _current={type:'images'};
  setActive('images','images');
  closeSidebar();
  setStatus('saving','caricamento immagini…');
  try{
    var list=await ghGet('images');
    var items=Array.isArray(list)?list:[];
    setCrumb('Media','Immagini');
    setTitle('/images/ — '+items.length+' file');
    var h=viewHead('🖼️','Immagini','Archivio condiviso in /images/', 
      '<button class="btn btn-soft" onclick="openImageUpload()">⬆ CARICA</button>'
      +'<button class="btn btn-p" onclick="openImages()">⟳ AGGIORNA</button>');
    h+='<div class="img-controls" style="display:flex;gap:8px;align-items:center;margin-bottom:12px;padding:8px 16px;background:var(--panel);border:1px solid var(--line);border-radius:8px">';
    h+='<input id="img-search" class="in" style="width:200px" placeholder="Cerca immagine…" oninput="_imgFilter=this.value;openImages()" value="'+escAttr(_imgFilter)+'">';
    h+='<select id="img-sort" class="in" style="width:auto;padding:5px 8px;font-size:11px" onchange="_imgSortBy=this.value;openImages()">';
    h+='<option value="name"'+(_imgSortBy==='name'?' selected':'')+'>Nome</option>';
    h+='<option value="date"'+(_imgSortBy==='date'?' selected':'')+'>Data</option>';
    h+='<option value="size"'+(_imgSortBy==='size'?' selected':'')+'>Dimensione</option>';
    h+='</select>';
    h+='<button class="btn btn-soft btn-sm" onclick="_imgViewMode=_imgViewMode===\'grid\'?\'list\':\'grid\';openImages()">'+(_imgViewMode==='grid'?'☰ Lista':'▦ Griglia')+'</button>';
    h+='<button class="btn btn-soft btn-sm" onclick="_imgAnalyzeUsage(this)" title="Scansiona pagine, mappa e home">🧭 Analizza utilizzi</button>';
    h+='</div>';
    if(_imgUsage){
      var unused=items.filter(function(it){ return !_imgUsage[it.name]; }).length;
      h+='<div style="padding:6px 16px 0;color:var(--dim);font-size:11.5px">Analisi: <b style="color:var(--acc)">'+(items.length-unused)+'</b> usate · <b style="color:'+(unused?'var(--red)':'inherit')+'">'+unused+'</b> non utilizzate</div>';
    }
    if(_imgFilter)items=_imgFilterItems(items,_imgFilter);
    if(_imgSortBy!=='name')items=_imgSortItems(items,_imgSortBy);
    if(_imgViewMode==='list'){
      h+='<div class="panel"><div class="panel-head"><h3>Immagini</h3><span class="hint">'+items.length+' file</span></div>';
      if(!items.length)h+='<div class="empty"><span class="ei">🖼️</span>Nessuna immagine in /images/</div>';
      items.forEach(function(it){
        var name=it.name||'';
        var size=it.size?(it.size/1024).toFixed(1)+' KB':'';
        h+='<div class="row">'
          +'<div class="rico" style="overflow:hidden;width:40px;height:40px;border-radius:4px"><img src="'+esc(it.download_url||'')+'" alt="" style="width:100%;height:100%;object-fit:cover"></div>'
          +'<div class="rmain"><div class="rt img-rename" contenteditable="true" spellcheck="false" data-original="'+escAttr(name)+'" data-sha="'+escAttr(it.sha||'')+'" onblur="renameImage(this)" onkeydown="if(event.key===\'Enter\'){event.preventDefault();this.blur()}">'+esc(name)+'</div>'
          +'<div class="rs">'+size+' · '+esc(it.type||'file')+(_imgUsage?(_imgUsage[name]?' · <span style="color:var(--green,#7dc87d)">usata ×'+_imgUsage[name]+'</span>':' · <span style="color:var(--red)">mai usata</span>'):'')+'</div></div>'
          +'<div class="ract">'
          +'<button class="btn btn-soft btn-sm" onclick="copyImageUrl(\''+escJsAttr(name)+'\')">🔗 URL</button>'
          +'<button class="btn btn-d btn-sm" onclick="deleteImage(\''+escJsAttr(name)+'\',\''+esc(it.sha)+'\')">🗑</button>'
          +'</div></div>';
      });
      h+='</div>';
    }else{
      _imgPageOffset=0;
      _imgAllItems=items;
      h+='<div class="img-grid" id="img-grid">';
      if(!items.length)h+='<div class="empty"><span class="ei">🖼️</span>Nessuna immagine in /images/</div>';
      var initial=Math.min(_imgPageSize,items.length);
      for(var ii=0;ii<initial;ii++){h+=_imgCard(items[ii])}
      h+='</div>';
      if(items.length>_imgPageSize){
        var rem=items.length-initial;
        h+='<div id="img-load-more" style="text-align:center;padding:16px"><button class="btn btn-soft" onclick="_imgLoadMore()">Carica altre '+Math.min(rem,_imgPageSize)+' immagini ('+rem+' rimaste)</button></div>';
      }
    }
    document.getElementById('main').innerHTML=h;
    setStatus('ok','caricato');
    setTimeout(function(){setStatus('idle','pronto')},1500);
  }catch(e){setStatus('err','errore');toast(e.message,'error')}
}
var _imgUsage=null;
async function _imgAnalyzeUsage(btn){
  if(btn){btn.disabled=true;btn.textContent='⏳ Scansione…';}
  try{
    var counts={};
    function bump(txt){
      if(!txt)return;
      String(txt).replace(/\r/g,'').split('/images/').slice(1).forEach(function(part){
        var m=part.match(/^([A-Za-z0-9._-]+)/);
        if(m)counts[m[1]]=(counts[m[1]]||0)+1;
      });
    }
    var idx=await _loadContentIndex();
    (idx||[]).forEach(function(pg){ bump(pg.content); });
    try{ bump(b64decode((await ghGet('content/mappins.json')).content)); }catch(e){}
    try{ bump(b64decode((await ghGet('index.html')).content)); }catch(e){}
    try{
      var cl=JSON.parse(b64decode((await ghGet('content/changelog.json')).content));
      (cl||[]).forEach(function(e){ bump(e.content); });
    }catch(e){}
    _imgUsage=counts;
    toast('Analisi completata','success');
    openImages();
  }catch(e){
    toast('Errore analisi: '+e.message,'error');
    if(btn){btn.disabled=false;btn.textContent='🧭 Analizza utilizzi';}
  }
}
async function renameImage(el){
  var oldName=el.getAttribute('data-original');
  var newName=(el.textContent||'').trim();
  var sha=el.getAttribute('data-sha');
  if(!newName||newName===oldName){el.textContent=oldName;return}
  setStatus('saving','rinomina…');
  try{
    var d=await ghGet('images/'+oldName);
    var content=d.content;
    await ghDelete('images/'+oldName,'admin: rename image '+oldName,sha);
    await ghPut('images/'+newName,'admin: rename image '+oldName+' → '+newName,atob(content),null);
    el.setAttribute('data-original',newName);
    toast('Immagine rinominata: '+newName,'success');
    setStatus('ok','rinominato');
    setTimeout(function(){setStatus('idle','pronto')},1500);
  }catch(e){setStatus('err','errore');toast('Errore rinomina: '+e.message,'error');el.textContent=oldName}
}
function _imgCard(it){
  var name=it.name||'';
  var size=it.size?(it.size/1024).toFixed(1)+' KB':'';
  return '<div class="img-card">'
    +'<img src="'+esc(it.download_url||'')+'" alt="'+esc(name)+'" loading="lazy">'
    +'<div class="ic-body"><div class="ic-name">'+esc(name)+'</div>'
    +'<div class="ic-meta">'+size+' · '+esc(it.type||'file')+'</div>'
    +(_imgUsage?'<div class="ic-meta" style="'+(_imgUsage[name]?'color:#7dc87d':'color:var(--red)')+'">'+(_imgUsage[name]?'usata ×'+_imgUsage[name]:'mai usata')+'</div>':'')
    +'<div class="ic-actions">'
    +'<button class="btn btn-soft btn-sm" onclick="copyImageUrl(\''+escJsAttr(name)+'\')">🔗 URL</button>'
    +'<button class="btn btn-d btn-sm" onclick="deleteImage(\''+escJsAttr(name)+'\',\''+esc(it.sha)+'\')">🗑</button>'
    +'</div></div></div>';
}
async function copyImageUrl(name){
  try{
    await navigator.clipboard.writeText('/images/'+name);
    toast('Copiato: /images/'+name,'success');
  }catch(e){toast('Errore copia: '+e.message,'error')}
}
async function deleteImage(name,sha){
  if(!(await uiConfirm("Eliminare definitivamente l'immagine /images/"+name+'?',{ok:'Elimina'})))return;
  setStatus('saving','eliminazione…');
  try{
    await ghDelete('images/'+name,'admin: delete image '+name,sha);
    toast('Immagine eliminata! Deploy in corso…','success');
    setStatus('ok','deploying…');
    startDeployTimer();
    setTimeout(openImages,800);
  }catch(e){setStatus('err','errore');toast(e.message,'error')}
}
function openImageUpload(){
  _current={type:'images',k:'img'};
  openImgDialog();
}

/* ── BULK OPERATIONS ── */
function toggleBulkMode(){
  _bulkMode=!_bulkMode;
  _bulkSelected={};
  var btn=document.getElementById('bulk-toggle');
  if(btn)btn.className=_bulkMode?'btn btn-p btn-sm':'btn btn-soft';
  renderDashboard();
}
function toggleBulkItem(cb){
  var k=cb.getAttribute('data-key');
  if(cb.checked)_bulkSelected[k]=1;else delete _bulkSelected[k];
  var count=Object.keys(_bulkSelected).length;
  var el=document.getElementById('bulk-count');
  if(el)el.textContent=count+' selezionate';
}
async function bulkDelete(){
  var keys=Object.keys(_bulkSelected);
  if(!keys.length){toast('Seleziona almeno una pagina','error');return}
  if(!confirm('Eliminare '+keys.length+' pagina/e selezionate?\n\nOperazione irreversibile.'))return;
  setStatus('saving','eliminazione…');
  var ok=0,err=0;
  for(var i=0;i<keys.length;i++){
    try{
      var path=CONTENT+'/pages/'+keys[i]+'.json';
      var d=await ghGet(path);
      await ghDelete(path,'admin: bulk delete '+keys[i],d.sha);
      await removeFromRegistry(keys[i]);
      var id=await _getPageId(keys[i]);
      if(id&&id.indexOf('pag-')!==0)await removeFromIndex(keys[i],id);
      for(var j=0;j<PAGES.length;j++){if(PAGES[j].k===keys[i]){PAGES.splice(j,1);break}}
      ok++;
    }catch(e){err++}
  }
  _bulkSelected={};
  _bulkMode=false;
  buildSidebar();
  setStatus('ok','eliminato '+ok+'/'+keys.length);
  toast(ok+' pagine eliminate'+(err?', '+err+' errori':''),'success');
  renderDashboard();
  startDeployTimer();
}
async function bulkMove(sec){
  var keys=Object.keys(_bulkSelected);
  if(!keys.length){toast('Seleziona almeno una pagina','error');return}
  if(!sec){toast('Seleziona una sezione di destinazione','error');return}
  if(!confirm('Muovere '+keys.length+' pagina/e nella sezione "'+sec+'"?'))return;
  setStatus('saving','spostamento…');
  var ok=0,err=0;
  for(var i=0;i<keys.length;i++){
    try{
      var meta=PAGES.find(function(p){return p.k===keys[i]});
      if(meta){meta.sec=sec;meta.path=sec+'/'+keys[i]}
      ok++;
    }catch(e){err++}
  }
  try{
    var d=await ghGet('content/pages/registry.json');
    var reg=JSON.parse(b64decode(d.content));
    keys.forEach(function(k){
      var p=(reg.pages||[]).find(function(x){return x.k===k});
      if(p){p.sec=sec;p.path=sec+'/'+k}
    });
    await ghPut('content/pages/registry.json','admin: bulk move to '+sec,JSON.stringify(reg,null,2)+'\n',d.sha);
  }catch(e){}
  _bulkSelected={};
  _bulkMode=false;
  buildSidebar();
  setStatus('ok','spostato '+ok+'/'+keys.length);
  toast(ok+' pagine spostate in '+sec,'success');
  renderDashboard();
  startDeployTimer();
}
async function bulkChangeLayout(){
  var keys=Object.keys(_bulkSelected);
  if(!keys.length){toast('Seleziona almeno una pagina','error');return}
  var layoutEl=document.getElementById('bulk-layout');
  var layout=layoutEl?layoutEl.value:'';
  if(!layout){toast('Seleziona un layout','error');return}
  if(!confirm('Applicare il layout "'+layout+'" a '+keys.length+' pagina/e?'))return;
  setStatus('saving','cambio layout…');
  var ok=0,err=0;
  for(var i=0;i<keys.length;i++){
    try{
      var path=CONTENT+'/pages/'+keys[i]+'.json';
      var d=await ghGet(path);
      var json=JSON.parse(b64decode(d.content));
      json.layout=layout;
      await ghPut(path,'admin: bulk layout '+keys[i],JSON.stringify(json,null,2),d.sha);
      var meta=PAGES.find(function(p){return p.k===keys[i]});
      if(meta)meta.layout=layout;
      ok++;
    }catch(e){err++}
  }
  _bulkSelected={};
  _bulkMode=false;
  buildSidebar();
  setStatus('ok','layout aggiornato per '+ok+'/'+keys.length);
  toast(ok+' pagine aggiornate a layout "'+layout+'"'+(err?', '+err+' errori':''),'success');
  renderDashboard();
  startDeployTimer();
}
function bulkExportSelected(){
  var keys=Object.keys(_bulkSelected);
  if(!keys.length){toast('Seleziona almeno una pagina','error');return}
  var pages=keys.map(function(k){
    var meta=PAGES.find(function(p){return p.k===k});
    return{key:k,title:(meta?meta.l:k),icon:(meta?meta.i:''),section:(meta?meta.sec:'')};
  });
  var blob=new Blob([JSON.stringify(pages,null,2)],{type:'application/json'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;a.download='arcamis-export-'+keys.length+'-pages-'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  toast(keys.length+' pagine esportate','success');
}

/* ── IMPORT / EXPORT ── */
function openImportModal(){
  modalHtml('import-modal','📥 Importa pagine',
    '<div class="fld"><label>Seleziona file JSON di backup</label>'
    +'<input type="file" id="import-file" accept=".json" class="in" onchange="previewImport(this)"></div>'
    +'<div id="import-preview" style="margin-top:10px"></div>',
    '<button class="btn btn-soft" onclick="closeModal(\'import-modal\')">Annulla</button>'
    +'<button class="btn btn-p" id="import-btn" onclick="doImport()" disabled>IMPORTA</button>');
}
var _importData=null;
function previewImport(input){
  var file=input.files&&input.files[0];
  var preview=document.getElementById('import-preview');
  var btn=document.getElementById('import-btn');
  if(!file||!preview){_importData=null;return}
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var j=JSON.parse(e.target.result);
      var pages=j.pages||j.data&&j.data.pages||[];
      if(typeof pages==='object'&&!Array.isArray(pages))pages=Object.keys(pages).map(function(k){return pages[k]});
      _importData=j;
      preview.innerHTML='<div class="hint">'+pages.length+' pagine trovate nel backup</div>';
      if(btn)btn.disabled=false;
      toast('File valido: '+pages.length+' pagine','success');
    }catch(e){
      _importData=null;
      preview.innerHTML='<div style="color:var(--red)">❌ File non valido: '+esc(e.message)+'</div>';
      if(btn)btn.disabled=true;
    }
  };
  reader.readAsText(file);
}
async function doImport(){
  if(!_importData)return;
  var btn=document.getElementById('import-btn');
  if(btn)btn.disabled=true;
  setStatus('saving','importazione…');
  var imported=0,skipped=0;
  try{
    var pages=_importData.pages||_importData.data&&_importData.data.pages||[];
    var d0=await ghGet('content/pages/registry.json');
    var reg=JSON.parse(b64decode(d0.content));
    if(!Array.isArray(reg.pages))reg.pages=[];
    var files=[];
    for(var i=0;i<pages.length;i++){
      var pg=pages[i];
      var k=pg.k||pg.slug||'';
      if(!k)continue;
      if(PAGES.some(function(p){return p.k===k})){skipped++;continue}
      var label=pg.title||pg.l||k;
      var icon=pg.icon||pg.i||'📄';
      var content=pg.content||'';
      var layout=pg.layout||'';
      var json={k:k,title:label,icon:icon,content:content,layout:layout,lastModified:new Date().toISOString()};
      files.push({ path:'content/pages/'+k+'.json', content:b64encode(JSON.stringify(json,null,2)) });
      var entry={k:k,l:label,i:icon,id:'pag-'+k,c:1,menu:true,admin:true};
      if(pg.sec)entry.sec=pg.sec;
      if(pg.sub)entry.sub=pg.sub;
      entry.path=pg.sec?pg.sec+'/'+k:k;
      reg.pages.push(entry);
      PAGES.push({k:k,l:label,i:icon,sec:pg.sec||'',sub:pg.sub||'',c:1});
      imported++;
    }
    if(files.length){
      await ghCommitMulti(files,'admin: import '+files.length+' pages');
    }
    _contentIndex=null;
    buildSidebar();
    closeModal('import-modal');
    toast(imported+' pagine importate'+(skipped?', '+skipped+' saltate':''),'success');
    setStatus('ok','importato '+imported);
    startDeployTimer();
  }catch(e){
    setStatus('err','errore');
    toast('Errore import: '+e.message,'error');
  }
  if(btn)btn.disabled=false;
}
async function exportAllPages(){
  setStatus('saving','esportazione…');
  try{
    var all=[];
    for(var i=0;i<PAGES.length;i++){
      try{
        var d=await ghGet(CONTENT+'/pages/'+PAGES[i].k+'.json');
        var json=JSON.parse(b64decode(d.content));
        all.push(json);
      }catch(e){}
    }
    var blob=new Blob([JSON.stringify({pages:all,exportDate:new Date().toISOString()},null,2)],{type:'application/json'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;a.download='arcamis-export-'+new Date().toISOString().slice(0,10)+'.json';
    document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
    toast('Esportato '+all.length+' pagine','success');
    setStatus('ok','esportato '+all.length);
  }catch(e){setStatus('err','errore');toast('Errore esportazione: '+e.message,'error')}
}

/* ── FIND & REPLACE ── */
function openFindReplace(){
  if(document.getElementById('fr-modal'))return;
  modalHtml('fr-modal','🔍 Trova e sostituisci',
    '<div class="fld"><label>Trova</label><input id="fr-find" class="in" placeholder="Testo da cercare…" onkeydown="if(event.key===\'Enter\')findNext()"></div>'
    +'<div class="fld"><label>Sostituisci con</label><input id="fr-repl" class="in" placeholder="Testo sostitutivo…" onkeydown="if(event.key===\'Enter\')findNext()"></div>'
    +'<div class="fr-info" id="fr-info"></div>'
    +'<div class="fr-btns">'
    +'<button class="btn btn-soft btn-sm" onclick="findPrev()" title="Risultato precedente (Shift+Enter)">↑ Prev</button>'
    +'<button class="btn btn-soft btn-sm" onclick="findNext()" title="Risultato successivo (Enter)">↓ Next</button>'
    +'<button class="btn btn-soft btn-sm" onclick="replaceCurrent()" title="Sostituisci selezione">Sostituisci</button>'
    +'<button class="btn btn-soft btn-sm" onclick="replaceAll()" title="Sostituisci tutti">Sostituisci tutti</button>'
    +'</div>',
    '<button class="btn btn-soft" onclick="closeModal(\'fr-modal\')">Chiudi</button>');
  var fi=document.getElementById('fr-find');if(fi){fi.focus();fi.select();}
}
var _frMatches=[];var _frIdx=-1;
function _frSearch(){
  var q=(document.getElementById('fr-find')||{}).value||'';
  var ta=document.getElementById('e-md');if(!ta||!q){_frMatches=[];_frIdx=-1;return}
  var val=ta.value;_frMatches=[];
  var lower=val.toLowerCase(),lq=q.toLowerCase();
  var pos=0;
  while(pos<val.length){
    var idx=lower.indexOf(lq,pos);
    if(idx===-1)break;
    _frMatches.push(idx);
    pos=idx+1;
  }
  _frIdx=_frMatches.length?0:-1;
  _frHighlight(ta);
  var info=document.getElementById('fr-info');
  if(info)info.textContent=_frMatches.length?(_frMatches.length+' risultati'+(_frIdx>=0?' — '+((_frIdx+1))+'/'+_frMatches.length:'')):'Nessun risultato';
}
function _frHighlight(ta){
  if(_frIdx<0||!_frMatches.length)return;
  var start=_frMatches[_frIdx];
  var q=(document.getElementById('fr-find')||{}).value||'';
  ta.focus();
  ta.selectionStart=start;ta.selectionEnd=start+q.length;
  var lines=ta.value.substring(0,start).split('\n');
  var line=lines.length-1;
  var lineHeight=parseFloat(getComputedStyle(ta).lineHeight)||21;
  ta.scrollTop=Math.max(0,line*lineHeight-ta.clientHeight/3);
}
function findNext(){_frSearch();if(!_frMatches.length)return;var ta=document.getElementById('e-md');if(!ta)return;_frIdx=(_frIdx+1)%_frMatches.length;var info=document.getElementById('fr-info');if(info)info.textContent=(_frIdx+1)+'/'+_frMatches.length;_frHighlight(ta)}
function findPrev(){_frSearch();if(!_frMatches.length)return;var ta=document.getElementById('e-md');if(!ta)return;_frIdx=(_frIdx-1+_frMatches.length)%_frMatches.length;var info=document.getElementById('fr-info');if(info)info.textContent=(_frIdx+1)+'/'+_frMatches.length;_frHighlight(ta)}
function replaceCurrent(){
  var ta=document.getElementById('e-md');var q=(document.getElementById('fr-find')||{}).value||'';var r=(document.getElementById('fr-repl')||{}).value;
  if(!ta||!q||_frIdx<0||!_frMatches.length)return;
  var start=_frMatches[_frIdx];ta.value=ta.value.substring(0,start)+r+ta.value.substring(start+q.length);
  _frSearch();onMdInput();
}
function replaceAll(){
  var ta=document.getElementById('e-md');var q=(document.getElementById('fr-find')||{}).value||'';var r=(document.getElementById('fr-repl')||{}).value;
  if(!ta||!q)return;
  var re=new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi');
  var count=(ta.value.match(re)||[]).length;
  if(!count){toast('Nessun risultato','error');return}
  ta.value=ta.value.replace(re,r);onMdInput();_frSearch();
  toast('Sostituiti '+count+' occorrenze','success');
}
function _frKeyHandler(e){
  if(!document.getElementById('fr-modal'))return;
  if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();findNext()}
  if(e.key==='Enter'&&e.shiftKey){e.preventDefault();findPrev()}
  if(e.key==='Escape'){closeModal('fr-modal')}
  _frSearch();
}

/* ── GO TO LINE ── */
function openGoToLine(){
  if(document.getElementById('gtl-modal'))return;
  var ta=document.getElementById('e-md');
  var total=ta?(ta.value.split('\n').length):1;
  modalHtml('gtl-modal','📍 Vai alla riga',
    '<div class="fld"><label>Riga (1–'+total+')</label><input id="gtl-line" class="in" type="number" min="1" max="'+total+'" value="1" onkeydown="if(event.key===\'Enter\')goToLine()"></div>',
    '<button class="btn btn-soft" onclick="closeModal(\'gtl-modal\')">Annulla</button>'
    +'<button class="btn btn-p" onclick="goToLine()">VAI</button>');
  var inp=document.getElementById('gtl-line');if(inp){inp.focus();inp.select();}
}
function goToLine(){
  var ta=document.getElementById('e-md');var inp=document.getElementById('gtl-line');
  if(!ta||!inp)return;
  var n=parseInt(inp.value,10);var total=ta.value.split('\n').length;
  if(isNaN(n)||n<1||n>total){toast('Numero riga non valido (1–'+total+')','error');return}
  var pos=0;for(var i=0;i<n-1;i++){pos=ta.value.indexOf('\n',pos)+1;if(pos<=0)pos=ta.value.length}
  ta.focus();ta.selectionStart=pos;ta.selectionEnd=pos;
  var lineHeight=parseFloat(getComputedStyle(ta).lineHeight)||21;
  ta.scrollTop=Math.max(0,(n-1)*lineHeight-ta.clientHeight/3);
  closeModal('gtl-modal');
}

/* ── SYNCED SCROLL (line-based) ── */
var _syncScrollLineMap=null;
var _syncScrollPending=false;
function _buildLineMap(){
  var ta=document.getElementById('e-md');
  var pv=document.getElementById('e-preview');
  if(!ta||!pv)return;
  var mdLines=ta.value.split('\n');
  var totalMd=mdLines.length;
  var totalPv=pv.scrollHeight;
  _syncScrollLineMap=[];
  if(totalMd<=1||totalPv<=1)return;
  var headings=[];
  for(var i=0;i<totalMd;i++){
    if(/^#{1,3}\s/.test(mdLines[i]))headings.push(i);
  }
  if(!headings.length){
    var ratio=totalPv/(totalMd||1);
    for(var j=0;j<totalMd;j++)_syncScrollLineMap[j]=j*ratio;
    return;
  }
  var pvEls=pv.querySelectorAll('h1,h2,h3,h4,h5,h6');
  var pvPositions=[];
  for(var k=0;k<pvEls.length;k++){pvPositions.push(pvEls[k].offsetTop)}
  for(var m=0;m<totalMd;m++){
    var hIdx=-1;
    for(var n=0;n<headings.length;n++){if(headings[n]<=m)hIdx=n}
    if(hIdx>=0&&hIdx<pvPositions.length){
      var nextH=hIdx<headings.length-1?headings[hIdx+1]:totalMd;
      var localFrac=(m-headings[hIdx])/((nextH-headings[hIdx])||1);
      var pvStart=pvPositions[hIdx];
      var pvEnd=hIdx<pvPositions.length-1?pvPositions[hIdx+1]:totalPv;
      _syncScrollLineMap[m]=pvStart+localFrac*(pvEnd-pvStart);
    }else{
      _syncScrollLineMap[m]=m*(totalPv/totalMd);
    }
  }
}
function _bindSyncScroll(){
  var ta=document.getElementById('e-md');var pv=document.getElementById('e-preview');
  if(!ta||!pv)return;
  var syncing=false;
  ta.addEventListener('scroll',function(){
    if(syncing)return;
    if(!_syncScrollLineMap)_buildLineMap();
    if(!_syncScrollLineMap||!_syncScrollLineMap.length)return;
    syncing=true;
    var taLineHeight=ta.scrollHeight/(ta.value.split('\n').length||1);
    var currentLine=Math.floor(ta.scrollTop/taLineHeight);
    currentLine=Math.max(0,Math.min(currentLine,_syncScrollLineMap.length-1));
    var targetY=_syncScrollLineMap[currentLine]||0;
    pv.scrollTop=targetY;
    requestAnimationFrame(function(){syncing=false});
  });
  var renderTimer=null;
  var origRender=renderPreview;
  renderPreview=function(){
    origRender();
    if(renderTimer)clearTimeout(renderTimer);
    renderTimer=setTimeout(function(){_syncScrollLineMap=null},300);
  };
}

/* ── PREFERENZE EDITOR: font / word-wrap / numeri riga ── */
function _edFontSize(delta){
  if(delta===0){try{localStorage.removeItem('arcEdFs')}catch(e){}}
  else{
    var cur=13;
    try{cur=parseInt(localStorage.getItem('arcEdFs')||'',10)||13}catch(e){}
    var next=Math.max(11,Math.min(22,cur+delta));
    try{localStorage.setItem('arcEdFs',String(next))}catch(e){}
  }
  _applyEdPrefs();
}
function _toggleWordwrap(){
  try{
    if(localStorage.getItem('arcEdWrap')==='1')localStorage.removeItem('arcEdWrap');
    else localStorage.setItem('arcEdWrap','1');
  }catch(e){}
  _applyEdPrefs();
}
function _toggleLineno(){
  try{
    if(localStorage.getItem('arcEdLn')==='1')localStorage.removeItem('arcEdLn');
    else localStorage.setItem('arcEdLn','1');
  }catch(e){}
  _applyEdPrefs();
}
function _applyEdPrefs(){
  var pane=document.getElementById('md-pane');
  var ta=document.getElementById('e-md');
  if(!pane||!ta)return;
  var fs=13;
  try{fs=parseInt(localStorage.getItem('arcEdFs')||'',10)||13}catch(e){}
  pane.style.setProperty('--ed-fs',fs+'px');
  var wrap=false;
  try{wrap=localStorage.getItem('arcEdWrap')==='1'}catch(e){}
  ta.style.whiteSpace=wrap?'pre':'';
  ta.style.overflowX=wrap?'auto':'';
  var wbtn=document.getElementById('tl-wrap');
  if(wbtn)wbtn.classList.toggle('active',wrap);
  var ln=false;
  try{ln=localStorage.getItem('arcEdLn')==='1'&&!window.__stMode}catch(e){}
  pane.classList.toggle('with-lineno',ln);
  var lbtn=document.getElementById('tl-ln');
  if(lbtn)lbtn.classList.toggle('active',ln);
  if(ln)_updateLineno();
}
function _updateLineno(){
  var g=document.getElementById('e-lineno');
  var ta=document.getElementById('e-md');
  if(!g||!ta)return;
  var n=ta.value.split('\n').length;
  var buf='';
  for(var i=1;i<=n;i++)buf+=i+'\n';
  g.textContent=buf;
  g.scrollTop=ta.scrollTop;
}

/* ── FULL-SCREEN / DISTRACTION-FREE MODE ── */
function toggleFullScreen(){
  var app=document.getElementById('app');
  if(!app)return;
  app.classList.toggle('full-screen');
  var isFS=app.classList.contains('full-screen');
  if(isFS){
    document.getElementById('sidebar').style.display='none';
    document.getElementById('topbar').style.display='none';
    var ol=document.getElementById('e-outline');if(ol)ol.classList.remove('open');
    var sb=document.getElementById('e-sb');
    if(sb)sb.innerHTML='<span class="fs-hint">Esc o Ctrl+Shift+F per uscire</span>';
  }else{
    document.getElementById('sidebar').style.display='';
    document.getElementById('topbar').style.display='';
    var sb2=document.getElementById('e-sb');
    if(sb2)sb2.textContent=_layoutLabel(_current?_current.layout:'')+' · Autosave ogni 5s · SALVA / Ctrl+S salva subito';
  }
}

/* ── AUTO-PAIR BRACKETS / BACKTICKS ── */
var _autoPairMap={'(':')','{':'}','[':']','`':'`','*':'*','_':'_','"':'"',"'":"'"};

/* ── CONTINUAZIONE LISTE/QUOTE SU INVIO ── */
function _mdContinueList(ta){
  if(!ta)return false;
  var s=ta.selectionStart,en=ta.selectionEnd;
  if(s!==en)return false;
  var val=ta.value;
  var ls=val.lastIndexOf('\n',s-1)+1;
  var line=val.substring(ls,s);
  var m=line.match(/^(\s*)([-*+]\s+)(\[[ xX]\]\s+)?(.*)$/);
  if(m){
    /* Invio su voce vuota: esce dalla lista rimuovendo il marcatore */
    if(!m[4].trim()){ta.value=val.substring(0,ls)+val.substring(s);ta.selectionStart=ta.selectionEnd=ls;return true}
    var ins='\n'+m[1]+m[2]+(m[3]?'[ ] ':'');
    ta.value=val.substring(0,s)+ins+val.substring(s);
    ta.selectionStart=ta.selectionEnd=s+ins.length;
    return true;
  }
  m=line.match(/^(\s*)(\d+)([.)]\s+)(.*)$/);
  if(m){
    if(!m[4].trim()){ta.value=val.substring(0,ls)+val.substring(s);ta.selectionStart=ta.selectionEnd=ls;return true}
    var ins2='\n'+m[1]+(parseInt(m[2],10)+1)+m[3];
    ta.value=val.substring(0,s)+ins2+val.substring(s);
    ta.selectionStart=ta.selectionEnd=s+ins2.length;
    return true;
  }
  m=line.match(/^(\s*>\s?)(.*)$/);
  if(m){
    if(!m[2].trim()){ta.value=val.substring(0,ls)+val.substring(s);ta.selectionStart=ta.selectionEnd=ls;return true}
    var ins3='\n'+m[1];
    ta.value=val.substring(0,s)+ins3+val.substring(s);
    ta.selectionStart=ta.selectionEnd=s+ins3.length;
    return true;
  }
  return false;
}

function _autoPair(e,ta){
  if(e.ctrlKey||e.metaKey||e.altKey)return false;
  var ch=e.key;if(!_autoPairMap[ch])return false;
  var s=ta.selectionStart,en=ta.selectionEnd;
  if(s!==en){
    var sel=ta.value.substring(s,en);
    ta.value=ta.value.substring(0,s)+ch+sel+_autoPairMap[ch]+ta.value.substring(en);
    ta.selectionStart=s+1;ta.selectionEnd=en+1;
    e.preventDefault();return true;
  }
  if(ch===_autoPairMap[ch]){
    var next=ta.value[en]||'';
    if(next===ch){ta.selectionStart=en+1;ta.selectionEnd=en+1;e.preventDefault();return true}
  }
  var nextChar=ta.value[en]||'';
  if(/[a-zA-Z0-9]/.test(nextChar))return false;
  ta.value=ta.value.substring(0,s)+ch+_autoPairMap[ch]+ta.value.substring(en);
  ta.selectionStart=s+1;ta.selectionEnd=s+1;
  e.preventDefault();return true;
}

/* ── ENHANCED KEY HANDLER ── */
var _editorKeyBound=false;
function _bindEditorKeys(){
  if(_editorKeyBound)return;_editorKeyBound=true;
  document.addEventListener('keydown',function(ev){
    if(!document.getElementById('e-md'))return;
    var ta=document.getElementById('e-md');if(!ta)return;
    var mod=ev.ctrlKey||ev.metaKey;
    if(mod&&ev.key.toLowerCase()==='h'&&!ev.shiftKey){ev.preventDefault();openFindReplace();return}
    if(mod&&!ev.shiftKey&&ev.key.toLowerCase()==='k'){ev.preventDefault();runCmd('link');return}
    if(mod&&ev.key.toLowerCase()==='g'){ev.preventDefault();openGoToLine();return}
    if(mod&&ev.shiftKey&&ev.key.toLowerCase()==='f'){ev.preventDefault();toggleFullScreen();return}
  });
}

/* ═══════════════ REGISTRAZIONE NAMESPACE ═══════════════ */
ArcAdmin.register('editors', {
  openPage: openPage,
  savePage: savePage,
  runCmd: runCmd,
  setViewMode: setViewMode,
  onLayoutChange: onLayoutChange,
  toggleOutline: toggleOutline,
  wrapMd: wrapMd,
  insMd: insMd,
  openImages: openImages,
  openImgDialog: openImgDialog,
  renderPreview: renderPreview,
  onMdInput: onMdInput,
  onMetaInput: onMetaInput,
  onMdKey: onMdKey,
  saveDraft: saveDraft,
  publishDraft: publishDraft,
  showDiff: showDiff,
  toggleBulkMode: toggleBulkMode,
  bulkDelete: bulkDelete,
  bulkMove: bulkMove,
  bulkChangeLayout: bulkChangeLayout,
  bulkExportSelected: bulkExportSelected,
  openImportModal: openImportModal,
  exportAllPages: exportAllPages,
  renameImage: renameImage
});
