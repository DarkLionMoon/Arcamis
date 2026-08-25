/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — structured.js
   Editor CMS strutturato per i layout.

   Tre modalità:
   - 'pantheon': griglia divinità (invariata).
   - 'schede': card multipla con campi tipizzati (personaggio,
     bestiario, oggetti, luoghi, cronache, fazioni).
   - 'page': pagina singola con form CMS (contenuto, materiale).
   ════════════════════════════════════════════════════════════════ */

var _stMode=false;
var _stKind='pantheon';
var _stPreBlockContent='';
/* Layout per ogni modalità editor */
var _ST_PANTHEON_LAYOUTS=['pantheon'];
var _ST_PAGE_LAYOUTS=['contenuto','materiale'];
var _ST_SCHE_LAYOUTS=Object.keys(LAYOUT_REGISTRY).filter(function(k){
  var em=LAYOUT_REGISTRY[k]&&LAYOUT_REGISTRY[k].editorMode;
  return em==='schede';
});

function _stTemplateFields(){
  var r=LAYOUT_REGISTRY[_current.layout];
  var fields=(r&&r.fields)||[];
  var result={};
  fields.forEach(function(f){result[f.key]='';});
  return result;
}

/* ── UNDO / REDO ── */
var _stHistory=[];
var _stHistoryIdx=-1;
var _stMaxHistory=60;
function _stPushUndo(){
  var data=_stRead();
  _stHistory=_stHistory.slice(0,_stHistoryIdx+1);
  _stHistory.push(JSON.stringify(data));
  if(_stHistory.length>_stMaxHistory)_stHistory.shift();
  _stHistoryIdx=_stHistory.length-1;
  _stUpdateUndoButtons();
}
function _stUndo(){
  if(_stHistoryIdx<=0)return;
  _stHistoryIdx--;
  _stRestoreFromHistory();
}
function _stRedo(){
  if(_stHistoryIdx>=_stHistory.length-1)return;
  _stHistoryIdx++;
  _stRestoreFromHistory();
}
function _stRestoreFromHistory(){
  try{
    var data=JSON.parse(_stHistory[_stHistoryIdx]);
    _stRender(data);
    _stCommitSilent(data);
    _stUpdateUndoButtons();
  }catch(e){}
}
function _stUpdateUndoButtons(){
  var u=document.getElementById('st-undo-btn');
  var r=document.getElementById('st-redo-btn');
  var c=document.getElementById('st-undo-count');
  if(u)u.disabled=_stHistoryIdx<=0;
  if(r)r.disabled=_stHistoryIdx>=_stHistory.length-1;
  if(c){
    var remaining=_stHistory.length-1-_stHistoryIdx;
    c.textContent=remaining>0?'+'+remaining:'';
  }
}
function _stCanUndo(){return _stHistoryIdx>0}
function _stCanRedo(){return _stHistoryIdx<_stHistory.length-1}

/* Layout supportati dall'editor strutturato.
   'pantheon' → griglia divinità
   'schede'   → card multipla con campi tipizzati
   'page'     → pagina singola con form CMS */
function _stLayoutFor(layout){
  if(!layout)return null;
  var reg=LAYOUT_REGISTRY[layout];
  if(!reg)return null;
  var em=reg.editorMode;
  if(em==='pantheon')return 'pantheon';
  if(em==='schede')return 'schede';
  if(em==='contenuto'||em==='materiale')return 'page';
  return null;
}
function _stEditorKind(layout){
  var mode=_stLayoutFor(layout);
  return mode||'schede';
}
function _stSetKind(layout){
  _stKind=_stEditorKind(layout);
}

/* Etichetta dell'entità in base al layout corrente */
function _stEntName(){
  if(_stKind==='schede'){
    var reg=LAYOUT_REGISTRY[_current.layout];
    return 'Nuova '+(reg?reg.l.split('—')[0].trim().toLowerCase():'scheda');
  }
  return 'Nuova scheda';
}
function _stEntLabel(){
  if(_stKind==='schede'){
    var reg=LAYOUT_REGISTRY[_current.layout];
    return reg?reg.l.split('—')[0].trim().toLowerCase():'scheda';
  }
  return 'scheda';
}

/* ── PARSE markdown → blocchi ── */
function _stFold(s){return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function _stImgPos(src){
  var m=String(src||'').match(/#(\d{1,3})[.,](\d{1,3})$/);
  return m?[+m[1],+m[2]]:null;
}
function _stImgPosAttr(pos){
  return pos?'#'+Math.round(pos[0])+','+Math.round(pos[1]):'';
}
function _stParse(md){
  if(_stKind==='schede')return _stParseSchede(md);
  if(_stKind==='page')return _stParsePage(md);
  return _stParsePantheon(md);
}
function _stParsePantheon(md){
  if(!md)return {heading:'Divinità',intro:'',cards:[]};
  md=md.replace(/^\s*---\s*\n/,'');
  var blocks=md.split(/\n---\n/);
  var first=blocks.shift()||'';
  var heading='Divinità';
  var hm=first.match(/^#\s+(.+)/);
  if(hm)heading=hm[1].trim();
  var intro=first.replace(/^#\s+.+\n?/,'').trim();
  var cards=[];
  blocks.forEach(function(block){
    block=block.replace(/^\n+|\s+$/g,'');
    if(!block)return;
    var lines=block.split('\n');
    var name=null,img='',quote='',rest=[];
    for(var i=0;i<lines.length;i++){
      var line=lines[i];
      if(name===null&&/^#\s+(.+)/.test(line)){name=line.replace(/^#\s+/,'').trim();continue;}
      var im=line.match(/^!\[[^\]]*\]\(([^)]+)\)/);
      if(im&&!img){img=im[1];continue;}
      var qm=line.match(/^>\s*(.*)/);
      if(qm&&!quote){quote=qm[1].trim();continue;}
      rest.push(line);
    }
    if(!name)return;
    var pos=null;
    if(img){var pm=_stImgPos(img);if(pm){pos=pm;img=img.replace(/#[\d.,]+$/,'');}}
    var ident=[],personality='',cult='',extra=[];
    var lines2=rest.join('\n').replace(/^\n+/,'').trim().split('\n');
    var sec=null,buf=[];
    function flush(){
      var t=buf.join('\n').trim();
      var f=_stFold(sec);
      if(f==='identita'){ident=_stParseIdent(t);}
      else if(f==='personalita'){personality=t;}
      else if(f==='culto'){cult=t;}
      else if(t)extra.push((sec?('## '+sec+'\n\n'):'')+t);
      buf=[];sec=null;
    }
    for(var j=0;j<lines2.length;j++){
      var m=lines2[j].match(/^##\s+(.+)/);
      if(m){flush();sec=m[1].trim();continue;}
      buf.push(lines2[j]);
    }
    flush();
    cards.push({type:img?'deity':'section',name:name,img:img,pos:pos,quote:quote,
      ident:ident,personality:personality,cult:cult,extra:extra.join('\n\n')});
  });
  return {heading:heading,intro:intro,cards:cards};
}
function _stParseIdent(t){
  var pairs=[];
  (t||'').split('\n').forEach(function(line){
    var m=line.match(/^\s*-\s*\*\*(.+?)\*\*\s*:?\s*(.*)$/);
    if(m)pairs.push([m[1].trim().replace(/:$/,''),m[2].trim()]);
  });
  return pairs;
}

/* ── PARSE schede (sessione/quest/npc/spell/specie/citta/evento/bestiario/fazioni/oggetti + generico) ── */
function _stParseSchede(md){
  var reg=LAYOUT_REGISTRY[_current.layout];
  var fieldDefs=(reg&&reg.fields)||[];
  var shortFieldDefs=fieldDefs.filter(function(f){return f.type!=='wysiwyg'});
  var wysiwygFieldDefs=fieldDefs.filter(function(f){return f.type==='wysiwyg'});
  var cards=[];
  if(!md)return {heading:'',intro:'',cards:[]};
  var parts=md.split(/^## /m);
  var intro=(parts.shift()||'').trim();
  parts.filter(Boolean).forEach(function(sec){
    var lines=sec.split('\n');
    var name=(lines.shift()||'').trim().replace(/^#\s+/,'');
    var intro2=[],fields={},legacyFields=[],blocks=[],cur=null,buf=[];
    /* Build label→key map for this layout */
    var labelToKey={};
    shortFieldDefs.forEach(function(f){labelToKey[f.label.toLowerCase()]=f.key;});
    /* Init all fields empty */
    shortFieldDefs.forEach(function(f){fields[f.key]='';});
    function flushBlock(){
      if(cur!==null)blocks.push({name:cur,md:buf.join('\n').trim()});
      buf=[];cur=null;
    }
    lines.forEach(function(line){
      var fm=line.match(/^\s*-\s*\*\*(.+?):?\*\*\s*:?\s*(.*)$/);
      if(fm){
        flushBlock();
        var key=fm[1].trim().replace(/:$/,'').toLowerCase();
        var mappedKey=labelToKey[key];
        if(mappedKey){
          fields[mappedKey]=fm[2].trim();
        }else{
          legacyFields.push([fm[1].trim().replace(/:$/,''),fm[2].trim()]);
        }
        return;
      }
      var bm=line.match(/^###\s+(.+)/);
      if(bm){
        flushBlock();
        var secName=bm[1].trim();
        var secKey=null;
        wysiwygFieldDefs.forEach(function(f){
          if(f.label.toLowerCase()===secName.toLowerCase())secKey=f.key;
        });
        if(secKey){cur='__wysiwyg__'+secKey;}
        else{cur=secName;}
        return;
      }
      if(cur!==null){buf.push(line);return;}
      if(line.trim())intro2.push(line);
    });
    flushBlock();
    /* Split blocks into wysiwyg fields and extra blocks */
    var finalBlocks=[];
    blocks.forEach(function(b){
      if(b.name.indexOf('__wysiwyg__')===0){
        fields[b.name.replace('__wysiwyg__','')]=b.md;
      }else{
        finalBlocks.push(b);
      }
    });
    cards.push({name:name,intro:intro2.join('\n').trim(),fields:fields,legacyFields:legacyFields,blocks:finalBlocks});
  });
  return {heading:'',intro:intro,cards:cards};
}

/* ── PARSE page (contenuto/materiale — pagina singola) ── */
function _stParsePage(md){
  if(!md)return {fields:{},body:''};
  var reg=LAYOUT_REGISTRY[_current.layout];
  var fields={};
  var body=md;
  /* Estrai campi short: - **Chiave:** valore */
  var fieldDefs=(reg&&reg.fields)||[];
  var shortFields=fieldDefs.filter(function(f){return f.type!=='wysiwyg'});
  shortFields.forEach(function(f){
    var re=new RegExp('^\\s*-\\s*\\*\\*'+f.label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+':\\*\\*\\s*(.*)$','im');
    var m=body.match(re);
    if(m){fields[f.key]=m[1].trim();body=body.replace(m[0],'');}
    else{fields[f.key]='';}
  });
  /* Estrai sections wysiwyg: ## Nome → contenuto fino al prossimo ## */
  var wysiwygFields=fieldDefs.filter(function(f){return f.type==='wysiwyg'});
  if(wysiwygFields.length&&wysiwygFields[0].key==='body'){
    /* Single body field: tutto il resto è body */
    fields.body=body.replace(/^\n+/,'').trim();
  }else{
    wysiwygFields.forEach(function(f){
      var re=new RegExp('^##\\s+'+f.label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*$','im');
      var m=body.match(re);
      if(m){
        var start=m.index+m[0].length;
        var nextSec=body.indexOf('\n## ',start);
        var content=nextSec===-1?body.substring(start):body.substring(start,nextSec);
        fields[f.key]=content.replace(/^\n+/,'').trim();
        body=body.substring(0,m.index)+body.substring(nextSec===-1?body.length:nextSec);
      }else{
        fields[f.key]='';
      }
    });
  }
  return {fields:fields,body:body.replace(/^\n+/,'').trim()};
}

/* ── BUILD schede → markdown ── */
function _stBuildSchede(data){
  var reg=LAYOUT_REGISTRY[_current.layout];
  var fieldDefs=(reg&&reg.fields)||[];
  var shortFieldDefs=fieldDefs.filter(function(f){return f.type!=='wysiwyg'});
  var wysiwygFieldDefs=fieldDefs.filter(function(f){return f.type==='wysiwyg'});
  var out='';
  if(data.intro&&data.intro.trim())out+=data.intro.trim();
  (data.cards||[]).forEach(function(c){
    if(out)out+='\n\n';
    out+='## '+(c.name||'Scheda');
    if(c.intro)out+='\n\n'+c.intro;
    /* Campi strutturati tipizzati */
    if(c.fields&&typeof c.fields==='object'&&!Array.isArray(c.fields)){
      shortFieldDefs.forEach(function(f){
        var val=c.fields[f.key]||'';
        if(val)out+='\n\n- **'+f.label+':** '+val;
      });
      wysiwygFieldDefs.forEach(function(f){
        var val=c.fields[f.key]||'';
        if(val)out+='\n\n### '+f.label+'\n\n'+val;
      });
    }else if(c.fields&&c.fields.length){
      /* Legacy key-value pairs */
      out+='\n\n'+c.fields.map(function(f){return '- **'+f[0]+':** '+f[1]}).join('\n');
    }
    (c.blocks||[]).forEach(function(b){
      out+='\n\n### '+b.name;
      if(b.md)out+='\n\n'+b.md;
    });
  });
  return out;
}

/* ── BUILD blocchi → markdown (formato compatibile con il sito) ── */
function _stBuildMd(data){
  if(_stKind==='schede')return _stBuildSchede(data);
  if(_stKind==='page')return _stBuildPage(data);
  var out='# '+(data.heading||'Divinità')+'\n\n'+(data.intro||'');
  data.cards.forEach(function(c){
    out+='\n\n---\n\n'+_stBuildCard(c);
  });
  return out;
}
function _stBuildPage(data){
  var reg=LAYOUT_REGISTRY[_current.layout];
  var fieldDefs=(reg&&reg.fields)||[];
  var out='';
  /* Campi short */
  var shortFields=fieldDefs.filter(function(f){return f.type!=='wysiwyg'});
  shortFields.forEach(function(f){
    var val=(data.fields&&data.fields[f.key])||'';
    if(val)out+='\n- **'+f.label+':** '+val;
  });
  /* Sezioni wysiwyg */
  var wysiwygFields=fieldDefs.filter(function(f){return f.type==='wysiwyg'});
  if(wysiwygFields.length&&wysiwygFields[0].key==='body'){
    out+='\n\n'+(data.fields.body||'');
  }else{
    wysiwygFields.forEach(function(f){
      var val=(data.fields&&data.fields[f.key])||'';
      if(val)out+='\n\n## '+f.label+'\n\n'+val;
    });
  }
  return out.replace(/^\n/,'');
}
function _stBuildCard(c){
  var b='# '+(c.name||'');
  if(c.img)b+='\n\n!['+(c.name||'')+']('+c.img+_stImgPosAttr(c.pos)+')';
  if(c.quote)b+='\n\n> '+c.quote;
  if(c.ident&&c.ident.length){
    b+='\n\n## Identità\n\n'+c.ident.map(function(p){return '- **'+p[0]+':** '+p[1]}).join('\n');
  }
  if(c.personality)b+='\n\n## Personalità\n\n'+c.personality;
  if(c.cult)b+='\n\n## Culto\n\n'+c.cult;
  if(c.extra)b+='\n\n'+c.extra;
  return b;
}

/* ── ANTEPRIMA griglia (stessa resa del sito) ── */
function _stEpi(c){
  for(var i=0;i<(c.ident||[]).length;i++)if(/^epiteto$/i.test(c.ident[i][0]))return c.ident[i][1];
  return '';
}
function _stMd(md){
  if(!md)return '';
  if(typeof window.mdRender==='function'){
    try{var o=window.mdRender(md);if(o)return o}catch(e){}
  }
  return md.replace(/&/g,'&amp;').replace(/</g,'&lt;');
}
function _stPreviewHTML(data){
  if(_stKind==='schede')return _stPreviewSchede(data);
  if(_stKind==='page')return _stPreviewPage(data);
  var h='<div class="pan-page">';
  if(data.intro)h+='<div class="pan-intro">'+_stMd(data.intro)+'</div>';
  h+='<div class="pan-grid">';
  data.cards.forEach(function(c){
    if(!c.img){
      h+='<div class="pan-section"><div class="pan-section-title">'+esc(c.name)+'</div>'
        +'<div class="pan-section-body">'+_stMd(c.extra)+'</div></div>';
      return;
    }
    var epi=_stEpi(c);
    h+='<div class="pan-tile" style="cursor:default">'
      +'<img class="pan-tile-img" src="'+escAttr(c.img)+'" alt="'+escAttr(c.name)+'" loading="lazy"'
      +' onerror="this.onerror=null;this.style.display=\'none\'"'
      +(c.pos?' style="object-position:'+c.pos[0]+'% '+c.pos[1]+'%"':'')+'>'
      +'<div class="pan-tile-caption"><span class="pan-tile-name">'+esc(c.name)+'</span>'
      +(epi?'<span class="pan-tile-epi">'+esc(epi)+'</span>':'')+'</div></div>';
  });
  h+='</div></div>';
  return h;
}

/* ── ANTEPRIMA schede (stessa resa del sito: card _renderSchede/_renderBestiario) ── */
function _stPreviewSchede(data){
  var reg=LAYOUT_REGISTRY[_current.layout];
  var fieldDefs=(reg&&reg.fields)||[];
  var shortFieldDefs=fieldDefs.filter(function(f){return f.type!=='wysiwyg'});
  var h='<div class="sch-page">';
  if(data.intro)h+='<div class="sch-intro">'+_stMd(data.intro)+'</div>';
  (data.cards||[]).forEach(function(c){
    h+='<div class="sch-card" style="margin-bottom:16px;border:1px solid var(--line);border-radius:var(--rad);padding:14px">';
    h+='<div class="sch-title" style="font-family:var(--brand);color:var(--acc2);font-size:17px;font-weight:700">'+esc(c.name)+'</div>';
    if(c.intro)h+='<div class="sch-intro" style="margin:8px 0">'+_stMd(c.intro)+'</div>';
    /* Structured fields */
    if(c.fields&&typeof c.fields==='object'&&!Array.isArray(c.fields)){
      var hasFields=shortFieldDefs.some(function(f){return c.fields[f.key]});
      if(hasFields){
        h+='<div class="sch-fields" style="display:flex;flex-direction:column;gap:4px;margin:8px 0">';
        shortFieldDefs.forEach(function(f){
          var val=c.fields[f.key]||'';
          if(val)h+='<div class="sch-field"><span class="sch-key" style="color:var(--acc2);font-weight:700">'+esc(f.label)+'</span> '
            +'<span class="sch-val">'+esc(val)+'</span></div>';
        });
        h+='</div>';
      }
    }else if(c.fields&&c.fields.length){
      /* Legacy */
      h+='<div class="sch-fields" style="display:flex;flex-direction:column;gap:4px;margin:8px 0">';
      c.fields.forEach(function(f){
        h+='<div class="sch-field"><span class="sch-key" style="color:var(--acc2);font-weight:700">'+esc(f[0])+'</span> '
          +'<span class="sch-val">'+esc(f[1])+'</span></div>';
      });
      h+='</div>';
    }
    /* Legacy blocks */
    (c.blocks||[]).forEach(function(b){
      h+='<div class="sch-block-title" style="font-weight:700;color:var(--acc);margin-top:10px">'+esc(b.name)+'</div>';
      h+='<div class="sch-block-body">'+_stMd(b.md)+'</div>';
    });
    h+='</div>';
  });
  h+='</div>';
  return h;
}

/* ── ANTEPRIMA page (contenuto/materiale) ── */
function _stPreviewPage(data){
  var md=_stBuildPage(data);
  return '<div class="sch-page">'+_stMd(md)+'</div>';
}

/* ── CARD blocco ── */
function _stCardHTML(c,i){
  if(_stKind==='schede')return _stSchedeCardHTML(c,i);
  if(!c.img&&!c.deity){
    return '<div class="st-card st-card-sec" data-i="'+i+'" draggable="true"'
      +'ondragstart="_stDragStart(event,'+i+')" ondragend="_stDragEnd(event)"'
      +'ondragover="_stDragOver(event,'+i+')" ondragleave="_stDragLeave(event,'+i+')"'
      +'ondrop="_stDrop(event,'+i+')">'
      +'<div class="st-card-head"><span class="st-drag-handle" title="Trascina per riordinare" ontouchstart="_stTouchDragStart(event,'+i+')">⠿</span>'
      +'<span class="st-idx">'+(i+1)+'</span>'
      +'<input class="in st-name" value="'+escAttr(c.name)+'" placeholder="Nome della sezione" oninput="_stSync()">'
      +'<span class="st-head-actions">'
      +'<button type="button" class="btn btn-soft btn-icon btn-sm" title="Trasforma in '+_stEntLabel()+' (aggiungi immagine)" onclick="_stPick('+i+')">🖼</button>'
      +'<button type="button" class="btn btn-soft btn-icon btn-sm st-collapse" title="Comprimi/espandi" onclick="_stCollapse('+i+')">▾</button>'
      +'<button type="button" class="btn btn-soft btn-icon btn-sm" title="Duplica blocco" onclick="_stDuplicate('+i+')">⧉</button>'
      +'<button type="button" class="btn btn-soft btn-icon btn-sm" title="Sposta su" onclick="_stMove('+i+',-1)">↑</button>'
      +'<button type="button" class="btn btn-soft btn-icon btn-sm" title="Sposta giù" onclick="_stMove('+i+',1)">↓</button>'
      +'<button type="button" class="btn btn-d btn-icon btn-sm" title="Elimina blocco" onclick="_stDelete('+i+')">🗑</button>'
      +'</span></div>'
      +'<div class="st-card-body">'
      +'<label class="st-ta-l">Contenuto della sezione (markdown)<textarea class="in st-ta st-extra" oninput="_stSync()" placeholder="Scrivi qui la sezione…">'+esc(c.extra)+'</textarea></label>'
      +'</div></div>';
  }
  var rows=(c.ident&&c.ident.length?c.ident:[['Nome',''],['Epiteto',''],['Allineamento',''],['Sfere',''],['Simbolo','']])
    .map(function(p){return '<div class="st-kv"><input class="in k" value="'+escAttr(p[0])+'" placeholder="Campo" oninput="_stSync()">'
      +'<input class="in v" value="'+escAttr(p[1])+'" placeholder="Valore" oninput="_stSync()">'
      +'<button type="button" class="btn btn-d btn-icon btn-sm" title="Rimuovi campo" onclick="_stDelRow(this)">✕</button></div>';}).join('');
  return '<div class="st-card" data-i="'+i+'" draggable="true"'
    +'ondragstart="_stDragStart(event,'+i+')" ondragend="_stDragEnd(event)"'
    +'ondragover="_stDragOver(event,'+i+')" ondragleave="_stDragLeave(event,'+i+')"'
    +'ondrop="_stDrop(event,'+i+')">'
    +'<div class="st-card-head"><span class="st-drag-handle" title="Trascina per riordinare" ontouchstart="_stTouchDragStart(event,'+i+')">⠿</span>'
    +'<span class="st-idx">'+(i+1)+'</span>'
    +'<input class="in st-name" value="'+escAttr(c.name)+'" placeholder="Nome della divinità / sezione" oninput="_stSync()">'
    +'<span class="st-head-actions">'
    +'<button type="button" class="btn btn-soft btn-icon btn-sm" title="Trasforma in sezione (rimuovi immagine)" onclick="_stConvertToSection('+i+')">➖</button>'
    +'<button type="button" class="btn btn-soft btn-icon btn-sm st-collapse" title="Comprimi/espandi" onclick="_stCollapse('+i+')">▾</button>'
    +'<button type="button" class="btn btn-soft btn-icon btn-sm" title="Duplica blocco" onclick="_stDuplicate('+i+')">⧉</button>'
    +'<button type="button" class="btn btn-soft btn-icon btn-sm" title="Sposta su" onclick="_stMove('+i+',-1)">↑</button>'
    +'<button type="button" class="btn btn-soft btn-icon btn-sm" title="Sposta giù" onclick="_stMove('+i+',1)">↓</button>'
    +'<button type="button" class="btn btn-d btn-icon btn-sm" title="Elimina blocco" onclick="_stDelete('+i+')">🗑</button>'
    +'</span></div>'
    +'<div class="st-card-body">'
    +'<div class="st-img-wrap" id="st-imgwrap-'+i+'"'
    +(c.img?' title="Trascina per scegliere la parte visibile nella card" onmousedown="_stPosDown(event,'+i+')"':'')
    +'>'
    +(c.img
        ?'<img class="st-img" id="st-img-'+i+'" src="'+escAttr(c.img)+'" alt="'+escAttr(c.name)+'"'
          +' onerror="this.onerror=null;this.style.display=\'none\';this.parentNode.classList.add(\'img-broken\')"'
          +(c.pos?' style="object-position:'+c.pos[0]+'% '+c.pos[1]+'%"':'')+'>'
        :'<div class="st-img st-img-empty" id="st-img-'+i+'">🛐</div>')
    +'<div class="st-pos-mark" id="st-posmark-'+i+'" style="left:'+(c.pos?c.pos[0]:50)+'%;top:'+(c.pos?c.pos[1]:50)+'%;display:'+(c.pos?'block':'none')+'"></div>'
    +'</div>'
    +'<input type="hidden" class="st-imgval" id="st-imgval-'+i+'" value="'+escAttr(c.img||'')+'">'
    +'<input type="hidden" class="st-posval" id="st-posval-'+i+'" value="'+(c.pos?c.pos[0]+','+c.pos[1]:'')+'">'
    +'<div class="st-img-actions">'
    +'<button type="button" class="btn btn-soft btn-sm" onclick="_stPick('+i+')">🖼 Scegli</button>'
    +'<button type="button" class="btn btn-soft btn-sm" onclick="_stClearImg('+i+')">✕</button>'
    +'<span class="st-pos-hint">Trascina sull\'immagine per il ritaglio</span>'
    +'</div>'
    +'<label class="st-ta-l">Citazione<input class="in st-quote" value="'+escAttr(c.quote)+'" placeholder="Frase rappresentativa…" oninput="_stSync()"></label>'
    +'<p class="st-hint">Senza immagine il blocco diventa una sezione a tutta larghezza (es. gli Aspetti).</p>'
    +'<div class="st-sub">Identità</div>'
    +'<div class="st-kvrows" id="st-ident-'+i+'">'+rows+'</div>'
    +'<button type="button" class="btn btn-soft btn-sm" onclick="_stAddIdent('+i+')">＋ campo identità</button>'
    +'<label class="st-ta-l">Personalità<textarea class="in st-ta st-personality" oninput="_stSync()">'+esc(c.personality)+'</textarea></label>'
    +'<label class="st-ta-l">Culto<textarea class="in st-ta st-cult" oninput="_stSync()">'+esc(c.cult)+'</textarea></label>'
    +'<label class="st-ta-l">Contenuto aggiuntivo (markdown)<textarea class="in st-ta st-extra" oninput="_stSync()">'+esc(c.extra)+'</textarea></label>'
    +'</div></div>';
}

/* ── CARD blocco — schede (titolo + intro + campi + sezioni ###) ── */
function _stSchedeCardHTML(c,i){
  var reg=LAYOUT_REGISTRY[_current.layout];
  var fieldDefs=(reg&&reg.fields)||[];
  var shortFieldDefs=fieldDefs.filter(function(f){return f.type!=='wysiwyg'});
  var wysiwygFieldDefs=fieldDefs.filter(function(f){return f.type==='wysiwyg'});
  var cFields=(c.fields&&typeof c.fields==='object'&&!Array.isArray(c.fields))?c.fields:{};

  var fieldsHtml='';
  shortFieldDefs.forEach(function(f){
    var val=cFields[f.key]||'';
    if(f.type==='select'){
      var opts=(f.options||[]).map(function(o){
        return '<option value="'+escAttr(o)+'"'+(val===o?' selected':'')+'>'+esc(o)+'</option>';
      }).join('');
      fieldsHtml+='<label class="st-ta-l st-field-'+f.key+'">'+esc(f.label)
        +'<select class="in cms-select" data-field-key="'+escAttr(f.key)+'" onchange="_stSync()">'
        +'<option value="">— seleziona —</option>'+opts+'</select></label>';
    }else if(f.type==='number'){
      fieldsHtml+='<label class="st-ta-l st-field-'+f.key+'">'+esc(f.label)
        +'<input class="in cms-input" type="number" data-field-key="'+escAttr(f.key)+'" value="'+escAttr(val)+'" oninput="_stSync()" placeholder="'+escAttr(f.placeholder||'0')+'"></label>';
    }else if(f.type==='image'){
      fieldsHtml+='<label class="st-ta-l st-field-'+f.key+'">'+esc(f.label)
        +'<div style="display:flex;gap:6px"><input class="in cms-input" data-field-key="'+escAttr(f.key)+'" value="'+escAttr(val)+'" oninput="_stSync()" placeholder="/images/…">'
        +'<button type="button" class="btn btn-soft btn-sm" onclick="_stPagePickImage(\''+escAttr(f.key)+'\')">🖼</button></div></label>';
    }else{
      fieldsHtml+='<label class="st-ta-l st-field-'+f.key+'">'+esc(f.label)
        +'<input class="in cms-input" data-field-key="'+escAttr(f.key)+'" value="'+escAttr(val)+'" oninput="_stSync()" placeholder="'+escAttr(f.placeholder||'')+'"></label>';
    }
  });

  var sectionsHtml='';
  wysiwygFieldDefs.forEach(function(f){
    var val=cFields[f.key]||'';
    sectionsHtml+='<label class="st-ta-l st-field-'+f.key+'">'+esc(f.label)
      +'<textarea class="in st-ta cms-wysiwyg" data-field-key="'+escAttr(f.key)+'" oninput="_stSync()" placeholder="'+escAttr(f.placeholder||'Scrivi '+f.label.toLowerCase()+'…')+'">'+esc(val)+'</textarea>'
      +'<div class="cms-wysiwyg-tb">'
      +'<button type="button" class="tb-fmt" onclick="_stWysiwygCmd(this,\'**\',\'testo\')" title="Grassetto"><b>B</b></button>'
      +'<button type="button" class="tb-fmt" onclick="_stWysiwygCmd(this,\'*_\',\'testo\')" title="Corsivo"><i>I</i></button>'
      +'<button type="button" class="tb-fmt" onclick="_stWysiwygCmd(this,\'~~\',\'testo\')" title="Barrato"><s>S</s></button>'
      +'<button type="button" class="tb-fmt" onclick="_stWysiwygCmd(this,\'## \',\'\' )" title="Titolo">H2</button>'
      +'<button type="button" class="tb-fmt" onclick="_stWysiwygCmd(this,\'### \',\'\' )" title="Sottotitolo">H3</button>'
      +'<button type="button" class="tb-fmt" onclick="_stWysiwygCmd(this,\'- \',\'\' )" title="Lista">☰</button>'
      +'<button type="button" class="tb-fmt" onclick="_stWysiwygCmd(this,\'> \',\'\' )" title="Citazione">❝</button>'
      +'<button type="button" class="tb-fmt" onclick="_stWysiwygCmdLink(this)" title="Link">🔗</button>'
      +'</div>'
      +'</label>';
  });

  /* Legacy extra fields (not in layout definition) */
  var legacyHtml='';
  if(c.legacyFields&&c.legacyFields.length){
    legacyHtml='<div class="st-sub">Campi aggiuntivi</div>'
      +'<div class="st-kvrows" id="st-ident-'+i+'">'
      +c.legacyFields.map(function(p){
        return '<div class="st-kv"><input class="in k" value="'+escAttr(p[0])+'" placeholder="Campo" oninput="_stSync()">'
          +'<input class="in v" value="'+escAttr(p[1])+'" placeholder="Valore" oninput="_stSync()">'
          +'<button type="button" class="btn btn-d btn-icon btn-sm" title="Rimuovi campo" onclick="_stDelRow(this)">✕</button></div>';
      }).join('')+'</div>'
      +'<button type="button" class="btn btn-soft btn-sm" onclick="_stAddIdent('+i+')">＋ campo aggiuntivo</button>';
  }

  var blocks=(c.blocks||[]).map(function(b,j){
    return '<div class="st-block">'
      +'<div class="st-block-head"><input class="in st-bname" value="'+escAttr(b.name)+'" placeholder="Titolo sezione" oninput="_stSync()">'
      +'<button type="button" class="btn btn-d btn-icon btn-sm" title="Rimuovi sezione" onclick="_stDelBlock(this)">✕</button></div>'
      +'<textarea class="in st-ta st-bmd" oninput="_stSync()" placeholder="Contenuto (markdown)">'+esc(b.md)+'</textarea>'
      +'</div>';
  }).join('');

  return '<div class="st-card" data-i="'+i+'" draggable="true"'
    +'ondragstart="_stDragStart(event,'+i+')" ondragend="_stDragEnd(event)"'
    +'ondragover="_stDragOver(event,'+i+')" ondragleave="_stDragLeave(event,'+i+')"'
    +'ondrop="_stDrop(event,'+i+')">'
    +'<div class="st-card-head"><span class="st-drag-handle" title="Trascina per riordinare" ontouchstart="_stTouchDragStart(event,'+i+')">⠿</span>'
    +'<span class="st-idx">'+(i+1)+'</span>'
    +'<input class="in st-name" value="'+escAttr(c.name)+'" placeholder="Titolo della scheda" oninput="_stSync()">'
    +'<span class="st-head-actions">'
    +'<button type="button" class="btn btn-soft btn-icon btn-sm st-collapse" title="Comprimi/espandi" onclick="_stCollapse('+i+')">▾</button>'
    +'<button type="button" class="btn btn-soft btn-icon btn-sm" title="Duplica scheda" onclick="_stDuplicate('+i+')">⧉</button>'
    +'<button type="button" class="btn btn-soft btn-icon btn-sm" title="Sposta su" onclick="_stMove('+i+',-1)">↑</button>'
    +'<button type="button" class="btn btn-soft btn-icon btn-sm" title="Sposta giù" onclick="_stMove('+i+',1)">↓</button>'
    +'<button type="button" class="btn btn-d btn-icon btn-sm" title="Elimina scheda" onclick="_stDelete('+i+')">🗑</button>'
    +'</span></div>'
    +'<div class="st-card-body">'
    +'<label class="st-ta-l">Descrizione / intro<textarea class="in st-ta st-intro" oninput="_stSync()" placeholder="Breve descrizione della scheda…">'+esc(c.intro)+'</textarea></label>'
    +(fieldsHtml?'<div class="st-sub">Campi</div><div class="st-cms-fields">'+fieldsHtml+'</div>':'')
    +legacyHtml
    +(sectionsHtml?'<div class="st-sub">Sezioni</div><div class="st-cms-sections">'+sectionsHtml+'</div>':'')
    +blocks
    +'</div></div>';
}

/* ── RENDERING dell'editor ── */
function _stRead(){
  if(_stKind==='schede')return _stReadSchede();
  if(_stKind==='page')return _stReadPage();
  var heading='Divinità';
  var hd=document.getElementById('st-heading');
  if(hd&&hd.value.trim())heading=hd.value.trim();
  var intro=document.getElementById('st-intro')?document.getElementById('st-intro').value:'';
  var cards=[];
  document.querySelectorAll('#st-list .st-card').forEach(function(c,idx){
    var iv=c.querySelector('.st-imgval');
    var img=iv?iv.value:'';
    /* Il template "divinità" è l'unico con st-imgval: preserva la natura
       del blocco anche quando l'immagine non è ancora stata scelta. */
    var isDeity=!!iv;
    var nv=c.querySelector('.st-name');
    var name=nv?nv.value.trim():'';
    if(!name)name=img?'Divinità '+(idx+1):'Sezione '+(idx+1);
    var pos=null;
    var pv=c.querySelector('.st-posval');
    if(pv&&pv.value){var pp=pv.value.split(',');pos=[+pp[0],+pp[1]];}
    var ident=[];
    c.querySelectorAll('.st-kv').forEach(function(kv){
      var ke=kv.querySelector('.k');
      var ve=kv.querySelector('.v');
      var k=ke?ke.value.trim():'';
      if(k)ident.push([k,ve?ve.value.trim():'']);
    });
    cards.push({type:isDeity?'deity':'section',deity:isDeity||undefined,name:name,img:img,pos:pos,
      quote:(function(q){return q?q.value.trim():''})(c.querySelector('.st-quote')),
      ident:ident,
      personality:(function(t){return t?t.value:''})(c.querySelector('.st-personality')),
      cult:(function(t){return t?t.value:''})(c.querySelector('.st-cult')),
      extra:(function(t){return t?t.value:''})(c.querySelector('.st-extra'))});
  });
  return {heading:heading,intro:intro,cards:cards};
}
function _stReadSchede(){
  var cards=[];
  document.querySelectorAll('#st-list .st-card').forEach(function(c,idx){
    var nv=c.querySelector('.st-name');
    var name=nv?nv.value.trim():'';
    if(!name)name='Scheda '+(idx+1);
    var fields={};
    c.querySelectorAll('[data-field-key]').forEach(function(el){
      fields[el.getAttribute('data-field-key')]=el.value;
    });
    /* Legacy fallback: read generic key-value pairs */
    var legacyFields=[];
    c.querySelectorAll('.st-kv').forEach(function(kv){
      var ke=kv.querySelector('.k');
      var ve=kv.querySelector('.v');
      var k=ke?ke.value.trim():'';
      if(k)legacyFields.push([k,ve?ve.value.trim():'']);
    });
    var blocks=[];
    c.querySelectorAll('.st-block').forEach(function(b){
      var bn=b.querySelector('.st-bname').value.trim();
      var bm=b.querySelector('.st-bmd').value;
      if(bn||bm)blocks.push({name:bn||'Sezione',md:bm});
    });
    var introEl=c.querySelector('.st-intro');
    cards.push({name:name,intro:introEl?introEl.value:'',fields:fields,legacyFields:legacyFields,blocks:blocks});
  });
  var pageIntro=document.getElementById('st-schede-intro');
  return {heading:'',intro:pageIntro?(pageIntro.value||''):'',cards:cards};
}
function _stReadPage(){
  var fields={};
  document.querySelectorAll('#st-page-fields [data-field-key]').forEach(function(el){
    fields[el.getAttribute('data-field-key')]=el.value;
  });
  return {fields:fields};
}
function _stRender(data){
  if(_stKind==='page')return;
  var collapsed=[];
  document.querySelectorAll('#st-list .st-card.closed').forEach(function(c){
    collapsed.push(+(c.getAttribute('data-i')||0));
  });
  var grid=document.getElementById('st-grid');
  if(!grid)return;
  grid.innerHTML=(data.cards||[]).map(function(c,i){return _stCardHTML(c,i)}).join('');
  if(collapsed.length){
    var cards=grid.querySelectorAll('.st-card');
    for(var j=0;j<cards.length;j++){
      if(collapsed.indexOf(j)!==-1)cards[j].classList.add('closed');
    }
  }
  _stApplyFilter();
}
function _stCommit(data){
  var md=_stBuildMd(data);
  var e=document.getElementById('e-md');
  if(e){e.value=md;_lastSavedContent=md;}
  _modified=true;setBadge('dirty','modificato');
  try{_autosaveStore(md)}catch(e2){}
  _stShowWarnings(data);
}
function _stCommitSilent(data){
  var md=_stBuildMd(data);
  var e=document.getElementById('e-md');
  if(e){e.value=md;_lastSavedContent=md;}
  try{_autosaveStore(md)}catch(e2){}
  _stShowWarnings(data);
}
function _stPreview(data){
  var pv=document.getElementById('e-preview');if(!pv)return;
  var hd=_currentHead();
  pv.innerHTML='<div class="e-pv"><div class="e-pv-head"><span class="epv-icon">'+esc(hd.icon)+'</span><div>'
    +'<div class="epv-title">'+esc(hd.title)+'</div><div class="epv-sub">'+esc(_current.k||'')+'</div></div></div>'
    +_stPreviewHTML(data)+'</div>';
}
function _stSync(){
  var data=_stRead();
  _stCommit(data);
  _stPreview(data);
}
function _stSyncWithUndo(){
  _stPushUndo();
  _stSync();
}
function _stSyncPreview(){_stPreview(_stRead())}

function initStructuredEditor(content){
  _stMode=true;window.__stMode=true;
  _stPreBlockContent=content||'';
  _stKind=_stEditorKind(_current.layout);
  var eb=document.getElementById('editor-body');
  if(eb)eb.classList.remove('no-preview');
  var data=_stParse(content||'');
  var ta=document.getElementById('e-md');
  if(ta)ta.style.display='none';
  var pane=document.getElementById('md-pane');
  if(pane){
    if(!document.getElementById('struct-head')){
      var dh=document.createElement('div');
      dh.className='struct-head';dh.id='struct-head';
      pane.insertBefore(dh,ta?ta.nextSibling:null);
    }
    if(!document.getElementById('st-list')){
      var dl=document.createElement('div');
      dl.className='struct-list';dl.id='st-list';
      pane.insertBefore(dl,document.getElementById('struct-head').nextSibling);
    }
    if(!document.getElementById('st-grid')){
      var dg=document.createElement('div');
      dg.className='st-grid';dg.id='st-grid';
      document.getElementById('st-list').appendChild(dg);
    }
  }
  var sh=document.getElementById('struct-head');if(sh)sh.style.display='';
  var sl=document.getElementById('st-list');if(sl)sl.style.display='';
  var head=document.getElementById('struct-head');
  if(head){
    if(_stKind==='page'){
      head.innerHTML=_stPageFormHTML(data);
    }else if(_stKind==='schede'){
      head.innerHTML=_stSchedeIntroHTML(data);
    }else{
      head.innerHTML='<div class="st-intro-box">'
        +'<label class="st-ta-l">Titolo introduzione<input class="in" id="st-heading" value="'+escAttr(data.heading)+'" style="max-width:220px" oninput="_stSync()"></label>'
        +'<label class="st-ta-l">Testo introduttivo (prima della griglia)<textarea class="in st-ta" id="st-intro" oninput="_stSync()" placeholder="Introduzione al pantheon…">'+esc(data.intro)+'</textarea></label>'
        +'</div>';
    }
  }
  if(_stKind==='page'){
    if(sl)sl.style.display='none';
  }else{
    _stRender(data);
    if(data.cards&&data.cards.length>5){
      _stCollapseAll(true);
      var first=document.querySelector('#st-list .st-card');
      if(first)first.classList.remove('closed');
    }
  }
  _stHistory=[];
  _stHistoryIdx=-1;
  _stPushUndo();
  document.addEventListener('keydown',_stKeyHandler);
  var ph=document.querySelector('#md-pane .pane-head');
  var kindLabel=_stKind==='page'?'form CMS':(_stKind==='schede'?'schede a card':'griglia divinità');
  if(ph)ph.innerHTML='Editor <span class="ph-info" id="e-stats"></span>'
    +(_stKind!=='page'?'<input id="st-filter" class="in" placeholder="Filtra schede…" oninput="stFilter(this.value)" style="max-width:150px;margin-right:8px">'
      +'<button type="button" class="btn btn-soft btn-sm" title="Comprimi tutte le card" onclick="_stCollapseAll(true)">⤴ Comprimi</button>'
      +'<button type="button" class="btn btn-soft btn-sm" title="Espandi tutte le card" onclick="_stCollapseAll(false)">⤵ Espandi</button>':'');
  var wb=document.getElementById('md-pane');
  var wtb=document.getElementById('e-toolbar');
  if(wb&&wtb&&wtb.parentNode===wb&&!document.getElementById('st-warn')){
    var wd=document.createElement('div');
    wd.id='st-warn';
    wd.style.cssText='display:none;margin:6px 14px 0;padding:6px 10px;border-radius:var(--rad);background:rgba(255,193,7,.12);border:1px solid rgba(255,193,7,.35);color:var(--warn,#d9a514);font-size:12px;line-height:1.6';
    wb.insertBefore(wd,wtb.nextSibling);
  }
  var tb=document.getElementById('e-toolbar');
  if(tb&&tb.parentNode){
    tb.outerHTML='<div class="ed-toolbar" id="e-toolbar">'
      +'<div class="fmt-group">'
      +'<button class="tb-fmt" onclick="_stInsertFormat(\'**\',\'testo\')" title="Grassetto (Ctrl+B)"><b>B</b></button>'
      +'<button class="tb-fmt" onclick="_stInsertFormat(\'*_\',\'testo\')" title="Corsivo (Ctrl+I)"><i>I</i></button>'
      +'<button class="tb-fmt" onclick="_stInsertFormat(\'~~\',\'testo\')" title="Barrato"><s>S</s></button>'
      +'<button class="tb-fmt" onclick="_stInsertHeading(2)" title="Titolo H2">H2</button>'
      +'<button class="tb-fmt" onclick="_stInsertHeading(3)" title="Titolo H3">H3</button>'
      +'<button class="tb-fmt" onclick="_stInsertList()" title="Lista">☰</button>'
      +'<button class="tb-fmt" onclick="_stInsertQuote()" title="Citazione">❝</button>'
      +'<button class="tb-fmt" onclick="_stInsertLink()" title="Link">🔗</button>'
      +'</div>'
      +'<span class="tb-sep2"></span>'
      +'<button class="btn btn-soft btn-sm" onclick="_stToggle()" title="Passa al markdown grezzo">✍ Markdown</button>'
      +(_stKind==='schede'
        ?'<button class="btn btn-p btn-sm" onclick="_stAdd(\'card\')">➕ '+_stEntLabel()+'</button>'
        :(_stKind==='page'?'':'<button class="btn btn-p btn-sm" onclick="_stAdd(\'deity\')">➕ Divinità</button>'
         +'<button class="btn btn-soft btn-sm" onclick="_stAdd(\'section\')">➕ Sezione</button>'))
      +'<span class="tb-spacer"></span>'
      +'<div class="undo-redo-group">'
      +'<button class="btn btn-soft btn-icon btn-sm" id="st-undo-btn" onclick="_stUndo()" title="Annulla (Ctrl+Z)" disabled>↶</button>'
      +'<span class="undo-count" id="st-undo-count"></span>'
      +'<button class="btn btn-soft btn-icon btn-sm" id="st-redo-btn" onclick="_stRedo()" title="Ripristina (Ctrl+Y)" disabled>↷</button>'
      +'</div>'
      +'<span class="tb-sep2"></span>'
      +'<span class="view-switch">'
      +'<button class="tb-btn2" data-view="md" title="Solo editor">SCRIVI</button>'
      +'<button class="tb-btn2" data-view="pv" title="Solo anteprima">VEDI</button>'
      +'<button class="tb-btn2" data-view="site" title="Come appare sul sito">SITO</button>'
      +'</span></div>';
  }
  var sb=document.getElementById('e-sb');
  if(sb)sb.textContent=_layoutLabel(_current.layout)+' · editor CMS · '+kindLabel;
  _stSync();
}
/* Header schede: il campo "testo introduttivo" è mostrato solo per i layout
   che sul sito renderizzano markdown pieno (non-schede nativi), dove il testo
   prima di ## viene effettivamente renderizzato. */
function _stSchedeIntroHTML(data){
  var reg=LAYOUT_REGISTRY[_current.layout];
  var native=_ST_SCHE_LAYOUTS.indexOf(_current.layout)!==-1;
  if(native){
    return '<div class="st-intro-box"><p class="st-hint" style="margin:0">Editor CMS schede: ogni scheda ha campi strutturati + sezioni testo. Formato compatibile con il sito.</p></div>';
  }
  return '<div class="st-intro-box">'
    +'<label class="st-ta-l">Testo introduttivo (prima delle schede)<textarea class="in st-ta" id="st-schede-intro" oninput="_stSync()" placeholder="Testo prima della prima scheda…">'+esc(data.intro)+'</textarea></label>'
    +'<p class="st-hint" style="margin:0">Il testo sopra compare prima delle schede. Ogni scheda ha campi strutturati + sezioni testo lungo.</p></div>';
}

/* ── FORM HTML per pagina singola (contenuto/materiale) ── */
function _stPageFormHTML(data){
  var reg=LAYOUT_REGISTRY[_current.layout];
  var fieldDefs=(reg&&reg.fields)||[];
  var h='<div class="st-page-form" id="st-page-fields">';
  h+='<p class="st-hint" style="margin:0 0 12px">Modifica i campi strutturati. Il contenuto viene salvato come Markdown compatibile con il sito.</p>';
  fieldDefs.forEach(function(f){
    var val=(data.fields&&data.fields[f.key])||'';
    if(f.type==='wysiwyg'){
      h+='<label class="st-ta-l">'+esc(f.label)
        +'<textarea class="in st-ta cms-wysiwyg" data-field-key="'+escAttr(f.key)+'" oninput="_stSync()" placeholder="'+escAttr(f.placeholder||'Scrivi '+f.label.toLowerCase()+'…')+'">'+esc(val)+'</textarea>'
        +'<div class="cms-wysiwyg-tb">'
        +'<button type="button" class="tb-fmt" onclick="_stWysiwygCmd(this,\'**\',\'testo\')" title="Grassetto"><b>B</b></button>'
        +'<button type="button" class="tb-fmt" onclick="_stWysiwygCmd(this,\'*_\',\'testo\')" title="Corsivo"><i>I</i></button>'
        +'<button type="button" class="tb-fmt" onclick="_stWysiwygCmd(this,\'~~\',\'testo\')" title="Barrato"><s>S</s></button>'
        +'<button type="button" class="tb-fmt" onclick="_stWysiwygCmd(this,\'## \',\'\' )" title="Titolo">H2</button>'
        +'<button type="button" class="tb-fmt" onclick="_stWysiwygCmd(this,\'### \',\'\' )" title="Sottotitolo">H3</button>'
        +'<button type="button" class="tb-fmt" onclick="_stWysiwygCmd(this,\'- \',\'\' )" title="Lista">☰</button>'
        +'<button type="button" class="tb-fmt" onclick="_stWysiwygCmd(this,\'> \',\'\' )" title="Citazione">❝</button>'
        +'<button type="button" class="tb-fmt" onclick="_stWysiwygCmdLink(this)" title="Link">🔗</button>'
        +'</div>'
        +'</label>';
    }else if(f.type==='select'){
      var opts=(f.options||[]).map(function(o){
        return '<option value="'+escAttr(o)+'"'+(val===o?' selected':'')+'>'+esc(o)+'</option>';
      }).join('');
      h+='<label class="st-ta-l">'+esc(f.label)
        +'<select class="in cms-select" data-field-key="'+escAttr(f.key)+'" onchange="_stSync()">'
        +'<option value="">— seleziona —</option>'+opts+'</select></label>';
    }else if(f.type==='number'){
      h+='<label class="st-ta-l">'+esc(f.label)
        +'<input class="in cms-input" type="number" data-field-key="'+escAttr(f.key)+'" value="'+escAttr(val)+'" oninput="_stSync()" placeholder="'+escAttr(f.placeholder||'0')+'"></label>';
    }else if(f.type==='image'){
      h+='<label class="st-ta-l">'+esc(f.label)
        +'<div style="display:flex;gap:6px"><input class="in cms-input" data-field-key="'+escAttr(f.key)+'" value="'+escAttr(val)+'" oninput="_stSync()" placeholder="/images/…">'
        +'<button type="button" class="btn btn-soft btn-sm" onclick="_stPagePickImage(\''+escAttr(f.key)+'\')">🖼</button></div></label>';
    }else{
      h+='<label class="st-ta-l">'+esc(f.label)
        +'<input class="in cms-input" data-field-key="'+escAttr(f.key)+'" value="'+escAttr(val)+'" oninput="_stSync()" placeholder="'+escAttr(f.placeholder||'')+'"></label>';
    }
  });
  h+='</div>';
  return h;
}

/* WYSIWYG command helper for page form */
function _stWysiwygCmd(btn,wrap,placeholder){
  var ta=btn.closest('.st-ta-l').querySelector('textarea');
  if(!ta)return;
  var start=ta.selectionStart,end=ta.selectionEnd,sel=ta.value.substring(start,end);
  var insert=sel?(wrap+sel+wrap):wrap+placeholder+wrap;
  ta.value=ta.value.substring(0,start)+insert+ta.value.substring(end);
  ta.setSelectionRange(start+wrap.length,sel?start+wrap.length+sel.length:start+wrap.length+placeholder.length);
  ta.focus();_stSync();
}
function _stWysiwygCmdLink(btn){
  var ta=btn.closest('.st-ta-l').querySelector('textarea');
  if(!ta)return;
  var start=ta.selectionStart,end=ta.selectionEnd,sel=ta.value.substring(start,end);
  var url=prompt('URL del link:','https://');
  if(!url)return;
  var insert='['+(sel||'testo')+']('+url+')';
  ta.value=ta.value.substring(0,start)+insert+ta.value.substring(end);
  ta.setSelectionRange(start+insert.length,start+insert.length);
  ta.focus();_stSync();
}
function _stPagePickImage(fieldKey){
  /* Reuse the same image picker as pantheon */
  var input=document.querySelector('[data-field-key="'+fieldKey+'"]');
  if(!input)return;
  if(document.getElementById('st-pick-modal'))return;
  modalHtml('st-pick-modal','🖼 Scegli immagine',
    '<div class="fld"><label>URL diretto</label><div style="display:flex;gap:6px"><input id="st-pick-url" class="in" placeholder="/images/… oppure https://…" onkeydown="if(event.key===\'Enter\')stPagePickUrl(\''+escJsAttr(fieldKey)+'\')">'
    +'<button class="btn btn-p btn-sm" onclick="stPagePickUrl(\''+escJsAttr(fieldKey)+'\')">Usa</button></div></div>'
    +'<div class="or">oppure scegli dall\'archivio</div>'
    +'<div class="pick-grid" id="st-pick-grid"><div class="list-empty">Caricamento…</div></div>',
    '<button class="btn btn-soft" onclick="closeModal(\'st-pick-modal\')">Annulla</button>');
  ghGet('images').then(function(list){
    var items=Array.isArray(list)?list:[];
    var grid=document.getElementById('st-pick-grid');
    if(!grid)return;
    if(!items.length){grid.innerHTML='<div class="list-empty">Nessuna immagine in /images/</div>';return}
    grid.innerHTML=items.map(function(it){
      return '<div class="pick-item" onclick="stPagePickChoose(\''+escJsAttr(fieldKey)+'\',\''+escJsAttr(it.name)+'\')">'
        +'<img class="pick-thumb" src="'+escAttr(it.download_url||'')+'" alt="'+escAttr(it.name)+'" loading="lazy">'
        +'<div class="pick-name">'+esc(it.name)+'</div></div>';
    }).join('');
  }).catch(function(e){
    var grid=document.getElementById('st-pick-grid');
    if(grid)grid.innerHTML='<div class="list-empty">Errore: '+esc(e.message)+'</div>';
  });
}
function stPagePickChoose(fieldKey,name){
  var input=document.querySelector('[data-field-key="'+fieldKey+'"]');
  if(input){input.value='/images/'+name;_stSync();}
  closeModal('st-pick-modal');
}
function stPagePickUrl(fieldKey){
  var url=(document.getElementById('st-pick-url').value||'').trim();
  if(!url){toast('Inserisci un URL','error');return}
  var input=document.querySelector('[data-field-key="'+fieldKey+'"]');
  if(input){input.value=url;_stSync();}
  closeModal('st-pick-modal');
}

function _stToggle(){
  var ta=document.getElementById('e-md');if(!ta)return;
  if(_stMode){_stExit();}
  else{initStructuredEditor(ta.value);}
  setViewMode(_viewMode);
}
function _stKeyHandler(e){
  if(!_stMode)return;
  var isMac=navigator.platform.toUpperCase().indexOf('MAC')>=0;
  var mod=isMac?e.metaKey:e.ctrlKey;
  if(mod&&e.key==='z'&&!e.shiftKey){e.preventDefault();_stUndo();}
  else if(mod&&(e.key==='y'||(e.key==='z'&&e.shiftKey))){e.preventDefault();_stRedo();}
  else if(mod&&e.key==='b'){e.preventDefault();_stInsertFormat('**','testo');}
  else if(mod&&e.key==='i'){e.preventDefault();_stInsertFormat('*_','testo');}
  else if(mod&&e.key==='Enter'){e.preventDefault();_stKeyAdd();}
  else if(mod&&e.key==='d'){e.preventDefault();_stKeyDuplicate();}
}
function _stFocusedIdx(){
  var el=document.activeElement;
  if(!el)return -1;
  var card=el.closest?el.closest('.st-card'):null;
  return card?+(card.getAttribute('data-i')||0):-1;
}
function _stKeyAdd(){
  if(_stKind==='page')return;
  _stPushUndo();
  var idx=_stFocusedIdx();
  var data=_stRead();
  if(_stKind==='schede'){
    var reg=LAYOUT_REGISTRY[_current.layout];
    var fields=(reg&&reg.fields)||[];
    var newFields={};
    fields.forEach(function(f){newFields[f.key]='';});
    data.cards.splice(idx>=0?idx+1:data.cards.length,0,{name:'Nuova '+_stEntLabel(),intro:'',fields:newFields,blocks:[]});
  }else{
    var type='deity';
    if(idx>=0&&data.cards[idx]&&!data.cards[idx].deity)type='section';
    data.cards.splice(idx>=0?idx+1:data.cards.length,0,{type:type,deity:type==='deity'||undefined,name:type==='section'?'Nuova sezione':_stEntName(),
      img:type==='deity'?'':'',quote:'',
      ident:[['Nome',''],['Epiteto',''],['Allineamento',''],['Sfere',''],['Simbolo','']],
      personality:'',cult:'',extra:''});
  }
  _stRender(data);_stSync();
  var cards=document.querySelectorAll('#st-list .st-card');
  var last=cards[idx>=0?idx+1:cards.length-1];
  if(last){var nm=last.querySelector('.st-name');if(nm){nm.focus();nm.select();}}
}
function _stKeyDuplicate(){
  var idx=_stFocusedIdx();
  if(idx<0)idx=_stRead().cards.length-1;
  if(idx<0)return;
  _stDuplicate(idx);
}
function _stExit(){
  _stMode=false;window.__stMode=false;
  document.removeEventListener('keydown',_stKeyHandler);
  var eb=document.getElementById('editor-body');
  if(eb)eb.classList.remove('no-preview');
  var ta=document.getElementById('e-md');if(ta)ta.style.display='';
  if(ta&&_stPreBlockContent&&_stPreBlockContent!==ta.value){
    _undo.push(_stPreBlockContent);if(_undo.length>60)_undo.shift();_redo=[];
    _undoBase=_stPreBlockContent;
  }
  _stPreBlockContent='';
  var sh=document.getElementById('struct-head');if(sh)sh.style.display='none';
  var sl=document.getElementById('st-list');if(sl)sl.style.display='none';
  var ph=document.querySelector('#md-pane .pane-head');
  if(ph)ph.innerHTML='Markdown <span class="ph-info" id="e-stats"></span>';
  var wd=document.getElementById('st-warn');
  if(wd)wd.remove();
  _stFilterQ='';
  var tb=document.getElementById('e-toolbar');
  if(tb&&tb.parentNode)tb.outerHTML=buildToolbar();
  renderPreview();updateStats();
}

/* ── VALIDAZIONE E AVVISI ── */
function _stValidate(data){
  var warn=[];
  if(_stKind==='page')return warn;
  var seen={};
  (data.cards||[]).forEach(function(c){
    var n=(c.name||'').trim();
    if(n)seen[n]=(seen[n]||0)+1;
  });
  var reg=LAYOUT_REGISTRY[_current.layout];
  var reqFields=(reg&&reg.requiredFields)||[];
  (data.cards||[]).forEach(function(c,i){
    var n=(c.name||'').trim()||'blocco '+(i+1);
    if(!(c.name||'').trim())warn.push('Il blocco '+(i+1)+' non ha un nome');
    else if(seen[(c.name||'').trim()]>1)warn.push('«'+c.name.trim()+'» è ripetuto '+seen[(c.name||'').trim()]+' volte');
    if(_stKind!=='schede'&&c.type==='deity'&&!c.img)warn.push('«'+(c.name||'').trim()+'» è una divinità ma non ha immagine');
    if(_stKind==='schede'&&!_stCardHasContent(c))warn.push('La scheda «'+n+'» è vuota');
    if(_stKind==='schede'&&c.fields&&reqFields.length){
      reqFields.forEach(function(rf){
        var found=false;
        if(typeof c.fields==='object'&&!Array.isArray(c.fields)){
          /* New format: find field by key matching label */
          var fieldDefs=(reg&&reg.fields)||[];
          fieldDefs.forEach(function(f){
            if(f.label.toLowerCase()===rf.toLowerCase()&&(c.fields[f.key]||'').trim())found=true;
          });
        }else if(c.fields&&c.fields.length){
          /* Legacy format */
          found=c.fields.some(function(f){return(f[0]||'').toLowerCase()===rf.toLowerCase()&&(f[1]||'').trim()});
        }
        if(!found)warn.push('«'+n+'» manca il campo obbligatorio «'+rf+'»');
      });
    }
  });
  return warn;
}
function _stShowWarnings(data){
  var w=document.getElementById('st-warn');
  var st=document.getElementById('e-stats');
  var warn=_stValidate(data);
  var countLabel=_stKind==='page'?'form':data.cards.length+' schede';
  if(st)st.textContent=countLabel+(warn.length?' · '+warn.length+' avvisi':'');
  if(w){
    if(!warn.length){w.style.display='none';return}
    w.style.display='block';
    w.innerHTML='⚠ '+(warn.length===1?'1 avviso':warn.length+' avvisi')+': '+warn.map(function(x){return esc(x)}).join(' · ');
  }
}
function _stCardHasContent(c){
  if(!c)return false;
  if((c.name||'').trim()||(c.intro||'').trim()||(c.extra||'').trim()||(c.quote||'').trim()||(c.personality||'').trim()||(c.cult||'').trim())return true;
  if(c.img)return true;
  if(c.ident&&c.ident.some(function(p){return p[0]||p[1]}))return true;
  if(c.fields){
    if(Array.isArray(c.fields)){
      if(c.fields.some(function(p){return p[0]||p[1]}))return true;
    }else if(typeof c.fields==='object'){
      if(Object.keys(c.fields).some(function(k){return c.fields[k]}))return true;
    }
  }
  if(c.legacyFields&&c.legacyFields.some(function(p){return p[0]||p[1]}))return true;
  if(c.blocks&&c.blocks.some(function(b){return (b.name||'').trim()||(b.md||'').trim()}))return true;
  return false;
}

/* ── FILTRO BLOCCHI ── */
var _stFilterQ='';
function stFilter(q){
  _stFilterQ=(q||'').toLowerCase();
  _stApplyFilter();
}
function _stCardText(card){
  var t=card.textContent||'';
  card.querySelectorAll('input,textarea').forEach(function(el){t+=' '+el.value});
  return t;
}
function _stApplyFilter(){
  document.querySelectorAll('#st-list .st-card').forEach(function(c){
    if(!_stFilterQ){c.style.display='';return}
    c.style.display=_stCardText(c).toLowerCase().indexOf(_stFilterQ)===-1?'none':'';
  });
}

/* ── MANIPOLAZIONE BLOCCHI ── */
function _stMove(i,dir){
  _stPushUndo();
  var data=_stRead();
  var j=i+dir;
  if(j<0||j>=data.cards.length)return;
  var t=data.cards[i];data.cards[i]=data.cards[j];data.cards[j]=t;
  _stRender(data);_stSync();
}
function _stDelete(i){
  var data=_stRead();
  var c=data.cards[i];
  if(c&&_stCardHasContent(c)&&!confirm('Eliminare il blocco «'+((c.name||'').trim()||('blocco '+(i+1)))+'»?'))return;
  _stPushUndo();
  data.cards.splice(i,1);
  _stRender(data);_stSync();
}
function _stCollapse(i){
  var c=document.querySelector('#st-list .st-card[data-i="'+i+'"]');
  if(c)c.classList.toggle('closed');
}
function _stCollapseAll(closed){
  document.querySelectorAll('#st-list .st-card').forEach(function(c){
    c.classList.toggle('closed',!!closed);
  });
}
function _stAdd(type){
  if(_stKind==='page')return;
  _stPushUndo();
  var data=_stRead();
  if(_stKind==='schede'){
    var reg=LAYOUT_REGISTRY[_current.layout];
    var fields=(reg&&reg.fields)||[];
    var newFields={};
    fields.forEach(function(f){newFields[f.key]='';});
    data.cards.push({name:'Nuova '+_stEntLabel(),intro:'',fields:newFields,blocks:[]});
  }else{
    data.cards.push({type:type,deity:type==='deity'||undefined,name:type==='section'?'Nuova sezione':_stEntName(),
      img:type==='deity'?'':'',quote:'',
      ident:[['Nome',''],['Epiteto',''],['Allineamento',''],['Sfere',''],['Simbolo','']],
      personality:'',cult:'',extra:''});
  }
  _stRender(data);_stSync();
  var cards=document.querySelectorAll('#st-list .st-card');
  var last=cards[cards.length-1];
  if(last){var nm=last.querySelector('.st-name');if(nm){nm.focus();nm.select();}}
}
function _stAddIdent(i){
  _stPushUndo();
  var box=document.getElementById('st-ident-'+i);if(!box)return;
  var div=document.createElement('div');div.className='st-kv';
  div.innerHTML='<input class="in k" placeholder="Campo" oninput="_stSync()">'
    +'<input class="in v" placeholder="Valore" oninput="_stSync()">'
    +'<button type="button" class="btn btn-d btn-icon btn-sm" title="Rimuovi campo" onclick="_stDelRow(this)">✕</button>';
  box.appendChild(div);_stSync();
  var k=div.querySelector('.k');if(k)k.focus();
}
function _stDelRow(btn){
  _stPushUndo();
  var kv=btn.closest('.st-kv');if(kv)kv.remove();
  _stSync();
}
function _stAddBlock(i){
  _stPushUndo();
  var box=document.getElementById('st-blocks-'+i);if(!box)return;
  var div=document.createElement('div');div.className='st-block';
  div.innerHTML='<div class="st-block-head"><input class="in st-bname" placeholder="Titolo sezione" oninput="_stSync()">'
    +'<button type="button" class="btn btn-d btn-icon btn-sm" title="Rimuovi sezione" onclick="_stDelBlock(this)">✕</button></div>'
    +'<textarea class="in st-ta st-bmd" oninput="_stSync()" placeholder="Contenuto (markdown)"></textarea>';
  box.appendChild(div);_stSync();
  var bn=div.querySelector('.st-bname');if(bn)bn.focus();
}
function _stDelBlock(btn){
  _stPushUndo();
  var b=btn.closest('.st-block');if(b)b.remove();
  _stSync();
}

/* ── CONVERTI SEZIONE ↔ DIVINITÀ ── */
function _stConvertToSection(i){
  _stPushUndo();
  var data=_stRead();
  var c=data.cards[i];
  if(!c)return;
  c.img='';c.pos=null;c.type='section';delete c.deity;
  _stRender(data);_stSync();
  toast('Convertito in sezione','success');
}

/* ── DUPLICA BLOCCO ── */
function _stDuplicate(i){
  _stPushUndo();
  var data=_stRead();
  var card=data.cards[i];
  if(!card)return;
  var clone=JSON.parse(JSON.stringify(card));
  clone.name=(clone.name||'')+' (copia)';
  data.cards.splice(i+1,0,clone);
  _stRender(data);
  _stSync();
  toast('Blocco duplicato','success');
}

/* ── DRAG & DROP ── */
var _stDragIdx=-1;
var _stDragOverIdx=-1;
function _stDragStart(e,i){
  _stDragIdx=i;
  _stDragOverIdx=-1;
  e.dataTransfer.effectAllowed='move';
  e.dataTransfer.setData('text/plain',String(i));
  var card=e.target.closest('.st-card');
  if(card){
    card.classList.add('dragging');
    setTimeout(function(){card.style.opacity='0.45'},0);
  }
}
function _stDragEnd(e){
  document.querySelectorAll('.st-card').forEach(function(c){
    c.classList.remove('dragging','drag-over-top','drag-over-bottom');
    c.style.opacity='';
  });
  _stDragIdx=-1;
  _stDragOverIdx=-1;
}
/* Touch-based drag reordering for cards */
var _stTouchDrag={active:false,startY:0,idx:-1,ghost:null};
function _stTouchDragStart(e,i){
  if(e.touches.length!==1)return;
  var handle=e.target.closest('.st-drag-handle');
  if(!handle)return;
  e.preventDefault();
  var t=e.touches[0];
  _stTouchDrag={active:true,startY:t.clientY,idx:i,ghost:null};
  var card=handle.closest('.st-card');
  if(card){
    card.classList.add('dragging');
    var ghost=card.cloneNode(true);
    ghost.className='st-ghost';
    ghost.style.cssText='position:fixed;pointer-events:none;z-index:9999;opacity:.85;width:'+card.offsetWidth+'px;max-height:120px;overflow:hidden;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.3);transform:rotate(2deg);transition:none;';
    ghost.style.left=(t.clientX-card.offsetWidth/2)+'px';
    ghost.style.top=(t.clientY-30)+'px';
    document.body.appendChild(ghost);
    _stTouchDrag.ghost=ghost;
  }
}
function _stTouchDragMove(e){
  if(!_stTouchDrag.active)return;
  var t=e.touches[0];
  if(_stTouchDrag.ghost){
    _stTouchDrag.ghost.style.left=(t.clientX-_stTouchDrag.ghost.offsetWidth/2)+'px';
    _stTouchDrag.ghost.style.top=(t.clientY-30)+'px';
  }
  e.preventDefault();
  var cards=document.querySelectorAll('#st-list .st-card');
  cards.forEach(function(c){
    c.classList.remove('drag-over-top','drag-over-bottom');
    var r=c.getBoundingClientRect();
    var ci=parseInt(c.dataset.i,10);
    if(ci===_stTouchDrag.idx)return;
    if(t.clientY>=r.top&&t.clientY<=r.bottom){
      var mid=r.top+r.height/2;
      if(t.clientY<mid)c.classList.add('drag-over-top');
      else c.classList.add('drag-over-bottom');
    }
  });
}
function _stTouchDragEnd(e){
  if(!_stTouchDrag.active)return;
  var fromIdx=_stTouchDrag.idx;
  if(_stTouchDrag.ghost){_stTouchDrag.ghost.remove();_stTouchDrag.ghost=null}
  document.querySelectorAll('.st-card').forEach(function(c){
    c.classList.remove('dragging','drag-over-top','drag-over-bottom');
  });
  var toIdx=-1;
  var cards=document.querySelectorAll('#st-list .st-card');
  cards.forEach(function(c){
    if(c.classList.contains('drag-over-top')||c.classList.contains('drag-over-bottom')){
      toIdx=parseInt(c.dataset.i,10);
    }
  });
  _stTouchDrag={active:false,startY:0,idx:-1,ghost:null};
  if(fromIdx<0||toIdx<0||fromIdx===toIdx)return;
  _stPushUndo();
  var data=_stRead();
  var card=data.cards.splice(fromIdx,1)[0];
  var insertAt=toIdx;
  if(fromIdx<toIdx)insertAt--;
  data.cards.splice(insertAt,0,card);
  _stRender(data);
  _stSync();
}
document.addEventListener('touchmove',_stTouchDragMove,{passive:false});
document.addEventListener('touchend',_stTouchDragEnd);
function _stDragOver(e,i){
  e.preventDefault();
  e.dataTransfer.dropEffect='move';
  if(i===_stDragIdx||i===_stDragOverIdx)return;
  _stDragOverIdx=i;
  document.querySelectorAll('.st-card').forEach(function(c){
    c.classList.remove('drag-over-top','drag-over-bottom');
  });
  var card=document.querySelector('#st-list .st-card[data-i="'+i+'"]');
  if(!card)return;
  var rect=card.getBoundingClientRect();
  var mid=rect.top+rect.height/2;
  if(e.clientY<mid){
    card.classList.add('drag-over-top');
    card.classList.remove('drag-over-bottom');
  }else{
    card.classList.add('drag-over-bottom');
    card.classList.remove('drag-over-top');
  }
}
function _stDragLeave(e,i){
  var card=document.querySelector('#st-list .st-card[data-i="'+i+'"]');
  if(card)card.classList.remove('drag-over-top','drag-over-bottom');
}
function _stDrop(e,i){
  e.preventDefault();
  var fromIdx=_stDragIdx;
  if(fromIdx<0||fromIdx===i)return;
  _stPushUndo();
  var data=_stRead();
  var card=data.cards.splice(fromIdx,1)[0];
  var insertAt=i;
  if(fromIdx<i)insertAt--;
  data.cards.splice(insertAt,0,card);
  _stRender(data);
  _stSync();
  _stDragIdx=-1;
  _stDragOverIdx=-1;
}

/* ── FORMATTAZIONE TESTO NELLA TEXTAREA FOCALIZZATA ── */
function _stInsertFormat(wrapper,placeholder){
  var ta=document.activeElement;
  if(!ta||ta.tagName!=='TEXTAREA')return;
  var start=ta.selectionStart;
  var end=ta.selectionEnd;
  var sel=ta.value.substring(start,end);
  var before=ta.value.substring(0,start);
  var after=ta.value.substring(end);
  var insert=sel?(wrapper+sel+wrapper):wrapper+placeholder+wrapper;
  ta.value=before+insert+after;
  var newStart=start+wrapper.length;
  var newEnd=sel?newStart+sel.length:newStart+placeholder.length;
  ta.setSelectionRange(newStart,newEnd);
  ta.focus();
  _stSync();
}
function _stInsertText(text){
  var ta=document.activeElement;
  if(!ta||ta.tagName!=='TEXTAREA')return;
  var start=ta.selectionStart;
  var end=ta.selectionEnd;
  var before=ta.value.substring(0,start);
  var after=ta.value.substring(end);
  ta.value=before+text+after;
  ta.setSelectionRange(start+text.length,start+text.length);
  ta.focus();
  _stSync();
}
function _stInsertLink(){
  var ta=document.activeElement;
  if(!ta||ta.tagName!=='TEXTAREA')return;
  var start=ta.selectionStart;
  var end=ta.selectionEnd;
  var sel=ta.value.substring(start,end);
  var url=prompt('URL del link:','https://');
  if(!url)return;
  var before=ta.value.substring(0,start);
  var after=ta.value.substring(end);
  var insert='['+(sel||'testo')+']('+url+')';
  ta.value=before+insert+after;
  ta.setSelectionRange(start+insert.length,start+insert.length);
  ta.focus();
  _stSync();
}
function _stInsertHeading(level){
  var ta=document.activeElement;
  if(!ta||ta.tagName!=='TEXTAREA')return;
  var start=ta.selectionStart;
  var lineStart=ta.value.lastIndexOf('\n',start-1)+1;
  var prefix='';
  for(var i=0;i<level;i++)prefix+='#';
  var before=ta.value.substring(0,lineStart);
  var lineEnd=ta.value.indexOf('\n',start);
  if(lineEnd===-1)lineEnd=ta.value.length;
  var lineContent=ta.value.substring(lineStart,lineEnd).replace(/^#+\s*/,'');
  var after=ta.value.substring(lineEnd);
  var insert=prefix+' '+lineContent;
  ta.value=before+insert+after;
  ta.setSelectionRange(lineStart+insert.length,lineStart+insert.length);
  ta.focus();
  _stSync();
}
function _stInsertList(){
  var ta=document.activeElement;
  if(!ta||ta.tagName!=='TEXTAREA')return;
  var start=ta.selectionStart;
  var lineStart=ta.value.lastIndexOf('\n',start-1)+1;
  var before=ta.value.substring(0,lineStart);
  var lineEnd=ta.value.indexOf('\n',start);
  if(lineEnd===-1)lineEnd=ta.value.length;
  var lineContent=ta.value.substring(lineStart,lineEnd).replace(/^[-*]\s*/,'');
  var after=ta.value.substring(lineEnd);
  var insert='- '+lineContent;
  ta.value=before+insert+after;
  ta.setSelectionRange(lineStart+insert.length,lineStart+insert.length);
  ta.focus();
  _stSync();
}
function _stInsertQuote(){
  var ta=document.activeElement;
  if(!ta||ta.tagName!=='TEXTAREA')return;
  var start=ta.selectionStart;
  var lineStart=ta.value.lastIndexOf('\n',start-1)+1;
  var before=ta.value.substring(0,lineStart);
  var lineEnd=ta.value.indexOf('\n',start);
  if(lineEnd===-1)lineEnd=ta.value.length;
  var lineContent=ta.value.substring(lineStart,lineEnd).replace(/^>\s*/,'');
  var after=ta.value.substring(lineEnd);
  var insert='> '+lineContent;
  ta.value=before+insert+after;
  ta.setSelectionRange(lineStart+insert.length,lineStart+insert.length);
  ta.focus();
  _stSync();
}

/* ── IMAGE PICKER (da /images/ + URL) ── */
var _stPickTarget=-1;
function _stPick(i){
  if(document.getElementById('st-pick-modal'))return;
  _stPickTarget=i;
  modalHtml('st-pick-modal','🖼 Scegli immagine — blocco '+(i+1),
    '<div class="fld"><label>Cerca in /images/</label><input id="st-pick-q" class="in" placeholder="Filtra per nome…" oninput="stPickFilter(this.value)"></div>'
    +'<div class="fld"><label>URL diretto</label><div style="display:flex;gap:6px"><input id="st-pick-url" class="in" placeholder="/images/… oppure https://…" onkeydown="if(event.key===\'Enter\')stPickUrl('+i+')">'
    +'<button class="btn btn-p btn-sm" onclick="stPickUrl('+i+')">Usa</button></div></div>'
    +'<label class="st-pick-drop" id="st-pick-drop" for="st-pick-file"'
    +' ondragover="event.preventDefault()" ondragenter="event.preventDefault()" ondrop="stPickDrop(event)">'
    +'Trascina qui un\'immagine dal dispositivo oppure <span style="text-decoration:underline">sfoglia…</span>'
    +'<input id="st-pick-file" type="file" accept="image/*" aria-label="Carica immagine per il blocco" style="display:none" onchange="stPickUpload(this.files)"></label>'
    +'<div class="or">oppure scegli dall\'archivio</div>'
    +'<div class="pick-grid" id="st-pick-grid"><div class="list-empty">Caricamento…</div></div>',
    '<button class="btn btn-soft" onclick="closeModal(\'st-pick-modal\')">Annulla</button>');
  var q=document.getElementById('st-pick-q');if(q)q.focus();
  stLoadPicker(i);
}
function stLoadPicker(i){
  _stPickTarget=i;
  var grid=document.getElementById('st-pick-grid');if(!grid)return;
  ghGet('images').then(function(list){
    var items=Array.isArray(list)?list:[];
    if(!items.length){grid.innerHTML='<div class="list-empty">Nessuna immagine in /images/</div>';return}
    window.__pickItems=items;
    stPickFilter('');
  }).catch(function(e){grid.innerHTML='<div class="list-empty">Errore: '+esc(e.message)+'</div>'});
}
function stPickFilter(q){
  var grid=document.getElementById('st-pick-grid');if(!grid)return;
  var items=window.__pickItems||[];
  q=(q||'').toLowerCase();
  var sel=items.filter(function(it){return !q||(it.name||'').toLowerCase().indexOf(q)!==-1});
  if(!sel.length){grid.innerHTML='<div class="list-empty">Nessun risultato</div>';return}
  grid.innerHTML=sel.map(function(it){
    return '<div class="pick-item" onclick="stPickChoose(\''+escJsAttr(it.name)+'\')">'
      +'<img class="pick-thumb" src="'+escAttr(it.download_url||'')+'" alt="'+escAttr(it.name)+'" loading="lazy">'
      +'<div class="pick-name">'+esc(it.name)+'</div></div>';
  }).join('');
}
function stPickChoose(name){
  _stSetImg(_stPickTarget,'/images/'+name);
  closeModal('st-pick-modal');
}
function stPickUrl(i){
  var url=(document.getElementById('st-pick-url').value||'').trim();
  if(!url){toast('Inserisci un URL','error');return}
  _stSetImg(i,url);
  closeModal('st-pick-modal');
}
function stPickDrop(ev){
  ev.preventDefault();
  if(!ev.dataTransfer||!ev.dataTransfer.files||!ev.dataTransfer.files.length)return;
  stPickUpload(ev.dataTransfer.files);
}
function stPickUpload(files){
  if(!files||!files.length)return;
  var file=files[0];
  if(!/^image\//.test(file.type)){toast('Il file selezionato non è un\'immagine','error');return}
  var reader=new FileReader();
  reader.onload=function(){
    var name=(file.name||'immagine').toLowerCase().replace(/[^a-z0-9._-]+/g,'-').replace(/-+/g,'-');
    var dataUri=reader.result;
    toast('Caricamento '+name+'…');
    ghPutBinary('images/'+name,'admin: upload '+name,dataUri)
      .then(function(){
        toast('Immagine caricata','success');
        _stSetImg(_stPickTarget,'/images/'+name);
        closeModal('st-pick-modal');
      })
      .catch(function(e){
        var msg=((e&&e.message)||'').toString();
        if(/422|already exists|already\.committed/i.test(msg)){
          var parts=name.split('.');
          var base=parts.length>1?parts.slice(0,-1).join('.'):name;
          var ext=parts.length>1?'.'+parts[parts.length-1]:'';
          var name2=base+'-'+Date.now()+ext;
          toast('Nome occupato, riprovo come '+name2+'…');
          ghPutBinary('/images/'+name2,'admin: upload '+name2,dataUri)
            .then(function(){
              toast('Immagine caricata','success');
              _stSetImg(_stPickTarget,'/images/'+name2);
              closeModal('st-pick-modal');
            })
            .catch(function(e2){toast('Errore upload: '+(((e2&&e2.message)||'n/d')),'error')});
        }else{
          toast('Errore upload: '+(((e&&e.message)||'n/d')),'error');
        }
      });
  };
  reader.readAsDataURL(file);
}
function _stSetImg(i,url){
  var v=document.getElementById('st-imgval-'+i);
  if(!v){
    /* La card non ha il template immagine (è una sezione): convertila
       in divinità rigenerandola col template completo, poi imposta l'URL. */
    var data=_stRead();
    var c=data.cards[i];
    if(!c)return;
    c.img=url;c.deity=true;c.type='deity';
    if(!c.pos)c.pos=[50,50];
    _stRender(data);_stSync();
    v=document.getElementById('st-imgval-'+i);
    if(!v)return;
  }
  if(v)v.value=url;
  var im=document.getElementById('st-img-'+i);
  if(im){
    if(url){
      if(im.tagName==='DIV'){
        var n=document.createElement('img');
        n.className='st-img';n.id='st-img-'+i;n.src=url;n.alt='';
        im.parentNode.insertBefore(n,im);im.remove();
      }else{im.src=url;}
    }
  }
  var wrap=document.getElementById('st-imgwrap-'+i);
  if(wrap&&url){
    wrap.setAttribute('onmousedown','_stPosDown(event,'+i+')');
    wrap.setAttribute('ontouchstart','_stPosTouchDown(event,'+i+')');
    wrap.setAttribute('title','Trascina per scegliere la parte visibile nella card');
  }
  _stPosSetVal(i,[50,50]);
  _stSync();
}
function _stClearImg(i){
  var v=document.getElementById('st-imgval-'+i);
  if(v)v.value='';
  var im=document.getElementById('st-img-'+i);
  if(im&&im.tagName==='IMG'){
    var d=document.createElement('div');
    d.className='st-img st-img-empty';d.id='st-img-'+i;d.textContent='🛐';
    im.parentNode.insertBefore(d,im);im.remove();
  }
  var wrap=document.getElementById('st-imgwrap-'+i);
  if(wrap){wrap.removeAttribute('onmousedown');wrap.removeAttribute('title');}
  _stPosSetVal(i,null);
  _stSync();
}
function _stPosSetVal(i,pos){
  var m=document.getElementById('st-posmark-'+i);
  var v=document.getElementById('st-posval-'+i);
  var im=document.getElementById('st-img-'+i);
  if(pos){
    if(m){m.style.display='block';m.style.left=pos[0]+'%';m.style.top=pos[1]+'%';}
    if(v)v.value=pos[0]+','+pos[1];
    if(im)im.style.objectPosition=pos[0]+'% '+pos[1]+'%';
  }else{
    if(m)m.style.display='none';
    if(v)v.value='';
    if(im)im.style.objectPosition='';
  }
}
function _stPosDown(e,i){
  if(e.button!==0)return;
  e.preventDefault();
  var wrap=document.getElementById('st-imgwrap-'+i);if(!wrap)return;
  _stPosSet(i,e);
  function onMove(ev){_stPosSet(i,ev)}
  function onUp(){
    document.removeEventListener('mousemove',onMove);
    document.removeEventListener('mouseup',onUp);
    _stSync();
  }
  document.addEventListener('mousemove',onMove);
  document.addEventListener('mouseup',onUp);
}
function _stPosTouchDown(e,i){
  if(e.touches.length!==1)return;
  e.preventDefault();
  var wrap=document.getElementById('st-imgwrap-'+i);if(!wrap)return;
  _stPosTouchSet(i,e.touches[0]);
  function onMove(ev){
    if(ev.touches.length!==1)return;
    ev.preventDefault();
    _stPosTouchSet(i,ev.touches[0]);
  }
  function onUp(){
    document.removeEventListener('touchmove',onMove);
    document.removeEventListener('touchend',onUp);
    _stSync();
  }
  document.addEventListener('touchmove',onMove,{passive:false});
  document.addEventListener('touchend',onUp);
}
function _stPosSet(i,e){
  var wrap=document.getElementById('st-imgwrap-'+i);if(!wrap)return;
  var r=wrap.getBoundingClientRect();
  var x=Math.max(0,Math.min(100,Math.round((e.clientX-r.left)/r.width*100)));
  var y=Math.max(0,Math.min(100,Math.round((e.clientY-r.top)/r.height*100)));
  _stPosSetVal(i,[x,y]);
}
function _stPosTouchSet(i,t){
  var wrap=document.getElementById('st-imgwrap-'+i);if(!wrap)return;
  var r=wrap.getBoundingClientRect();
  var x=Math.max(0,Math.min(100,Math.round((t.clientX-r.left)/r.width*100)));
  var y=Math.max(0,Math.min(100,Math.round((t.clientY-r.top)/r.height*100)));
  _stPosSetVal(i,[x,y]);
}

/* ═══════════════ REGISTRAZIONE NAMESPACE ═══════════════ */
ArcAdmin.register('structured', {
  setKind: _stSetKind,
  read: _stRead,
  commit: _stCommit,
  sync: _stSync,
  syncWithUndo: _stSyncWithUndo,
  syncPreview: _stSyncPreview,
  undo: _stUndo,
  redo: _stRedo,
  parse: _stParse,
  buildMd: _stBuildMd,
  preview: _stPreview
});
