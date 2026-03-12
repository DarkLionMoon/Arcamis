/* ════════════════════════════════════
   NOTION RENDER — versione Safe-Debug
════════════════════════════════════ */

var navStack = []; 
var isRendering = false; // PROTEZIONE ANTI-BLOCK

/* ... (funzioni iconAccent, rt, calloutColor restano uguali) ... */

async function gp(id, label, icon, _fromPop) {
  // Se sta già caricando, ignora il nuovo click per evitare loop infiniti
  if (isRendering) return; 
  isRendering = true;

  try {
    // Pulizia ID immediata
    var cleanId = id.replace(/-/g, '');
    
    if (!_fromPop) {
      navStack.push({ id: cleanId, label: label, icon: icon });
      history.pushState({ id: cleanId, label: label, icon: icon, stack: navStack.slice(0, -1) }, '', location.pathname + '?p=' + cleanId);
    }

    var hv = document.getElementById('hv'), pv = document.getElementById('pv');
    var _pb = document.getElementById('pbody');

    // Reset interfaccia
    document.getElementById('ph-title').textContent = label;
    document.getElementById('ph-crumb').innerHTML = buildCrumb(label);
    
    if (hv.style.display === 'block') {
      _pb.innerHTML = '<div class="ldwrap"><div class="spin"></div></div>';
      xfade(hv, pv);
    } else {
      _pb.innerHTML = '<div class="ldwrap"><div class="spin"></div></div>';
    }

    await _gpRender(cleanId, label, icon);
  } finally {
    isRendering = false; // Sblocca solo a fine operazione
  }
}

async function _gpRender(id, label, icon) {
  var pbody = document.getElementById('pbody');
  
  try {
    var liveUrl = '/api/notion?pageId=' + id;
    var r = await fetch(liveUrl);
    if (!r.ok) throw new Error('Errore API: ' + r.status);
    var data = await r.json();

    var bl = data.blocks;
    var html = renderBlocks(bl, true);
    
    // Rendering finale
    pbody.innerHTML = '<div class="nc">' + html + '</div>';
    
    // Inizializzazione controllata dei componenti estetici
    setTimeout(() => {
        loadDbGalleries(pbody);
        _initCarouselArrows(pbody);
        if(window.buildWhisperNav) window.buildWhisperNav();
    }, 100);

  } catch (e) {
    pbody.innerHTML = '<div class="errbox">Errore nel caricamento.</div>';
    console.error("Render Error:", e);
  }
}
