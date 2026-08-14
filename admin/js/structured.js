/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — structured.js
   Editor a blocchi per i layout strutturati (attualmente Pantheon).

   Converte il markdown della pagina in blocchi editabili (divinità /
   sezioni), mostra un'anteprima IDENTICA alla griglia del sito e
   rigenera il markdown nel formato che notion-nav.js (site) si aspetta
   (_parsePantheon: blocchi separati da "---", "# Nome", immagine,
   citazione, "## Identità", "## Personalità", "## Culto").
   ════════════════════════════════════════════════════════════════ */

var _stMode=false;

/* Layout supportati dall'editor a blocchi (per ora solo Pantheon). */
function _stLayoutFor(layout){return layout==='pantheon'?'pantheon':null}

/* ── PARSE markdown → blocchi ── */
function _stFold(s){return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function _stParse(md){
  if(!md)return {heading:'Divinità',intro:'',cards:[]};
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
    cards.push({type:img?'deity':'section',name:name,img:img,quote:quote,
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

/* ── BUILD blocchi → markdown (formato compatibile con il sito) ── */
function _stBuildMd(data){
  var out='# '+(data.heading||'Divinità')+'\n\n'+(data.intro||'');
  data.cards.forEach(function(c){
    out+='\n\n---\n\n'+_stBuildCard(c);
  });
  return out;
}
function _stBuildCard(c){
  var b='# '+(c.name||'');
  if(c.img)b+='\n\n!['+(c.name||'')+']('+c.img+')';
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
      +'<img class="pan-tile-img" src="'+escAttr(c.img)+'" alt="'+escAttr(c.name)+'" loading="lazy">'
      +'<div class="pan-tile-caption"><span class="pan-tile-name">'+esc(c.name)+'</span>'
      +(epi?'<span class="pan-tile-epi">'+esc(epi)+'</span>':'')+'</div></div>';
  });
  h+='</div></div>';
  return h;
}

/* ── CARD blocco ── */
function _stCardHTML(c,i){
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
    +'<div class="st-row">'
    +'<div class="st-imgbox">'
    +(c.img
        ?'<img class="st-img" id="st-img-'+i+'" src="'+escAttr(c.img)+'" alt="'+escAttr(c.name)+'">'
        :'<div class="st-img st-img-empty" id="st-img-'+i+'">🛐</div>')
    +'<input type="hidden" class="st-imgval" id="st-imgval-'+i+'" value="'+escAttr(c.img||'')+'">'
    +'<div class="st-img-actions">'
    +'<button type="button" class="btn btn-soft btn-sm" onclick="_stPick('+i+')">🖼 Scegli</button>'
    +'<button type="button" class="btn btn-soft btn-sm" onclick="_stClearImg('+i+')">✕</button>'
    +'</div></div>'
    +'<div class="st-fields">'
    +'<label>Citazione<input class="in st-quote" value="'+escAttr(c.quote)+'" placeholder="Frase rappresentativa…" oninput="_stSync()"></label>'
    +'<p class="st-hint">Senza immagine il blocco diventa una sezione a tutta larghezza (es. gli Aspetti).</p>'
    +'</div></div>'
    +'<div class="st-sub">Identità</div>'
    +'<div class="st-kvrows" id="st-ident-'+i+'">'+rows+'</div>'
    +'<button type="button" class="btn btn-soft btn-sm" onclick="_stAddIdent('+i+')">＋ campo identità</button>'
    +'<label class="st-ta-l">Personalità<textarea class="in st-ta st-personality" oninput="_stSync()">'+esc(c.personality)+'</textarea></label>'
    +'<label class="st-ta-l">Culto<textarea class="in st-ta st-cult" oninput="_stSync()">'+esc(c.cult)+'</textarea></label>'
    +'<label class="st-ta-l">Contenuto aggiuntivo (markdown)<textarea class="in st-ta st-extra" oninput="_stSync()">'+esc(c.extra)+'</textarea></label>'
    +'</div></div>';
}

/* ── RENDERING dell'editor ── */
function _stRead(){
  var heading='Divinità';
  var hd=document.getElementById('st-heading');
  if(hd&&hd.value.trim())heading=hd.value.trim();
  var intro=document.getElementById('st-intro')?document.getElementById('st-intro').value:'';
  var cards=[];
  document.querySelectorAll('#st-list .st-card').forEach(function(c,idx){
    var img=c.querySelector('.st-imgval').value;
    var name=c.querySelector('.st-name').value.trim();
    if(!name)name=img?'Divinità '+(idx+1):'Sezione '+(idx+1);
    var ident=[];
    c.querySelectorAll('.st-kv').forEach(function(kv){
      var k=kv.querySelector('.k').value.trim();
      if(k)ident.push([k,kv.querySelector('.v').value.trim()]);
    });
    cards.push({type:img?'deity':'section',name:name,img:img,
      quote:c.querySelector('.st-quote').value.trim(),
      ident:ident,
      personality:c.querySelector('.st-personality').value,
      cult:c.querySelector('.st-cult').value,
      extra:c.querySelector('.st-extra').value});
  });
  return {heading:heading,intro:intro,cards:cards};
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
  var data=_stParse(content||'');
  var head=document.getElementById('struct-head');
  if(head){
    head.innerHTML='<div class="st-intro-box">'
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
      +'<button class="btn btn-p btn-sm" onclick="_stAdd(\'deity\')">➕ Divinità</button>'
      +'<button class="btn btn-soft btn-sm" onclick="_stAdd(\'section\')">➕ Sezione</button>'
      +'<span class="tb-spacer"></span>'
      +'<span class="view-switch">'
      +'<button class="tb-btn2" data-view="split" title="Blocchi + anteprima">SPLIT</button>'
      +'<button class="tb-btn2" data-view="pv" title="Solo anteprima">VEDI</button>'
      +'<button class="tb-btn2" data-view="site" title="Come appare sul sito">SITO</button>'
      +'</span></div>';
  }
  var sb=document.getElementById('e-sb');
  if(sb)sb.textContent=_layoutLabel(_current.layout)+' · editor a blocchi · anteprima griglia';
  _stSync();
}
function _stExit(){
  _stMode=false;window.__stMode=false;
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
  data.cards.push({type:type,name:type==='section'?'Nuova sezione':'Nuova divinità',
    img:type==='deity'?'':'',quote:'',
    ident:[['Nome',''],['Epiteto',''],['Allineamento',''],['Sfere',''],['Simbolo','']],
    personality:'',cult:'',extra:''});
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
  _stSync();
}
