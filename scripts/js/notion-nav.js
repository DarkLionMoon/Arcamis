/* ════════════════════════════════════
   notion-nav.js
   Navigazione SPA: gp(), _gpRender(),
   gpBack(), buildCrumb(), glossario,
   history API.
════════════════════════════════════ */

var navStack = [];

/* ════ MARKDOWN → HTML (per JSON locali) ════ */
function _mdToHtml(md){
  if(!md) return '';
  /* Proteggi i marker di blockquote, poi neutralizza l'HTML grezzo */
  var Q = '\u0000Q\u0000';
  md = md.replace(/^> (.*)$/gm, Q + '$1');
  md = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  md = md.replace(/\u0000Q\u0000/g, '> ');
  /* Code blocks */
  md = md.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  /* Inline code */
  md = md.replace(/`([^`]+)`/g, '<code>$1</code>');
  /* Tables */
  md = md.replace(/^(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)*)/gm, function(m, header, sep, body){
    var ths = header.split('|').filter(function(c){return c.trim()}).map(function(c){return '<th>'+c.trim()+'</th>'}).join('');
    var rows = body.trim().split('\n').map(function(r){
      var tds = r.split('|').filter(function(c){return c.trim()}).map(function(c){return '<td>'+c.trim()+'</td>'}).join('');
      return '<tr>'+tds+'</tr>';
    }).join('');
    return '<div class="n-tbl-wrap"><table><thead><tr>'+ths+'</tr></thead><tbody>'+rows+'</tbody></table></div>';
  });
  /* Headers */
  md = md.replace(/^#### (.+)$/gm, '<h4 class="n-h4">$1</h4>');
  md = md.replace(/^### (.+)$/gm, '<h3 class="n-h3">$1</h3>');
  md = md.replace(/^## (.+)$/gm, '<h2 class="n-h2">$1</h2>');
  md = md.replace(/^# (.+)$/gm, '<h1 class="n-h1">$1</h1>');
  /* Bold & italic */
  md = md.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  md = md.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  md = md.replace(/\*(.+?)\*/g, '<em>$1</em>');
  /* Blockquote */
  md = md.replace(/^> (.+)$/gm, '<blockquote class="n-quote"><span class="n-quote-mark">"</span>$1</blockquote>');
  /* HR */
  md = md.replace(/^---$/gm, '<hr class="n-divider">');
  /* Unordered list */
  md = md.replace(/^- (.+)$/gm, '<li class="n-li">$1</li>');
  /* Ordered list */
  md = md.replace(/^\d+\. (.+)$/gm, '<li class="n-li">$1</li>');
  /* Wrap consecutive li in ul */
  md = md.replace(/((?:<li class="n-li">.*<\/li>\n?)+)/g, '<ul class="n-ul">$1</ul>');
  /* Links — solo URL sicuri (decodifica l'escape iniziale, valida, ri-escappa) */
  md = md.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function(m, label, url){
    var u = (url || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    if(!/^(https?:|mailto:|#|\/)/i.test(u)) return label;
    return '<a href="'+u.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')+'" target="_blank" rel="noopener" class="n-link">'+label+'</a>';
  });
  /* Images — solo URL sicuri */
  md = md.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function(m, alt, url){
    var u = (url || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    var safeAlt = (alt || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if(!/^(https?:|#|\/|data:image\/)/i.test(u)) return '';
    var jsUrl = u.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
    return '<img src="'+u.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')+'" alt="'+safeAlt+'" loading="lazy" class="n-image n-zoomable" onclick="arcZoom(\''+jsUrl+'\')">';
  });
  /* Paragraphs */
  md = md.replace(/\n\n/g, '</p><p class="n-p">');
  md = md.replace(/\n/g, '<br>');
  return '<p class="n-p">' + md + '</p>';
}

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
  fetch('/api/notion?pageId=' + id)
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

  /* ═══ LOCAL JSON CHECK ═══ */
  var _localPage = (typeof pages !== 'undefined') ? pages.find(function(p){ return p.id === id; }) : null;
  if(_localPage && _localPage.k){
    try {
      var _localResp = await fetch('/content/pages/' + _localPage.k + '.json');
      if(_localResp.ok){
        var _localJson = await _localResp.json();
        if(_localJson.content){
          /* Render markdown locally */
          var ptitle = _localJson.title || label || 'Pagina';
          var picon = _localJson.icon || icon || '📄';
          phTitle.textContent = ptitle;
          phIcon.textContent = picon;
          phEyebrow.textContent = 'Archivi di Arcamis';
          document.title = ptitle + ' — Arcamis';
          phCrumb.innerHTML = buildCrumb(ptitle);
          var acc = iconAccent(picon);
          phHero.style.setProperty('--ph-acc', acc.c);
          phHero.style.setProperty('--ph-accbg', acc.bg);
          phCovbg.style.backgroundImage = '';
          phOverlay.style.opacity = '0';
          phIcon.style.opacity = '0.06';
          var _localHtml;
          var _layout = _localJson.layout || '';
          if(_layout === 'materiale') _localHtml = _renderMateriale(_localJson.content);
          else if(_layout === 'regole') _localHtml = _renderRegole(_localJson.content);
          else if(_layout === 'personaggio') _localHtml = _renderPersonaggio(_localJson.content);
          else if(_layout === 'lavoro') _localHtml = _renderLavoro(_localJson.content, _localJson.title);
          else if(_layout === 'lore') _localHtml = _renderLore(_localJson.content, _localJson.title, _localJson.icon);
          else if(_layout === 'pantheon') _localHtml = _renderPantheon(_localJson.content);
          else if(_layout === 'bestiario') _localHtml = _renderBestiario(_localJson.content);
          else if(_layout === 'timeline') _localHtml = _renderTimeline(_localJson.content);
          else if(_layout === 'fazioni') _localHtml = _renderFazioni(_localJson.content);
          else if(_layout === 'oggetti') _localHtml = _renderOggetti(_localJson.content);
          else if(_layout === 'glossario') _localHtml = _renderGlossario(_localJson.content);
          else if(_layout === 'galleria') _localHtml = _renderGalleria(_localJson.content);
          else if(_layout === 'tabelle') _localHtml = _renderTabelle(_localJson.content);
          else if(_layout === 'sessione' || _layout === 'quest' || _layout === 'npc' || _layout === 'spell' || _layout === 'specie' || _layout === 'citta' || _layout === 'evento') _localHtml = _renderSchede(_localJson.content);
          else if(_layout === 'wide') { _localHtml = _mdToHtml(_localJson.content); }
          else {
            /* Auto-detect by page key (legacy fallback) */
            _localHtml = (_localPage.k === 'materiale') ? _renderMateriale(_localJson.content) : (_localPage.k === 'regole' || _localPage.k === 'gameplay') ? _renderRegole(_localJson.content) : (_localPage.k === 'inizia' || _localPage.k === 'avanti') ? _renderPersonaggio(_localJson.content) : (_localPage.k === 'gilda' || _localPage.k === 'locanda' || _localPage.k === 'farmacia' || _localPage.k === 'biblioteca' || _localPage.k === 'ospedale' || _localPage.k === 'sartoria' || _localPage.k === 'deserto') ? _renderLavoro(_localJson.content, _localJson.title) : (_localPage.k === 'pantheon' || _localPage.k === 'maestria' || _localPage.k === 'arcamis' || _localPage.k === 'selva' || _localPage.k === 'foresta' || _localPage.k === 'volonx' || _localPage.k === 'arpax' || _localPage.k === 'galleria') ? _renderLore(_localJson.content, _localJson.title, _localJson.icon) : _mdToHtml(_localJson.content);
          }
          var pbody = document.getElementById('pbody');
          pbody.className = 'page-' + id;
          pbody.style.maxWidth = '';
          pbody.style.width = '';
          if(_layout === 'wide') { pbody.style.maxWidth = 'none'; pbody.style.width = '100%'; }
          var _emptyHtml = '<div class="n-empty"><div class="n-empty-icon">' + picon + '</div>'
            + '<div class="n-empty-title">' + ptitle + '</div>'
            + '<div class="n-empty-msg">Questa pagina non ha ancora contenuto.</div></div>';
          var _footer = '<div class="n-page-footer"><div class="n-page-footer-gems">✦ &nbsp; ✦ &nbsp; ✦</div>'
            + '<div class="n-page-footer-text">Archivi di Arcamis — ' + ptitle + '</div></div>';
          pbody.innerHTML = '<div class="nc" style="animation:fi .22s ease forwards">' + (_scrubHtmlString(_localHtml || '') || _emptyHtml) + _footer + '</div>';
          applyGlossary(pbody);
          if(typeof afterPageRender === 'function') afterPageRender();
          return;
        }
      }
    } catch(_e) { /* Fall through to Notion API */ }
  }

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
      var r=await Promise.race([fetch('/api/notion?pageId='+id),timeout]);
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
    if(coverUrl && /^(https?:|data:image\/|blob:)/i.test(coverUrl)){
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
    pbody.innerHTML='<div class="nc" style="animation:fi .22s ease forwards">'+(_scrubHtmlString(html||'')||emptyHtml)+footer+'</div>';
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
        delete _memCache['pg_'+id];
        var src=img.getAttribute('src')||'';
        if(src.indexOf('/api/notion?img=')>-1){
          var sep=src.indexOf('?')>-1?'&':'?';
          img.src=src+sep+'_t='+Date.now();
        }else if(src.indexOf('prod-files-secure')>-1||src.indexOf('s3.us-west')>-1){
          img.src='/api/notion?img='+encodeURIComponent(src);
        }else{
          img.closest('figure')?img.closest('figure').style.display='none':img.style.display='none';
        }
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

/* ══════════════════════════════════════
   RENDER MATERIALE APPROVATO
   Layout multi-colonna, classi raggruppate
   ══════════════════════════════════════ */
function _renderMateriale(md) {
  if (!md) return '';
  var html = '';
  var sections = md.split(/^## /m).filter(Boolean);

  function parseItems(txt) {
    var items = [];
    txt.replace(/^- (.+)$/gm, function(_, line) {
      var source = '';
      var name = line
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/^(.+?)\s*\(([A-Z0-9' ]+)\)\s*$/, function(_, n, s) {
          source = s.trim();
          return n;
        });
      items.push({ name: name, source: source });
    });
    return items;
  }

  function renderCards(items) {
    var out = '<div class="mat-grid">';
    items.forEach(function(it) {
      out += '<div class="mat-card">'
        + '<span class="mat-name">' + it.name + '</span>'
        + (it.source ? '<span class="mat-badge">' + it.source + '</span>' : '')
        + '</div>';
    });
    return out + '</div>';
  }

  function groupClasses(txt) {
    var classes = {};
    var currentClass = null;
    txt.split('\n').forEach(function(line) {
      var m = line.match(/^- (.+)$/);
      if (!m) return;
      var item = m[1];
      var clean = item.replace(/\s*\([^)]+\)\s*$/, '').replace(/\*\*/g, '').trim();
      var isBase = /^(Artificer|Barbarian|Bard|Cleric|Druid|Fighter|Monk|Paladin|Ranger|Rogue|Sorcerer|Warlock|Wizard)$/i.test(clean);
      if (isBase) {
        currentClass = clean;
        classes[currentClass] = { base: item, subs: [] };
      } else if (currentClass) {
        classes[currentClass].subs.push(item);
      } else {
        if (!classes['_other']) classes['_other'] = [];
        classes['_other'].push(item);
      }
    });
    return classes;
  }

  sections.forEach(function(sec) {
    var lines = sec.split('\n');
    var sectionTitle = (lines.shift() || '').trim();
    var body = lines.join('\n');

    var callouts = [];
    body = body.replace(/^>\s*💡\s*(.+)$/gm, function(_, txt) {
      callouts.push(txt);
      return '';
    });

    var subsections = body.split(/^### /m).filter(Boolean);
    var allItems = [];
    subsections.forEach(function(sub) {
      var subLines = sub.split('\n');
      var subTitle = null;
      if (subLines.length > 1 && !subLines[0].trim().startsWith('-') && !subLines[0].trim().startsWith('**')) {
        subTitle = subLines.shift().trim();
      }
      if (subTitle) allItems.push({ type: 'subtitle', text: subTitle });
      parseItems(subLines.join('\n')).forEach(function(it) { allItems.push({ type: 'item', data: it }); });
    });
    if (allItems.length === 0) {
      parseItems(body).forEach(function(it) { allItems.push({ type: 'item', data: it }); });
    }

    /* Specie / Talenti / Spell */
    if (/^(Specie|Talenti|Spell)$/i.test(sectionTitle)) {
      html += '<div class="mat-section">';
      html += '<h2 class="mat-section-title">' + sectionTitle + '</h2>';
      var cards = allItems.filter(function(i){ return i.type === 'item'; }).map(function(i){ return i.data; });
      if (cards.length) html += renderCards(cards);
      callouts.forEach(function(c) { html += '<div class="mat-callout">💡 ' + c + '</div>'; });
      html += '</div>';
      return;
    }

    /* Classi raggruppate */
    if (/^Classi/i.test(sectionTitle)) {
      html += '<div class="mat-section">';
      html += '<h2 class="mat-section-title">' + sectionTitle + '</h2>';
      var rawItems = allItems.filter(function(i){ return i.type === 'item'; }).map(function(i){ return i.data.name; });
      var grouped = groupClasses(rawItems.join('\n'));
      html += '<div class="mat-classes">';
      Object.keys(grouped).forEach(function(cls) {
        if (cls === '_other') return;
        var g = grouped[cls];
        html += '<div class="mat-class-group">';
        html += '<div class="mat-class-base">' + g.base + '</div>';
        html += '<div class="mat-class-subs">';
        g.subs.forEach(function(s) {
          var source = '';
          var name = s.replace(/\s*\(([A-Z0-9' ]+)\)\s*$/, function(_, src) { source = src.trim(); return ''; });
          html += '<div class="mat-sub-card">'
            + '<span class="mat-sub-name">' + name.replace(/\*\*/g, '').trim() + '</span>'
            + (source ? '<span class="mat-badge">' + source + '</span>' : '')
            + '</div>';
        });
        html += '</div></div>';
      });
      html += '</div>';
      callouts.forEach(function(c) { html += '<div class="mat-callout">💡 ' + c + '</div>'; });
      html += '</div>';
      return;
    }

    /* Fallback */
    html += '<div class="mat-section">';
    html += '<h2 class="mat-section-title">' + sectionTitle + '</h2>';
    allItems.forEach(function(i) {
      if (i.type === 'subtitle') {
        html += '<h3 class="mat-subtitle">' + i.text + '</h3>';
      } else {
        html += renderCards([i.data]);
      }
    });
    callouts.forEach(function(c) { html += '<div class="mat-callout">💡 ' + c + '</div>'; });
    html += '</div>';
  });

  return '<div class="mat-page">' + html + '</div>';
}

/* ══════════════════════════════════════
   RENDER REGOLE
   Layout organizzato con sezioni e card
   ══════════════════════════════════════ */
function _renderRegole(md) {
  if (!md) return '';
  var html = '';

  /* Split in blocchi principali separati da --- */
  var blocks = md.split(/\n---\n/);

  /* Primo blocco: intro + regole brevi */
  var introBlock = blocks.shift() || '';
  var introLines = introBlock.split('\n').filter(function(l){ return l.trim(); });
  var introText = '';
  var briefRules = [];
  introLines.forEach(function(line) {
    var m = line.match(/^\d+\)\s*(.+)/);
    if (m) {
      briefRules.push(m[1]);
    } else if (!line.match(/^\[📄/)) {
      introText += line + ' ';
    }
  });

  /* Link alle sotto-pagine */
  var subpageLinks = [];
  md.replace(/\[📄\s*([^\]]+)\]/g, function(_, title) {
    subpageLinks.push(title.trim());
  });

  /* Sezioni con ### */
  var sections = [];
  var currentSection = null;
  blocks.forEach(function(block) {
    var lines = block.split('\n');
    var headerMatch = null;
    var body = [];
    lines.forEach(function(line) {
      var hm = line.match(/^###\s+(.+)/);
      if (hm) {
        headerMatch = hm[1];
      } else if (line.trim() && !line.match(/^\[📄/)) {
        body.push(line);
      }
    });
    if (headerMatch) {
      sections.push({ title: headerMatch, body: body.join('\n') });
    }
  });

  /* ── Intro callout ── */
  if (introText.trim()) {
    html += '<div class="regle-intro">' + _mdToHtml(introText.trim()) + '</div>';
  }

  /* ── Regole brevi ── */
  if (briefRules.length) {
    html += '<div class="regle-brief">';
    briefRules.forEach(function(rule, i) {
      html += '<div class="regle-brief-card">'
        + '<span class="regle-brief-num">' + (i + 1) + '</span>'
        + '<span class="regle-brief-text">' + rule + '</span>'
        + '</div>';
    });
    html += '</div>';
  }

  /* ── Link sotto-pagine ── */
  if (subpageLinks.length) {
    html += '<div class="regle-links">';
    subpageLinks.forEach(function(title) {
      html += '<div class="regle-link-card">'
        + '<span class="regle-link-icon">📄</span>'
        + '<span class="regle-link-title">' + title + '</span>'
        + '</div>';
    });
    html += '</div>';
  }

  /* ── Sezioni regole ── */
  if (sections.length) {
    html += '<div class="regle-sections">';
    sections.forEach(function(sec) {
      html += '<div class="regle-section">';
      html += '<div class="regle-section-title">' + sec.title + '</div>';
      html += '<div class="regle-section-body">' + _mdToHtml(sec.body) + '</div>';
      html += '</div>';
    });
    html += '</div>';
  }

  return '<div class="regle-page">' + html + '</div>';
}

/* ══════════════════════════════════════
   RENDER LORE / LUOGHI
   Card organizzate per pagine di lore
   ══════════════════════════════════════ */
function _renderLore(md, title, icon) {
  if (!md || md.trim().length < 5) {
    return '<div class="lore-page"><div class="lore-empty">'
      + '<div class="lore-empty-icon">' + (icon || '📄') + '</div>'
      + '<div class="lore-empty-title">' + (title || 'Pagina') + '</div>'
      + '<div class="lore-empty-msg">Contenuto in arrivo.</div></div></div>';
  }

  var html = '';
  var sections = md.split(/^## /m).filter(Boolean);

  /* Se non ci sono sezioni ##, usa tutto come intro */
  if (sections.length === 0) {
    html += '<div class="lore-intro">' + _mdToHtml(md) + '</div>';
    return '<div class="lore-page">' + html + '</div>';
  }

  sections.forEach(function(sec) {
    var lines = sec.split('\n');
    var sectionTitle = (lines.shift() || '').trim();
    var body = lines.join('\n').trim();

    /* Estrai callout */
    var callouts = [];
    body = body.replace(/^>\s*(.+)$/gm, function(_, txt) {
      callouts.push(txt);
      return '';
    });

    html += '<div class="lore-section">';
    html += '<h2 class="lore-section-title">' + sectionTitle + '</h2>';
    if (body) {
      html += '<div class="lore-section-body">' + _mdToHtml(body) + '</div>';
    }
    callouts.forEach(function(c) {
      html += '<div class="lore-callout">💡 ' + c + '</div>';
    });
    html += '</div>';
  });

  return '<div class="lore-page">' + html + '</div>';
}

/* ══════════════════════════════════════
   RENDER LAVORO / GILDE
   Scheda lavoro con stipendio e regole
   ══════════════════════════════════════ */
function _renderLavoro(md, title) {
  if (!md) return '';
  var html = '';

  /* Split in blocchi separati da --- */
  var blocks = md.split(/\n---\n/);

  /* Primo blocco: intro */
  var introBlock = (blocks.shift() || '').trim();
  if (introBlock) {
    /* Rimuovi immagini dall'intro (sono link Notion non funzionanti) */
    var cleanIntro = introBlock.replace(/!\[[^\]]*\]\([^)]+\)/g, '').trim();
    if (cleanIntro) {
      html += '<div class="lavoro-intro">' + _mdToHtml(cleanIntro) + '</div>';
    }
  }

  /* Sezioni con ### */
  var sections = [];
  blocks.forEach(function(block) {
    var lines = block.split('\n');
    var headerMatch = null;
    var body = [];
    lines.forEach(function(line) {
      var hm = line.match(/^###\s+(.+)/);
      if (hm) {
        headerMatch = hm[1];
      } else if (line.trim()) {
        body.push(line);
      }
    });
    if (headerMatch) {
      sections.push({ title: headerMatch, body: body.join('\n') });
    }
  });

  /* Se ci sono sezioni,entalle in card */
  if (sections.length) {
    html += '<div class="lavoro-sections">';
    sections.forEach(function(sec) {
      html += '<div class="lavoro-section">';
      html += '<div class="lavoro-section-title">' + sec.title + '</div>';
      html += '<div class="lavoro-section-body">' + _mdToHtml(sec.body) + '</div>';
      html += '</div>';
    });
    html += '</div>';
  }

  /* Se non ci sono sezioni ###, usa tutto come body */
  if (sections.length === 0 && blocks.length) {
    var remaining = blocks.join('\n---\n').trim();
    if (remaining) {
      html += '<div class="lavoro-body">' + _mdToHtml(remaining) + '</div>';
    }
  }

  return '<div class="lavoro-page">' + html + '</div>';
}

/* ══════════════════════════════════════
   RENDER PERSONAGGIO
   Step-by-step per creazione PG
   ══════════════════════════════════════ */
function _renderPersonaggio(md) {
  if (!md) return '';
  var html = '';

  /* Split in blocchi separati da --- */
  var blocks = md.split(/\n---\n/);

  /* Primo blocco: intro */
  var introBlock = (blocks.shift() || '').trim();
  if (introBlock) {
    html += '<div class="pers-intro">' + _mdToHtml(introBlock) + '</div>';
  }

  /* Sezioni con ### */
  var sections = [];
  blocks.forEach(function(block) {
    var lines = block.split('\n');
    var headerMatch = null;
    var body = [];
    lines.forEach(function(line) {
      var hm = line.match(/^###\s+(.+)/);
      if (hm) {
        headerMatch = hm[1];
      } else if (line.trim()) {
        body.push(line);
      }
    });
    if (headerMatch) {
      sections.push({ title: headerMatch, body: body.join('\n') });
    }
  });

  /* Render come step cards */
  if (sections.length) {
    html += '<div class="pers-steps">';
    sections.forEach(function(sec, i) {
      html += '<div class="pers-step">';
      html += '<div class="pers-step-num">' + (i + 1) + '</div>';
      html += '<div class="pers-step-content">';
      html += '<div class="pers-step-title">' + sec.title + '</div>';
      html += '<div class="pers-step-body">' + _mdToHtml(sec.body) + '</div>';
      html += '</div></div>';
    });
    html += '</div>';
  }

  /* Se non ci sono sezioni ###, usa tutto come body */
  if (sections.length === 0 && blocks.length) {
    var remaining = blocks.join('\n---\n').trim();
    if (remaining) {
      html += '<div class="pers-body">' + _mdToHtml(remaining) + '</div>';
    }
  }

  return '<div class="pers-page">' + html + '</div>';
}

/* ══════════════════════════════════════
   RENDER PANTHEON — Schede divinita
   ══════════════════════════════════════ */
function _renderPantheon(md) {
  if (!md) return '';
  var html = '';
  var sections = md.split(/^## /m).filter(Boolean);
  sections.forEach(function(sec) {
    var lines = sec.split('\n');
    var title = (lines.shift() || '').trim();
    var body = lines.join('\n');
    var intro = '';
    var fields = [];
    var lists = {};
    var currentList = null;
    body.split('\n').forEach(function(line) {
      var fm = line.match(/^-\s+\*\*(.+?):?\*\*\s*:?\s*(.+)/);
      if (fm) { fields.push({ key: fm[1], val: fm[2] }); currentList = null; return; }
      var lm = line.match(/^###\s+(.+)/);
      if (lm) { currentList = lm[1]; lists[currentList] = []; return; }
      if (currentList && line.match(/^- /)) {
        lists[currentList].push(line.replace(/^- /, ''));
        return;
      }
      if (!fm && !lm && line.trim() && !intro) intro = line.trim();
    });
    html += '<div class="pan-card">';
    if (intro) html += '<div class="pan-intro">' + _mdToHtml(intro) + '</div>';
    if (fields.length) {
      html += '<div class="pan-fields">';
      fields.forEach(function(f) {
        html += '<div class="pan-field"><span class="pan-key">' + f.key + '</span><span class="pan-val">' + f.val + '</span></div>';
      });
      html += '</div>';
    }
    Object.keys(lists).forEach(function(name) {
      html += '<div class="pan-subtitle">' + name + '</div>';
      html += '<div class="pan-list">';
      lists[name].forEach(function(item) {
        html += '<div class="pan-list-item">' + item + '</div>';
      });
      html += '</div>';
    });
    html += '</div>';
  });
  return '<div class="pan-page">' + html + '</div>';
}

/* ══════════════════════════════════════
   RENDER BESTIARIO — Schede mostri
   ══════════════════════════════════════ */
function _renderBestiario(md) {
  if (!md) return '';
  var html = '';
  var sections = md.split(/^## /m).filter(Boolean);
  sections.forEach(function(sec) {
    var lines = sec.split('\n');
    var title = (lines.shift() || '').trim();
    var body = lines.join('\n');
    var intro = '';
    var fields = [];
    var blocks = {};
    var currentBlock = null;
    body.split('\n').forEach(function(line) {
      var fm = line.match(/^-\s+\*\*(.+?):?\*\*\s*:?\s*(.+)/);
      if (fm) { fields.push({ key: fm[1], val: fm[2] }); currentBlock = null; return; }
      var hm = line.match(/^###\s+(.+)/);
      if (hm) { currentBlock = hm[1]; blocks[currentBlock] = []; return; }
      if (currentBlock && line.trim()) {
        blocks[currentBlock].push(line.replace(/^-\s+/, ''));
        return;
      }
      if (!fm && !hm && line.trim() && !intro) intro = line.trim();
    });
    html += '<div class="bst-card">';
    html += '<div class="bst-title">' + title + '</div>';
    if (intro) html += '<div class="bst-intro">' + _mdToHtml(intro) + '</div>';
    if (fields.length) {
      html += '<div class="bst-fields">';
      fields.forEach(function(f) {
        html += '<div class="bst-field"><span class="bst-key">' + f.key + '</span><span class="bst-val">' + f.val + '</span></div>';
      });
      html += '</div>';
    }
    Object.keys(blocks).forEach(function(name) {
      html += '<div class="bst-block-title">' + name + '</div>';
      html += '<div class="bst-block-body">';
      blocks[name].forEach(function(item) {
        html += '<div class="bst-block-item">' + item + '</div>';
      });
      html += '</div>';
    });
    html += '</div>';
  });
  return '<div class="bst-page">' + html + '</div>';
}

/* ══════════════════════════════════════
   RENDER TIMELINE — Eventi cronologici
   ══════════════════════════════════════ */
function _renderTimeline(md) {
  if (!md) return '';
  var html = '';
  var sections = md.split(/^## /m).filter(Boolean);
  sections.forEach(function(sec) {
    var lines = sec.split('\n');
    var title = (lines.shift() || '').trim();
    var body = lines.join('\n');
    var intro = '';
    var items = [];
    var currentSub = null;
    body.split('\n').forEach(function(line) {
      var sm = line.match(/^###\s+(.+)/);
      if (sm) { currentSub = sm[1]; items.push({ type: 'sub', text: currentSub }); return; }
      var im = line.match(/^-\s+\*\*(.+?):?\*\*\s*:?\s*(.+)/);
      if (im) { items.push({ type: 'event', title: im[1], desc: im[2], sub: currentSub }); return; }
      var bm = line.match(/^- (.+)/);
      if (bm) { items.push({ type: 'event', title: '', desc: bm[1], sub: currentSub }); return; }
      if (!sm && !im && !bm && line.trim() && !intro) intro = line.trim();
    });
    html += '<div class="tl-section">';
    html += '<div class="tl-title">' + title + '</div>';
    if (intro) html += '<div class="tl-intro">' + _mdToHtml(intro) + '</div>';
    html += '<div class="tl-timeline">';
    items.forEach(function(it) {
      if (it.type === 'sub') {
        html += '<div class="tl-marker">' + it.text + '</div>';
      } else {
        html += '<div class="tl-event">';
        if (it.title) html += '<div class="tl-event-title">' + it.title + '</div>';
        html += '<div class="tl-event-desc">' + it.desc + '</div>';
        html += '</div>';
      }
    });
    html += '</div></div>';
  });
  return '<div class="tl-page">' + html + '</div>';
}

/* ══════════════════════════════════════
   RENDER FAZIONI — Organizzazioni
   ══════════════════════════════════════ */
function _renderFazioni(md) {
  if (!md) return '';
  var html = '';
  var sections = md.split(/^## /m).filter(Boolean);
  sections.forEach(function(sec) {
    var lines = sec.split('\n');
    var title = (lines.shift() || '').trim();
    var body = lines.join('\n');
    var intro = '';
    var fields = [];
    var lists = {};
    var currentList = null;
    body.split('\n').forEach(function(line) {
      var fm = line.match(/^-\s+\*\*(.+?):?\*\*\s*:?\s*(.+)/);
      if (fm) { fields.push({ key: fm[1], val: fm[2] }); currentList = null; return; }
      var hm = line.match(/^###\s+(.+)/);
      if (hm) { currentList = hm[1]; lists[currentList] = []; return; }
      if (currentList && line.match(/^- /)) {
        lists[currentList].push(line.replace(/^- /, ''));
        return;
      }
      if (!fm && !hm && line.trim() && !intro) intro = line.trim();
    });
    html += '<div class="faz-card">';
    html += '<div class="faz-title">' + title + '</div>';
    if (intro) html += '<div class="faz-intro">' + _mdToHtml(intro) + '</div>';
    if (fields.length) {
      html += '<div class="faz-fields">';
      fields.forEach(function(f) {
        html += '<div class="faz-field"><span class="faz-key">' + f.key + '</span><span class="faz-val">' + f.val + '</span></div>';
      });
      html += '</div>';
    }
    Object.keys(lists).forEach(function(name) {
      html += '<div class="faz-subtitle">' + name + '</div>';
      html += '<div class="faz-list">';
      lists[name].forEach(function(item) {
        html += '<div class="faz-list-item">' + item + '</div>';
      });
      html += '</div>';
    });
    html += '</div>';
  });
  return '<div class="faz-page">' + html + '</div>';
}

/* ══════════════════════════════════════
   RENDER OGGETTI — Equipaggiamento
   ══════════════════════════════════════ */
function _renderOggetti(md) {
  if (!md) return '';
  var html = '';
  var sections = md.split(/^## /m).filter(Boolean);
  sections.forEach(function(sec) {
    var lines = sec.split('\n');
    var title = (lines.shift() || '').trim();
    var body = lines.join('\n');
    var intro = '';
    var fields = [];
    var currentBlock = null;
    var blockContent = [];
    var blocks = {};
    body.split('\n').forEach(function(line) {
      var fm = line.match(/^-\s+\*\*(.+?):?\*\*\s*:?\s*(.+)/);
      if (fm) { fields.push({ key: fm[1], val: fm[2] }); currentBlock = null; return; }
      var hm = line.match(/^###\s+(.+)/);
      if (hm) {
        if (currentBlock && blockContent.length) blocks[currentBlock] = blockContent.join('\n');
        currentBlock = hm[1]; blockContent = []; return;
      }
      if (currentBlock) { blockContent.push(line); return; }
      if (!fm && !hm && line.trim() && !intro) intro = line.trim();
    });
    if (currentBlock && blockContent.length) blocks[currentBlock] = blockContent.join('\n');
    var rarity = '';
    fields.forEach(function(f) {
      if (f.key === 'Rarita') rarity = f.val.toLowerCase().replace(/\s+/g, '');
    });
    var rarityClass = 'obj-common';
    if (rarity.indexOf('leggendario') > -1) rarityClass = 'obj-legendary';
    else if (rarity.indexOf('molto') > -1) rarityClass = 'obj-veryrare';
    else if (rarity.indexOf('raro') > -1) rarityClass = 'obj-rare';
    else if (rarity.indexOf('non') > -1) rarityClass = 'obj-uncommon';
    html += '<div class="obj-card ' + rarityClass + '">';
    html += '<div class="obj-title">' + title + '</div>';
    if (intro) html += '<div class="obj-intro">' + _mdToHtml(intro) + '</div>';
    if (fields.length) {
      html += '<div class="obj-fields">';
      fields.forEach(function(f) {
        html += '<div class="obj-field"><span class="obj-key">' + f.key + '</span><span class="obj-val">' + f.val + '</span></div>';
      });
      html += '</div>';
    }
    Object.keys(blocks).forEach(function(name) {
      html += '<div class="obj-block-title">' + name + '</div>';
      html += '<div class="obj-block-body">' + _mdToHtml(blocks[name]) + '</div>';
    });
    html += '</div>';
  });
  return '<div class="obj-page">' + html + '</div>';
}

/* ══════════════════════════════════════
   RENDER GLOSSARIO — Termini e definizioni
   ══════════════════════════════════════ */
function _renderGlossario(md) {
  if (!md) return '';
  var html = '';
  var sections = md.split(/^## /m).filter(Boolean);
  sections.forEach(function(sec) {
    var lines = sec.split('\n');
    var title = (lines.shift() || '').trim();
    html += '<div class="gl-letter">';
    html += '<div class="gl-letter-title">' + title + '</div>';
    var entries = [];
    var currentTerm = null;
    var currentDef = [];
    lines.forEach(function(line) {
      var tm = line.match(/^###\s+(.+)/);
      if (tm) {
        if (currentTerm) entries.push({ term: currentTerm, def: currentDef.join(' ').trim() });
        currentTerm = tm[1]; currentDef = [];
      } else if (currentTerm && line.trim()) {
        currentDef.push(line.trim());
      }
    });
    if (currentTerm) entries.push({ term: currentTerm, def: currentDef.join(' ').trim() });
    entries.forEach(function(e) {
      html += '<div class="gl-entry">';
      html += '<div class="gl-term">' + e.term + '</div>';
      html += '<div class="gl-def">' + e.def + '</div>';
      html += '</div>';
    });
    html += '</div>';
  });
  return '<div class="gl-page">' + html + '</div>';
}

/* ══════════════════════════════════════
   RENDER GALLERIA — Griglia immagini
   ══════════════════════════════════════ */
function _renderGalleria(md) {
  if (!md) return '';
  var html = '';
  var sections = md.split(/^## /m).filter(Boolean);
  sections.forEach(function(sec) {
    var lines = sec.split('\n');
    var title = (lines.shift() || '').trim();
    var body = lines.join('\n');
    var intro = '';
    var categories = {};
    var currentCat = null;
    body.split('\n').forEach(function(line) {
      var cm = line.match(/^###\s+(.+)/);
      if (cm) { currentCat = cm[1]; categories[currentCat] = []; return; }
      var im = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
      if (im && currentCat) { categories[currentCat].push({ alt: im[1], src: im[2] }); return; }
      var lm = line.match(/^- (.+)/);
      if (lm && currentCat) { categories[currentCat].push({ alt: lm[1].split('—')[0].trim(), src: '', caption: lm[1] }); return; }
      if (!cm && !im && !lm && line.trim() && !intro) intro = line.trim();
    });
    html += '<div class="gal-section">';
    html += '<div class="gal-title">' + title + '</div>';
    if (intro) html += '<div class="gal-intro">' + _mdToHtml(intro) + '</div>';
    Object.keys(categories).forEach(function(cat) {
      html += '<div class="gal-cat-title">' + cat + '</div>';
      html += '<div class="gal-grid">';
      categories[cat].forEach(function(img) {
        if (img.src) {
          html += '<div class="gal-item"><img src="' + img.src + '" alt="' + img.alt + '" loading="lazy">' + (img.alt ? '<div class="gal-caption">' + img.alt + '</div>' : '') + '</div>';
        } else if (img.caption) {
          html += '<div class="gal-item gal-text"><div class="gal-caption">' + img.caption + '</div></div>';
        }
      });
      html += '</div>';
    });
    html += '</div>';
  });
  return '<div class="gal-page">' + html + '</div>';
}

/* ══════════════════════════════════════
   RENDER TABELLE — Dati strutturati
   ══════════════════════════════════════ */
function _renderTabelle(md) {
  if (!md) return '';
  var html = '';
  var sections = md.split(/^## /m).filter(Boolean);
  sections.forEach(function(sec) {
    var lines = sec.split('\n');
    var title = (lines.shift() || '').trim();
    var body = lines.join('\n');
    var intro = '';
    var tables = [];
    var currentTable = [];
    var inTable = false;
    body.split('\n').forEach(function(line) {
      if (line.match(/^\|/)) {
        inTable = true;
        currentTable.push(line);
        return;
      }
      if (inTable && currentTable.length) {
        tables.push(currentTable.join('\n'));
        currentTable = [];
        inTable = false;
      }
      if (!line.match(/^\|/) && line.trim() && !intro) intro = line.trim();
    });
    if (inTable && currentTable.length) tables.push(currentTable.join('\n'));
    html += '<div class="tab-section">';
    html += '<div class="tab-title">' + title + '</div>';
    if (intro) html += '<div class="tab-intro">' + _mdToHtml(intro) + '</div>';
    tables.forEach(function(tbl) {
      html += '<div class="tab-wrap">' + _mdToHtml(tbl) + '</div>';
    });
    html += '</div>';
  });
  return '<div class="tab-page">' + html + '</div>';
}

/* ══════════════════════════════════════
   RENDER SCHEDE — layout generico a card
   Usato da: sessione, quest, npc, spell,
   specie, citta, evento.
   Formato: ## Nome (card) + - **Chiave:** val
   (campi) + ### Blocco (contenuto/elenchi)
   ══════════════════════════════════════ */
function _renderSchede(md) {
  if (!md) return '';
  var html = '';
  var sections = md.split(/^## /m).filter(Boolean);
  sections.forEach(function(sec) {
    var lines = sec.split('\n');
    var title = (lines.shift() || '').trim().replace(/^#\s+/, '');
    var fields = [];
    var blocks = {};
    var currentBlock = null;
    var blockContent = [];
    var intro = [];
    lines.forEach(function(line) {
      var fm = line.match(/^-\s+\*\*(.+?):?\*\*\s*:?\s*(.+)/);
      if (fm) { fields.push({ key: fm[1], val: fm[2] }); currentBlock = null; return; }
      var hm = line.match(/^###\s+(.+)/);
      if (hm) {
        if (currentBlock && blockContent.length) blocks[currentBlock] = blockContent.join('\n');
        currentBlock = hm[1]; blockContent = []; return;
      }
      if (currentBlock) { blockContent.push(line); return; }
      if (line.trim()) intro.push(line);
    });
    if (currentBlock && blockContent.length) blocks[currentBlock] = blockContent.join('\n');
    html += '<div class="sch-card">';
    html += '<div class="sch-title">' + title + '</div>';
    if (intro.length) html += '<div class="sch-intro">' + _mdToHtml(intro.join('\n')) + '</div>';
    if (fields.length) {
      html += '<div class="sch-fields">';
      fields.forEach(function(f) {
        html += '<div class="sch-field"><span class="sch-key">' + f.key + '</span><span class="sch-val">' + f.val + '</span></div>';
      });
      html += '</div>';
    }
    Object.keys(blocks).forEach(function(name) {
      html += '<div class="sch-block-title">' + name + '</div>';
      html += '<div class="sch-block-body">' + _mdToHtml(blocks[name]) + '</div>';
    });
    html += '</div>';
  });
  return '<div class="sch-page">' + html + '</div>';
}
