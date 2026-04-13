/* ════════════════════════════════════
   ARCAMIS — easter-eggs.js
   Easter egg e interattivi nascosti
════════════════════════════════════ */

/* ════════════════════════════════════
   1. CLICK 10 VOLTE SUL LOGO
════════════════════════════════════ */
(function(){
  var _logoClicks = 0;
  var _logoTimer = null;

  function _attachLogoEgg(){
    var tlogo = document.getElementById('tlogo');
    if(!tlogo) return;
    tlogo.addEventListener('click', function(){
      _logoClicks++;
      clearTimeout(_logoTimer);
      _logoTimer = setTimeout(function(){ _logoClicks = 0; }, 2000);
      if(_logoClicks >= 10){
        _logoClicks = 0;
        var overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.7);cursor:pointer';
        var img = document.createElement('img');
        img.src = 'https://media1.tenor.com/m/KR3ro3xVXXMAAAAd/sea-lion-funny.gif';
        img.style.cssText = 'max-width:90vw;max-height:90vh;border:2px solid rgba(200,155,60,.5);border-radius:4px';
        overlay.appendChild(img);
        overlay.addEventListener('click', function(){ overlay.remove(); });
        document.body.appendChild(overlay);
      }
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', _attachLogoEgg);
  } else {
    _attachLogoEgg();
  }
})();

/* ════════════════════════════════════
   2. DADO D20 3D
════════════════════════════════════ */
(function(){

  var _comments = {
    1:  'I critici fallimenti forgiano i migliori racconti.',
    2:  'Gli dei distolgono lo sguardo.',
    3:  'Forse era meglio restare alla locanda.',
    4:  'La fortuna ti volta le spalle.',
    5:  'Un risultato... esistente.',
    6:  'Peggio di così si può.',
    7:  'Il dado non mente. Purtroppo.',
    8:  'Qualcosa è andato storto.',
    9:  'Non è un disastro. Quasi.',
    10: 'Nella media, come sempre.',
    11: 'Poteva andare peggio.',
    12: 'Discreto. Gli dei approvano a metà.',
    13: 'Un buon presagio... o forse no.',
    14: 'La fortuna inizia a sorriderti.',
    15: 'Solido. I compagni annuiscono.',
    16: 'Ottimo! L\'avventura sorride.',
    17: 'Impressionante. La taverna mormora.',
    18: 'Gli dei ti guardano con favore.',
    19: 'Quasi perfetto. La leggenda cresce.',
    20: 'CRITICO! Gli annali di Arcamis ricordano questo momento.'
  };

  /* ── CSS ── */
  var s = document.createElement('style');
  s.textContent = `
#arc-d20-btn {
  position: fixed;
  bottom: 72px;
  right: 16px;
  width: 48px;
  height: 48px;
  cursor: pointer;
  z-index: 200;
  transition: transform .2s, filter .2s;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,.6));
  user-select: none;
}
#arc-d20-btn:hover {
  transform: scale(1.15) rotate(-8deg);
  filter: drop-shadow(0 6px 20px rgba(200,155,60,.5));
}
#arc-d20-btn:active { transform: scale(.95); }

#arc-d20-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(0,0,0,.88);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity .3s ease;
  gap: 0;
}
#arc-d20-overlay.open {
  opacity: 1;
  pointer-events: auto;
}
#arc-d20-canvas {
  width: 320px;
  height: 320px;
  max-width: 75vw;
  max-height: 75vw;
  display: block;
}
#arc-d20-result-panel {
  text-align: center;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity .4s ease, transform .4s ease;
  margin-top: -20px;
}
#arc-d20-result-panel.show {
  opacity: 1;
  transform: translateY(0);
}
#arc-d20-result-num {
  font-family: 'Cinzel', serif;
  font-size: 80px;
  font-weight: 900;
  color: rgba(200,155,60,.95);
  line-height: 1;
  letter-spacing: .02em;
  text-shadow: 0 0 40px rgba(200,155,60,.3);
}
#arc-d20-result-num.crit {
  color: #ffd700;
  animation: d20eg-crit 1s ease infinite alternate;
}
#arc-d20-result-num.fail { color: rgba(220,80,80,.95); }
@keyframes d20eg-crit {
  from { text-shadow: 0 0 20px rgba(255,215,0,.4); }
  to   { text-shadow: 0 0 80px rgba(255,215,0,.9); }
}
#arc-d20-result-comment {
  font-family: 'Crimson Pro', serif;
  font-size: 16px;
  font-style: italic;
  color: rgba(220,200,160,.6);
  max-width: 280px;
  margin: 8px auto 0;
  line-height: 1.5;
}
#arc-d20-actions {
  display: flex;
  gap: 16px;
  margin-top: 20px;
  opacity: 0;
  transition: opacity .3s ease .2s;
}
#arc-d20-result-panel.show #arc-d20-actions { opacity: 1; }
.arc-d20-action-btn {
  font-family: 'Cinzel', serif;
  font-size: 9px;
  letter-spacing: .18em;
  text-transform: uppercase;
  padding: 9px 20px;
  border: 1px solid rgba(200,155,60,.3);
  background: transparent;
  color: rgba(200,155,60,.6);
  cursor: pointer;
  transition: all .2s;
}
.arc-d20-action-btn:hover {
  color: rgba(200,155,60,1);
  border-color: rgba(200,155,60,.7);
  background: rgba(200,155,60,.06);
}
@media(max-width:700px){
  #arc-d20-btn { bottom: 80px; right: 12px; }
  #arc-d20-canvas { width: 260px; height: 260px; }
  #arc-d20-result-num { font-size: 60px; }
}
  `;
  document.head.appendChild(s);

  /* ── Crea bottone SVG ── */
  function _createBtn(){
    var btn = document.createElement('div');
    btn.id = 'arc-d20-btn';
    btn.title = 'Lancia il d20';
    btn.innerHTML = `<svg viewBox="0 0 100 115" xmlns="http://www.w3.org/2000/svg" width="48" height="55">
  <defs>
    <filter id="d20glow">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <!-- Forma d20 -->
  <polygon points="50,3 97,28 97,78 50,103 3,78 3,28" fill="#06080e" stroke="rgba(200,155,60,.8)" stroke-width="2.5" filter="url(#d20glow)"/>
  <!-- Facce interne -->
  <line x1="50" y1="3" x2="50" y2="53" stroke="rgba(200,155,60,.25)" stroke-width="1"/>
  <line x1="3" y1="28" x2="97" y2="78" stroke="rgba(200,155,60,.2)" stroke-width="1"/>
  <line x1="97" y1="28" x2="3" y2="78" stroke="rgba(200,155,60,.2)" stroke-width="1"/>
  <line x1="50" y1="53" x2="3" y2="78" stroke="rgba(200,155,60,.15)" stroke-width="1"/>
  <line x1="50" y1="53" x2="97" y2="78" stroke="rgba(200,155,60,.15)" stroke-width="1"/>
  <line x1="50" y1="53" x2="50" y2="103" stroke="rgba(200,155,60,.2)" stroke-width="1"/>
  <!-- Numero 20 -->
  <text x="50" y="60" text-anchor="middle" font-family="Cinzel,serif" font-size="22" font-weight="700" fill="rgba(200,155,60,.95)">20</text>
</svg>`;
    btn.addEventListener('click', _openD20);
    document.body.appendChild(btn);
  }

  /* ── Crea overlay ── */
  function _createOverlay(){
    var overlay = document.createElement('div');
    overlay.id = 'arc-d20-overlay';
    overlay.innerHTML =
      '<canvas id="arc-d20-canvas"></canvas>'
      + '<div id="arc-d20-result-panel">'
        + '<div id="arc-d20-result-num"></div>'
        + '<div id="arc-d20-result-comment"></div>'
        + '<div id="arc-d20-actions">'
          + '<div class="arc-d20-action-btn" id="arc-d20-reroll">⚄ Lancia ancora</div>'
          + '<div class="arc-d20-action-btn" id="arc-d20-close">✕ Chiudi</div>'
        + '</div>'
      + '</div>';
    document.body.appendChild(overlay);
    document.getElementById('arc-d20-close').addEventListener('click', _closeD20);
    document.getElementById('arc-d20-reroll').addEventListener('click', function(){
      _hideResult();
      setTimeout(_doRoll, 300);
    });
    overlay.addEventListener('click', function(e){
      if(e.target === overlay) _closeD20();
    });
  }

  /* ── Stato ── */
  var _three = null;
  var _rolling = false;

  /* ── Apri ── */
  function _openD20(){
    var overlay = document.getElementById('arc-d20-overlay');
    if(!overlay) return;
    overlay.classList.add('open');
    _hideResult();
    _rolling = false;

    if(!_three){
      _loadThree(function(){
        _initScene();
        setTimeout(_doRoll, 200);
      });
    } else {
      /* Riavvia animazione */
      if(_three.animId){ cancelAnimationFrame(_three.animId); _three.animId = null; }
      setTimeout(_doRoll, 200);
    }
  }

  /* ── Chiudi ── */
  function _closeD20(){
    var overlay = document.getElementById('arc-d20-overlay');
    if(overlay) overlay.classList.remove('open');
    _rolling = false;
    if(_three && _three.animId){
      cancelAnimationFrame(_three.animId);
      _three.animId = null;
    }
  }

  /* ── Carica Three.js ── */
  function _loadThree(cb){
    if(window.THREE){ cb(); return; }
    var script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.onload = cb;
    document.head.appendChild(script);
  }

  /* ── Init scena ── */
  function _initScene(){
    var THREE = window.THREE;
    var canvas = document.getElementById('arc-d20-canvas');
    var w = canvas.clientWidth || 320;
    var h = canvas.clientHeight || 320;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 6);

    /* Luci */
    scene.add(new THREE.AmbientLight(0xffeedd, 0.5));
    var key = new THREE.DirectionalLight(0xffeedd, 1.4);
    key.position.set(3, 6, 4);
    scene.add(key);
    var rim = new THREE.DirectionalLight(0xc89b3c, 0.6);
    rim.position.set(-4, -2, -3);
    scene.add(rim);

    /* Dado: icosaedro */
    var geo = new THREE.IcosahedronGeometry(1.5, 0);

    /* Costruisci array di materiali per le 20 facce */
    /* IcosahedronGeometry in r128 non supporta grouping nativo,
       quindi usiamo un unico materiale con texture atlas */
    var mat = _buildDiceMaterial(THREE);
    var dice = new THREE.Mesh(geo, mat);
    scene.add(dice);

    /* Piano ombra invisibile */
    var floorGeo = new THREE.PlaneGeometry(10, 10);
    var floorMat = new THREE.ShadowMaterial({ opacity: 0.3 });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.8;
    floor.receiveShadow = true;
    scene.add(floor);

    _three = { scene, camera, renderer, dice, animId: null, _resultShown: false };
  }

  /* ── Texture atlas: griglia 5x4 con numeri 1-20 ── */
  function _buildDiceMaterial(THREE){
    var cols = 5, rows = 4;
    var cellSize = 256;
    var w = cols * cellSize, h = rows * cellSize;
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var ctx = c.getContext('2d');

    ctx.fillStyle = '#06080e';
    ctx.fillRect(0, 0, w, h);

    for(var i = 0; i < 20; i++){
      var num = i + 1;
      var col = i % cols;
      var row = Math.floor(i / cols);
      var x = col * cellSize;
      var y = row * cellSize;

      /* Sfondo cella */
      ctx.fillStyle = num === 20 ? '#0c0a00' : '#06080e';
      ctx.fillRect(x, y, cellSize, cellSize);

      /* Bordo triangolo */
      ctx.strokeStyle = num === 20 ? 'rgba(255,215,0,.7)' : 'rgba(200,155,60,.45)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(x + cellSize/2, y + 18);
      ctx.lineTo(x + cellSize - 18, y + cellSize - 18);
      ctx.lineTo(x + 18, y + cellSize - 18);
      ctx.closePath();
      ctx.stroke();

      if(num === 20){
        /* Logo */
        var logo = new window.Image();
        logo.crossOrigin = 'anonymous';
        logo.src = '/Artboard_1.png';
        (function(lx, ly, lnum, logo){
          logo.onload = function(){
            ctx.fillStyle = '#0c0a00';
            ctx.fillRect(lx, ly, cellSize, cellSize);
            ctx.strokeStyle = 'rgba(255,215,0,.7)';
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.moveTo(lx + cellSize/2, ly + 18);
            ctx.lineTo(lx + cellSize - 18, ly + cellSize - 18);
            ctx.lineTo(lx + 18, ly + cellSize - 18);
            ctx.closePath();
            ctx.stroke();
            ctx.shadowColor = 'rgba(255,215,0,.5)';
            ctx.shadowBlur = 24;
            var sz = 140;
            ctx.drawImage(logo, lx + (cellSize-sz)/2, ly + (cellSize-sz)/2 + 8, sz, sz);
            ctx.shadowBlur = 0;
            if(_three && _three.dice){
              _three.dice.material.map.needsUpdate = true;
            }
          };
        })(x, y, num, logo);
      } else {
        /* Numero */
        ctx.font = 'bold 90px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = num <= 3 ? 'rgba(220,80,80,.9)' : 'rgba(200,155,60,.95)';
        ctx.shadowColor = num <= 3 ? 'rgba(220,80,80,.4)' : 'rgba(200,155,60,.4)';
        ctx.shadowBlur = 14;
        ctx.fillText(String(num), x + cellSize/2, y + cellSize/2 + 8);
        ctx.shadowBlur = 0;
      }
    }

    var tex = new THREE.CanvasTexture(c);
    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.35,
      metalness: 0.55,
      envMapIntensity: 1.0
    });
  }

  /* ── Lancia ── */
  function _doRoll(){
    if(!_three || _rolling) return;
    _rolling = true;

    var result = Math.floor(Math.random() * 20) + 1;
    var THREE = window.THREE;
    var dice = _three.dice;

    /* Posizione di partenza: in alto */
    dice.position.set((Math.random()-0.5)*0.6, 5, 0);
    dice.rotation.set(Math.random()*Math.PI*2, Math.random()*Math.PI*2, Math.random()*Math.PI*2);

    /* Velocità */
    var vy = -5;
    var gravity = -22;
    var angVelX = (Math.random()-0.5)*20;
    var angVelY = (Math.random()-0.5)*20;
    var angVelZ = (Math.random()-0.5)*12;
    var bounces = 0;
    var floor = -1.6;
    var settled = false;
    var settleT = 0;
    var shown = false;

    if(_three.animId) cancelAnimationFrame(_three.animId);

    var last = performance.now();
    function tick(now){
      if(!document.getElementById('arc-d20-overlay').classList.contains('open')){
        _rolling = false; return;
      }
      var dt = Math.min((now-last)/1000, 0.05);
      last = now;

      if(!settled){
        vy += gravity * dt;
        dice.position.y += vy * dt;
        dice.rotation.x += angVelX * dt;
        dice.rotation.y += angVelY * dt;
        dice.rotation.z += angVelZ * dt;
        angVelX *= 0.985; angVelY *= 0.985; angVelZ *= 0.985;

        if(dice.position.y <= floor){
          dice.position.y = floor;
          vy = -vy * 0.45;
          angVelX *= 0.55; angVelY *= 0.55; angVelZ *= 0.55;
          bounces++;
          if(bounces >= 4 || Math.abs(vy) < 0.8){
            settled = true; vy = 0;
          }
        }
      } else {
        settleT += dt;
        /* Smorzamento rotazione */
        angVelX *= 0.88; angVelY *= 0.88; angVelZ *= 0.88;
        dice.rotation.x += angVelX * dt;
        dice.rotation.y += angVelY * dt;
        dice.rotation.z += angVelZ * dt;

        if(!shown && settleT > 0.9){
          shown = true;
          _rolling = false;
          _showResult(result);
        }
      }

      _three.renderer.render(_three.scene, _three.camera);
      _three.animId = requestAnimationFrame(tick);
    }
    _three.animId = requestAnimationFrame(tick);
  }

  /* ── Mostra risultato ── */
  function _showResult(num){
    var panel = document.getElementById('arc-d20-result-panel');
    var numEl = document.getElementById('arc-d20-result-num');
    var commentEl = document.getElementById('arc-d20-result-comment');
    if(!panel) return;
    numEl.textContent = num;
    numEl.className = num === 20 ? 'crit' : num === 1 ? 'fail' : '';
    commentEl.textContent = _comments[num] || '';
    panel.classList.add('show');
  }

  function _hideResult(){
    var panel = document.getElementById('arc-d20-result-panel');
    if(panel) panel.classList.remove('show');
  }

  /* ── Init ── */
  function _init(){
    _createBtn();
    _createOverlay();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }

})();
