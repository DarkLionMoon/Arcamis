/* ════ CAROUSEL DINAMICO DA ADMIN ════
   Carica configurazione da /api/carousel e applica
   override su sfondo, testi e bottoni CTA di ogni slide.
   Se non ci sono override, le slide rimangono invariate.
════════════════════════════════════════════════════════ */
(function() {

  /* Definizione delle slide: indice → selettori DOM */
  var SLIDE_DEFS = [
    {
      /* Slide 0 — Arcamis Porto */
      slideEl:  function() { return document.querySelectorAll('.slide')[0]; },
      tagEl:    function(s) { return s && s.querySelector('.stag'); },
      titEl:    function(s) { return s && s.querySelector('.stit'); },
      btnsEl:   function(s) { return s && s.querySelectorAll('.sbtn'); }
    },
    {
      /* Slide 1 — Pantheon */
      slideEl:  function() { return document.querySelectorAll('.slide')[1]; },
      tagEl:    function(s) { return s && s.querySelector('.stag'); },
      titEl:    function(s) { return s && s.querySelector('.stit'); },
      btnsEl:   function(s) { return s && s.querySelectorAll('.sbtn'); }
    },
    {
      /* Slide 2 — Personaggio */
      slideEl:  function() { return document.querySelectorAll('.slide')[2]; },
      tagEl:    function(s) { return s && s.querySelector('.stag'); },
      titEl:    function(s) { return s && s.querySelector('.stit'); },
      btnsEl:   function(s) { return s && s.querySelectorAll('.sbtn'); }
    }
  ];

  function applyCarouselConfig(slides) {
    slides.forEach(function(data, idx) {
      var def = SLIDE_DEFS[idx];
      if (!def) return;

      var slideEl = def.slideEl();
      if (!slideEl) return;

      /* ── Sfondo ── */
      if (data.img) {
        slideEl.style.backgroundImage = 'url(\'' + data.img + '\')';
        slideEl.style.backgroundSize = 'cover';
        slideEl.style.backgroundPosition = 'center 40%';
      }

      /* ── Testi (tag + titolo) ── */
      if (data.meta) {
        if (data.meta.tag) {
          var tagEl = def.tagEl(slideEl);
          /* Il tag ha un ::before decorativo — manteniamo solo il testo */
          if (tagEl) {
            /* Trova il nodo testo (l'ultimo nodo figlio di tipo testo) */
            var textNode = null;
            tagEl.childNodes.forEach(function(n) {
              if (n.nodeType === Node.TEXT_NODE) textNode = n;
            });
            if (textNode) {
              textNode.textContent = data.meta.tag;
            } else {
              tagEl.textContent = data.meta.tag;
            }
          }
        }
        if (data.meta.tit) {
          var titEl = def.titEl(slideEl);
          if (titEl) titEl.innerHTML = data.meta.tit;
        }
      }

      /* ── Bottoni CTA ── */
      if (data.btns && data.btns.length) {
        var btnsEl = def.btnsEl(slideEl);
        data.btns.forEach(function(btn, bi) {
          var el = btnsEl && btnsEl[bi];
          if (!el) return;
          /* Testo */
          if (btn.label) {
            /* Mantieni eventuali icone SVG figli */
            var svgEl = el.querySelector('svg');
            el.textContent = btn.label;
            if (svgEl) el.insertBefore(svgEl, el.firstChild);
          }
          /* Href o onclick */
          if (btn.href) {
            if (btn.href.startsWith('http')) {
              el.href = btn.href;
              el.setAttribute('target', '_blank');
              el.setAttribute('rel', 'noopener');
              el.removeAttribute('onclick');
            } else if (btn.href) {
              /* Tratta come onclick inline (es. "gp(...)" o scroll) */
              el.removeAttribute('href');
              el.setAttribute('onclick', btn.href);
            }
          }
        });
      }
    });
  }

  /* Esegui dopo che il DOM è pronto */
  function loadCarousel() {
    fetch('/api/carousel')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.slides && data.slides.length) {
          applyCarouselConfig(data.slides);
        }
      })
      .catch(function() {
        /* Silenzioso — se fallisce rimane il carousel hardcoded */
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCarousel);
  } else {
    loadCarousel();
  }

})();
