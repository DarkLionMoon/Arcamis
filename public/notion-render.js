/* ════════════════════════════════════
   NOTION RENDER — auto-styling engine
════════════════════════════════════ */

var navStack = []; /* navigation history [{id,label,icon},...] */

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

/* ── renderBlocks ── */
function renderBlocks(blocks,isRoot){
  if(!blocks||!blocks.length)return'';
  var h='';
  for(var i=0;i<blocks.length;i++){
    var b=blocks[i],d=b[b.type]||{};
    switch(b.type){

      case'paragraph':
        h+='<p class="n-p">'+(rt(d.rich_text)||'<br>')+'</p>';
        break;

      case'heading_1':h+='<h2 class="n-h1">'+rt(d.rich_text)+'</h2>';break;
      case'heading_2':h+='<h3 class="n-h2">'+rt(d.rich_text)+'</h3>';break;
      case'heading_3':h+='<h4 class="n-h3">'+rt(d.rich_text)+'</h4>';break;

      case'bulleted_list_item':
        h+='<ul class="n-ul"><li>'+rt(d.rich_text)+(b.children?renderBlocks(b.children):'')+'</li></ul>';break;
      case'numbered_list_item':
        h+='<ol class="n-ol"><li>'+rt(d.rich_text)+(b.children?renderBlocks(b.children):'')+'</li></ol>';break;

      case'quote':
        h+='<blockquote class="n-quote">'+rt(d.rich_text)+'</blockquote>';break;

      case'divider':
        h+='<div class="n-divider"><span class="n-divider-gem">✦</span></div>';break;

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
          +'<div class="n-tc">'+(b.children?renderBlocks(b.children):'')+'</div></details>';break;

      case'code':
        var lang=d.language||'';
        h+='<pre class="n-code">'+(lang?'<div class="n-code-lang">'+lang+'</div>':'')+'<code>'
          +(d.rich_text||[]).map(function(r){return r.plain_text}).join('').replace(/</g,'&lt;')
          +'</code></pre>';break;

      case'image':
        var src=d.type==='external'?(d.external&&d.external.url):(d.file&&d.file.url);
        if(src){
          var cap=d.caption&&d.caption.length?rt(d.caption):'';
          h+='<figure class="n-image">'
            +'<img src="'+src+'" loading="lazy" onerror="this.parentElement.style.display=\'none\'"/>'
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
        while(i<blocks.length&&blocks[i].type==='child_page'){
          var cpb=blocks[i],cpd=cpb[cpb.type]||{};
          var cpid=cpb.id.replace(/-/g,'');
          var cpni=pages.find(function(n){return n.id===cpid});
          var cpicon=cpni?cpni.i:'📄';
          var cptitle=cpd.title||'Pagina';
          var cpacc=iconAccent(cpicon);
          cpCards+='<div class="n-cp" style="--cpacc:'+cpacc.c+';--cpaccbg:'+cpacc.bg+'" onclick="gp(\''+cpid+'\',\''+cptitle.replace(/'/g,"\\'")+'\',\''+cpicon+'\')">'
            +'<div class="n-cp-thumb" style="background:'+cpacc.bg+'">'+cpicon+'</div>'
            +'<div class="n-cp-info"><div class="n-cp-title">'+cptitle+'</div>'
            +'<div class="n-cp-cta">Apri →</div></div></div>';
          i++;
        }
        h+='<div class="n-cp-grid">'+cpCards+'</div>';
        i--;
        break;

      case'child_database':
        var dbRawId=b.id.replace(/-/g,'');
        h+='<div class="n-db-wrap">'
          +(d.title?'<div class="n-db-title">'+d.title+'</div>':'')
          +'<div class="n-db-grid" id="db-'+dbRawId+'"><div class="n-db-loading">⏳ Caricamento...</div></div></div>';
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
        h+='</tbody></table></div>';break;

      case'column_list':
        var cols=b.children||[];
        h+='<div class="n-cols" style="grid-template-columns:repeat('+cols.length+',1fr);display:grid;gap:24px">';
        cols.forEach(function(col){h+='<div>'+(col.children?renderBlocks(col.children):'')+'</div>'});
        h+='</div>';break;

      case'to_do':
        h+='<div class="n-todo"><span class="n-todo-box">'+(d.checked?'✅':'☐')+'</span>'
          +'<div>'+rt(d.rich_text)+'</div></div>';break;

      case'bookmark':
        var bu=d.url||'#';
        h+='<a href="'+bu+'" target="_blank" rel="noopener" class="n-bkm">'
          +'<div class="n-bkm-body"><div class="n-bkm-label">'+(d.caption&&d.caption.length?rt(d.caption):safeHost(bu))+'</div>'
          +'<div class="n-bkm-url">'+bu+'</div></div>'
          +'<div class="n-bkm-arr">→</div></a>';break;
    }
  }
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
   DATABASE GALLERY — loc-card carousel
════════════════════════════════════ */

/* gradient di sfondo dall'icona (usato quando non c'è cover) */
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

/* navigazione generica per qualsiasi loc-track nel renderer */
function dbLocNav(btn, dir){
  var wrap=btn.closest('.n-db-lc-wrap');
  if(!wrap)return;
  var track=wrap.querySelector('.loc-track');
  var cards=track?track.querySelectorAll('.loc-card'):[];
  if(!cards.length)return;
  var idx=parseInt(track.getAttribute('data-idx')||'0',10)+dir;
  var cardW=cards[0].getBoundingClientRect().width||240;
  var gap=16;
  var step=cardW+gap;
  var trackW=cards.length*step-gap;
  var outerW=wrap.querySelector('.loc-track-outer').getBoundingClientRect().width||600;
  var maxPx=Math.max(0,trackW-outerW);
  var maxIdx=Math.floor(maxPx/step);
  if(idx<0)idx=0;if(idx>maxIdx)idx=maxIdx;
  track.setAttribute('data-idx',idx);
  track.style.transform='translateX(-'+(idx*step)+'px)';
}

async function loadDbGalleries(container){
  var grids=container.querySelectorAll('.n-db-grid[id^="db-"]');
  grids.forEach(async function(grid){
    var dbId=grid.id.replace('db-','');
    try{
      var r=await fetch('/api/notion?dbId='+dbId);
      if(!r.ok)throw new Error('HTTP '+r.status);
      var data=await r.json();
      if(!data.pages||!data.pages.length){
        grid.innerHTML='<div class="n-db-loading">Nessun elemento trovato.</div>';return;
      }
      /* costruisci loc-card per ogni pagina */
      var cardsHtml=data.pages.map(function(p){
        var icon=p.icon||'📄';
        var acc=iconAccent(icon);
        var bg=p.cover
          ?'background-image:url("'+p.cover+'");background-size:cover;background-position:center'
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
      /* rimpiazza il grid con un carosello loc-card */
      var wrap=grid.closest('.n-db-wrap');
      if(wrap){
        /* sostituisce tutta la .n-db-wrap con il carosello */
        var titleEl=wrap.querySelector('.n-db-title');
        var titleHtml=titleEl?'<div class="n-db-title">'+titleEl.textContent+'</div>':'';
        var uid='dblc-'+dbId;
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
        /* fallback: grid rimpiazzata inline */
        grid.outerHTML='<div class="loc-track" data-idx="0" style="gap:16px;display:flex">'+cardsHtml+'</div>';
      }
    }catch(e){
      grid.innerHTML='<div class="n-db-loading">⚠️ Errore caricamento.</div>';
    }
  });
}

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

/* ── Build breadcrumb HTML ── */
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
  if(!_fromPop){
    navStack.push({id:id,label:label,icon:icon});
    history.pushState({id:id,label:label,icon:icon,stack:navStack.slice(0,-1)},'',location.pathname+'?p='+id);
  }
  var hv=document.getElementById('hv'),pv=document.getElementById('pv');
  setNav('');
  var phTitle=document.getElementById('ph-title');
  var phIcon=document.getElementById('ph-icon');
  var phCrumb=document.getElementById('ph-crumb');
  var phCovbg=document.getElementById('ph-covbg');
  var phOverlay=document.getElementById('ph-overlay');
  var phEyebrow=document.getElementById('ph-eyebrow');
  var phSub=document.getElementById('ph-sub');
  var phHero=document.getElementById('page-hero');

  phTitle.textContent=label;
  phIcon.textContent=icon;
  phCovbg.style.backgroundImage='';
  phEyebrow.textContent='';
  phSub.textContent='';
  phHero.style.removeProperty('--ph-acc');
  phHero.style.removeProperty('--ph-accbg');
  phCrumb.innerHTML=buildCrumb(label);
  document.getElementById('pbody').innerHTML='<div class="ldwrap"><div class="spin"></div></div>';
  document.title=label+' — Arcamis';
  if(hv.style.display==='block')xfade(hv,pv);
  else pv.style.display='block';
  document.getElementById('main').scrollTo({top:0});
  await _gpRender(id,label,icon);
}

async function _gpRender(id,label,icon){
  var phTitle=document.getElementById('ph-title');
  var phIcon=document.getElementById('ph-icon');
  var phCovbg=document.getElementById('ph-covbg');
  var phOverlay=document.getElementById('ph-overlay');
  var phEyebrow=document.getElementById('ph-eyebrow');
  var phSub=document.getElementById('ph-sub');
  var phHero=document.getElementById('page-hero');
  var phCrumb=document.getElementById('ph-crumb');

  /* cache check */
  var cacheKey='pg_'+id;
  var data=null;
  try{var c=sessionStorage.getItem(cacheKey);if(c)data=JSON.parse(c);}catch(e){}

  try{
    if(!data){
      var timeout=new Promise(function(_,rej){setTimeout(function(){rej(new Error('Timeout'))},15000)});
      var r=await Promise.race([fetch('/api/notion?pageId='+id),timeout]);
      if(!r.ok)throw new Error('HTTP '+r.status);
      data=await r.json();
      try{sessionStorage.setItem(cacheKey,JSON.stringify(data));}catch(e){}
    }
    var pg=data.page,bl=data.blocks;
    var ta=pg.properties&&pg.properties.title&&pg.properties.title.title||[];
    var ptitle=ta.map(function(t){return t.plain_text}).join('')||label;
    var picon=pg.icon&&pg.icon.emoji?pg.icon.emoji:icon;
    phTitle.textContent=ptitle;
    phIcon.textContent=picon;
    phEyebrow.textContent='Archivi di Arcamis';
    document.title=ptitle+' — Arcamis';
    /* update crumb with real title */
    phCrumb.innerHTML=buildCrumb(ptitle);

    /* accent color */
    var acc=iconAccent(picon);
    phHero.style.setProperty('--ph-acc',acc.c);
    phHero.style.setProperty('--ph-accbg',acc.bg);

    /* cover: Notion cover → prima immagine della pagina */
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

    /* subtitle: primo callout o primo paragrafo */
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
    var emptyHtml='<div class="n-empty"><div class="n-empty-icon">'+picon+'</div>'
      +'<div class="n-empty-title">'+ptitle+'</div>'
      +'<div class="n-empty-msg">Questa pagina non ha ancora contenuto.</div></div>';
    var footer='<div class="n-page-footer"><div class="n-page-footer-gems">✦ &nbsp; ✦ &nbsp; ✦</div>'
      +'<div class="n-page-footer-text">Archivi di Arcamis — '+ptitle+'</div></div>';
    pbody.innerHTML='<div class="nc" style="animation:fi .22s ease forwards">'+(html||emptyHtml)+footer+'</div>';
    attachShine(pbody);
    loadDbGalleries(pbody);
    initFadeIn(pbody);
  }catch(e){
    document.getElementById('pbody').innerHTML='<div class="errbox">⚠️ '+e.message+'</div>';
  }
}
