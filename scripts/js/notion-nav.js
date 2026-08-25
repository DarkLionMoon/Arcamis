/* ════════════════════════════════════
   notion-nav.js
   Navigazione SPA: gp(), _gpRender(),
   gpBack(), buildCrumb(), glossario,
   history API.
════════════════════════════════════ */

var navStack = [];

/* Helper HTML — esc()/attr() sono privati nell'IIFE di md-render.js,
   quindi qui servono versioni locali per il render dei JSON locali. */
function _siteEsc(s){return (s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function _siteAttr(s){return _siteEsc(s).replace(/"/g,'&quot;')}

/* ════ MARKDOWN → HTML (per JSON locali) ════
   Delega a md-render.js (condiviso con l'admin, così
   l'anteprima dell'editor è identica al sito). Se il
   renderer condiviso non è caricato, usa il fallback legacy. */
function _mdToHtml(md){
  if(!md) return '';
  if(typeof window.mdRender === 'function'){
    try{
      var _out = window.mdRender(md);
      if(_out) return _out;
    }catch(_e){}
  }
  /* ── Fallback legacy ── */
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

var _navMap = {

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
  /* Pantheon — pagina dedicata a una divinità */
  if(id && id.indexOf('pantheon-') === 0){
    return '/lore/pantheon/' + id.slice(9);
  }
  /* Lavori — pagina dedicata a un lavoro (stesso meccanismo del Pantheon) */
  if(id && id.indexOf('lavori-') === 0){
    return '/personaggio/lavori/' + id.slice(7);
  }
  var map = _getIdToPath();
  if(map[id]) return map[id];
/* Nessuna mappa — genera path automatico da UUID */
return '/p/' + id;
}

/* ════ DETECT PAGE LAYOUT FROM NOTION DATA ════ */
var _LAYOUT_DB_MAP = {

};

function _detectPageLayout(pg, blocks, pageId, navKey) {
  /* 1. Check parent database mapping */
  var parentDb = pg.parent && pg.parent.database_id ? pg.parent.database_id.replace(/-/g, '') : null;
  if (parentDb && _LAYOUT_DB_MAP[parentDb]) {
    return _LAYOUT_DB_MAP[parentDb];
  }
  
  /* 2. Check direct page ID mapping */
  if (_LAYOUT_DB_MAP[pageId]) {
    return _LAYOUT_DB_MAP[pageId];
  }
  
  /* 3. Check nav key (from breadcrumb hierarchy) */
  if (navKey) {
    if (navKey === 'regole') return 'regole';
    if (navKey === 'lavori') return 'lavoro';
    if (navKey === 'lore') return 'lore';
    if (navKey === 'personaggio') return 'personaggio';
  }
  
  /* 4. Check page icon for hints */
  var icon = pg.icon && pg.icon.emoji ? pg.icon.emoji : '';
  if (['📜', '📖', '📚', '🗒️', '🏛️', '📋'].indexOf(icon) > -1) return 'lore';
  if (['⚔️', '🗡️', '🛡️', '⚡', '🐉', '💀', '🔥'].indexOf(icon) > -1) return 'bestiario';
  if (['🏰', '🏛️', '⚖️', '👑', '🏴'].indexOf(icon) > -1) return 'fazioni';
  if (['💰', '💎', '🗝️', '🔮', '⚗️', '📦', '🎒'].indexOf(icon) > -1) return 'oggetti';
  if (['📝', '📐', '📏', '📊', '🗂️'].indexOf(icon) > -1) return 'tabelle';
  if (['🎭', '🎨', '🖼️', '📷', '🎬'].indexOf(icon) > -1) return 'galleria';
  
  /* 5. Check content blocks for patterns */
  var hasTable = blocks.some(function(b) { return b.type === 'table'; });
  if (hasTable) return 'tabelle';
  
  var hasGallery = blocks.some(function(b) { return b.type === 'child_database' || b.type === 'collection_view'; });
  if (hasGallery) return 'galleria';
  
  /* 6. Default */
  return 'default';
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
var _pantheonData = null;
var _panCollCache = null;
var _scrollPositions = {};
window.prefetchPage = function(id){
  var cacheKey = 'pg_' + id;
  if(!id || _memCache[cacheKey]) return;
  fetch('/content/pages/' + String(id).replace(/^pag-/,'') + '.json')
    .then(function(r){ return r.ok ? r.json() : null; })
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

/* ════ SOMMARIO LATERALE (ToC) — per-pagina ════ */
function _maybeBuildToc(pbody, showToc){
  var old = pbody.querySelector('.toc-wrap');
  if(old) old.remove();
  var nc = pbody.querySelector('.nc');
  if(!nc) return;
  var wrap = document.createElement('div');
  wrap.className = 'toc-wrap';
  nc.parentNode.insertBefore(wrap, nc);
  wrap.appendChild(nc);

  if(!showToc){ return; }
  wrap.classList.add('toc-active');
  var headings = nc.querySelectorAll('h2, h3, .n-h2, .n-h3');
  if(headings.length < 2){ wrap.classList.remove('toc-active'); return; }
  var nav = document.createElement('nav');
  nav.className = 'toc-sidebar';
  var ul = document.createElement('ul');
  headings.forEach(function(h, i){
    var id = 'toc-h-' + i;
    h.id = id;
    var li = document.createElement('li');
    li.className = 'toc-lvl-' + (h.tagName === 'H3' || h.classList.contains('n-h3') ? '2' : '1');
    var a = document.createElement('a');
    a.href = '#' + id;
    a.textContent = h.textContent.trim();
    a.addEventListener('click', function(e){
      e.preventDefault();
      h.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    li.appendChild(a);
    ul.appendChild(li);
  });
  nav.appendChild(ul);
  wrap.insertBefore(nav, nc);
  var tocLinks = nav.querySelectorAll('a');
  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        var idx = entry.target.id.replace('toc-h-','');
        tocLinks.forEach(function(l,i){ l.classList.toggle('active', i == idx); });
      }
    });
  }, { rootMargin: '-80px 0px -60% 0px', threshold: 0 });
  headings.forEach(function(h){ observer.observe(h); });
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
  /* Pagine locali a collezione: divinità del Pantheon (pantheon-<slug>)
     e Lavori (lavori-<slug>) — stesso meccanismo, sorgenti diverse. */
  var _collMatch = id.match(/^(pantheon|lavori)-(.+)$/);
  if(_collMatch){
    var _collKey = _collMatch[1], _slug = _collMatch[2];
    try{
      var _pd = await _loadPantheonData(_collKey);
      var _deity = _pd.deities.find(function(x){ return x.slug === _slug; });
      if(_deity){
        var _dic = _panIcon(_deity);
        var _collLabel = _collKey === 'lavori' ? 'Lavori ad Arcamis' : 'Archivi di Arcamis';
        phTitle.textContent = _deity.n;
        phIcon.textContent = _dic;
        phEyebrow.textContent = _collLabel;
        document.title = _deity.n + ' — Arcamis';
        phCrumb.innerHTML = buildCrumb(_deity.n);
        var _dacc = iconAccent(_dic);
        phHero.style.setProperty('--ph-acc', _dacc.c);
        phHero.style.setProperty('--ph-accbg', _dacc.bg);
        phCovbg.style.backgroundImage = '';
        phOverlay.style.opacity = '0';
        phIcon.style.opacity = '0.06';
        var _pbody = document.getElementById('pbody');
        _pbody.className = 'page-' + id + (_collKey === 'lavori' ? ' page-personaggio' : ' page-lore');
        _pbody.style.maxWidth = '';
        _pbody.style.width = '';
        var _deityFooter = '<div class="n-page-footer"><div class="n-page-footer-gems">✦ &nbsp; ✦ &nbsp; ✦</div>'
          + '<div class="n-page-footer-text">' + _collLabel + ' — ' + _siteEsc(_deity.n) + '</div></div>';
        _pbody.innerHTML = '<div class="nc" style="animation:fi .22s ease forwards">' + _scrubHtmlString(_renderDeityPage(_deity)) + _deityFooter + '</div>';
        applyGlossary(_pbody);
        _maybeBuildToc(_pbody, false);
        if(typeof afterPageRender === 'function') afterPageRender();
        return;
      }
    }catch(_pe){ /* fall through al renderer standard */ }
  }

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
          else if(_layout === 'regole' || _layout === 'contenuto') _localHtml = _renderRegole(_localJson.content);
          else if(_layout === 'lavoro') _localHtml = _renderLavoro(_localJson.content);
          else if(_layout === 'personaggio') _localHtml = _renderPersonaggio(_localJson.content);
          else if(_layout === 'lore' || _layout === 'luoghi') _localHtml = _renderLore(_localJson.content, _localJson.title, _localJson.icon);
          else if(_layout === 'pantheon') _localHtml = _renderPantheon(_localJson.content, (_localPage && _localPage.k) || 'pantheon');
          else if(_layout === 'bestiario') _localHtml = _renderBestiario(_localJson.content);
          else if(_layout === 'timeline' || _layout === 'cronache') _localHtml = _renderTimeline(_localJson.content);
          else if(_layout === 'fazioni') _localHtml = _renderFazioni(_localJson.content);
          else if(_layout === 'oggetti') _localHtml = _renderOggetti(_localJson.content);
          else if(_layout === 'glossario') _localHtml = _renderGlossario(_localJson.content);
          else if(_layout === 'galleria') _localHtml = _renderGalleria(_localJson.content);
          else if(_layout === 'tabelle') _localHtml = _renderTabelle(_localJson.content);
          else if(_layout === 'sessione' || _layout === 'quest' || _layout === 'npc' || _layout === 'spell' || _layout === 'specie' || _layout === 'citta' || _layout === 'evento') _localHtml = _renderSchede(_localJson.content);
          else if(_layout === 'wide') { _localHtml = _mdToHtml(_localJson.content); }
          else {
            /* Auto-detect by page key (legacy fallback) */
            _localHtml = (_localPage.k === 'materiale') ? _renderMateriale(_localJson.content) : (_localPage.k === 'regole' || _localPage.k === 'gameplay') ? _renderRegole(_localJson.content) : (_localPage.k === 'inizia' || _localPage.k === 'avanti') ? _renderPersonaggio(_localJson.content) : (_localPage.k === 'pantheon' || _localPage.k === 'maestria' || _localPage.k === 'arcamis' || _localPage.k === 'selva' || _localPage.k === 'foresta' || _localPage.k === 'volonx' || _localPage.k === 'arpax' || _localPage.k === 'galleria') ? _renderLore(_localJson.content, _localJson.title, _localJson.icon) : _mdToHtml(_localJson.content);
          }
          var pbody = document.getElementById('pbody');
          var layoutClass = _layout || 'default';
          pbody.className = 'page-' + id + ' page-' + layoutClass;
          pbody.style.maxWidth = '';
          pbody.style.width = '';
          if(_layout === 'wide') { pbody.style.maxWidth = 'none'; pbody.style.width = '100%'; }
          var _emptyHtml = '<div class="n-empty"><div class="n-empty-icon">' + picon + '</div>'
            + '<div class="n-empty-title">' + ptitle + '</div>'
            + '<div class="n-empty-msg">Questa pagina non ha ancora contenuto.</div></div>';
          var _footer = '<div class="n-page-footer"><div class="n-page-footer-gems">✦ &nbsp; ✦ &nbsp; ✦</div>'
            + '<div class="n-page-footer-text">Archivi di Arcamis — ' + ptitle + '</div></div>';
          pbody.innerHTML = '<div class="nc" style="animation:fi .22s ease forwards">' + (_scrubHtmlString(_localHtml || '') || _emptyHtml) + _footer + '</div>';
          if(_localPage.k === 'changelog' && window.loadChangelog){
            var _clWrap = document.createElement('div');
            _clWrap.className = 'hb-changelog-container';
            var _nc = pbody.querySelector('.nc');
            var _ft = pbody.querySelector('.n-page-footer');
            if(_ft) _nc.insertBefore(_clWrap, _ft); else _nc.appendChild(_clWrap);
            window.loadChangelog(_clWrap);
          }
          applyGlossary(pbody);
          _maybeBuildToc(pbody, !!_localJson.toc);
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

    /* Determine page layout type from Notion properties */
    var pageLayout = _detectPageLayout(pg, bl, id, _navKeyForPage(id));

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
    pbody.className='page-'+id+' page-'+pageLayout;
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
    _maybeBuildToc(pbody, false);

    _setNavFromPage(id);
    if(data.page)_renderLastUpdated(data.page.last_edited_time);
    if(typeof addRecente==='function')addRecente(id,ptitle,picon);
    if(typeof setBnavActive==='function')setBnavActive('');
    if(typeof afterPageRender==='function')afterPageRender();

  }catch(e){
    var _pb=document.getElementById('pbody');
    if(_pb){
      var _lbl=label||'Pagina';
      phTitle.textContent=_lbl;
      document.title=_lbl+' — Arcamis';
      _pb.innerHTML='<div class="nc"><div class="n-empty"><div class="n-empty-icon">🗺️</div>'
        +'<div class="n-empty-title">Pagina non trovata</div>'
        +'<div class="n-empty-msg">Il contenuto richiesto non esiste o è stato spostato. Usa la ricerca o il menu per continuare l\'esplorazione.</div></div></div>';
    }
    showToast('Contenuto non disponibile','⚠️',3000);
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
   RENDER LAVORO (stile Pantheon)
   Griglia di tiles con immagine + overlay,
   seguita dal contenuto delle sezioni.
   ══════════════════════════════════════ */
function _renderLavoro(md) {
  if (!md) return '';
  var html = '';

  /* Split per --- */
  var blocks = md.split(/\n---\n/);

  /* Primo blocco: titolo + intro + eventuale immagine hero */
  var first = (blocks.shift() || '').trim();
  if (first) {
    var lines = first.split('\n');
    var title = '';
    var intro = [];
    lines.forEach(function(line) {
      var hm = line.match(/^#\s+(.+)/);
      if (hm && !title) { title = hm[1].trim(); return; }
      if (line.trim()) intro.push(line);
    });
    if (title) html += '<div class="lv-title">' + esc(title) + '</div>';
    if (intro.length) html += '<div class="lv-intro">' + _mdToHtml(intro.join('\n')) + '</div>';
  }

  /* Sezioni ## → tiles stile Pantheon */
  var sections = [];
  blocks.forEach(function(block) {
    var lines = block.split('\n');
    var header = '';
    var body = [];
    var image = '';
    var subtitle = '';
    lines.forEach(function(line) {
      var hm = line.match(/^##\s+(.+)/);
      if (hm) { header = hm[1].trim(); return; }
      var imgM = line.match(/!\[[^\]]*\]\(([^)]+)\)/);
      if (imgM) { image = imgM[1]; return; }
      var subM = line.match(/^[-*]\s+\*\*(.+?)\*\*\s*:?\s*(.*)/);
      if (subM && !subtitle) { subtitle = subM[2].trim() || subM[1].trim(); }
      if (line.trim()) body.push(line);
    });
    if (header) sections.push({ title: header, body: body.join('\n'), image: image, subtitle: subtitle });
  });

  /* Griglia tiles */
  if (sections.length) {
    html += '<div class="lv-grid">';
    sections.forEach(function(sec, i) {
      html += '<a class="lv-tile" href="#lv-sec-' + i + '">';
      if (sec.image) {
        html += '<img class="lv-tile-img" src="' + esc(sec.image) + '" alt="' + esc(sec.title) + '" loading="lazy"/>';
      } else {
        html += '<div class="lv-tile-none"></div>';
      }
      html += '<div class="lv-tile-cap">';
      html += '<div class="lv-tile-name">' + esc(sec.title) + '</div>';
      if (sec.subtitle) html += '<div class="lv-tile-sub">' + esc(sec.subtitle) + '</div>';
      html += '</div></a>';
    });
    html += '</div>';

    /* Corpo sezioni sotto la griglia */
    html += '<div class="lv-sections">';
    sections.forEach(function(sec, i) {
      html += '<div class="lv-section" id="lv-sec-' + i + '">';
      html += '<div class="lv-sec-title">' + esc(sec.title) + '</div>';
      html += '<div class="lv-sec-body">' + _mdToHtml(sec.body) + '</div>';
      html += '</div>';
    });
    html += '</div>';
  }

  return '<div class="lv-page">' + html + '</div>';
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
   RENDER PANTHEON — Griglia divinità +
   pagina dedicata a ogni entità
   ══════════════════════════════════════ */
function _slugify(t){
  return (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
}
var _PAN_ICONS = {
  anivia:'❄️', janna:'🌬️', morgana:'🖤', taliyah:'🪨',
  kindred:'🐺', ornn:'🔨', volibear:'⚡', nagakabouros:'🐙',
  diana:'🌙', kayle:'⚔️', leona:'☀️', pantheon:'🛡️', taric:'💎', zoe:'✨'
};
function _panIcon(d){ return _PAN_ICONS[d.slug] || '🛐'; }
function _jsStr(s){ return (s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;'); }
function _parsePantheon(md){
  if(!md) return { intro:'', deities:[] };
  md = md.replace(/^\s*---\s*\n/, '');
  var blocks = md.split(/\n---\n/);
  var intro = (blocks.shift() || '').replace(/^#\s+.+\n?/, '').trim();
  var deities = [];
  blocks.forEach(function(block){
    var lines = block.split('\n');
    var name = null, img = '', rest = [];
    lines.forEach(function(line){
      if(name === null && /^#\s+(.+)/.test(line)){ name = line.replace(/^#\s+/, '').trim(); return; }
      var im = line.match(/^!\[[^\]]*\]\(([^)]+)\)/);
      if(im && !img){ img = im[1]; return; }
      rest.push(line);
    });
    if(!name) return;
    var pos = null;
    var posm = img.match(/#(\d{1,3})[.,](\d{1,3})$/);
    if(posm) pos = [parseInt(posm[1],10), parseInt(posm[2],10)];
    var epi = '';
    var epiRe = rest.join('\n').match(/-\s*\*\*Epiteto:?\*\*\s*:?\s*(.+)/);
    if(epiRe) epi = epiRe[1].trim();
    deities.push({
      slug: _slugify(name),
      n: name,
      img: img,
      pos: pos,
      epi: epi,
      md: rest.join('\n').replace(/^\n+/, '').trim()
    });
  });
  return { intro: intro, deities: deities };
}
function _loadPantheonData(key){
  key = key || 'pantheon';
  /* Cache per collezione: pantheon → pantheon.json, lavori → lavori.json */
  if(!_panCollCache) _panCollCache = {};
  if(_panCollCache[key]) return Promise.resolve(_panCollCache[key]);
  return fetch('/content/pages/' + key + '.json')
    .then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function(j){
      _panCollCache[key] = _parsePantheon(j.content || '');
      if(key === 'pantheon') _pantheonData = _panCollCache[key];
      return _panCollCache[key];
    });
}
function _renderDeityPage(d){
  var ic = _panIcon(d);
  var hero = '<div class="pan-deity-hero">'
    + (d.img
        ? '<img src="' + _siteAttr(d.img) + '" alt="' + _siteAttr(d.n) + '" loading="lazy"'
          + (d.pos ? ' style="object-position:' + d.pos[0] + '% ' + d.pos[1] + '%"' : '')
          + ' onerror="this.onerror=null;this.style.display=\'none\';this.parentNode.classList.add(\'hero-broken\');">'
        : '<div class="pan-deity-hero-none">' + ic + '</div>')
    + '<div class="pan-deity-caption"><span class="pd-name">' + _siteEsc(d.n) + '</span>'
    + (d.epi ? '<span class="pd-epi">' + _siteEsc(d.epi) + '</span>' : '')
    + '</div></div>';
  var body = d.md ? _mdToHtml(d.md) : '';
  return '<div class="pan-deity">' + hero + '<div class="pan-deity-body">' + body + '</div></div>';
}
function _renderPantheon(md, pageKey) {
  pageKey = pageKey || 'pantheon';
  /* Prefisso degli id subpage: pantheon-<slug> oppure lavori-<slug> ecc. */
  var _pre = pageKey === 'pantheon' ? 'pantheon-' : pageKey + '-';
  var data = _parsePantheon(md);
  _pantheonData = data;
  var html = '';
  if(data.intro) html += '<div class="pan-intro">' + _mdToHtml(data.intro) + '</div>';
  html += '<div class="pan-grid">';
  data.deities.forEach(function(d){
    var ic = _panIcon(d);
    if(!d.img){
      html += '<div class="pan-section"><div class="pan-section-title">' + _siteEsc(d.n) + '</div>'
        + '<div class="pan-section-body">' + _mdToHtml(d.md) + '</div></div>';
      return;
    }
    var _cfb = "this.onerror=null;this.style.display='none';this.parentNode.classList.add('pan-tile-none');";
    var go = "gp('" + _pre + d.slug + "','" + _jsStr(d.n) + "','" + ic + "')";
    html += '<div class="pan-tile" data-ic="' + ic + '" role="button" tabindex="0" onclick="' + go + '" onkeydown="if(event.key===\'Enter\')' + go + '">'
      + '<img class="pan-tile-img" src="' + _siteAttr(d.img) + '" alt="' + _siteAttr(d.n) + '" loading="lazy"'
      + (d.pos ? ' style="object-position:' + d.pos[0] + '% ' + d.pos[1] + '%"' : '')
      + ' onerror="' + _cfb + '">'
      + '<div class="pan-tile-caption"><span class="pan-tile-name">' + _siteEsc(d.n) + '</span>'
      + (d.epi ? '<span class="pan-tile-epi">' + _siteEsc(d.epi) + '</span>' : '')
      + '</div></div>';
  });
  html += '</div>';
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
