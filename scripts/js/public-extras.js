/* Funzionalità pubbliche: palette di ricerca e tooltip glossario. */
(function () {
  'use strict';
  var indexPromise;
  var palette, input, list, active = 0, results = [];
  var glossaryPromise;
  var glossary = {};
  function loadGlossary() {
    if (!glossaryPromise) glossaryPromise = fetch('/content/glossary.json').then(function (r) { if (!r.ok) throw new Error('glossary'); return r.json(); }).then(function (doc) {
      glossary = {};
      (doc.terms || []).forEach(function (term) { if (term && term.key) glossary[term.key.toLowerCase()] = term; });
      window.ARC_GLOSSARY = glossary;
      document.dispatchEvent(new CustomEvent('arc-glossary-ready'));
      if (window.gp && document.getElementById('pbody')) {
        document.getElementById('pbody').querySelectorAll('.arc-glossary-raw').forEach(function (el) {
          var term=glossary[(el.textContent || '').toLowerCase()];
          if (!term) return;
          var span=document.createElement('span'); span.className='arc-glossary-term'; span.tabIndex=0; span.setAttribute('role','button'); span.setAttribute('data-glossary',term.key); span.textContent=term.title || term.key; el.replaceWith(span);
        });
      }
      return glossary;
    }).catch(function () { glossary = {}; window.ARC_GLOSSARY = glossary; return glossary; });
    return glossaryPromise;
  }
  loadGlossary();
  function esc(s) { return String(s || '').replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function loadIndex() {
    if (!indexPromise) indexPromise = fetch('/content/search-index.json').then(function (r) { if (!r.ok) throw new Error('search index'); return r.json(); }).catch(function () { return []; });
    return indexPromise;
  }
  function openPalette() {
    if (!palette) createPalette();
    palette.hidden = false;
    input.value = '';
    render();
    input.focus();
  }
  function closePalette() { if (palette) palette.hidden = true; }
  function createPalette() {
    palette = document.createElement('div');
    palette.className = 'arc-palette';
    palette.hidden = true;
    palette.innerHTML = '<div class="arc-palette-dialog" role="dialog" aria-modal="true" aria-label="Cerca nella wiki"><label for="arc-palette-input">Cerca nella wiki</label><input id="arc-palette-input" type="search" placeholder="Pagine, divinità, classi, regioni…" autocomplete="off"><div class="arc-palette-results" role="listbox"></div><p>↑ ↓ per navigare · Invio per aprire · Esc per chiudere</p></div>';
    document.body.appendChild(palette);
    input = palette.querySelector('input'); list = palette.querySelector('.arc-palette-results');
    input.addEventListener('input', render);
    palette.addEventListener('click', function (e) { if (e.target === palette) closePalette(); });
    palette.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closePalette();
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); active = (active + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % Math.max(results.length, 1); render(); }
      else if (e.key === 'Enter' && results[active]) { var r = results[active]; closePalette(); if (window.gp) window.gp(r.id, r.title, r.icon || '📄'); }
    });
  }
  function render() {
    var q = input.value.trim().toLowerCase();
    loadIndex().then(function (idx) {
      results = (idx || []).map(function (p) { var title = (p.title || '').toLowerCase(), text = (p.text || '').toLowerCase(); var score = !q ? 0 : title.indexOf(q) === 0 ? 30 : title.indexOf(q) >= 0 ? 20 : text.indexOf(q) >= 0 ? 5 : -1; return { id:p.id, title:p.title, icon:p.icon, score:score, category:p.category || 'Pagine' }; }).filter(function (x) { return x.score >= 0; }).sort(function (a,b) { return b.score-a.score || a.title.localeCompare(b.title); }).slice(0,12);
      active = Math.min(active, Math.max(results.length - 1, 0));
      var groups = {};
      results.forEach(function (r,i) { (groups[r.category] || (groups[r.category]=[])).push('<button type="button" role="option" aria-selected="'+(i===active)+'" data-result="'+i+'"><span>'+esc(r.icon || '📄')+'</span> '+esc(r.title)+'</button>'); });
      list.innerHTML = Object.keys(groups).map(function (k) { return '<section><h3>'+esc(k)+'</h3>'+groups[k].join('')+'</section>'; }).join('') || '<p class="arc-palette-empty">Nessun risultato</p>';
      list.querySelectorAll('[data-result]').forEach(function (b) { b.addEventListener('click', function () { var r=results[Number(b.dataset.result)]; closePalette(); if (window.gp) window.gp(r.id,r.title,r.icon || '📄'); }); });
    });
  }
  document.addEventListener('keydown', function (e) { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); } });
  window.arcOpenSearch = openPalette;
  function setupHomeRails() {
    var home = document.getElementById('hv');
    var carousel = document.getElementById('carousel-wrap');
    if (!home || !carousel || home.querySelector('.arc-home-rails')) return;
    var wrap = document.createElement('div'); wrap.className = 'arc-home-rails';
    wrap.innerHTML = '<section class="arc-home-section"><p class="sec-eyebrow">Esplora gli archivi</p><h2 class="sec-h">IN PRIMO PIANO</h2><div class="arc-card-rail" aria-label="Pagine in primo piano"></div></section>';
    carousel.insertAdjacentElement('afterend', wrap);
    loadIndex().then(function(idx) {
      var rail=wrap.querySelector('.arc-card-rail');
      (idx||[]).filter(function(p){return p.id && p.title && !/imprese/i.test(p.title);}).slice(0,14).forEach(function(p){
        var card=document.createElement('button'); card.type='button'; card.className='arc-home-card';
        card.innerHTML='<span class="arc-home-card-icon">'+esc(p.icon||'✦')+'</span><strong>'+esc(p.title)+'</strong><small>'+esc((p.category||'Archivio'))+'</small>';
        card.addEventListener('click',function(){if(window.gp)window.gp(p.id,p.title,p.icon||'📄');});
        rail.appendChild(card);
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',setupHomeRails); else setupHomeRails();
  var tip, timer;
  function ensureTip() { if (!tip) { tip=document.createElement('div'); tip.className='arc-tooltip'; tip.setAttribute('role','tooltip'); document.body.appendChild(tip); } return tip; }
  function showTerm(el) {
    var name=(el.getAttribute('data-glossary') || '').toLowerCase();
    loadGlossary().then(function(data) {
      var term=data[name];
      if (!term || !el.matches(':hover,:focus')) return;
      var tip=ensureTip();
      tip.innerHTML='';
      if (term.iconId) {
        var icon=document.createElementNS('http://www.w3.org/2000/svg','svg');
        icon.setAttribute('class','arc-tooltip-icon'); icon.setAttribute('aria-hidden','true');
        var use=document.createElementNS('http://www.w3.org/2000/svg','use');
        use.setAttribute('href','/images/icons-lore.svg#'+term.iconId); icon.appendChild(use); tip.appendChild(icon);
      }
      var heading=document.createElement('strong'); heading.textContent=term.title || term.key; tip.appendChild(heading);
      var excerpt=document.createElement('span'); excerpt.textContent=term.excerpt || ''; tip.appendChild(excerpt);
      if (term.pageLink) { var link=document.createElement('a'); link.textContent='Approfondisci →'; link.href=term.pageLink; tip.appendChild(link); }
      tip.classList.add('is-open'); var r=el.getBoundingClientRect();
      tip.style.left=Math.max(12,Math.min(innerWidth-320,r.left))+'px'; tip.style.top=Math.min(innerHeight-80,r.bottom+8)+'px';
    });
  }
  function place(el, text) { var t=ensureTip(); t.textContent=text; t.classList.add('is-open'); var r=el.getBoundingClientRect(); t.style.left=Math.max(12,Math.min(innerWidth-320,r.left))+'px'; t.style.top=Math.min(innerHeight-80,r.bottom+8)+'px'; }
  document.addEventListener('arc-glossary-ready', function() {
    document.querySelectorAll('.arc-glossary-raw').forEach(function(el) {
      var term=glossary[(el.textContent || '').toLowerCase()];
      if (!term) return;
      var span=document.createElement('span'); span.className='arc-glossary-term'; span.tabIndex=0; span.setAttribute('role','button'); span.setAttribute('data-glossary',term.key); span.textContent=term.title || term.key; el.replaceWith(span);
    });
  });
  document.addEventListener('mouseover', function(e){ var el=e.target.closest && e.target.closest('.arc-glossary-term'); if(el){ clearTimeout(timer); timer=setTimeout(function(){showTerm(el);},150); } else if(tip) tip.classList.remove('is-open'); });
  document.addEventListener('focusin', function(e){ var el=e.target.closest && e.target.closest('.arc-glossary-term'); if(el){ clearTimeout(timer); timer=setTimeout(function(){showTerm(el);},150); } });
  document.addEventListener('focusout', function(e){ if(e.target.closest && e.target.closest('.arc-glossary-term') && tip) tip.classList.remove('is-open'); });
  document.addEventListener('click', function(e){ if(e.target.closest && e.target.closest('.arc-glossary-term')) { var el=e.target.closest('.arc-glossary-term'); if(tip && tip.classList.contains('is-open')) tip.classList.remove('is-open'); else showTerm(el); } });
})();
