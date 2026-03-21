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
  document.getElementById('hv').style.display = 'block';
  document.getElementById('pv').style.display = 'none';
  document.body.classList.remove('page-open');
  var cv = document.querySelector('.ph-covbg');
  if(cv) cv.style.opacity = '0';
}

function ovo(){
  var overlay = document.getElementById('overlay');
  if(!overlay) return;
  if(overlay.classList.contains('ovopen')){
    cv();
  } else {
    overlay.classList.remove('ovclose');
    overlay.classList.add('ovopen');
  }
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
    document.getElementById('hv').style.display = 'none';
    document.getElementById('pv').style.display = 'block';
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
/* ════ SEARCH ════ */
var _searchDebounce = null;

function hsearch(val){
  var sr = document.getElementById('sr');
  if(!val || val.length < 2){
    if(sr) sr.innerHTML = '';
    return;
  }
  clearTimeout(_searchDebounce);
  _searchDebounce = setTimeout(function(){
    if(sr) sr.innerHTML = '<div class="sri" style="color:var(--text3);font-style:italic">Ricerca...</div>';
    fetch('/api/search?q=' + encodeURIComponent(val))
      .then(function(r){ return r.json(); })
      .then(function(data){
        if(!sr) return;
        if(data.stale){
          sr.innerHTML = '<div class="sri" style="color:var(--text3);font-style:italic">Indice non ancora costruito</div>';
          return;
        }
        var res = data.results || [];
        if(!res.length){
          sr.innerHTML = '<div class="sri" style="color:var(--text3);font-style:italic;padding:12px 14px">Nessun risultato</div>';
          return;
        }
        sr.innerHTML = res.map(function(p){
          var sub = p.parentTitle ? '<span class="sri-tag">'+p.parentTitle+'</span>' : '';
          return '<div class="sri" onclick="csearch();gp(\''+p.id+'\',\''+p.title+'\',\''+p.icon+'\')">'
            +'<span class="si2">'+p.icon+'</span>'
            +'<span class="sl">'+p.title+'</span>'
            +sub+'</div>';
        }).join('');
        sr.classList.add('open');
      })
      .catch(function(){
        if(sr) sr.innerHTML = '<div class="sri" style="color:var(--text3);font-style:italic;padding:12px 14px">Errore ricerca</div>';
      });
  }, 280);
}

function csearch(){
  var sr = document.getElementById('sr');
  var ts = document.getElementById('ts');
  if(sr){ sr.innerHTML = ''; sr.classList.remove('open'); }
  if(ts) ts.value = '';
  clearTimeout(_searchDebounce);
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

/* ════ XFADE ════ */
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
  var seen = parseInt(localStorage.getItem('arc_cl_seen')||'0');
  if(Date.now() - seen > 48*3600*1000){
    document.querySelectorAll('.changelog-badge').forEach(function(b){ b.style.display='block'; });
  }
})();

/* ════ CAROUSEL HOME ════ */
var _slideIdx = 0;
var _carTimer = null;

function _applySlide(){
  var track = document.getElementById('ctrack');
  if(track) track.style.transform = 'translateX(-' + (_slideIdx * 33.3333) + '%)';
  updateDots();
}

function changeSlide(dir){
  var slides = document.querySelectorAll('.slide');
  if(!slides.length) return;
  slides[_slideIdx].classList.remove('active');
  _slideIdx = (_slideIdx + dir + slides.length) % slides.length;
  slides[_slideIdx].classList.add('active');
  _applySlide();
  _resetCarTimer();
}

function jumpToSlide(idx){
  var slides = document.querySelectorAll('.slide');
  if(!slides.length) return;
  slides[_slideIdx].classList.remove('active');
  _slideIdx = idx;
  slides[_slideIdx].classList.add('active');
  _applySlide();
  _resetCarTimer();
}

function updateDots(){
  document.querySelectorAll('.cdot').forEach(function(d,i){
    d.classList.toggle('ca', i === _slideIdx);
  });
}

function _resetCarTimer(){
  if(_carTimer) clearInterval(_carTimer);
  _carTimer = setInterval(function(){ if(!window._carouselPaused) changeSlide(1); }, 6000);
}

/* Auto-avanzamento — verso destra (slide successiva) */
_carTimer = setInterval(function(){ if(!window._carouselPaused) changeSlide(1); }, 6000);

/* Applicazione dinamica sfondo e bottoni CTA da KV */
var _cachedCovers = null;

function _applyCovers(covers){
  _cachedCovers = covers;

  /* ── Carousel homepage: sfondi ── */
  var slideEls = document.querySelectorAll('.slide');
  ['carousel_0','carousel_1','carousel_2'].forEach(function(key, i){
    if(covers[key] && slideEls[i]){
      slideEls[i].style.backgroundImage = 'url(\'' + covers[key] + '\')';
      slideEls[i].style.backgroundSize = 'cover';
      slideEls[i].style.backgroundPosition = 'center 40%';
    }
  });

  /* ── Carousel homepage: tag e titolo ── */
  ['carousel_0','carousel_1','carousel_2'].forEach(function(key, i){
    if(!covers[key+'_meta'] || !slideEls[i]) return;
    try {
      var meta = JSON.parse(covers[key+'_meta']);
      if(meta.tag){ var tagEl = slideEls[i].querySelector('.stag'); if(tagEl) tagEl.textContent = meta.tag; }
      if(meta.tit){ var titEl = slideEls[i].querySelector('.stit'); if(titEl) titEl.innerHTML = meta.tit.replace(/\n/g,'<br>'); }
    } catch(e){}
  });

  /* ── Carousel homepage: bottoni CTA ── */
  ['carousel_0','carousel_1','carousel_2'].forEach(function(key, i){
    if(!covers[key+'_btns'] || !slideEls[i]) return;
    try {
      var btns = JSON.parse(covers[key+'_btns']);
      var btnRow = slideEls[i].querySelector('[style*="display:flex"][style*="gap"]');
      if(!btnRow) btnRow = slideEls[i].querySelector('.scnt > div:last-of-type');
      if(!btnRow) return;
      var btnEls = btnRow.querySelectorAll('.sbtn');
      btns.forEach(function(b, bi){
        if(!btnEls[bi]) return;
        if(b.label) btnEls[bi].innerHTML = (btnEls[bi].querySelector('svg') ? btnEls[bi].querySelector('svg').outerHTML + ' ' : '') + b.label;
        if(b.href){
          btnEls[bi].setAttribute('href', b.href);
          if(btnEls[bi].tagName !== 'A') btnEls[bi].onclick = function(){ window.open(b.href,'_blank'); };
        }
      });
    } catch(e){}
  });

  /* ── loc-card nelle pagine ── */
  document.querySelectorAll('#pbody .loc-card').forEach(function(card){
    var onclick = card.getAttribute('onclick') || '';
    var m = onclick.match(/gp\(['"]([a-f0-9]{32})['"]/);
    if(!m) return;
    var pageId = m[1];
    if(!covers[pageId]) return;
    card.style.backgroundImage = 'url(\'' + covers[pageId] + '\')';
    card.style.backgroundSize = 'cover';
    card.style.backgroundPosition = 'center';
  });

  /* ── galleria PG (.gs-card) ── */
  document.querySelectorAll('.gs-card').forEach(function(card){
    var pageId = card.id.replace('gsc-','');
    if(!pageId || !covers[pageId]) return;
    var bgEl = card.querySelector('.gs-card-bg');
    if(bgEl) bgEl.style.backgroundImage = 'url(\'' + covers[pageId] + '\')';
  });
}

/* Fetch covers una volta sola, poi riapplica ad ogni render pagina */
(function(){
  fetch('/api/admin?action=get_covers')
    .then(function(r){ return r.json(); })
    .then(function(d){ _applyCovers(d.covers || {}); })
    .catch(function(){});
})();

/* Hook afterPageRender — riapplica covers sulle nuove card dopo ogni navigazione */
(function(){
  var _origAfter = window.afterPageRender;
  window.afterPageRender = function(){
    if(_origAfter) _origAfter();
    if(_cachedCovers){
      setTimeout(function(){ _applyCovers(_cachedCovers); }, 300);
      setTimeout(function(){ _applyCovers(_cachedCovers); }, 1200);
    }
  };
})();

/* MutationObserver su #pbody — riapplica covers quando _loadSingleDb inserisce card lazy */
(function(){
  var _debounce = null;
  var pbody = document.getElementById('pbody');
  if(!pbody) return;
  var obs = new MutationObserver(function(){
    if(!_cachedCovers) return;
    clearTimeout(_debounce);
    _debounce = setTimeout(function(){ _applyCovers(_cachedCovers); }, 400);
  });
  obs.observe(pbody, {childList:true, subtree:true});
})();

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
        closeSubMap(null);
        var panel = document.getElementById('sub-'+sub);
        if(panel) panel.classList.add('open');
        return;
      }
      if(id) gp(id, name, pin.querySelector('.mpin-dot') ? '📍' : '📄');
    });
  });
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

/* ════ POPSTATE ════ */
window.addEventListener('popstate', function(e){
  if(e.state && e.state.id){
    if(e.state.stack) navStack = e.state.stack;
    gp(e.state.id, e.state.label, e.state.icon, true);
  } else {
    showHome();
  }
});

/* ════ DEEP LINK ════ */
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

/* ════ CLOSE OVERLAY ════ */
function cv(){
  var overlay = document.getElementById('overlay');
  if(!overlay) return;
  overlay.classList.remove('ovopen');
  overlay.classList.add('ovclose');
  setTimeout(function(){ overlay.classList.remove('ovclose'); }, 160);
}
document.getElementById('overlay') && document.getElementById('overlay').addEventListener('click', function(e){
  if(e.target === this) cv();
});

/* ════ DISCORD WIDGET ════ */
(function(){
  function loadRoster(){
    fetch('https://discord.com/api/guilds/1348723468157456425/widget.json')
      .then(function(r){ return r.json(); })
      .then(function(data){
        var list = document.getElementById('roster-list');
        var count = document.getElementById('avv-count');
        if(!list) return;
        var BOTS = [
         {u:'Apollo',d:'5552'},{u:'Arcane',d:'7800'},{u:'Carl-bot',d:'1536'},
         {u:'DISBOARD',d:'2760'},{u:'Discohook Utils',d:'4333'},{u:'Jockie Music',d:'8158'},
         {u:'Jockie Music (1)',d:'6951'},{u:'MogiBot',d:'6973'},{u:'ServerStats',d:'0197'},
         {u:'Ticket Tool',d:'4843'},{u:'TTS Bot',d:'3590'},{u:'Tupperbox',d:'4754'},
         {u:'VoiceMaster',d:'9351'}
];
       var members = (data.members || []).filter(function(m){
         return !BOTS.some(function(b){ return b.u === m.username && b.d === m.discriminator; });
});
        if(count) count.textContent = members.length ? '(' + members.length + ' online)' : '';
        if(!members.length){
          list.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text3);font-style:italic;font-size:13px;padding:30px">Nessun avventuriero online</div>';
          return;
        }
        list.innerHTML = members.map(function(m){
          return '<div class="roster-member">'
            +'<img class="roster-avatar" src="'+m.avatar_url+'" alt="'+m.username+'" onerror="this.style.display=\'none\'">'
            +'<div>'
              +'<div class="roster-name">'+m.username+'</div>'
              +(m.game ? '<div class="roster-game">'+m.game.name+'</div>' : '')
            +'</div>'
            +'</div>';
        }).join('');
      })
      .catch(function(){
        var list = document.getElementById('roster-list');
        if(list) list.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text3);font-style:italic;font-size:13px;padding:30px">Impossibile caricare</div>';
      });
  }

  var ovbtn = document.getElementById('ovbtn');
  if(ovbtn) ovbtn.addEventListener('click', loadRoster);
  var bnav = document.querySelector('.bnav-item[data-k="menu"]');
  if(bnav) bnav.addEventListener('click', loadRoster);
})();
