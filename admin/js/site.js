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
    +'<div class="fld"><label>Sfondo — carica dal PC</label><div class="upload-zone" style="padding:10px"><input type="file" accept="image/*" aria-label="Carica immagine sfondo slide" onchange="carSlideUpload(event,'+idx+')"><span class="uzi">🖼</span>Compressa e caricata su /images/</div></div>'
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
    +'<button class="btn btn-p btn-sm" onclick="carSaveSlide('+idx+')" style="margin-right:auto">SALVA SLIDE</button>'
    +'<button class="btn btn-soft btn-sm" onclick="carSaveImg('+idx+')">Sfondo</button>'
    +'<button class="btn btn-soft btn-sm" onclick="carSaveText('+idx+')">Testi</button>'
    +'<button class="btn btn-soft btn-sm" onclick="carSaveBtns('+idx+')">Bottoni</button>'
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
async function carSaveSlide(idx){
  var ok=true;
  _carStatus(idx,'Salvataggio slide…','');
  var imgResult=await (async function(){
    var val=(document.getElementById('cs-img-'+idx).value||'').trim();
    if(!val&&_carUploading&&_carUploading.idx===idx){
      try{
        var name='carousel-'+idx+'-'+Date.now()+'.jpg';
        val=await arcUploadImage(_carUploading.b64,name);
        _carUploading=null;
      }catch(e){_carStatus(idx,'Errore upload: '+e.message,false);return false}
    }
    if(val){
      var key=SLIDES_DEF[idx].key;
      var r=await arcSave(key,val);
      if(r){
        document.getElementById('cs-prev-'+idx).style.backgroundImage='url(\''+val+'\')';
        document.getElementById('cs-prev-'+idx).textContent='';
        document.getElementById('cs-img-'+idx).value=val;
      }
      return r;
    }
    return true;
  })();
  if(!imgResult)ok=false;
  var tag=(document.getElementById('cs-tag-'+idx).value||'').trim();
  var tit=(document.getElementById('cs-tit-'+idx).value||'').trim();
  var desc=(document.getElementById('cs-desc-'+idx).value||'').trim();
  var metaKey=SLIDES_DEF[idx].key+'_meta';
  var textOk=await arcSave(metaKey,JSON.stringify({tag:tag,tit:tit,desc:desc}));
  if(!textOk)ok=false;
  var btnKey=SLIDES_DEF[idx].key;
  var btns=[];
  document.querySelectorAll('#cs-btns-'+idx+' .cs-btni').forEach(function(row){
    var l=row.querySelector('input');
    var h=row.querySelectorAll('input')[1];
    var label=(l&&l.value||'').trim();
    var href=(h&&h.value||'').trim();
    if(label||href)btns.push({label:label,href:href});
  });
  var btnsOk=await arcSave(btnKey+'_btns',JSON.stringify(btns));
  if(!btnsOk)ok=false;
  _carStatus(idx,ok?'✓ Slide salvata':'✕ Salvataggio parziale',ok);
  toast(ok?'Slide '+(idx+1)+' salvata':'Errore slide '+(idx+1),ok);
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
    +'<div class="fld"><label>Oppure carica dal PC</label><div class="upload-zone"><input type="file" accept="image/*" aria-label="Carica immagine cover pagina" onchange="coverFile(event)"><span class="uzi">🖼</span>Compressa e caricata su /images/</div></div>'
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
    '<button class="btn btn-soft" onclick="openNavAudit()" title="Voci morte, doppioni, incoerenze">🩺 Diagnostica</button>'
    +'<button class="btn btn-p" onclick="openNewPageModal()">+ Nuova pagina</button>'
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
async function _writeRegistryPages(arr){
  var d=await ghGet('content/pages/registry.json');
  var reg=JSON.parse(b64decode(d.content));
  var byK={};
  (reg.pages||[]).forEach(function(p){byK[p.k]=p});
  arr.forEach(function(x){
    var p=byK[x.k];
    if(p){p.sec=x.sec||'';if(x.sub!==undefined)p.sub=x.sub||''}
  });
  var ordered=arr.map(function(x){return byK[x.k]}).filter(Boolean);
  var remaining=(reg.pages||[]).filter(function(p){return arr.every(function(x){return x.k!==p.k})});
  reg.pages=ordered.concat(remaining);
  await ghPut('content/pages/registry.json','admin: update nav',JSON.stringify(reg,null,2)+'\n',d.sha);
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
    await _writeRegistryPages(_navData.pages);
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
  p.sec=newSec||'';
  var pi=PAGES.find(function(x){return x.k===slug});
  if(pi)pi.sec=newSec||'';
  setStatus('saving','salvataggio sezione…');
  try{
    await _writeRegistryPages(_navData.pages);
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
    await _writeRegistryPages(_navData.pages);
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
    await renameInRegistry(slug,label,icon);
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
    await removeFromRegistry(slug);
    if(id&&id.indexOf('pag-')!==0)await removeFromIndex(slug,id);
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
   DIAGNOSTICA NAVIGAZIONE
   Rileva voci morte, doppiioni e
   incoerenze tra le voci gp() di index.html
   ════════════════════════════════════ */
var _navAudit=null;
var _NAV_CTX=[
  ['tn-item','Barra superiore'],
  ['mn-item','Menu mobile'],
  ['lcard','Card home'],
  ['bnav-item','Barra inferiore'],
  ['sbtn','Pulsante home'],
  ['fpill','Pill fazione'],
  ['guild-card','Card gilda']
];
function _navCtxOf(line){
  for(var i=0;i<_NAV_CTX.length;i++){if(line.indexOf(_NAV_CTX[i][0])!==-1)return _NAV_CTX[i]}
  return ['altro','Altro'];
}
function _parseGpOccurrences(html){
  var out=[];
  var re=/gp\('([^']+)','([^']*)','([^']*)'\)/g;
  html.split('\n').forEach(function(line,i){
    if(line.indexOf("gp('")===-1)return;
    re.lastIndex=0;
    var m;
    while((m=re.exec(line))){
      var ctx=_navCtxOf(line);
      out.push({ln:i,id:m[1],label:m[2],icon:m[3],ctx:ctx[0],ctxLabel:ctx[1],raw:line});
    }
  });
  return out;
}
async function _fetchDataJsPages(){
  var d=await ghGet('scripts/js/data.js');
  var s=b64decode(d.content);
  var start=s.indexOf('var pages = [');
  var end=s.indexOf('];',start);
  if(start===-1||end===-1)throw new Error('data.js: registro pages non trovato');
  var map={};
  s.slice(start,end).split('\n').forEach(function(line){
    var m=line.match(/^\s*\{\s*k:\s*(?:"([^"]+)"|'([^']+)')/);
    if(!m)return;
    var obj={k:m[1]||m[2],sec:'',sub:''};
    var sm=line.match(/sec:\s*(?:"([^"]*)"|'([^']*)')/);obj.sec=sm?(sm[1]||sm[2]):'';
    var um=line.match(/sub:\s*(?:"([^"]*)"|'([^']*)')/);obj.sub=um?(um[1]||um[2]):'';
    var im=line.match(/i:\s*(?:"([^"]*)"|'([^']*)')/);obj.i=im?(im[1]||im[2]):'📄';
    var lm=line.match(/l:\s*(?:"([^"]*)"|'([^']*)')/);obj.l=lm?(lm[1]||lm[2]):obj.k;
    var idm=line.match(/id:\s*(?:"([^"]*)"|'([^']*)')/);obj.id=idm?(idm[1]||idm[2]):'pag-'+obj.k;
    if(obj.id)map[obj.id]=obj;
  });
  return map;
}
async function openNavAudit(){
  if(_modified&&!confirm('Hai modifiche non salvate. Continuare?'))return;
  _modified=false;
  _current=null;
  setActive('nav');
  closeSidebar();
  setCrumb('Sito','Diagnostica navigazione');
  setTitle('🩺 Diagnostica navigazione');
  setStatus('saving','analisi navigazione…');
  try{
    var results=await Promise.all([ghGet('index.html'),_fetchDataJsPages()]);
    var dHtml=results[0];
    var html=b64decode(dHtml.content);
    var linesArr=html.split('\n');
    var known=results[1];
    var occs=_parseGpOccurrences(html);
    /* raggruppa per id */
    var byId={};
    occs.forEach(function(o){(byId[o.id]=byId[o.id]||[]).push(o)});
    var dead=[],redun=[],dup=[],mismatch=[],unknownLegacy=0,okCount=0;
    Object.keys(byId).forEach(function(id){
      var list=byId[id];
      var k=known[id];
      if(!k){
        if(id.indexOf('pag-')===0){dead.push({id:id,list:list});return}
        unknownLegacy+=list.length;okCount+=list.length;return;
      }
      okCount+=list.length;
      /* voce statica in barra/mobile per pagina già iniettata dal menu dinamico */
      list.forEach(function(o){
        if(k.sec&&(o.ctx==='tn-item'||o.ctx==='mn-item'))redun.push({id:id,occ:o,k:k});
      });
      /* duplicati nello stesso contesto (solo superfici a voce unica:
         i pulsanti/pill della home possono ripetere la stessa pagina) */
      var MENU_CTX={ 'tn-item':1,'mn-item':1,'lcard':1,'bnav-item':1 };
      var ctxMap={};
      list.forEach(function(o){if(MENU_CTX[o.ctx])(ctxMap[o.ctx]=ctxMap[o.ctx]||[]).push(o)});
      Object.keys(ctxMap).forEach(function(c){
        ctxMap[c].slice(1).forEach(function(o){dup.push({id:id,occ:o})});
      });
      /* etichette/iconcine incoerenti */
      var variants={};
      list.forEach(function(o){variants[o.label+'||'+o.icon]=(variants[o.label+'||'+o.icon]||0)+1});
      var vk=Object.keys(variants);
      if(vk.length>1)mismatch.push({id:id,list:list,variants:vk,counts:variants});
    });
    var orphanPages=[];
    Object.keys(known).forEach(function(id){
      if(!byId[id])orphanPages.push(known[id]);
    });
    /* contenitori che resterebbero vuoti dopo le correzioni selezionate */
    var delPreview={};
    dead.forEach(function(d){if(d.list.length)d.list.forEach(function(o){delPreview[o.ln]=1})});
    redun.concat(dup).forEach(function(x){delPreview[x.occ.ln]=1});
    var containers=[];
    /* azione = voce navigabile: gp(), showHome() o link; un contenitore è
       orfano se tutte le sue voci sono state eliminate e non resta nulla di attivo */
    _findContainerBlocks(linesArr).forEach(function(blk){
      var hasAction=false;
      for(var li=blk.start;li<=blk.end;li++){
        if(delPreview[li])continue;
        if(/gp\(|showHome\(|href=/.test(linesArr[li])){hasAction=true;break}
      }
      if(!hasAction)containers.push({start:blk.start,end:blk.end,kind:blk.kind,label:_blockLabel(linesArr,blk)});
    });
    _navAudit={html:html,sha:dHtml.sha,known:known,
      issues:{dead:dead,redun:redun,dup:dup,mismatch:mismatch,containers:containers},
      stats:{total:occs.length,ok:okCount,legacy:unknownLegacy,orphans:orphanPages}};
    _renderNavAudit(orphanPages);
    setStatus('ok','analizzato');
    setTimeout(function(){setStatus('idle','pronto')},1500);
  }catch(e){setStatus('err','errore');toast(e.message,'error')}
}
function _naCtxChip(ctxLabel){
  return '<span class="na-chip">'+esc(ctxLabel)+'</span>';
}
/* ── blocchi contenitore: trova l'intervallo di righe di un <div> bilanciato ── */
var _NA_DIV_OPEN=/<div\b/g,_NA_DIV_CLOSE=/<\/div>/g;
function _divBlockEnd(lines,start){
  var depth=0,i,j,line,m;
  for(i=start;i<lines.length;i++){
    line=lines[i];
    var opens=0,closes=0;
    _NA_DIV_OPEN.lastIndex=0;while((m=_NA_DIV_OPEN.exec(line)))opens++;
    _NA_DIV_CLOSE.lastIndex=0;while((m=_NA_DIV_CLOSE.exec(line)))closes++;
    depth+=opens-closes;
    if(depth<=0)return i;
    if(i-start>400)return i; /* guardia: blocco anomalo */
  }
  return lines.length-1;
}
function _findContainerBlocks(lines){
  var out=[],i;
  for(i=0;i<lines.length;i++){
    if(/class="(?:tn-drop|mn-section)\b/.test(lines[i])){
      var end=_divBlockEnd(lines,i);
      if(end>i)out.push({start:i,end:end,kind:/tn-drop/.test(lines[i])?'dropdown':'sezione mobile'});
      i=end;
    }else if(/class="shead"/.test(lines[i])){
      /* gruppo wiki: shead + cgrid successivo */
      var j,end2=-1;
      for(j=i+1;j<Math.min(i+4,lines.length);j++){
        if(/class="cgrid"/.test(lines[j])){end2=_divBlockEnd(lines,j);break}
        if(/\S/.test(lines[j])&&!/<\/div>/.test(lines[j]))break;
      }
      if(end2>i){out.push({start:i,end:end2,kind:'gruppo wiki'});i=end2}
    }
  }
  return out;
}
function _blockLabel(lines,blk){
  var i,m;
  for(i=blk.start;i<=Math.min(blk.end,blk.start+3);i++){
    if(blk.kind==='dropdown'){
      m=lines[i].match(/id="dd-([^"]+)"/);
      if(m)return m[1];
    }
    m=lines[i].match(/id="mn-sec-([^"]+)"/);
    if(m)return m[1];
  }
  var src=(blk.kind==='gruppo wiki')?lines[blk.start]:(lines[blk.start]+'\n'+(lines[blk.start+1]||''));
  var txt=src.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  return txt||'(senza titolo)';
}
function _renderNavAudit(orphanPages){
  var iss=_navAudit.issues,st=_navAudit.stats;
  var h=viewHead('🩺','Diagnostica navigazione','Voci morte, doppioni, incoerenze e contenitori vuoti delle voci di menu statiche',
    '<button class="btn btn-soft" onclick="openNav()">◀ Navigazione</button>'
    +'<button class="btn btn-p" onclick="openNavAudit()">⟳ RIANALIZZA</button>');
  h+='<div class="panel-sub">La diagnostica confronta le voci statiche di <code>index.html</code> con le pagine registrate in <code>data.js</code>. '
    +'Le sezioni dei menu sono popolate dinamicamente dal registry: una voce statica che punta a una pagina già iniettata nel menu è un doppione.</div>';
  h+='<div class="audit-summary">'
    +'<span class="badge '+(iss.dead.length?'badge-draft':'badge-idle')+'">'+iss.dead.length+' pagine morte</span>'
    +'<span class="badge '+(iss.redun.length?'badge-draft':'badge-idle')+'">'+iss.redun.length+' doppioni</span>'
    +'<span class="badge '+(iss.mismatch.length?'badge-draft':'badge-idle')+'">'+iss.mismatch.length+' incoerenze</span>'
    +'<span class="badge '+(iss.dup.length?'badge-draft':'badge-idle')+'">'+iss.dup.length+' duplicati</span>'
    +'<span class="badge '+(iss.containers.length?'badge-draft':'badge-idle')+'">'+iss.containers.length+' contenitori orfani</span>'
    +'<span class="badge badge-idle">'+st.total+' voci totali</span>'
    +'</div>';
  var anyFix=iss.dead.length||iss.redun.length||iss.dup.length||iss.mismatch.length||iss.containers.length;
  if(anyFix){
    h+='<div style="padding:10px 16px"><button class="btn btn-p" id="na-apply" onclick="applyNavAuditFixes()">APPLICA CORREZIONI SELEZIONATE</button>'
      +'<span style="margin-left:10px;font-size:11px;color:var(--dim)">un unico commit su index.html</span></div>';
  }
  /* ── Morte ── */
  if(iss.dead.length){
    h+='<div class="panel"><div class="panel-head"><h3>🔴 Pagine inesistenti</h3><span class="hint">'+iss.dead.length+' id senza pagina</span></div>';
    h+='<div class="panel-sub">Queste voci di menu portano a nessuna pagina (click senza effetto o errore). Rimuovile, oppure ricrea la pagina con lo stesso indirizzo.</div>';
    iss.dead.forEach(function(d){
      var first=d.list[0];
      var ctxs=d.list.map(function(o){return _naCtxChip(o.ctxLabel)}).join(' ');
      var slug=d.id.replace(/^pag-/,'');
      h+='<div class="row navm">'
        +'<div class="rico"><input type="checkbox" data-na-dead="'+escAttr(d.id)+'" checked title="Rimuovi tutte le voci"></div>'
        +'<div class="rmain"><div class="rt" style="color:var(--red)">'+esc(first.icon)+' '+esc(first.label)+'</div>'
        +'<div class="rs">id <code>'+esc(d.id)+'</code> · '+d.list.length+' voc'+(d.list.length>1?'e':'i')+' '+ctxs+'</div></div>'
        +'<div class="ract"><button class="btn btn-soft btn-sm" onclick="openNewPageModal(\''+escJsAttr(first.label)+'\',\''+escJsAttr(slug)+'\')">➕ Crea pagina</button></div>'
        +'</div>';
    });
    h+='</div>';
  }
  /* ── Doppie dinamiche ── */
  if(iss.redun.length){
    h+='<div class="panel"><div class="panel-head"><h3>🟠 Voci duplicate dal menu dinamico</h3><span class="hint">'+iss.redun.length+' voci</span></div>';
    h+='<div class="panel-sub">Le sezioni dei menu sono popolate automaticamente dal registry: queste voci statiche generano un doppione visibile. Rimuovile (la pagina resta nel menu).</div>';
    iss.redun.forEach(function(r){
      h+='<div class="row navm">'
        +'<div class="rico"><input type="checkbox" data-na-line="'+r.occ.ln+'" checked></div>'
        +'<div class="rmain"><div class="rt">'+esc(r.k.i)+' '+esc(r.k.l)+'</div>'
        +'<div class="rs">voce statica '+_naCtxChip(r.occ.ctxLabel)+' · già presente nella sezione «'+esc(_sectionLabel(r.k.sec))+'» del menu dinamico</div></div>'
        +'</div>';
    });
    h+='</div>';
  }
  /* ── Incoerenti ── */
  if(iss.mismatch.length){
    h+='<div class="panel"><div class="panel-head"><h3>🟠 Etichette / icone incoerenti</h3><span class="hint">'+iss.mismatch.length+' pagine</span></div>';
    h+='<div class="panel-sub">Lo stesso id appare con testi o icone diverse. Scegli la versione corretta: verrà applicata a tutte le occorrenze.</div>';
    iss.mismatch.forEach(function(m){
      var variants=m.variants.map(function(v,i){
        var parts=v.split('||');
        return '<label class="na-var"><input type="radio" name="na-mm-'+escAttr(m.id)+'" data-mm-label="'+escAttr(parts[0])+'" data-mm-icon="'+escAttr(parts[1])+'"'+(i===0?' checked':'')+'>'
          +parts[1]+' '+esc(parts[0])+' <span class="hint">×'+m.counts[v]+'</span></label>';
      }).join('');
      h+='<div class="row navm"><div class="rico">'+esc(m.list[0].icon)+'</div>'
        +'<div class="rmain"><div class="rt">'+esc(m.id)+'</div><div class="rs na-variants">'+variants+'</div></div></div>';
    });
    h+='</div>';
  }
  /* ── Dup stesso contesto ── */
  if(iss.dup.length){
    h+='<div class="panel"><div class="panel-head"><h3>🟡 Duplicati nello stesso contesto</h3><span class="hint">'+iss.dup.length+'</span></div>';
    iss.dup.forEach(function(d){
      h+='<div class="row navm">'
        +'<div class="rico"><input type="checkbox" data-na-line="'+d.occ.ln+'" checked></div>'
        +'<div class="rmain"><div class="rt">'+esc(d.occ.icon)+' '+esc(d.occ.label)+'</div>'
        +'<div class="rs">ripetuto in '+_naCtxChip(d.occ.ctxLabel)+'</div></div></div>';
    });
    h+='</div>';
  }
  /* ── Contenitori orfani ── */
  if(iss.containers.length){
    h+='<div class="panel"><div class="panel-head"><h3>⚪ Contenitori orfani</h3><span class="hint">'+iss.containers.length+' blocchi</span></div>';
    h+='<div class="panel-sub">Dopo le correzioni selezionate questi blocchi resterebbero vuoti (dropdown senza voci, gruppi di card senza card). '
      +'I menu e le sezioni vengono ricostruiti automaticamente dal registry quando serviranno: rimuoverli è sicuro.</div>';
    iss.containers.forEach(function(c){
      h+='<div class="row navm">'
        +'<div class="rico na-check"><input type="checkbox" data-na-block="'+c.start+':'+c.end+'" checked></div>'
        +'<div class="rmain"><div class="rt">'+esc(c.label)+'</div>'
        +'<div class="rs">'+esc(c.kind)+' · righe '+(c.start+1)+'–'+(c.end+1)+' · nessuna voce valida all\'interno</div></div>'
        +'</div>';
    });
    h+='</div>';
  }
  if(!anyFix){
    h+='<div class="empty"><span class="ei">✅</span>Nessun problema trovato nella navigazione</div>';
  }
  h+='<div class="panel"><div class="panel-head"><h3>ℹ️ Informativa</h3></div><div class="panel-sub" style="padding:0 14px 12px">'
    +st.ok+' voci valide · '+st.legacy+' id legacy non verificabili · '+st.orphans.length+' pagine registrate senza voce statica'
    +(st.orphans.length?' (raggiungibili dai menu dinamici e dalla ricerca: '+esc(st.orphans.slice(0,6).map(function(p){return p.k}).join(', '))+(st.orphans.length>6?'…':'')+')':'')
    +'</div></div>';
  document.getElementById('main').innerHTML=h;
}
async function applyNavAuditFixes(){
  if(!_navAudit)return;
  var iss=_navAudit.issues;
  var deadSel={},lineDel={},blockDel=[],mmSel={};
  document.querySelectorAll('[data-na-dead]').forEach(function(cb){
    if(cb.checked)deadSel[cb.getAttribute('data-na-dead')]=1;
  });
  document.querySelectorAll('[data-na-line]').forEach(function(cb){
    if(cb.checked)lineDel[cb.getAttribute('data-na-line')]=1;
  });
  document.querySelectorAll('[data-na-block]').forEach(function(cb){
    if(cb.checked){
      var p=cb.getAttribute('data-na-block').split(':');
      blockDel.push({s:parseInt(p[0],10),e:parseInt(p[1],10)});
    }
  });
  document.querySelectorAll('input[type="radio"][data-mm-label]').forEach(function(r){
    if(r.checked){
      var id=r.name.replace('na-mm-','');
      mmSel[id]={label:r.getAttribute('data-mm-label'),icon:r.getAttribute('data-mm-icon')};
    }
  });
  var nDead=Object.keys(deadSel).length,nLines=Object.keys(lineDel).length,
      nBlocks=blockDel.length,nMm=Object.keys(mmSel).length;
  if(!nDead&&!nLines&&!nBlocks&&!nMm){toast('Seleziona almeno una correzione','error');return}
  var btn=document.getElementById('na-apply');
  if(btn)btn.disabled=true;
  setStatus('saving','applicazione correzioni…');
  try{
    var lines=_navAudit.html.split('\n');
    /* spazio indice unificato: righe singole + intervalli di blocco */
    var delSet={};
    iss.dead.forEach(function(d){if(deadSel[d.id])d.list.forEach(function(o){delSet[o.ln]=1})});
    iss.redun.concat(iss.dup).forEach(function(x){if(lineDel[x.occ.ln])delSet[x.occ.ln]=1});
    blockDel.forEach(function(b){for(var i=b.s;i<=b.e;i++)delSet[i]=1});
    var kept=[];
    lines.forEach(function(l,i){if(!delSet[i])kept.push(l)});
    var html=kept.join('\n');
    var nRemoved=Object.keys(delSet).length;
    Object.keys(mmSel).forEach(function(id){
      html=_rewriteIndexForPage(html,id,mmSel[id].label,mmSel[id].icon);
    });
    await ghPut('index.html','admin: pulizia navigazione ('+nRemoved+' righe, '+nBlocks+' contenitori, '+nMm+' etichette unificate)',html,_navAudit.sha);
    _navAudit=null;
    toast('Navigazione ripulita! Deploy in corso (~30s)...','success');
    setStatus('ok','deploying...');
    startDeployTimer();
    await _logAudit('nav_audit_fix',{dead:nDead,lines:nRemoved,blocks:nBlocks,mismatch:nMm});
    openNavAudit();
  }catch(e){
    setStatus('err','errore');toast(e.message,'error');
    if(btn)btn.disabled=false;
  }
}

/* ════════════════════════════════════
   IMPOSTAZIONI
   ════════════════════════════════════ */
async function openSettings(){
  if(_modified&&!confirm('Hai modifiche non salvate. Continuare?'))return;
  _modified=false;
  _current=null;
  _secCount=null;
  setActive('settings');
  closeSidebar();
  setCrumb('Sito','Impostazioni');
  setTitle('Impostazioni');
  var defaultView=localStorage.getItem('arc_view_default')||'md';
  var h=viewHead('⚙️','Impostazioni','Configurazione di sezioni, editor e deploy',
    '<button class="btn btn-p" onclick="openSettings()">⟳ AGGIORNA</button>');
  h+='<div class="panel"><div class="panel-head"><h3>Sezioni del menu</h3><span class="hint">usate per raggruppare pagine e generare gli URL</span></div>'
    +'<div class="panel-sub">Le sezioni compaiono nel menu del sito e nella creazione di nuove pagine. Elimina una riga per togliere la sezione, usa ↑/↓ per riordinare (le modifiche valgono dopo SALVA SEZIONI).</div>'
    +'<div class="kv-rows" id="sec-rows">';
  SECTIONS.forEach(function(s,i){
    h+='<div class="kv-row" id="sec-row-'+i+'">'
      +'<div class="kv-main"><input id="sec-l-'+i+'" class="in" value="'+escAttr(s.l)+'" placeholder="Etichetta"></div>'
      +'<input id="sec-v-'+i+'" class="in" style="width:170px;font-family:var(--mono)" value="'+escAttr(s.v)+'" placeholder="valore URL">'
      +'<button class="btn btn-soft btn-sm" title="Sposta su" onclick="moveSection('+i+',-1)">↑</button>'
      +'<button class="btn btn-soft btn-sm" title="Sposta giù" onclick="moveSection('+i+',1)">↓</button>'
      +'<button class="btn btn-d btn-sm" title="Elimina sezione" onclick="delSection('+i+')">✕</button>'
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
  h+='<div class="panel"><div class="panel-head"><h3>Banner del sito</h3><span class="hint">messaggio mostrato prima di entrare nel sito</span></div>'
    +'<div class="kv-rows">'
    +'<div class="kv-row"><div class="kv-main"><div class="kt">Mostra banner</div><div class="ks">visualizza un banner fisso in cima al sito</div></div>'
    +'<label class="toggle"><input type="checkbox" id="set-banner-on"><span class="slider"></span></label></div>'
    +'</div>'
    +'<div class="se-grid" style="margin-top:12px"><div class="fld" style="grid-column:1/-1"><label>Testo del banner</label>'
    +'<textarea id="set-banner-text" class="in" rows="2" style="width:100%;resize:vertical" placeholder="Sito in manutenzione — alcune funzionalità potrebbero non essere disponibili"></textarea>'
    +'</div></div>'
    +'<div class="se-actions" style="margin-top:10px">'
    +'<button class="btn btn-p btn-sm" onclick="saveBanner()">SALVA BANNER</button>'
    +'<span class="md-status" id="banner-st" style="margin-left:auto"></span></div></div>';
  h+='<div class="panel"><div class="panel-head"><h3>Disclaimer / Progetto fanmade</h3><span class="hint">overlay mostrato prima di entrare nel sito</span></div>'
    +'<div class="kv-rows">'
    +'<div class="kv-row"><div class="kv-main"><div class="kt">Mostra disclaimer</div><div class="ks">mostra un overlay prima di accedere al sito (una tantum)</div></div>'
    +'<label class="toggle"><input type="checkbox" id="set-disclaimer-on"><span class="slider"></span></label></div>'
    +'</div>'
    +'<div class="se-grid" style="margin-top:12px"><div class="fld" style="grid-column:1/-1"><label>Testo del disclaimer</label>'
    +'<textarea id="set-disclaimer-text" class="in" rows="5" style="width:100%;resize:vertical" placeholder="Arcamis è un progetto fanmade non ufficiale..."></textarea>'
    +'</div></div>'
    +'<div class="se-actions" style="margin-top:10px">'
    +'<button class="btn btn-p btn-sm" onclick="saveDisclaimer()">SALVA DISCLAIMER</button>'
    +'<span class="md-status" id="disclaimer-st" style="margin-left:auto"></span></div></div>';
  h+='<div class="panel"><div class="panel-head"><h3>Notifiche Discord</h3><span class="hint">webhook per notifiche automatiche</span></div>'
    +'<div class="kv-rows">'
    +'<div class="kv-row"><div class="kv-main"><div class="kt">Abilita webhook</div><div class="ks">invia notifiche Discord su eventi admin</div></div>'
    +'<label class="toggle"><input type="checkbox" id="set-webhook-on"><span class="slider"></span></label></div>'
    +'</div>'
    +'<div class="se-grid" style="margin-top:12px"><div class="fld" style="grid-column:1/-1"><label>URL webhook Discord</label>'
    +'<input id="set-webhook-url" class="in" placeholder="https://discord.com/api/webhooks/…" style="width:100%;font-family:var(--mono)"></div></div>'
    +'<div class="se-actions" style="margin-top:10px">'
    +'<button class="btn btn-soft btn-sm" onclick="testWebhook()">TEST</button>'
    +'<button class="btn btn-p btn-sm" onclick="saveWebhook()">SALVA WEBHOOK</button>'
    +'<span class="md-status" id="webhook-st" style="margin-left:auto"></span></div></div>';
  h+='<div class="panel"><div class="panel-head"><h3>Statistiche</h3><span class="hint">panoramica visitatori</span></div>'
    +'<div id="analytics-body"><div class="empty" style="padding:22px"><span class="ei">⏳</span>Caricamento…</div></div></div>';
  h+='<div class="grid-2">';
  h+='<div class="panel"><div class="panel-head"><h3>Repository</h3></div>'
    +'<div class="kv-rows">'
    +'<div class="kv-row"><div class="kv-main"><div class="kt">GitHub</div><div class="ks">'+esc(GH_REPO)+' · ramo '+esc(GH_BRANCH)+'</div></div></div>'
    +'<div class="kv-row"><div class="kv-main"><div class="kt">Contenuti</div><div class="ks">pagine wiki sotto /content</div></div></div>'
    +'<div class="kv-row"><div class="kv-main"><div class="kt">GitHub token</div><div class="ks" id="gh-token-st">verifica…</div></div>'
    +'<div class="ract"><button class="btn btn-soft btn-sm" onclick="openGHTokenModal()">Configura</button></div></div>'
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
  refreshGHTokenStatus();
  loadSiteSettings();
  loadWebhookStatus();
  loadAnalytics();
}
async function refreshGHTokenStatus(){
  var el=document.getElementById('gh-token-st');
  if(!el)return;
  try{
    var r=await fetch('/api/admin?action=gh_token_status',{credentials:'include'});
    var j=await r.json();
    if(j.configured)el.textContent=j.source==='env'?'Configurato (variabile d\'ambiente)':'Configurato (server)';
    else el.textContent='Non configurato — il proxy GitHub non funziona';
  }catch(e){el.textContent='non verificabile'}
}
async function loadSiteSettings(){
  try{
    var r=await fetch('/api/admin?action=get_site_settings',{credentials:'include'});
    var j=await r.json();
    var s=j.settings||{};
    var bOn=document.getElementById('set-banner-on');
    var bTxt=document.getElementById('set-banner-text');
    if(bOn)bOn.checked=!!s.banner_enabled;
    if(bTxt)bTxt.value=s.banner_text||'';
    var dOn=document.getElementById('set-disclaimer-on');
    var dTxt=document.getElementById('set-disclaimer-text');
    if(dOn)dOn.checked=!!s.disclaimer_enabled;
    if(dTxt)dTxt.value=s.disclaimer_text||'';
  }catch(e){}
}
async function saveBanner(){
  var bOn=document.getElementById('set-banner-on');
  var bTxt=document.getElementById('set-banner-text');
  var st=document.getElementById('banner-st');
  if(!bOn||!bTxt)return;
  if(st)st.textContent='Salvataggio…';
  try{
    var r=await fetch('/api/admin?action=set_site_settings',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({settings:{banner_enabled:bOn.checked,banner_text:bTxt.value.trim()}})});
    var j=await r.json();
    if(j.ok){if(st){st.textContent='✓';setTimeout(function(){st.textContent='';},2000);}}
    else{if(st)st.textContent='Errore';}
  }catch(e){if(st)st.textContent='Errore di rete';}
}
async function saveDisclaimer(){
  var dOn=document.getElementById('set-disclaimer-on');
  var dTxt=document.getElementById('set-disclaimer-text');
  var st=document.getElementById('disclaimer-st');
  if(!dOn||!dTxt)return;
  if(st)st.textContent='Salvataggio…';
  try{
    var r=await fetch('/api/admin?action=set_site_settings',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({settings:{disclaimer_enabled:dOn.checked,disclaimer_text:dTxt.value.trim()}})});
    var j=await r.json();
    if(j.ok){if(st){st.textContent='✓';setTimeout(function(){st.textContent='';},2000);}}
    else{if(st)st.textContent='Errore';}
  }catch(e){if(st)st.textContent='Errore di rete';}
}
function openGHTokenModal(){
  var id='gh-token-modal';
  modalHtml(id,'🔑 GitHub token',
    '<div class="fld"><label>Personal Access Token (scope repo)</label>'
    +'<input id="gh-token-in" class="in" type="password" placeholder="ghp_…" autocomplete="off" style="font-family:var(--mono)"></div>'
    +'<div class="panel-sub">Il token viene salvato solo lato server (KV ARCAMIS_CACHE) e usato dal proxy /api/gh; non esce mai dal server. Generane uno con scope minimo in GitHub → Settings → Developer settings → Personal access tokens (classic, permesso repo).</div>'
    +'<div class="md-status" id="gh-token-st-msg"></div>',
    '<button class="btn btn-soft" onclick="closeModal(\''+id+'\')">Annulla</button>'
    +'<button class="btn btn-p" onclick="saveGhToken()">SALVA</button>');
}
async function saveGhToken(){
  var st=document.getElementById('gh-token-st-msg');
  var inp=document.getElementById('gh-token-in');
  var token=inp?(inp.value||'').trim():'';
  if(!token){if(st){st.textContent='Inserisci il token';st.className='md-status err'};return}
  try{
    var r=await fetch('/api/admin?action=set_gh_token',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:token})});
    var j=await r.json();
    if(!r.ok)throw new Error(j.error||('Errore '+r.status));
    closeModal('gh-token-modal');
    toast('Token GitHub salvato','success');
    refreshGHTokenStatus();
  }catch(e){if(st){st.textContent='Errore: '+e.message;st.className='md-status err'}}
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
    +'<button class="btn btn-soft btn-sm" title="Sposta su" onclick="moveSection('+i+',-1)">↑</button>'
    +'<button class="btn btn-soft btn-sm" title="Sposta giù" onclick="moveSection('+i+',1)">↓</button>'
    +'<button class="btn btn-d btn-sm" title="Elimina sezione" onclick="delSection('+i+')">✕</button></div>');
}
function moveSection(i,dir){
  var row=document.getElementById('sec-row-'+i);
  if(!row)return;
  var sib=dir<0?row.previousElementSibling:row.nextElementSibling;
  if(!sib)return;
  var wrap=document.getElementById('sec-rows');
  if(dir<0)wrap.insertBefore(row,sib);
  else wrap.insertBefore(sib,row);
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
    var d0=await ghGet('content/pages/registry.json');
    var reg=JSON.parse(b64decode(d0.content));
    var byV={};
    (reg.sections||[]).forEach(function(s){byV[s.v]=s});
    reg.sections=rows.map(function(r){
      var prev=byV[r.v]||{};
      var s={v:r.v,l:r.l};
      if(prev.pages)s.pages=prev.pages;
      if(r.v===''||prev.adminOnly)s.adminOnly=true;
      return s;
    });
    var regOut=JSON.stringify(reg,null,2)+'\n';
    if(regOut!==b64decode(d0.content))await ghPut('content/pages/registry.json','admin: update sections',regOut,d0.sha);
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

/* ════════════════════════════════════
   WEBHOOK DISCORD
   ════════════════════════════════════ */
async function loadWebhookStatus(){
  try{
    var r=await fetch('/api/admin?action=get_webhook',{credentials:'include'});
    var j=await r.json();
    var w=j.webhook||{};
    var on=document.getElementById('set-webhook-on');
    var url=document.getElementById('set-webhook-url');
    if(on)on.checked=!!w.enabled;
    if(url)url.value=w.url||'';
  }catch(e){}
}
async function saveWebhook(){
  var on=document.getElementById('set-webhook-on');
  var url=document.getElementById('set-webhook-url');
  var st=document.getElementById('webhook-st');
  if(!on||!url)return;
  if(st){st.textContent='Salvataggio…';st.className='md-status'}
  try{
    var r=await _authPost('/api/admin?action=set_webhook',{enabled:on.checked,url:url.value.trim()});
    var j=await r.json();
    if(!j.ok)throw new Error(j.error||'Errore');
    if(st){st.textContent='✓ Salvato';st.className='md-status ok'}
    setTimeout(function(){if(st)st.textContent='';},2000);
    toast('Webhook Discord salvato','success');
  }catch(e){if(st){st.textContent='✕ '+e.message;st.className='md-status err'}}
}
async function testWebhook(){
  var st=document.getElementById('webhook-st');
  if(st){st.textContent='Invio test…';st.className='md-status'}
  try{
    var r=await _authPost('/api/admin?action=test_webhook',{});
    var j=await r.json();
    if(!j.ok)throw new Error(j.error||'Invio fallito');
    if(st){st.textContent='✓ Messaggio inviato! Controlla Discord';st.className='md-status ok'}
    setTimeout(function(){if(st)st.textContent='';},3000);
    toast('Test inviato su Discord','success');
  }catch(e){if(st){st.textContent='✕ '+e.message;st.className='md-status err'}}
}

/* ════════════════════════════════════
   ANALYTICS PANEL
   ════════════════════════════════════ */
async function loadAnalytics(){
  var box=document.getElementById('analytics-body');
  try{
    var r=await fetch('/api/admin?action=get_analytics',{credentials:'include'});
    var j=await r.json();
    var pages=j.pages||[];
    var total=j.total||0;
    if(!box)return;
    if(!pages.length){box.innerHTML='<div class="empty" style="padding:22px"><span class="ei">📊</span>Nessun dato disponibile</div>';return}
    var h='<div class="kv-rows">'
      +'<div class="kv-row"><div class="kv-main"><div class="kt">Visualizzazioni totali</div><div class="ks">'+total.toLocaleString('it-IT')+'</div></div></div>'
      +'</div>';
    h+='<div class="panel-head" style="margin-top:12px"><h3 style="font-size:12px">Pagine più visitate</h3></div>';
    var top=pages.sort(function(a,b){return (b.views||0)-(a.views||0)}).slice(0,10);
    top.forEach(function(p,i){
      h+='<div class="act-item"><div class="act-dot" style="background:var(--acc)"></div>'
        +'<div class="act-main"><div class="act-t"><b>#'+(i+1)+'</b> '+esc(p.pageKey||'')+'</div>'
        +'<div class="act-s">'+(p.views||0)+' visualizzazioni</div></div></div>';
    });
    box.innerHTML=h;
  }catch(e){if(box)box.innerHTML='<div class="empty" style="padding:22px"><span class="ei">⚠️</span>Statistiche non disponibili</div>'}
}

/* ════════════════════════════════════
   MEDIA ORGANIZATION (images helpers)
   ════════════════════════════════════ */
var _imgSortBy='name';
var _imgViewMode='grid';
var _imgFilter='';
var _imgPageOffset=0;
var _imgPageSize=20;
var _imgAllItems=[];
function _imgSkeleton(){
  return '<div class="img-card img-skeleton"><div class="skel-img"></div><div class="ic-body"><div class="skel-line" style="width:80%"></div><div class="skel-line" style="width:50%"></div></div></div>';
}
function _imgLoadMore(){
  _imgPageOffset+=_imgPageSize;
  _imgRenderGrid(_imgAllItems);
}
function _imgRenderGrid(items){
  var grid=document.getElementById('img-grid');
  if(!grid)return;
  var end=Math.min(_imgPageOffset+_imgPageSize,items.length);
  var html='';
  for(var i=_imgPageOffset;i<end;i++){html+=_imgCard(items[i])}
  grid.insertAdjacentHTML('beforeend',html);
  var loadMore=document.getElementById('img-load-more');
  if(loadMore){loadMore.remove()}
  if(end<items.length){
    var remaining=items.length-end;
    var btn='<div id="img-load-more" style="text-align:center;padding:16px"><button class="btn btn-soft" onclick="_imgLoadMore()">Carica altre '+Math.min(remaining,_imgPageSize)+' immagini ('+remaining+' rimaste)</button></div>';
    grid.insertAdjacentHTML('afterend',btn);
  }
}
function _imgSortItems(items,by){
  var arr=items.slice();
  if(by==='name')arr.sort(function(a,b){return (a.name||'').localeCompare(b.name||'')});
  else if(by==='date')arr.sort(function(a,b){return (b.lastModified||'').localeCompare(a.lastModified||'')});
  else if(by==='size')arr.sort(function(a,b){return (b.size||0)-(a.size||0)});
  return arr;
}
function _imgFilterItems(items,q){
  if(!q)return items;
  q=q.toLowerCase();
  return items.filter(function(it){return (it.name||'').toLowerCase().indexOf(q)!==-1});
}

/* ═══════════════ REGISTRAZIONE NAMESPACE ═══════════════ */
ArcAdmin.register('site', {
  save: arcSave,
  getCovers: arcGetCovers,
  uploadImage: arcUploadImage,
  openCarousel: openCarousel,
  carSlideUpload: carSlideUpload,
  carSaveImg: carSaveImg,
  carRemoveImg: carRemoveImg,
  carSaveText: carSaveText,
  carSaveBtns: carSaveBtns,
  openCovers: openCovers,
  openCoverModal: openCoverModal,
  coverFile: coverFile,
  saveCover: saveCover,
  removeCover: removeCover,
  openNav: openNav,
  navMove: navMove,
  navSetSec: navSetSec,
  navSetSub: navSetSub,
  openSettings: openSettings,
  saveWebhook: saveWebhook,
  testWebhook: testWebhook,
  loadWebhookStatus: loadWebhookStatus,
  loadAnalytics: loadAnalytics,
  imgSort: _imgSortItems,
  imgFilter: _imgFilterItems
});
