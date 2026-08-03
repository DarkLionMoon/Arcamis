/* ════════════════════════════════════
   notion-nav.js
   Navigazione SPA: gp(), _gpRender(),
   gpBack(), buildCrumb(), glossario,
   history API.
════════════════════════════════════ */

var navStack = [];

/* ════ SLUG MAP (legacy — usata per retrocompatibilità ?p= ) ════ */
var _slugMap = {
  /* Regole */
  'gameplay':               '2f00274fdc1c8065a11ff45192aa5dcb',
  'regole-generali':        '2f00274fdc1c800b9d8fc366e8e40c5c',
  'materiale-approvato':    '3130274fdc1c807eb61fde24e8236659',
  /* Personaggio */
  'come-si-inizia':         '2dd222f22ef8413f8cb48f03bbb4f4b0',
  'andando-avanti':         '5cea525d149f4acb9c59007bf6b3d5ff',
  'galleria-pg':            '2fd0274fdc1c80d8b948c4133f874f28',
  'homebrew':               '2f00274fdc1c80e78ad7ce985007b7c6',
  'maestria-titoli':        '2f00274fdc1c802a9babd4239d97a319',
  /* Lavori */
  'gilda-avventurieri':     '2f00274fdc1c801b8c13cefd9e15694e',
  'locanda':                '2f00274fdc1c80faa99eda064ef0fabc',
  'forgia':                 '2f00274fdc1c805ca01ec57f18d2ffee',
  'biblioteca':             '2f00274fdc1c8089bfe6c24434d53b67',
  'bottega-farmaceutica':   '2f00274fdc1c801c9697e75caa8d5f13',
  'caserma':                '2ff0274fdc1c80688dd6c2b293a1f626',
  'corporazione-costruttori':'2ff0274fdc1c80769a4ae243f22f0582',
  'ospedale':               '2f00274fdc1c807aa03cc6cbeb3687cc',
  'sartoria':               '2ff0274fdc1c8035bad4f0b6ab705192',
  /* Lore */
  'storia-del-mondo':       '2f00274fdc1c806f8f17dbc6532d2211',
  'pantheon':               '2f00274fdc1c80679bd3c3df8a1fa040',
  'mappe':                  '2f10274fdc1c80489f23c49164747770',
  'changelog':              '3000274fdc1c8033a214c44a1aa7f01f',
  /* Gallerie/Speciali */
  'biblioteca-scoperta':    '3040274fdc1c80ed816ef58f6a6b6f21',
  'specie-homebrew':        '2f60274fdc1c80fba671c588ba93b116',
  'sottoclassi':            '2f70274fdc1c80e3bdc7f95f81eb9cc0',
};

/* ════ ID → PATH MAP (UUID / id-speciale → pathname pulito) ════
   Generata da _pathMap in app.js, ma definiamo qui la versione
   inversa per usarla nel pushState di gp().
   NOTA: _pathMap è definita in app.js — questa funzione la inverte
   al primo uso (lazy), dopo che app.js è stato eseguito.
════════════════════════════════════ */
var _idToPath = null;
function _getIdToPath(){
  if(_idToPath) return _idToPath;
  _idToPath = {};
  if(typeof _pathMap !== 'undefined'){
    Object.keys(_pathMap).forEach(function(path){
      var id = _pathMap[path];
      /* Non sovrascrivere se già mappato (teniamo il path più corto/canonico) */
      if(!_idToPath[id]) _idToPath[id] = '/' + path;
    });
  }
  return _idToPath;
}

/* Mappa inversa id→slug legacy (per fallback) */
var _idToSlug = {};
(function(){
  Object.keys(_slugMap).forEach(function(slug){
    _idToSlug[_slugMap[slug]] = slug;
  });
})();

var _navMap = {
  '2f00274fdc1c8065a11ff45192aa5dcb': 'regole',
  '2f00274fdc1c800b9d8fc366e8e40c5c': 'personaggio',
  '2dd222f22ef8413f8cb48f03bbb4f4b0': 'lavori',
  '2f00274fdc1c80e78ad7ce985007b7c6': 'lore',
};

function _navKeyForPage(id){
  if(_navMap[id]) return _navMap[id];
  for(var i = navStack.length - 1; i >= 0; i--){
    var k = _navMap[navStack[i].id];
    if(k) return k;
  }
  return '';
}
function _setNavFromPage(id){ setNav(_navKeyForPage(id)); }

/* Costruisce l'URL pulito per un dato id */
function _urlForId(id){
  /* Mestieri — id speciale */
  if(id && id.startsWith('mestiere-')){
    var key = id.replace('mestiere-', '');
    return '/mestieri/' + key;
  }
  var map = _getIdToPath();
  if(map[id]) return map[id];
  /* Fallback legacy slug */
  if(_idToSlug[id]) return '/' + _idToSlug[id];
  /* Nessuna mappa — genera path automatico da UUID */
return '/p/' + id;
}
  

function _renderLastUpdated(isoDate){
  if(!isoDate) return;
  var d = new Date(isoDate);
  var fmt = d.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
  var old = document.getElementById('arc-lastupdated');
  if(old) old.remove();
  var el = document.createElement('div');
  el.id = 'arc-lastupdated';
  el.className = 'arc-lastupdated';
  el.textContent = 'Aggiornato il ' + fmt;
  var phTitle = document.getElementById('ph-title');
  if(phTitle && phTitle.parentNode) phTitle.parentNode.insertBefore(el, phTitle.nextSibling);
}

var _memCache = {};
var _scrollPositions = {};
window.prefetchPage = function(id){
  var cacheKey = 'pg_' + id;
  if(!id || _memCache[cacheKey]) return;
  fetch('/data/pages/' + id + '.json')
    .then(function(r){ return r.json(); })
    .then(function(data){ _memCache[cacheKey] = data; })
    .catch(function(){});
};

/* ════ BACK NAVIGATION ════ */
function gpBack(stackIdx){
  var item = navStack[stackIdx];
  if(!item) return;
  var targetId = item.id;
  navStack = navStack.slice(0, stackIdx);
  history.pushState({id:item.id, label:item.label, icon:item.icon, stack:navStack.slice()}, '', _urlForId(item.id));
  _gpRender(item.id, item.label, item.icon);
  var _savedScroll = _scrollPositions[targetId];
  if(_savedScroll !== undefined){
    setTimeout(function(){
      var mainEl = document.getElementById('main');
      if(mainEl) mainEl.scrollTo({top: _savedScroll, behavior: 'smooth'});
    }, 350);
  }
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

/* ════ OPEN PAGE — gp() ════ */
async function gp(id,label,icon,_fromPop){
  if(!id||id==='undefined'||id==='null')return;
  var ts = document.getElementById('ts');
  if(ts) ts.value = '';
  csearch();

  /* Caso speciale: galleria sottoclassi */
  if(id === '2f70274fdc1c803ca5cafa97ca1817cd'){
    var container = document.getElementById('page-content');
    if(container && window.loadSubclassGallery){
      window.loadSubclassGallery(container);
      if(!_fromPop){
        navStack.push({id:id,label:label,icon:icon});
        history.pushState({id:id,label:label,icon:icon,stack:navStack.slice(0,-1)},'', _urlForId(id));
      }
      document.getElementById('ph-title').textContent = label || 'Sottoclassi';
      if(window.cv) window.cv();
      return;
    }
  }

  if(!_fromPop){
    navStack.push({id:id,label:label,icon:icon});
    history.pushState({id:id,label:label,icon:icon,stack:navStack.slice(0,-1)},'', _urlForId(id));
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
    var _curId = navStack.length > 1 ? navStack[navStack.length-2].id : null;
    if(_curId) _scrollPositions[_curId] = document.getElementById('main').scrollTop;
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

/* ════ _gpRender — fetch + render pagina ════ */
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
  if(!data){
    try{
      var _ss=sessionStorage.getItem(cacheKey);
      if(_ss){
        var _parsed=JSON.parse(_ss);
        if(_parsed&&_parsed.page&&_parsed.blocks) data=_parsed;
        else sessionStorage.removeItem(cacheKey);
      }
    }catch(e){sessionStorage.removeItem(cacheKey);}
  }
  if(data)_memCache[cacheKey]=data;

  try{
    if(!data){
      var timeout=new Promise(function(_,rej){setTimeout(function(){rej(new Error('Timeout'))},25000)});
      var r=await Promise.race([fetch('/data/pages/'+id+'.json'),timeout]);
      if(!r.ok)throw new Error('HTTP '+r.status);
      data=await r.json();
      _memCache[cacheKey]=data;
      try{
        var _ssKeys=Object.keys(sessionStorage).filter(function(k){return k.indexOf('pg_')===0;});
        if(_ssKeys.length>=60) sessionStorage.removeItem(_ssKeys[0]);
        sessionStorage.setItem(cacheKey,JSON.stringify(data));
      }catch(e){
        try{ Object.keys(sessionStorage).forEach(function(k){if(k.indexOf('pg_')===0)sessionStorage.removeItem(k);}); }catch(e2){}
      }
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

    var coverUrl=null;
    if(pg.cover){
      coverUrl=pg.cover.type==='external'?pg.cover.external.url:(pg.cover.file&&pg.cover.file.url);
    }
    if(!coverUrl){
      var firstImg=bl.find(function(blk){return blk.type==='image';});
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

    var firstSub=bl.find(function(blk){
      if(blk.type==='callout')return true;
      return blk.type==='paragraph'&&blk.paragraph&&blk.paragraph.rich_text&&blk.paragraph.rich_text.length>0;
    });
    if(firstSub){
      var subArr=firstSub.type==='callout'?firstSub.callout.rich_text:firstSub.paragraph.rich_text;
      var sub=(subArr||[]).map(function(t){return t.plain_text}).join('').slice(0,130);
      if(sub)phSub.textContent=sub+(sub.length>=130?'…':'');
    }

    var html=renderBlocks(bl,true);
    var pbody=document.getElementById('pbody');
    pbody.className='page-'+id;
    pbody.style.maxWidth='';
    pbody.style.width='';
    var emptyHtml='<div class="n-empty"><div class="n-empty-icon">'+picon+'</div>'
      +'<div class="n-empty-title">'+ptitle+'</div>'
      +'<div class="n-empty-msg">Questa pagina non ha ancora contenuto.</div></div>';
    var footer='<div class="n-page-footer"><div class="n-page-footer-gems">✦ &nbsp; ✦ &nbsp; ✦</div>'
      +'<div class="n-page-footer-text">Archivi di Arcamis — '+ptitle+'</div></div>';
    pbody.innerHTML='<div class="nc" style="animation:fi .22s ease forwards">'+(html||emptyHtml)+footer+'</div>';
    if(pbody.querySelector('.pb-wide-trigger')){
      pbody.style.maxWidth='none';
      pbody.style.width='100%';
    }

    applyGlossary(pbody);

    pbody.querySelectorAll('img').forEach(function(img){
      img.addEventListener('error',function(){
        if(img.dataset.retried)return;
        img.dataset.retried='1';
        try{sessionStorage.removeItem('pg_'+id);}catch(ex){}
        delete _memCache['pg_'+id);
        img.closest('figure')?img.closest('figure').style.display='none':img.style.display='none';
      },{once:true});
    });

    attachShine(pbody);
    loadDbGalleries(pbody);
    pbody.querySelectorAll('.npc-gallery-container').forEach(function(c){if(window.loadNpcGallery)loadNpcGallery(c);});
    pbody.querySelectorAll('.hb-library-container').forEach(function(c){if(window.loadLibraryGallery)loadLibraryGallery(c);});
    pbody.querySelectorAll('.hb-subclass-container').forEach(function(c){if(window.loadSubclassGallery)loadSubclassGallery(c);});
    pbody.querySelectorAll('.hb-specie-container').forEach(function(c){if(window.loadSpeciesGallery)loadSpeciesGallery(c);});
    pbody.querySelectorAll('.hb-changelog-container').forEach(function(c){if(window.loadChangelog)loadChangelog(c);});
    pbody.querySelectorAll('.gs-container').forEach(function(c){if(window.loadGallery)loadGallery(c);});
    pbody.querySelectorAll('details.n-toggle').forEach(function(det){
      det.addEventListener('toggle',function(){if(det.open){loadDbGalleries(det);}},{once:true});
    });
    initFadeIn(pbody);
    setTimeout(function(){ _initCarouselArrows(pbody); },200);

    _setNavFromPage(id);
    if(data.page)_renderLastUpdated(data.page.last_edited_time);
    if(typeof addRecente==='function')addRecente(id,ptitle,picon);
    if(typeof setBnavActive==='function')setBnavActive('');
    if(typeof afterPageRender==='function')afterPageRender();

  }catch(e){
    document.getElementById('pbody').innerHTML='';
    showToast('Errore caricamento pagina: '+e.message,'⚠️',4000);
    if(typeof afterPageRender==='function')afterPageRender();
  }
}

/* ════ GLOSSARIO AUTOMATICO ════ */
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
