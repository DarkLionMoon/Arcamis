/* ════════════════════════════════════════════════════════════════
   ARCAMIS — icons.js
   Icone di Lore/UI dallo sprite `images/icons-lore.svg`.

   Le pagine continuano a dichiarare un'emoji in `registry.json`: qui
   c'è la mappa emoji → simbolo, così il menu mostra l'icona nuova
   senza toccare i contenuti. Se un'emoji non ha una corrispondenza,
   si restituisce l'emoji originale: nessuna voce resta senza icona
   mentre la migrazione procede.
   ════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var SPRITE = '/images/icons-lore.svg';

  var EMOJI = {
    '⚖': 'scales',
    '🐉': 'wyrm',
    '📋': 'scroll',
    '📖': 'book',
    '🛐': 'temple',
    '💼': 'briefcase',
    '🌟': 'spark',
    '🏰': 'castle',
    '📜': 'scroll',
    '🌌': 'orbit',
    '📚': 'book',
    '🗺': 'map',
    '🏙': 'city',
    '📐': 'ruler',
    '🧬': 'helix',
    '⚔': 'swords',
    '📍': 'pin',
    '🌲': 'tree',
    '🌑': 'moon',
    '🏘': 'city',
    '🏛': 'temple',
    '🌊': 'wave',
    '⚓': 'anchor',
    '🌫': 'fog',
    '🗿': 'monolith',
    '🏠': 'hearth'
  };

  function clean(value) {
    return String(value == null ? '' : value).replace(/\uFE0F/g, '').trim();
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /** Nome del simbolo per un'emoji (o per un nome già valido). */
  function nameFor(value) {
    var key = clean(value);
    if (!key) return '';
    if (EMOJI[key]) return EMOJI[key];
    return Object.prototype.hasOwnProperty.call(EMOJI, key) ? EMOJI[key] : '';
  }

  /**
   * SVG dell'icona.
   * @param {string} name nome del simbolo nello sprite (es. "swords")
   * @param {{size?:number, className?:string, title?:string}} [opts]
   */
  function icon(name, opts) {
    var o = opts || {};
    var symbol = clean(name);
    if (!symbol) return '';
    var cls = 'arc-ic' + (o.className ? ' ' + o.className : '');
    var size = o.size ? ' width="' + Number(o.size) + '" height="' + Number(o.size) + '"' : '';
    var title = o.title ? '<title>' + esc(o.title) + '</title>' : '';
    return (
      '<svg class="' + esc(cls) + '" aria-hidden="' + (o.title ? 'false' : 'true') + '" focusable="false"' +
      size +
      '><use href="' +
      SPRITE +
      '#' +
      esc(symbol) +
      '"></use>' +
      title +
      '</svg>'
    );
  }

  /** Icona a partire dall'emoji del registro; fallback all'emoji. */
  function iconFor(value, opts) {
    var symbol = nameFor(value);
    if (!symbol) return clean(value) || '';
    return icon(symbol, opts);
  }

  global.arcIcon = icon;
  global.arcIconFor = iconFor;
  global.arcIconName = nameFor;
  global.ArcIcons = EMOJI;
})(window);
