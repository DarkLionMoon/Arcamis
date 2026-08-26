/* ════════════════════════════════════════════════════════════
   ARCAMIS — md-render.js
   Renderer Markdown condiviso (sito + admin).

   Garantisce che l'anteprima dell'editor admin sia IDENTICA a
   ciò che il sito renderizza. Output con classi .n-* già
   stilizzate da scripts/css/style-notion.css.

   Supporta: paragrafi, h1-h6, liste annidate, checklist, tabelle
   (con allineamento), blockquote, callout (> [!NOTE] ecc., anche
   richiudibili con > [!NOTE]- / > [!NOTE]+ titolo), code block
   con linguaggio, codice inline, grassetto/corsivo/barrato,
   evidenziazione ==testo==, apici ^testo^ e pedici ~testo~,
   note a piè di pagina [^id], link (URL sicuri), immagini con
   didascalia, hr.

   Espone: window.mdRender(md) -> html,  window.mdToc(md) -> []
   ════════════════════════════════════════════════════════════ */
(function(){
'use strict';

function esc(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function attr(s){return esc(s).replace(/"/g,'&quot;')}
function dec(s){return (s||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>')}
function safeLink(u){return /^(https?:|mailto:|#|\/)/i.test(u)}
function safeImg(u){return /^(https?:|#|\/|data:image\/)/i.test(u)}

/* ── INLINE ──────────────────────────────────────────────── */
var _fnDefs={};   /* id -> {num,text} */
var _fnOrder=0;
function fnRef(id){
  var def=_fnDefs[id];
  if(!def)return '[^'+id+']';
  return '<sup class="n-fnref" id="fnref-'+attr(id)+'"><a href="#fn-'+attr(id)+'" class="n-anchor">'+def.num+'</a></sup>';
}
function inline(t){
  t=esc(t);
  /* codice inline */
  t=t.replace(/`([^`]+)`/g,'<code class="rc">$1</code>');
  /* grassetto + corsivo */
  t=t.replace(/\*\*\*(.+?)\*\*\*/g,'<strong><em>$1</em></strong>');
  t=t.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  /* barrato (prima del pedice, che usa ~ singola) */
  t=t.replace(/~~(.+?)~~/g,'<s class="rs">$1</s>');
  /* corsivo (singolo *) */
  t=t.replace(/(^|[^*])\*([^*\s][^*]*?)\*([^*]|$)/g,'$1<em>$2</em>$3');
  /* evidenziazione ==testo== */
  t=t.replace(/==([^\s=][^=]*?)==/g,'<mark class="n-mark">$1</mark>');
  /* apice ^testo^ e pedice ~testo~ */
  t=t.replace(/\^([^\s^]+)\^/g,'<sup class="n-sup">$1</sup>');
  t=t.replace(/~([^~\s]+)~/g,'<sub class="n-sub">$1</sub>');
  /* note a piè di pagina [^id] */
  t=t.replace(/\[\^([a-zA-Z0-9_-]+)\]/g,function(m,id){return fnRef(id)});
  /* immagini prima dei link */
  t=t.replace(/!\[([^\]]*)\]\(([^)]+?)(?:\s+"([^"]*)")?\)/g,function(m,alt,u,cap){
    u=dec(u).trim();
    if(!safeImg(u))return '';
    var a=attr(dec(alt||cap||''));
    var js=u.replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;');
    var img='<img src="'+attr(u)+'" alt="'+a+'" loading="lazy" decoding="async" class="n-image n-zoomable"'+(window.arcZoom?' onclick="arcZoom(\''+js+'\')"':'')+'>';
    if(cap||alt)return '<figure class="n-image">'+img+'<figcaption>'+inline(dec(cap||alt))+'</figcaption></figure>';
    return '<figure class="n-image">'+img+'</figure>';
  });
  /* link */
  t=t.replace(/\[([^\]]+)\]\(([^)]+)\)/g,function(m,label,u){
    u=dec(u).trim();
    if(!safeLink(u))return label;
    return '<a href="'+attr(u)+'" target="_blank" rel="noopener" class="n-link">'+inline(dec(label))+'</a>';
  });
  return t;
}

/* ── TABELLE ─────────────────────────────────────────────── */
function splitCells(r){return r.replace(/^\|/,'').replace(/\|$/,'').split('|')}
function renderTable(tbl){
  var aligns=splitCells(tbl[1]).map(function(c){
    var t=c.trim();
    if(t.charAt(0)===':'&&t.charAt(t.length-1)===':')return'center';
    if(t.charAt(0)===':')return'left';
    if(t.charAt(t.length-1)===':')return'right';
    return'';
  });
  function al(i){return aligns[i]?' style="text-align:'+aligns[i]+'"':''}
  var out='<div class="n-twrap"><table class="n-tbl"><thead><tr>';
  splitCells(tbl[0]).forEach(function(c,i){out+='<th'+al(i)+'>'+inline(c.trim())+'</th>'});
  out+='</tr></thead><tbody>';
  tbl.slice(2).forEach(function(r){
    out+='<tr>';
    splitCells(r).forEach(function(c,i){out+='<td'+al(i)+'>'+inline(c.trim())+'</td>'});
    out+='</tr>';
  });
  out+='</tbody></table></div>';
  return out;
}

/* ── LISTE (annidate + task) ─────────────────────────────── */
function renderLevel(nodes){
  var html='',cur=null;
  function flush(){if(cur){html+='<'+cur.type+' class="'+(cur.type==='ul'?'n-ul':'n-ol')+'">'+cur.html+'</'+cur.type+'>';cur=null}}
  nodes.forEach(function(node){
    var inner=inline(node.content);
    if(node.children.length)inner+='\n'+renderLevel(node.children);
    var li='<li class="n-li">';
    if(node.task)li+='<span class="n-todo"><span class="n-todo-box">'+(node.checked?'☑':'☐')+'</span>'+inner+'</span>';
    else li+=inner;
    li+='</li>';
    if(!cur||cur.type!==node.type){flush();cur={type:node.type,html:''}}
    cur.html+=li;
  });
  flush();
  return html;
}
function renderListItems(lines){
  var items=[];
  lines.forEach(function(l){
    var m=l.match(/^(\s*)((?:[-*+]\s+)|(?:\d+[.)]\s+))((?:\[[ xX]\]\s+)?(.*))$/);
    if(m){
      var indent=m[1].replace(/\t/g,'    ').length;
      var task=!!m[3]&&/\[[ xX]\]\s+/.test(m[3]);
      var checked=task&&/^\[[xX]\]/.test(m[3].trim());
      var content=task?m[3].replace(/^\[[ xX]\]\s+/,''):m[3];
      items.push({indent:indent,type:/^\d/.test(m[2])?'ol':'ul',content:content,checked:checked,task:task});
    }else if(items.length){
      items[items.length-1].content+='\n'+l.replace(/^\s+/,'');
    }
  });
  var stack=[{indent:-1,children:[]}],roots=stack[0].children;
  items.forEach(function(it){
    while(stack.length>1&&stack[stack.length-1].indent>=it.indent)stack.pop();
    var node={type:it.type,content:it.content,checked:it.checked,task:it.task,children:[]};
    stack[stack.length-1].children.push(node);
    stack.push(node);
  });
  return renderLevel(roots);
}

/* ── BLOCKQUOTE / CALLOUT ────────────────────────────────── */
var CALLOUT_TYPES={
  NOTE:{icon:'💡',c:'#5a86b8',bg:'rgba(90,134,184,.06)'},
  INFO:{icon:'💡',c:'#5a86b8',bg:'rgba(90,134,184,.06)'},
  TIP:{icon:'💡',c:'#5a9a58',bg:'rgba(90,154,88,.06)'},
  WARNING:{icon:'⚠️',c:'#c89b3c',bg:'rgba(200,155,60,.06)'},
  WARN:{icon:'⚠️',c:'#c89b3c',bg:'rgba(200,155,60,.06)'},
  CAUTION:{icon:'⚠️',c:'#c04040',bg:'rgba(192,64,64,.07)'},
  DANGER:{icon:'⚠️',c:'#c04040',bg:'rgba(192,64,64,.07)'},
  IMPORTANT:{icon:'⭐',c:'#d4aa4a',bg:'rgba(212,170,74,.07)'},
  SUGGERIMENTO:{icon:'✨',c:'#d4aa4a',bg:'rgba(212,170,74,.06)'},
  LORE:{label:'Lore',icon:'📖',c:'#8a6db8',bg:'rgba(138,109,184,.07)'},
  QUEST:{label:'Quest',icon:'🗺️',c:'#5a9ab8',bg:'rgba(90,154,184,.07)'},
  SECRET:{label:'Segreto',icon:'🕳️',c:'#9a5ab8',bg:'rgba(154,90,184,.08)'},
  MAGIC:{label:'Magia',icon:'🔮',c:'#b85a9a',bg:'rgba(184,90,154,.07)'},
  REGOLA:{label:'Regola',icon:'⚖️',c:'#d4aa4a',bg:'rgba(212,170,74,.07)'},
  TESORO:{label:'Tesoro',icon:'💰',c:'#c89b3c',bg:'rgba(200,155,60,.08)'},
  MOSTRO:{label:'Mostro',icon:'🐉',c:'#c05a40',bg:'rgba(192,90,64,.07)'},
  NPC:{label:'PNG',icon:'👤',c:'#5a9a58',bg:'rgba(90,154,88,.07)'},
  DM:{label:'Solo Master',icon:'🎲',c:'#c04040',bg:'rgba(192,64,64,.09)'}
};
function blockquoteLines(lines){
  var inner=lines.map(function(l){return l.replace(/^>\s?/,'')}).join('\n');
  var first=inner.split('\n')[0];
  /* accetta [!TIPO]- titolo e la variante [!TIPO-] titolo */
  var cm=first.match(/^\[!([a-zA-Z]+)\]\s*([-+]?)\s*(.*)$/i);
  if(!cm)cm=first.match(/^\[!([a-zA-Z]+)([-+]?)\]\s*(.*)$/i);
  if(cm){
    var key=cm[1].toUpperCase(),fold=cm[2],title=cm[3];
    var cfg=CALLOUT_TYPES[key]||{label:key.charAt(0)+key.slice(1).toLowerCase(),icon:'✨',c:'#c89b3c',bg:'rgba(200,155,60,.05)'};
    if(fold==='-'||fold==='+'){
      var body=inner.split('\n').slice(1).join('\n');
      return '<details class="n-callout n-fold" style="--callout-c:'+cfg.c+';--callout-bg:'+cfg.bg+'"'+(fold==='+'?' open':'')+'>'
        +'<summary class="n-fold-head"><span class="n-callout-icon">'+cfg.icon+'</span>'
        +'<span class="n-fold-title">'+inline(dec(title||cfg.label||key))+'</span>'
        +'<span class="n-fold-arrow">▸</span></summary>'
        +'<div class="n-callout-body">'+renderBlocks(body)+'</div></details>';
    }
    var body=(title?title+'\n':'')+inner.split('\n').slice(1).join('\n');
    return '<div class="n-callout" style="--callout-c:'+cfg.c+';--callout-bg:'+cfg.bg+'">'
      +'<span class="n-callout-icon">'+cfg.icon+'</span>'
      +'<div class="n-callout-body">'+renderBlocks(body)+'</div></div>';
  }
  return '<blockquote class="n-quote"><span class="n-quote-mark">"</span>'+inner.split('\n').map(inline).join('<br>')+'</blockquote>';
}

/* ── BLOCCHI ─────────────────────────────────────────────── */
var HR_RE=/^(\s*([-*_])\2{2,}\s*)$/;
var HEAD_RE=/^(#{1,6})\s+(.+)$/;
var FENCE_RE=/^```(\w*)\s*$/;
var LIST_RE=/^\s*(?:[-*+]\s+|\d+[.)]\s+)/;
var QUOTE_RE=/^>\s?/;
function renderBlocks(src){
  if(!src)return'';
  var lines=src.replace(/\r\n/g,'\n').split('\n');
  var html='',i=0,n=lines.length;
  while(i<n){
    var line=lines[i];
    if(!line.trim()){i++;continue}
    /* code fence */
    var fm=line.match(FENCE_RE);
    if(fm){
      var lang=fm[1],buf=[],j=i+1;
      while(j<n&&!/^```\s*$/.test(lines[j])){buf.push(lines[j]);j++}
      html+='<pre class="n-code">'+(lang?'<span class="n-code-lang">'+esc(lang)+'</span>':'')+esc(buf.join('\n'))+'</pre>';
      i=j+1;continue;
    }
    /* heading */
    var hm=line.match(HEAD_RE);
    if(hm){
      var lvl=hm[1].length;
      html+='<h'+lvl+' class="n-h'+lvl+'">'+inline(hm[2])+'</h'+lvl+'>';
      i++;continue;
    }
    /* hr */
    if(HR_RE.test(line)){html+='<hr class="n-divider">';i++;continue}
    /* table */
    if(line.charAt(0)==='|'&&i+1<n&&/^\|?[\s:|-]+\|?$/.test(lines[i+1])&&lines[i+1].indexOf('-')!==-1){
      var tbl=[];
      while(i<n&&lines[i].charAt(0)==='|'){tbl.push(lines[i]);i++}
      html+=renderTable(tbl);continue;
    }
    /* blockquote */
    if(QUOTE_RE.test(line)){
      var q=[];
      while(i<n&&QUOTE_RE.test(lines[i])){q.push(lines[i]);i++}
      html+=blockquoteLines(q);continue;
    }
    /* lista */
    if(LIST_RE.test(line)){
      var lbuf=[];
      while(i<n){
        var ll=lines[i];
        if(/^\s*(?:[-*+]\s+|\d+[.)]\s+)/.test(ll)){lbuf.push(ll);i++;continue}
        if(!ll.trim()){
          var k=i;while(k<n&&!lines[k].trim())k++;
          if(k<n&&/^\s*(?:[-*+]\s+|\d+[.)]\s+)/.test(lines[k])){i++;continue}
          break;
        }
        if(QUOTE_RE.test(ll))break;
        if(/^\s{2,}\S/.test(ll)){lbuf.push(ll);i++;continue}
        break;
      }
      html+=renderListItems(lbuf);continue;
    }
    /* paragrafo */
    var pbuf=[line];i++;
    while(i<n){
      var pl=lines[i];
      if(!pl.trim())break;
      if(/^(#{1,6}\s|>|```)/.test(pl))break;
      if(/^[-*+]\s/.test(pl))break;
      if(/^\d+[.)]\s/.test(pl))break;
      if(pl.charAt(0)==='|'&&i+1<n&&/^\|?[\s:|-]+\|?$/.test(lines[i+1]))break;
      if(HR_RE.test(pl))break;
      pbuf.push(pl);i++;
    }
    html+='<p class="n-p">'+pbuf.map(inline).join('<br>')+'</p>';
  }
  return html;
}

/* ── NOTE A PIÈ DI PAGINA ────────────────────────────────── */
function extractFootnotes(lines){
  _fnDefs={};_fnOrder=0;
  var out=[],i=0,n=lines.length,inFence=false;
  while(i<n){
    if(/^```/.test(lines[i])){inFence=!inFence;out.push(lines[i]);i++;continue}
    var m=(!inFence)?lines[i].match(/^\[\^([a-zA-Z0-9_-]+)\]:\s*(.*)$/):null;
    if(m){
      var id=m[1],text=[m[2]];
      i++;
      while(i<n&&/^\s+\S/.test(lines[i])){text.push(lines[i].replace(/^\s+/,''));i++}
      _fnOrder++;
      _fnDefs[id]={num:_fnOrder,text:text.join(' ')};
      continue;
    }
    out.push(lines[i]);i++;
  }
  return out;
}
function renderFootnotes(){
  var ids=Object.keys(_fnDefs);
  if(!ids.length)return'';
  var items=ids.map(function(id){
    var d=_fnDefs[id];
    return '<li class="n-fn-item" id="fn-'+attr(id)+'">'+inline(dec(d.text))
      +' <a href="#fnref-'+attr(id)+'" class="n-anchor n-fn-back" title="Torna al testo">↩</a></li>';
  });
  return '<section class="n-footnotes"><div class="n-fn-title">Note</div><ol class="n-fn-list">'+items.join('')+'</ol></section>';
}

/* ── API ─────────────────────────────────────────────────── */
function mdRender(md){
  if(!md||!md.trim())return'';
  var lines=extractFootnotes(md.replace(/\r\n/g,'\n').split('\n'));
  var html=renderBlocks(lines.join('\n'))+renderFootnotes();
  _fnDefs={};_fnOrder=0;
  return html;
}
function mdToc(md){
  var toc=[];
  if(!md)return toc;
  md.split('\n').forEach(function(line,idx){
    var m=line.match(/^(#{1,4})\s+(.+)$/);
    if(m){
      toc.push({
        level:m[1].length,
        text:m[2].replace(/\*\*(.+?)\*\*/g,'$1').replace(/`(.+?)`/g,'$1').replace(/\*(.+?)\*/g,'$1').replace(/~~(.+?)~~/g,'$1'),
        line:idx
      });
    }
  });
  return toc;
}
window.mdRender=mdRender;
window.mdToc=mdToc;
})();
