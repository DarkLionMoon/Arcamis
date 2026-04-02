/* ════════════════════════════════════
   notion-core/render-blocks.js
   Rendering blocchi Notion → HTML:
   rt(), renderBlocks().

   ⚠️ Dipende da: render-helpers.js
      (calloutColor, safeHost, mapPageIds,
       iconAccent, iconGradient, safeCoverUrl)
════════════════════════════════════ */

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
          var cpCoverNi=cpni?cpni.cover:null;
          var cpCoverSafe=safeCoverUrl(cpCoverNi);
          if(cpCoverSafe){
            cpCards+='<div class="cp-icard" style="'+cpbg+'" onclick="gp(\''+cpid+'\',\''+cptitleSafe+'\',\''+cpicon+'\')">'
              +'<div class="cp-icard-accent" style="background:linear-gradient(90deg,'+cpacc.c+',transparent)"></div>'
              +'<div class="cp-icard-icon" style="color:'+cpacc.c+'">'+cpicon+'</div>'
              +'<div class="cp-icard-title">'+cptitle+'</div>'
              +'<div class="cp-icard-sub" style="color:'+cpacc.c+'">Apri \u2192</div>'
              +'<div class="cp-icard-arr" style="color:'+cpacc.c+'">\u25c6</div>'
              +'</div>';
          }else{
            cpCards+='<div class="cp-icard" style="'+cpbg+'" onclick="gp(\''+cpid+'\',\''+cptitleSafe+'\',\''+cpicon+'\')">'
              +'<div class="cp-icard-accent" style="background:linear-gradient(90deg,'+cpacc.c+',transparent)"></div>'
              +'<div class="cp-icard-icon" style="color:'+cpacc.c+'">'+cpicon+'</div>'
              +'<div class="cp-icard-title">'+cptitle+'</div>'
              +'<div class="cp-icard-sub" style="color:'+cpacc.c+'">Apri \u2192</div>'
              +'<div class="cp-icard-arr" style="color:'+cpacc.c+'">\u25c6</div>'
              +'</div>';
          }
          i++;
        }
        if(cpCards){
          h+='<div class="cp-icard-grid">'+cpCards+'</div>';
        }
        i--;
        break;

      case'child_database':
        var dbRawId=b.id.replace(/-/g,'');
        if(dbRawId===GALLERY_DB_ID){
          h+='<div class="gs-container" id="gs-'+dbRawId+'"></div>';
        }else if(dbRawId==='3040274fdc1c80e0a0dccfa9761bff55'){
          h+='<div class="hb-library-container" id="hblib-'+dbRawId+'"></div>';
        }else if(dbRawId==='2f70274fdc1c80e3bdc7f95f81eb9cc0'){
          h+='<div class="hb-subclass-container" id="hbsc-'+dbRawId+'"></div>';
        }else if(dbRawId===NPC_PARENT_DB.replace(/-/g,'')){
          h+='<div class="npc-gallery-container" id="npcg-'+dbRawId+'"></div>';
        }else{
          h+='<div class="n-db-wrap">'
            +(d.title?'<div class="n-db-title">'+d.title+'</div>':'')
            +'<div class="n-db-grid" id="db-'+dbRawId+'"><div class="n-db-loading">⏳ Caricamento...</div></div></div>';
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
        cols.forEach(function(col){h+='<div>'+(col.children?renderBlocks(col.children):'')+'</div>';});
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
