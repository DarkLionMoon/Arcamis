/* ════════════════════════════════════
   notion-core/render-db.js
   Caricamento e rendering database Notion:
   loadDbGalleries(), _loadSingleDb(),
   dbLocNav(), _dbArrows(), spSelect(),
   _injectSpecieCSS().

   ⚠️ Dipende da: render-helpers.js,
      render-blocks.js
════════════════════════════════════ */

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

    /* ── SPECIE HOMEBREW ── */
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

    /* ── TIMELINE AETHERION ── */
    var TIMELINE_DB='2fc0274fdc1c800f8ac0d6d03b255cad';
    if(dbId===TIMELINE_DB){
      var wrap=grid.closest('.n-db-wrap');
      var uid='tl-'+dbId;
      if(wrap){wrap.outerHTML='<div class="n-db-lc-wrap" id="'+uid+'"></div>';}
      var tlContainer=document.getElementById(uid);
      if(tlContainer&&window.renderTimeline){window.renderTimeline(tlContainer,data.pages);}
      return;
    }

    /* ── SOTTOCLASSI HOMEBREW ── */
    var SUBCLASS_DB='2f70274fdc1c80e3bdc7f95f81eb9cc0';
    if(dbId===SUBCLASS_DB){
      var wrap=grid.closest('.n-db-wrap');
      var uid='dblc-'+dbId;
      if(wrap){wrap.outerHTML='<div class="n-db-lc-wrap" id="'+uid+'"><div id="hbsc-inner-'+dbId+'"></div></div>';}
      var innerEl=document.getElementById('hbsc-inner-'+dbId);
      if(innerEl&&window.loadSubclassGallery){window.loadSubclassGallery(innerEl,data.pages);}
      return;
    }

    /* ── CAROUSEL GENERICO ── */
    var allBanners=data.pages.every(function(p){return!safeCoverUrl(p.cover);});
    var cardsHtml=data.pages.map(function(p){
      var icon=p.icon||'📄';
      var acc=iconAccent(icon);
      var coverSafe=safeCoverUrl(p.cover);
      var title=p.title.replace(/'/g,"\\'").replace(/"/g,'&quot;');
      if(coverSafe){
        return'<div class="loc-card" style="background-image:url(\"'+coverSafe+'\");background-size:cover;background-position:center" onclick="gp(\''+p.id+'\',\''+title+'\',\''+icon+'\')">'
          +'<div class="loc-ov">'
          +'<div class="loc-badge explored">'+icon+'</div>'
          +'<div class="loc-name">'+p.title+'</div>'
          +'<div class="loc-sub" style="color:'+acc.c+'">Scopri →</div>'
          +'<div class="loc-cta">APRI ◆</div>'
          +'</div></div>';
      }else{
        return'<div class="loc-banner" style="'+iconGradient(icon)+'" onclick="gp(\''+p.id+'\',\''+title+'\',\''+icon+'\')">'
          +'<div class="loc-banner-accent" style="background:'+acc.c+'"></div>'
          +'<div class="loc-banner-icon" style="color:'+acc.c+'">'+icon+'</div>'
          +'<div class="loc-banner-body">'
          +'<div class="loc-banner-title">'+p.title+'</div>'
          +'<div class="loc-banner-sub" style="color:'+acc.c+'">Scopri →</div>'
          +'</div>'
          +'<div class="loc-banner-arr" style="color:'+acc.c+'">◆</div>'
          +'</div>';
      }
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
    if(allBanners){
      if(wrap){
        wrap.outerHTML='<div class="n-db-lc-wrap" id="'+uid+'">'+titleHtml+'<div class="loc-banner-grid">'+cardsHtml+'</div></div>';
      }else{
        grid.outerHTML='<div class="loc-banner-grid">'+cardsHtml+'</div>';
      }
    }else{
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
    }
  }catch(e){
    grid.innerHTML='<div class="n-db-loading">⚠️ Errore caricamento.</div>';
  }
}

function _injectSpecieCSS(){
  if(document.getElementById('specie-css'))return;
  var s=document.createElement('style');
  s.id='specie-css';
  s.textContent=`
.sp-layout{display:grid;grid-template-columns:240px 1fr;gap:0;min-height:600px;border:1px solid rgba(200,155,60,.15);width:100%;max-width:100%;}
.sp-sidebar{border-right:1px solid rgba(200,155,60,.15);background:rgba(4,6,14,.6);overflow-y:auto;}
.sp-sidebar-title{font-family:'Cinzel',serif;font-size:8px;font-weight:700;letter-spacing:.25em;color:rgba(200,155,60,.5);padding:16px 18px 10px;text-transform:uppercase;border-bottom:1px solid rgba(200,155,60,.1);}
.sp-list{list-style:none;margin:0;padding:8px 0;}
.sp-item{font-family:'Cinzel',serif;font-size:11px;letter-spacing:.04em;color:rgba(240,230,200,.6);padding:9px 18px;cursor:pointer;transition:.15s;border-left:2px solid transparent;}
.sp-item:hover{color:rgba(240,230,200,.95);background:rgba(200,155,60,.06);}
.sp-item.active{color:var(--gold2,#c89b3c);background:rgba(200,155,60,.1);border-left-color:rgba(200,155,60,.7);}
.sp-content{padding:28px 32px;background:rgba(6,8,18,.4);overflow-y:auto;max-height:90vh;}
.sp-placeholder{font-family:'Cinzel',serif;font-size:11px;letter-spacing:.1em;color:rgba(200,155,60,.25);padding:40px 0;text-align:center;}
.sp-loading{display:flex;justify-content:center;padding:60px 0;}
@media(max-width:600px){.sp-layout{grid-template-columns:1fr;}.sp-sidebar{border-right:none;border-bottom:1px solid rgba(200,155,60,.15);max-height:200px;}}
.sp-content-title{font-family:'Cinzel',serif;font-size:22px;font-weight:700;color:var(--gold2,#c89b3c);letter-spacing:.06em;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid rgba(200,155,60,.2);display:flex;align-items:center;}
  `;
  document.head.appendChild(s);
}

window.spSelect=function(el,id,title,icon){
  document.querySelectorAll('.sp-item').forEach(function(i){i.classList.remove('active');});
  el.classList.add('active');
  var content=document.getElementById('sp-content');
  if(!content)return;
  content.innerHTML='<div class="sp-loading"><div class="gs-loading-spin"></div></div>';
  fetch('/api/notion?pageId='+id)
    .then(function(r){return r.json();})
    .then(function(data){
      if(!data.blocks)throw new Error('no blocks');
      var html=renderBlocks(data.blocks,true);
      content.innerHTML='<div class="n-body">'
        +'<div class="sp-content-title">'
        +(icon&&icon!=='📄'?'<span style="font-size:1.4em;margin-right:10px">'+icon+'</span>':'')
        +title
        +'</div>'
        +html
        +'</div>';
    })
    .catch(function(){
      content.innerHTML='<div style="color:rgba(200,155,60,.4);font-family:Cinzel,serif;font-size:11px;padding:40px;text-align:center">Errore caricamento</div>';
    });
};
