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

  /* Mappa id DOM dropdown/sezione mobile → sezione (v). */
  var DD_TO_V = {};
  var MN_TO_V = {};
  Object.keys(SEC).forEach(function(v){
    if(SEC[v].dd) DD_TO_V[SEC[v].dd] = v;
    if(SEC[v].mn) MN_TO_V[SEC[v].mn] = v;
  });
  MN_TO_V['mn-section--lavori'] = 'lavori';

  /* Rimuove dal menu (top-bar, mobile, bottom-nav) gli elementi
     delle sezioni non più presenti in SECTIONS. */
  function _prune(){
    var active = {};
    _sections().forEach(function(s){ if(s && s.v) active[s.v] = 1; });

    document.querySelectorAll('#tnav .tn-drop').forEach(function(dd){
      var v = DD_TO_V[dd.id] || (dd.id.indexOf('dd-') === 0 ? dd.id.slice(3) : null);
      if(v && !active[v]) dd.remove();
    });

    document.querySelectorAll('#mobile-nav .mn-section').forEach(function(ms){
      var v = MN_TO_V[ms.id] || (ms.id.indexOf('mn-sec-') === 0 ? ms.id.slice(7) : null);
      if(!v && ms.classList.contains('mn-section--lavori')) v = 'lavori';
      if(v && !active[v]) ms.remove();
    });

    document.querySelectorAll('#bottom-nav .bnav-item').forEach(function(b){
      var k = b.getAttribute('data-k');
      if(k && k !== 'home' && k !== 'menu' && !active[k]) b.remove();
    });
  }

  function _desktopSubHeader(menu, sub){
    var sel = menu.querySelector('.tn-sub[data-sub="'+sub+'"]');
    if(sel) return sel;
    var el = document.createElement('div');
    el.className = 'tn-sub';
    el.dataset.sub = sub;
    el.textContent = sub;
    menu.appendChild(el);
    return el;
  }

  function _mobileSubHeader(section, sub){
    var sel = section.querySelector('.mn-sub[data-sub="'+sub+'"]');
    if(sel) return sel;
    var el = document.createElement('div');
    el.className = 'mn-sub';
    el.dataset.sub = sub;
    el.textContent = sub;
    section.appendChild(el);
    return el;
  }

  /* Raggruppa le pagine per sezione e poi per sottosezione ('' = senza sub) */
  function _buildGroups(custom){
    var groups = {};
    custom.forEach(function(p){
      var sec = p.sec || '';
      if(!groups[sec]) groups[sec] = {};
      var sub = p.sub || '';
      (groups[sec][sub] = groups[sec][sub] || []).push(p);
    });
    return groups;
  }

  function _ensureDesktopMenu(v, label){
    var id = (SEC[v] && SEC[v].dd) ? SEC[v].dd : 'dd-' + v;
    var dd = document.getElementById(id);
    if(dd){
      var t = dd.querySelector(':scope > .tn');
      if(t) t.textContent = label;
      var lbl = dd.querySelector('.tn-menu-label');
      if(lbl) lbl.textContent = label;
      return dd.querySelector('.tn-menu');
    }
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
    var mnEl = null;
    if(SEC[v]){
      mnEl = SEC[v].mn
        ? document.querySelector('#mobile-nav .'+SEC[v].mn)
        : document.querySelector('#mobile-nav .mn-section--lavori');
    } else {
      mnEl = document.getElementById('mn-sec-' + v);
    }
    if(mnEl){
      var lbl = mnEl.querySelector('.mn-label');
      if(lbl) lbl.textContent = label;
      return mnEl;
    }
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

  /* Riordina i dropdown della top bar e le sezioni della mobile nav
     secondo l'ordine di SECTIONS. Mantiene Home (desktop) in testa e
     il link Discord in coda alla mobile nav. */
  function _reorder(){
    var nav = document.getElementById('tnav');
    if(nav){
      var home = nav.querySelector('.tn.ta[data-v="home"]');
      var anchor = home || nav.firstChild;
      _sections().forEach(function(s){
        if(!s || !s.v) return;
        var dd = document.getElementById((SEC[s.v] && SEC[s.v].dd) ? SEC[s.v].dd : 'dd-'+s.v);
        if(!dd || dd.parentNode !== nav) return;
        nav.insertBefore(dd, anchor.nextSibling);
        anchor = dd;
      });
    }
    var drawer = document.getElementById('mobile-nav');
    if(drawer){
      var first = drawer.querySelector('.mn-section');
      var anchor2 = first || drawer.firstChild;
      _sections().forEach(function(s){
        if(!s || !s.v) return;
        var mnEl = document.getElementById('mn-sec-'+s.v)
          || (SEC[s.v]
              ? (SEC[s.v].mn
                  ? document.querySelector('#mobile-nav .'+SEC[s.v].mn)
                  : document.querySelector('#mobile-nav .mn-section--lavori'))
              : null);
        if(!mnEl || mnEl.parentNode !== drawer) return;
        drawer.insertBefore(mnEl, anchor2.nextSibling);
        anchor2 = mnEl;
      });
    }
  }

  function inject(){
    _prune();
    var custom = _customPages();
    var sections = _sections();
    var groups = _buildGroups(custom);
    sections.forEach(function(s){
      if(!s || !s.v) return;
      var sec = s.v;
      var subs = groups[sec] || {};
      var menu = _ensureDesktopMenu(sec, s.l || sec);
      var mnEl = _ensureMobileSection(sec, s.l || sec);
      if(!menu && !mnEl) return;
      var subKeys = Object.keys(subs).sort(function(a,b){
        if(a==='') return -1;
        if(b==='') return 1;
        return 0;
      });
      var firstBlock = true;
      subKeys.forEach(function(sub){
        var pages = subs[sub];
        if(!pages || !pages.length) return;
        if(firstBlock && menu && !menu.querySelector('.tn-item[data-cp]')){
          var div = document.createElement('div');
          div.className = 'tn-div';
          div.dataset.cp = 'sep';
          menu.appendChild(div);
        }
        firstBlock = false;
        if(sub && menu) _desktopSubHeader(menu, sub);
        if(sub && mnEl) _mobileSubHeader(mnEl, sub);
        pages.forEach(function(p){
          if(menu) _makeDesktop(menu, p);
          if(mnEl) _makeMobile(mnEl, p);
        });
      });
    });
    _reorder();
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

/* ═══════════════ SCHEDA PG: visibilità sezione (config admin) ═══════════════ */
(function(){
  function applySchedeVisibility(cfg){
    var link=document.querySelector('#dd-pg .tn-item[href="/schede/"]');
    if(link) link.style.display=(cfg&&cfg.abilitata===false)?'none':'';
  }
  fetch('/api/schede/config',{credentials:'include'})
    .then(function(r){return r.ok?r.json():null;})
    .then(applySchedeVisibility)
    .catch(function(){});
})();
