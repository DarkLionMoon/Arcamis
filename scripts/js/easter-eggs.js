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
  var _style = document.createElement('style');
  _style.textContent = `
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
  background: rgba(0,0,0,.92);
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
#arc-d20-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 70% 35% at 50% 100%, rgba(200,155,60,.09) 0%, transparent 70%);
  pointer-events: none;
}

#arc-d20-canvas {
  display: block;
  width: 300px;
  height: 300px;
  flex-shrink: 0;
}

#arc-d20-result {
  text-align: center;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity .45s ease, transform .45s ease;
  margin-top: 8px;
  position: relative;
  z-index: 1;
}
#arc-d20-result.show {
  opacity: 1;
  transform: translateY(0);
}
#arc-d20-bignum {
  font-family: 'Cinzel', serif;
  font-size: 72px;
  font-weight: 900;
  color: rgba(200,155,60,.95);
  line-height: 1;
}
#arc-d20-bignum.crit {
  color: #ffd700;
  animation: arc-d20-crit 1s ease infinite alternate;
}
#arc-d20-bignum.fail { color: rgba(220,80,80,.9); }
@keyframes arc-d20-crit {
  from { text-shadow: 0 0 20px rgba(255,215,0,.3); }
  to   { text-shadow: 0 0 70px rgba(255,215,0,.9); }
}
#arc-d20-comment {
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 15px;
  font-style: italic;
  color: rgba(220,200,160,.5);
  max-width: 270px;
  margin: 6px auto 0;
  line-height: 1.5;
}
#arc-d20-actions {
  display: flex;
  gap: 14px;
  margin-top: 14px;
  opacity: 0;
  transition: opacity .3s ease .1s;
}
#arc-d20-result.show #arc-d20-actions { opacity: 1; }
.arc-d20-action-btn {
  font-family: 'Cinzel', serif;
  font-size: 9px;
  letter-spacing: .16em;
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
  background: rgba(200,155,60,.05);
}
.arc-d20-spark {
  position: fixed;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #ffd700;
  pointer-events: none;
  z-index: 9999;
  animation: arc-d20-spark var(--d) ease-out forwards;
}
@keyframes arc-d20-spark {
  0%   { transform: translate(0,0); opacity: 1; }
  100% { transform: translate(var(--x),var(--y)); opacity: 0; }
}
@media(max-width:700px){
  #arc-d20-btn { bottom: 80px; right: 12px; }
  #arc-d20-canvas { width: 260px; height: 260px; }
  #arc-d20-bignum { font-size: 56px; }
}
  `;
  document.head.appendChild(_style);

  /* ── Bottone SVG ── */
  function _createBtn(){
    var btn = document.createElement('div');
    btn.id = 'arc-d20-btn';
    btn.title = 'Lancia il d20';
    btn.innerHTML = `<svg viewBox="0 0 100 115" xmlns="http://www.w3.org/2000/svg" width="48" height="55">
  <defs>
    <filter id="arc-d20glow">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <polygon points="50,3 97,28 97,78 50,103 3,78 3,28"
    fill="#06080e" stroke="rgba(200,155,60,.8)" stroke-width="2.5" filter="url(#arc-d20glow)"/>
  <line x1="50" y1="3"  x2="50" y2="53" stroke="rgba(200,155,60,.25)" stroke-width="1"/>
  <line x1="3"  y1="28" x2="97" y2="78" stroke="rgba(200,155,60,.20)" stroke-width="1"/>
  <line x1="97" y1="28" x2="3"  y2="78" stroke="rgba(200,155,60,.20)" stroke-width="1"/>
  <line x1="50" y1="53" x2="3"  y2="78" stroke="rgba(200,155,60,.15)" stroke-width="1"/>
  <line x1="50" y1="53" x2="97" y2="78" stroke="rgba(200,155,60,.15)" stroke-width="1"/>
  <line x1="50" y1="53" x2="50" y2="103" stroke="rgba(200,155,60,.20)" stroke-width="1"/>
  <text x="50" y="60" text-anchor="middle"
    font-family="Cinzel,serif" font-size="22" font-weight="700"
    fill="rgba(200,155,60,.95)">20</text>
</svg>`;
    btn.addEventListener('click', _openD20);
    document.body.appendChild(btn);
  }

  /* ── Overlay ── */
  function _createOverlay(){
    var ov = document.createElement('div');
    ov.id = 'arc-d20-overlay';
    ov.innerHTML =
      '<canvas id="arc-d20-canvas" width="300" height="300"></canvas>'
    + '<div id="arc-d20-result">'
    +   '<div id="arc-d20-bignum"></div>'
    +   '<div id="arc-d20-comment"></div>'
    +   '<div id="arc-d20-actions">'
    +     '<div class="arc-d20-action-btn" id="arc-d20-reroll">⚄ Lancia ancora</div>'
    +     '<div class="arc-d20-action-btn" id="arc-d20-close">✕ Chiudi</div>'
    +   '</div>'
    + '</div>';
    document.body.appendChild(ov);
    document.getElementById('arc-d20-close').addEventListener('click', _closeD20);
    document.getElementById('arc-d20-reroll').addEventListener('click', function(){
      if(_state.rolling) return;
      _state.rolling = false;
      document.getElementById('arc-d20-result').classList.remove('show');
      if(_state.sprites) _state.sprites.forEach(function(s){ s.mat.opacity = 0; });
      _state.diceGroup.position.set((Math.random()-.5)*.3, 2.2, 0);
      _state.diceGroup.rotation.set(Math.random()*Math.PI*2, Math.random()*Math.PI*2, Math.random()*Math.PI*2);
      setTimeout(_doRoll, 80);
    });
    ov.addEventListener('click', function(e){ if(e.target === ov) _closeD20(); });
  }

  /* ── Stato globale Three.js ── */
  var _state = {
    renderer: null, scene: null, camera: null,
    diceGroup: null, sprites: null,
    faceNormals: null, wireMat: null,
    animId: null, rolling: false, ready: false
  };

  /* ── Apri ── */
  function _openD20(){
    var ov = document.getElementById('arc-d20-overlay');
    if(!ov) return;
    ov.classList.add('open');
    document.getElementById('arc-d20-result').classList.remove('show');

    if(!_state.ready){
      _loadThree(function(){
        _initScene();
        _state.ready = true;
        setTimeout(_doRoll, 200);
      });
    } else {
      if(_state.animId){ cancelAnimationFrame(_state.animId); _state.animId = null; }
      if(_state.sprites) _state.sprites.forEach(function(s){ s.mat.opacity = 0; });
      _state.diceGroup.position.set((Math.random()-.5)*.3, 2.2, 0);
      _state.diceGroup.rotation.set(Math.random()*Math.PI*2, Math.random()*Math.PI*2, Math.random()*Math.PI*2);
      setTimeout(_doRoll, 200);
    }
  }

  /* ── Chiudi ── */
  function _closeD20(){
    var ov = document.getElementById('arc-d20-overlay');
    if(ov) ov.classList.remove('open');
    _state.rolling = false;
    if(_state.animId){ cancelAnimationFrame(_state.animId); _state.animId = null; }
    if(_state.sprites) _state.sprites.forEach(function(s){ s.mat.opacity = 0; });
    document.getElementById('arc-d20-result').classList.remove('show');
    if(_state.diceGroup){
      _state.diceGroup.position.set(0,0,0);
      _state.diceGroup.rotation.set(0.5,0.7,0.2);
    }
    if(_state.renderer && _state.scene && _state.camera)
      _state.renderer.render(_state.scene, _state.camera);
  }

  /* ── Carica Three.js on-demand ── */
  function _loadThree(cb){
    if(window.THREE){ cb(); return; }
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.onload = cb;
    document.head.appendChild(s);
  }

  /* ── Init scena ── */
  function _initScene(){
    var THREE = window.THREE;
    var canvas = document.getElementById('arc-d20-canvas');

    var renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true, alpha: true});
    renderer.setSize(300, 300, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    /* fov32 + z9: half-height visibile = 9*tan(16°) ≈ 2.58 */
    var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.z = 9;

    scene.add(new THREE.AmbientLight(0xffeedd, 0.45));
    var key = new THREE.DirectionalLight(0xfff5e0, 2.0);
    key.position.set(3, 5, 4); scene.add(key);
    var rim = new THREE.DirectionalLight(0xc89b3c, 0.8);
    rim.position.set(-4, -1, -3); scene.add(rim);

    /* Dado R=1.3 — vertice più basso al floor -1.2 → -2.5 totale, dentro -2.58 */
    var R = 1.3;
    var geo = new THREE.IcosahedronGeometry(R, 0);
    var mat = new THREE.MeshStandardMaterial({color: 0x090b12, roughness: 0.22, metalness: 0.75});
    var wireMat = new THREE.MeshBasicMaterial({color: 0xc89b3c, wireframe: true, transparent: true, opacity: 0.4});

    var diceGroup = new THREE.Group();
    diceGroup.add(new THREE.Mesh(geo, mat));
    diceGroup.add(new THREE.Mesh(new THREE.IcosahedronGeometry(R * 1.008, 0), wireMat));
    scene.add(diceGroup);

    /* Centroidi e normali delle 20 facce */
    var posAttr = geo.attributes.position;
    var faceCentroids = [], faceNormals = [];
    for(var i = 0; i < 20; i++){
      var i3 = i * 3;
      var fcx = (posAttr.getX(i3) + posAttr.getX(i3+1) + posAttr.getX(i3+2)) / 3;
      var fcy = (posAttr.getY(i3) + posAttr.getY(i3+1) + posAttr.getY(i3+2)) / 3;
      var fcz = (posAttr.getZ(i3) + posAttr.getZ(i3+1) + posAttr.getZ(i3+2)) / 3;
      var l = Math.sqrt(fcx*fcx + fcy*fcy + fcz*fcz);
      faceCentroids.push(new THREE.Vector3(fcx, fcy, fcz));
      faceNormals.push(new THREE.Vector3(fcx/l, fcy/l, fcz/l));
    }

    /* Sprite per ogni faccia */
    var sprites = [];
    for(var i = 0; i < 20; i++){
      var fc = faceCentroids[i], fn = faceNormals[i];
      var sm = new THREE.SpriteMaterial({map: _makeNumTex(THREE, i+1), transparent: true, opacity: 0, depthTest: false});
      var sp = new THREE.Sprite(sm);
      sp.position.set(fc.x + fn.x * 0.15, fc.y + fn.y * 0.15, fc.z + fn.z * 0.15);
      sp.scale.set(0.65, 0.65, 1);
      diceGroup.add(sp);
      sprites.push({sp: sp, mat: sm, normal: fn.clone()});
    }

    diceGroup.rotation.set(0.5, 0.7, 0.2);

    _state.renderer  = renderer;
    _state.scene     = scene;
    _state.camera    = camera;
    _state.diceGroup = diceGroup;
    _state.sprites   = sprites;
    _state.faceNormals = faceNormals;
    _state.wireMat   = wireMat;

    _updateSprites();
    renderer.render(scene, camera);
  }

  /* ── Texture numero per sprite ── */
  function _makeNumTex(THREE, num){
    var sz = 128;
    var c = document.createElement('canvas'); c.width = sz; c.height = sz;
    var ctx = c.getContext('2d');
    ctx.clearRect(0, 0, sz, sz);
    var isGold = num === 20, isFail = num <= 3;
    ctx.font = 'bold 80px serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = isGold ? '#ffd700' : isFail ? 'rgba(230,80,80,1)' : 'rgba(200,155,60,1)';
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 16;
    ctx.fillText(String(num), sz/2, sz/2 + 4);
    return new THREE.CanvasTexture(c);
  }

  /* ── Aggiorna opacità sprite in base a quali facce guardano la camera ── */
  function _updateSprites(){
    if(!_state.sprites) return;
    var camFwd = new window.THREE.Vector3(0, 0, 1);
    _state.sprites.forEach(function(s){
      var wn = s.normal.clone().applyQuaternion(_state.diceGroup.quaternion);
      var d = wn.dot(camFwd);
      s.mat.opacity = d > 0.15 ? Math.pow(d, 2) * 0.9 : 0;
    });
  }

  /* ── Lancio principale ── */
  function _doRoll(){
    if(_state.rolling) return;
    _state.rolling = true;
    document.getElementById('arc-d20-result').classList.remove('show');
    if(_state.sprites) _state.sprites.forEach(function(s){ s.mat.opacity = 0; });

    var result   = Math.floor(Math.random() * 20) + 1;
    var faceIdx  = result - 1;
    var THREE    = window.THREE;
    var dg       = _state.diceGroup;
    var wireMat  = _state.wireMat;
    var faceNormals = _state.faceNormals;

    dg.position.set((Math.random()-.5)*.3, 2.2, 0);
    dg.rotation.set(Math.random()*Math.PI*2, Math.random()*Math.PI*2, Math.random()*Math.PI*2);

    var vy = -2.5, gravity = -10;
    var rx = (Math.random()-.5)*12, ry = (Math.random()-.5)*12, rz = (Math.random()-.5)*7;
    var FLOOR = -1.2;
    var bounces = 0, settled = false, settleT = 0;
    var aligning = false, alignT = 0, startQ = null, targetQ = null, done = false;

    if(_state.animId) cancelAnimationFrame(_state.animId);
    var last = performance.now();

    function tick(now){
      /* Interrompi se overlay chiusa */
      if(!document.getElementById('arc-d20-overlay').classList.contains('open')){
        _state.rolling = false; return;
      }
      var dt = Math.min((now - last) / 1000, 0.04); last = now;

      if(!settled){
        vy += gravity * dt;
        dg.position.y += vy * dt;
        dg.rotation.x += rx * dt; dg.rotation.y += ry * dt; dg.rotation.z += rz * dt;
        rx *= .992; ry *= .992; rz *= .992;

        if(dg.position.y <= FLOOR){
          dg.position.y = FLOOR;
          var res = bounces === 0 ? .38 : bounces === 1 ? .20 : .06;
          vy = -Math.abs(vy) * res;
          rx *= .35; ry *= .35; rz *= .35;
          bounces++;
          wireMat.opacity = 0.85;
          setTimeout(function(){ wireMat.opacity = 0.4; }, 90);
          if(bounces >= 4 || Math.abs(vy) < .15){ settled = true; vy = 0; }
        }
        _updateSprites();

      } else {
        settleT += dt;
        if(!aligning){
          rx *= .78; ry *= .78; rz *= .78;
          dg.rotation.x += rx * dt; dg.rotation.y += ry * dt; dg.rotation.z += rz * dt;
          _updateSprites();
          if(settleT > .5){
            aligning = true; alignT = 0;
            startQ = dg.quaternion.clone();
            var wn = faceNormals[faceIdx].clone().applyQuaternion(dg.quaternion);
            var q  = new THREE.Quaternion().setFromUnitVectors(wn, new THREE.Vector3(0, 0, 1));
            targetQ = q.multiply(dg.quaternion.clone()).normalize();
            dg.position.x *= 0.4;
          }
        } else {
          alignT = Math.min(alignT + dt * 1.1, 1);
          var ease = 1 - Math.pow(1 - alignT, 3);
          dg.quaternion.copy(startQ.clone().slerp(targetQ, ease));
          _updateSprites();
          if(!done && alignT >= 1){
            done = true; _state.rolling = false;
            var bn = document.getElementById('arc-d20-bignum');
            bn.textContent = result;
            bn.className = result === 20 ? 'crit' : result <= 3 ? 'fail' : '';
            document.getElementById('arc-d20-comment').textContent = _comments[result] || '';
            document.getElementById('arc-d20-result').classList.add('show');
            if(result === 20) _spawnSparks();
          }
        }
      }

      _state.renderer.render(_state.scene, _state.camera);
      _state.animId = requestAnimationFrame(tick);
    }
    _state.animId = requestAnimationFrame(tick);
  }

  /* ── Scintille critico ── */
  function _spawnSparks(){
    var canvas = document.getElementById('arc-d20-canvas');
    var cr = canvas.getBoundingClientRect();
    var cx = cr.left + cr.width  / 2;
    var cy = cr.top  + cr.height / 2;
    for(var i = 0; i < 24; i++){
      var s = document.createElement('div');
      s.className = 'arc-d20-spark';
      var a = Math.PI*2/24*i + (Math.random()-.5)*.3;
      var d = 55 + Math.random()*75;
      s.style.cssText = 'left:'+cx+'px;top:'+cy+'px;'
        +'--x:'+(Math.cos(a)*d)+'px;--y:'+(Math.sin(a)*d)+'px;'
        +'--d:'+(0.4+Math.random()*.6)+'s';
      document.body.appendChild(s);
      setTimeout(function(el){ el.remove(); }, 1600, s);
    }
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
