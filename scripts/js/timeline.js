/* ════════════════════════════════════
   ARCAMIS — timeline.js
   Widget timeline orizzontale
════════════════════════════════════ */

window.renderTimeline = function(container, pages) {
  _injectTimelineCSS();

  var wrap = document.createElement('div');
  wrap.className = 'tl-wrap';
  wrap.id = 'tlWrap';

  var inner = document.createElement('div');
  inner.className = 'tl-inner';

  var line = document.createElement('div');
  line.className = 'tl-line';

  var events = document.createElement('div');
  events.className = 'tl-events';

  pages.forEach(function(ev, i) {
    var isTop = i % 2 === 0;
    var slot = document.createElement('div');
    slot.className = 'tl-slot';

    var box = document.createElement('div');
    box.className = 'tl-box ' + (isTop ? 'top' : 'bottom');
    box.innerHTML = '<div class="tl-year">' + ev.title + '</div>';
    box.onclick = function() { _tlOpenModal(ev); };

    var stemTop = document.createElement('div');
    stemTop.className = 'tl-stem top';
    var stemBot = document.createElement('div');
    stemBot.className = 'tl-stem bottom';

    var dot = document.createElement('div');
    dot.className = 'tl-dot';

    if (isTop) {
      slot.appendChild(box);
      slot.appendChild(stemTop);
      slot.appendChild(dot);
      slot.appendChild(stemBot);
    } else {
      slot.appendChild(stemTop);
      slot.appendChild(dot);
      slot.appendChild(stemBot);
      slot.appendChild(box);
    }

    events.appendChild(slot);
  });

  inner.appendChild(line);
  inner.appendChild(events);
  wrap.appendChild(inner);
  container.innerHTML = '';
  container.appendChild(wrap);

  /* ── Modal ── */
  if (!document.getElementById('tl-modal-bg')) {
    var modalBg = document.createElement('div');
    modalBg.className = 'tl-modal-bg';
    modalBg.id = 'tl-modal-bg';
   modalBg.innerHTML =
  '<div class="tl-modal">' +
    '<div class="tl-modal-close" onclick="tlCloseModal()">✕ CHIUDI</div>' +
    '<div class="tl-modal-year" id="tl-m-year"></div>' +
    '<div class="tl-modal-title" id="tl-m-title"></div>' +
    '<div class="tl-modal-content" id="tl-m-content"></div>' +
  '</div>';
    modalBg.addEventListener('click', function(e) { if (e.target === modalBg) tlCloseModal(); });
    document.body.appendChild(modalBg);
  }

  /* ── Drag scroll ── */
  var isDown = false, startX, scrollLeft;
  wrap.addEventListener('mousedown', function(e) {
    isDown = true; wrap.classList.add('grabbing');
    startX = e.pageX - wrap.offsetLeft; scrollLeft = wrap.scrollLeft;
  });
  wrap.addEventListener('mouseleave', function() { isDown = false; wrap.classList.remove('grabbing'); });
  wrap.addEventListener('mouseup', function() { isDown = false; wrap.classList.remove('grabbing'); });
  wrap.addEventListener('mousemove', function(e) {
    if (!isDown) return; e.preventDefault();
    wrap.scrollLeft = scrollLeft - (e.pageX - wrap.offsetLeft - startX);
  });
};

window.tlCloseModal = function() {
  var bg = document.getElementById('tl-modal-bg');
  if (bg) bg.classList.remove('open');
};

function _tlOpenModal(ev) {
  var bg = document.getElementById('tl-modal-bg');
  if (!bg) return;
  document.getElementById('tl-m-year').textContent = ev.title;
  document.getElementById('tl-m-title').textContent = '';
  document.getElementById('tl-m-content').innerHTML = '<div class="tl-modal-loading"><div class="gs-loading-spin"></div></div>';
  bg.classList.add('open');

  fetch('/api/notion?pageId=' + ev.id)
    .then(function(r){ return r.json(); })
    .then(function(data){
      if(!data.blocks) throw new Error('no blocks');
      var html = renderBlocks(data.blocks, true);
      document.getElementById('tl-m-content').innerHTML = '<div class="n-body">' + html + '</div>';
    })
    .catch(function(){
      document.getElementById('tl-m-content').innerHTML = '<div class="tl-modal-error">Errore caricamento</div>';
    });
}

function _injectTimelineCSS() {
  if (document.getElementById('tl-css')) return;
  var s = document.createElement('style');
  s.id = 'tl-css';
  s.textContent = `
.tl-modal-content{margin-top:12px;max-height:60vh;overflow-y:auto;}
.tl-modal-loading{display:flex;justify-content:center;padding:40px 0;}
.tl-modal-error{color:rgba(200,155,60,.4);font-family:'Cinzel',serif;font-size:11px;padding:20px;text-align:center;}
.tl-wrap{width:100%;overflow-x:auto;overflow-y:visible;padding:20px 0 24px;cursor:grab;user-select:none}
.tl-wrap.grabbing{cursor:grabbing}
.tl-inner{position:relative;display:inline-flex;align-items:center;min-width:max-content;padding:140px 60px}
.tl-line{position:absolute;top:50%;left:0;right:0;height:1px;background:rgba(200,155,60,.35);transform:translateY(-50%)}
.tl-events{display:flex;align-items:center;position:relative}
.tl-slot{display:flex;flex-direction:column;align-items:center;position:relative;width:160px}
.tl-box{width:138px;padding:10px 12px;border:1px solid rgba(200,155,60,.35);background:rgba(8,6,2,.85);cursor:pointer;transition:.18s;text-align:center;position:absolute;border-radius:3px}
.tl-box:hover{border-color:rgba(200,155,60,.8);background:rgba(18,14,4,.95)}
.tl-box.top{bottom:calc(50% + 28px)}
.tl-box.bottom{top:calc(50% + 28px)}
.tl-year{font-family:'Cinzel',serif;font-size:10px;letter-spacing:.08em;color:rgba(240,230,200,.85)}
.tl-dot{width:10px;height:10px;border-radius:50%;border:1.5px solid rgba(200,155,60,.7);background:#0a0800;position:relative;z-index:2;flex-shrink:0}
.tl-stem{position:absolute;left:50%;width:1px;background:rgba(200,155,60,.25);transform:translateX(-50%)}
.tl-stem.top{bottom:calc(50% + 4px);height:24px}
.tl-stem.bottom{top:calc(50% + 4px);height:24px}
.tl-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:1000;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:.2s}
.tl-modal-bg.open{opacity:1;pointer-events:auto}
.tl-modal{background:#080602;border:1px solid rgba(200,155,60,.4);max-width:480px;width:90%;padding:28px;position:relative;border-radius:3px}
.tl-modal-close{position:absolute;top:14px;right:16px;font-family:'Cinzel',serif;font-size:12px;color:rgba(200,155,60,.5);cursor:pointer;letter-spacing:.1em}
.tl-modal-close:hover{color:rgba(200,155,60,1)}
.tl-modal-year{font-family:'Cinzel',serif;font-size:18px;font-weight:700;color:rgba(240,230,200,.95);margin-bottom:8px}
  `;
  document.head.appendChild(s);
}
