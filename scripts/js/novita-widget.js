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
/* ════════════════════════════════════
   BADGE "ULTIMO AGGIORNAMENTO" sulle card
════════════════════════════════════ */
window.applyRecentBadges = function() {
  fetch('/api/recent')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var pages = data.pages || [];
      if (!pages.length) return;

      /* Mappa id → lastEdited */
      var map = {};
      pages.forEach(function(p) {
        if (p.id && p.lastEdited) map[p.id] = p.lastEdited;
      });

      /* CSS badge — iniettato una volta sola */
      if (!document.getElementById('arc-recent-badge-css')) {
        var s = document.createElement('style');
        s.id = 'arc-recent-badge-css';
        s.textContent = `
.arc-rbadge {
  font-family: 'Cinzel', serif;
  font-size: 7px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: rgba(200,155,60,.7);
  border-top: 1px solid rgba(200,155,60,.15);
  padding-top: 5px;
  margin-top: 5px;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.arc-rbadge::before {
  content: '◆ ';
  font-size: 5px;
  opacity: .6;
}
/* lcard */
.lcard .arc-rbadge { margin-top: 6px; }
/* fpill */
.fpill .arc-rbadge {
  font-size: 6.5px;
  color: rgba(200,155,60,.55);
  border-top-color: rgba(200,155,60,.1);
  margin-top: 4px;
  padding-top: 4px;
}
/* loc-card */
.loc-card .arc-rbadge {
  position: absolute;
  bottom: 28px;
  left: 0; right: 0;
  text-align: center;
  border: none;
  padding: 0;
  margin: 0;
  color: rgba(255,255,255,.55);
  text-shadow: 0 1px 4px rgba(0,0,0,1);
}
/* loc-banner */
.loc-banner .arc-rbadge {
  font-size: 7px;
  color: rgba(200,155,60,.5);
  border-top-color: rgba(200,155,60,.1);
}
/* cp-icard */
.cp-icard .arc-rbadge {
  font-size: 6.5px;
  color: rgba(200,155,60,.55);
  border: none;
  padding: 0;
  margin-top: 3px;
}
/* gs-card (galleria PG) */
.gs-card .arc-rbadge {
  position: absolute;
  bottom: 22px;
  left: 0; right: 0;
  text-align: center;
  border: none;
  padding: 0;
  margin: 0;
  color: rgba(255,255,255,.5);
  text-shadow: 0 1px 4px rgba(0,0,0,1);
  z-index: 3;
}
        `;
        document.head.appendChild(s);
      }

      function _formatDate(iso) {
        if (!iso) return '';
        var d = new Date(iso);
        return 'Ultimo aggiornamento ' + d.toLocaleDateString('it-IT', {
          day: '2-digit', month: 'short', year: 'numeric'
        });
      }

      function _addBadge(el, iso) {
        /* Non aggiungere due volte */
        if (el.querySelector('.arc-rbadge')) return;
        var badge = document.createElement('span');
        badge.className = 'arc-rbadge';
        badge.textContent = _formatDate(iso);

        /* Trova dove inserire il badge a seconda del tipo di card */
        var target =
          el.querySelector('.cinfo') ||      /* lcard */
          el.querySelector('.fp-d') ||        /* fpill */
          el.querySelector('.loc-banner-sub') || /* loc-banner */
          el.querySelector('.loc-sub') ||     /* loc-card */
          el.querySelector('.cp-icard-sub') || /* cp-icard */
          el.querySelector('.loc-banner-body') || /* loc-banner fallback */
          null;

        if (target) {
          target.parentNode.insertBefore(badge, target.nextSibling);
        } else {
          el.appendChild(badge);
        }
      }

      function _extractId(el) {
        /* Prova da id dell'elemento (gs-card) */
        var elId = el.id || '';
        if (elId.startsWith('gsc-')) return elId.replace('gsc-', '');

        /* Prova dall'onclick */
        var oc = el.getAttribute('onclick') || '';
        var m = oc.match(/gp\(['"]([a-f0-9]{32})['"]/);
        return m ? m[1] : null;
      }

      /* Seleziona tutte le card */
      var selectors = [
        '.lcard', '.fpill', '.loc-card', '.loc-banner',
        '.cp-icard', '.gs-card'
      ];

      document.querySelectorAll(selectors.join(',')).forEach(function(card) {
        var id = _extractId(card);
        if (id && map[id]) _addBadge(card, map[id]);
      });
    })
    .catch(function() {});
};
