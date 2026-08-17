/* ════════════════════════════════════
   ARCAMIS — app-home.js
   Feature della home: carousel, copertine,
   mappa interattiva, widget Discord.
   (Classic script — variabili globali condivise)
════════════════════════════════════ */

/* ════ CAROUSEL HOME ════ */
var _slideIdx = 0;
var _carTimer = null;
function _escH(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
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
      if(meta.tit){ var titEl = slideEls[i].querySelector('.stit'); if(titEl) titEl.innerHTML = _escH(meta.tit).replace(/&#10;/g,'<br>'); }
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
        if(b.label) btnEls[bi].innerHTML = (btnEls[bi].querySelector('svg') ? btnEls[bi].querySelector('svg').outerHTML + ' ' : '') + _escH(b.label);
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
  var _mpTypes = {
    city:    {c:'rgba(220,175,60,.95)',  g:'rgba(220,175,60,.8)'},
    village: {c:'rgba(200,155,60,.85)',  g:'rgba(200,155,60,.65)'},
    fort:    {c:'rgba(190,130,50,.85)',  g:'rgba(190,130,50,.65)'},
    forest:  {c:'rgba(60,200,80,.85)',   g:'rgba(60,200,80,.65)'},
    water:   {c:'rgba(80,160,240,.85)',  g:'rgba(80,160,240,.65)'},
    ruin:    {c:'rgba(150,80,240,.85)',  g:'rgba(150,80,240,.7)'},
    fog:     {c:'rgba(140,100,240,.85)', g:'rgba(140,100,240,.7)'}
  };

  function _renderPinHTML(pin) {
    var t = _mpTypes[pin.type] || _mpTypes.village;
    var cls = 'mpin t-' + (pin.type || 'village');
    var exp = pin.explored ? 'true' : 'false';
    var attrs = 'class="'+cls+'" data-explored="'+exp+'" style="left:'+pin.left+';top:'+pin.top+';--pc:'+t.c+';--pg:'+t.g+'"'
      +' data-id="'+(pin.pageId||'')+'" data-name="'+(pin.name||'').replace(/"/g,'&quot;')+'"'
      +' data-desc="'+(pin.desc||'').replace(/"/g,'&quot;')+'" data-sub="'+(pin.sub||'')+'"';
    return '<div '+attrs+'><div class="mpin-ring"></div><div class="mpin-dot"></div></div>';
  }

  function _bindPinEvents() {
    var tip = document.getElementById('map-tip');
    document.querySelectorAll('#dynamic-pins .mpin').forEach(function(pin){
      pin.addEventListener('mouseenter', function(){
        if(!tip) return;
        document.getElementById('mt-name').textContent = pin.getAttribute('data-name')||'';
        document.getElementById('mt-desc').textContent = pin.getAttribute('data-desc')||'';
        var explored = pin.getAttribute('data-explored') === 'true';
        var hint = document.getElementById('mt-hint');
        if(hint) hint.textContent = explored ? 'Clicca per aprire' : 'Inesplorato';
        tip.classList.add('vis');
        var map = document.getElementById('arcamis-map');
        var pr = pin.getBoundingClientRect();
        var mr = map ? map.getBoundingClientRect() : {left:0,top:0};
        tip.style.left = (pr.left - mr.left + pr.width/2) + 'px';
        tip.style.top  = (pr.top  - mr.top  - 10) + 'px';
      });
      pin.addEventListener('mouseleave', function(){ if(tip) tip.classList.remove('vis'); });
      pin.addEventListener('click', function(){
        var id   = pin.getAttribute('data-id');
        var name = pin.getAttribute('data-name');
        var sub  = pin.getAttribute('data-sub');
        if(sub){ closeSubMap(null); var panel = document.getElementById('sub-'+sub); if(panel) panel.classList.add('open'); return; }
        if(id) gp(id, name, '📍');
      });
    });
  }

  /* Carica puntine + mappa da API */
  var container = document.getElementById('dynamic-pins');
  var mapImg = document.querySelector('#arcamis-map img');
  if(container){
    fetch('/api/mappins')
      .then(function(r){ return r.json(); })
      .then(function(d){
        var pins = d.pins || [];
        if(pins.length){
          container.innerHTML = pins.map(_renderPinHTML).join('');
          _bindPinEvents();
        }
        if(d.mapImage && mapImg){
          mapImg.src = d.mapImage;
        }
      })
      .catch(function(){});
  }

  /* Sub-map locations */
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
            +'<img class="roster-avatar" src="'+_escH(m.avatar_url)+'" alt="'+_escH(m.username)+'" onerror="this.style.display=\'none\'">'
            +'<div><div class="roster-name">'+_escH(m.username)+'</div>'
            +(m.game ? '<div class="roster-game">'+_escH(m.game.name)+'</div>' : '')
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
