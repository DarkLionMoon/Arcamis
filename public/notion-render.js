/* ════════════════════════════════════
   NOTION RENDER — auto-styling engine
════════════════════════════════════ */

var navStack = []; /* history [{id,label,icon},...] */

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
  if(!blocks || !blocks.length) return '';
  var html = '';
  
  for (var i = 0; i < blocks.length; i++) {
    var b = blocks[i];

    // ─── LOGICA CAROSELLO BLINDATA ───
    if (b.type === 'child_page') {
      var pagesToGroup = [];
      // Raccoglie tutte le pagine consecutive
      while (i < blocks.length && blocks[i].type === 'child_page') {
        pagesToGroup.push(blocks[i]);
        i++;
      }
      i--; // TORNA INDIETRO DI UNO per non saltare il blocco successivo non-pagina

      if (pagesToGroup.length > 1) {
        html += '<div class="carousel-container"><button class="car-btn left" onclick="scrollCar(this,-1)">‹</button><div class="carousel-track">';
        pagesToGroup.forEach(function(p) {
          var id = p.id.replace(/-/g, '');
          var title = p.child_page.title.replace(/'/g, "\\'");
          html += '<div class="lcard fade-in" onclick="gp(\'' + id + '\',\'' + title + '\',\'📄\')"><div class="shine"></div><div class="lcard-title">' + p.child_page.title + '</div></div>';
        });
        html += '</div><button class="car-btn right" onclick="scrollCar(this,1)">›</button></div>';
      } else {
        // Pagina singola, niente carosello
        var singleP = pagesToGroup[0];
        var sId = singleP.id.replace(/-/g, '');
        var sTitle = singleP.child_page.title.replace(/'/g, "\\'");
        html += '<div class="lcard single-card fade-in" onclick="gp(\'' + sId + '\',\'' + sTitle + '\',\'📄\')"><div class="shine"></div><div class="lcard-title">' + singleP.child_page.title + '</div></div>';
      }
      continue;
    }

    // ─── RENDERING DEGLI ALTRI BLOCCHI ───
    if (b.type === 'paragraph') {
      html += '<p class="n-p">' + renderRichText(b.paragraph.rich_text) + '</p>';
    } 
    else if (b.type.indexOf('heading_') === 0) {
      var level = b.type.split('_')[1];
      var h = b[b.type];
      var txt = renderRichText(h.rich_text);
      if (h.is_toggleable) {
        html += '<details class="n-th-wrapper" ontoggle="if(this.open)loadDbGalleries(this)"><summary class="n-h' + level + ' n-th">' + txt + '</summary><div class="n-th-content">' + renderBlocks(b.children || []) + '</div></details>';
      } else {
        html += '<h' + level + ' class="n-h' + level + '">' + txt + '</h' + level + '>';
      }
    } 
    else if (b.type === 'image') {
      var url = b.image.type === 'external' ? b.image.external.url : b.image.file.url;
      html += '<div class="n-image"><img src="' + url + '" loading="lazy"></div>';
    } 
    else if (b.type === 'callout') {
      var acc = iconAccent(b.callout.icon ? b.callout.icon.emoji : null);
      var iconHtml = b.callout.icon ? '<div class="n-callout-icon">' + b.callout.icon.emoji + '</div>' : '';
      html += '<div class="n-callout" style="border-color:' + acc.c + ';background:' + acc.bg + '">' + iconHtml + '<div class="n-callout-body">' + renderRichText(b.callout.rich_text) + '</div></div>';
    } 
    else if (b.type === 'bulleted_list_item') {
      html += '<ul class="n-ul"><li>' + renderRichText(b.bulleted_list_item.rich_text) + '</li></ul>';
    } 
    else if (b.type === 'numbered_list_item') {
      html += '<ol class="n-ol"><li>' + renderRichText(b.numbered_list_item.rich_text) + '</li></ol>';
    } 
    else if (b.type === 'quote') {
      html += '<blockquote class="n-quote">' + renderRichText(b.quote.rich_text) + '</blockquote>';
    } 
    else if (b.type === 'divider') {
      html += '<hr class="n-hr">';
    } 
    else if (b.type === 'child_database') {
      html += '<div class="n-db-wrap" data-dbid="' + b.id.replace(/-/g, '') + '"><div class="n-db-loading">Caricamento database...</div></div>';
    }
  }
  return html;
}

function scrollCar(btn, dir) {
  var track = btn.parentElement.querySelector('.carousel-track');
  var step = track.clientWidth * 0.75;
  track.scrollBy({ left: step * dir, behavior: 'smooth' });
}

async function loadDbGalleries(root) {
  var dbs = (root || document).querySelectorAll('.n-db-wrap[data-dbid]');
  for (var i = 0; i < dbs.length; i++) {
    var el = dbs[i];
    if (el.dataset.loaded) continue;
    var dbId = el.dataset.dbid;
    try {
      var res = await fetch('/api/notion?dbId=' + dbId);
      var data = await res.json();
      el.innerHTML = ''; el.dataset.loaded = "true";
      var grid = document.createElement('div'); grid.className = 'cgrid';
      data.pages.forEach(function(p) {
        var card = document.createElement('div');
        card.className = 'lcard fade-in';
        card.style.backgroundImage = p.cover ? 'url(' + p.cover + ')' : 'linear-gradient(135deg, #1a1c22, #0c0e12)';
        card.innerHTML = '<div class="shine"></div><div class="lcard-title">' + (p.icon || '') + ' ' + p.title + '</div>';
        card.onclick = function() { gp(p.id, p.title, p.icon || '📄'); };
        grid.appendChild(card);
      });
      el.appendChild(grid);
      if (window.attachShine) attachShine(el);
      if (window.initFadeIn) initFadeIn(el);
    } catch (e) { el.innerHTML = '<div class="n-err">Errore DB</div>'; }
  }
}

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
  (root||document).querySelectorAll('.n-p,.n-callout-body,.n-intro-body').forEach(function(el){
    var html=el.innerHTML;
    terms.forEach(function(t){
      var regex=new RegExp('\\b'+t+'\\b','g');
      html=html.replace(regex,'<span class="g-term" title="'+_glossary[t]+'">'+t+'</span>');
    });
    el.innerHTML=html;
  });
}
