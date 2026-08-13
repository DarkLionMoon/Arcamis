/* ════════════════════════════════════
   custom-nav.js
   Inietta nel menu del sito le pagine
   custom create dall'admin (entries di
   data.js con campo "sec") e crea i
   dropdown della top bar per le sezioni
   definite in data.js (var SECTIONS).
   ════════════════════════════════════ */
(function(){
  var SEC = {
    regole:      { dd:'dd-regole',  mn:'mn-sec-regole' },
    personaggio: { dd:'dd-pg',      mn:'mn-sec-pg'     },
    lavori:      { dd:'dd-lavori',  mn:null            },
    lore:        { dd:'dd-lore',    mn:'mn-sec-lore'   }
  };
  var DEF_SECTIONS = [
    {v:'regole',l:'Regole'},{v:'personaggio',l:'Personaggio'},
    {v:'lavori',l:'Lavori'},{v:'lore',l:'Lore'}
  ];

  function _sections(){
    return (typeof SECTIONS !== 'undefined' && Array.isArray(SECTIONS) && SECTIONS.length)
      ? SECTIONS.filter(function(s){ return s && s.v; })
      : DEF_SECTIONS;
  }

  function _customPages(){
    return (typeof pages !== 'undefined')
      ? pages.filter(function(p){ return p.sec && p.id; })
      : [];
  }

  function _makeDesktop(menu, p){
    if(menu.querySelector('.tn-item[data-cp="'+p.k+'"]')) return;
    var el = document.createElement('div');
    el.className = 'tn-item';
    el.dataset.cp = p.k;
    el.innerHTML = '<span class="tn-ii">'+(p.i||'📄')+'</span>'+p.l;
    el.addEventListener('click', function(){ closeDd(); gp(p.id, p.l, p.i); });
    menu.appendChild(el);
  }

  function _makeMobile(section, p){
    if(section.querySelector('.mn-item[data-cp="'+p.k+'"]')) return;
    var el = document.createElement('div');
    el.className = 'mn-item';
    el.dataset.cp = p.k;
    el.innerHTML = '<span class="mn-ii">'+(p.i||'📄')+'</span>'+p.l;
    el.addEventListener('click', function(){ closeMobileNav(); gp(p.id, p.l, p.i); });
    section.appendChild(el);
  }

  function _ensureDesktopMenu(v, label){
    var id = (SEC[v] && SEC[v].dd) ? SEC[v].dd : 'dd-' + v;
    var dd = document.getElementById(id);
    if(dd) return dd.querySelector('.tn-menu');
    var nav = document.getElementById('tnav');
    if(!nav) return null;
    dd = document.createElement('div');
    dd.className = 'tn-drop';
    dd.id = id;
    dd.setAttribute('role','menu');
    var t = document.createElement('div');
    t.className = 'tn';
    t.setAttribute('role','menuitem');
    t.setAttribute('aria-expanded','false');
    t.setAttribute('tabindex','0');
    t.textContent = label;
    t.onclick = function(e){ toggleDd(id, e); };
    var menu = document.createElement('div');
    menu.className = 'tn-menu';
    var lbl = document.createElement('div');
    lbl.className = 'tn-menu-label';
    lbl.textContent = label;
    menu.appendChild(lbl);
    dd.appendChild(t);
    dd.appendChild(menu);
    nav.appendChild(dd);
    return menu;
  }

  function _ensureMobileSection(v, label){
    if(SEC[v]){
      var mnEl = SEC[v].mn
        ? document.querySelector('#mobile-nav .'+SEC[v].mn)
        : document.querySelector('#mobile-nav .mn-section--lavori');
      return mnEl || null;
    }
    var mnEl = document.getElementById('mn-sec-' + v);
    if(mnEl) return mnEl;
    var drawer = document.getElementById('mobile-nav');
    if(!drawer) return null;
    mnEl = document.createElement('div');
    mnEl.className = 'mn-section';
    mnEl.id = 'mn-sec-' + v;
    var lbl = document.createElement('div');
    lbl.className = 'mn-label';
    lbl.textContent = label;
    mnEl.appendChild(lbl);
    var discord = drawer.querySelector('a.mn-discord');
    if(discord) drawer.insertBefore(mnEl, discord);
    else drawer.appendChild(mnEl);
    return mnEl;
  }

  function inject(){
    var custom = _customPages();
    var sections = _sections();
    var bySec = {};
    custom.forEach(function(p){ (bySec[p.sec] = bySec[p.sec] || []).push(p); });
    sections.forEach(function(s){
      if(!s || !s.v) return;
      var menu = _ensureDesktopMenu(s.v, s.l || s.v);
      if(menu && bySec[s.v]){
        if(!menu.querySelector('.tn-item[data-cp]')){
          var div = document.createElement('div');
          div.className = 'tn-div';
          div.dataset.cp = 'sep';
          menu.appendChild(div);
        }
        bySec[s.v].forEach(function(p){ _makeDesktop(menu, p); });
      }
      var mnEl = _ensureMobileSection(s.v, s.l || s.v);
      if(mnEl && bySec[s.v]) bySec[s.v].forEach(function(p){ _makeMobile(mnEl, p); });
    });
  }

  function init(){
    if(!document.getElementById('tnav') && !document.getElementById('mobile-nav')) return;
    inject();
    if(document.getElementById('mobile-nav')){
      var t = setInterval(function(){
        if(document.querySelector('#mobile-nav .mn-item')){
          clearInterval(t);
          inject();
        }
      }, 250);
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
