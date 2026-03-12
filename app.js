/* ════════════════════════════════════
   ARCAMIS — app.js
════════════════════════════════════ */
window.addEventListener('load', function(){
  setTimeout(function(){
    var l = document.getElementById('site-loader');
    if(l) l.classList.add('hidden');
  }, 500);
});

/* ════ FONT SIZE ════ */
var _fs = parseFloat(localStorage.getItem('arc_font') || '1');
function applyFont(s){
  _fs = Math.max(.85, Math.min(1.3, s));
  document.documentElement.style.setProperty('--font-scale', _fs);
  localStorage.setItem('arc_font', _fs);
}
applyFont(_fs);
function fontUp(){ applyFont(_fs + .08); }
function fontDown(){ applyFont(_fs - .08); }

/* ════ THEME ════ */
var _theme = localStorage.getItem('arc_theme') || 'dark';
function applyTheme(t){
  _theme = t;
  document.body.classList.toggle('light', t === 'light');
  var btn = document.getElementById('theme-toggle');
  if(btn) btn.textContent = t === 'light' ? '🌙' : '☀️';
  localStorage.setItem('arc_theme', t);
}
applyTheme(_theme);
function toggleTheme(){ applyTheme(_theme === 'dark' ? 'light' : 'dark'); }

/* ════ UI NAVIGATION ════ */
function showHome(){
  document.getElementById('hv').style.display = 'block';   // era 'home-screen'
  document.getElementById('pv').style.display = 'none';    // era 'page-screen'
  document.body.classList.remove('page-open');
  var cv = document.querySelector('.ph-covbg');
  if(cv) cv.style.opacity = '0';
}

function ovo(){
  var overlay = document.getElementById('overlay');        // era 'mobile-menu'
  if(overlay) overlay.classList.toggle('open');
}

function showToast(txt, icon, dur){
  var t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = '<span>'+icon+'</span>'+txt;
  document.body.appendChild(t);
  setTimeout(function(){ t.classList.add('vis'); }, 10);
  setTimeout(function(){ t.classList.remove('vis'); setTimeout(function(){ t.remove(); }, 400); }, dur || 3000);
}

/* ════ WHISPER NAV ════ */
function buildWhisperNav(){
  var old = document.getElementById('whisper-nav');
  if(old) old.remove();
  var heads = document.querySelectorAll('.nc h2, .nc h3');
  if(heads.length < 2) return;
  var nav = document.createElement('nav');
  nav.id = 'whisper-nav';
  heads.forEach(function(h, i){
    if(!h.id) h.id = 'wsec-' + i;
    var dot = document.createElement('a');
    dot.className = 'wn-dot';
    dot.href = '#';
    dot.setAttribute('data-label', h.textContent.trim().slice(0,32));
    dot.addEventListener('click', function(e){
      e.preventDefault();
      h.scrollIntoView({behavior:'smooth', block:'start'});
    });
    nav.appendChild(dot);
  });
  document.body.appendChild(nav);
}

/* ════ HOOKS ════ */
(function(){
  var _origAfter = window.afterPageRender;
  window.afterPageRender = function(){
    if(_origAfter) _origAfter();
    document.getElementById('hv').style.display = 'none';   // era 'home-screen'
    document.getElementById('pv').style.display = 'block';  // era 'page-screen'
    document.body.classList.add('page-open');
    setTimeout(buildWhisperNav, 300);
  };
})();

/* ════ COPY LINK ════ */
window.copyPageLink = function(){
  var url = location.href;
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(function(){
      showToast('Link copiato', '🔗', 2400);
    });
  }
};
/* ════ DROPDOWN TOPBAR ════ */
function toggleDd(id, e){
  if(e) e.stopPropagation();
  var all = document.querySelectorAll('.tn-drop');
  all.forEach(function(d){
    if(d.id !== id) d.classList.remove('open');
  });
  document.getElementById(id).classList.toggle('open');
}
function closeDd(){
  document.querySelectorAll('.tn-drop').forEach(function(d){ d.classList.remove('open'); });
}
document.addEventListener('click', function(e){
  if(!e.target.closest('.tn-drop')) closeDd();
});

/* ════ MOBILE NAV ════ */
function toggleMobileNav(){
  document.getElementById('mobile-nav').classList.toggle('open');
  document.body.classList.toggle('nav-open');
}
function closeMobileNav(){
  document.getElementById('mobile-nav').classList.remove('open');
  document.body.classList.remove('nav-open');
}

/* ════ SCROLL TOP ════ */
function goToTop(){
  document.getElementById('main').scrollTo({top:0, behavior:'smooth'});
}
window.addEventListener('scroll', function(){
  var btn = document.getElementById('scroll-top-btn');
  if(btn) btn.classList.toggle('visible', window.scrollY > 400);
}, {passive:true});

/* ════ SEARCH ════ */
function hsearch(val){
  var sr = document.getElementById('sr');
  if(!val || val.length < 2){ if(sr) sr.innerHTML=''; return; }
  var q = val.toLowerCase();
  var res = pages.filter(function(p){
    return p.l.toLowerCase().indexOf(q) > -1 || p.k.toLowerCase().indexOf(q) > -1;
  });
  if(!sr) return;
  if(!res.length){ sr.innerHTML='<div class="sr-empty">Nessun risultato</div>'; return; }
  sr.innerHTML = res.map(function(p){
    return '<div class="sr-item" onclick="csearch();gp(\''+p.id+'\',\''+p.l+'\',\''+p.i+'\')">'
      +'<span>'+p.i+'</span> '+p.l+'</div>';
  }).join('');
}
function csearch(){
  var sr = document.getElementById('sr');
  var ts = document.getElementById('ts');
  if(sr) sr.innerHTML='';
  if(ts) ts.value='';
}

/* ════ XFADE (transizione home→pagina) ════ */
function xfade(from, to){
  from.style.transition = 'opacity .2s ease';
  from.style.opacity = '0';
  setTimeout(function(){
    from.style.display = 'none';
    from.style.opacity = '';
    from.style.transition = '';
    to.style.display = 'block';
    to.style.opacity = '0';
    to.style.transition = 'opacity .2s ease';
    setTimeout(function(){
      to.style.opacity = '1';
      setTimeout(function(){ to.style.transition=''; to.style.opacity=''; }, 200);
    }, 10);
  }, 200);
}

/* ════ SETNAV ════ */
function setNav(k){
  document.querySelectorAll('.tn').forEach(function(el){
    el.classList.toggle('ta', el.getAttribute('data-v') === k);
  });
}

/* ════ RECENTI ════ */
var _recenti = [];
function addRecente(id, title, icon){
  _recenti = _recenti.filter(function(r){ return r.id !== id; });
  _recenti.unshift({id:id, title:title, icon:icon});
  if(_recenti.length > 5) _recenti.pop();
  var el = document.getElementById('ov-recenti');
  if(!el || !_recenti.length) return;
  el.innerHTML = '<div class="portal-sh">Visitati di recente</div>'
    + _recenti.map(function(r){
      return '<div class="ov-rec-item" onclick="cv();gp(\''+r.id+'\',\''+r.title+'\',\''+r.icon+'\')">'
        +'<span>'+r.icon+'</span> '+r.title+'</div>';
    }).join('');
}

/* ════ BOTTOM NAV ════ */
function setBnavActive(k){
  document.querySelectorAll('.bnav-item').forEach(function(el){
    el.classList.toggle('active', el.getAttribute('data-k') === k);
  });
}

/* ════ CHANGELOG BADGE ════ */
function markChangelogSeen(){
  localStorage.setItem('arc_cl_seen', Date.now());
  document.querySelectorAll('.changelog-badge').forEach(function(b){ b.style.display='none'; });
}
(function(){
  /* mostra badge se non visto nelle ultime 48h */
  var seen = parseInt(localStorage.getItem('arc_cl_seen')||'0');
  if(Date.now() - seen > 48*3600*1000){
    document.querySelectorAll('.changelog-badge').forEach(function(b){ b.style.display='block'; });
  }
})();

/* ════ CAROUSEL HOME ════ */
var _slideIdx = 0;
function changeSlide(dir){
  var slides = document.querySelectorAll('.slide');
  if(!slides.length) return;
  slides[_slideIdx].classList.remove('active');
  _slideIdx = (_slideIdx + dir + slides.length) % slides.length;
  slides[_slideIdx].classList.add('active');
  updateDots();
}
function jumpToSlide(idx){
  var slides = document.querySelectorAll('.slide');
  if(!slides.length) return;
  slides[_slideIdx].classList.remove('active');
  _slideIdx = idx;
  slides[_slideIdx].classList.add('active');
  updateDots();
}
function updateDots(){
  document.querySelectorAll('.cdot').forEach(function(d,i){
    d.classList.toggle('ca', i === _slideIdx);
  });
}
/* Auto-avanzamento carousel */
setInterval(function(){ changeSlide(1); }, 6000);

/* ════ MAPPA INTERATTIVA ════ */
(function(){
  var tip = document.getElementById('map-tip');
  document.querySelectorAll('.mpin').forEach(function(pin){
    pin.addEventListener('mouseenter', function(){
      if(!tip) return;
      document.getElementById('mt-name').textContent = pin.getAttribute('data-name')||'';
      document.getElementById('mt-desc').textContent = pin.getAttribute('data-desc')||'';
      var explored = pin.getAttribute('data-explored') === 'true';
      var hint = document.getElementById('mt-hint');
      if(hint) hint.textContent = explored ? 'Clicca per aprire' : 'Inesplorato';
      tip.classList.add('visible');
      /* posiziona il tooltip vicino al pin */
      var map = document.getElementById('arcamis-map');
      var pr = pin.getBoundingClientRect();
      var mr = map ? map.getBoundingClientRect() : {left:0,top:0};
      tip.style.left = (pr.left - mr.left + pr.width/2) + 'px';
      tip.style.top  = (pr.top  - mr.top  - 10) + 'px';
    });
    pin.addEventListener('mouseleave', function(){
      if(tip) tip.classList.remove('visible');
    });
    pin.addEventListener('click', function(){
      var id   = pin.getAttribute('data-id');
      var name = pin.getAttribute('data-name');
      var sub  = pin.getAttribute('data-sub');
      if(sub){
        /* apri pannello sub-mappa */
        closeSubMap(null);
        var panel = document.getElementById('sub-'+sub);
        if(panel) panel.classList.add('open');
        return;
      }
      if(id) gp(id, name, pin.querySelector('.mpin-dot') ? '📍' : '📄');
    });
  });
  /* click sui location nella sub-mappa */
  document.querySelectorAll('.mloc').forEach(function(loc){
    loc.addEventListener('click', function(){
      var id   = loc.getAttribute('data-id');
      var name = loc.getAttribute('data-name');
      var icon = loc.getAttribute('data-type') === 'luogo' ? '📍' : '📄';
      if(id) gp(id, name, icon);
    });
  });
})();
function closeSubMap(id){
  document.querySelectorAll('.sub-map-panel').forEach(function(p){
    if(!id || p.id === 'sub-'+id) p.classList.remove('open');
  });
}

/* ════ PTR (Pull to Refresh) ════ */
(function(){
  var startY = 0, pulling = false;
  var ind = document.getElementById('ptr-indicator');
  document.addEventListener('touchstart', function(e){
    if(window.scrollY === 0) startY = e.touches[0].clientY;
  }, {passive:true});
  document.addEventListener('touchmove', function(e){
    if(!startY) return;
    var dy = e.touches[0].clientY - startY;
    if(dy > 60){ pulling = true; if(ind) ind.classList.add('visible'); }
  }, {passive:true});
  document.addEventListener('touchend', function(){
    if(pulling) location.reload();
    pulling = false; startY = 0;
    if(ind) ind.classList.remove('visible');
  });
})();

/* ════ POPSTATE (back/forward browser) ════ */
window.addEventListener('popstate', function(e){
  if(e.state && e.state.id){
    if(e.state.stack) navStack = e.state.stack;
    gp(e.state.id, e.state.label, e.state.icon, true);
  } else {
    showHome();
  }
});

/* ════ DEEP LINK (carica pagina da URL al primo caricamento) ════ */
(function(){
  var params = new URLSearchParams(location.search);
  var pid = params.get('p');
  if(pid){
    var pg = getPage(pid) || {l:'Pagina', i:'📄', id:pid};
    gp(pg.id, pg.l, pg.i, true);
  }
})();

/* ════ WIKI SECTION TOGGLE ════ */
function toggleWiki(){
  var content = document.getElementById('wiki-content');
  var arrow = document.getElementById('wiki-arrow');
  var wrap = document.getElementById('wiki-wrap');
  if(!content) return;
  var open = content.classList.toggle('open');
  if(arrow) arrow.textContent = open ? '▼' : '▶';
  if(wrap) wrap.style.display = 'block';
}

/* ════ CLOSE OVERLAY (cv) ════ */
function cv(){
  var overlay = document.getElementById('overlay');
  if(overlay) overlay.classList.remove('open');
}
document.getElementById('overlay') && document.getElementById('overlay').addEventListener('click', function(e){
  if(e.target === this) cv();
});
