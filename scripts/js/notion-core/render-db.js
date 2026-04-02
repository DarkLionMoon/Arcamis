function _dbArrows(wrap,idx,maxIdx){
  var prev=wrap.querySelector('.la-prev'),next=wrap.querySelector('.la-next');
  if(prev){prev.style.opacity=idx<=0?'0.2':'1';prev.style.pointerEvents=idx<=0?'none':'auto';}
  if(next){next.style.opacity=idx>=maxIdx?'0.2':'1';next.style.pointerEvents=idx>=maxIdx?'none':'auto';}
}

function dbLocNav(btn,dir){
  var wrap=btn.closest('.n-db-lc-wrap,.loc-wrap');
  if(!wrap)return;
  var track=wrap.querySelector('.loc-track');
  var outer=wrap.querySelector('.loc-track-outer');
  var cards=track?track.querySelectorAll('.loc-card'):[];
  if(!cards.length)return;
  var cardW=cards[0].getBoundingClientRect().width||240;
  var gap=16;
  var step=cardW+gap;
  var trackW=cards.length*step-gap;
  var outerW=(outer?outer.getBoundingClientRect().width:600)||600;
  var maxIdx=Math.max(0,Math.ceil((trackW-outerW+1)/step));
  var idx=Math.min(maxIdx,Math.max(0,parseInt(track.getAttribute('data-idx')||'0',10)+dir));
  track.setAttribute('data-idx',idx);
  track.style.transform='translateX(-'+(idx*step)+'px)';
  var arrowWrap=wrap.classList.contains('n-db-lc-wrap')?wrap:wrap.closest('.n-db-lc-wrap');
  if(arrowWrap)_dbArrows(arrowWrap,idx,maxIdx);
}

function _initCarouselArrows(container){
  container.querySelectorAll('.n-db-lc-wrap,.loc-wrap').forEach(function(wrap){
    var track=wrap.querySelector('.loc-track');
    var outer=wrap.querySelector('.loc-track-outer');
    if(!track||!outer)return;
    var cards=track.querySelectorAll('.loc-card');
    if(!cards.length)return;
    requestAnimationFrame(function(){
      var cardW=cards[0].getBoundingClientRect().width||240;
      var step=cardW+16;
      var trackW=cards.length*step-16;
      var outerW=outer.getBoundingClientRect().width||600;
      var maxIdx=Math.max(0,Math.ceil((trackW-outerW+1)/step));
      var root=wrap.classList.contains('n-db-lc-wrap')?wrap:(wrap.closest('.n-db-lc-wrap')||wrap);
      _dbArrows(root,0,maxIdx);
    });
  });
}

async function loadDbGalleries(container){
  var grids=container.querySelectorAll('.n-db-grid[id^="db-"]');
  var io=new IntersectionObserver(function(entries,obs){
    entries.forEach(function(en){
      if(!en.isIntersecting)return;
      obs.unobserve(en.target);
      _loadSingleDb(en.target);
    });
  },{rootMargin:'200px'});
  grids.forEach(function(g){io.observe(g);});
}

async function _loadSingleDb(grid){
  var dbId=grid.id.replace('db-','');
  try{
    var r=await fetch('/api/notion?dbId='+dbId);
    if(!r.ok)throw new Error('HTTP '+r.status);
    var data=await r.json();
    if(!data.pages||!data.pages.length){
      grid.innerHTML='<div class="n-db-loading">Nessun elemento trovato.</div>';return;
    }

    var SPECIE_DB='2f60274fdc1c80fba671c588ba93b116';
    if(dbId===SPECIE_DB){
      var sortedPages=data.pages.slice().sort(function(a,b){return a.title.localeCompare(b.title,'it');});
      var specieHtml='<div class="sp-layout">'
        +'<div class="sp-sidebar"><div class="sp-sidebar-title">Specie</div><ul class="sp-list">'
        +sortedPages.map(function(p){
          var icon=p.icon||'📄';
          var title=p.title.replace(/'/g,"\\'");
          return'<li class="sp-item" onclick="spSelect(this,\''+p.id+'\',\''+title+'\',\''+icon+'\')">'+p.title+'</li>';
        }).join('')
        +'</ul></div>'
        +'<div class="sp-content" id="sp-content"><div class="sp-placeholder">← Seleziona una specie</div></div>'
        +'</div>';
      var wrap=grid.closest('.n-db-wrap');
      var titleEl=wrap?wrap.querySelector('.n-db-title'):null;
      var titleHtml=titleEl?'<div class="n-db-title">'+titleEl.textContent+'</div>':'';
      var uid='dblc-'+dbId;
      if(wrap){wrap.outerHTML='<div class="n-db-lc-wrap" id="'+uid+'">'+titleHtml+specieHtml+'</div>';}
      else{grid.outerHTML='<div>'+specieHtml+'</div>';}
      _injectSpecieCSS();
      return;
    }

    var TIMELINE_DB='2fc0274fdc1c800f8ac0d6d03b255cad';
    if(dbId===TIMELINE_DB){
      var wrap=grid.closest('.n-db-wrap');
      var uid='tl-'+dbId;
      if(wrap){wrap.outerHTML='<div class="n-db-lc-wrap" id="'+uid+'"></div>';}
      var tlContainer=document.getElementById(uid);
      if(tlContainer&&window.renderTimeline){window.renderTimeline(tlContainer,data.pages);}
      return;
    }

    var SUBCLASS_DB='2f70274fdc1c80e3bdc7f95f81eb9cc0';
    if(dbId===SUBCLASS_DB){
      var wrap=grid.closest('.n-db-wrap');
      var uid='dblc-'+dbId;
      if(wrap){wrap.outerHTML='<div class="n-db-lc-wrap" id="'+uid+'"><div id="hbsc-inner-'+dbId+'"></div></div>';}
      var innerEl=document.getElementById('hbsc-inner-'+dbId);
      if(innerEl&&window.loadSubclassGallery){window.loadSubclassGallery(innerEl,data.pages);}
      return;
    }
    var GALLERY_PG_DB = '2fd0274fdc1c80038889fc072a360bae';
if (dbId === GALLERY_PG_DB) {
  var wrap = grid.closest('.n-db-wrap');
  var uid = 'dblc-' + dbId;
  if (wrap) { wrap.outerHTML = '<div class="n-db-lc-wrap" id="' + uid + '"><div id="gspg-inner-' + dbId + '"></div></div>'; }
  var innerEl = document.getElementById('gspg-inner-' + dbId);
  if (innerEl && window.loadGallery) { window.loadGallery(innerEl); }
  return;
}


    var cardsHtml=data.pages.map(function(p){
      var icon=p.icon||'📄';
      var acc=iconAccent(icon);
      var coverSafe=safeCoverUrl(p.cover);
      var bg=coverSafe
        ?'background-image:url("'+coverSafe+'");background-size:cover;background-position:center'
        :'background:'+iconGradient(icon);
      var title=p.title.replace(/'/g,"\\'").replace(/"/g,'&quot;');
      return'<div class="loc-card" style="'+bg+'" onclick="gp(\''+p.id+'\',\''+title+'\',\''+icon+'\')">'
        +'<div class="loc-ov">'
        +'<div class="loc-badge explored">'+icon+'</div>'
        +'<div class="loc-name">'+p.title+'</div>'
        +'<div class="loc-sub" style="color:'+acc.c+'">Scopri →</div>'
        +'<div class="loc-cta">APRI ◆</div>'
        +'</div></div>';
    }).join('');
    var wrap=grid.closest('.n-db-wrap');
    var titleEl=wrap?wrap.querySelector('.n-db-title'):null;
    var titleHtml=titleEl?'<div class="n-db-title">'+titleEl.textContent+'</div>':'';
    var uid='dblc-'+dbId;
    if(data.pages.length===1){
      var singleHtml=titleHtml+'<div class="n-db-single">'+cardsHtml+'</div>';
      if(wrap){wrap.outerHTML='<div class="n-db-lc-wrap n-db-single-wrap" id="'+uid+'">'+singleHtml+'</div>';}
      else{grid.outerHTML='<div class="n-db-single">'+cardsHtml+'</div>';}
      return;
    }
    if(wrap){
      wrap.outerHTML=
        '<div class="n-db-lc-wrap" id="'+uid+'">'
        +titleHtml
        +'<div class="loc-wrap" style="margin:0">'
        +'<div class="loc-track-outer">'
        +'<div class="loc-track" data-idx="0" style="gap:16px">'+cardsHtml+'</div>'
        +'</div>'
        +'<div class="la la-prev" onclick="dbLocNav(this,-1)">‹</div>'
        +'<div class="la la-next" onclick="dbLocNav(this,1)">›</div>'
        +'</div></div>';
    }else{
      grid.outerHTML='<div class="loc-track" data-idx="0" style="gap:16px;display:flex">'+cardsHtml+'</div>';
    }
  }catch(e){
    grid.innerHTML='<div class="n-db-loading">⚠️ Errore caricamento.</div>';
  }
}
