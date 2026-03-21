/* ════════════════════════════════════════════════════════
   ARCAMIS — carousel-loader.js
   Carica la configurazione del carousel da /api/carousel
   e la applica al DOM: sfondo, tag, titolo, descrizione, bottoni.
   Se non ci sono override in KV, le slide restano invariate.
════════════════════════════════════════════════════════ */
(function() 
 {
function applyBtnHref(el, href) {
  if (href && href.startsWith('http')) {
    if (el.tagName === 'A') {
      el.href = href;
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener');
      el.removeAttribute('onclick');
    } else {
      el.setAttribute('onclick', "window.open('" + href + "','_blank','noopener')");
    }
    el.style.cursor = 'pointer';
  } else if (href && href.trim()) {
    if (el.tagName === 'A') el.removeAttribute('href');
    el.setAttribute('onclick', href);
    el.style.cursor = 'pointer';
  } else {
    if (el.tagName === 'A') el.removeAttribute('href');
    el.removeAttribute('onclick');
  }
}
  function applyCarouselConfig(slides) {
    var slideEls = document.querySelectorAll('.slide');

    slides.forEach(function(data, idx) {
      var slideEl = slideEls[idx];
      if (!slideEl) return;

      /* ── Sfondo ── */
      if (data.img) {
        slideEl.style.backgroundImage    = 'url(\'' + data.img + '\')';
        slideEl.style.backgroundSize     = 'cover';
        slideEl.style.backgroundPosition = 'center 40%';
      }

      if (data.meta) {
        /* ── Tag (testo piccolo sopra) ── */
        if (data.meta.tag) {
          var tagEl = slideEl.querySelector('.stag');
          if (tagEl) {
            /* Preserva eventuali elementi figli (::before decorativo) —
               sovrascrive solo il nodo testo finale */
            var lastText = null;
            tagEl.childNodes.forEach(function(n) {
              if (n.nodeType === Node.TEXT_NODE) lastText = n;
            });
            if (lastText) lastText.textContent = data.meta.tag;
            else tagEl.textContent = data.meta.tag;
          }
        }

        /* ── Titolo (grande) ── */
        if (data.meta.tit) {
          var titEl = slideEl.querySelector('.stit');
          if (titEl) titEl.innerHTML = data.meta.tit.replace(/\n/g, '<br>');
        }

        /* ── Descrizione (paragrafo .sdesc) ── */
        if (data.meta.desc) {
          var descEl = slideEl.querySelector('.sdesc');
          if (descEl) descEl.textContent = data.meta.desc;
        }
      }

     /* ── Bottoni CTA ── */
/* ── Bottoni CTA ── */
if (data.btns && data.btns.length) {
  var btnsEl = slideEl.querySelectorAll('.sbtn');
  data.btns.forEach(function(btn, bi) {
    var el = btnsEl[bi];
    if (!el) return;
    if (btn.label) {
      var svgEl = el.querySelector('svg');
      el.textContent = btn.label;
      if (svgEl) el.insertBefore(svgEl, el.firstChild);
    }
    if ('href' in btn) {
      applyBtnHref(el, btn.href);
    }
  });
}
        /* Silenzioso — se fallisce rimane il carousel hardcoded */
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCarousel);
  } else {
    loadCarousel();
  }

})();
