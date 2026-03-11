/* ════════════════════════════════════
   ARCAMIS — app.js (STATIC EDITION)
════════════════════════════════════ */

// ... (mantieni le funzioni Loader, Font Size, Theme, Logo e Carousel uguali)

/* ── Prefetch Locale ── */
function prefetchPage(id){
  var key='pg_'+id;
  if(window._memCache && _memCache[key]) return;
  
  // Carica il JSON dalla cartella locale
  fetch('/data/pages/' + id + '.json')
    .then(function(r){ if(r.ok) return r.json(); })
    .then(function(d){
      if(d && window._memCache) _memCache[key] = d;
    }).catch(function(){});
}

/* ── Rendering Pagina (Chirurgia qui) ── */
async function _gpRender(id, label, icon) {
  var pbody = document.getElementById('pbody');
  var key = 'pg_' + id;
  var data = window._memCache ? _memCache[key] : null;

  if(!data) {
    try {
      var r = await fetch('/data/pages/' + id + '.json');
      if(!r.ok) throw new Error("Pagina non trovata");
      data = await r.json();
      if(window._memCache) _memCache[key] = data;
    } catch(e) {
      pbody.innerHTML = '<div style="padding:40px;text-align:center;color:var(--gold)">Ospite, questa pergamena sembra perduta... (404)</div>';
      return;
    }
  }

  // Usa la funzione di rendering esistente in notion-render.js
  renderNotionPage(data, pbody); 
  addRecente(id, label, icon);
  if(window.afterPageRender) window.afterPageRender();
}

// ... (mantieni le altre funzioni hsearch, toggleWiki, ecc.)
