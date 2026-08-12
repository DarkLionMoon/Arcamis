/* ════════════════════════════════════
   ARCAMIS — app.js
════════════════════════════════════ */
/* ════ CACHE VERSION ════ */
(function(){
  var CACHE_VER = (function(){
    var meta = document.querySelector('meta[name="cf-pages-sha"]');
    if(meta && meta.content) return meta.content.slice(0,8);
    return Math.floor(Date.now() / 86400000).toString();
  })();
  var stored = localStorage.getItem('arc_cache_ver');
  if(stored !== CACHE_VER){
    Object.keys(sessionStorage).forEach(function(k){ if(k.indexOf('pg_')===0) sessionStorage.removeItem(k); });
    localStorage.setItem('arc_cache_ver', CACHE_VER);
  }
})();

window.addEventListener('load', function(){
  setTimeout(function(){
    var l = document.getElementById('site-loader');
    if(l) l.classList.add('hidden');
    function _doPrefetch(){
      var prefetch = [
        '2f00274fdc1c8065a11ff45192aa5dcb',
        '2dd222f22ef8413f8cb48f03bbb4f4b0',
        '2f00274fdc1c80e78ad7ce985007b7c6',
        '2f00274fdc1c806f8f17dbc6532d2211',
      ];
      prefetch.forEach(function(id){
        fetch('/api/notion?pageId=' + id, {priority:'low'}).catch(function(){});
      });
    }
    if(window.requestIdleCallback) requestIdleCallback(_doPrefetch, {timeout:5000});
    else setTimeout(_doPrefetch, 3000);
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
function fontUp(){ applyFont(_fs + .08); _renderOptionsPanel(); }
function fontDown(){ applyFont(_fs - .08); _renderOptionsPanel(); }

/* ════ THEME ════ */
function _escHtml(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML;}
var _theme = localStorage.getItem('arc_theme') || 'dark';
var _THEMES = ['dark','light','blood','forest','abyss','alchemy'];
function applyTheme(t){
  _theme = t;
  _THEMES.forEach(function(th){ if(th !== 'dark') document.body.classList.remove('theme-' + th); });
  document.body.classList.remove('light','theme-blood','theme-forest','theme-abyss','theme-alchemy');
  if(t === 'light') document.body.classList.add('light');
  else if(t !== 'dark') document.body.classList.add('theme-'+t);
  localStorage.setItem('arc_theme', t);
  _renderOptionsPanel();
}
applyTheme(_theme);
function toggleTheme(){ _openOptionsPanel(); }

/* ════ SOUND FX ════ */
var _sfxEnabled = localStorage.getItem('arc_sfx') !== 'off';
function toggleSfx(){
  _sfxEnabled = !_sfxEnabled;
  localStorage.setItem('arc_sfx', _sfxEnabled ? 'on' : 'off');
  if(!_sfxEnabled){
    if(typeof toggleArcAudio === 'function' && window._arcAudioPlaying) toggleArcAudio();
    if(typeof _stopWhisper === 'function') _stopWhisper();
  }
  _renderOptionsPanel();
}

/* ── Pannello Opzioni ── */
var _optPanelOpen = false;
function _openOptionsPanel(){
  var p = document.getElementById('arc-options-panel');
  if(!p) return;
  _optPanelOpen = !_optPanelOpen;
  p.classList.toggle('open', _optPanelOpen);
}
function _closeOptionsPanel(){
  _optPanelOpen = false;
  var p = document.getElementById('arc-options-panel');
  if(p) p.classList.remove('open');
}
function _renderOptionsPanel(){
  var p = document.getElementById('arc-options-panel');
  if(!p) return;
  p.querySelectorAll('[data-theme]').forEach(function(el){
    el.classList.toggle('active', el.getAttribute('data-theme') === _theme);
  });
  var fsEl = p.querySelector('#arc-opt-fontpct');
  if(fsEl) fsEl.textContent = Math.round(_fs * 100) + '%';
  _syncEnvBtns();
}
function _syncEnvBtns(){
  var cb = document.getElementById('aop-candle-btn');
  var ab = document.getElementById('aop-audio-btn');
  var sb = document.getElementById('aop-sfx-btn');
  var ov = document.getElementById('candlelight-overlay');
  if(cb) cb.classList.toggle('active', ov ? ov.classList.contains('cl-on') : false);
  if(ab){
    ab.classList.toggle('active', !!window._arcAudioPlaying);
    ab.style.opacity = _sfxEnabled ? '' : '.4';
    ab.title = _sfxEnabled ? 'Audio ambientale' : 'Disattiva SFX prima';
  }
  if(sb) sb.classList.toggle('active', _sfxEnabled);
}
document.addEventListener('click', function(e){
  if(!_optPanelOpen) return;
  var panel = document.getElementById('arc-options-panel');
  var btn = document.getElementById('theme-toggle');
  if(panel && !panel.contains(e.target) && btn && !btn.contains(e.target)){
    _closeOptionsPanel();
  }
});

/* ════ UI NAVIGATION ════ */
function showHome(){
  document.getElementById('hv').style.display = 'block';
  document.getElementById('pv').style.display = 'none';
  document.body.classList.remove('page-open');
  var cv = document.querySelector('.ph-covbg');
  if(cv) cv.style.opacity = '0';
  history.replaceState(null, '', '/');
}
function ovo(){
  var overlay = document.getElementById('overlay');
  if(!overlay) return;
  if(overlay.classList.contains('ovopen')){ cv(); }
  else { overlay.classList.remove('ovclose'); overlay.classList.add('ovopen'); }
}
function showToast(txt, icon, dur){
  var t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = '<span>'+_escHtml(icon)+'</span>'+_escHtml(txt);
  document.body.appendChild(t);
  setTimeout(function(){ t.classList.add('vis'); }, 10);
  setTimeout(function(){ t.classList.remove('vis'); setTimeout(function(){ t.remove(); }, 400); }, dur || 3000);
}

/* ════ HOOKS — event bus ════ */
window._afterPageRenderCbs = [];
window.onAfterPageRender = function(cb){ window._afterPageRenderCbs.push(cb); };
window.afterPageRender = function(){
  window._afterPageRenderCbs.forEach(function(cb){ try{cb();}catch(e){} });
  document.getElementById('hv').style.display = 'none';
  document.getElementById('pv').style.display = 'block';
  document.body.classList.add('page-open');
    var ts = document.getElementById('ts');
    if(ts) ts.value = '';
    csearch();
};

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
  all.forEach(function(d){ if(d.id !== id) d.classList.remove('open'); });
  var dd = document.getElementById(id);
  dd.classList.toggle('open');
  var trigger = dd.querySelector('.tn');
  if(trigger) trigger.setAttribute('aria-expanded', dd.classList.contains('open'));
}
function closeDd(){
  document.querySelectorAll('.tn-drop').forEach(function(d){
    d.classList.remove('open');
    var t=d.querySelector('.tn'); if(t) t.setAttribute('aria-expanded','false');
  });
}
document.addEventListener('click', function(e){
  if(!e.target.closest('.tn-drop')) closeDd();
});
document.addEventListener('keydown', function(e){
  if(e.key==='Enter'||e.key===' '){
    var el=e.target;
    if(el.classList.contains('tn')&&el.closest('.tn-drop')){
      e.preventDefault(); el.click();
    } else if(el.classList.contains('bnav-item')){
      e.preventDefault(); el.click();
    } else if(el.getAttribute('role')==='button'){
      e.preventDefault(); el.click();
    }
  }
  if(e.key==='Escape'){
    closeDd(); closeMobileNav(); _closeOptionsPanel();
  }
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
  if(!val || val.length < 2){ if(sr) sr.innerHTML = ''; return; }
  clearTimeout(_searchDebounce);
  _searchDebounce = setTimeout(function(){
    if(sr) sr.innerHTML = '<div class="sri" style="color:var(--text3);font-style:italic">Ricerca...</div>';
    fetch('/api/search?q=' + encodeURIComponent(val))
      .then(function(r){ return r.json(); })
      .then(function(data){
        if(!sr) return;
        if(data.stale || !data.results){ sr.innerHTML = '<div class="sri" style="color:var(--text3);font-style:italic">Indice non ancora costruito</div>'; return; }
        var res = data.results || [];
        if(!res.length){ sr.innerHTML = '<div class="sri" style="color:var(--text3);font-style:italic;padding:12px 14px">Nessun risultato</div>'; return; }
        sr.innerHTML = res.map(function(p){
  var et=_escHtml(p.title), ei=_escHtml(p.icon), eid=_escHtml(p.id);
  var snippet = p.snippet ? '<div class="sri-snippet">'+p.snippet+'</div>' : '';
  return '<div class="sri" onclick="csearch();gp(\''+eid+'\',\''+et+'\',\''+ei+'\')">'
    +'<span class="si2">'+ei+'</span>'
    +'<div class="sri-body"><span class="sl">'+et+'</span>'+snippet+'</div>'
    +'</div>';
}).join('');
        sr.classList.add('open');
      })
      .catch(function(){ if(sr) sr.innerHTML = '<div class="sri" style="color:var(--text3);font-style:italic;padding:12px 14px">Errore ricerca</div>'; });
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

/* ════ XFADE ════ */
function xfade(from, to){
  from.style.transition = 'opacity .2s ease';
  from.style.opacity = '0';
  setTimeout(function(){
    from.style.display = 'none'; from.style.opacity = ''; from.style.transition = '';
    to.style.display = 'block'; to.style.opacity = '0'; to.style.transition = 'opacity .2s ease';
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
  _applySlide(); _resetCarTimer();
}
function jumpToSlide(idx){
  var slides = document.querySelectorAll('.slide');
  if(!slides.length) return;
  slides[_slideIdx].classList.remove('active');
  _slideIdx = idx; slides[_slideIdx].classList.add('active');
  _applySlide(); _resetCarTimer();
}
function updateDots(){
  document.querySelectorAll('.cdot').forEach(function(d,i){ d.classList.toggle('ca', i === _slideIdx); });
}
function _resetCarTimer(){
  if(_carTimer) clearInterval(_carTimer);
  _carTimer = setInterval(function(){ if(!window._carouselPaused) changeSlide(1); }, 6000);
}
window.addEventListener('load', function(){
  setTimeout(function(){ if(window.applyRecentBadges) applyRecentBadges(); }, 1500);
});
_carTimer = setInterval(function(){ if(!window._carouselPaused) changeSlide(1); }, 6000);

/* ════ COVERS ════ */
var _cachedCovers = null;
function _applyCovers(covers){
  _cachedCovers = covers;
  var slideEls = document.querySelectorAll('.slide');
  ['carousel_0','carousel_1','carousel_2'].forEach(function(key, i){
    if(covers[key] && slideEls[i]){
      slideEls[i].style.backgroundImage = 'url(\'' + covers[key] + '\')';
      slideEls[i].style.backgroundSize = 'cover';
      slideEls[i].style.backgroundPosition = 'center 40%';
    }
  });
  ['carousel_0','carousel_1','carousel_2'].forEach(function(key, i){
    if(!covers[key+'_meta'] || !slideEls[i]) return;
    try {
      var meta = JSON.parse(covers[key+'_meta']);
      if(meta.tag){ var tagEl = slideEls[i].querySelector('.stag'); if(tagEl) tagEl.textContent = meta.tag; }
      if(meta.tit){ var titEl = slideEls[i].querySelector('.stit'); if(titEl) titEl.innerHTML = meta.tit.replace(/\n/g,'<br>'); }
    } catch(e){}
  });
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
  document.querySelectorAll('.gs-card').forEach(function(card){
    var pageId = card.id.replace('gsc-','');
    if(!pageId || !covers[pageId]) return;
    var bgEl = card.querySelector('.gs-card-bg');
    if(bgEl){
      bgEl.style.backgroundImage = 'url(\'' + covers[pageId] + '\')';
      if(covers[pageId + '_pos']) bgEl.style.backgroundPosition = covers[pageId + '_pos'];
    }
  });
}
(function(){
  fetch('/api/admin?action=get_covers')
    .then(function(r){ return r.json(); })
    .then(function(d){ _applyCovers(d.covers || {}); })
    .catch(function(){});
})();
window.onAfterPageRender(function(){
  if(_cachedCovers){
    setTimeout(function(){ _applyCovers(_cachedCovers); }, 300);
    setTimeout(function(){ _applyCovers(_cachedCovers); }, 1200);
  }
  setTimeout(function(){ if(window.applyRecentBadges) applyRecentBadges(); }, 600);
});
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
    pin.addEventListener('mouseleave', function(){ if(tip) tip.classList.remove('visible'); });
    pin.addEventListener('click', function(){
      var id   = pin.getAttribute('data-id');
      var name = pin.getAttribute('data-name');
      var sub  = pin.getAttribute('data-sub');
      if(sub){ closeSubMap(null); var panel = document.getElementById('sub-'+sub); if(panel) panel.classList.add('open'); return; }
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
  var startY = 0, pulling = false, atTop = false, atTopTimer = null;
  var ind = document.getElementById('ptr-indicator');
  var mainEl = document.getElementById('main') || window;
  function onScroll(){
    var sy = mainEl.scrollTop !== undefined ? mainEl.scrollTop : window.scrollY;
    if(sy === 0){ if(!atTopTimer) atTopTimer = setTimeout(function(){ atTop = true; }, 300); }
    else { atTop = false; clearTimeout(atTopTimer); atTopTimer = null; }
  }
  mainEl.addEventListener('scroll', onScroll, {passive:true});
  document.addEventListener('touchstart', function(e){ if(atTop) startY = e.touches[0].clientY; else startY = 0; }, {passive:true});
  document.addEventListener('touchmove', function(e){ if(!startY) return; var dy = e.touches[0].clientY - startY; if(dy > 110){ pulling = true; if(ind) ind.classList.add('vis'); } }, {passive:true});
  document.addEventListener('touchend', function(){ if(pulling){ location.reload(); } pulling = false; startY = 0; if(ind) ind.classList.remove('vis'); });
})();

/* ════ POPSTATE ════ */
window.addEventListener('popstate', function(e){
   if (state && state.id === 'reputazioni') {
  if (typeof showReputationTable === 'function') showReputationTable();
  return;
}
  if(e && e.state && e.state.id){
    if(e.state.stack) navStack = JSON.parse(JSON.stringify(e.state.stack));
    if(e.state.id.startsWith('mestiere-')){
      if(typeof showMestiere === 'function') showMestiere(e.state.id.replace('mestiere-', ''));
      return;
    }
    if(e.state.id === 'codice-giuridico'){
      if(typeof showCodiceGiuridico === 'function') showCodiceGiuridico();
      return;
    }
      if(e.state.id === 'patenti-arcadia'){
  if(typeof showPatenti === 'function') showPatenti();
  return;
}
    if(e.state.id === 'mestieri-compendio'){
      if(typeof showMestieriCompendio === 'function') showMestieriCompendio();
      return;
    }
    if(e.state.id === 'societa-licenze'){
      if(typeof showSocietaLicenze === 'function') showSocietaLicenze();
      return;
    }
    if(e.state.id === 'reputazioni'){
      if(typeof showReputationTable === 'function') showReputationTable();
      return;
    }
    gp(e.state.id, e.state.label || '', e.state.icon || '', true);
  } else {
    if(typeof showHome === 'function') showHome();
  }
});

/* ════ PATHNAME → PAGE ID MAP ════
   Mappa tutti i pathname puliti al loro UUID Notion (o id speciale).
   Usata dal deep link per risolvere il path al caricamento della pagina.
════════════════════════════════ */
var _pathMap = {
  /* Regole */
  'regole/gameplay/combattimento':            '2f60274fdc1c80b7a729ef091b278682',
  'regole/gameplay/codex':                    '2f60274fdc1c80adb7a5d6beeef3e544',
  /* Personaggio */
  'personaggio/come-si-inizia':               '2dd222f22ef8413f8cb48f03bbb4f4b0',
  'personaggio/andando-avanti':               '5cea525d149f4acb9c59007bf6b3d5ff',
  'maestria-titoli':                          '2f00274fdc1c802a9babd4239d97a319',
  /* Homebrew */
  'homebrew':                                 '2f00274fdc1c80e78ad7ce985007b7c6',
  'homebrew/specie-hb':                       '2f00274fdc1c81a1bc4ddbf500704b80',
  'homebrew/classi-hb':                       '2f70274fdc1c803ca5cafa97ca1817cd',
  'homebrew/mscge':                           '2ff0274fdc1c8054a400c64b1fdd2ab9',
  /* Lavori */
  'lavori/gilda-avventurieri':                '2f00274fdc1c801b8c13cefd9e15694e',
  'lavori/locanda':                           '2f00274fdc1c80faa99eda064ef0fabc',
  'lavori/forgia':                            '2f00274fdc1c805ca01ec57f18d2ffee',
  'lavori/biblioteca':                        '2f00274fdc1c8089bfe6c24434d53b67',
  'lavori/bottega-farmaceutica':              '2f00274fdc1c801c9697e75caa8d5f13',
  'lavori/caserma':                           '2ff0274fdc1c80688dd6c2b293a1f626',
  'lavori/corporazione-costruttori':          '2ff0274fdc1c80769a4ae243f22f0582',
  'lavori/ospedale':                          '2f00274fdc1c807aa03cc6cbeb3687cc',
  'lavori/sartoria':                          '2ff0274fdc1c8035bad4f0b6ab705192',
  /* Mestieri — id speciale gestito da showMestiere() */
  'mestieri/guida':                           'mestiere-come-funzionano',
  'mestieri/alchimista':                      'mestiere-alchimista',
  'mestieri/architetto':                      'mestiere-architetto',
  'mestieri/artigiano':                       'mestiere-artigiano',
  'mestieri/artista':                         'mestiere-artista',
  'mestieri/falegname':                       'mestiere-falegname',
  'mestieri/metallurgo':                      'mestiere-metallurgo',
  'mestieri/oste':                            'mestiere-oste',
  'mestieri/sarto':                           'mestiere-sarto',
  'mestieri/compendio':                       'mestieri-compendio',
  'societa-licenze':                          'societa-licenze',
  /* Lore */
  'lore/storia':                              '2f00274fdc1c806f8f17dbc6532d2211',
  'lore/pantheon':                            '2f00274fdc1c80679bd3c3df8a1fa040',
  'lore/mondo/introduzione':                  '2f60274fdc1c80558d8fe99842377aef',
  'lore/mondo/introduzione/storia':           '2fc0274fdc1c80c4bbc1c8806f591e0f',
  'lore/mondo/esplora-dal-vivo':              '3090274fdc1c80008f0dffe3a677cb66',
  'lore/mondo/esplora-dal-vivo/marche-di-arcamis': '30d0274fdc1c805cbbc2daf73b5f3a66',
  'lore/mondo/extra':                         '3410274fdc1c805d891bcbda6364e0ad',
  'lore/mondo/bibliografia':                  '3040274fdc1c80ed816ef58f6a606f21',
  'lore/mondo/linguaggi':                     '2fb0274fdc1c8073addaf1d5a3e9768b',
  'lore/mondo/pde':                           '2fb0274fdc1c8080b07bd553e953c88d',
  'lore/mondo/npc':                           '2f90274fdc1c8015bf95f52c4e7681b8',
  /* Mappe */
  'mappe':                                    '2f10274fdc1c80489f23c49164747770',
  'mappe/arcamis':                            '2f10274fdc1c80dca8caeb2e6de23146',
  /* Speciali */
  'codice-giuridico':                         'codice-giuridico',
  'patenti-arcadia':                          'patenti-arcadia',
  'reputazioni':                              'reputazioni',
  'changelog':                                '3000274fdc1c8033a214c44a1aa7f01f',
  'sottoclassi':                              '2f70274fdc1c80e3bdc7f95f81eb9cc0',
  'specie-homebrew':                          '2f60274fdc1c80fba671c588ba93b116',
  "lore/la-storia-di-gandora": "pag-la-storia-di-gandora"
};

/* ════ DEEP LINK ════ */
(function(){
  /* 1. Prova il pathname pulito */
  var path = location.pathname.replace(/^\//, '').replace(/\/$/, '');
  /* 2. Fallback retrocompatibile: ?p= */
  var params = new URLSearchParams(location.search);
  var qp = params.get('p');

  /* Se siamo sulla root o index.html, niente da fare */
  if(!path && !qp) return;
  if(path === 'index.html') path = '';

  var pid = null;

  if(path && path.startsWith('p/')){
    /* Path automatico UUID: /p/2f00274f... */
    pid = path.replace('p/', '');
  } else if(path){
    /* Risolvi il pathname nella mappa */
    var resolved = _pathMap[path];
    if(resolved){
      pid = resolved;
    } else if(typeof _slugMap !== 'undefined' && _slugMap[path]){
      /* Supporto slug piatti legacy (es. /gameplay) */
      pid = _slugMap[path];
    } else {
      /* Pathname non mappato — trattalo come UUID diretto (es. /2f00274f...) */
      pid = path;
    }
  } else if(qp) {
    /* Vecchio ?p= — supporto retrocompatibile */
    pid = (typeof _slugMap !== 'undefined' && _slugMap[qp]) ? _slugMap[qp] : qp;
  }

  if(!pid) return;

  /* Mestieri */
  if(pid.startsWith('mestiere-')){
    var key = pid.replace('mestiere-', '');
    setTimeout(function(){ if(typeof showMestiere === 'function') showMestiere(key); }, 0);
    return;
  }
  /* Pagine speciali JS */
  if(pid === 'codice-giuridico'){
    setTimeout(function(){ if(typeof showCodiceGiuridico === 'function') showCodiceGiuridico(); }, 0);
    return;
  }
   if(pid === 'patenti-arcadia'){
  setTimeout(function(){ if(typeof showPatenti === 'function') showPatenti(); }, 0);
  return;
}
  if(pid === 'mestieri-compendio'){
    setTimeout(function(){ if(typeof showMestieriCompendio === 'function') showMestieriCompendio(); }, 0);
    return;
  }
  if(pid === 'societa-licenze'){
    setTimeout(function(){ if(typeof showSocietaLicenze === 'function') showSocietaLicenze(); }, 0);
    return;
  }
  if(pid === 'reputazioni'){
    setTimeout(function(){ if(typeof showReputationTable === 'function') showReputationTable(); }, 0);
    return;
  }
  /* Pagina Notion generica */
  var pg = getPage(pid) || {l:'Pagina', i:'📄', id:pid};
  gp(pg.id, pg.l, pg.i, true);
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
            +'<div><div class="roster-name">'+m.username+'</div>'
            +(m.game ? '<div class="roster-game">'+m.game.name+'</div>' : '')
            +'</div></div>';
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

/* ════ OFFLINE FALLBACK ════ */
window.addEventListener('offline', function(){ showToast('Sei offline — ricarica quando torni connesso', '📡', 8000); });
window.addEventListener('online',  function(){ showToast('Connessione ripristinata', '✅', 2500); });

/* ════ LAZY LOAD BACKGROUND-IMAGE ════ */
(function(){
  function _lazyBg(root){
    root = root || document;
    root.querySelectorAll('.loc-card[style*="background-image"], .gs-card .gs-card-bg[style*="background-image"]').forEach(function(el){
      if(el.dataset.lazyBgDone) return;
      el.dataset.lazyBgDone = '1';
      var io = new IntersectionObserver(function(entries, obs){
        entries.forEach(function(en){
          if(!en.isIntersecting) return;
          obs.unobserve(en.target);
          var bg = en.target.style.backgroundImage;
          en.target.style.backgroundImage = 'none';
          requestAnimationFrame(function(){ en.target.style.backgroundImage = bg; });
        });
      }, { rootMargin: '200px' });
      io.observe(el);
    });
  }
  window.onAfterPageRender(function(){
    setTimeout(function(){ _lazyBg(document.getElementById('pbody')); }, 500);
  });
})();

/* ════ HELP WIDGET ════ */
var _helpOpen = false;
function toggleHelpPanel(){
  _helpOpen = !_helpOpen;
  var panel = document.getElementById('arc-help-panel');
  var btn   = document.getElementById('arc-help-btn');
  if(panel) panel.classList.toggle('open', _helpOpen);
  if(btn)   btn.classList.toggle('open', _helpOpen);
}
function switchHelpTab(tab, el){
  document.querySelectorAll('.ahp-tab').forEach(function(t){ t.classList.remove('active'); });
  document.querySelectorAll('.ahp-body').forEach(function(b){ b.style.display = 'none'; });
  el.classList.add('active');
  var target = document.getElementById('ahp-' + tab);
  if(target) target.style.display = 'flex';
}
function toggleFaq(el){
  var item = el.parentElement;
  var wasOpen = item.classList.contains('open');
  document.querySelectorAll('.ahp-faq-item').forEach(function(i){ i.classList.remove('open'); });
  if(!wasOpen) item.classList.add('open');
}
document.getElementById('ahp-dm-msg') && document.getElementById('ahp-dm-msg').addEventListener('input', function(){
  var counter = document.getElementById('ahp-dm-count');
  if(counter) counter.textContent = this.value.length;
});
function sendHelpMsg(){
  var name = (document.getElementById('ahp-dm-name').value || '').trim();
  var msg  = (document.getElementById('ahp-dm-msg').value  || '').trim();
  var status = document.getElementById('ahp-dm-status');
  if(!msg){ status.textContent = 'Scrivi un messaggio prima di inviare.'; status.className='ahp-dm-status err'; return; }
  status.textContent = 'Invio in corso...'; status.className='ahp-dm-status';
  fetch('/api/send-help', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ name: name, message: msg })
  })
  .then(function(r){
    if(r.ok){
      status.textContent = '✦ Messaggio inviato al DM!'; status.className='ahp-dm-status ok';
      document.getElementById('ahp-dm-name').value = '';
      document.getElementById('ahp-dm-msg').value  = '';
      document.getElementById('ahp-dm-count').textContent = '0';
    } else { throw new Error(); }
  })
  .catch(function(){ status.textContent = 'Errore nell\'invio — prova su Discord.'; status.className='ahp-dm-status err'; });
}
setTimeout(function(){
  var btn = document.getElementById('arc-help-btn');
  if(btn && !localStorage.getItem('arc_help_seen')){ btn.classList.add('pulse'); localStorage.setItem('arc_help_seen','1'); }
}, 3000);
document.addEventListener('click', function(e){
  if(!_helpOpen) return;
  var panel = document.getElementById('arc-help-panel');
  var btn   = document.getElementById('arc-help-btn');
  if(panel && !panel.contains(e.target) && btn && !btn.contains(e.target)) toggleHelpPanel();
});

/* ════════ MAINTENANCE BANNER ════════ */
(function(){
  var MAINT_KEY = 'arc_maint_dismissed';
  var banner = document.getElementById('maint-banner');
  if(!banner) return;
  if(!localStorage.getItem(MAINT_KEY)){
    banner.style.display = '';
    document.body.classList.add('maint-shift');
  }
})();
function dismissMaintBanner(){
  var banner = document.getElementById('maint-banner');
  if(banner){
    banner.style.opacity = '0';
    banner.style.transform = 'translateY(-100%)';
    banner.style.transition = 'opacity .25s, transform .25s';
    setTimeout(function(){ banner.style.display = 'none'; }, 260);
  }
  document.body.classList.remove('maint-shift');
  localStorage.setItem('arc_maint_dismissed', '1');
}
