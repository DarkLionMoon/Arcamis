/* ════════════════════════════════════════════════════════════════
   ARCAMIS ADMIN — site.js
   Moduli sito: Navigazione (ordine/sezioni menu), Carousel homepage,
   Cover pagine (KV), Impostazioni. (v2)
   ════════════════════════════════════════════════════════════════ */

/* ── UTILITY KV (covers/carousel) ── */
async function arcSave(key,value){
  try{
    var r=await fetch('/api/admin?action=set_cover',{
      method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({pageId:key,coverUrl:value})
    });
    var j=await r.json();
    return j.ok;
  }catch(e){return false}
}
async function arcGetCovers(){
  try{
    var r=await fetch('/api/admin?action=get_covers',{credentials:'include'});
    var j=await r.json();
    return j.covers||{};
  }catch(e){return {}}
}
async function arcUploadImage(dataUri,name){
  await ghPutBinary('images/'+name,'admin: add image '+name,dataUri);
  return '/images/'+name;
}

/* ════════════════════════════════════
   CAROUSEL HOMEPAGE
   ════════════════════════════════════ */
var SLIDES_DEF=[
  {
    key:'carousel_0',label:'Slide 1 — Arcamis Porto',
    defTag:'Città Portuale — Marche di Arcamis',
    defTit:'ARCAMIS',
    defDesc:'Città portuale delle Marche di Arcamis, porta d\'ingresso al regno di Arcadia. Solo una piccola parte della regione è esplorata dai giocatori.',
    btns:[
      {defLabel:'Entra nel Discord', defHref:'https://discord.gg/JZPnXZbXEJ'},
      {defLabel:'Scopri la città ↓', defHref:''}
    ]
  },
  {
    key:'carousel_1',label:'Slide 2 — Pantheon',
    defTag:'Pantheon di Arcamis',
    defTit:'LE DIVINITÀ DI ARCAMIS',
    defDesc:'Ogni dio ha lasciato il proprio segno sulla terra. Scopri il Pantheon e i culti che plasmano il mondo.',
    btns:[
      {defLabel:'Scopri il Pantheon →', defHref:''}
    ]
  },
  {
    key:'carousel_2',label:'Slide 3 — Personaggio',
    defTag:'Crea il tuo eroe',
    defTit:'CREA IL TUO PERSONAGGIO',
    defDesc:'Scegli la tua classe, forgia la tua storia. Il tuo personaggio esiste solo su Arcamis.',
    btns:[
      {defLabel:'Come si inizia →', defHref:''}
    ]
  }
];

async function openCarousel(){
  if(_modified&&!confirm('Hai modifiche non salvate. Continuare?'))return;
  _modified=false;
  _current=null;
  setActive('carousel');
  closeSidebar();
  setCrumb('Media','Carousel homepage');
  setTitle('Slide homepage');
  setStatus('saving','caricamento carousel…');
  try{
    var covers=await arcGetCovers();
    var h=viewHead('🎠','Carousel homepage','Le tre slide mostrate in cima alla home', 
      '<button class="btn btn-p" onclick="openCarousel()">⟳ AGGIORNA</button>');
    h+='<div class="panel-sub">Le modifiche vengono salvate istantaneamente in KV e applicate al reload del sito.</div>';
    for(var i=0;i<SLIDES_DEF.length;i++){
      h+=_carSlideHtml(i,covers);
    }
    document.getElementById('main').innerHTML=h;
    setStatus('ok','caricato');
    setTimeout(function(){setStatus('idle','pronto')},1500);
  }catch(e){setStatus('err','errore');toast(e.message,'error')}
}
function _carBtnsVal(idx,covers){
  try{return JSON.parse(covers[SLIDES_DEF[idx].key+'_btns']||'null')}catch(e){return null}
}
function _carBtnHtml(idx,bi,b){
  return '<div class="cs-btni">'
    +'<input id="cs-btl-'+idx+'-'+bi+'" class="in" placeholder="Etichetta bottone" value="'+escAttr(b.label!==undefined?b.label:b.defLabel)+'">'
    +'<input id="cs-bth-'+idx+'-'+bi+'" class="in" placeholder="https://… o onclick…" value="'+escAttr(b.href!==undefined?b.href:b.defHref)+'">'
    +'<button type="button" class="btn btn-d btn-sm" title="Rimuovi bottone" onclick="carDelBtn('+idx+','+bi+')">✕</button>'
    +'</div>';
}
function _carBtnsHtml(idx,list){
  return (list||[]).map(function(b,bi){return _carBtnHtml(idx,bi,b)}).join('');
}
function _carSlideHtml(idx,covers){
  var s=SLIDES_DEF[idx];
  var key=s.key;
  var curImg=covers[key]||'';
  var meta={};
  try{meta=JSON.parse(covers[key+'_meta']||'null')||{}}catch(e){}
  var tag=meta.tag||s.defTag;
  var tit=meta.tit||s.defTit;
  var desc=meta.desc||s.defDesc;
  var list=_carBtnsVal(idx,covers)||s.btns;
  return '<div class="slide-edit">'
    +'<div class="se-head"><div class="vhi">'+idx+'</div><h3>'+esc(s.label)+'</h3>'
    +'<span class="pill '+(curImg?'gold':'gray')+'" style="margin-left:auto">'+(curImg?'immagine ok':'nessuna immagine')+'</span></div>'
    +'<div class="se-prev" id="cs-prev-'+idx+'" style="'+(curImg?'background-image:url(\''+escAttr(curImg)+'\')':'')+'">'+(curImg?'':'Nessuna immagine')+'</div>'
    +'<div class="se-grid">'
    +'<div class="fld"><label>Sfondo — URL</label><input id="cs-img-'+idx+'" class="in" value="'+escAttr(curImg)+'" oninput="document.getElementById(\'cs-prev-'+idx+'\').style.backgroundImage=this.value?\'url(\'+this.value+\')\':\'none\';document.getElementById(\'cs-prev-'+idx+'\').textContent=this.value?\'\':\'Nessuna immagine\'" placeholder="https://… o /images/…"></div>'
    +'<div class="fld"><label>Sfondo — carica dal PC</label><div class="upload-zone" style="padding:10px"><input type="file" accept="image/*" onchange="carSlideUpload(event,'+idx+')"><span class="uzi">🖼</span>Compressa e caricata su /images/</div></div>'
    +'<div class="fld"><label>Tag (piccolo sopra)</label><input id="cs-tag-'+idx+'" class="in" value="'+escAttr(tag)+'"></div>'
    +'<div class="fld"><label>Titolo (grande)</label><input id="cs-tit-'+idx+'" class="in" value="'+escAttr(tit)+'"></div>'
    +'</div>'
    +'<div class="fld" style="margin-top:10px"><label>Descrizione (paragrafo sotto il titolo)</label><textarea id="cs-desc-'+idx+'" class="in" rows="2">'+esc(desc)+'</textarea></div>'
    +'<div class="se-btns">'
    +'<label class="se-lb">Bottoni della slide</label>'
    +'<div class="cs-btns" id="cs-btns-'+idx+'">'+_carBtnsHtml(idx,list)+'</div>'
    +'<button class="btn btn-soft btn-sm" onclick="carAddBtn('+idx+')">➕ Aggiungi bottone</button>'
    +'</div>'
    +'<div class="se-actions">'
    +'<button class="btn btn-soft btn-sm" onclick="carSaveImg('+idx+')">Salva sfondo</button>'
    +'<button class="btn btn-soft btn-sm" onclick="carSaveText('+idx+')">Salva testi</button>'
    +'<button class="btn btn-soft btn-sm" onclick="carSaveBtns('+idx+')">Salva bottoni</button>'
    +'<button class="btn btn-d btn-sm" onclick="carRemoveImg('+idx+')">Rimuovi sfondo</button>'
    +'</div>'
    +'<div class="se-status" id="cs-st-'+idx+'"></div>'
    +'</div>';
}
function _carStatus(idx,msg,ok){
  var el=document.getElementById('cs-st-'+idx);
  if(el){el.textContent=msg;el.className='se-status '+(ok?'ok':'err')}
}
function carSlideUpload(event,idx){
  var file=event.target.files[0];
  if(!file)return;
  var reader=new FileReader();
  reader.onload=function(e){
    compressImg(e.target.result,function(b64){
      document.getElementById('cs-prev-'+idx).style.backgroundImage='url(\''+b64+'\')';
      document.getElementById('cs-prev-'+idx).textContent='';
      document.getElementById('cs-img-'+idx).value='';
      _carUploading={idx:idx,b64:b64};
      _carStatus(idx,'Immagine pronta: premi "Salva sfondo"','ok');
    });
  };
  reader.readAsDataURL(file);
}
var _carUploading=null;
async function carSaveImg(idx){
  var val=(document.getElementById('cs-img-'+idx).value||'').trim();
  if(!val&&_carUploading&&_carUploading.idx===idx){
    _carStatus(idx,'Caricamento su GitHub…','');
    try{
      var name='carousel-'+idx+'-'+Date.now()+'.jpg';
      val=await arcUploadImage(_carUploading.b64,name);
      _carUploading=null;
    }catch(e){_carStatus(idx,'Errore upload: '+e.message,false);return}
  }
  if(!val){_carStatus(idx,'Inserisci un URL o carica un file',false);return}
  var key=SLIDES_DEF[idx].key;
  _carStatus(idx,'Salvataggio…','');
  var ok=await arcSave(key,val);
  if(ok){
    document.getElementById('cs-prev-'+idx).style.backgroundImage='url(\''+val+'\')';
    document.getElementById('cs-prev-'+idx).textContent='';
    document.getElementById('cs-img-'+idx).value=val;
  }
  _carStatus(idx,ok?'✓ Sfondo salvato':'✕ Errore salvataggio',ok);
  toast(ok?'Sfondo slide '+(idx+1)+' salvato ✓':'Errore salvataggio',ok);
}
async function carRemoveImg(idx){
  var key=SLIDES_DEF[idx].key;
  _carStatus(idx,'Rimozione…','');
  var ok=await arcSave(key,'');
  if(ok){
    document.getElementById('cs-prev-'+idx).style.backgroundImage='none';
    document.getElementById('cs-prev-'+idx).textContent='Nessuna immagine';
    document.getElementById('cs-img-'+idx).value='';
  }
  _carStatus(idx,ok?'✓ Rimosso':'✕ Errore',ok);
  toast(ok?'Sfondo rimosso':'Errore',ok);
}
async function carSaveText(idx){
  var tag=(document.getElementById('cs-tag-'+idx).value||'').trim();
  var tit=(document.getElementById('cs-tit-'+idx).value||'').trim();
  var desc=(document.getElementById('cs-desc-'+idx).value||'').trim();
  var key=SLIDES_DEF[idx].key;
  _carStatus(idx,'Salvataggio…','');
  var ok=await arcSave(key+'_meta',JSON.stringify({tag:tag,tit:tit,desc:desc}));
  _carStatus(idx,ok?'✓ Testi salvati':'✕ Errore',ok);
  toast(ok?'Testi slide '+(idx+1)+' salvati ✓':'Errore',ok);
}
async function carSaveBtns(idx){
  var key=SLIDES_DEF[idx].key;
  var btns=[];
  document.querySelectorAll('#cs-btns-'+idx+' .cs-btni').forEach(function(row){
    var l=row.querySelector('input');
    var h=row.querySelectorAll('input')[1];
    var label=(l&&l.value||'').trim();
    var href=(h&&h.value||'').trim();
    if(label||href)btns.push({label:label,href:href});
  });
  _carStatus(idx,'Salvataggio…','');
  var ok=await arcSave(key+'_btns',JSON.stringify(btns));
  _carStatus(idx,ok?'✓ Bottoni salvati':'✕ Errore',ok);
  toast(ok?'Bottoni slide '+(idx+1)+' salvati ✓':'Errore',ok);
}
function carAddBtn(idx){
  var box=document.getElementById('cs-btns-'+idx);
  if(!box)return;
  var n=0;
  box.querySelectorAll('[id^="cs-btl-'+idx+'-"]').forEach(function(inp){
    var bi=parseInt(inp.id.split('-').pop(),10);
    if(!isNaN(bi)&&bi>=n)n=bi+1;
  });
  box.insertAdjacentHTML('beforeend',_carBtnHtml(idx,n,{label:'',href:''}));
}
function carDelBtn(idx,bi){
  var el=document.getElementById('cs-btl-'+idx+'-'+bi);
  if(el&&el.parentNode)el.parentNode.remove();
}

/* ════════════════════════════════════
   COVER PAGINE (card home)
   ════════════════════════════════════ */
var _coversState={pages:[],covers:{}};
async function openCovers(){
  if(_modified&&!confirm('Hai modifiche non salvate. Continuare?'))return;
  _modified=false;
  _current=null;
  setActive('covers');
  closeSidebar();
  setCrumb('Media','Cover pagine');
  setTitle('Cover card home');
  setStatus('saving','caricamento cover…');
  try{
    var [pages,covers]=await Promise.all([_getDataPages(),arcGetCovers()]);
    _coversState.pages=pages;_coversState.covers=covers;
    var h=viewHead('🖌️','Cover pagine','Sfondi delle card in evidenza sulla homepage',
      '<button class="btn btn-p" onclick="openCovers()">⟳ AGGIORNA</button>');
    h+='<div class="panel"><div class="panel-head"><h3>Pagine</h3><span class="hint">'+pages.length+' nel registro</span></div>';
    if(!pages.length)h+='<div class="empty"><span class="ei">🧭</span>Nessuna pagina nel registro data.js</div>';
    pages.forEach(function(p){
      var cur=covers[p.id]||'';
      h+='<div class="cover-row">'
        +'<div class="cover-thumb" id="cvt-'+esc(p.id)+'" style="'+(cur?'background-image:url(\''+escAttr(cur)+'\')':'')+'">'+(cur?'':'🖼')+'</div>'
        +'<div class="cmain"><div class="ct">'+esc(p.i)+' '+esc(p.l)+'</div>'
        +'<div class="cs">'+esc(p.k)+' · id '+esc(p.id)+(cur?' · cover attiva':'')+'</div></div>'
        +'<div class="ract">'
        +'<button class="btn btn-soft btn-sm" onclick="openCoverModal(\''+escJsAttr(p.id)+'\',\''+escJsAttr(p.l)+'\',\''+escJsAttr(cur)+'\')">Imposta</button>'
        +(cur?'<button class="btn btn-d btn-sm" onclick="removeCover(\''+escJsAttr(p.id)+'\')">✕</button>':'')
        +'</div></div>';
    });
    h+='</div>';
    document.getElementById('main').innerHTML=h;
    setStatus('ok','caricato');
    setTimeout(function(){setStatus('idle','pronto')},1500);
  }catch(e){setStatus('err','errore');toast(e.message,'error')}
}
async function _getDataPages(){
  var d=await ghGet('scripts/js/data.js');
  var s=b64decode(d.content);
  var start=s.indexOf('var pages = [');
  var end=s.indexOf('];',start);
  if(start===-1||end===-1)return [];
  var arr=[];
  s.slice(start+14,end).split('\n').forEach(function(line){
    var m=line.match(/^\s*\{\s*k:\s*(?:"([^"]+)"|'([^']+)')/);
    if(!m)return;
    var obj={k:m[1]||m[2]};
    var lm=line.match(/l:\s*(?:"([^"]*)"|'([^']*)')/);obj.l=lm?(lm[1]||lm[2]):obj.k;
    var im=line.match(/i:\s*(?:"([^"]*)"|'([^']*)')/);obj.i=im?(im[1]||im[2]):'📄';
    var idm=line.match(/id:\s*(?:"([^"]*)"|'([^']*)')/);obj.id=idm?(idm[1]||idm[2]):'';
    arr.push(obj);
  });
  return arr;
}
var _coverCur={};
function openCoverModal(pageId,label,cur){
  if(document.getElementById('cv-modal'))return;
  _coverCur={id:pageId,label:label};
  modalHtml('cv-modal','🖌️ Cover — '+esc(label),
    '<div class="fld"><label>URL immagine</label><input id="cv-url" class="in" value="'+escAttr(cur)+'" oninput="document.getElementById(\'cv-prev\').style.backgroundImage=this.value?\'url(\'+this.value+\')\':\'\'"></div>'
    +'<div class="fld"><label>Oppure carica dal PC</label><div class="upload-zone"><input type="file" accept="image/*" onchange="coverFile(event)"><span class="uzi">🖼</span>Compressa e caricata su /images/</div></div>'
    +'<div class="cover-thumb" id="cv-prev" style="width:100%;height:120px;'+(cur?'background-image:url(\''+escAttr(cur)+'\')':'')+'">'+(cur?'':'Nessuna immagine')+'</div>'
    +'<div class="md-status" id="cv-st"></div>',
    '<button class="btn btn-soft" onclick="closeModal(\'cv-modal\')">Annulla</button>'
    +'<button class="btn btn-p" onclick="saveCover()">SALVA</button>');
  document.getElementById('cv-url').focus();
}
var _coverUploading=null;
function coverFile(event){
  var file=event.target.files[0];
  if(!file)return;
  var reader=new FileReader();
  reader.onload=function(e){
    compressImg(e.target.result,function(b64){
      document.getElementById('cv-prev').style.backgroundImage='url(\''+b64+'\')';
      _coverUploading=b64;
      var st=document.getElementById('cv-st');
      if(st){st.textContent='Immagine pronta: premi SALVA';st.className='md-status ok'}
    });
  };
  reader.readAsDataURL(file);
}
async function saveCover(){
  var val=(document.getElementById('cv-url').value||'').trim();
  var st=document.getElementById('cv-st');
  try{
    if(!val&&_coverUploading){
      if(st){st.textContent='Caricamento su GitHub…';st.className='md-status'}
      val=await arcUploadImage(_coverUploading,'cover-'+_coverCur.id.replace(/\W+/g,'-').slice(0,40)+'-'+Date.now()+'.jpg');
      _coverUploading=null;
    }
    if(!val){if(st){st.textContent='Inserisci un URL o carica un file';st.className='md-status err'}return}
    var ok=await arcSave(_coverCur.id,val);
    if(st){st.textContent=ok?'✓ Salvata':'✕ Errore';st.className='md-status '+(ok?'ok':'err')}
    if(ok){
      closeModal('cv-modal');
      toast('Cover "'+_coverCur.label+'" salvata ✓','success');
      openCovers();
    }
  }catch(e){
    if(st){st.textContent='Errore: '+e.message;st.className='md-status err'}
  }
}
async function removeCover(pageId){
  if(!confirm('Rimuovere la cover di questa pagina?'))return;
  var ok=await arcSave(pageId,'');
  toast(ok?'Cover rimossa':'Errore',ok);
  openCovers();
}

/* ════════════════════════════════════
   NAVIGAZIONE
   ════════════════════════════════════ */
var _navData={pages:[],raw:'',start:0,end:0};
async function openNav(){
  if(_modified&&!confirm('Hai modifiche non salvate. Continuare?'))return;
  _modified=false;
  _current=null;
  setActive('nav');
  closeSidebar();
  setCrumb('Sito','Navigazione');
  setTitle('Menu e sezioni');
  setStatus('saving','caricamento navigazione…');
  try{
    var d=await ghGet('scripts/js/data.js');
    var s=b64decode(d.content);
    var start=s.indexOf('var pages = [');
    var end=s.indexOf('];',start);
    if(start===-1||end===-1)throw new Error('data.js: registro pages non trovato');
    var arr=[];
    s.slice(start+14,end).split('\n').forEach(function(line){
      var m=line.match(/^\s*\{\s*k:\s*(?:"([^"]+)"|'([^']+)')/);
      if(!m)return;
      var obj={k:m[1]||m[2]};
      var lm=line.match(/l:\s*(?:"([^"]*)"|'([^']*)')/);obj.l=lm?(lm[1]||lm[2]):obj.k;
      var im=line.match(/i:\s*(?:"([^"]*)"|'([^']*)')/);obj.i=im?(im[1]||im[2]):'📄';
      var idm=line.match(/id:\s*(?:"([^"]*)"|'([^']*)')/);obj.id=idm?(idm[1]||idm[2]):'';
      var sm=line.match(/sec:\s*(?:"([^"]*)"|'([^']*)')/);obj.sec=sm?(sm[1]||sm[2]):'';
      var um=line.match(/sub:\s*(?:"([^"]*)"|'([^']*)')/);obj.sub=um?(um[1]||um[2]):'';
      var pm=PAGES.find(function(p){return p.k===obj.k});
      if(pm){obj.c=pm.c;if(!obj.l)obj.l=pm.l;if(obj.i==='📄')obj.i=pm.i}
      arr.push(obj);
    });
    _navData={pages:arr,raw:s,start:start,end:end};
    _renderNav();
    setStatus('ok','caricato');
    setTimeout(function(){setStatus('idle','pronto')},1500);
  }catch(e){setStatus('err','errore');toast(e.message,'error')}
}
function _sectionLabel(v){
  var s=SECTIONS.find(function(x){return x.v===v});
  return v?s.l:v;
}
function _navGroupLabel(v){
  return v?_sectionLabel(v):'Principale';
}
function _renderNav(){
  var pages=_navData.pages;
  var groups={};
  pages.forEach(function(p){var v=p.sec||'';if(!groups[v])groups[v]=[];groups[v].push(p)});
  var secKeys=Object.keys(groups);
  secKeys.sort(function(a,b){
    if(a==='')return 1;
    if(b==='')return -1;
    return 0;
  });
  var h=viewHead('🧭','Navigazione','Ordine, sezioni e voci del menu del sito',
    '<button class="btn btn-p" onclick="openNewPageModal()">+ Nuova pagina</button>'
    +'<button class="btn btn-soft" onclick="openNav()">⟳ AGGIORNA</button>');
  h+='<div class="panel-sub">Le frecce riordinano le card della home e il menu. Cambiare sezione aggiorna l\'URL pulito delle pagine personalizzate; la sottosezione serve solo a raggruppare le voci nel menu.</div>';
  secKeys.forEach(function(v){
    var items=groups[v];
    h+='<div class="panel"><div class="panel-head"><h3>'+esc(_navGroupLabel(v))+(v?' <span class="pill gold">'+esc(v)+'</span>':'')+'</h3><span class="hint">'+items.length+' voci</span></div>';
    var subs={};
    items.forEach(function(p){var s=p.sub||'';(subs[s]=subs[s]||[]).push(p)});
    var subKeys=Object.keys(subs);
    subKeys.sort(function(a,b){
      if(a==='')return -1;
      if(b==='')return 1;
      return 0;
    });
    subKeys.forEach(function(sub){
      var subItems=subs[sub];
      if(sub){
        h+='<div class="navm nav-sub" style="padding:8px 12px 2px 12px;border-bottom:none">'
          +'<div style="display:flex;align-items:center;gap:8px">'
          +'<span style="font-size:11px">🗂</span>'
          +'<span class="pill" style="background:rgba(200,155,60,.1);color:var(--gold)">'+esc(sub)+'</span>'
          +'<span class="hint" style="font-size:10px">'+subItems.length+' voci</span>'
          +'</div></div>';
      }
      subItems.forEach(function(p,i){
        var first=i===0,last=i===subItems.length-1;
        h+='<div class="row navm">'
          +'<div class="rico">'+esc(p.i)+'</div>'
          +'<div class="rmain"><div class="rt">'+esc(p.l)+'</div><div class="rs">'+esc(p.k)+' · id '+esc(p.id)+(p.sub?' · '+esc(p.sub):'')+'</div></div>'
          +'<div class="ract">'
          +'<button class="btn btn-soft btn-sm" '+(first?'disabled':'')+' onclick="navMove(\''+escJsAttr(p.k)+'\',-1)" title="Sposta su">↑</button>'
          +'<button class="btn btn-soft btn-sm" '+(last?'disabled':'')+' onclick="navMove(\''+escJsAttr(p.k)+'\',1)" title="Sposta giù">↓</button>'
          +'<select class="in" style="width:auto;padding:5px 8px;font-size:11px" onchange="navSetSec(\''+escJsAttr(p.k)+'\',this.value)">'+_secOptions(p.sec)+'</select>'
          +'<select class="in" style="width:auto;padding:5px 8px;font-size:11px" onchange="navSetSub(\''+escJsAttr(p.k)+'\',this.value)" title="Sottosezione">'+_subOptions(v,p.sub)+'</select>'
          +'<button class="btn btn-soft btn-sm" onclick="navOpen(\''+escJsAttr(p.k)+'\')" title="Apri editor">✏️</button>'
          +'<button class="btn btn-soft btn-sm" onclick="navRename(\''+escJsAttr(p.k)+'\')" title="Rinomina">🔄</button>'
          +(p.c?'<button class="btn btn-d btn-sm" onclick="navDelete(\''+escJsAttr(p.k)+'\')" title="Elimina">🗑</button>':'')
          +'</div></div>';
      });
    });
    h+='</div>';
  });
  document.getElementById('main').innerHTML=h;
}
function _secOptions(cur){
  var h='';
  SECTIONS.forEach(function(s){
    h+='<option value="'+s.v+'"'+(s.v===cur?' selected':'')+'>'+(s.v||'principale')+'</option>';
  });
  return h;
}
function _subOptions(sec,cur){
  var subs={};
  _navData.pages.forEach(function(p){
    if((p.sec||'')===sec&&p.sub)subs[p.sub]=1;
  });
  var keys=Object.keys(subs).sort();
  var h='<option value="">— nessuna —</option>';
  if(cur&&keys.indexOf(cur)===-1){h+='<option value="'+escAttr(cur)+'" selected>'+esc(cur)+'</option>'}
  keys.forEach(function(k){
    h+='<option value="'+escAttr(k)+'"'+(k===cur?' selected':'')+'>'+esc(k)+'</option>';
  });
  h+='<option value="__new__">➕ nuova…</option>';
  return h;
}
function _pagesToText(arr){
  return arr.map(function(p){
    var base='  {k:'+JSON.stringify(p.k)+', l:'+JSON.stringify(p.l)+', i:'+JSON.stringify(p.i)+', id:'+JSON.stringify(p.id)+'';
    if(p.sec)base+=', sec:'+JSON.stringify(p.sec);
    if(p.sub)base+=', sub:'+JSON.stringify(p.sub);
    return base+'}';
  }).join(',\n');
}
async function _writeDataPages(arr){
  var d=await ghGet('scripts/js/data.js');
  var s=b64decode(d.content);
  var start=s.indexOf('var pages = [');
  var end=s.indexOf('];',start);
  if(start===-1||end===-1)throw new Error('data.js: registro pages non trovato');
  var out=s.slice(0,start)+'var pages = [\n'+_pagesToText(arr)+'\n];'+s.slice(end+2);
  await ghPut('scripts/js/data.js','admin: reorder/update nav',out,d.sha);
}
function _swapInNav(a,b){
  var idx=_navData.pages.findIndex(function(p){return p.k===a});
  var jdx=_navData.pages.findIndex(function(p){return p.k===b});
  if(idx===-1||jdx===-1)return;
  var tmp=_navData.pages[idx];
  _navData.pages[idx]=_navData.pages[jdx];
  _navData.pages[jdx]=tmp;
}
async function navMove(slug,dir){
  var idx=_navData.pages.findIndex(function(p){return p.k===slug});
  if(idx===-1)return;
  var target=idx+dir;
  if(target<0||target>=_navData.pages.length)return;
  var cur=_navData.pages[idx].sec||'';
  var nxt=_navData.pages[target].sec||'';
  var curS=_navData.pages[idx].sub||'';
  var nxtS=_navData.pages[target].sub||'';
  if(cur!==nxt||curS!==nxtS)return;
  _swapInNav(slug,_navData.pages[target].k);
  setStatus('saving','salvataggio ordine…');
  try{
    await _writeDataPages(_navData.pages);
    _navData.raw=null;
    toast('Ordine aggiornato! Deploy in corso…','success');
    setStatus('ok','deploying…');
    startDeployTimer();
    await _logAudit('nav_move',slug,{dir:dir});
    _renderNav();
  }catch(e){setStatus('err','errore');toast(e.message,'error')}
}
async function navSetSec(slug,newSec){
  if(!confirm('Cambiare la sezione di "'+slug+'" in "'+(_sectionLabel(newSec)||'principale')+'"?\n\nPer le pagine personalizzate cambierà anche l\'URL pulito.'))return;
  var p=_navData.pages.find(function(x){return x.k===slug});
  if(!p)return;
  var oldSec=p.sec||'';
  p.sec=newSec||'';
  var pi=PAGES.find(function(x){return x.k===slug});
  if(pi)pi.sec=newSec||'';
  setStatus('saving','salvataggio sezione…');
  try{
    await _writeDataPages(_navData.pages);
    if(pi&&p.id&&p.id.indexOf('pag-')===0){
      var pm=await _getPathMap();
      var oldPath=oldSec?(oldSec+'/'+slug):slug;
      var newPath=newSec?(newSec+'/'+slug):slug;
      var d=await ghGet('scripts/js/app.js');
      var s=b64decode(d.content);
      var out=s;
      var r=_removeLine(out,new RegExp("['\"]"+oldPath+"['\"]\\s*:\\s*['\"]"+p.id+"['\"]"));
      if(r.found)out=r.s;
      if(out.indexOf("'"+newPath+"'")===-1){
        out=_arrayInsert(out,'var _pathMap = {','};','  '+JSON.stringify(newPath)+': '+JSON.stringify(p.id)+',\n');
      }
      if(out!==s)await ghPut('scripts/js/app.js','admin: move page '+slug+' to /'+newPath,out,d.sha);
    }
    if(pi){
      await renameInAdminPages(slug,pi.l,pi.i);
      var d2=await ghGet('admin/index.html');
      var s2=b64decode(d2.content);
      var lines=s2.split('\n');
      var start2=s2.indexOf('var PAGES = [');
      var idx2=-1;
      for(var i=0;i<lines.length;i++){
        if(new RegExp('k:["\']'+slug+'["\']').test(lines[i])&&s2.indexOf(lines[i])>start2){idx2=i;break}
      }
      if(idx2!==-1){
        lines[idx2]=lines[idx2].replace(/sec:"[^"]*"/,'sec:"'+newSec+'"');
        await ghPut('admin/index.html','admin: set section '+slug+' = '+newSec,lines.join('\n'),d2.sha);
      }
    }
    toast('Sezione aggiornata! Deploy in corso…','success');
    setStatus('ok','deploying…');
    startDeployTimer();
    await _logAudit('nav_sec',slug,{sec:newSec});
    _renderNav();
  }catch(e){setStatus('err','errore');toast(e.message,'error')}
}
async function navSetSub(slug,val){
  var p=_navData.pages.find(function(x){return x.k===slug});
  if(!p)return;
  if(val==='__new__'){
    var name=prompt('Nome della sottosezione (es. Storia, Razze, Luoghi):');
    if(name===null)return;
    name=name.trim();
    if(!name){toast('Nome non valido','error');return}
    val=name;
  }
  if(val===p.sub)return;
  p.sub=val||'';
  var pi=PAGES.find(function(x){return x.k===slug});
  if(pi)pi.sub=val||'';
  setStatus('saving','salvataggio sottosezione…');
  try{
    await _writeDataPages(_navData.pages);
    if(pi){
      var d=await ghGet('admin/index.html');
      var s=b64decode(d.content);
      var lines=s.split('\n');
      var start2=s.indexOf('var PAGES = [');
      var idx2=-1;
      for(var i=0;i<lines.length;i++){
        if(new RegExp('k:["\']'+slug+'["\']').test(lines[i])&&s.indexOf(lines[i])>start2){idx2=i;break}
      }
      if(idx2!==-1){
        var line=lines[idx2];
        if(val){
          if(line.indexOf('sub:"')!==-1)line=line.replace(/sub:"[^"]*"/,'sub:'+JSON.stringify(val));
          else line=line.replace(/},\s*$/,', sub:'+JSON.stringify(val)+'}');
        }else{
          line=line.replace(/,\s*sub:"[^"]*"/,'');
        }
        lines[idx2]=line;
        await ghPut('admin/index.html','admin: set sub '+slug+' = '+(val||''),lines.join('\n'),d.sha);
      }
    }
    toast('Sottosezione aggiornata! Deploy in corso…','success');
    setStatus('ok','deploying…');
    startDeployTimer();
    await _logAudit('nav_sub',slug,{sub:val});
    _renderNav();
  }catch(e){setStatus('err','errore');toast(e.message,'error')}
}
function navOpen(slug){openByType('page',slug)}
function navRename(slug){
  if(document.getElementById('nr-modal'))return;
  var p=_navData.pages.find(function(x){return x.k===slug});
  if(!p)return;
  modalHtml('nr-modal','🔄 Rinomina — '+esc(p.k),
    '<div class="fld"><label>Nome</label><input id="nr-label" class="in" value="'+escAttr(p.l)+'" onkeydown="if(event.key===\'Enter\')navSaveRename(\''+escJsAttr(p.k)+'\')"></div>'
    +'<div class="fld"><label>Icona (emoji)</label><input id="nr-icon" class="in" value="'+escAttr(p.i)+'"></div>',
    '<button class="btn btn-soft" onclick="closeModal(\'nr-modal\')">Annulla</button>'
    +'<button class="btn btn-p" onclick="navSaveRename(\''+escJsAttr(p.k)+'\')">RINOMINA</button>');
  document.getElementById('nr-label').focus();
}
async function navSaveRename(slug){
  var label=(document.getElementById('nr-label').value||'').trim();
  var icon=(document.getElementById('nr-icon').value||'').trim()||'📄';
  if(!label){toast('Inserisci un nome','error');return}
  var btn=document.querySelector('#nr-modal .btn-p');
  if(btn)btn.disabled=true;
  setStatus('saving','rinomina…');
  try{
    var id=await _getPageId(slug);
    var d=await ghGet(CONTENT+'/pages/'+slug+'.json');
    var json=JSON.parse(b64decode(d.content));
    json.title=label;json.icon=icon;
    await ghPut(CONTENT+'/pages/'+slug+'.json','admin: rename page '+slug,JSON.stringify(json,null,2),d.sha);
    await renameInDataJs(slug,label,icon);
    await renameInAdminPages(slug,label,icon);
    var mi=PAGES.find(function(p){return p.k===slug});
    if(mi){mi.l=label;mi.i=icon}
    if(id&&id.indexOf('pag-')!==0)await renameInIndex(slug,id,label,icon);
    var p=_navData.pages.find(function(x){return x.k===slug});
    if(p){p.l=label;p.i=icon}
    closeModal('nr-modal');
    toast('Sezione rinominata! Deploy in corso…','success');
    setStatus('ok','deploying…');
    startDeployTimer();
    await _logAudit('rename_page',slug,{});
    _renderNav();
  }catch(e){setStatus('err','errore');toast(e.message,'error')}
  if(btn)btn.disabled=false;
}
async function navDelete(slug){
  var p=_navData.pages.find(function(x){return x.k===slug});
  if(!p||!p.c){toast('Le pagine predefinite si eliminano dal loro editor','error');return}
  if(!confirm('Eliminare definitivamente la pagina "'+p.l+'"?\n\nVerranno rimossi contenuto, voce del menu e URL dedicato. Operazione irreversibile.'))return;
  setStatus('saving','eliminazione…');
  try{
    var id=await _getPageId(slug);
    try{
      var d=await ghGet(CONTENT+'/pages/'+slug+'.json');
      await ghDelete(CONTENT+'/pages/'+slug+'.json','admin: delete page '+slug,d.sha);
    }catch(e){}
    await removeFromDataJs(slug);
    if(id)await removeFromPathMap(id);
    await removeFromAdminPages(slug);
    for(var i=0;i<PAGES.length;i++){if(PAGES[i].k===slug){PAGES.splice(i,1);break}}
    for(var j=0;j<_navData.pages.length;j++){if(_navData.pages[j].k===slug){_navData.pages.splice(j,1);break}}
    buildSidebar();
    toast('Pagina eliminata! Deploy in corso…','success');
    setStatus('ok','deploying…');
    startDeployTimer();
    await _logAudit('delete_page',slug,{});
    _renderNav();
  }catch(e){setStatus('err','errore');toast(e.message,'error')}
}

/* ════════════════════════════════════
   IMPOSTAZIONI
   ════════════════════════════════════ */
async function openSettings(){
  if(_modified&&!confirm('Hai modifiche non salvate. Continuare?'))return;
  _modified=false;
  _current=null;
  setActive('settings');
  closeSidebar();
  setCrumb('Sito','Impostazioni');
  setTitle('Impostazioni');
  var defaultView=localStorage.getItem('arc_view_default')||'md';
  var h=viewHead('⚙️','Impostazioni','Configurazione di sezioni, editor e deploy',
    '<button class="btn btn-p" onclick="openSettings()">⟳ AGGIORNA</button>');
  h+='<div class="panel"><div class="panel-head"><h3>Sezioni del menu</h3><span class="hint">usate per raggruppare pagine e generare gli URL</span></div>'
    +'<div class="panel-sub">Le sezioni compaiono nel menu del sito e nella creazione di nuove pagine. La prima voce (vuota) = solo URL.</div>'
    +'<div class="kv-rows" id="sec-rows">';
  SECTIONS.forEach(function(s,i){
    h+='<div class="kv-row">'
      +'<div class="kv-main"><input id="sec-l-'+i+'" class="in" value="'+escAttr(s.l)+'" placeholder="Etichetta"></div>'
      +'<input id="sec-v-'+i+'" class="in" style="width:170px;font-family:var(--mono)" value="'+escAttr(s.v)+'" placeholder="valore URL">'
      +(i===0?'':'<button class="btn btn-d btn-sm" onclick="delSection('+i+')">✕</button>')
      +'</div>';
  });
  h+='</div>'
    +'<div class="se-actions">'
    +'<button class="btn btn-soft btn-sm" onclick="addSection()">+ Sezione</button>'
    +'<button class="btn btn-p btn-sm" onclick="saveSections()">SALVA SEZIONI</button>'
    +'<span class="md-status" id="sec-st" style="margin-left:auto"></span></div></div>';
  h+='<div class="panel"><div class="panel-head"><h3>Editor pagine</h3><span class="hint">preferenze salvate in questo browser</span></div>'
    +'<div class="se-grid"><div class="fld"><label>Vista predefinita dell\'editor</label>'
    +'<select id="set-view" class="in" onchange="setViewPref(this.value)">'
    +'<option value="md"'+(defaultView==='md'?' selected':'')+'>Solo Markdown</option>'
    +'<option value="pv"'+(defaultView==='pv'?' selected':'')+'>Solo anteprima</option>'
    +'</select></div></div>'
    +'<div class="panel-sub" style="margin-top:10px">Scorciatoie: Ctrl+S salva · Ctrl+B grassetto · Ctrl+I corsivo · Ctrl+Z annulla · Tab indenta.</div></div>';
  h+='<div class="grid-2">';
  h+='<div class="panel"><div class="panel-head"><h3>Repository</h3></div>'
    +'<div class="kv-rows">'
    +'<div class="kv-row"><div class="kv-main"><div class="kt">GitHub</div><div class="ks">'+esc(GH_REPO)+' · ramo '+esc(GH_BRANCH)+'</div></div></div>'
    +'<div class="kv-row"><div class="kv-main"><div class="kt">Contenuti</div><div class="ks">pagine wiki sotto /content</div></div></div>'
    +'<div class="kv-row"><div class="kv-main"><div class="kt">Sito</div><div class="ks">https://arcamis.pages.dev</div></div>'
    +'<div class="ract"><a class="btn btn-soft btn-sm" href="https://arcamis.pages.dev" target="_blank" rel="noopener">Apri</a></div></div>'
    +'</div></div>';
  h+='<div class="panel"><div class="panel-head"><h3>Deploy</h3></div>'
    +'<div class="kv-rows">'
    +'<div class="kv-row"><div class="kv-main"><div class="kt">Stato</div><div class="ks" id="dep-status">verifica…</div></div>'
    +'<div class="ract"><button class="btn btn-soft btn-sm" onclick="pingDeployStatus()">⟳</button></div></div>'
    +'<div class="kv-row"><div class="kv-main"><div class="kt">Automatismo</div><div class="ks">dopo ogni salvataggio parte il deploy Cloudflare (~45s)</div></div></div>'
    +'</div></div>';
  h+='</div>';
  document.getElementById('main').innerHTML=h;
  pingDeployStatus();
}
async function pingDeployStatus(){
  var el=document.getElementById('dep-status');
  if(!el)return;
  try{
    var r=await fetch('/api/deploy',{credentials:'include'});
    var j=await r.json();
    if(j.configured)el.textContent='Configurato — stato: '+(j.status||'n/d');
    else el.textContent='Non configurato (auto-deploy su push)';
  }catch(e){el.textContent='Endpoint non raggiungibile'}
}
function setViewPref(v){
  localStorage.setItem('arc_view_default',v);
  _viewMode=v;
  toast('Vista predefinita: '+v,'success');
}
var _secCount=null;
function addSection(){
  var rows=document.getElementById('sec-rows');
  var idx=_secCount===null?(SECTIONS.length-1)+1:null;
  if(_secCount===null)_secCount=SECTIONS.length;
  var i=_secCount++;
  rows.insertAdjacentHTML('beforeend',
    '<div class="kv-row" id="sec-row-'+i+'">'
    +'<div class="kv-main"><input id="sec-l-'+i+'" class="in" value="" placeholder="Etichetta sezione"></div>'
    +'<input id="sec-v-'+i+'" class="in" style="width:170px;font-family:var(--mono)" value="" placeholder="valore URL">'
    +'<button class="btn btn-d btn-sm" onclick="delSection('+i+')">✕</button></div>');
}
function delSection(i){
  var row=document.getElementById('sec-row-'+i);
  if(row)row.remove();
}
async function saveSections(){
  var rows=[];
  var els=document.querySelectorAll('#sec-rows .kv-row');
  var first=true;
  for(var i=0;i<els.length;i++){
    var l=els[i].querySelector('[id^="sec-l-"]').value.trim();
    var v=els[i].querySelector('[id^="sec-v-"]').value.trim();
    if(first){rows.push({v:v,l:l||'— Nessuna (solo URL) —'});first=false;continue}
    if(!l)continue;
    if(!/^[a-z0-9]*$/.test(v)){toast('Valore sezione non valido: solo minuscole e numeri','error');return}
    rows.push({v:v,l:l});
  }
  var st=document.getElementById('sec-st');
  setStatus('saving','salvataggio sezioni…');
  if(st){st.textContent='Salvataggio…';st.className='md-status'}
  try{
    var d=await ghGet('admin/index.html');
    var s=b64decode(d.content);
    var start=s.indexOf('var SECTIONS = [');
    var end=s.indexOf('];',start);
    if(start===-1||end===-1)throw new Error('SECTIONS non trovato in admin/index.html');
    var block='var SECTIONS = [\n'+rows.map(function(r){return '  {v:'+JSON.stringify(r.v)+',l:'+JSON.stringify(r.l)+'}'}).join(',\n')+'\n];';
    await ghPut('admin/index.html','admin: update sections',s.slice(0,start)+block+s.slice(end+2),d.sha);
    var siteRows=rows.filter(function(r){return r.v});
    var d2=await ghGet('scripts/js/data.js');
    var s2=b64decode(d2.content);
    var sBlock='var SECTIONS = [\n'+siteRows.map(function(r){return '  {v:'+JSON.stringify(r.v)+',l:'+JSON.stringify(r.l)+'}'}).join(',\n')+'\n];';
    var st=s2.indexOf('var SECTIONS = [');
    var out;
    if(st===-1){
      var marker='var LAVORI = [';
      var pos=s2.indexOf(marker);
      if(pos===-1)pos=0;
      out=s2.slice(0,pos)+sBlock+'\n\n'+s2.slice(pos);
    }else{
      var en=s2.indexOf('];',st);
      out=s2.slice(0,st)+sBlock+s2.slice(en+2);
    }
    if(out!==s2)await ghPut('scripts/js/data.js','admin: update sections',out,d2.sha);
    SECTIONS.length=0;
    rows.forEach(function(r){SECTIONS.push(r)});
    toast('Sezioni salvate! Deploy in corso…','success');
    setStatus('ok','deploying…');
    startDeployTimer();
    if(st){st.textContent='✓ Salvato';st.className='md-status ok'}
  }catch(e){
    setStatus('err','errore');
    toast('Errore: '+e.message,'error');
    if(st){st.textContent='✕ '+e.message;st.className='md-status err'}
  }
}
