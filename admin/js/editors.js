/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — editors.js
   Editor pagine (Markdown/anteprima/JSON), immagine/emoji/tabella,
   nuova pagina, rinomina, elimina, storia, link checker, URL pulito,
   gestione immagini e editor DB/Mestieri/Documenti. (v2)
   ════════════════════════════════════════════════════════════════ */

/* ── LAYOUT E TEMPLATE ── */
var LAYOUTS=[
  {v:'',l:'(Auto — rileva da chiave)',i:'🔍'},
  {v:'generico',l:'Generico — Markdown semplice',i:'📄'},
  {v:'lore',l:'Lore / Luoghi — Card sezioni',i:'🏰'},
  {v:'regole',l:'Regole / Gameplay — Intro + card',i:'📜'},
  {v:'lavoro',l:'Lavoro / Gilde — Intro + grid',i:'🗡️'},
  {v:'personaggio',l:'Personaggio — Step numerati',i:'🌟'},
  {v:'materiale',l:'Materiale — Grid classi',i:'📋'},
  {v:'wide',l:'Wide — Larghezza piena',i:'↔️'},
  {v:'pantheon',l:'Pantheon — Schede divinita',i:'🛐'},
  {v:'bestiario',l:'Bestiario — Schede mostri',i:'🐉'},
  {v:'timeline',l:'Timeline — Eventi cronologici',i:'📅'},
  {v:'fazioni',l:'Fazioni — Organizzazioni',i:'🏴'},
  {v:'oggetti',l:'Oggetti — Equipaggiamento',i:'⚔️'},
  {v:'glossario',l:'Glossario — Termini e definizioni',i:'📖'},
  {v:'galleria',l:'Galleria — Griglia immagini',i:'🖼️'},
  {v:'tabelle',l:'Tabelle — Dati strutturati',i:'📊'},
  {v:'sessione',l:'Sessione / Diario — Cronache di gioco',i:'📜'},
  {v:'quest',l:'Quest / Missioni — Schede incarichi',i:'🎯'},
  {v:'npc',l:'NPC / PNG — Schede personaggi',i:'🧙'},
  {v:'spell',l:'Incantesimi — Schede magie',i:'✨'},
  {v:'specie',l:'Specie / Razze — Schede razziali',i:'🧬'},
  {v:'citta',l:'Città — Schede centri abitati',i:'🏙'},
  {v:'evento',l:'Eventi — Cronache e avvenimenti',i:'🎭'}
];
var LAYOUT_TEMPLATES={
  generico:'## Introduzione\n\nTesto introduttivo della pagina.\n\n## Sezione 1\n\nContenuto della prima sezione.\n\n## Sezione 2\n\n- Elemento 1\n- Elemento 2\n- Elemento 3\n\n> Questa è una citazione importante.\n\n---\n\n## Sezione 3\n\nAltro contenuto qui.',
  lore:'## Introduzione\n\n> Breve descrizione del luogo, atmosfera e cosa lo rende speciale.\n\n## Geografia\n\nDescrizione del territorio, clima, paesaggio.\n\n## Abitanti\n\n- Chi vive qui, culture, usanze.\n\n## Storia\n\nEventi importanti che hanno plasmato il luogo.\n\n## Segreti\n\nDettagli nascosti, leggende, misteri.\n\n## Collegamenti\n\nCome si collega alle altre zone del mondo.',
  regole:'> Riepilogo generale delle regole in una frase.\n\n1) Prima regola breve\n2) Seconda regola breve\n3) Terza regola breve\n\n[📄 Regole in-game]\n[📄 Regole off-game]\n[📄 PVP]\n\n---\n\n### Regola 1\n\nDescrizione dettagliata della prima regola.\n\n### Regola 2\n\nDescrizione dettagliata della seconda regola.\n\n### Eccezioni\n\n- Eccezione 1\n- Eccezione 2\n\n### Esempio\n\n> Esempio pratico di come funziona la regola in gioco.',
  lavoro:'> Descrizione dell\'attività, cosa offre e come funziona.\n\n---\n\n### Servizi\n\n- Servizio 1: descrizione\n- Servizio 2: descrizione\n- Servizio 3: descrizione\n\n### Personale\n\n- Chi lavora qui, ruoli e specialità.\n\n### Orari e Tariffe\n\n- Orari: [da a]\n- Tariffe: [prezzi]\n\n### Storia\n\nCome è nata questa attività.\n\n### Regole\n\n- Regola 1\n- Regola 2\n- Regola 3',
  personaggio:'> Introduzione al processo di creazione del personaggio.\n\n---\n\n### Scegli la specie\n\n- Opzione 1\n- Opzione 2\n- Opzione 3\n\n### Scegli la classe\n\n- Opzione 1\n- Opzione 2\n- Opzione 3\n\n### Definisci il background\n\nDescrizione del background del personaggio.\n\n### Scegli i tratti\n\n- Tratto 1\n- Tratto 2\n- Tratto 3',
  materiale:'## Specie\n\n- Umano (PHB)\n- Elfo (PHB)\n- Mezzorco (PHB)\n\n## Classi\n\n- Barbarian (PHB)\n- Berserker (PHB)\n- Totem Warrior (PHB)\n\n- Fighter (PHB)\n- Champion (PHB)\n- Battle Master (PHB)\n\n## Talenti\n\n- Talento 1 (PHB)\n- Talento 2 (XGE)\n- Talento 3 (TCE)\n\n## Spell\n\n- Spell 1 (PHB)\n- Spell 2 (XGE)\n- Spell 3 (TCE)\n\n> 💡 Nota su eventuali restrizioni o materiale non approvato.',
  wide:'## Sezione 1\n\nContenuto che beneficia della larghezza piena (tabelle, mappe, colonne).\n\n> Usa il pulsante 🖼 della toolbar per inserire una mappa o un\'immagine a larghezza piena.\n\n## Tabella\n\n| Colonna 1 | Colonna 2 | Colonna 3 |\n|---|---|---|\n| Dato 1 | Dato 2 | Dato 3 |\n| Dato 4 | Dato 5 | Dato 6 |\n\n## Sezione 2\n\nAltro contenuto qui.',
  pantheon:'## Nome della Divinita\n\nDescrizione introduttiva della divinita.\n\n- **Epiteto:** Titolo onorifico\n- **Allineamento:** Legge Buono\n- **Sfere:** Guerra, Onore\n- **Simbolo:** Descrizione del simbolo\n\n### Personalita\n\n- Tratti caratteriali, modi di fare.\n\n### Culto\n\n- **Tempio:** Tipo di tempio\n- **Rituali:** Cerimonie principali\n- **Seguaci:** Chi lo/la adora\n\n### Legami\n\nRelazioni con altre divinita.',
  bestiario:'## Nome del Mostro\n\nBreve descrizione, habitat, pericolosita.\n\n- **Tipo:** Aberrazione\n- **Taglia:** Media\n- **Allineamento:** Qualsiasi\n- **CA:** 15\n- **PF:** 45 (10d10+10)\n- **Velocita:** 30 ft\n\n### Statistiche\n\n- **For:** 16 (+3)\n- **Des:** 14 (+2)\n- **Cos:** 15 (+2)\n- **Int:** 10 (+0)\n- **Sag:** 12 (+1)\n- **Car:** 8 (-1)\n\n### Abilita\n\n- **Percezione passiva:** 12\n- **Linguaggi:** Comune\n\n### Azioni\n\n- **Attacco:** +5, 1d8+3 taglio\n\n### Leggenda\n\n- Leggenda o folklore legato al mostro.',
  timeline:'## Cronologia\n\n> Introduzione al periodo storico.\n\n### Anno 0\n\n- **Evento 1:** Descrizione dell\'evento\n- **Evento 2:** Descrizione dell\'evento\n\n### Anno 100\n\n- **Evento 3:** Descrizione dell\'evento\n- **Evento 4:** Descrizione dell\'evento\n\n### Anno 200\n\n- **Evento 5:** Descrizione dell\'evento\n\n## Conseguenze\n\nImpatto degli eventi sul mondo.',
  fazioni:'## Nome della Fazione\n\nDescrizione introduttiva e obiettivi generali.\n\n- **Simbolo:** Descrizione del simbolo\n- **Sede:** Luogo principale\n- **Motto:** Frase rappresentativa\n- **Membri:** Numero e reclutamento\n\n### Struttura\n\n- **Leader:** Nome e ruolo\n- **Ranghi:** Come sono organizzati\n\n### Obiettivi\n\n- Obiettivo 1\n- Obiettivo 2\n- Obiettivo 3\n\n### Alleati e Nemici\n\n- **Alleati:** Chi supporta la fazione\n- **Nemici:** Chi si oppone\n\n### Storia\n\nCome e nata la fazione, eventi chiave.',
  oggetti:'## Nome dell\'Oggetto\n\nDescrizione generale dell\'oggetto.\n\n- **Tipo:** Arma\n- **Rarita:** Raro\n- **Attunamento:** Si\n- **Manuale:** Nome del manuale\n\n### Effetto\n\nDescrizione dell\'effetto magico.\n\n### Limitazioni\n\n- Limite 1\n- Limite 2\n\n### Storia\n\nOrigine e leggenda dell\'oggetto.',
  glossario:'## A\n\n### Aberrazione\n\nCreatura non naturale, spesso aliena o magica.\n\n### Allineamento\n\nLa posizione morale e filosofica di un personaggio.\n\n## B\n\n### Bestia\n\nCreatura animale, priva di magia.\n\n### Background\n\nIl passato del personaggio prima dell\'avventura.',
  galleria:'## Raccolta\n\nIntroduzione alla galleria.\n\n### Personaggi\n\n- Nome del personaggio — Descrizione breve\n- Nome del personaggio — Descrizione breve\n\n### Luoghi\n\n- Nome del luogo — Descrizione breve\n\n### Oggetti\n\n- Nome dell\'oggetto — Descrizione breve',
  tabelle:'## Tabella 1\n\nDescrizione della tabella.\n\n| Colonna 1 | Colonna 2 | Colonna 3 |\n|---|---|---|\n| Dato 1 | Dato 2 | Dato 3 |\n| Dato 4 | Dato 5 | Dato 6 |\n\n## Tabella 2\n\n| Colonna A | Colonna B |\n|---|---|\n| Valore 1 | Valore 2 |\n| Valore 3 | Valore 4 |',
  sessione:'## Sessione 1 — Nome dell\'evento\n\nRiassunto della sessione in una o due frasi.\n\n- **Data:** [data]\n- **Luogo:** [luogo]\n- **Party:** Nome, Nome, Nome\n- **XP guadagnati:** [totale]\n\n### Riassunto\n\nResoconto dettagliato degli eventi della sessione.\n\n### Eventi chiave\n\n- Evento 1\n- Evento 2\n- Evento 3\n\n### Hook per la prossima volta\n\n- Filo narrativo lasciato aperto\n- Possibili sviluppi futuri',
  quest:'## Nome della Quest\n\nDescrizione della missione.\n\n- **Stato:** In corso / Completata / Fallita\n- **Fornitore:** Nome del PNG\n- **Ricompensa:** Oro, oggetti, favori\n- **Localita:** Dove si svolge\n- **Difficolta:** Bassa / Media / Alta\n\n### Obiettivo\n\nDescrizione dell\'obiettivo principale.\n\n### Passi\n\n- Passo 1\n- Passo 2\n- Passo 3\n\n### Risvolti\n\n- Conseguenze o sviluppi inattesi',
  npc:'## Nome del PNG\n\nBreve descrizione del personaggio.\n\n- **Specie:** Elfo, Umano...\n- **Ruolo:** Mercante, Guardia...\n- **Allineamento:** Neutrale Buono\n- **Luogo:** Dove si trova\n- **Occupazione:** Cosa fa\n\n### Aspetto\n\nDescrizione fisica.\n\n### Personalita\n\nTratti caratteriali, modi di fare, vizi.\n\n### Obiettivi\n\n- Obiettivo 1\n- Obiettivo 2\n\n### Segreti\n\nDettagli nascosti, verita scomode.\n\n### Relazioni\n\n- **Alleati:** ...\n- **Nemici:** ...\n- **Contatti:** ...',
  spell:'## Nome dell\'Incantesimo\n\nDescrizione dell\'effetto.\n\n- **Livello:** 1°\n- **Scuola:** Evocazione\n- **Tempo di lancio:** 1 azione\n- **Gittata:** 18 m\n- **Componenti:** V, S, M\n- **Durata:** Istantanea\n- **Classi:** Mago, Stregone, Bardo\n\n### Effetto\n\nDescrizione dettagliata dell\'effetto e dei danni.\n\n### A livelli superiori\n\nEffetto del lancio con slot di livello superiore.',
  specie:'## Nome della Specie\n\nDescrizione generale della specie.\n\n- **Taglia:** Media\n- **Velocita:** 9 m\n- **Bonus caratteristiche:** +2 a una caratteristica\n\n### Tratti razziali\n\n- Tratto 1\n- Tratto 2\n\n### Sottorazze\n\n- **Sottorazza 1:** Descrizione e tratti\n- **Sottorazza 2:** Descrizione e tratti\n\n### Lingue\n\n- Lingue parlate',
  citta:'## Nome della Citta\n\nDescrizione della citta, atmosfera e popolazione.\n\n- **Popolazione:** [numero]\n- **Governo:** Consiglio / Signore / Sindaco\n- **Economia:** Commercio, artigianato\n- **Guardia:** Come e organizzata\n- **Pericolosita:** Bassa / Media / Alta\n\n### Quartieri\n\n- Quartiere 1: descrizione\n- Quartiere 2: descrizione\n\n### Punti di interesse\n\n- **Locanda:** Nome e descrizione\n- **Mercato:** Cosa si trova\n- **Tempio:** A chi e dedicato\n- **Luogo di potere:** Sede del governo\n\n### PNG chiave\n\n- Nome e ruolo\n- Nome e ruolo\n\n### Voci e segreti\n\n- Voce 1\n- Voce 2',
  evento:'## Nome dell\'Evento\n\nBreve descrizione dell\'evento.\n\n- **Data:** [data]\n- **Luogo:** [luogo]\n- **Organizzatori:** Chi lo promuove\n\n### Antefatti\n\nCosa e successo prima dell\'evento.\n\n### Svolgimento\n\nCome si e svolto l\'evento.\n\n### Partecipanti\n\n- Persona 1: ruolo\n- Persona 2: ruolo\n\n### Conseguenze\n\nEffetti dell\'evento sul mondo o sulla storia.'
};

var _viewMode='split';
var _mdSplit=50;
var _tocOffsets=[];
var _undo=[],_redo=[],_undoBase=null,_lastUndoTs=0;

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
  h1:function(){lineMd('# ')},h2:function(){lineMd('## ')},h3:function(){lineMd('### ')},
  quote:function(){lineMd('> ')},hr:function(){insMd('\n---\n')},
  ul:function(){lineMd('- ')},ol:function(){lineMd('1. ')},todo:function(){lineMd('- [ ] ')},
  link:function(){wrapMd('[','](url)')},img:openImgDialog,table:openTableDialog,
  code:function(){wrapMd('`','`')},codeblock:function(){insMd('\n```\n\n```')},
  emoji:openEmojiDialog,
  undo:function(){var ta=document.getElementById('e-md');if(!ta)return;_snapUndo();var s=_undo.pop();if(s===undefined){_undoBase=null;return}_redo.push(ta.value);ta.value=s;_undoBase=s;ta.selectionStart=ta.selectionEnd=ta.value.length;onMdInput()},
  redo:function(){var ta=document.getElementById('e-md');if(!ta)return;var s=_redo.pop();if(s===undefined)return;_undo.push(ta.value);ta.value=s;_undoBase=s;ta.selectionStart=ta.selectionEnd=ta.value.length;onMdInput()}
};
var EDITOR_TB=[
  ['undo','redo'],
  ['bold','italic','strike'],
  ['h1','h2','h3'],
  ['quote','hr'],
  ['ul','ol','todo'],
  ['link','img','table'],
  ['code','codeblock'],
  ['emoji']
];
var EDITOR_TB_LABEL={undo:'↩',redo:'↪',bold:'B',italic:'I',strike:'S̶',h1:'H1',h2:'H2',h3:'H3',quote:'❝',hr:'—',ul:'•',ol:'1.',todo:'☑',link:'🔗',img:'🖼',table:'⊞',code:'</>',codeblock:'```',emoji:'😀'};
var EDITOR_TB_TITLE={undo:'Annulla (Ctrl+Z)',redo:'Ripeti (Ctrl+Y)',bold:'Grassetto (Ctrl+B)',italic:'Corsivo (Ctrl+I)',strike:'Barrato',h1:'Titolo 1',h2:'Titolo 2',h3:'Titolo 3',quote:'Citazione',hr:'Divisore',ul:'Lista',ol:'Lista numerata',todo:'Checklist',link:'Link',img:'Immagine',table:'Tabella',code:'Codice inline',codeblock:'Blocco codice',emoji:'Emoji'};

function _layoutLabel(v){var l=LAYOUTS.find(function(x){return x.v===v});return l?(l.i+' '+l.l):('layout: '+(v||'—'))}

function runCmd(cmd){if(EDITOR_CMDS[cmd])EDITOR_CMDS[cmd]()}

/* ── APERTURA PAGINA ── */
async function openPage(k){
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
  _current={type:'page',k:k,sha:sha,title:json.title,icon:json.icon,layout:json.layout||''};
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
  h+='<div class="grow"></div>';
  h+='<div class="ed-actions">';
  h+='<button class="btn btn-soft btn-sm" onclick="toggleJson()" title="Modifica JSON grezzo">JSON</button>';
  h+='<button class="btn btn-soft btn-sm" onclick="openHistory()" title="Cronologia commit e ripristino versione">📜</button>';
  h+='<button class="btn btn-soft btn-sm" onclick="checkLinks()" title="Verifica i link interni del contenuto">🔗</button>';
  h+='<button class="btn btn-soft btn-sm" onclick="copyPageUrl()" title="Copia URL pulito della pagina">URL</button>';
  h+='<button class="btn btn-soft btn-sm" onclick="openPageOnSite()" title="Apri la pagina sul sito">🌐</button>';
  h+='<button class="btn btn-soft btn-sm" onclick="openRenameModal()" title="Rinomina sezione / pagina">✏️</button>';
  h+='<button class="btn btn-d btn-sm" id="del-btn" onclick="deletePage()">ELIMINA</button>';
  h+='<button class="btn btn-p btn-sm" id="save-btn" onclick="savePage()">SALVA</button>';
  h+='</div></div>';
  h+=buildToolbar();
  h+='<div class="ed-body" id="editor-body">';
  h+='<div class="pane" id="md-pane">';
  h+='<div class="pane-head">Markdown <span class="ph-info" id="e-stats"></span></div>';
  h+='<div class="ed-meta">';
  h+='<label>Titolo<input id="e-title" class="in mm-t" value="'+escAttr(json.title||'')+'" oninput="onMetaInput()" placeholder="Titolo pagina"></label>';
  h+='<label>Icona<input id="e-icon" class="in mm-icon" value="'+escAttr(json.icon||'')+'" oninput="onMetaInput()" maxlength="6" placeholder="📄"></label>';
  h+='<label>Layout<select id="e-layout" class="in mm-layout" onchange="onLayoutChange(this.value)">'+layoutOpts+'</select></label>';
  h+='</div>';
  h+='<textarea id="e-md" oninput="onMdInput()" onkeydown="onMdKey(event)" placeholder="Scrivi il contenuto in Markdown...">'+esc(json.content||'')+'</textarea>';
  h+='</div>';
  h+='<div class="divider-v" id="e-divider"></div>';
  h+='<div class="pane" id="pv-pane">';
  h+='<div class="pane-head">Anteprima <span class="ph-info" id="e-pv-info">'+esc(_layoutLabel(json.layout||''))+'</span></div>';
  h+='<div id="e-preview"></div>';
  h+='</div>';
  h+='<div class="md-outline" id="e-outline"><div class="ol-head">☰ Sommario</div><div class="ol-body" id="e-ol-body"></div></div>';
  h+='</div>';
  h+='<iframe id="site-frame"></iframe>';
  h+='<div class="json-pane" id="json-pane"><div class="pane-head">JSON</div><textarea id="e-json"></textarea></div>';
  h+='<div class="ed-statusbar"><span id="e-sb">'+esc(_layoutLabel(json.layout||''))+' · autosave ogni 15s</span><span class="st-r">⌨ Ctrl+S salva · Ctrl+B grassetto · Ctrl+I corsivo · Tab indent</span></div>';
  h+='</div>';
  document.getElementById('main').innerHTML=h;
  setViewMode(_viewMode);
  renderPreview();
  updateStats();
  _bindDivider();
  _bindEditorEvents();
}
function buildToolbar(){
  var h='<div class="ed-toolbar" id="e-toolbar">';
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
  h+='<button class="tb-btn2" data-view="split" title="Markdown + anteprima">SPLIT</button>';
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
function onMdKey(e){
  var ta=document.getElementById('e-md');if(!ta)return;
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();savePage();return}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='b'){e.preventDefault();runCmd('bold');return}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='i'){e.preventDefault();runCmd('italic');return}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();runCmd(e.shiftKey?'redo':'undo');return}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();runCmd('redo');return}
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
  if(_current&&_current.file){
    var meta=(_current.type==='db'?DB_FILES:_current.type==='mestiere'?MESTIERI:DOCS).find(function(f){return f.file===_current.file});
    return {icon:(meta&&meta.i)||'📄',title:_current.label||''};
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
  md=md.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank">$1</a>');
  md=md.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,'<img src="$2" alt="$1" style="max-width:100%;border-radius:4px">');
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
  var md=document.getElementById('e-md');var pv=document.getElementById('e-preview');
  if(!md||!pv)return;
  var hd=_currentHead();
  pv.innerHTML='<div class="e-pv"><div class="e-pv-head"><span class="epv-icon">'+hd.icon+'</span><div><div class="epv-title">'+esc(hd.title)+'</div><div class="epv-sub">'+esc(_current.k||'')+'</div></div></div>'+mdToHtml(md.value)+'</div>';
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
  body.innerHTML=h||'<div style="padding:0 10px;color:var(--dim);font-size:10px">Nessuna sezione</div>';
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
  var words=(md.value.trim()===''?0:md.value.trim().split(/\s+/).length);
  st.textContent=words+' parole · '+md.value.split('\n').length+' righe';
}
function setViewMode(m){
  _viewMode=m;
  var tb=document.getElementById('e-toolbar');
  if(tb){var vs=tb.querySelectorAll('[data-view]');for(var i=0;i<vs.length;i++)vs[i].classList.toggle('active',vs[i].getAttribute('data-view')===m)}
  var body=document.getElementById('editor-body');if(!body)return;
  var mdP=document.getElementById('md-pane'),pvP=document.getElementById('pv-pane');
  var div=document.getElementById('e-divider'),frame=document.getElementById('site-frame');
  if(m==='site'){
    body.style.display='none';
    if(frame){
      frame.style.display='block';
      if(_current&&_current.k){
        _pageCleanPath().then(function(p){frame.src=p});
      }
    }
    return;
  }
  if(frame)frame.style.display='none';
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
}
function onLayoutChange(val,silent){
  _current.layout=val;
  var md=document.getElementById('e-md');
  var current=(md?md.value:'').trim();
  var tpl=LAYOUT_TEMPLATES[val]||'';
  if(!silent&&(!current||confirm('Vuoi applicare il template per questo layout? Il contenuto attuale verra sostituito.'))&&md&&tpl){
    md.value=tpl;onMdInput();
  }
  _modified=true;setBadge('dirty','modificato');
  var info=document.getElementById('e-pv-info');
  if(info)info.textContent=_layoutLabel(val);
  var sb=document.getElementById('e-sb');
  if(sb)sb.textContent=_layoutLabel(val)+' · autosave ogni 15s';
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
async function savePage(){
  if(!_current)return;
  var md=document.getElementById('e-md').value;
  _current.title=getTitle()||_current.title;
  _current.icon=getIcon()||_current.icon;
  var json={k:_current.k,title:_current.title,icon:_current.icon,content:md,layout:_current.layout||'',lastModified:new Date().toISOString()};
  var path=CONTENT+'/pages/'+_current.k+'.json';
  setStatus('saving','verifica conflitti...');
  if(!await _checkRemoteSha()){
    if(!confirm('⚠️ Il file è stato modificato da un\'altra sessione. Sovrascrivere comunque?')){setStatus('idle','annullato');return}
  }
  setStatus('saving','salvataggio...');
  var btn=document.getElementById('save-btn');
  if(btn)btn.disabled=true;
  try{
    var r=await ghPut(path,'admin: update '+_current.k,JSON.stringify(json,null,2),_current.sha);
    if(r&&r.content&&r.content.sha)_current.sha=r.content.sha;
    _modified=false;_autosaveClear();_lastSavedContent=md;
    setBadge('ok','salvato');setStatus('ok','deploying...');
    await _logAudit('save_page',_current.k,{layout:_current.layout});
    toast('Salvato! Deploy Cloudflare in corso...','success');
    startDeployTimer();
    var edTitle=document.getElementById('ed-title');
    if(edTitle)edTitle.textContent=_current.title;
    var edIcon=document.getElementById('ed-icon');
    if(edIcon)edIcon.textContent=_current.icon||'📄';
  }catch(e){setBadge('err','errore');setStatus('err','errore');toast(e.message,'error')}
  if(btn)btn.disabled=false;
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
    +'<div class="upload-zone"><input type="file" id="img-file" accept="image/*" onchange="imgFileSelected(this)"><span class="uzi">🖼</span>Scegli un file immagine<br><small style="color:var(--dim)">viene compresso e caricato su /images/</small></div>'
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
  if(document.getElementById('img-modal'))return;
  var grid=_emojiList.map(function(e){return '<button type="button" class="em-cell" data-emoji="'+e+'">'+e+'</button>'}).join('');
  modalHtml('img-modal','😀 Inserisci emoji','<div class="em-grid">'+grid+'</div>','<button class="btn btn-soft" onclick="closeImgDialog()">Annulla</button>');
  var cells=document.querySelectorAll('#img-modal .em-cell');
  for(var i=0;i<cells.length;i++)cells[i].addEventListener('click',function(){insMd(this.getAttribute('data-emoji'));closeImgDialog()});
}
function openTableDialog(){
  if(document.getElementById('img-modal'))return;
  modalHtml('img-modal','⊞ Inserisci tabella',
    '<div class="fld"><label>Colonne</label><input id="tbl-cols" class="in" type="number" min="1" max="12" value="3"></div>'
    +'<div class="fld"><label>Righe</label><input id="tbl-rows" class="in" type="number" min="1" max="30" value="3"></div>',
    '<button class="btn btn-soft" onclick="closeImgDialog()">Annulla</button>'
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
  closeImgDialog();
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
function openNewPageModal(){
  if(document.getElementById('np-modal'))return;
  _slugTouched=false;
  var layoutOpts='';
  LAYOUTS.forEach(function(l){if(l.v)layoutOpts+='<option value="'+l.v+'">'+l.i+' '+l.l+'</option>'});
  var secOpts='';
  SECTIONS.forEach(function(s){secOpts+='<option value="'+s.v+'">'+s.l+'</option>'});
  modalHtml('np-modal','➕ Nuova pagina / sezione',
    '<div class="fld"><label>Nome della sezione</label><input id="np-label" class="in" placeholder="es. La Gilda dei Mercanti" onkeydown="if(event.key===\'Enter\')createNewPage()"></div>'
    +'<div class="fld"><label>Icona (emoji)</label><input id="np-icon" class="in" placeholder="es. 🏛️" value="📄" onkeydown="if(event.key===\'Enter\')createNewPage()"></div>'
    +'<div class="fld"><label>Slug / URL</label><input id="np-slug" class="in" placeholder="auto (es. la-gilda-dei-mercanti)" onkeydown="if(event.key===\'Enter\')createNewPage()"></div>'
    +'<div class="fld"><label>Sezione del menu</label><select id="np-sec" class="in">'+secOpts+'</select></div>'
    +'<div class="fld"><label>Layout</label><select id="np-layout" class="in">'+layoutOpts+'</select></div>',
    '<button class="btn btn-soft" onclick="closeNewPageModal()">Annulla</button>'
    +'<button class="btn btn-p" id="np-save" onclick="createNewPage()">CREA</button>');
  var label=document.getElementById('np-label');
  label.addEventListener('input',function(){
    if(!_slugTouched)document.getElementById('np-slug').value=slugify(label.value);
  });
  document.getElementById('np-slug').addEventListener('input',function(){_slugTouched=true});
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
    await ghPut(CONTENT+'/pages/'+slug+'.json','admin: create page '+slug,JSON.stringify(json,null,2),null);
    await addToDataJs(slug,label,icon,id,sec);
    await addToPathMap(slug,id,sec);
    await addToAdminPages(slug,label,icon,sec);
    PAGES.push({k:slug,l:label,i:icon,sec:sec,c:1});
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
async function addToDataJs(slug,label,icon,id,sec){
  var d=await ghGet('scripts/js/data.js');
  var s=b64decode(d.content);
  var start=s.indexOf('var pages = [');
  if(start===-1)throw new Error('data.js: "var pages" non trovato');
  var end=s.indexOf('];',start);
  if(end===-1)throw new Error('data.js: chiusura pages non trovata');
  if(s.slice(start,end).indexOf("k:'"+slug+"'")!==-1)throw new Error('Pagina già registrata in data.js');
  var entry='  {k:'+JSON.stringify(slug)+', l:'+JSON.stringify(label)+', i:'+JSON.stringify(icon)+', id:'+JSON.stringify(id)+', sec:'+JSON.stringify(sec)+'},\n';
  await ghPut('scripts/js/data.js','admin: add page '+slug+' to registry',_arrayInsert(s,'var pages = [','];',entry),d.sha);
}
async function addToPathMap(slug,id,sec){
  var d=await ghGet('scripts/js/app.js');
  var s=b64decode(d.content);
  var start=s.indexOf('var _pathMap = {');
  if(start===-1)throw new Error('app.js: "_pathMap" non trovato');
  var end=s.indexOf('};',start);
  if(end===-1)throw new Error('app.js: chiusura _pathMap non trovata');
  var path=sec?(sec+'/'+slug):slug;
  if(s.slice(start,end).indexOf("'"+path+"'")!==-1)throw new Error('URL già registrato: /'+path);
  var entry='  '+JSON.stringify(path)+': '+JSON.stringify(id)+',\n';
  await ghPut('scripts/js/app.js','admin: add page '+slug+' to path map',_arrayInsert(s,'var _pathMap = {','};',entry),d.sha);
}
async function addToAdminPages(slug,label,icon,sec){
  var d=await ghGet('admin/index.html');
  var s=b64decode(d.content);
  var start=s.indexOf('var PAGES = [');
  if(start===-1)throw new Error('admin: "var PAGES" non trovato');
  var end=s.indexOf('];',start);
  if(end===-1)throw new Error('admin: chiusura PAGES non trovata');
  if(s.slice(start,end).indexOf("k:'"+slug+"'")!==-1)throw new Error('Pagina già in PAGES');
  var entry='  {k:'+JSON.stringify(slug)+', l:'+JSON.stringify(label)+', i:'+JSON.stringify(icon)+', sec:'+JSON.stringify(sec)+', c:1},\n';
  await ghPut('admin/index.html','admin: add page '+slug+' to sidebar',_arrayInsert(s,'var PAGES = [','];',entry),d.sha);
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
async function removeFromDataJs(slug){
  var d=await ghGet('scripts/js/data.js');
  var s=b64decode(d.content);
  var r=_removeLine(s,new RegExp('k:["\']'+slug+'["\']'));
  if(r.found)await ghPut('scripts/js/data.js','admin: remove page '+slug+' from registry',_cleanLastComma(r.s,'var pages = [','];'),d.sha);
}
async function removeFromPathMap(id){
  var d=await ghGet('scripts/js/app.js');
  var s=b64decode(d.content);
  var r=_removeLine(s,new RegExp('["\']\\s*:\\s*["\']'+id+'["\']'));
  if(r.found)await ghPut('scripts/js/app.js','admin: remove page '+id+' from path map',_cleanLastComma(r.s,'var _pathMap = {','};'),d.sha);
}
async function removeFromAdminPages(slug){
  var d=await ghGet('admin/index.html');
  var s=b64decode(d.content);
  var r=_removeLine(s,new RegExp('k:["\']'+slug+'["\']'));
  if(r.found)await ghPut('admin/index.html','admin: remove page '+slug+' from sidebar',_cleanLastComma(r.s,'var PAGES = [','];'),d.sha);
}
async function deletePage(){
  if(!_current||_current.type!=='page')return;
  var meta=PAGES.find(function(p){return p.k===_current.k});
  var isCustom=!!(meta&&meta.c);
  var label=_current.title||_current.k;
  var msg=isCustom
    ?'Eliminare definitivamente la pagina "'+label+'"?\n\nVerranno rimossi contenuto, voce del menu e URL dedicato. Questa operazione non è reversibile.'
    :'Eliminare la sezione "'+label+'"?\n\nAttenzione: è una sezione predefinita del sito. Verranno rimossi il contenuto locale, la voce dal menu (desktop e mobile), la card dalla home e l\'URL dedicato. Questa operazione non è reversibile.';
  if(!confirm(msg))return;
  var btn=document.getElementById('del-btn');
  if(btn)btn.disabled=true;
  setStatus('saving','eliminazione...');
  var slug=_current.k;
  try{
    var id=await _getPageId(slug);
    if(_current.sha)await ghDelete(CONTENT+'/pages/'+slug+'.json','admin: delete page '+slug,_current.sha);
    await removeFromDataJs(slug);
    await removeFromPathMap(id);
    await removeFromAdminPages(slug);
    if(id&&id.indexOf('pag-')!==0)await removeFromIndex(slug,id);
    for(var i=0;i<PAGES.length;i++){if(PAGES[i].k===slug){PAGES.splice(i,1);break}}
    _modified=false;
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
    var d=await ghGet('scripts/js/data.js');
    var s=b64decode(d.content);
    var m=s.match(new RegExp("k:[\"']"+slug+"[\"'][^}]*?id:[\"']([^\"']+)[\"']"));
    return m?m[1]:null;
  }catch(e){return null}
}
function _replaceKV(line,key,val){
  var v=JSON.stringify(val);
  return line.replace(new RegExp(key+":(\"[^\"]*\"|'[^']*')"),key+":"+v);
}
async function renameInDataJs(slug,label,icon){
  var d=await ghGet('scripts/js/data.js');
  var s=b64decode(d.content);
  var lines=s.split('\n');
  var idx=-1;
  for(var i=0;i<lines.length;i++){if(new RegExp('k:["\']'+slug+'["\']').test(lines[i])){idx=i;break}}
  if(idx===-1)throw new Error('data.js: pagina '+slug+' non trovata');
  lines[idx]=_replaceKV(lines[idx],'l',label);
  lines[idx]=_replaceKV(lines[idx],'i',icon);
  await ghPut('scripts/js/data.js','admin: rename page '+slug,lines.join('\n'),d.sha);
}
async function renameInAdminPages(slug,label,icon){
  var d=await ghGet('admin/index.html');
  var s=b64decode(d.content);
  var lines=s.split('\n');
  var start=s.indexOf('var PAGES = [');
  if(start===-1)throw new Error('admin: "var PAGES" non trovato');
  var idx=-1;
  for(var i=0;i<lines.length;i++){
    if(new RegExp('k:["\']'+slug+'["\']').test(lines[i])&&s.indexOf(lines[i])>start){idx=i;break}
  }
  if(idx===-1)throw new Error('admin: pagina '+slug+' non trovata in PAGES');
  lines[idx]=_replaceKV(lines[idx],'l',label);
  lines[idx]=_replaceKV(lines[idx],'i',icon);
  await ghPut('admin/index.html','admin: rename page '+slug+' in sidebar',lines.join('\n'),d.sha);
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
    await renameInDataJs(slug,label,icon);
    await renameInAdminPages(slug,label,icon);
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
    var rows=commits&&commits.length?commits.map(function(c){
      var msg=c.commit&&c.commit.message||'';
      var date=c.commit&&c.commit.author&&c.commit.author.date?new Date(c.commit.author.date).toLocaleString('it-IT'):'';
      var sha=c.sha?c.sha.slice(0,8):'';
      return '<div class="row" style="cursor:default;background:var(--panel);border:1px solid var(--line)">'
        +'<div class="rmain"><div class="rt">'+esc(msg)+'</div><div class="rs">'+sha+' · '+esc(date)+'</div></div>'
        +'<button class="btn btn-soft btn-sm" onclick="restoreVersion(\''+c.sha+'\')">RIPRISTINA</button></div>';
    }).join(''):'<div class="list-empty">Nessun commit trovato</div>';
    modalHtml('hist-modal','📜 Storia — '+esc(_current.title||_current.k),
      '<div class="list-body">'+rows+'</div>',
      '<button class="btn btn-soft" onclick="closeModal(\'hist-modal\')">Chiudi</button>');
    setStatus('idle','pronto');
  }catch(e){setStatus('err','errore');toast(e.message,'error')}
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

/* ── SCHEMA PER EDITOR TABELLA ── */
var JSON_TABLE_SCHEMAS={
  'npc.json':[
    {k:'id',t:'text',req:true},{k:'name',t:'text',req:true},{k:'role',t:'text'},{k:'location',t:'text'},
    {k:'race',t:'text'},{k:'alignment',t:'text'},{k:'img',t:'url'},{k:'desc',t:'textarea'}
  ],
  'subclasses.json':[
    {k:'id',t:'text',req:true},{k:'name',t:'text',req:true},{k:'class',t:'text',req:true},
    {k:'source',t:'text'},{k:'desc',t:'textarea'},{k:'features',t:'textarea'}
  ],
  'species.json':[
    {k:'id',t:'text',req:true},{k:'name',t:'text',req:true},{k:'size',t:'text'},
    {k:'speed',t:'text'},{k:'ability',t:'text'},{k:'traits',t:'textarea'},{k:'subraces',t:'textarea'},{k:'languages',t:'text'}
  ],
  'changelog.json':[
    {k:'id',t:'text',req:true},{k:'title',t:'text'},{k:'icon',t:'text'},{k:'cover',t:'url'}
  ],
  'timeline.json':[
    {k:'id',t:'text',req:true},{k:'year',t:'text',req:true},{k:'title',t:'text',req:true},{k:'desc',t:'textarea'}
  ],
  'biblioteca.json':[
    {k:'id',t:'text',req:true},{k:'title',t:'text',req:true},{k:'author',t:'text'},{k:'category',t:'text'},
    {k:'desc',t:'textarea'},{k:'link',t:'url'}
  ],
  'alchimista.json':[
    {k:'title',t:'text',req:true},{k:'content',t:'textarea',req:true}
  ],
  'architetto.json':[
    {k:'title',t:'text',req:true},{k:'content',t:'textarea',req:true}
  ],
  'artigiano.json':[
    {k:'title',t:'text',req:true},{k:'content',t:'textarea',req:true}
  ],
  'artista.json':[
    {k:'title',t:'text',req:true},{k:'content',t:'textarea',req:true}
  ],
  'falegname.json':[
    {k:'title',t:'text',req:true},{k:'content',t:'textarea',req:true}
  ],
  'metallurgo.json':[
    {k:'title',t:'text',req:true},{k:'content',t:'textarea',req:true}
  ],
  'oste.json':[
    {k:'title',t:'text',req:true},{k:'content',t:'textarea',req:true}
  ],
  'sarto.json':[
    {k:'title',t:'text',req:true},{k:'content',t:'textarea',req:true}
  ],
  'patenti.json':[
    {k:'key',t:'text',req:true},{k:'content',t:'textarea',req:true},{k:'lastModified',t:'text'}
  ],
  'codice.json':[
    {k:'key',t:'text',req:true},{k:'content',t:'textarea',req:true},{k:'lastModified',t:'text'}
  ],
  'come-funzionano.json':[
    {k:'key',t:'text',req:true},{k:'content',t:'textarea',req:true},{k:'lastModified',t:'text'}
  ]
};
function _isArrayFile(file){return file in JSON_TABLE_SCHEMAS}
function _getSchema(file){return JSON_TABLE_SCHEMAS[file]||[]}

/* ── DB / MESTIERE / DOC EDITORS ── */
async function openDb(file){
  var meta=DB_FILES.find(function(d){return d.file===file});
  var path=CONTENT+'/db/'+file;
  var content='[]',sha=null;
  try{var d=await ghGet(path);content=b64decode(d.content);sha=d.sha}catch(e){}
  _current={type:'db',file:file,sha:sha,label:meta?meta.l:file};
  setCrumb('Contenuti','Database');
  setTitle((meta?meta.i:'📄')+' '+(meta?meta.l:file));
  if(_isArrayFile(file))renderTableEditor(content,file);else renderJsonEditor(content);
}
async function openMestiere(file){
  var meta=MESTIERI.find(function(m){return m.file===file});
  var path=CONTENT+'/mestieri/'+file;
  var raw='{}',sha=null;
  try{var d=await ghGet(path);raw=b64decode(d.content);sha=d.sha}catch(e){}
  var arr=[];
  try{
    var parsed=JSON.parse(raw);
    if(Array.isArray(parsed)){
      parsed.forEach(function(p){if(Array.isArray(p)&&p.length>=2)arr.push({title:p[0],content:p[1]})});
    }
  }catch(e){}
  var content=JSON.stringify(arr,null,2);
  _current={type:'mestiere',file:file,sha:sha,label:meta?meta.l:file,raw:raw};
  setCrumb('Contenuti','Mestieri');
  setTitle((meta?meta.i:'📄')+' '+(meta?meta.l:file));
  renderTableEditor(content,file);
}
async function openDoc(file){
  var meta=DOCS.find(function(d){return d.file===file});
  var path=CONTENT+'/docs/'+file;
  var raw='{}',sha=null;
  try{var d=await ghGet(path);raw=b64decode(d.content);sha=d.sha}catch(e){}
  var obj={};
  try{obj=JSON.parse(raw)}catch(e){}
  var content=JSON.stringify([obj],null,2);
  _current={type:'doc',file:file,sha:sha,label:meta?meta.l:file,raw:raw};
  setCrumb('Contenuti','Documenti');
  setTitle((meta?meta.i:'📄')+' '+(meta?meta.l:file));
  renderTableEditor(content,file);
}
function _edFrame(headHtml,bodyHtml){
  var h='<div class="ed-view">';
  h+='<div class="ed-head">'+headHtml+'</div>';
  h+='<div class="ed-body">'+bodyHtml+'</div>';
  h+='</div>';
  return h;
}
function renderJsonEditor(content){
  var h=_edFrame(
    '<div class="ed-title"><span class="eti">'+esc(_current.icon||'📄')+'</span><span id="ed-title">'+esc(_current.label)+'</span></div>'
    +'<span class="badge badge-idle" id="e-badge">salvato</span><div class="grow"></div>'
    +'<div class="ed-actions">'
    +(_isArrayFile(_current.file)?'<button class="btn btn-soft btn-sm" onclick="switchToTable()">Tabella</button>':'')
    +'<button class="btn btn-d btn-sm" id="del-btn" onclick="deleteJsonFile()">ELIMINA</button>'
    +'<button class="btn btn-p btn-sm" id="save-btn" onclick="saveJson()">SALVA</button>'
    +'</div>',
    '<div class="pane" style="flex:1"><div class="pane-head">JSON Data</div>'
    +'<textarea id="e-json" style="flex:1;resize:none;border:none;outline:none;background:var(--bg);color:var(--acc2);font-family:var(--mono);font-size:12px;line-height:1.6;padding:14px 16px" oninput="_modified=true;setBadge(\'dirty\',\'modificato\')">'+esc(content)+'</textarea></div>');
  document.getElementById('main').innerHTML=h;
}
function switchToTable(){
  if(!_current||!_isArrayFile(_current.file))return;
  try{var arr=JSON.parse(document.getElementById('e-json').value);renderTableEditor(JSON.stringify(arr),_current.file);}
  catch(e){toast('JSON non valido','error')}
}
function renderTableEditor(jsonStr,file){
  var schema=_getSchema(file);
  var arr=[];
  try{arr=JSON.parse(jsonStr)}catch(e){arr=[]}
  if(!Array.isArray(arr))arr=[];
  var cols=schema.map(function(c){return c.k});
  var h=_edFrame(
    '<div class="ed-title"><span class="eti">'+esc(_current.icon||'📄')+'</span><span id="ed-title">'+esc(_current.label)+'</span></div>'
    +'<span class="badge badge-idle" id="e-badge">salvato</span><div class="grow"></div>'
    +'<div class="ed-actions">'
    +'<button class="btn btn-soft btn-sm" onclick="renderJsonEditor(JSON.stringify(tableToArray(),null,2))">JSON</button>'
    +'<button class="btn btn-soft btn-sm" onclick="addTableRow()">+ Riga</button>'
    +'<button class="btn btn-d btn-sm" id="del-btn" onclick="deleteJsonFile()">ELIMINA</button>'
    +'<button class="btn btn-p btn-sm" id="save-btn" onclick="saveTable()">SALVA</button>'
    +'</div>',
    '<div class="pane" style="flex:1"><div class="pane-head">Editor tabella · '+arr.length+' righe</div>'
    +'<div class="tbl-wrap" style="flex:1">'
    +'<table><thead><tr>'
    +cols.map(function(c){return '<th>'+esc(c)+'</th>'}).join('')
    +'<th style="width:52px">Azioni</th></tr></thead><tbody id="table-body">'
    +arr.map(buildTableRow).join('')
    +'</tbody></table></div></div>');
  document.getElementById('main').innerHTML=h;
}
function buildTableRow(row,idx,schema){
  var h='<tr data-idx="'+idx+'">';
  schema.forEach(function(col){
    var val=row[col.k]!==undefined?row[col.k]:'';
    var type=col.t==='textarea'?'textarea':('input type="'+(col.t==='number'?'number':col.t==='url'?'url':'text')+'"');
    var req=col.req?' required':'';
    h+='<td><'+type+' value="'+escAttr(String(val))+'" data-col="'+esc(col.k)+'"'+req+'></td>';
  });
  h+='<td class="t-actions"><button class="btn btn-d btn-sm" onclick="deleteTableRow(this)">🗑</button></td>';
  h+='</tr>';
  return h;
}
function addTableRow(){
  var schema=_getSchema(_current.file);
  var tbody=document.getElementById('table-body');
  if(!tbody)return;
  var idx=tbody.children.length;
  tbody.insertAdjacentHTML('beforeend',buildTableRow({},idx,schema));
}
function deleteTableRow(btn){
  var tr=btn.closest('tr');
  if(tr)tr.remove();
  renumberTableRows();
}
function renumberTableRows(){
  var tbody=document.getElementById('table-body');
  if(!tbody)return;
  Array.from(tbody.children).forEach(function(tr,i){tr.dataset.idx=i});
}
function tableToArray(){
  var tbody=document.getElementById('table-body');
  if(!tbody)return [];
  var schema=_getSchema(_current.file);
  var arr=[];
  Array.from(tbody.children).forEach(function(tr){
    var row={};
    var valid=true;
    tr.querySelectorAll('input,textarea').forEach(function(inp){
      var col=inp.dataset.col;
      var val=inp.value;
      var req=inp.hasAttribute('required');
      if(req&&!val.trim())valid=false;
      if(val!=='')row[col]=val;
    });
    if(valid)arr.push(row);
  });
  return arr;
}
async function saveTable(){
  if(!_current)return;
  var arr=tableToArray();
  var file=_current.file;
  var json,path;
  if(_current.type==='mestiere'){
    var out=[];
    arr.forEach(function(r){out.push([r.title||'',r.content||''])});
    json=JSON.stringify(out,null,2);
    path=CONTENT+'/mestieri/'+file;
  }else if(_current.type==='doc'){
    json=JSON.stringify(arr[0]||{},null,2);
    path=CONTENT+'/docs/'+file;
  }else{
    json=JSON.stringify(arr,null,2);
    path=CONTENT+'/db/'+file;
  }
  var ejson=document.getElementById('e-json');
  if(ejson)ejson.value=json;
  setStatus('saving','verifica conflitti...');
  if(!await _checkRemoteSha()){
    if(!confirm('⚠️ Il file è stato modificato da un\'altra sessione. Sovrascrivere comunque?')){setStatus('idle','annullato');return}
  }
  setStatus('saving','salvataggio...');
  var btn=document.getElementById('save-btn');
  if(btn)btn.disabled=true;
  try{
    var r=await ghPut(path,'admin: update '+file,json,_current.sha);
    if(r&&r.content&&r.content.sha)_current.sha=r.content.sha;
    _modified=false;setBadge('ok','salvato');setStatus('ok','deploying...');
    await _logAudit('save_'+_current.type,file,{rows:arr.length});
    toast('Salvato! Deploy Cloudflare in corso...','success');
    startDeployTimer();
  }catch(e){setBadge('err','errore');setStatus('err','errore');toast(e.message,'error')}
  if(btn)btn.disabled=false;
}
async function saveJson(){
  if(!_current)return;
  var content=document.getElementById('e-json').value;
  try{JSON.parse(content)}catch(e){toast('JSON non valido: '+e.message,'error');return}
  var paths={page:CONTENT+'/pages/'+_current.k+'.json',db:CONTENT+'/db/'+_current.file,mestiere:CONTENT+'/mestieri/'+_current.file,doc:CONTENT+'/docs/'+_current.file};
  var path=paths[_current.type];
  setStatus('saving','verifica conflitti...');
  if(!await _checkRemoteSha()){
    if(!confirm('⚠️ Il file è stato modificato da un\'altra sessione. Sovrascrivere comunque?')){setStatus('idle','annullato');return}
  }
  setStatus('saving','salvataggio...');
  var btn=document.getElementById('save-btn');
  if(btn)btn.disabled=true;
  try{
    var r=await ghPut(path,'admin: update '+(_current.file||_current.k),content,_current.sha);
    if(r&&r.content&&r.content.sha)_current.sha=r.content.sha;
    _modified=false;setBadge('ok','salvato');setStatus('ok','deploying...');
    await _logAudit('save_'+_current.type,_current.file||_current.k,{});
    toast('Salvato! Deploy Cloudflare in corso...','success');
    startDeployTimer();
  }catch(e){setBadge('err','errore');setStatus('err','errore');toast(e.message,'error')}
  if(btn)btn.disabled=false;
}
async function deleteJsonFile(){
  if(!_current||_current.type==='page')return;
  var label=_current.label||_current.file;
  var path=_current.type==='db'?CONTENT+'/db/'+_current.file:_current.type==='mestiere'?CONTENT+'/mestieri/'+_current.file:CONTENT+'/docs/'+_current.file;
  if(!_current.sha){toast('File non esistente nel repo: '+path,'error');return}
  if(!confirm('Eliminare definitivamente il file "'+label+'" ('+path+')?\n\nAttenzione: se qualche pagina del sito lo usa, quella funzionalità si romperà. Questa operazione non è reversibile.'))return;
  var btn=document.getElementById('del-btn');
  if(btn)btn.disabled=true;
  setStatus('saving','eliminazione...');
  try{
    await ghDelete(path,'admin: delete '+_current.file,_current.sha);
    _modified=false;
    _current=null;
    buildSidebar();
    document.getElementById('main').innerHTML='<div class="empty"><span class="ei">🗑</span>'+esc(label)+' eliminato</div>';
    setTitle('');
    toast('File eliminato! Deploy in corso (~30s)...','success');
    setStatus('ok','deploying...');
    startDeployTimer();
  }catch(e){
    setStatus('err','errore');
    toast('Errore eliminazione: '+e.message,'error');
    if(btn)btn.disabled=false;
  }
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
    h+='<div class="img-grid">';
    if(!items.length)h+='<div class="empty"><span class="ei">🖼️</span>Nessuna immagine in /images/</div>';
    items.forEach(function(it){h+=_imgCard(it)});
    h+='</div>';
    document.getElementById('main').innerHTML=h;
    setStatus('ok','caricato');
    setTimeout(function(){setStatus('idle','pronto')},1500);
  }catch(e){setStatus('err','errore');toast(e.message,'error')}
}
function _imgCard(it){
  var name=it.name||'';
  var size=it.size?(it.size/1024).toFixed(1)+' KB':'';
  return '<div class="img-card">'
    +'<img src="'+esc(it.download_url||'')+'" alt="'+esc(name)+'" loading="lazy">'
    +'<div class="ic-body"><div class="ic-name">'+esc(name)+'</div>'
    +'<div class="ic-meta">'+size+' · '+esc(it.type||'file')+'</div>'
    +'<div class="ic-actions">'
    +'<button class="btn btn-soft btn-sm" onclick="copyImageUrl(\''+esc(name)+'\')">🔗 URL</button>'
    +'<button class="btn btn-d btn-sm" onclick="deleteImage(\''+esc(name)+'\',\''+esc(it.sha)+'\')">🗑</button>'
    +'</div></div></div>';
}
async function copyImageUrl(name){
  try{
    await navigator.clipboard.writeText('/images/'+name);
    toast('Copiato: /images/'+name,'success');
  }catch(e){toast('Errore copia: '+e.message,'error')}
}
async function deleteImage(name,sha){
  if(!confirm('Eliminare definitivamente l\'immagine /images/'+name+'?'))return;
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
