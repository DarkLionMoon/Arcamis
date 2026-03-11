/* ════════════════════════════════════
   ARCAMIS — app.js (STATIC FULL)
   Logica completa senza dipendenza Notion
════════════════════════════════════ */

/* ── Loader Iniziale ── */
window.addEventListener('load', function() {
    setTimeout(function() {
        var l = document.getElementById('site-loader');
        if (l) l.classList.add('hidden');
    }, 500);
});

/* ── Font & Theme ── */
var _fs = parseFloat(localStorage.getItem('arc_font') || '1');
function applyFont(s) {
    _fs = Math.max(.85, Math.min(1.3, s));
    document.documentElement.style.setProperty('--font-scale', _fs);
    localStorage.setItem('arc_font', _fs);
}
applyFont(_fs);
function fontUp() { applyFont(_fs + .08); }
function fontDown() { applyFont(_fs - .08); }

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

/* ── Navigazione Statica ── */
var _busy = false;
async function gp(id, label, icon) {
    if (_busy) return;
    var pbody = document.getElementById('pbody');
    var hv = document.getElementById('hv');
    var pv = document.getElementById('pv');

    pbody.innerHTML = '<div class="ldwrap"><div class="spin"></div></div>';
    if (hv.style.display !== 'none') xfade(hv, pv);

    try {
        // Caricamento dal file locale JSON
        var r = await fetch('/data/pages/' + id + '.json');
        if (!r.ok) throw new Error("404");
        var data = await r.json();

        // Rendering tramite notion-render.js
        renderNotionPage(data, pbody);

        document.title = label + ' — Arcamis';
        addRecente(id, label, icon);
        
        // Trigger per effetti grafici (fx.js)
        if (window.afterPageRender) window.afterPageRender();
        if (window.attachShine) attachShine(pbody);
        
        document.getElementById('main').scrollTo({ top: 0 });
    } catch (e) {
        pbody.innerHTML = '<div style="padding:40px;text-align:center;color:var(--gold)">La pergamena è mancante. (Verifica public/data/pages/)</div>';
    }
}

/* ── Funzioni Originali Arcamis ── */
function xfade(outEl, inEl) {
    outEl.style.opacity = '0';
    setTimeout(function() {
        outEl.style.display = 'none';
        inEl.style.display = 'block';
        setTimeout(function() { inEl.style.opacity = '1'; }, 50);
    }, 300);
}

function showHome() {
    var hv = document.getElementById('hv');
    var pv = document.getElementById('pv');
    if (hv.style.display === 'none') xfade(pv, hv);
    document.title = 'Arcamis';
}

function addRecente(id, label, icon) {
    var rec = JSON.parse(localStorage.getItem('arc_rec') || '[]');
    rec = rec.filter(x => x.id !== id);
    rec.unshift({ id: id, l: label, i: icon });
    localStorage.setItem('arc_rec', JSON.stringify(rec.slice(0, 5)));
    // Se hai una funzione per buildare la UI dei recenti, chiamala qui
}

function hsearch(q) {
    q = q.toLowerCase().trim();
    var res = document.getElementById('h-results');
    if (!q) { res.innerHTML = ''; return; }
    // Cerca nell'array 'pages' definito in data.js
    var hits = pages.filter(p => p.l.toLowerCase().includes(q) || p.k.toLowerCase().includes(q));
    res.innerHTML = hits.map(p => `
    <div class="h-res-item" onclick="gp('${p.id}','${p.l}','${p.i}');document.getElementById('hsearch').value=''">
      <span>${p.i}</span> ${p.l}
    </div>`).join('');
}

function toggleMobileNav() {
    document.getElementById('sidebar').classList.toggle('open');
}

/* ── Prefetch ── */
function prefetchPage(id) {
    fetch('/data/pages/' + id + '.json').then(r => r.json()).then(d => {
        if (window._memCache) window._memCache['pg_' + id] = d;
    }).catch(() => {});
}
