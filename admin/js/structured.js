/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — structured.js
   Editor a blocchi per i layout strutturati.

   Due modalità:
   - 'pantheon': divinità/sezioni con immagine, citazione, identità,
     personalità, culto. Markdown compatibile con _parsePantheon del
     sito (blocchi separati da "---", "# Nome", "## Identità", …).
   - 'schede': schede a card per i layout sessione/quest/npc/spell/
     specie/citta/evento/bestiario/fazioni/oggetti. Markdown nel
     formato "## Titolo" + "- **Chiave:** valore" + "### Sezione"
     letto dai renderer _renderSchede/_renderBestiario/_renderFazioni/
     _renderOggetti del sito.
   ════════════════════════════════════════════════════════════════ */

var _stMode=false;
var _stKind='pantheon';
var _ST_SCHE_LAYOUTS=['sessione','quest','npc','spell','specie','citta','evento','bestiario','fazioni','oggetti'];

/* Layout supportati dall'editor a blocchi. */
function _stLayoutFor(layout){
  if(layout==='pantheon')return 'pantheon';
  if(_ST_SCHE_LAYOUTS.indexOf(layout)!==-1)return 'schede';
  return null;
}
function _stSetKind(layout){
  _stKind=_stLayoutFor(layout)||'pantheon';
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

/* ── PARSE schede (sessione/quest/npc/spell/specie/citta/evento/bestiario/fazioni/oggetti) ── */
function _stParseSchede(md){
  var cards=[];
  if(!md)return {heading:'',intro:'',cards:[]};
  var sections=md.split(/^## /m).filter(Boolean);
  sections.forEach(function(sec){
    var lines=sec.split('\n');
    var name=(lines.shift()||'').trim().replace(/^#\s+/,'');
    var intro=[],fields=[],blocks=[],cur=null,buf=[];
    function flushBlock(){
      if(cur!==null)blocks.push({name:cur,md:buf.join('\n').trim()});
      buf=[];cur=null;
    }
    lines.forEach(function(line){
      var fm=line.match(/^\s*-\s*\*\*(.+?):?\*\*\s*:?\s*(.*)$/);
      if(fm){flushBlock();fields.push([fm[1].trim().replace(/:$/,''),fm[2].trim()]);return;}
      var bm=line.match(/^###\s+(.+)/);
      if(bm){flushBlock();cur=bm[1].trim();return;}
      if(cur!==null){buf.push(line);return;}
      if(line.trim())intro.push(line);
    });
    flushBlock();
    cards.push({name:name,intro:intro.join('\n').trim(),fields:fields,blocks:blocks});
  });
  return {heading:'',intro:'',cards:cards};
}

/* ── BUILD schede → markdown ── */
function _stBuildSchede(data){
  var out='';
  (data.cards||[]).forEach(function(c){
    if(out)out+='\n\n';
    out+='## '+(c.name||'Scheda');
    if(c.intro)out+='\n\n'+c.intro;
    if(c.fields&&c.fields.length){
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
  var out='# '+(data.heading||'Divinità')+'\n\n'+(data.intro||'');
  data.cards.forEach(function(c){
    out+='\n\n---\n\n'+_stBuildCard(c);
  });
  return out;
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
  var h='<div class="sch-page">';
  (data.cards||[]).forEach(function(c){
    h+='<div class="sch-card" style="margin-bottom:16px;border:1px solid var(--line);border-radius:var(--rad);padding:14px">';
    h+='<div class="sch-title" style="font-family:var(--brand);color:var(--acc2);font-size:17px;font-weight:700">'+esc(c.name)+'</div>';
    if(c.intro)h+='<div class="sch-intro" style="margin:8px 0">'+_stMd(c.intro)+'</div>';
    if(c.fields&&c.fields.length){
      h+='<div class="sch-fields" style="display:flex;flex-direction:column;gap:4px;margin:8px 0">';
      c.fields.forEach(function(f){
        h+='<div class="sch-field"><span class="sch-key" style="color:var(--acc2);font-weight:700">'+esc(f[0])+'</span>'
          +'<span class="sch-val">'+esc(f[1])+'</span></div>';
      });
      h+='</div>';
    }
    (c.blocks||[]).forEach(function(b){
      h+='<div class="sch-block-title" style="font-weight:700;color:var(--acc);margin-top:10px">'+esc(b.name)+'</div>';
      h+='<div class="sch-block-body">'+_stMd(b.md)+'</div>';
    });
    h+='</div>';
  });
  h+='</div>';
  return h;
}

/* ── CARD blocco ── */
function _stCardHTML(c,i){
  if(_stKind==='schede')return _stSchedeCardHTML(c,i);
  if(!c.img){
    return '<div class="st-card st-card-sec" data-i="'+i+'">'
      +'<div class="st-card-head"><span class="st-idx">'+(i+1)+'</span>'
      +'<input class="in st-name" value="'+escAttr(c.name)+'" placeholder="Nome della sezione" oninput="_stSync()">'
      +'<span class="st-head-actions">'
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
  return '<div class="st-card" data-i="'+i+'">'
    +'<div class="st-card-head"><span class="st-idx">'+(i+1)+'</span>'
    +'<input class="in st-name" value="'+escAttr(c.name)+'" placeholder="Nome della divinità / sezione" oninput="_stSync()">'
    +'<span class="st-head-actions">'
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
  var fields=(c.fields&&c.fields.length?c.fields:[['','']])
    .map(function(p){return '<div class="st-kv"><input class="in k" value="'+escAttr(p[0])+'" placeholder="Chiave" oninput="_stSync()">'
      +'<input class="in v" value="'+escAttr(p[1])+'" placeholder="Valore" oninput="_stSync()">'
      +'<button type="button" class="btn btn-d btn-icon btn-sm" title="Rimuovi campo" onclick="_stDelRow(this)">✕</button></div>';}).join('');
  var blocks=(c.blocks||[]).map(function(b,j){
    return '<div class="st-block">'
      +'<div class="st-block-head"><input class="in st-bname" value="'+escAttr(b.name)+'" placeholder="Titolo sezione" oninput="_stSync()">'
      +'<button type="button" class="btn btn-d btn-icon btn-sm" title="Rimuovi sezione" onclick="_stDelBlock(this)">✕</button></div>'
      +'<textarea class="in st-ta st-bmd" oninput="_stSync()" placeholder="Contenuto (markdown)">'+esc(b.md)+'</textarea>'
      +'</div>';
  }).join('');
  return '<div class="st-card" data-i="'+i+'">'
    +'<div class="st-card-head"><span class="st-idx">'+(i+1)+'</span>'
    +'<input class="in st-name" value="'+escAttr(c.name)+'" placeholder="Titolo della scheda" oninput="_stSync()">'
    +'<span class="st-head-actions">'
    +'<button type="button" class="btn btn-soft btn-icon btn-sm" title="Sposta su" onclick="_stMove('+i+',-1)">↑</button>'
    +'<button type="button" class="btn btn-soft btn-icon btn-sm" title="Sposta giù" onclick="_stMove('+i+',1)">↓</button>'
    +'<button type="button" class="btn btn-d btn-icon btn-sm" title="Elimina scheda" onclick="_stDelete('+i+')">🗑</button>'
    +'</span></div>'
    +'<div class="st-card-body">'
    +'<label class="st-ta-l">Descrizione / intro<textarea class="in st-ta st-intro" oninput="_stSync()" placeholder="Breve descrizione della scheda…">'+esc(c.intro)+'</textarea></label>'
    +'<div class="st-sub">Campi</div>'
    +'<div class="st-kvrows" id="st-ident-'+i+'">'+fields+'</div>'
    +'<button type="button" class="btn btn-soft btn-sm" onclick="_stAddIdent('+i+')">＋ campo</button>'
    +'<div class="st-sub">Sezioni (###)</div>'
    +'<div class="st-blockrows" id="st-blocks-'+i+'">'+blocks+'</div>'
    +'<button type="button" class="btn btn-soft btn-sm" onclick="_stAddBlock('+i+')">＋ sezione</button>'
    +'</div></div>';
}

/* ── RENDERING dell'editor ── */
function _stRead(){
  if(_stKind==='schede')return _stReadSchede();
  var heading='Divinità';
  var hd=document.getElementById('st-heading');
  if(hd&&hd.value.trim())heading=hd.value.trim();
  var intro=document.getElementById('st-intro')?document.getElementById('st-intro').value:'';
  var cards=[];
  document.querySelectorAll('#st-list .st-card').forEach(function(c,idx){
    var iv=c.querySelector('.st-imgval');
    var img=iv?iv.value:'';
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
    cards.push({type:img?'deity':'section',name:name,img:img,pos:pos,
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
    var fields=[];
    c.querySelectorAll('.st-kv').forEach(function(kv){
      var ke=kv.querySelector('.k');
      var ve=kv.querySelector('.v');
      var k=ke?ke.value.trim():'';
      if(k)fields.push([k,ve?ve.value.trim():'']);
    });
    var blocks=[];
    c.querySelectorAll('.st-block').forEach(function(b){
      var bn=b.querySelector('.st-bname').value.trim();
      var bm=b.querySelector('.st-bmd').value;
      if(bn||bm)blocks.push({name:bn||'Sezione',md:bm});
    });
    var introEl=c.querySelector('.st-intro');
    cards.push({name:name,intro:introEl?introEl.value:'',fields:fields,blocks:blocks});
  });
  return {heading:'',intro:'',cards:cards};
}
function _stRender(data){
  var list=document.getElementById('st-list');if(!list)return;
  list.innerHTML=data.cards.map(function(c,i){return _stCardHTML(c,i)}).join('');
}
function _stCommit(data){
  var md=_stBuildMd(data);
  var e=document.getElementById('e-md');
  if(e){e.value=md;_lastSavedContent=md;}
  _modified=true;setBadge('dirty','modificato');
  try{_autosaveStore(md)}catch(e2){}
  var st=document.getElementById('e-stats');
  if(st)st.textContent=data.cards.length+' blocchi';
}
function _stPreview(data){
  var pv=document.getElementById('e-preview');if(!pv)return;
  var body=document.getElementById('editor-body');
  if(body&&body.classList.contains('no-preview'))return;
  var hd=_currentHead();
  pv.innerHTML='<div class="e-pv"><div class="e-pv-head"><span class="epv-icon">'+hd.icon+'</span><div>'
    +'<div class="epv-title">'+esc(hd.title)+'</div><div class="epv-sub">'+esc(_current.k||'')+'</div></div></div>'
    +_stPreviewHTML(data)+'</div>';
}
function _stSync(){
  var data=_stRead();
  _stCommit(data);
  _stPreview(data);
}
function _stSyncPreview(){_stPreview(_stRead())}

function initStructuredEditor(content){
  _stMode=true;window.__stMode=true;
  _stKind=_stLayoutFor(_current.layout)||'pantheon';
  var eb=document.getElementById('editor-body');
  if(eb)eb.classList.add('no-preview');
  var data=_stParse(content||'');
  var ta=document.getElementById('e-md');if(ta)ta.style.display='none';
  var sh=document.getElementById('struct-head');if(sh)sh.style.display='';
  var sl=document.getElementById('st-list');if(sl)sl.style.display='';
  var head=document.getElementById('struct-head');
  if(head){
    head.innerHTML=_stKind==='schede'
      ?'<div class="st-intro-box"><p class="st-hint" style="margin:0">Schede a card: ogni scheda ha titolo, descrizione, campi e sezioni. L\'anteprima e il salvataggio usano il formato del sito (<code>## Titolo</code> + <code>- **Chiave:** valore</code> + <code>### Sezione</code>).</p></div>'
      :'<div class="st-intro-box">'
        +'<label class="st-ta-l">Titolo introduzione<input class="in" id="st-heading" value="'+escAttr(data.heading)+'" style="max-width:220px" oninput="_stSync()"></label>'
        +'<label class="st-ta-l">Testo introduttivo (prima della griglia)<textarea class="in st-ta" id="st-intro" oninput="_stSync()" placeholder="Introduzione al pantheon…">'+esc(data.intro)+'</textarea></label>'
        +'</div>';
  }
  _stRender(data);
  var ph=document.querySelector('#md-pane .pane-head');
  if(ph)ph.innerHTML='Blocchi <span class="ph-info" id="e-stats"></span>';
  var tb=document.getElementById('e-toolbar');
  if(tb&&tb.parentNode){
    tb.outerHTML='<div class="ed-toolbar" id="e-toolbar">'
      +'<button class="btn btn-soft btn-sm" onclick="_stToggle()" title="Passa al markdown grezzo">✍ Markdown</button>'
      +(_stKind==='schede'
        ?'<button class="btn btn-p btn-sm" onclick="_stAdd(\'card\')">➕ Scheda</button>'
        :'<button class="btn btn-p btn-sm" onclick="_stAdd(\'deity\')">➕ Divinità</button>'
         +'<button class="btn btn-soft btn-sm" onclick="_stAdd(\'section\')">➕ Sezione</button>')
      +'<span class="tb-spacer"></span>'
      +'<span class="view-switch">'
      +'<button class="tb-btn2" data-view="site" title="Come appare sul sito">SITO</button>'
      +'</span></div>';
  }
  var sb=document.getElementById('e-sb');
  if(sb)sb.textContent=_layoutLabel(_current.layout)+' · editor a blocchi · '+
    (_stKind==='schede'?'schede a card':'griglia divinità');
  _stSync();
}
function _stToggle(){
  var ta=document.getElementById('e-md');if(!ta)return;
  if(_stMode){_stExit();}
  else{initStructuredEditor(ta.value);}
  setViewMode(_viewMode);
}
function _stExit(){
  _stMode=false;window.__stMode=false;
  var eb=document.getElementById('editor-body');
  if(eb)eb.classList.remove('no-preview');
  var ta=document.getElementById('e-md');if(ta)ta.style.display='';
  var sh=document.getElementById('struct-head');if(sh)sh.style.display='none';
  var sl=document.getElementById('st-list');if(sl)sl.style.display='none';
  var ph=document.querySelector('#md-pane .pane-head');
  if(ph)ph.innerHTML='Markdown <span class="ph-info" id="e-stats"></span>';
  var tb=document.getElementById('e-toolbar');
  if(tb&&tb.parentNode)tb.outerHTML=buildToolbar();
  renderPreview();updateStats();
}

/* ── MANIPOLAZIONE BLOCCHI ── */
function _stMove(i,dir){
  var data=_stRead();
  var j=i+dir;
  if(j<0||j>=data.cards.length)return;
  var t=data.cards[i];data.cards[i]=data.cards[j];data.cards[j]=t;
  _stRender(data);_stSync();
}
function _stDelete(i){
  var data=_stRead();
  data.cards.splice(i,1);
  _stRender(data);_stSync();
}
function _stAdd(type){
  var data=_stRead();
  if(_stKind==='schede'){
    data.cards.push({name:'Nuova scheda',intro:'',fields:[['','']],blocks:[]});
  }else{
    data.cards.push({type:type,name:type==='section'?'Nuova sezione':'Nuova divinità',
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
  var box=document.getElementById('st-ident-'+i);if(!box)return;
  var div=document.createElement('div');div.className='st-kv';
  div.innerHTML='<input class="in k" placeholder="Campo" oninput="_stSync()">'
    +'<input class="in v" placeholder="Valore" oninput="_stSync()">'
    +'<button type="button" class="btn btn-d btn-icon btn-sm" title="Rimuovi campo" onclick="_stDelRow(this)">✕</button>';
  box.appendChild(div);_stSync();
  var k=div.querySelector('.k');if(k)k.focus();
}
function _stDelRow(btn){
  var kv=btn.closest('.st-kv');if(kv)kv.remove();
  _stSync();
}
function _stAddBlock(i){
  var box=document.getElementById('st-blocks-'+i);if(!box)return;
  var div=document.createElement('div');div.className='st-block';
  div.innerHTML='<div class="st-block-head"><input class="in st-bname" placeholder="Titolo sezione" oninput="_stSync()">'
    +'<button type="button" class="btn btn-d btn-icon btn-sm" title="Rimuovi sezione" onclick="_stDelBlock(this)">✕</button></div>'
    +'<textarea class="in st-ta st-bmd" oninput="_stSync()" placeholder="Contenuto (markdown)"></textarea>';
  box.appendChild(div);_stSync();
  var bn=div.querySelector('.st-bname');if(bn)bn.focus();
}
function _stDelBlock(btn){
  var b=btn.closest('.st-block');if(b)b.remove();
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
    return '<div class="pick-item" onclick="stPickChoose(\''+escAttr(it.name)+'\')">'
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
function _stSetImg(i,url){
  var v=document.getElementById('st-imgval-'+i);
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
function _stPosSet(i,e){
  var wrap=document.getElementById('st-imgwrap-'+i);if(!wrap)return;
  var r=wrap.getBoundingClientRect();
  var x=Math.max(0,Math.min(100,Math.round((e.clientX-r.left)/r.width*100)));
  var y=Math.max(0,Math.min(100,Math.round((e.clientY-r.top)/r.height*100)));
  _stPosSetVal(i,[x,y]);
}
