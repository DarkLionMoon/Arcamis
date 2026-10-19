/* ════════════════════════════════════════════════════════
   ARCAMIS — carousel-loader.js
   Carica la configurazione del carousel da /api/carousel.

   Due modi, decisi dal backend:
   - gestito (`managed: true`): il manifest admin definisce numero,
     ordine, visibilità, contenuti e rotazione → le slide e i dot
     vengono ricostruiti nel DOM;
   - legacy: override per-indice sulle 3 slide hardcoded.
   Se il fetch fallisce resta il carousel hardcoded.
   ════════════════════════════════════════════════════════════════ */
(function () {
  function escH(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

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

  /* ── Percorso legacy: override per-indice sulle slide hardcoded ── */
  function applyCarouselConfig(slides) {
    var slideEls = document.querySelectorAll('.slide');
    slides.forEach(function (data, idx) {
      var slideEl = slideEls[idx];
      if (!slideEl) return;

      /* ── Sfondo ── */
      if (data.img) {
        slideEl.style.backgroundImage = "url('" + data.img + "')";
        slideEl.style.backgroundSize = 'cover';
        slideEl.style.backgroundPosition = 'center 40%';
      }

      /* ── Meta: tag, titolo, descrizione ── */
      if (data.meta) {
        if (data.meta.tag) {
          var tagEl = slideEl.querySelector('.stag');
          if (tagEl) {
            var lastText = null;
            tagEl.childNodes.forEach(function (n) {
              if (n.nodeType === Node.TEXT_NODE) lastText = n;
            });
            if (lastText) lastText.textContent = data.meta.tag;
            else tagEl.textContent = data.meta.tag;
          }
        }
        if (data.meta.tit) {
          var titEl = slideEl.querySelector('.stit');
          if (titEl) titEl.innerHTML = data.meta.tit.replace(/\n/g, '<br>');
        }
        if (data.meta.sub !== undefined) {
          var subEl = slideEl.querySelector('.ssub');
          if (!subEl && data.meta.sub) {
            subEl = document.createElement('div');
            subEl.className = 'ssub';
            var refEl = slideEl.querySelector('.stit');
            if (refEl && refEl.parentNode) refEl.parentNode.insertBefore(subEl, refEl.nextSibling);
            else (slideEl.querySelector('.scnt') || slideEl).appendChild(subEl);
          }
          if (subEl) subEl.textContent = data.meta.sub;
        }
        if (data.meta.desc) {
          var descEl = slideEl.querySelector('.sdesc');
          if (descEl) descEl.textContent = data.meta.desc;
        }
      }

      /* ── Bottoni CTA ── */
      if (data.btns && data.btns.length) {
        var btnsEl = slideEl.querySelectorAll('.sbtn');
        if (data.btns.length > btnsEl.length) {
          var host = btnsEl.length ? btnsEl[0].parentNode : slideEl.querySelector('.scnt') || slideEl;
          for (var k = btnsEl.length; k < data.btns.length; k++) {
            var n = document.createElement('div');
            n.className = 'sbtn';
            n.style.cursor = 'pointer';
            host.appendChild(n);
          }
          btnsEl = slideEl.querySelectorAll('.sbtn');
        }
        data.btns.forEach(function (btn, bi) {
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
    });
  }

  /* ── Percorso gestito: ricostruzione completa dal manifest ── */
  var FALLBACK_BG = [
    'radial-gradient(ellipse 80% 60% at 60% 30%,#1a0840 0%,#080220 45%,#030112 100%)',
    'radial-gradient(ellipse 90% 70% at 40% 60%,#281400 0%,#120900 45%,#060400 100%)',
    'radial-gradient(ellipse 80% 60% at 50% 40%,#06283c 0%,#041420 45%,#02070d 100%)',
    'radial-gradient(ellipse 90% 70% at 60% 50%,#2c0a18 0%,#14040c 45%,#070203 100%)'
  ];

  /* href nuovo stile: URL esterni, percorsi interni o snippet JS storici. */
  function applyManagedHref(el, href) {
    if (!href || !href.trim()) return;
    href = href.trim();
    el.style.cursor = 'pointer';
    if (/^https?:\/\//i.test(href)) {
      el.addEventListener('click', function () {
        window.open(href, '_blank', 'noopener');
      });
    } else if (href.charAt(0) === '/' || href.charAt(0) === '#') {
      el.addEventListener('click', function () {
        window.location.href = href;
      });
    } else {
      /* Retrocompatibilità: snippet onclick storici (es. gp('...')). */
      el.setAttribute('onclick', href);
    }
  }

  function buildSlide(s, i) {
    var slide = document.createElement('div');
    slide.className = 'slide';
    if (s.img) {
      slide.style.backgroundImage = "url('" + s.img + "')";
      slide.style.backgroundSize = 'cover';
      slide.style.backgroundPosition = 'center 40%';
    } else {
      slide.style.background = FALLBACK_BG[i % FALLBACK_BG.length];
    }
    var scnt = document.createElement('div');
    scnt.className = 'scnt';
    var tag = document.createElement('div');
    tag.className = 'stag';
    tag.textContent = s.tag || '';
    var tit = document.createElement('div');
    tit.className = 'stit';
    tit.innerHTML = escH(s.tit || '').replace(/\n/g, '<br>');
    var sub = document.createElement('div');
    sub.className = 'ssub';
    sub.textContent = s.sub || '';
    var desc = document.createElement('p');
    desc.className = 'sdesc';
    desc.textContent = s.desc || '';
    var row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '14px';
    row.style.flexWrap = 'wrap';
    (s.btns || []).forEach(function (b) {
      if (!b || (!b.label && !b.href)) return;
      var btn = document.createElement('div');
      btn.className = 'sbtn';
      btn.textContent = b.label || '';
      applyManagedHref(btn, b.href);
      row.appendChild(btn);
    });
    scnt.appendChild(tag);
    scnt.appendChild(tit);
    if (s.sub) scnt.appendChild(sub);
    scnt.appendChild(desc);
    scnt.appendChild(row);
    slide.appendChild(scnt);
    return slide;
  }

  function buildDots(n) {
    var dotsWrap = document.querySelector('.cdots');
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    for (var i = 0; i < n; i++) {
      (function (idx) {
        var d = document.createElement('div');
        d.className = 'cdot' + (idx === 0 ? ' ca' : '');
        d.setAttribute('role', 'button');
        d.setAttribute('tabindex', '0');
        d.setAttribute('aria-label', 'Vai alla slide ' + (idx + 1));
        d.addEventListener('click', function () {
          if (typeof jumpToSlide === 'function') jumpToSlide(idx);
        });
        d.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (typeof jumpToSlide === 'function') jumpToSlide(idx);
          }
        });
        dotsWrap.appendChild(d);
      })(i);
    }
  }

  function rebuildCarousel(slides) {
    var track = document.getElementById('ctrack');
    if (!track) return false;
    track.innerHTML = '';
    var n = slides.length;
    slides.forEach(function (s, i) {
      var el = buildSlide(s, i);
      el.style.width = 100 / n + '%';
      el.style.flexShrink = '0';
      track.appendChild(el);
    });
    track.style.width = n * 100 + '%';
    buildDots(n);
    if (typeof jumpToSlide === 'function') jumpToSlide(0);
    return true;
  }

  function loadCarousel() {
    fetch('/api/carousel')
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (!data) return;
        if (data.managed && data.slides && data.slides.length) {
          window.__arcCarouselManaged = true;
          if (window.__arcApplyCarouselSettings) window.__arcApplyCarouselSettings(data.settings);
          else {
            window.__arcCarouselSettings = {
              intervalMs: (data.settings && data.settings.intervalMs) || 6000,
              pauseOnHover: !!(data.settings && data.settings.pauseOnHover)
            };
          }
          rebuildCarousel(data.slides);
        } else if (data.slides && data.slides.length) {
          window.__arcCarouselManaged = false;
          applyCarouselConfig(data.slides);
        }
      })
      .catch(function (e) {
        /* Silenzioso — se fallisce rimane il carousel hardcoded */
        console.warn('[carousel-loader] fetch failed:', e);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCarousel);
  } else {
    loadCarousel();
  }

  /* Hook per i test automatici (vm senza DOM). */
  window._carouselRebuild = rebuildCarousel;
  window._carouselApplyLegacy = applyCarouselConfig;
})();