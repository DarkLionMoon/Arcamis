/* ════════════════════════════════════
   notion-render.js
   Rendering blocchi Notion in HTML:
   renderBlocks(), rt(), helper puri.
   Nessuna logica di navigazione.
════════════════════════════════════ */

var GALLERY_DB_ID = '2fd0274fdc1c80038889fc072a360bae';

/* ── Cover URL: proxy per URL S3 Notion che scadono ── */
function safeCoverUrl(url){
  if(!url)return null;
  if(url.indexOf('s3.us-west')>-1||url.indexOf('prod-files-secure')>-1){
    return'/api/notion?img='+encodeURIComponent(url);
  }
  return url;
}

var mapPageIds = new Set([
  '3090274fdc1c80e1a365ce1c36873455',
  '30d0274fdc1c800999feeb0ca6669b22',
  '30d0274fdc1c8016b113d5c2d7662d8f',
  '30d0274fdc1c804b9cb7e366f02bd635',
  '31f0274fdc1c8059a923c73da185a0e3',
  '31f0274fdc1c8019945af2b26306462f',
  '30d0274fdc1c803387c4fda013b857e9',
  '30d0274fdc1c8090aee7ed0430170414',
  '31f0274fdc1c8075b0dec2e2a6bc359e',
  '31f0274fdc1c805b89b8f0678463e615',
  '31f0274fdc1c808191abe4df86d176e6',
  '31e0274fdc1c80f3a3cee348f59cede0',
  '30d0274fdc1c80038beec3f444e45f8b',
  '30d0274fdc1c80cf8cdaf328e339dfc7',
  '3130274fdc1c80848fe5dfd7d2610c06',
  '31e0274fdc1c80f581f4f9cd7284bff0',
]);

/* ── Accent color dall'icona ── */
function iconAccent(emoji){
  if(!emoji)return{c:'rgba(200,155,60,.7)',bg:'rgba(200,155,60,.06)'};
  var e=emoji;
  if(['🔥','⚔️','🗡️','⚠️','🛡️','⚡','🐉','💀'].indexOf(e)>-1)return{c:'rgba(220,70,50,.75)',bg:'rgba(180,50,40,.06)'};
  if(['📚','📜','📖','🗒️','🏛️','📋'].indexOf(e)>-1)return{c:'rgba(190,140,60,.75)',bg:'rgba(150,110,40,.06)'};
  if(['🌊','💧','🌙','🐋','🚢','⚓','🌐'].indexOf(e)>-1)return{c:'rgba(60,120,220,.75)',bg:'rgba(40,80,180,.06)'};
  if(['🌿','🌱','🍃','🌲','🌳','🌾','🍀'].indexOf(e)>-1)return{c:'rgba(50,160,80,.75)',bg:'rgba(30,120,50,.06)'};
  if(['🔮','💜','🌑','👁️','🧿','✨','🌌'].indexOf(e)>-1)return{c:'rgba(140,80,240,.75)',bg:'rgba(100,50,200,.06)'};
  if(['🍺','🍻','🥂','🍖','🧀','🍴'].indexOf(e)>-1)return{c:'rgba(180,110,40,.75)',bg:'rgba(140,80,30,.06)'};
  if(['💊','⚕️','🏥','🌡️','🩺'].indexOf(e)>-1)return{c:'rgba(80,180,160,.75)',bg:'rgba(40,140,120,.06)'};
  return{c:'rgba(200,155,60,.7)',bg:'rgba(200,155,60,.06)'};
}

/* ── Gradient background dall'icona ── */
function iconGradient(emoji){
  var e=emoji||'';
  if(['🔥','⚔️','🗡️','⚠️','🛡️','⚡','🐉','💀'].indexOf(e)>-1)
    return'radial-gradient(ellipse 90% 60% at 50% 80%,#300a06 0%,#180402 50%,#080100 100%)';
  if(['📚','📜','📖','🗒️','🏛️','📋'].indexOf(e)>-1)
    return'radial-gradient(ellipse 90% 60% at 50% 80%,#201408 0%,#120c04 50%,#060400 100%)';
  if(['🌊','💧','🌙','🐋','🚢','⚓','🌐'].indexOf(e)>-1)
    return'radial-gradient(ellipse 90% 60% at 50% 80%,#081c30 0%,#041016 50%,#020608 100%)';
  if(['🌿','🌱','🍃','🌲','🌳','🌾','🍀'].indexOf(e)>-1)
    return'radial-gradient(ellipse 90% 60% at 50% 80%,#0a1e0c 0%,#061008 50%,#020602 100%)';
  if(['🔮','💜','🌑','👁️','🧿','✨','🌌'].indexOf(e)>-1)
    return'radial-gradient(ellipse 90% 60% at 50% 80%,#14083c 0%,#0a0420 50%,#04020e 100%)';
  if(['🍺','🍻','🥂','🍖','🍴'].indexOf(e)>-1)
    return'radial-gradient(ellipse 90% 60% at 50% 80%,#1e1006 0%,#100804 50%,#060200 100%)';
  if(['💊','⚕️','🏥','🌡️','🩺'].indexOf(e)>-1)
    return'radial-gradient(ellipse 90% 60% at 50% 80%,#061c1a 0%,#040e0e 50%,#020606 100%)';
  return'radial-gradient(ellipse 90% 60% at 50% 80%,#0e0c04 0%,#080602 50%,#040200 100%)';
}

/* ── Rich text ── */
function rt(arr){
  if(!arr||!arr.length)return'';
  return arr.map(function(r){
    var t=(r.plain_text||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    var a=r.annotations||{},cls=[];
    if(a.bold)cls.push('rb');if(a.italic)cls.push('ri');if(a.strikethrough)cls.push('rs');
    if(a.underline)cls.push('ru');if(a.code)cls.push('rc');
    if(a.color&&a.color!=='default')cls.push('r'+a.color.charAt(0));
    var inner=cls.length?'<span class="'+cls.join(' ')+'">'+t+'</span>':t;
    if(r.href){
      var m=r.href.match(/([a-f0-9]{32})(?:[?#]|$)/);
      if(m){
        var ni=pages.find(function(n){return n.id===m[1]});
        return'<a class="rl" onclick="gp(\''+m[1]+'\',\''+(ni?ni.l.replace(/'/g,"\\'"):'Pagina')+'\',\''+(ni?ni.i:'📄')+'\')">'+inner+'</a>';
      }
      return'<a href="'+r.href+'" target="_blank" rel="noopener" class="rl">'+inner+'</a>';
    }
    return inner;
  }).join('');
}

/* ── Callout color helper ── */
function calloutColor(ic){
  if(['📜','📖','📚','🗒️'].indexOf(ic)>-1)return{bg:'rgba(120,90,40,.07)',c:'rgba(180,130,50,.6)'};
  if(['⚠️','🔥','⚡','🗡️','⚔️','💀'].indexOf(ic)>-1)return{bg:'rgba(180,50,40,.07)',c:'rgba(210,70,55,.6)'};
  if(['🌊','💧','🌙','⭐','✨','🌌'].indexOf(ic)>-1)return{bg:'rgba(40,80,180,.07)',c:'rgba(70,110,220,.6)'};
  if(['🌿','🌱','🍃','🌲','🌳'].indexOf(ic)>-1)return{bg:'rgba(30,100,50,.07)',c:'rgba(60,150,80,.6)'};
  if(['🔮','💜','🌑','👁️','🧿'].indexOf(ic)>-1)return{bg:'rgba(100,50,180,.07)',c:'rgba(140,80,240,.6)'};
  return{bg:'rgba(200,155,60,.04)',c:'rgba(200,155,60,.55)'};
}

/* ── Hostname safe parse ── */
function safeHost(url){try{return new URL(url).hostname;}catch(e){return url;}}

/* ════════════════════════════════════
   renderBlocks — converte blocchi in HTML
════════════════════════════════════ */
function renderBlocks(blocks,isRoot){
  if(!blocks||!blocks.length)return'';
  var h='';
  for(var i=0;i<blocks.length;i++){
    var b=blocks[i],d=b[b.type]||{};
    switch(b.type){

      case'paragraph':
        h+='<p class="n-p">'+(rt(d.rich_text)||'<br>')+'</p>';
        break;

      case'heading_1':
        if(d.is_toggleable&&b.children){
          h+='<details class="n-toggle n-th"><summary class="n-h1 n-tsum">'+rt(d.rich_text)+'</summary>'
            +'<div class="n-tc">'+renderBlocks(b.children)+'</div></details>';
        }else{h+='<h2 class="n-h1 rr">'+rt(d.rich_text)+'</h2>';}
        break;

      case'heading_2':
        if(d.is_toggleable&&b.children){
          h+='<details class="n-toggle n-th"><summary class="n-h2 n-tsum">'+rt(d.rich_text)+'</summary>'
            +'<div class="n-tc">'+renderBlocks(b.children)+'</div></details>';
        }else{h+='<h3 class="n-h2 rr">'+rt(d.rich_text)+'</h3>';}
        break;

      case'heading_3':
        if(d.is_toggleable&&b.children){
          h+='<details class="n-toggle n-th"><summary class="n-h3 n-tsum">'+rt(d.rich_text)+'</summary>'
            +'<div class="n-tc">'+renderBlocks(b.children)+'</div></details>';
        }else{h+='<h4 class="n-h3 rr">'+rt(d.rich_text)+'</h4>';}
        break;

      case'bulleted_list_item':
        h+='<ul class="n-ul"><li>'+rt(d.rich_text)+(b.children?renderBlocks(b.children):'')+'</li></ul>';
        break;

      case'numbered_list_item':
        h+='<ol class="n-ol"><li>'+rt(d.rich_text)+(b.children?renderBlocks(b.children):'')+'</li></ol>';
        break;

      case'quote':
        h+='<blockquote class="n-quote">'+rt(d.rich_text)+'</blockquote>';
        break;

      case'divider':
        h+='<div class="n-divider"><span class="n-divider-gem">✦</span></div>';
        break;

      case'callout':
        var ic=d.icon&&d.icon.emoji?d.icon.emoji:'💡';
        var cc=calloutColor(ic);
        var isIntro=(isRoot&&i<=1);
        if(isIntro){
          h+='<div class="n-intro" style="border-left-color:'+cc.c+';background:'+cc.bg+'">'
            +'<div class="n-intro-icon">'+ic+'</div>'
            +'<div class="n-intro-body">'+rt(d.rich_text)+(b.children?renderBlocks(b.children):'')+'</div>'
            +'</div>';
        }else{
          h+='<div class="n-callout" style="--callout-bg:'+cc.bg+';--callout-c:'+cc.c+'">'
            +'<div class="n-callout-icon">'+ic+'</div>'
            +'<div class="n-callout-body">'+rt(d.rich_text)+(b.children?renderBlocks(b.children):'')+'</div></div>';
        }
        break;

      case'toggle':
        h+='<details class="n-toggle"><summary class="n-ts">'+rt(d.rich_text)+'</summary>'
          +'<div class="n-tc">'+(b.children?renderBlocks(b.children):'')+'</div></details>';
        break;

      case'code':
        var lang=d.language||'';
        h+='<pre class="n-code">'+(lang?'<div class="n-code-lang">'+lang+'</div>':'')+'<code>'
          +(d.rich_text||[]).map(function(r){return r.plain_text}).join('').replace(/</g,'&lt;')
          +'</code></pre>';
        break;

      case'image':
        var src=d.type==='external'?(d.external&&d.external.url):(d.file&&d.file.url);
        if(src){
          var cap=d.caption&&d.caption.length?rt(d.caption):'';
          h+='<figure class="n-image">'
            +'<img src="'+src+'" loading="lazy" class="n-zoomable" onclick="arcZoom(\''+src+'\')" onerror="this.parentElement.style.display=\'none\'"/>'
            +(cap?'<figcaption class="n-figcap">'+cap+'</figcaption>':'')
            +'</figure>';
        }
        break;

      case'video':
        var vsrc=d.type==='external'?d.external&&d.external.url:d.file&&d.file.url;
        if(vsrc){
          var ytm=vsrc.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
          var vim=vsrc.match(/vimeo\.com\/(\d+)/);
          if(ytm){
            h+='<div class="n-video"><iframe src="https://www.youtube.com/embed/'+ytm[1]+'" allowfullscreen loading="lazy"></iframe></div>';
          }else if(vim){
            h+='<div class="n-video"><iframe src="https://player.vimeo.com/video/'+vim[1]+'" allowfullscreen loading="lazy"></iframe></div>';
          }else{
            h+='<div class="n-video"><video controls src="'+vsrc+'" loading="lazy"></video></div>';
          }
        }
        break;

      case'embed':
        var eu=d.url||'#';
        var ytme=eu.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
        var vime=eu.match(/vimeo\.com\/(\d+)/);
        if(ytme){
          h+='<div class="n-video"><iframe src="https://www.youtube.com/embed/'+ytme[1]+'" allowfullscreen loading="lazy"></iframe></div>';
        }else if(vime){
          h+='<div class="n-video"><iframe src="https://player.vimeo.com/video/'+vime[1]+'" allowfullscreen loading="lazy"></iframe></div>';
        }else{
          h+='<a href="'+eu+'" target="_blank" rel="noopener" class="n-embed">'
            +'<div class="n-embed-icon">🔗</div>'
            +'<div class="n-embed-body">'
            +(d.caption&&d.caption.length?'<div class="n-bkm-label">'+rt(d.caption)+'</div>':'')
            +'<div class="n-embed-url">'+safeHost(eu)+'</div></div>'
            +'<div class="n-embed-open">APRI →</div></a>';
        }
        break;

      case'pdf':
        var pu=d.type==='external'?d.external&&d.external.url:d.file&&d.file.url;
        if(pu){
          var pcap=d.caption&&d.caption.length?d.caption.map(function(t){return t.plain_text}).join(''):'Documento PDF';
          h+='<a href="'+pu+'" target="_blank" rel="noopener" class="n-pdf">'
            +'<div class="n-pdf-icon">📄</div>'
            +'<div><div class="n-pdf-label">'+pcap+'</div>'
            +'<div class="n-pdf-hint">Apri PDF →</div></div></a>';
        }
        break;

      case'link_preview':
        var lpu=d.url||'#';
        h+='<a href="'+lpu+'" target="_blank" rel="noopener" class="n-bkm">'
          +'<div class="n-bkm-body"><div class="n-bkm-label">'+safeHost(lpu)+'</div>'
          +'<div class="n-bkm-url">'+lpu+'</div></div>'
          +'<div class="n-bkm-arr">→</div></a>';
        break;

      case'synced_block':
        if(b.children&&b.children.length){h+=renderBlocks(b.children,false);}
        break;

      case'child_page':
        var cpCards='';
        var cpUid='cp-'+Math.random().toString(36).slice(2,8);
        while(i<blocks.length&&blocks[i].type==='child_page'){
          var cpb=blocks[i],cpd=cpb[cpb.type]||{};
          var cpid=cpb.id.replace(/-/g,'');
          if(!cpid||cpid==='undefined'){i++;continue;}
          if(mapPageIds.has(cpid)){i++;continue;}
          var cpni=pages.find(function(n){return n.id===cpid});
          var cpicon=cpni?cpni.i:'📄';
          var cptitle=cpd.title||'Pagina';
          var cpacc=iconAccent(cpicon);
          var cpbg=iconGradient(cpicon);
          var cptitleSafe=cptitle.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
          cpCards+='<div class="loc-card" style="'+cpbg+'" onclick="gp(\''+cpid+'\',\''+cptitleSafe+'\',\''+cpicon+'\')">'
            +'<div class="loc-ov"><div class="loc-badge explored">'+cpicon+'</div>'
            +'<div class="loc-name">'+cptitle+'</div>'
            +'<div class="loc-sub" style="color:'+cpacc.c+'">Apri \u2192</div>'
            +'<div class="loc-cta">APRI \u25c6</div></div></div>';
          i++;
        }
        if(cpCards){
          h+='<div class="n-db-lc-wrap" id="'+cpUid+'"><div class="loc-wrap" style="margin:0"><div class="loc-track-outer"><div class="loc-track" data-idx="0" style="gap:16px">'+cpCards+'</div></div><div class="la la-prev" onclick="dbLocNav(this,-1)">&#8249;</div><div class="la la-next" onclick="dbLocNav(this,1)">&#8250;</div></div></div>';
        }
        i--;
        break;

case 'child_database':
  var dbRawId = b.id.replace(/-/g, '');
  if (dbRawId === GALLERY_DB_ID) {
    h += '<div class="gs-container" id="gs-' + dbRawId + '"></div>';
  } else if (dbRawId === '2f70274fdc1c803ca5cafa97ca1817cd') {
    /* Sottoclassi Homebrew — layout sidebar+content */
    h += '<div class="hb-subclass-container" id="hbsc-' + dbRawId + '"></div>';
  } else {
    h += '<div class="n-db-wrap">'
      + (d.title ? '<div class="n-db-title">' + d.title + '</div>' : '')
      + '<div class="n-db-grid" id="db-' + dbRawId + '"><div class="n-db-loading">⏳ Caricamento...</div></div></div>';
  }
  break;

      case'table':
        var rows=b.children||[],hasH=d.has_column_header,hasR=d.has_row_header;
        h+='<div class="n-twrap"><table class="n-tbl"><tbody>';
        rows.forEach(function(row,ri){
          var cells=row.table_row&&row.table_row.cells||[];
          h+='<tr>';cells.forEach(function(cell,ci){
            var tag=(hasH&&ri===0)||(hasR&&ci===0)?'th':'td';
            h+='<'+tag+'>'+rt(cell)+'</'+tag+'>';
          });h+='</tr>';
        });
        h+='</tbody></table></div>';
        break;

      case'column_list':
        var cols=b.children||[];
        h+='<div class="n-cols" style="grid-template-columns:repeat('+cols.length+',1fr);display:grid;gap:24px">';
        cols.forEach(function(col){h+='<div>'+(col.children?renderBlocks(col.children):'')+'</div>'});
        h+='</div>';
        break;

      case'to_do':
        h+='<div class="n-todo"><span class="n-todo-box">'+(d.checked?'✅':'☐')+'</span>'
          +'<div>'+rt(d.rich_text)+'</div></div>';
        break;

      case'bookmark':
        var bu=d.url||'#';
        h+='<a href="'+bu+'" target="_blank" rel="noopener" class="n-bkm">'
          +'<div class="n-bkm-body"><div class="n-bkm-label">'+(d.caption&&d.caption.length?rt(d.caption):safeHost(bu))+'</div>'
          +'<div class="n-bkm-url">'+bu+'</div></div>'
          +'<div class="n-bkm-arr">→</div></a>';
        break;
    }
  }

  /* Unisci liste adiacenti dello stesso tipo */
  var tmp=document.createElement('div');tmp.innerHTML=h;
  ['ul','ol'].forEach(function(tag){
    tmp.querySelectorAll(tag).forEach(function(el){
      var p=el.previousElementSibling;
      if(p&&p.tagName===tag.toUpperCase()&&p.className===el.className){
        while(el.firstChild)p.appendChild(el.firstChild);el.remove();
      }
    });
  });
  return tmp.innerHTML;
}

/* ════════════════════════════════════
   DATABASE GALLERY — carousel
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
   console.log('dbId:', dbId);
  try{
    var r=await fetch('/api/notion?dbId='+dbId);
    if(!r.ok)throw new Error('HTTP '+r.status);
    var data=await r.json();
    if(!data.pages||!data.pages.length){
      grid.innerHTML='<div class="n-db-loading">Nessun elemento trovato.</div>';return;
    }
    var cardsHtml=sortedPages.map(function(p){
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
     /* ── SPECIE HOMEBREW: layout sidebar + content ── */
var SPECIE_DB = '2f60274fdc1c80fba671c588ba93b116';
if(dbId === SPECIE_DB){
  var specieHtml = '<div class="sp-layout">'
    + '<div class="sp-sidebar"><div class="sp-sidebar-title">Specie</div><ul class="sp-list">'
    var sortedPages = data.pages.slice().sort(function(a,b){ return a.title.localeCompare(b.title,'it'); });
        var icon = p.icon||'📄';
        var title = p.title.replace(/'/g,"\\'");
        return '<li class="sp-item" onclick="spSelect(this,\''+p.id+'\',\''+title+'\',\''+icon+'\')">'+p.title+'</li>';
      }).join('')
    + '</ul></div>'
    + '<div class="sp-content" id="sp-content"><div class="sp-placeholder">← Seleziona una specie</div></div>'
    + '</div>';
  if(wrap){ wrap.outerHTML='<div class="n-db-lc-wrap" id="'+uid+'">'+titleHtml+specieHtml+'</div>'; }
  else{ grid.outerHTML='<div>'+specieHtml+'</div>'; }
  _injectSpecieCSS();
  return;
}
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
window.spSelect = function(el, id, title, icon){
  document.querySelectorAll('.sp-item').forEach(function(i){ i.classList.remove('active'); });
  el.classList.add('active');
  var content = document.getElementById('sp-content');
  if(!content) return;
  content.innerHTML = '<div class="sp-loading"><div class="gs-loading-spin"></div></div>';
  
  fetch('/api/notion?pageId=' + id)
    .then(function(r){ return r.json(); })
    .then(function(data){
      if(!data.blocks) throw new Error('no blocks');
      var html = renderBlocks(data.blocks, true);
      content.innerHTML = '<div class="n-body">'
        + '<div class="sp-content-title">'
        + (icon && icon !== '📄' ? '<span style="font-size:1.4em;margin-right:10px">'+icon+'</span>' : '')
        + title
        + '</div>'
        + html
        + '</div>';
    })
    .catch(function(){
      content.innerHTML = '<div style="color:rgba(200,155,60,.4);font-family:Cinzel,serif;font-size:11px;padding:40px;text-align:center">Errore caricamento</div>';
    });
};

function _injectSpecieCSS(){
  if(document.getElementById('specie-css')) return;
  var s = document.createElement('style');
  s.id = 'specie-css';
  s.textContent = `
.sp-layout{
  display:grid;grid-template-columns:240px 1fr;gap:0;
  min-height:600px;border:1px solid rgba(200,155,60,.15);
  width:100%;max-width:100%;
}
.sp-sidebar{
  border-right:1px solid rgba(200,155,60,.15);
  background:rgba(4,6,14,.6);overflow-y:auto;
}
.sp-sidebar-title{
  font-family:'Cinzel',serif;font-size:8px;font-weight:700;
  letter-spacing:.25em;color:rgba(200,155,60,.5);
  padding:16px 18px 10px;text-transform:uppercase;
  border-bottom:1px solid rgba(200,155,60,.1);
}
.sp-list{list-style:none;margin:0;padding:8px 0;}
.sp-item{
  font-family:'Cinzel',serif;font-size:11px;letter-spacing:.04em;
  color:rgba(240,230,200,.6);padding:9px 18px;cursor:pointer;
  transition:.15s;border-left:2px solid transparent;
}
.sp-item:hover{color:rgba(240,230,200,.95);background:rgba(200,155,60,.06);}
.sp-item.active{
  color:var(--gold2,#c89b3c);background:rgba(200,155,60,.1);
  border-left-color:rgba(200,155,60,.7);
}
.sp-content{
  padding:28px 32px;background:rgba(6,8,18,.4);
  overflow-y:auto;max-height:90vh;
}
.sp-placeholder{
  font-family:'Cinzel',serif;font-size:11px;letter-spacing:.1em;
  color:rgba(200,155,60,.25);padding:40px 0;text-align:center;
}
.sp-loading{display:flex;justify-content:center;padding:60px 0;}
@media(max-width:600px){
  .sp-layout{grid-template-columns:1fr;}
  .sp-sidebar{border-right:none;border-bottom:1px solid rgba(200,155,60,.15);max-height:200px;}
}
.sp-content-title{
  font-family:'Cinzel',serif;font-size:22px;font-weight:700;
  color:var(--gold2,#c89b3c);letter-spacing:.06em;
  margin-bottom:24px;padding-bottom:16px;
  border-bottom:1px solid rgba(200,155,60,.2);
  display:flex;align-items:center;
}
  `;
  document.head.appendChild(s);
}
