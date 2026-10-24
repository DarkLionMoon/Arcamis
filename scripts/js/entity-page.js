/* ─────────────────────────────────────────────────────────────
   Entity page v2 — pagina entità pilota (Fase 1)
   Hero Hextech + rail dei metadati + tab per le sezioni.
   Il markdown resta la fonte di verità: qui si riorganizza soltanto
   (Identità → rail, resto → tab), senza duplicare dati.
   ───────────────────────────────────────────────────────────── */
(function (global) {
  'use strict';

  var META_TITLES = /^(identit[aà]|dettagli|profilo|scheda)$/i;
  var META_LINE = /^\s*[-*+]\s*\*\*(.+?):?\*\*\s*:?\s*(.+?)\s*$/;
  var META_FALLBACK = /^\s*[-*+]\s*([A-ZÀ-Ý][^:]{2,32}):\s*(.+?)\s*$/;
  var SKIP_META = /^(nome|name)$/i;

  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function cleanValue(v) {
    return String(v || '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/`/g, '')
      .trim();
  }

  function parseMeta(lines) {
    var out = [];
    for (var i = 0; i < lines.length; i++) {
      var raw = lines[i];
      if (!raw.trim()) continue;
      var m = raw.match(META_LINE) || raw.match(META_FALLBACK);
      if (!m) continue;
      var key = cleanValue(m[1]).replace(/:$/, '');
      var value = cleanValue(m[2]);
      if (!key || !value || SKIP_META.test(key)) continue;
      out.push({ key: key, value: value });
    }
    return out;
  }

  /* Restituisce { intro, meta, sections:[{id,title,md}] } */
  function parse(md) {
    var text = String(md || '').replace(/\r\n/g, '\n');
    var body = text.replace(/^\s*#\s+[^\n]*\n/, ''); // titolo: lo mette l'hero
    var lines = body.split('\n');
    var pre = [];
    var sections = [];
    var cur = null;
    lines.forEach(function (line) {
      var h = line.match(/^##\s+(.+?)\s*#*\s*$/);
      if (h) {
        cur = { title: h[1].replace(/\*\*/g, '').trim(), lines: [] };
        sections.push(cur);
        return;
      }
      if (cur) cur.lines.push(line);
      else pre.push(line);
    });

    var meta = [];
    var tabs = [];
    sections.forEach(function (s, idx) {
      if (!meta.length && META_TITLES.test(s.title)) {
        meta = parseMeta(s.lines);
        if (meta.length) return;
      }
      var content = s.lines.join('\n').trim();
      if (!content) return;
      tabs.push({ id: 'sec-' + idx, title: s.title, md: content });
    });

    /* L'immagine di apertura è già nella hero: non va ripetuta
       nell'epigrafe. */
    var intro = pre
      .filter(function (line) {
        return !/^\s*!\[[^\]]*\]\([^)]*\)\s*$/.test(line);
      })
      .join('\n')
      .trim();

    return {
      intro: intro,
      meta: meta,
      sections: tabs,
    };
  }

  function safeUrl(value) {
    var url = String(value || '').trim();
    return /^(https?:|\/|\.\/|\.\.\/)/i.test(url) ? url : '';
  }

  function heroHtml(d, opts) {
    var src = safeUrl(d.img).replace(/#.*$/, '');
    var pos = d.pos ? d.pos[0] + '% ' + d.pos[1] + '%' : '50% 40%';
    var media = src
      ? (global.arcPicture
          ? global.arcPicture(src, {
              alt: d.n,
              sizes: '(max-width: 900px) 100vw, 860px',
              className: 'arc-hero-img',
              loading: 'eager',
              fetchpriority: 'high',
              attrs:
                ' style="object-position:' + esc(pos) + '"' +
                ' onerror="this.onerror=null;this.style.display=\'none\';this.parentNode.parentNode.classList.add(\'is-broken\')"',
            })
          : '<img class="arc-hero-img" src="' + esc(src) + '" alt="' + esc(d.n) + '"' +
            ' style="object-position:' + esc(pos) + '" fetchpriority="high" decoding="async"' +
            ' onerror="this.onerror=null;this.style.display=\'none\';this.parentNode.parentNode.classList.add(\'is-broken\')">')
      : '<div class="arc-hero-none" aria-hidden="true">' + esc(opts.icon || '') + '</div>';
    var eyebrow = opts.eyebrow || 'Pantheon';
    return (
      '<header class="arc-hero">' +
      '<div class="arc-hero-media">' + media + '</div>' +
      '<div class="arc-hero-shade" aria-hidden="true"></div>' +
      '<div class="arc-hero-inner">' +
      '<div class="arc-hero-eyebrow"><span class="arc-rule" aria-hidden="true"></span>' + esc(eyebrow) + '</div>' +
      '<h1 class="arc-hero-title">' + esc(d.n) + '</h1>' +
      (d.epi ? '<p class="arc-hero-epi">' + esc(d.epi) + '</p>' : '') +
      '</div></header>'
    );
  }

  function railHtml(meta, opts) {
    if (!meta.length) return '';
    var rows = meta
      .map(function (m) {
        return '<div class="arc-meta"><dt>' + esc(m.key) + '</dt><dd>' + esc(m.value) + '</dd></div>';
      })
      .join('');
    return (
      '<aside class="arc-rail" aria-label="Metadati della scheda">' +
      '<div class="arc-rail-inner">' +
      '<div class="arc-rail-head"><span>Dossier</span>' + (opts.icon ? '<span class="arc-rail-glyph" aria-hidden="true">' + (String(opts.icon).indexOf('<svg') === 0 ? opts.icon : esc(opts.icon)) + '</span>' : '') + '</div>' +
      '<dl class="arc-meta-list">' + rows + '</dl>' +
      (opts.backHref ? '<a class="arc-rail-back" href="' + esc(opts.backHref) + '">← ' + esc(opts.backLabel || 'Indietro') + '</a>' : '') +
      '</div></aside>'
    );
  }

  function tabsHtml(sections, renderMd) {
    if (!sections.length) return '';
    var heads = sections
      .map(function (s, i) {
        return (
          '<button class="arc-tab" type="button" role="tab" id="arc-tab-' + i + '"' +
          ' aria-controls="arc-panel-' + i + '" aria-selected="' + (i === 0) + '"' +
          ' tabindex="' + (i === 0 ? '0' : '-1') + '" data-arc-tab="' + i + '">' +
          esc(s.title) + '</button>'
        );
      })
      .join('');
    var panels = sections
      .map(function (s, i) {
        return (
          '<section class="arc-panel" role="tabpanel" id="arc-panel-' + i + '"' +
          ' aria-labelledby="arc-tab-' + i + '"' + (i === 0 ? '' : ' hidden') + '>' +
          renderMd(s.md) + '</section>'
        );
      })
      .join('');
    return (
      '<div class="arc-tabs-block">' +
      '<div class="arc-tabs" role="tablist" aria-label="Sezioni della scheda">' + heads + '</div>' +
      '<div class="arc-panels">' + panels + '</div>' +
      '</div>'
    );
  }

  function render(d, opts) {
    opts = opts || {};
    var renderMd = opts.renderMd || function (md) { return esc(md); };
    var parsed = parse(d.md);
    var sections = parsed.sections.slice();
    /* L'epigrafe (la citazione) resta sotto il titolo, prima delle tab */
    var intro = parsed.intro ? '<div class="arc-intro">' + renderMd(parsed.intro) + '</div>' : '';
    return (
      '<article class="arc-entity" data-entity="' + esc(d.slug || '') + '">' +
      heroHtml(d, opts) +
      '<div class="arc-entity-grid">' +
      '<div class="arc-entity-main">' +
      (opts.draft ? opts.draft : '') +
      intro +
      tabsHtml(sections, renderMd) +
      '</div>' +
      railHtml(parsed.meta, opts) +
      '</div></article>'
    );
  }

  /* Tab: click, frecce, Home/End. Idempotente (mount può girare più volte). */
  function mount(root) {
    if (!root || root.__arcTabs) return;
    var list = root.querySelector('.arc-tabs');
    if (!list) return;
    root.__arcTabs = true;
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[data-arc-tab]'));
    function select(idx, focus) {
      tabs.forEach(function (t, i) {
        var on = i === idx;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.setAttribute('tabindex', on ? '0' : '-1');
        t.classList.toggle('is-active', on);
        var p = root.querySelector('#arc-panel-' + i);
        if (p) p.hidden = !on;
      });
      if (focus && tabs[idx]) tabs[idx].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = tabs.length - 1;
        if (next === null) return;
        e.preventDefault();
        select(next, true);
      });
    });
    select(0);
  }

  global.ArcEntity = { parse: parse, render: render, mount: mount };
})(window);
