/* ════════════════════════════════════
   NOTION RENDER — Versione Corretta
════════════════════════════════════ */

var navStack = []; 

function iconAccent(emoji){
  if(!emoji)return{c:'rgba(200,155,60,.7)',bg:'rgba(200,155,60,.06)'};
  var e=emoji;
  if(['🔥','⚔️','🗡️','⚠️','🛡️','⚡','🐉','💀'].indexOf(e)>-1)return{c:'rgba(220,70,50,.75)',bg:'rgba(180,50,40,.06)'};
  if(['📚','📜','📖','🗒️','🏛️','📋'].indexOf(e)>-1)return{c:'rgba(190,140,60,.75)',bg:'rgba(150,110,40,.06)'};
  if(['🌊','💧','🌙','🐋','🚢','⚓','🌐'].indexOf(e)>-1)return{c:'rgba(60,120,220,.75)',bg:'rgba(40,80,180,.06)'};
  if(['🌿','🌱','🍃','🌲','🌳','🌾','🍀'].indexOf(e)>-1)return{c:'rgba(50,160,80,.75)',bg:'rgba(30,120,50,.06)'};
  return{c:'rgba(200,155,60,.7)',bg:'rgba(200,155,60,.06)'};
}

function renderRichText(rt) {
  if(!rt) return '';
  return rt.map(function(t) {
    var txt = t.plain_text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if(t.annotations.bold) txt = '<b>' + txt + '</b>';
    if(t.annotations.italic) txt = '<i>' + txt + '</i>';
    if(t.annotations.underline) txt = '<u>' + txt + '</u>';
    if(t.annotations.strikethrough) txt = '<strike>' + txt + '</strike>';
    if(t.annotations.code) txt = '<code>' + txt + '</code>';
    if(t.href) txt = '<a href="' + t.href + '" target="_blank">' + txt + '</a>';
    return txt;
  }).join('');
}

function renderBlocks(blocks) {
  var html = '';
  blocks.forEach(function(b) {
    if(b.type === 'paragraph') {
      html += '<p class="n-p">' + renderRichText(b.paragraph.rich_text) + '</p>';
    }
    else if(b.type.includes('heading')) {
      var h = b[b.type];
      var level = b.type.split('_')[1];
      var txt = renderRichText(h.rich_text);
      
      // FIX PANTHEON: Se l'heading è toggleable, crea un blocco interattivo
      if(h.is_toggleable) {
        html += '<details class="n-th-wrapper" ontoggle="if(this.open) { loadDbGalleries(this); }">';
        html += '<summary class="n-h' + level + ' n-th">' + txt + '</summary>';
        html += '<div class="n-th-content">' + renderBlocks(b.children || []) + '</div>';
        html += '</details>';
      } else {
        html += '<h' + level + ' class="n-h' + level + '">' + txt + '</h' + level + '>';
      }
    }
    else if(b.type === 'bulleted_list_item') {
      html += '<ul class="n-ul"><li>' + renderRichText(b.bulleted_list_item.rich_text) + '</li></ul>';
    }
    else if(b.type === 'child_database') {
      // FIX ESTETICA: Aggiunta classe per DB piccoli/grandi
      html += '<div class="n-db-wrap" data-dbid="' + b.id.replace(/-/g,'') + '">';
      html += '<div class="n-db-loading">Caricamento entità...</div></div>';
    }
    else if(b.type === 'child_page') {
      // CAROUSEL AUTOMATICO: Maestria, Titoli e Compagnie diventano card carousel
      html += '<div class="lcard fade-in" onclick="gp(\'' + b.id.replace(/-/g,'') + '\',\'' + b.child_page.title + '\',\'📄\')">';
      html += '<div class="shine"></div><div class="lcard-title">' + b.child_page.title + '</div></div>';
    }
    else if(b.type === 'image') {
      var url = b.image.type === 'external' ? b.image.external.url : b.image.file.url;
      html += '<div class="n-image"><img src="' + url + '" loading="lazy"></div>';
    }
    else if(b.type === 'callout') {
      var acc = iconAccent(b.callout.icon ? b.callout.icon.emoji : '');
      html += '<div class="n-callout" style="border-color:' + acc.c + '; background:' + acc.bg + '">';
      if(b.callout.icon) html += '<div class="n-callout-icon">' + b.callout.icon.emoji + '</div>';
      html += '<div class="n-callout-body">' + renderRichText(b.callout.rich_text) + '</div></div>';
    }
    else if(b.type === 'divider') {
      html += '<hr class="n-hr">';
    }
  });
  return html;
}

// FIX GALLERIA: Caricamento immagini da proprietà "Foto"
async function loadDbGalleries(root) {
  var dbs = (root || document).querySelectorAll('.n-db-wrap[data-dbid]');
  dbs.forEach(async function(el) {
    if(el.getAttribute('data-loaded')) return;
    var dbId = el.getAttribute('data-dbid');
    try {
      var res = await fetch('/api/notion?dbId=' + dbId);
      var data = await res.json();
      el.innerHTML = '';
      el.setAttribute('data-loaded', 'true');
      
      var grid = document.createElement('div');
      grid.className = 'cgrid';
      
      data.pages.forEach(function(p) {
        var card = document.createElement('div');
        card.className = 'lcard fade-in';
        // Se non c'è cover, mette un placeholder dorato
        var bg = p.cover ? 'url(' + p.cover + ')' : 'linear-gradient(135deg, #1a1c22, #0c0e12)';
        card.style.backgroundImage = bg;
        card.innerHTML = '<div class="shine"></div><div class="lcard-title">' + (p.icon||'') + ' ' + p.title + '</div>';
        card.onclick = function() { gp(p.id, p.title, p.icon||'📄'); };
        grid.appendChild(card);
      });
      el.appendChild(grid);
      if(window.attachShine) attachShine(el);
      if(window.initFadeIn) initFadeIn(el);
    } catch(e) {
      el.innerHTML = '<div class="n-err">Errore nel caricamento del database</div>';
    }
  });
}
