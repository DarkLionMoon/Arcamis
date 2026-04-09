/* ════════════════════════════════════
   ARCAMIS — novita-widget.js
   Widget "Pagina Novità"
   
   USO: crea una pagina Notion con un
   child_database o un blocco speciale,
   oppure usa l'ID speciale intercettato
   in _loadSingleDb.
   
   In alternativa, inietta il widget
   in qualsiasi container con:
     loadNovitaWidget(container)
════════════════════════════════════ */

window.loadNovitaWidget = function(container) {
  if (!container) return;

  container.innerHTML =
    '<div class="arc-news-loading">⏳ Caricamento novità...</div>';

  fetch('/api/recent')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var pages = data.pages || [];
      if (!pages.length) {
        container.innerHTML =
          '<div class="arc-news-loading">Nessuna novità recente.</div>';
        return;
      }

      var html = '<div class="arc-news-grid">' +
        pages.map(function(p) {
          var titleSafe = (p.title || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
          var iconSafe  = (p.icon  || '📄');
          return '<div class="arc-news-card" onclick="gp(\'' + p.id + '\',\'' + titleSafe + '\',\'' + iconSafe + '\')">' +
            '<div class="arc-news-icon">' + iconSafe + '</div>' +
            '<div class="arc-news-title">' + _escHtml(p.title) + '</div>' +
            '<div class="arc-news-date">' + _relativeDate(p.lastEdited) + '</div>' +
          '</div>';
        }).join('') +
      '</div>';

      container.innerHTML = html;
    })
    .catch(function(err) {
      container.innerHTML =
        '<div class="arc-news-loading">⚠️ Errore caricamento novità.</div>';
      console.error(err);
    });
};

function _relativeDate(iso) {
  if (!iso) return '';
  var diff = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (diff === 0)  return 'Oggi';
  if (diff === 1)  return 'Ieri';
  if (diff < 7)   return diff + ' giorni fa';
  if (diff < 30)  return Math.floor(diff / 7) + ' settimane fa';
  if (diff < 365) return Math.floor(diff / 30) + ' mesi fa';
  return Math.floor(diff / 365) + ' anni fa';
}

function _escHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}


/* ════════════════════════════════════
   INTEGRAZIONE IN _loadSingleDb
   
   Aggiungi questo ID speciale in
   notion-render.js, nel case child_database
   di renderBlocks():
   
   }else if(dbRawId === 'NOVITA_PAGE_ID'){
     h += '<div class="arc-novita-container" id="novita-'+dbRawId+'"></div>';
   }
   
   E in _loadSingleDb, prima del carousel generico:
   
   var NOVITA_ID = 'NOVITA_PAGE_ID';
   if(dbId === NOVITA_ID){
     var container = document.getElementById('novita-' + dbId);
     if(container && window.loadNovitaWidget) loadNovitaWidget(container);
     return;
   }
   
   OPPURE (più semplice): intercetta direttamente
   in notion-nav.js il pageId della pagina "Novità"
   e chiama loadNovitaWidget sul pbody.
════════════════════════════════════ */


/* ════════════════════════════════════
   TAG CLOUD BIBLIOTECA
   
   In _loadSingleDb, trova il blocco
   della Biblioteca (DB ID: 3040274fdc1c80e0a0dccfa9761bff55)
   e aggiungi PRIMA della generazione delle card:
════════════════════════════════════ */

window._injectTagCloud = function(container, pages, onFilter) {
  // Aggrega tag
  var tagMap = {};
  pages.forEach(function(p) {
    (p.argomenti || []).forEach(function(t) {
      if (!tagMap[t.name]) tagMap[t.name] = { count: 0, color: t.color };
      tagMap[t.name].count++;
    });
  });

  var tags = Object.keys(tagMap);
  if (!tags.length) return;

  tags.sort(function(a, b) {
    return tagMap[b].count - tagMap[a].count;
  });

  var cloudEl = document.createElement('div');
  cloudEl.className = 'arc-tag-cloud';
  cloudEl.id = 'arc-tag-cloud';

  // Bottone "Tutti"
  var allBtn = document.createElement('span');
  allBtn.className = 'arc-tag-cloud-item active';
  allBtn.textContent = 'Tutti';
  allBtn.setAttribute('data-tag', '');
  cloudEl.appendChild(allBtn);

  tags.forEach(function(name) {
    var info = tagMap[name];
    var size = Math.min(15, 10 + info.count * 1.2);
    var el = document.createElement('span');
    el.className = 'arc-tag-cloud-item';
    el.style.fontSize = size + 'px';
    el.setAttribute('data-tag', name);
    el.innerHTML = _escHtml(name) + ' <small>(' + info.count + ')</small>';
    cloudEl.appendChild(el);
  });

  // Click handler
  cloudEl.addEventListener('click', function(e) {
    var item = e.target.closest('.arc-tag-cloud-item');
    if (!item) return;

    cloudEl.querySelectorAll('.arc-tag-cloud-item').forEach(function(i) {
      i.classList.remove('active');
    });
    item.classList.add('active');

    var tag = item.getAttribute('data-tag');
    if (onFilter) onFilter(tag);
  });

  container.insertBefore(cloudEl, container.firstChild);
};
