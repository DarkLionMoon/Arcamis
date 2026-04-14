/* ════════════════════════════════════
   ARCAMIS — easter-egg-torch.js
   Cursore torcia stile Dark Souls
   Attivo solo su pagine Notion/articoli
════════════════════════════════════ */

(function(){

  /* ── Costanti ── */
  var FLAME_COLORS = ['#ff8c00','#ff6600','#ff4500','#ffd700','#ff9933'];
  var EMBER_COLORS = ['#ff4500','#ff6600','#ffd700','#ff8c00'];

  /* ── Stato ── */
  var _active   = false;
  var _mx = 0, _my = 0;
  var _particles = [];
  var _rafId    = null;
  var _torchEl  = null;
  var _canvasEl = null;
  var _ctx      = null;
  var _styleEl  = null;

  /* ── Rileva se siamo su una pagina Notion ── */
  function _isNotionPage(){
    var main = document.getElementById('main');
    if(!main) return false;
    return (
      main.querySelector('.n-page-wrap') !== null ||
      main.querySelector('.notion-page') !== null ||
      main.querySelector('[class^="n-"]') !== null ||
      document.querySelector('.arc-notion-content') !== null
    );
  }

  /* ── Inietta CSS ── */
  function _injectCSS(){
    if(_styleEl) return;
    _styleEl = document.createElement('style');
    _styleEl.textContent = `
body.arc-torch-active {
  cursor: none !important;
}
body.arc-torch-active * {
  cursor: none !important;
}
#arc-torch-wrap {
  position: fixed;
  pointer-events: none;
  z-index: 9998;
  left: 0; top: 0;
  width: 0; height: 0;
  overflow: visible;
}
#arc-torch-svg {
  position: absolute;
  transform: translate(-14px, -56px);
  filter: drop-shadow(0 0 6px rgba(255,120,20,.55));
  transition: filter .15s;
}
#arc-torch-canvas {
  position: fixed;
  left: 0; top: 0;
  pointer-events: none;
  z-index: 9997;
  width: 100vw;
  height: 100vh;
}
#arc-torch-hint {
  position: fixed;
  bottom: 130px;
  left: 50%;
  transform: translateX(-50%) translateY(0);
  z-index: 9999;
  font-family: 'Cinzel', serif;
  font-size: 10px;
  letter-spacing: .22em;
  text-transform: uppercase;
  color: rgba(200,155,60,.0);
  background: rgba(0,0,0,.7);
  padding: 8px 18px;
  border: 1px solid rgba(200,155,60,.2);
  pointer-events: none;
  transition: color 1.2s ease, opacity 1.2s ease;
  white-space: nowrap;
}
#arc-torch-hint.show {
  color: rgba(200,155,60,.75);
}
    `;
    document.head.appendChild(_styleEl);
  }

  /* ── SVG torcia ── */
  var _torchSVG = `<svg id="arc-torch-svg" xmlns="http://www.w3.org/2000/svg"
    width="28" height="64" viewBox="0 0 28 64">
  <defs>
    <radialGradient id="arc-t-hd" cx="50%" cy="60%" r="50%">
      <stop offset="0%"   stop-color="#ffd700" stop-opacity=".9"/>
      <stop offset="60%"  stop-color="#ff6600" stop-opacity=".7"/>
      <stop offset="100%" stop-color="#ff2200" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- Manico -->
  <rect x="11" y="30" width="6" height="30" rx="2"
    fill="#3a2510" stroke="rgba(200,155,60,.4)" stroke-width=".8"/>
  <!-- Fascia metallo -->
  <rect x="10" y="27" width="8" height="6" rx="1.5"
    fill="#5a4020" stroke="rgba(200,155,60,.5)" stroke-width=".8"/>
  <!-- Corpo torcia -->
  <rect x="9" y="16" width="10" height="14" rx="2"
    fill="#4a2e10" stroke="rgba(200,155,60,.35)" stroke-width=".8"/>
  <!-- Cima torcia -->
  <ellipse cx="14" cy="16" rx="6" ry="3"
    fill="#5a3a18" stroke="rgba(200,155,60,.4)" stroke-width=".8"/>
  <!-- Alone fiamma base -->
  <ellipse cx="14" cy="13" rx="9" ry="8" fill="url(#arc-t-hd)" opacity=".6"/>
</svg>`;

  /* ── Crea elementi DOM ── */
  function _createElements(){
    if(_torchEl) return;

    _canvasEl = document.createElement('canvas');
    _canvasEl.id = 'arc-torch-canvas';
    _canvasEl.width  = window.innerWidth;
    _canvasEl.height = window.innerHeight;
    document.body.appendChild(_canvasEl);
    _ctx = _canvasEl.getContext('2d');

    _torchEl = document.createElement('div');
    _torchEl.id = 'arc-torch-wrap';
    _torchEl.innerHTML = _torchSVG;
    document.body.appendChild(_torchEl);

    window.addEventListener('resize', function(){
      if(_canvasEl){
        _canvasEl.width  = window.innerWidth;
        _canvasEl.height = window.innerHeight;
      }
    });
  }

  /* ── Particella ── */
  function _spawnParticle(){
    var spread = 5;
    _particles.push({
      x:   _mx + (Math.random() - .5) * spread,
      y:   _my - 52,
      vx:  (Math.random() - .5) * 1.1,
      vy:  -(1.8 + Math.random() * 2.4),
      life: 1,
      decay: .018 + Math.random() * .022,
      r:   2 + Math.random() * 3.5,
      color: FLAME_COLORS[Math.floor(Math.random() * FLAME_COLORS.length)],
      type: Math.random() > .75 ? 'ember' : 'flame'
    });
  }

  /* ── Loop particelle ── */
  function _tick(){
    if(!_active){ _rafId = null; return; }

    _ctx.clearRect(0, 0, _canvasEl.width, _canvasEl.height);

    /* Spawn */
    var n = 3 + Math.floor(Math.random() * 2);
    for(var i = 0; i < n; i++) _spawnParticle();

    /* Aggiorna e disegna */
    for(var j = _particles.length - 1; j >= 0; j--){
      var p = _particles[j];
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy *= .97;
      p.vx += (Math.random() - .5) * .12;
      p.life -= p.decay;
      if(p.life <= 0){ _particles.splice(j, 1); continue; }

      _ctx.save();
      _ctx.globalAlpha = p.life * (p.type === 'ember' ? .9 : .75);

      if(p.type === 'flame'){
        var grad = _ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 1.8);
        grad.addColorStop(0,   p.color);
        grad.addColorStop(.6,  p.color.replace(')', ',0.5)').replace('rgb','rgba'));
        grad.addColorStop(1,   'transparent');
        _ctx.fillStyle = grad;
        _ctx.beginPath();
        _ctx.ellipse(p.x, p.y, p.r * .7, p.r * 1.4, 0, 0, Math.PI * 2);
        _ctx.fill();
      } else {
        /* Brace */
        _ctx.fillStyle = EMBER_COLORS[Math.floor(Math.random() * EMBER_COLORS.length)];
        _ctx.beginPath();
        _ctx.arc(p.x, p.y, p.r * .35, 0, Math.PI * 2);
        _ctx.fill();
      }
      _ctx.restore();
    }

    /* Alone di luce sul cursore */
    var glow = _ctx.createRadialGradient(_mx, _my - 40, 0, _mx, _my - 40, 110);
    glow.addColorStop(0,    'rgba(255,120,30,.045)');
    glow.addColorStop(.5,   'rgba(255,90,10,.018)');
    glow.addColorStop(1,    'transparent');
    _ctx.globalAlpha = 1;
    _ctx.fillStyle = glow;
    _ctx.fillRect(0, 0, _canvasEl.width, _canvasEl.height);

    _rafId = requestAnimationFrame(_tick);
  }

  /* ── Attiva cursore ── */
  function _activate(){
    if(_active) return;
    _injectCSS();
    _createElements();
    _active = true;
    document.body.classList.add('arc-torch-active');
    _particles = [];
    if(!_rafId) _rafId = requestAnimationFrame(_tick);
    _showHint('Portatore di Fiamma');
  }

  /* ── Disattiva cursore ── */
  function _deactivate(){
    if(!_active) return;
    _active = false;
    document.body.classList.remove('arc-torch-active');
    if(_rafId){ cancelAnimationFrame(_rafId); _rafId = null; }
    if(_ctx) _ctx.clearRect(0, 0, _canvasEl.width, _canvasEl.height);
    _particles = [];
  }

  /* ── Aggiorna posizione torcia ── */
  function _onMouseMove(e){
    _mx = e.clientX;
    _my = e.clientY;
    if(_torchEl){
      _torchEl.style.left = _mx + 'px';
      _torchEl.style.top  = _my + 'px';
    }
  }

  /* ── Hint testuale stile Dark Souls ── */
  var _hintEl = null;
  var _hintTimer = null;

  function _showHint(text){
    if(!_hintEl){
      _hintEl = document.createElement('div');
      _hintEl.id = 'arc-torch-hint';
      document.body.appendChild(_hintEl);
    }
    _hintEl.textContent = text;
    clearTimeout(_hintTimer);
    requestAnimationFrame(function(){
      _hintEl.classList.add('show');
    });
    _hintTimer = setTimeout(function(){
      _hintEl.classList.remove('show');
    }, 3200);
  }

  /* ── Osserva navigazione SPA ── */
  function _checkPage(){
    var shouldBeActive = _isNotionPage();
    if(shouldBeActive && !_active) _activate();
    else if(!shouldBeActive && _active) _deactivate();
  }

  /* ── MutationObserver su #main per SPA ── */
  function _observeMain(){
    var main = document.getElementById('main');
    if(!main) return;
    var observer = new MutationObserver(function(){
      _checkPage();
    });
    observer.observe(main, { childList: true, subtree: false });
  }

  /* ── Init ── */
  function _init(){
    document.addEventListener('mousemove', _onMouseMove);

    /* Dark Souls – click destro: messaggio alla maniera dei messaggi sul pavimento */
    document.addEventListener('contextmenu', function(e){
      if(!_active) return;
      e.preventDefault();
      var msgs = [
        'Prova illusione avanti',
        'Pericolo vicino',
        'Via del guerriero',
        'Luce richiesta',
        'Maledizione in questa area',
        'Nemico grosso oltre',
        'Tesoro nascosto dietro',
        'Fantasma? Fantasma!',
        'Sei invocato',
        'Sei intrappolato',
        'Splendido',
        'Vittoria imminente',
        'Ma perché...',
        '……',
        'Fuoco lontano',
        'Il falò chiama',
      ];
      _showHint(msgs[Math.floor(Math.random() * msgs.length)]);
    });

    /* Popup alla prima visita su pagina Notion */
    document.addEventListener('click', function(){
      if(_active && Math.random() < .004){
        var ambient = [
          'Sei indebolito',
          'Tutto è cenere',
          'Resistete',
          'Non arrendetevi',
          'Il fuoco svanisce',
        ];
        _showHint(ambient[Math.floor(Math.random() * ambient.length)]);
      }
    });

    _checkPage();
    _observeMain();

    /* Intercetta anche popstate per SPA routing */
    window.addEventListener('popstate', function(){
      setTimeout(_checkPage, 120);
    });

    /* Fallback: polling leggero per router che non usa popstate */
    setInterval(_checkPage, 800);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }

})();
