/* ════════════════════════════════════
   ARCAMIS — app.js (Versione Integrata)
   Logica completa + Notion Loader
════════════════════════════════════ */

/* ── Loader Iniziale ── */
window.addEventListener('load', function() {
  setTimeout(function() {
    var l = document.getElementById('site-loader');
    if (l) l.classList.add('hidden');
  }, 500);
});

/* ════ FONT SIZE ════ */
var _fs = parseFloat(localStorage.getItem('arc_font') || '1');
function applyFont(s) {
  _fs = Math.max(.85, Math.min(1.3, s));
  document.documentElement.style.setProperty('--font-scale', _fs);
  localStorage.setItem('arc_font', _fs);
}
applyFont(_fs);
function fontUp() { applyFont(_fs + .08); }
function fontDown() { applyFont(_fs - .08); }

/* ════ THEME ════ */
var _theme = localStorage.getItem('arc_theme') || 'dark';
function applyTheme(t) {
  _theme = t;
  document.body.classList.toggle('light', t === 'light');
  var btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = t === 'light' ? '🌙' : '☀️';
  localStorage.setItem('arc_theme', t);
}
applyTheme(_theme);
function toggleTheme() { applyTheme(_theme === 'dark' ? 'light' : 'dark'); }

/* ════ CORE NAV: FUNZIONE GP (Go to Page) ════ */
var _busy = false;
async function gp(id, label, icon, fromPop) {
  if (_busy || !id) return;
  _busy = true;

  const hv = document.getElementById('hv');
  const pv = document.getElementById('pv');
  const pcont = document.getElementById('pcont');

  if (window.showToast) showToast('Consultando gli archivi...', icon, 1200);

  try {
    // Caricamento dati da Notion (tramite la tua API su Vercel)
    const response = await fetch(`/api/notion?pageId=${id}`);
    if (!response.ok) throw new Error('Pagina non trovata');
    const data = await response.json();

    // Rendering tramite notion-render.js
    if (window.renderNotionPage) {
      pcont.innerHTML = ''; // Pulisce il precedente
      window.renderNotionPage(data, pcont, label, icon);
    }

    // Transizione fluida
    if (pv.style.display === 'none') {
      xfade(hv, pv);
    } else {
      // Se siamo già in page view, scrolla solo in alto
      document.getElementById('main').scrollTop = 0;
    }

    // Update Storia Browser
    if (!fromPop) {
      const newUrl = window.location.pathname + '?p=' + id;
      history.pushState({ id, label, icon }, label, newUrl);
    }
    
    document.title = label + ' | Arcamis';
    addRecente(id, label, icon);

  } catch (err) {
    console.error("Errore Notion:", err);
    if (window.showToast) showToast('Errore di connessione', '❌');
  } finally {
    _busy = false;
  }
}

/* ════ TRANSITION ════ */
function xfade(hide, show, cb) {
  if (!hide || !show) return;
  hide.classList.add('fo');
  setTimeout(function() {
    hide.style.display = 'none';
    hide.classList.remove('fo');
    show.style.display = 'block';
    show.style.opacity = '0';
    requestAnimationFrame(function() {
      show.style.transition = 'opacity .3s';
      show.style.opacity = '1';
    });
    if (cb) cb();
  }, 200);
}

/* ════ HOME MANAGEMENT ════ */
function showHome(fromPop) {
  closeDd();
  var hv = document.getElementById('hv');
  var pv = document.getElementById('pv');
  
  if (pv && pv.style.display !== 'none') {
    xfade(pv, hv);
  }
  
  document.title = 'Arcamis';
  if (!fromPop) history.pushState(null, '', location.pathname);
  setNav('home');
}

/* ════ DROPDOWNS ════ */
function toggleDd(id, ev) {
  if (ev) ev.stopPropagation();
  var el = document.getElementById(id), wasOpen = el.classList.contains('open');
  closeDd();
  if (!wasOpen) el.classList.add('open');
}
function closeDd() {
  document.querySelectorAll('.tn-drop.open').forEach(function(d) { d.classList.remove('open'); });
}
document.addEventListener('click', function(e) { if (!e.target.closest('.tn-drop')) closeDd(); });

function setNav(v) {
  document.querySelectorAll('.tn').forEach(function(el) { 
    el.classList.toggle('ta', el.dataset.v === v); 
  });
}

/* ════ SCROLL & UI ════ */
var _mainEl = document.getElementById('main');
if (_mainEl) {
  _mainEl.addEventListener('scroll', function() {
    var s = _mainEl.scrollTop;
    var tb = document.getElementById('topbar');
    if (tb) tb.classList.toggle('solid', s > 60);
    var stBtn = document.getElementById('scroll-top-btn');
    if (stBtn) stBtn.classList.toggle('vis', s > 300);
  });
}
function goToTop() {
  var m = document.getElementById('main');
  if (m) m.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ════ DEEP LINKING (Evita il Loop) ════ */
window.addEventListener('popstate', function(e) {
  if (e.state && e.state.id) {
    gp(e.state.id, e.state.label, e.state.icon, true);
  } else {
    showHome(true);
  }
});

document.addEventListener('DOMContentLoaded', function() {
  var p = new URLSearchParams(location.search).get('p');
  if (p) {
    var pg = pages.find(function(x) { return x.id === p; });
    gp(p, pg ? pg.l : 'Pagina', pg ? pg.i : '📄');
  }
});

/* ════ RICERCA ════ */
function hsearch(q) {
  q = (q || '').toLowerCase().trim();
  var res = document.getElementById('sr'); 
  if (!res) return;
  if (!q) { res.classList.remove('open'); return; }
  
  var hits = pages.filter(function(p) { 
    return p.l.toLowerCase().includes(q) || p.k.toLowerCase().includes(q); 
  });

  if (hits.length) {
    res.innerHTML = hits.map(function(p) {
      return `<div class="h-res-item" onclick="gp('${p.id}','${p.l}','${p.i}'); document.getElementById('ts').value=''; closeDd();">
                <span class="qli">${p.i}</span><span>${p.l}</span>
              </div>`;
    }).join('');
    res.classList.add('open');
  }
}
function csearch() { setTimeout(() => { var r = document.getElementById('sr'); if (r) r.classList.remove('open'); }, 200); }

/* ════ RECENTI ════ */
function addRecente(id, label, icon) {
  var rec = JSON.parse(localStorage.getItem('arc_rec') || '[]');
  rec = rec.filter(function(x) { return x.id !== id; });
  rec.unshift({ id, l: label, i: icon });
  localStorage.setItem('arc_rec', JSON.stringify(rec.slice(0, 5)));
}

/* ════ TOAST ════ */
(function() {
  window.showToast = function(msg, icon, dur) {
    var w = document.getElementById('toast-wrap') || document.createElement('div');
    w.id = 'toast-wrap';
    if (!w.parentNode) document.body.appendChild(w);
    var t = document.createElement('div');
    t.className = 'arc-toast';
    t.innerHTML = `<span class="arc-toast-icon">${icon || '✦'}</span><span class="arc-toast-msg">${msg}</span>`;
    w.appendChild(t);
    setTimeout(() => t.classList.add('in'), 10);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, dur || 2800);
  };
})();

/* ════ AUDIO ════ */
function toggleArcAudio() {
  showToast("L'audio ambientale è in arrivo...", "♪");
}
