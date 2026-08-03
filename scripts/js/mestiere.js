/* ════════════════════════════════════
   ARCAMIS — mestiere.js
   Redirect alle vecchie route mestiere
   verso il compendio HTML (mestieri-compendio.js)
   e societa-licenze.js
   ════════════════════════════════════ */

/* Mappa key → indice nel compendio _CMP_MESTIERI */
var _COMPENDIO_MAP = {
  'alchimista':  0,
  'architetto':  1,
  'artigiano':   2,
  'artista':     3,
  'falegname':   4,
  'metallurgo':  5,
  'oste':        6,
  'sarto':       7,
};

/* showMestiere — reindirizza al compendio */
window.showMestiere = function(key) {
  if (typeof navStack === 'undefined') {
    setTimeout(function(){ window.showMestiere(key); }, 100);
    return;
  }

  /* come-funzionano → apri compendio sulla Guida */
  if (key === 'come-funzionano') {
    if (typeof showMestieriCompendio === 'function') {
      showMestieriCompendio();
    }
    return;
  }

  /* singola professione → apri compendio sul tab giusto */
  var idx = _COMPENDIO_MAP[key];
  if (typeof showMestieriCompendio === 'function') {
    showMestieriCompendio();
    /* seleziona la tab della professione dopo il render */
    if (typeof idx !== 'undefined' && typeof _cmpSetMestiere === 'function') {
      setTimeout(function(){ _cmpSetMestiere(idx); }, 50);
    }
    return;
  }

  /* fallback: se il compendio non è caricato, mostra home */
  if (typeof showHome === 'function') showHome();
};
