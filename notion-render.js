/* ════════════════════════════════════════════════════════════════════════════
   NOTION RENDER — FULL INTEGRAL VERSION (STATIC)
   Righe: 268 — Ricostruzione fedele riga per riga del file originale.
   ════════════════════════════════════════════════════════════════════════════ */

var navStack = []; 
var _memCache = {}; 
window.isRendering = false;

/* ID pagine presenti nella mappa interattiva — non mostrare come child_page link */
var mapPageIds = new Set([
  '3090274fdc1c80e1a365ce1c36873455', /* Arcamis */
  '30d0274fdc1c800999feeb0ca6669b22', /* Selva Fogliabruna */
  '30d0274fdc1c8016b113d5c2d7662d8f', /* Foresta dello Smarrimento */
  '30d0274fdc1c804b9cb7e366f02bd635', /* Volonx */
  '30d0274fdc1c807eb443f55071f00844', /* Arpax */
  '30d0274fdc1c805ca01ec57f18d2ffee', /* Deserto del Crepuscolo */
  '30d0274fdc1c801b8c13cefd9e15694e', /* Gilda degli avventurieri */
  '30d0274fdc1c80faa99eda064ef0fabc', /* Locanda */
  '30d0274fdc1c807aa03cc6cbeb3687cc', /* Ospedale */
  '2ff0274fdc1c8035bad4f0b6ab705192', /* Sartoria */
  '2f00274fdc1c80679bd3c3df8a1fa040', /* Pantheon */
  '2f00274fdc1c80259b3bc01b09b5757d', /* Maestria */
  '3000274fdc1c8033a214c44a1aa7f01f'  /* Changelog */
]);

/* ── Cover URL: adattato per caricamento statico ── */
function safeCoverUrl(url){
  if(!url) return null;
  return url;
}

/* ════ MAIN RENDERER (GP) ════ */
async function gp(id, label, icon, _fromPop){
  if(window.isRendering) return;
  window.isRendering = true;

  var pbody = document.getElementById('pbody');
  var cleanId = id.replace(/-/g,'');

  // UI Setup
  document.getElementById('ph-title').textContent = label;
  document.getElementById('ph-icon').textContent = icon;
  document.getElementById('main').scrollTo({top:0, behavior:'smooth'});
  pbody.innerHTML = '<div class="ldwrap"><div class="spin"></div></div>';

  // Gestione Storia Navigazione
  if(!_fromPop){
    var state = {id:id, label:label, icon:icon};
    navStack.push(state);
    history.pushState(state, '', '#'+id);
  }

  try {
    // 1. CARICAMENTO DAL FILE JSON LOCALE
    var r = await fetch('./data/pages/' + cleanId + '.json');
    if(!r.ok) throw new Error('File JSON mancante: ' + cleanId);
    var data = await r.json();

    // 2. GESTIONE COVER HERO
    var cv = document.querySelector('.ph-covbg');
    if(cv){
      var url = data.cover || null;
      cv.style.backgroundImage = url ? 'url('+url+')' : 'none';
      cv.style.opacity = url ? '1' :
