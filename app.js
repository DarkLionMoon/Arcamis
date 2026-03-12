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
