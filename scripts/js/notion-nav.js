/* ════════════════════════════════════
   notion-nav.js
   Navigazione SPA: gp(), _gpRender(),
   gpBack(), buildCrumb(), glossario,
   history API.
════════════════════════════════════ */

var navStack = [];
var _memCache = {};

/* ════════════════════════════════════
   BACK NAVIGATION
════════════════════════════════════ */
function gpBack(stackIdx){
  var item=navStack[stackIdx];
  if(!item)return;
  navStack=navStack.slice(0,stackIdx);
  history.pushState({id:item.id,label:item.label,icon:item.icon,stack:navStack.slice()},'',(location.pathname+'?p='+item.id));
  _gpRender(item.id,item.label,item.icon);
}

function buildCrumb(currentLabel){
  var h='<span class="ph-bc" onclick="showHome()">🏰 Home</span>';
  for(var ci=0;ci<navStack.length-1;ci++){
    var it=navStack[ci];
    h+='<span class="ph-sep"> › </span>'
      +'<span class="ph-bc-mid" onclick="gpBack('+ci+')">'+(it.icon||'')+'&nbsp;'+it.label+'</span>';
  }
  h+='<span class="ph-sep"> › </span><span class="ph-cur">'+currentLabel+'</span>';
  return h;
}

/* ════════════════════════════════════
   OPEN PAGE — gp()
════════════════════════════════════ */
async function gp(id,label,icon,_fromPop){
  if(!id||id==='undefined'||id==='null')return;

  if(!_fromPop){
    navStack.push({id:id,label:label,icon:icon});
    history.pushState({id:id,label:label,icon:icon,stack:navStack.slice(0,-1)},'',location.pathname+'?p='+id);
  }

  setNav('');

  var phTitle=document.getElementById('ph-title');
  var phIcon=document.getElementById('ph-icon');
  var phCrumb=document.getElementById('ph-crumb');
  var phCovbg=document.getElementById('ph-covbg');
  var phOverlay=document.getElementById('ph-overlay');
  var phEyebrow=document.getElementById('ph-eyebrow');
  var phSub=document.getElementById('ph-sub');
  var phHero=document.getElementById('page-hero');
  var hv=document.getElementById('hv');
  var pv=document.getElementById('pv');

  phTitle.textContent=label||'';
  phIcon.textContent=icon||'';
  phCovbg.style.backgroundImage='';
  phEyebrow.textContent='';
  phSub.textContent='';
  phHero.style.removeProperty('--ph-acc');
  phHero.style.removeProperty('--ph-accbg');
  phCrumb.innerHTML=buildCrumb(label||'');
  document.title=(label||'Pagina')+' — Arcamis';

  if(hv.style.display==='block'){
    xfade(hv,pv);
    document.getElementById('main').scrollTo({top:0,behavior:'smooth'});
    await _gpRender(id,label,icon);
  }else{
    document.getElementById('main').scrollTo({top:0,behavior:'smooth'});
    var _pb=document.getElementById('pbody');
    _pb.style.opacity='0';
    _pb.style.transition='opacity .15s ease';
    await _gpRender(id,label,icon);
    _pb.style.opacity='1';
  }
}

/* ════════════════════════════════════
   _gpRender — fetch + render pagina
════════════════════════════════════ */
async function _gpRender(id,label,icon){
  if(!id||id==='undefined'||id==='null'){
    if(typeof afterPageRender==='function')afterPageRender();
    return;
  }

  var phTitle=document.getElementById('ph-title');
  var phIcon=document.getElementById('ph-icon');
  var phCovbg=document.getElementById('ph-covbg');
  var phOverlay=document.getElementById('ph-overlay');
  var phEyebrow=document.getElementById('ph-eyebrow');
  var phSub=document.getElementById('ph-sub');
  var phHero=document.getElementById('page-hero');
  var phCrumb=document.getElementById('ph-crumb');

  var cacheKey='pg_'+id;
  var data=_memCache[cacheKey]||null;
  if(!data){try{var _ss=sessionStorage.getItem(cacheKey);if(_ss)data=JSON.parse(_ss);}catch(e){}}
  if(data)_memCache[cacheKey]=data;

  try{
    if(!data){
      var timeout=new Promise(function(_,rej){setTimeout(function(){rej(new Error('Timeout'))},25000)});
      var r=await Promise.race([fetch('/api/notion?pageId='+id),timeout]);
      if(!r.ok)throw new Error('HTTP '+r.status);
      data=await r.json();
      _memCache[cacheKey]=data;
      try{sessionStorage.setItem(cacheKey,JSON.stringify(data));}catch(e){}
    }

    var pg=data.page,bl=data.blocks;
    var ta=pg.properties&&pg.properties.title&&pg.properties.title.title||[];
    var ptitle=ta.map(function(t){return t.plain_text}).join('')||label||'Pagina';
    var picon=pg.icon&&pg.icon.emoji?pg.icon.emoji:(icon||'📄');

    phTitle.textContent=ptitle;
    phIcon.textContent=picon;
    phEyebrow.textContent='Archivi di Arcamis';
    document.title=ptitle+' — Arcamis';
    phCrumb.innerHTML=buildCrumb(ptitle);

    var acc=iconAccent(picon);
    phHero.style.setProperty('--ph-acc',acc.c);
    phHero.style.setProperty('--ph-accbg',acc.bg);

    /* Cover */
    var coverUrl=null;
    if(pg.cover){
      coverUrl=pg.cover.type==='external'?pg.cover.external.url:(pg.cover.file&&pg.cover.file.url);
    }
    if(!coverUrl){
      var firstImg=bl.find(function(blk){return blk.type==='image'});
      if(firstImg){var fi=firstImg.image;coverUrl=fi&&fi.type==='external'?fi.external.url:(fi&&fi.file&&fi.file.url);}
    }
    if(coverUrl){
      phCovbg.style.backgroundImage='url("'+coverUrl+'")';
      phOverlay.style.opacity='1';
      phIcon.style.opacity='0';
    }else{
      phCovbg.style.backgroundImage='';
      phOverlay.style.opacity='0';
      phIcon.style.opacity='0.06';
    }

    /* Subtitle dal primo blocco */
    var firstSub=bl.find(function(blk){
      if(blk.type==='callout')return true;
      return blk.type==='paragraph'&&blk.paragraph&&blk.paragraph.rich_text&&blk.paragraph.rich_text.length>0;
    });
    if(firstSub){
      var subArr=firstSub.type==='callout'?firstSub.callout.rich_text:firstSub.paragraph.rich_text;
      var sub=(subArr||[]).map(function(t){return t.plain_text}).join('').slice(0,130);
      if(sub)phSub.textContent=sub+(sub.length>=130?'…':'');
    }

    /* Render */
    var html=renderBlocks(bl,true);
    var pbody=document.getElementById('pbody');
    var emptyHtml='<div class="n-empty"><div class="n-empty-icon">'+picon+'</div>'
      +'<div class="n-empty-title">'+ptitle+'</div>'
      +'<div class="n-empty-msg">Questa pagina non ha ancora contenuto.</div></div>';
    var footer='<div class="n-page-footer"><div class="n-page-footer-gems">✦ &nbsp; ✦ &nbsp; ✦</div>'
      +'<div class="n-page-footer-text">Archivi di Arcamis — '+ptitle+'</div></div>';
    pbody.innerHTML='<div class="nc" style="animation:fi .22s ease forwards">'+(html||emptyHtml)+footer+'</div>';

    applyGlossary(pbody);

    pbody.querySelectorAll('img').forEach(function(img){
      img.addEventListener('error',function(){
        if(img.dataset.retried)return;
        img.dataset.retried='1';
        try{sessionStorage.removeItem('pg_'+id);}catch(ex){}
      },{once:true});
    });

    attachShine(pbody);
    loadDbGalleries(pbody);
    pbody.querySelectorAll('.gs-container').forEach(function(c){if(window.loadGallery)loadGallery(c);});
    pbody.querySelectorAll('details.n-toggle').forEach(function(det){
      det.addEventListener('toggle',function(){
        if(det.open){loadDbGalleries(det);}
      },{once:true});
    });
    initFadeIn(pbody);
    setTimeout(function(){
      _initCarouselArrows(pbody);
    },200);

    if(typeof addRecente==='function')addRecente(id,ptitle,picon);
    if(typeof setBnavActive==='function')setBnavActive('');
    if(typeof afterPageRender==='function')afterPageRender();

  }catch(e){
    document.getElementById('pbody').innerHTML='<div class="errbox">⚠️ '+e.message+'</div>';
    if(typeof afterPageRender==='function')afterPageRender();
  }
}

/* ════════════════════════════════════
   GLOSSARIO AUTOMATICO
════════════════════════════════════ */
var _glossary={
  'gp':'Pezzi d\'oro — valuta principale di Arcamis',
  'mo':'Monete d\'oro — stessa cosa di gp',
  'sp':'Pezzi d\'argento — 1/10 di gp',
  'cp':'Pezzi di rame — 1/100 di gp',
  'PG':'Personaggio Giocante',
  'DM':'Dungeon Master — il narratore',
  'CA':'Classe Armatura — quanto sei difficile da colpire',
  'TS':'Tiro Salvezza',
  'STR':'Forza — caratteristica fisica',
  'DEX':'Destrezza — agilità e riflessi',
  'CON':'Costituzione — resistenza fisica',
  'INT':'Intelligenza — ragionamento e magia',
  'WIS':'Saggezza — percezione e intuito',
  'CHA':'Carisma — persuasione e leadership',
  'hp':'Hit Points — punti ferita',
  'PF':'Punti Ferita — quanto danno puoi assorbire',
  'XP':'Punti Esperienza',
  'LV':'Livello del personaggio',
  'CD':'Classe Difficoltà — il numero da raggiungere nel dado'
};

function applyGlossary(root){
  var terms=Object.keys(_glossary);
  root.querySelectorAll('.n-p,.n-callout-body,.n-intro-body').forEach(function(el){
    var html=el.innerHTML;
    terms.forEach(function(term){
      var def=_glossary[term];
      var safe=def.replace(/'/g,'&#39;');
      html=html.replace(
        new RegExp('(?<![\\w>])'+term+'(?![\\w<])','g'),
        '<span class="gterm" data-def="'+safe+'">'+term+'</span>'
      );
    });
    el.innerHTML=html;
  });
}
