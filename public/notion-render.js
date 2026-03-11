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
      if(m){var ni=pages.find(function(n){return n.id===m[1]});
        return'<a class="rl" onclick="gp(\''+m[1]+'\',\''+(ni?ni.l.replace(/'/g,"\\'"):'Pagina')+'\',\''+(ni?ni.i:'📄')+'\')">'+inner+'</a>';}
      return'<a href="'+r.href+'" target="_blank" rel="noopener" class="rl">'+inner+'</a>';
    }
    return inner;
  }).join('');
}
function renderBlocks(blocks){
  if(!blocks||!blocks.length)return'';
  var h='';
  for(var i=0;i<blocks.length;i++){
    var b=blocks[i],d=b[b.type]||{};
    switch(b.type){
      case'paragraph':h+='<p class="n-p">'+(rt(d.rich_text)||'<br>')+'</p>';break;
      case'heading_1':h+='<h2 class="n-h1">'+rt(d.rich_text)+'</h2>';break;
      case'heading_2':h+='<h3 class="n-h2">'+rt(d.rich_text)+'</h3>';break;
      case'heading_3':h+='<h4 class="n-h3">'+rt(d.rich_text)+'</h4>';break;
      case'bulleted_list_item':h+='<ul class="n-ul"><li>'+rt(d.rich_text)+(b.children?renderBlocks(b.children):'')+'</li></ul>';break;
      case'numbered_list_item':h+='<ol class="n-ol"><li>'+rt(d.rich_text)+(b.children?renderBlocks(b.children):'')+'</li></ol>';break;
      case'quote':h+='<blockquote class="n-quote">'+rt(d.rich_text)+'</blockquote>';break;
      case'divider':h+='<div class="n-divider"><span class="n-divider-gem">✦</span></div>';break;
      case'callout':
        var ic=d.icon&&d.icon.emoji?d.icon.emoji:'💡';
        var cbg='rgba(200,155,60,.04)',cc='rgba(200,155,60,.5)';
        if(['📜','📖','📚','🗒️'].indexOf(ic)>-1){cbg='rgba(120,90,40,.07)';cc='rgba(180,130,50,.5)';}
        else if(['⚠️','🔥','⚡','🗡️','⚔️'].indexOf(ic)>-1){cbg='rgba(180,50,40,.06)';cc='rgba(200,60,50,.5)';}
        else if(['🌊','💧','🌙','⭐','✨'].indexOf(ic)>-1){cbg='rgba(40,80,180,.07)';cc='rgba(60,100,200,.5)';}
        else if(['🌿','🌱','🍃','🌲','🌳'].indexOf(ic)>-1){cbg='rgba(30,100,50,.07)';cc='rgba(50,140,70,.5)';}
        else if(['🔮','💜','🌑','👁️'].indexOf(ic)>-1){cbg='rgba(100,50,180,.07)';cc='rgba(130,70,220,.5)';}
        h+='<div class="n-callout" style="--callout-bg:'+cbg+';--callout-c:'+cc+'">'
          +'<div class="n-callout-icon">'+ic+'</div>'
          +'<div class="n-callout-body">'+rt(d.rich_text)+(b.children?renderBlocks(b.children):'')+'</div></div>';
        break;
      case'toggle':h+='<details><summary class="n-ts">'+rt(d.rich_text)+'</summary><div class="n-tc">'+(b.children?renderBlocks(b.children):'')+'</div></details>';break;
      case'code':h+='<pre class="n-code"><code>'+(d.rich_text||[]).map(function(r){return r.plain_text}).join('').replace(/</g,'&lt;')+'</code></pre>';break;
      case'image':var src=d.type==='external'?(d.external&&d.external.url):(d.file&&d.file.url);if(src)h+='<figure class="n-image"><img src="'+src+'" loading="lazy" onerror="this.parentElement.style.display=\'none\'"/>'+(d.caption&&d.caption.length?'<figcaption>'+rt(d.caption)+'</figcaption>':'')+'</figure>';break;
      case'child_page':
        /* group consecutive child_pages into a card grid */
        var cpStart=i;
        var cpCards='';
        while(i<blocks.length&&blocks[i].type==='child_page'){
          var cpb=blocks[i],cpd=cpb[cpb.type]||{};
          var cpid=cpb.id.replace(/-/g,'');
          var cpni=pages.find(function(n){return n.id===cpid});
          var cpicon=cpni?cpni.i:'📄';
          var cptitle=cpd.title||'Pagina';
          cpCards+='<div class="n-cp" onclick="gp(\''+cpid+'\',\''+cptitle.replace(/'/g,"\\'")+'\',\''+cpicon+'\')">'
            +'<div class="n-cp-thumb">'+cpicon+'</div>'
            +'<div class="n-cp-info"><div class="n-cp-title">'+cptitle+'</div>'
            +'<div class="n-cp-cta">Apri →</div></div>'
            +'</div>';
          i++;
        }
        h+='<div class="n-cp-grid">'+cpCards+'</div>';
        i--; /* compensate for loop i++ */
        break;
      case'child_database':
        var dbRawId=b.id.replace(/-/g,'');
        h+='<div class="n-db-wrap"><div class="n-db-title">'+(d.title||'Database')+'</div>'
          +'<div class="n-db-grid" id="db-'+dbRawId+'"><div class="n-db-loading">⏳ Caricamento...</div></div></div>';
        break;
      case'table':var rows=b.children||[],hasH=d.has_column_header,hasR=d.has_row_header;h+='<div class="n-twrap"><table class="n-tbl"><tbody>';rows.forEach(function(row,ri){var cells=row.table_row&&row.table_row.cells||[];h+='<tr>';cells.forEach(function(cell,ci){var tag=(hasH&&ri===0)||(hasR&&ci===0)?'th':'td';h+='<'+tag+'>'+rt(cell)+'</'+tag+'>'});h+='</tr>'});h+='</tbody></table></div>';break;
      case'column_list':var cols=b.children||[];h+='<div class="n-cols" style="grid-template-columns:repeat('+cols.length+',1fr)">';cols.forEach(function(col){h+='<div>'+(col.children?renderBlocks(col.children):'')+'</div>'});h+='</div>';break;
      case'to_do':h+='<div style="display:flex;gap:10px;align-items:flex-start;margin:3px 0;font-size:16px;line-height:1.8"><span>'+(d.checked?'✅':'☐')+'</span><div>'+rt(d.rich_text)+'</div></div>';break;
      case'bookmark':var bu=d.url||'#';var dm=bu;try{dm=new URL(bu).hostname}catch(e){}h+='<a href="'+bu+'" target="_blank" rel="noopener" class="n-bkm"><div><div>'+(d.caption&&d.caption.length?rt(d.caption):dm)+'</div><div class="n-bkm-url">'+bu+'</div></div></a>';break;
    }
  }
  var tmp=document.createElement('div');tmp.innerHTML=h;
  ['ul','ol'].forEach(function(tag){tmp.querySelectorAll(tag).forEach(function(el){var p=el.previousElementSibling;if(p&&p.tagName===tag.toUpperCase()&&p.className===el.className){while(el.firstChild)p.appendChild(el.firstChild);el.remove()}})});
  return tmp.innerHTML;
}

/* ══════════════════════════════
   DATABASE GALLERY LOADER
══════════════════════════════ */
async function loadDbGalleries(container) {
  var grids = container.querySelectorAll('.n-db-grid[id^="db-"]');
  grids.forEach(async function(grid) {
    var dbId = grid.id.replace('db-', '');
    try {
      var r = await fetch('/api/notion?dbId=' + dbId);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      var data = await r.json();
      if (!data.pages || !data.pages.length) {
        grid.innerHTML = '<div class="n-db-loading">Nessun elemento trovato.</div>';
        return;
      }
      grid.innerHTML = data.pages.map(function(p) {
        var coverHtml = p.cover
          ? '<img class="n-db-cover" src="' + p.cover + '" loading="lazy" onerror="this.style.display=\'none\'">'
          : '<div class="n-db-cover-placeholder">' + (p.icon || '📄') + '</div>';
        return '<div class="n-db-card" onclick="gp(\'' + p.id + '\',\'' + p.title.replace(/'/g, "\\'") + '\',\'' + (p.icon || '📄') + '\')">'
          + coverHtml
          + '<div class="n-db-name">' + (p.icon ? p.icon + ' ' : '') + p.title + '</div>'
          + '</div>';
      }).join('');
    } catch(e) {
      grid.innerHTML = '<div class="n-db-loading">⚠️ Errore caricamento.</div>';
    }
  });
}

async function gp(id,label,icon){
  var hv=document.getElementById('hv'),pv=document.getElementById('pv');
  setNav('');
  var phTitle=document.getElementById('ph-title');
  var phIcon=document.getElementById('ph-icon');
  var phCrumb=document.getElementById('ph-crumb');
  var phCovbg=document.getElementById('ph-covbg');
  var phOverlay=document.getElementById('ph-overlay');
  var phEyebrow=document.getElementById('ph-eyebrow');
  var phSub=document.getElementById('ph-sub');

  phTitle.textContent=label;
  phIcon.textContent=icon;
  phCovbg.style.backgroundImage='';
  phEyebrow.textContent='';
  phSub.textContent='';
  phCrumb.innerHTML=
    '<span class="ph-bc" onclick="showHome()">🏰 Home</span>'
    +'<span class="ph-sep"> › </span>'
    +'<span class="ph-cur">'+label+'</span>';
  document.getElementById('pbody').innerHTML='<div class="ldwrap"><div class="spin"></div></div>';
  document.title=label+' — Arcamis';
  if(hv.style.display==='block')xfade(hv,pv);
  else pv.style.display='block';
  document.getElementById('main').scrollTo({top:0});
  try{
    var timeout=new Promise(function(_,rej){setTimeout(function(){rej(new Error('Timeout — la pagina ha impiegato troppo tempo'))},15000)});
    var r=await Promise.race([fetch('/api/notion?pageId='+id),timeout]);
    if(!r.ok)throw new Error('HTTP '+r.status);
    var data=await r.json();
    var pg=data.page,bl=data.blocks;
    var ta=pg.properties&&pg.properties.title&&pg.properties.title.title||[];
    var ptitle=ta.map(function(t){return t.plain_text}).join('')||label;
    var picon=pg.icon&&pg.icon.emoji?pg.icon.emoji:icon;
    phTitle.textContent=ptitle;
    phIcon.textContent=picon;
    phEyebrow.textContent='Archivi di Arcamis';
    document.title=ptitle+' — Arcamis';
    /* cover image */
    var coverUrl=null;
    if(pg.cover){
      coverUrl=pg.cover.type==='external'?pg.cover.external.url:(pg.cover.file&&pg.cover.file.url);
    }
    if(coverUrl){
      phCovbg.style.backgroundImage='url("'+coverUrl+'")';
      phOverlay.style.opacity='1';
      phIcon.style.opacity='0';
    } else {
      phCovbg.style.backgroundImage='';
      phOverlay.style.opacity='0';
      phIcon.style.opacity='0.05';
    }
    /* subtitle: first paragraph text */
    var firstP=bl.find(function(b){return b.type==='paragraph'&&b.paragraph&&b.paragraph.rich_text&&b.paragraph.rich_text.length>0});
    if(firstP){
      var sub=firstP.paragraph.rich_text.map(function(t){return t.plain_text}).join('').slice(0,120);
      if(sub)phSub.textContent=sub+(sub.length>=120?'…':'');
    }
    var html=renderBlocks(bl);
    var pbody=document.getElementById('pbody');
    var footer='<div class="n-page-footer"><div class="n-page-footer-gems">✦ &nbsp; ✦ &nbsp; ✦</div><div class="n-page-footer-text">Archivi di Arcamis — '+ptitle+'</div></div>';
    pbody.innerHTML='<div class="nc" style="animation:fi .22s ease forwards">'+(html||'<p class="n-p" style="color:var(--text3);font-style:italic">Pagina vuota.</p>')+footer+'</div>';
    attachShine(pbody);
    loadDbGalleries(pbody);
    initFadeIn(pbody);
  }catch(e){
    document.getElementById('pbody').innerHTML='<div class="errbox">⚠️ '+e.message+'</div>';
  }
}