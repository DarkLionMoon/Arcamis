/* ════════════════════════════════════
   ARCAMIS — app-ui.js
   Chrome dell'interfaccia: tema, font, SFX, opzioni,
   navigazione, ricerca, help widget, banner manutenzione.
   (Classic script — variabili globali condivise)
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
  var msr = document.getElementById('m-sr');
  if(msr){ msr.innerHTML = ''; msr.classList.remove('open'); }
  var mts = document.getElementById('m-ts');
  if(mts) mts.value = '';
}

/* ════ SEARCH (client-side su indice statico) ════ */
var _searchDebounce = null;
var _searchIndex = null, _searchIndexLoading = false;
function _loadSearchIndex(cb){
  if(_searchIndex) return cb(_searchIndex);
  if(_searchIndexLoading){ setTimeout(function(){ _loadSearchIndex(cb); }, 200); return; }
  _searchIndexLoading = true;
  fetch('/content/search-index.json')
    .then(function(r){ return r.json(); })
    .then(function(idx){ _searchIndex = idx; _searchIndexLoading = false; cb(idx); })
    .catch(function(){ _searchIndex = []; _searchIndexLoading = false; cb([]); });
}
function _stripMd(s){
  return String(s||'')
    .replace(/!\[[^\]]*\]\([^)]*\)/g,' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g,'$1')
    .replace(/[#>*`~_\-|]{1,3}/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function hsearch(val){
  var sr = document.getElementById('sr');
  if(!val || val.length < 2){ if(sr) sr.innerHTML = ''; return; }
  clearTimeout(_searchDebounce);
  _searchDebounce = setTimeout(function(){
    _loadSearchIndex(function(idx){
      if(!sr) return;
      var q = val.toLowerCase();
      var res = [];
      (idx || []).forEach(function(p){
        var ti = (p.title||'').toLowerCase();
        var tx = p.text || '';
        var score = -1, snippet = '';
        var tpos = ti.indexOf(q);
        if(tpos > -1) score = 100 - tpos;
        else {
          var pos = tx.indexOf(q);
          if(pos > -1){
            score = 10;
            var st = Math.max(0, pos - 45), en = Math.min(tx.length, pos + q.length + 55);
            snippet = (st>0?'…':'') + _escHtml(tx.slice(st,en)) + (en<tx.length?'…':'');
          }
        }
        if(score > -1){
          res.push({p:p, score:score, snippet:snippet});
        }
      });
      res.sort(function(a,b){ return b.score - a.score; });
      res = res.slice(0, 8);
      if(!res.length){ sr.innerHTML = '<div class="sri" style="color:var(--text3);font-style:italic;padding:12px 14px">Nessun risultato</div>'; sr.classList.add('open'); return; }
      sr.innerHTML = res.map(function(r){
        var et=_escHtml(r.p.title), ei=_escHtml(r.p.icon||'📄'), eid=_escHtml(r.p.id);
        var snippet = r.snippet ? '<div class="sri-snippet">'+r.snippet+'</div>' : '';
        return '<div class="sri" onclick="csearch();gp(\''+eid+'\',\''+et+'\',\''+ei+'\')">'
          +'<span class="si2">'+ei+'</span>'
          +'<div class="sri-body"><span class="sl">'+et+'</span>'+snippet+'</div>'
          +'</div>';
      }).join('');
      sr.classList.add('open');
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

/* ════ SEARCH MOBILE (drawer) ════ */
function msearch(val){
  var sr = document.getElementById('m-sr');
  if(!sr) return;
  if(!val || val.length < 2){ sr.innerHTML = ''; sr.classList.remove('open'); return; }
  clearTimeout(_searchDebounce);
  _searchDebounce = setTimeout(function(){
    _loadSearchIndex(function(idx){
      if(!sr) return;
      var q = val.toLowerCase();
      var res = [];
      (idx || []).forEach(function(p){
        var ti = (p.title||'').toLowerCase();
        var tx = p.text || '';
        var score = -1, snippet = '';
        var tpos = ti.indexOf(q);
        if(tpos > -1) score = 100 - tpos;
        else {
          var pos = tx.indexOf(q);
          if(pos > -1){
            score = 10;
            var st = Math.max(0, pos - 45), en = Math.min(tx.length, pos + q.length + 55);
            snippet = (st>0?'…':'') + _escHtml(tx.slice(st,en)) + (en<tx.length?'…':'');
          }
        }
        if(score > -1) res.push({p:p, score:score, snippet:snippet});
      });
      res.sort(function(a,b){ return b.score - a.score; });
      res = res.slice(0, 10);
      if(!res.length){ sr.innerHTML = '<div class="sri" style="color:var(--text3);font-style:italic;padding:12px 14px">Nessun risultato</div>'; sr.classList.add('open'); return; }
      sr.innerHTML = res.map(function(r){
        var et=_escHtml(r.p.title), ei=_escHtml(r.p.icon||'📄'), eid=_escHtml(r.p.id);
        var snippet = r.snippet ? '<div class="sri-snippet">'+r.snippet+'</div>' : '';
        return '<div class="sri" onclick="closeMobileNav();gp(\''+eid+'\',\''+et+'\',\''+ei+'\')">'
          +'<span class="si2">'+ei+'</span>'
          +'<div class="sri-body"><span class="sl">'+et+'</span>'+snippet+'</div>'
          +'</div>';
      }).join('');
      sr.classList.add('open');
    });
  }, 280);
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
try { _recenti = JSON.parse(localStorage.getItem('arc_recenti') || '[]'); } catch(e) { _recenti = []; }
function addRecente(id, title, icon){
  _recenti = _recenti.filter(function(r){ return r.id !== id; });
  _recenti.unshift({id:id, title:title, icon:icon});
  if(_recenti.length > 5) _recenti.pop();
  try { localStorage.setItem('arc_recenti', JSON.stringify(_recenti)); } catch(e) {}
  _renderRecenti();
}
function _renderRecenti(){
  var el = document.getElementById('ov-recenti');
  if(el && _recenti.length){
    el.innerHTML = '<div class="portal-sh">Visitati di recente</div>'
      + _recenti.map(function(r){
        return '<div class="ov-rec-item" onclick="cv();gp(\''+r.id+'\',\''+r.title+'\',\''+r.icon+'\')">'
          +'<span>'+r.icon+'</span> '+r.title+'</div>';
      }).join('');
  }
  var mn = document.getElementById('mn-recenti');
  if(mn){
    if(!_recenti.length){ mn.style.display = 'none'; return; }
    mn.style.display = '';
    mn.innerHTML = '<div class="mn-label">Visitati di recente</div>'
      + _recenti.map(function(r){
        return '<div class="mn-item" onclick="closeMobileNav();gp(\''+r.id+'\',\''+r.title+'\',\''+r.icon+'\')">'
          +'<span class="mn-ii">'+r.icon+'</span>'+r.title+'</div>';
      }).join('');
  }
}
_renderRecenti();

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
/* ════ OFFLINE FALLBACK ════ */
window.addEventListener('offline', function(){ showToast('Sei offline — ricarica quando torni connesso', '📡', 8000); });
window.addEventListener('online',  function(){ showToast('Connessione ripristinata', '✅', 2500); });
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

/* ════════ SITE SETTINGS (banner + disclaimer) ════════ */
(function(){
  var BANNER_KEY = 'arc_maint_dismissed';
  var DISCLAIMER_KEY = 'arc_disclaimer_accepted';
  var banner = document.getElementById('maint-banner');
  var overlay = document.getElementById('disclaimer-overlay');
  var bannerDismissed = localStorage.getItem(BANNER_KEY);
  var disclaimerAccepted = localStorage.getItem(DISCLAIMER_KEY);

  function _showBanner(s){
    if(!banner) return;
    if(!s.banner_enabled){ banner.style.display = 'none'; return; }
    var txt = banner.querySelector('.maint-text');
    if(txt && s.banner_text) txt.textContent = s.banner_text;
    if(!bannerDismissed){
      banner.removeAttribute('style');
      banner.style.display = '';
      if(!s.disclaimer_enabled || disclaimerAccepted){
        document.body.classList.add('maint-shift');
      }
    }
  }
  function _showDisclaimer(s){
    if(!overlay) return;
    if(disclaimerAccepted || !s.disclaimer_enabled){ overlay.style.display = 'none'; return; }
    var txt = document.getElementById('disclaimer-text');
    if(txt && s.disclaimer_text) txt.textContent = s.disclaimer_text;
    overlay.style.display = 'flex';
    var btn = document.getElementById('disclaimer-btn');
    if(btn && !btn._bound){
      btn._bound = true;
      btn.addEventListener('click', function(){
        localStorage.setItem(DISCLAIMER_KEY, '1');
        overlay.style.display = 'none';
      });
      overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.style.display = 'none'; });
    }
  }

  fetch('/api/admin?action=get_site_settings')
    .then(function(r){ return r.json(); })
    .then(function(j){
      var s = j.settings || {};
      _showBanner(s);
      _showDisclaimer(s);
    })
    .catch(function(){
      if(banner) banner.style.display = 'none';
      if(overlay) overlay.style.display = 'none';
    });
})();
function dismissMaintBanner(){
  var banner = document.getElementById('maint-banner');
  if(banner){
    banner.style.opacity = '0';
    banner.style.transform = 'translateY(-100%)';
    banner.style.transition = 'opacity .25s, transform .25s';
    setTimeout(function(){
      banner.style.display = 'none';
      banner.removeAttribute('style');
    }, 260);
  }
  document.body.classList.remove('maint-shift');
  localStorage.setItem('arc_maint_dismissed', '1');
}

/* ════════ DISCLAIMER OVERLAY ════════ */
function acceptDisclaimer(){
  var overlay = document.getElementById('disclaimer-overlay');
  if(overlay){
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity .3s';
    setTimeout(function(){ overlay.style.display = 'none'; }, 310);
  }
  localStorage.setItem('arc_disclaimer_accepted', '1');
  var banner = document.getElementById('maint-banner');
  if(banner && banner.style.display !== 'none'){
    document.body.classList.add('maint-shift');
  }
}

