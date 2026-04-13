/* ════════════════════════════════════
   ARCAMIS — easter-eggs.js
   Easter egg e interattivi nascosti
════════════════════════════════════ */

/* ════════════════════════════════════
   1. CLICK 10 VOLTE SUL LOGO
   Spawna una GIF a tutto schermo
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
   2. DADO D20
   Bottone fisso in basso a destra
   con icona del sito come faccia del 20
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
    20: '⚔️ CRITICO! Gli annali di Arcamis ricordano questo momento.'
  };

  function _rollD20(){
    var diceEl = document.getElementById('arc-d20');
    if(!diceEl || diceEl.classList.contains('rolling')) return;
    diceEl.classList.add('rolling');
    var result = Math.floor(Math.random() * 20) + 1;

    setTimeout(function(){
      diceEl.classList.remove('rolling');
      var toast = document.createElement('div');
      toast.className = 'arc-d20-toast';
      var isCrit = result === 20;
      var isFail = result === 1;
      toast.innerHTML =
        '<div class="arc-d20-result' + (isCrit ? ' crit' : isFail ? ' fail' : '') + '">' + result + '</div>'
        + '<div class="arc-d20-comment">' + _comments[result] + '</div>';
      document.body.appendChild(toast);
      setTimeout(function(){ toast.classList.add('vis'); }, 10);
      setTimeout(function(){
        toast.classList.remove('vis');
        setTimeout(function(){ toast.remove(); }, 400);
      }, 3500);
    }, 600);
  }

  function _initD20(){
    var diceEl = document.createElement('div');
    diceEl.id = 'arc-d20';
    diceEl.title = 'Lancia il d20';
    diceEl.innerHTML = '<img src="/Artboard_1.png" alt="d20" style="width:28px;height:28px;object-fit:contain;opacity:.85">';
    diceEl.addEventListener('click', _rollD20);
    document.body.appendChild(diceEl);
  }

  /* CSS */
  var s = document.createElement('style');
  s.textContent = `
#arc-d20 {
  position: fixed;
  bottom: 72px;
  right: 16px;
  width: 44px;
  height: 44px;
  background: rgba(8,10,18,.92);
  border: 1px solid rgba(200,155,60,.35);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 200;
  transition: transform .2s, box-shadow .2s, border-color .2s;
  box-shadow: 0 4px 16px rgba(0,0,0,.5);
}
#arc-d20:hover {
  transform: scale(1.12) rotate(-8deg);
  border-color: rgba(200,155,60,.8);
  box-shadow: 0 6px 24px rgba(0,0,0,.7), 0 0 16px rgba(200,155,60,.2);
}
#arc-d20.rolling {
  animation: d20-roll .6s cubic-bezier(.36,.07,.19,.97);
  pointer-events: none;
}
@keyframes d20-roll {
  0%   { transform: rotate(0deg) scale(1); }
  20%  { transform: rotate(180deg) scale(1.2); }
  60%  { transform: rotate(320deg) scale(.9); }
  80%  { transform: rotate(355deg) scale(1.05); }
  100% { transform: rotate(360deg) scale(1); }
}
.arc-d20-toast {
  position: fixed;
  bottom: 125px;
  right: 16px;
  background: rgba(6,8,18,.97);
  border: 1px solid rgba(200,155,60,.3);
  border-left: 3px solid rgba(200,155,60,.7);
  padding: 12px 16px;
  max-width: 240px;
  z-index: 201;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity .3s ease, transform .3s ease;
  pointer-events: none;
}
.arc-d20-toast.vis {
  opacity: 1;
  transform: translateY(0);
}
.arc-d20-result {
  font-family: 'Cinzel', serif;
  font-size: 32px;
  font-weight: 900;
  color: rgba(200,155,60,.9);
  line-height: 1;
  margin-bottom: 6px;
  letter-spacing: .02em;
}
.arc-d20-result.crit {
  color: #ffd700;
  text-shadow: 0 0 20px rgba(255,215,0,.5);
  animation: d20-crit-pulse 1s ease infinite alternate;
}
.arc-d20-result.fail {
  color: rgba(200,60,60,.9);
}
@keyframes d20-crit-pulse {
  from { text-shadow: 0 0 10px rgba(255,215,0,.3); }
  to   { text-shadow: 0 0 30px rgba(255,215,0,.7); }
}
.arc-d20-comment {
  font-family: 'Crimson Pro', serif;
  font-size: 13px;
  color: rgba(220,200,160,.65);
  font-style: italic;
  line-height: 1.4;
}
@media(max-width:700px){
  #arc-d20 { bottom: 80px; right: 12px; }
  .arc-d20-toast { right: 12px; bottom: 135px; }
}
  `;
  document.head.appendChild(s);

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', _initD20);
  } else {
    _initD20();
  }
})();
