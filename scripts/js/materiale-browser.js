/* ════════════════════════════════════════════════════════
   ARCAMIS — materiale-browser.js
   Progressive enhancement del browser del Materiale Approvato:
   ricerca live, filtri per fonte, apertura automatica degli accordion
   ed evidenziazione della voce selezionata nell'indice.
   Senza JS i link àncora dell'indice restano comunque funzionanti.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function setup(box) {
    if (!box || box._matReady) return;
    box._matReady = true;
    var search = box.querySelector('.mat-index-search');
    var count = box.querySelector('.mat-index-count');
    var chips = Array.prototype.slice.call(box.querySelectorAll('.mat-chip'));
    var items = Array.prototype.slice.call(box.querySelectorAll('.mat-index-item'));
    var headers = Array.prototype.slice.call(box.querySelectorAll('.mat-index-sec, .mat-index-group'));
    var activeSrc = '';
    var total = items.length;

    function paintCount(n) {
      if (count) count.textContent = n + (n === 1 ? ' voce' : ' voci');
    }

    function apply() {
      var q = search ? (search.value || '').trim().toLowerCase() : '';
      var n = 0;
      items.forEach(function (li) {
        var okQ = !q || (li.getAttribute('data-name') || '').indexOf(q) !== -1;
        var okS = !activeSrc || li.getAttribute('data-src') === activeSrc;
        var show = okQ && okS;
        li.style.display = show ? '' : 'none';
        if (show) n++;
      });
      /* Nasconde le intestazioni senza più voci visibili sotto. */
      var list = box.querySelector('.mat-index-list');
      if (list) {
        var kids = Array.prototype.slice.call(list.children);
        var cur = null;
        var curVisible = 0;
        var flush = function () {
          if (cur) cur.style.display = curVisible ? '' : 'none';
        };
        kids.forEach(function (kid) {
          if (kid.classList.contains('mat-index-sec') || kid.classList.contains('mat-index-group')) {
            flush();
            cur = kid;
            curVisible = 0;
          } else if (cur && kid.style.display !== 'none') {
            curVisible++;
          }
        });
        flush();
      }
      paintCount(n);
    }

    function flash(target) {
      if (!target || !target.classList) return;
      /* Apre gli accordion genitori chiusi (classi → sottoclassi). */
      var d = target.closest ? target.closest('details') : null;
      while (d) {
        d.open = true;
        d = d.parentElement && d.parentElement.closest ? d.parentElement.closest('details') : null;
      }
      target.classList.remove('mat-flash');
      /* Riavvia l'animazione anche su click ripetuti. */
      void target.offsetWidth;
      target.classList.add('mat-flash');
      window.setTimeout(function () {
        target.classList.remove('mat-flash');
      }, 1500);
    }

    function markActive(link) {
      items.forEach(function (li) {
        var a = li.querySelector('a');
        if (a) a.parentElement.classList.toggle('is-active', a === link);
      });
      headers.forEach(function (h) {
        var a = h.querySelector('a');
        if (a) a.parentElement.classList.toggle('is-active', a === link);
      });
    }

    if (search) search.addEventListener('input', apply);
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        activeSrc = chip.getAttribute('data-src') || '';
        chips.forEach(function (c) {
          c.classList.toggle('is-on', c === chip);
        });
        apply();
      });
    });

    box.querySelector('.mat-index-list').addEventListener('click', function (e) {
      var link = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!link) return;
      var id = link.getAttribute('href').slice(1);
      var target = id && box.querySelector('#' + CSS.escape(id));
      if (!target) return;
      e.preventDefault();
      markActive(link);
      flash(target);
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      try {
        history.replaceState(null, '', '#' + id);
      } catch (_err) {}
    });

    /* Deep-link diretto: apre ed evidenzia la voce dell'URL. */
    try {
      var hash = (location.hash || '').replace('#', '');
      if (hash.indexOf('mat-') === 0) {
        var direct = box.querySelector('#' + CSS.escape(hash));
        if (direct) {
          var link = box.querySelector('.mat-index-list a[href="#' + hash + '"]');
          if (link) markActive(link);
          flash(direct);
        }
      }
    } catch (_err) {}

    paintCount(total);
  }

  function init(root) {
    var scope = root || document;
    if (!scope || !scope.querySelectorAll) return;
    Array.prototype.forEach.call(scope.querySelectorAll('.mat-browser'), setup);
  }

  window.matBrowserInit = init;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init(document);
    });
  } else {
    init(document);
  }
})();
