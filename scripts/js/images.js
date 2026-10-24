/* ════════════════════════════════════════════════════════════════
   ARCAMIS — images.js
   Markup delle immagini responsive.

   I dati arrivano da `image-manifest.js` (generato da
   scripts/optimize-images.mjs): per ogni sorgente conosce le varianti
   AVIF/WebP e le misure reali, così il browser riceve `srcset`,
   `sizes` e `width/height` senza una fetch in più.

   Se un'immagine non è passata dalla pipeline (o il manifest non è
   caricato) si ricade sul semplice `<img src>` di sempre: nessuna
   immagine sparisce, al massimo non è ottimizzata.
   ════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var DEFAULT_SIZES = '(max-width: 900px) 100vw, 860px';

  function manifest() {
    return global.ARC_IMAGES || {};
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function key(src) {
    return String(src == null ? '' : src).split('?')[0].split('#')[0];
  }

  function entry(src) {
    return manifest()[key(src)] || null;
  }

  function widths(variants) {
    return Object.keys(variants || {})
      .map(Number)
      .filter(function (width) {
        return Number.isFinite(width) && width > 0;
      })
      .sort(function (a, b) {
        return a - b;
      });
  }

  function srcset(variants, format) {
    return widths(variants)
      .map(function (width) {
        var item = variants[width] || {};
        var url = item[format];
        return url ? url + ' ' + width + 'w' : '';
      })
      .filter(Boolean)
      .join(', ');
  }

  /* Variante più grande, per lo zoom a schermo intero. */
  function full(src) {
    var data = entry(src);
    if (!data) return src;
    var list = widths(data.v);
    var best = list[list.length - 1];
    var item = best ? data.v[best] : null;
    return (item && (item.w || item.a)) || src;
  }

  /* Attributi comuni: larghezza/altezza reali evitano il layout shift. */
  function attrs(data, opts) {
    var out = '';
    out += ' loading="' + esc(opts.loading || 'lazy') + '"';
    out += ' decoding="async"';
    if (data && data.w && data.h) out += ' width="' + data.w + '" height="' + data.h + '"';
    if (opts.fetchpriority) out += ' fetchpriority="' + esc(opts.fetchpriority) + '"';
    if (opts.attrs) out += ' ' + opts.attrs;
    return out;
  }

  /**
   * Markup di un'immagine: `<picture>` con AVIF/WebP quando esistono
   * le varianti, altrimenti `<img>`.
   *
   * @param {string} src  percorso pubblico, es. /images/notion/foo.jpg
   * @param {{alt?:string, sizes?:string, className?:string, loading?:string,
   *          fetchpriority?:string, attrs?:string}} [opts]
   */
  function picture(src, opts) {
    var o = opts || {};
    var data = entry(src);
    var cls = o.className ? ' class="' + esc(o.className) + '"' : '';
    var alt = ' alt="' + esc(o.alt || '') + '"';
    var sizes = o.sizes || DEFAULT_SIZES;

    if (!data) {
      return '<img src="' + esc(src) + '"' + alt + cls + attrs(null, o) + '>';
    }

    var avif = srcset(data.v, 'a');
    var webp = srcset(data.v, 'w');
    var list = widths(data.v);
    var largest = list[list.length - 1];
    var fallback = (largest && (data.v[largest].w || data.v[largest].a)) || src;
    var html = '<picture class="arc-pic">';

    if (avif) {
      html += '<source type="image/avif" srcset="' + esc(avif) + '" sizes="' + esc(sizes) + '">';
    }
    if (webp) {
      html += '<source type="image/webp" srcset="' + esc(webp) + '" sizes="' + esc(sizes) + '">';
    }
    html +=
      '<img src="' +
      esc(fallback) +
      '"' +
      alt +
      cls +
      attrs(data, o) +
      '>';
    return html + '</picture>';
  }

  global.arcPicture = picture;
  global.arcImageFull = full;
})(window);
