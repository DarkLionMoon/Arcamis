/* ════════════════════════════════════════════════════════════════
   ARCAMIS — explorer.js
   Pattern di esplorazione per le pagine lunghe della wiki.

   Il contenuto resta markdown (fonte unica, editabile dall'Admin); qui
   viene letto in sezioni e disposto secondo il pattern scelto nella
   pagina JSON (`explore.mode`):

     master-detail  catalogo ricercabile + dettaglio unico
     group-tabs     gruppi a sinistra, voci del gruppo a schede
     tabs           schede orizzontali + indice sticky
     drawer         griglia di tessere + cassetto laterale
     accordion      macro-categorie richiudibili

   Le funzioni pure (parseEntries, filterEntries, normalizeConfig) sono
   esposte su window.ArcExplorer per i test.
   ════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var MODES = ['master-detail', 'group-tabs', 'tabs', 'drawer', 'accordion'];

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function attr(value) {
    return esc(value);
  }

  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') || 'voce';
  }

  function stripMd(md) {
    return String(md || '')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/<[^>]+>/g, ' ')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^[-*+]\s+/gm, ' ')
      .replace(/^>\s?/gm, '')
      .replace(/[*_`~|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function renderMd(md) {
    if (typeof global._mdToHtml === 'function') return global._mdToHtml(md || '');
    /* Fallback minimo: serve solo se il renderer del sito non è ancora
       disponibile (test isolati o montaggio fuori pagina). */
    return String(md || '')
      .split(/\n{2,}/)
      .map(function (block) {
        var text = esc(block).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
        return '<p>' + text + '</p>';
      })
      .join('');
  }

  function normalizeConfig(raw) {
    var cfg = raw && typeof raw === 'object' ? raw : {};
    var mode = MODES.indexOf(cfg.mode) >= 0 ? cfg.mode : 'master-detail';
    var defaultLevel = mode === 'tabs' || mode === 'accordion' ? 2 : 1;
    return {
      mode: mode,
      entryLevel: cfg.entryLevel === 2 ? 2 : cfg.entryLevel === 3 ? 3 : cfg.entryLevel === 1 ? 1 : defaultLevel,
      skipFirst: cfg.skipFirst === true,
      search: cfg.search !== false,
      label: cfg.label || '',
      plural: cfg.plural || 'schede',
      hash: cfg.hash || '',
      groupBy: cfg.groupBy || '',
      groupPlural: cfg.groupPlural || '',
      detailStyle: cfg.detailStyle || 'markdown',
      source: cfg.source === 'table' ? 'table' : 'headings',
      entityHeading: cfg.entityHeading || '',
      showHero: cfg.showHero !== false,
      filters: Array.isArray(cfg.filters) ? cfg.filters.filter(function (f) { return f && f.label; }) : [],
      tabs: Array.isArray(cfg.tabs) ? cfg.tabs.filter(function (t) { return t && t.label; }) : [],
      groups: Array.isArray(cfg.groups) ? cfg.groups.filter(function (g) { return g && g.label; }) : [],
      unassigned: cfg.unassigned !== false
    };
  }

  function defaultPrefix(pageKey) {
    return slugify(String(pageKey || 'wiki').replace(/-homebrew$/, '').replace(/-scoperta$/, ''));
  }

  function cleanBody(value) {
    return String(value || '')
      .replace(/\r\n/g, '\n')
      .split('\n')
      .filter(function (line) { return !/^\s*---+\s*$/.test(line); })
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function stripLeadingH1(value) {
    return String(value || '').replace(/^\s*#\s+.*(?:\n|$)/, '').trim();
  }

  /* ── Parsing delle sezioni ─────────────────────────────────── */

  function splitSections(md, level) {
    var lines = String(md || '').replace(/\r\n/g, '\n').split('\n');
    var intro = [];
    var sections = [];
    var current = null;
    var seen = {};

    lines.forEach(function (line) {
      var heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
      if (heading && heading[1].length === level) {
        if (current) sections.push(current);
        var title = heading[2].trim();
        var base = slugify(title);
        var slug = base;
        var n = 2;
        while (seen[slug]) slug = base + '-' + n++;
        seen[slug] = true;
        current = { title: title, slug: slug, id: 'exp-' + slug, lines: [], level: level };
        return;
      }
      if (current) current.lines.push(line);
      else intro.push(line);
    });
    if (current) sections.push(current);

    return {
      intro: cleanBody(intro.join('\n')),
      entries: sections.map(function (section) {
        var body = cleanBody(section.lines.join('\n'));
        return {
          id: section.id,
          slug: section.slug,
          title: section.title,
          level: section.level,
          body: body,
          raw: new Array(section.level + 1).join('#') + ' ' + section.title + '\n\n' + body,
          meta: parseMeta(body),
          image: firstImage(body),
          searchText: (section.title + ' ' + stripMd(body)).toLowerCase(),
          entity: true
        };
      })
    };
  }

  function autoLevel(md) {
    var h1 = (String(md).match(/^#\s+/gm) || []).length;
    var h2 = (String(md).match(/^##\s+/gm) || []).length;
    if (h1 >= 2) return 1;
    if (h2 >= 2) return 2;
    return 3;
  }

  function parseMeta(body) {
    var out = [];
    String(body || '')
      .replace(/\r\n/g, '\n')
      .split('\n')
      .forEach(function (line) {
        var m =
          line.match(/^\s*[-*+]\s+\*\*(.+?):\*\*\s*(.*)$/) ||
          line.match(/^\s*[-*+]\s+\*\*(.+?)\*\*\s*:\s*(.*)$/) ||
          line.match(/^\s*[-*+]\s+\*(.+?):\*\s*(.*)$/) ||
          line.match(/^\s*\*\*(.+?):\*\*\s*(.*)$/) ||
          line.match(/^\s*(?!\*\*)\*(.+?):\*\s*(.*)$/) ||
          line.match(/^\s*([A-ZÀ-Ü][\wÀ-ÿ /'’-]{1,42}):\s*(.+)$/);
        if (!m) return;
        var label = m[1].replace(/:$/, '').trim();
        var value = String(m[2] || '').trim();
        /* Un valore che finisce coi due punti è un’etichetta di elenco
           ("**Tentacolo** del Terrore:"), non un metadato. */
        if (!label || !value || /:$/.test(value)) return;
        out.push({ label: label, value: value });
      });
    return out;
  }

  function cleanMetaValue(value) {
    var text = String(value || '').replace(/\*\*/g, '').replace(/\*/g, '').replace(/\s+/g, ' ').trim();
    if (text.length > 70) {
      var dot = text.indexOf('. ');
      if (dot > 0) text = text.slice(0, dot);
    }
    return text.replace(/[.;:]$/, '').trim();
  }

  function metaValue(entry, label) {
    if (!entry || !label) return '';
    var needle = String(label).toLowerCase();
    for (var i = 0; i < entry.meta.length; i++) {
      if (entry.meta[i].label.toLowerCase() === needle) return cleanMetaValue(entry.meta[i].value);
    }
    return '';
  }

  function firstImage(body) {
    var match = String(body || '').match(/!\[[^\]]*\]\(([^)\s]+)\)/);
    if (!match) return { src: '', position: '' };
    var target = match[1];
    var pos = target.match(/#(\d{1,3})[.,](\d{1,3})$/);
    return {
      src: target.split('#')[0],
      position: pos ? pos[1] + '% ' + pos[2] + '%' : ''
    };
  }

  function stripFirstImage(body) {
    return String(body || '').replace(/^\s*!\[[^\]]*\]\([^)]*\)\s*$/m, '').trim();
  }

  function applyEntityFlag(entry, cfg) {
    if (!cfg.entityHeading) return entry;
    var re = new RegExp('^#{2,3}\\s+' + cfg.entityHeading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', 'm');
    entry.entity = re.test(entry.body);
    return entry;
  }

  function parseEntries(md, rawConfig) {
    var cfg = normalizeConfig(rawConfig);
    var level = cfg.entryLevel || autoLevel(md);
    var parsed = splitSections(md, level);
    var intro = parsed.intro;
    var entries = parsed.entries;
    if (cfg.skipFirst && entries.length) {
      var first = entries.shift();
      intro = [intro, first.raw].filter(Boolean).join('\n\n');
    }
    entries.forEach(function (entry) { applyEntityFlag(entry, cfg); });
    return { intro: intro, entries: entries };
  }

  /* ── Catalogo da tabella (bibliografia, elenchi catalogati) ── */
  function parseTableEntries(md) {
    var lines = String(md || '').replace(/\r\n/g, '\n').split('\n');
    var start = -1;
    var end = -1;
    for (var i = 0; i < lines.length; i++) {
      if (/^\s*\|/.test(lines[i])) {
        if (start < 0) start = i;
        end = i;
      } else if (start >= 0 && !/^\s*\|/.test(lines[i])) {
        break;
      }
    }
    if (start < 0) return { intro: cleanBody(md), entries: [] };
    var tableLines = lines.slice(start, end + 1);
    var splitRow = function (line) {
      return line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(function (cell) { return cell.trim(); });
    };
    var header = splitRow(tableLines[0]);
    var entries = [];
    var seen = {};
    tableLines.slice(2).forEach(function (line, index) {
      var cells = splitRow(line);
      if (!cells.length || !cells[0]) return;
      var title = cells[0].replace(/\*\*/g, '').trim();
      var base = slugify(title);
      var slug = base;
      var n = 2;
      while (seen[slug]) slug = base + '-' + n++;
      seen[slug] = true;
      var fields = [];
      header.forEach(function (label, i) {
        if (!cells[i] || !cells[i].trim()) return;
        fields.push({ label: label || 'Voce', value: cells[i].trim() });
      });
      entries.push({
        id: 'exp-' + slug,
        slug: slug,
        title: title,
        level: 2,
        body: '',
        raw: '',
        meta: fields.slice(1),
        fields: fields,
        image: { src: '', position: '' },
        searchText: (title + ' ' + cells.join(' ')).toLowerCase(),
        entity: true
      });
    });
    var before = lines.slice(0, start).join('\n');
    var after = lines.slice(end + 1).join('\n');
    return { intro: cleanBody([before, after].filter(Boolean).join('\n\n')), entries: entries };
  }

  /* ── Filtri ───────────────────────────────────────────────── */

  function buildFilters(entries, cfg) {
    return cfg.filters.map(function (def) {
      var seen = {};
      var values = [];
      entries.forEach(function (entry) {
        var value = metaValue(entry, def.field || def.label);
        if (!value || seen[value]) return;
        seen[value] = true;
        values.push(value);
      });
      values.sort(function (a, b) { return a.localeCompare(b, 'it'); });
      return { id: def.id || slugify(def.label), label: def.label, field: def.field || def.label, values: values };
    }).filter(function (filter) { return filter.values.length > 0; });
  }

  function filterEntries(entries, state, filters) {
    var query = String((state && state.q) || '').trim().toLowerCase();
    var active = (state && state.filters) || {};
    return entries.filter(function (entry) {
      if (query && (entry.searchText || '').indexOf(query) < 0) return false;
      for (var i = 0; i < filters.length; i++) {
        var wanted = active[filters[i].id];
        if (!wanted) continue;
        if (metaValue(entry, filters[i].field) !== wanted) return false;
      }
      return true;
    });
  }

  /* ── Hash ─────────────────────────────────────────────────── */

  function parseHash(prefix) {
    var raw = String(global.location.hash || '').replace(/^#\/?/, '');
    if (!raw) return { tab: '', section: '', entry: '' };
    var parts = raw.split('/').filter(Boolean).map(function (part) {
      try { return decodeURIComponent(part); } catch (e) { return part; }
    });
    var first = String(prefix || '').toLowerCase();
    if (parts.length && parts[0].toLowerCase() === first) parts.shift();
    return { tab: parts[0] || '', section: parts[1] || '', entry: parts[0] || '' };
  }

  function writeHash(prefix, values) {
    var parts = [prefix].concat(values || []).filter(Boolean);
    var hash = parts.length ? '#' + parts.map(encodeURIComponent).join('/') : '';
    var url = global.location.pathname + global.location.search + hash;
    if (global.location.hash === hash) return;
    try { global.history.replaceState(null, '', url); } catch (e) { global.location.hash = hash; }
  }

  function clearHash() {
    try { global.history.replaceState(null, '', global.location.pathname + global.location.search); } catch (e) { /* noop */ }
  }

  /* ── Markup ───────────────────────────────────────────────── */

  /* Tinta del badge derivata dall'etichetta: gli stessi campi (Fonte,
     Livello, Allineamento…) restano dello stesso colore anche quando
     l'Admin li rinomina. */
  var BADGE_TONES = ['', 'is-copper', 'is-teal', 'is-violet'];

  function badgeTone(label) {
    var text = String(label || '').toLowerCase();
    var hash = 0;
    for (var i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) % 9973;
    return BADGE_TONES[hash % BADGE_TONES.length];
  }

  function metaBadges(entry, skip) {
    return entry.meta
      .filter(function (meta) {
        return !skip || meta.label.toLowerCase() !== String(skip).toLowerCase();
      })
      .slice(0, 4)
      .map(function (meta) {
        var tone = badgeTone(meta.label);
        return '<span class="exp-badge' + (tone ? ' ' + tone : '') + '"><b>' + esc(meta.label) + '</b> ' + esc(cleanMetaValue(meta.value)) + '</span>';
      })
      .join('');
  }

  function heroHtml(entry, cfg, className) {
    if (!cfg.showHero || !entry.image || !entry.image.src) return '';
    var position = entry.image.position ? ' style="object-position:' + attr(entry.image.position) + '"' : '';
    var img = global.arcPicture
      ? global.arcPicture(entry.image.src, {
          alt: entry.title,
          className: 'exp-hero-img',
          sizes: '(max-width: 900px) 100vw, 1280px',
          attrs: position.trim()
        })
      : '<img src="' + attr(entry.image.src) + '" alt="' + attr(entry.title) + '" loading="lazy" decoding="async"' + position + '>';
    return '<figure class="' + className + '">' + img + '</figure>';
  }

  function detailBody(entry, cfg) {
    if (entry.fields && entry.fields.length) {
      return (
        '<dl class="exp-fields">' +
        entry.fields
          .map(function (field) {
            return '<div><dt>' + esc(field.label) + '</dt><dd>' + renderMd(field.value) + '</dd></div>';
          })
          .join('') +
        '</dl>'
      );
    }
    var body = cfg.showHero && entry.image && entry.image.src ? stripFirstImage(entry.body) : entry.body;
    if (cfg.detailStyle === 'lavoro') {
      body = body.replace(/^\s*```[a-z]*\s*$/gim, '').replace(/^\s*```\s*$/gim, '');
    }
    return '<div class="exp-rich">' + renderMd(body) + '</div>';
  }

  function detailHtml(entry, cfg, options) {
    var opts = options || {};
    if (!entry) return '<div class="exp-empty">Nessuna scheda disponibile.</div>';
    var badges = opts.badges === false ? '' : metaBadges(entry, opts.hideMeta);
    return (
      '<article class="exp-detail-inner" aria-live="polite">' +
      (opts.back === false ? '' : '<button class="exp-back" type="button" data-exp-action="back">← Torna alla lista</button>') +
      '<header class="exp-detail-head">' +
      '<div><span class="exp-eyebrow">' + esc(cfg.label || 'Scheda') + '</span>' +
      '<h2 class="exp-title">' + esc(entry.title) + '</h2>' +
      (badges ? '<div class="exp-badges">' + badges + '</div>' : '') +
      '</div></header>' +
      heroHtml(entry, cfg, 'exp-hero') +
      detailBody(entry, cfg) +
      '</article>'
    );
  }

  function entryText(entry) {
    var meta = entry.meta && entry.meta[0] ? cleanMetaValue(entry.meta[0].value) : '';
    return '<span class="exp-item-title">' + esc(entry.title) + '</span>' +
      (meta ? '<span class="exp-item-meta">' + esc(meta) + '</span>' : '');
  }

  function filterBar(filters, state) {
    if (!filters.length) return '';
    return (
      '<div class="exp-filters" role="group" aria-label="Filtri rapidi">' +
      filters
        .map(function (filter) {
          return (
            '<div class="exp-filter-group" data-filter-group="' + attr(filter.id) + '">' +
            '<span class="exp-filter-label">' + esc(filter.label) + '</span>' +
            '<button class="exp-pill' + (!state.filters[filter.id] ? ' is-active' : '') + '" type="button" data-filter="' + attr(filter.id) + '" data-value="">Tutti</button>' +
            filter.values
              .map(function (value) {
                return (
                  '<button class="exp-pill' + (state.filters[filter.id] === value ? ' is-active' : '') + '" type="button" data-filter="' + attr(filter.id) + '" data-value="' + attr(value) + '">' +
                  esc(value) +
                  '</button>'
                );
              })
              .join('') +
            '</div>'
          );
        })
        .join('') +
      '</div>'
    );
  }

  function toolbar(cfg, filters, state, placeholder) {
    return (
      '<div class="exp-toolbar">' +
      (cfg.search
        ? '<label class="exp-search"><span class="exp-search-icon" aria-hidden="true">⌕</span>' +
          '<input type="search" value="' + attr(state.q || '') + '" placeholder="' + attr(placeholder || 'Cerca…') + '" aria-label="Cerca" data-exp-search></label>'
        : '') +
      filterBar(filters, state) +
      '</div>'
    );
  }

  function groupList(entries, cfg, filters) {
    if (cfg.groupBy) {
      var filter = null;
      for (var i = 0; i < filters.length; i++) {
        if (filters[i].id === cfg.groupBy || filters[i].field === cfg.groupBy || filters[i].label === cfg.groupBy) filter = filters[i];
      }
      var map = new Map();
      entries.forEach(function (entry) {
        var key = filter ? metaValue(entry, filter.field) : '';
        key = key || 'Altre schede';
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(entry);
      });
      return Array.from(map.entries())
        .sort(function (a, b) { return a[0].localeCompare(b[0], 'it'); })
        .map(function (pair) {
          return '<div class="exp-group"><div class="exp-group-title">' + esc(pair[0]) + '<span>' + pair[1].length + '</span></div>' +
            pair[1].map(listButton).join('') + '</div>';
        })
        .join('');
    }
    return entries.map(listButton).join('');
  }

  function listButton(entry) {
    return (
      '<button class="exp-item" type="button" data-entry="' + attr(entry.slug) + '" role="option">' +
      '<span class="exp-item-dot" aria-hidden="true"></span>' +
      entryText(entry) +
      '</button>'
    );
  }

  /* ── Master-detail ────────────────────────────────────────── */

  function buildMasterDetail(md, cfg, ctx) {
    var parsed = parseEntries(md, cfg);
    var filters = buildFilters(parsed.entries, cfg);
    var initial = findEntry(parsed.entries, parseHash(ctx.prefix).entry);
    var state = {
      q: '',
      filters: {},
      active: initial ? initial.slug : (parsed.entries[0] ? parsed.entries[0].slug : ''),
      view: initial ? 'detail' : 'list'
    };
    var html =
      '<div class="exp exp-master" data-mode="master-detail" data-view="' + state.view + '">' +
      (parsed.intro ? '<div class="exp-intro">' + renderMd(stripLeadingH1(parsed.intro)) + '</div>' : '') +
      toolbar(cfg, filters, state, 'Cerca ' + (cfg.plural || 'schede') + '…') +
      '<div class="exp-master-grid">' +
      '<aside class="exp-sidebar" aria-label="Elenco delle schede">' +
      '<div class="exp-sidebar-count" data-exp-count></div>' +
      '<div class="exp-list" role="listbox" data-exp-list>' + groupList(parsed.entries, cfg, filters) + '</div>' +
      '<div class="exp-empty" data-exp-empty hidden>Nessuna scheda corrisponde alla ricerca.</div>' +
      '</aside>' +
      '<section class="exp-detail" data-exp-detail>' + detailHtml(findEntry(parsed.entries, state.active), cfg) + '</section>' +
      '</div></div>';
    return { mode: 'master-detail', config: cfg, prefix: ctx.prefix, html: html, data: parsed, filters: filters, state: state };
  }

  function findEntry(entries, value) {
    if (!value) return null;
    var wanted = String(value).toLowerCase();
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].slug === wanted || entries[i].slug.toLowerCase() === wanted) return entries[i];
    }
    return null;
  }

  function mountMasterDetail(root, built) {
    var state = built.state;
    var filters = built.filters;
    var entries = built.data.entries;
    var list = root.querySelector('[data-exp-list]');
    var count = root.querySelector('[data-exp-count]');
    var empty = root.querySelector('[data-exp-empty]');
    var detail = root.querySelector('[data-exp-detail]');
    var search = root.querySelector('[data-exp-search]');

    function visible() {
      return filterEntries(entries, state, filters);
    }

    function paintList() {
      var shown = visible();
      if (list) list.innerHTML = groupList(shown, built.config, filters);
      if (count) {
        count.textContent = shown.length + ' ' + (shown.length === 1 ? 'scheda' : built.config.plural || 'schede');
      }
      if (empty) empty.hidden = shown.length > 0;
      Array.prototype.forEach.call(root.querySelectorAll('[data-entry]'), function (button) {
        var isActive = button.getAttribute('data-entry') === state.active;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
    }

    function paintDetail() {
      var entry = findEntry(entries, state.active) || null;
      if (detail) detail.innerHTML = detailHtml(entry, built.config);
      root.setAttribute('data-view', state.view);
    }

    function select(slug) {
      state.active = slug;
      state.view = 'detail';
      paintList();
      paintDetail();
      writeHash(built.prefix, [slug]);
      var current = root.querySelector('[data-entry="' + slug + '"]');
      if (current) current.classList.add('is-active');
    }

    function paintAll() {
      if (state.active && !findEntry(visible(), state.active)) {
        var shown = visible();
        state.active = shown[0] ? shown[0].slug : '';
      }
      paintList();
      paintDetail();
    }

    root.addEventListener('click', function (event) {
      var filter = event.target.closest('[data-filter]');
      if (filter) {
        var id = filter.getAttribute('data-filter');
        var value = filter.getAttribute('data-value') || '';
        state.filters[id] = value;
        Array.prototype.forEach.call(root.querySelectorAll('[data-filter="' + id + '"]'), function (button) {
          button.classList.toggle('is-active', (button.getAttribute('data-value') || '') === value);
        });
        paintAll();
        return;
      }
      var item = event.target.closest('[data-entry]');
      if (item) {
        select(item.getAttribute('data-entry'));
        return;
      }
      var action = event.target.closest('[data-exp-action]');
      if (action && action.getAttribute('data-exp-action') === 'back') {
        state.view = 'list';
        paintDetail();
        clearHash();
        if (search) search.focus();
      }
    });

    if (search) {
      search.addEventListener('input', function () {
        state.q = search.value;
        paintAll();
      });
    }

    var onHash = function () {
      if (!root.isConnected) {
        global.removeEventListener('hashchange', onHash);
        return;
      }
      var entry = findEntry(entries, parseHash(built.prefix).entry);
      if (entry) {
        state.active = entry.slug;
        state.view = 'detail';
        paintAll();
      }
    };
    global.addEventListener('hashchange', onHash);

    paintAll();
  }

  /* ── Gruppi + schede (classi → sottoclassi) ───────────────── */

  /* Campo su cui raggruppare: è il `groupBy` della pagina, che di solito
     è anche il nome di un filtro (es. “Classe”). */
  function groupField(cfg, filters) {
    if (!cfg.groupBy) return '';
    for (var i = 0; i < filters.length; i++) {
      var filter = filters[i];
      if (filter.id === cfg.groupBy || filter.field === cfg.groupBy || filter.label === cfg.groupBy) return filter.field;
    }
    return cfg.groupBy;
  }

  function groupEntries(entries, cfg, filters) {
    var field = groupField(cfg, filters);
    var fallback = cfg.groupPlural ? 'Altre ' + cfg.groupPlural : 'Altre schede';
    var map = new Map();
    entries.forEach(function (entry) {
      var label = (field && metaValue(entry, field)) || fallback;
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(entry);
    });
    return Array.from(map.keys())
      .sort(function (a, b) { return a.localeCompare(b, 'it'); })
      .map(function (label) {
        return { key: slugify(label), label: label, entries: map.get(label) };
      });
  }

  function buildGroupTabs(md, cfg, ctx) {
    var parsed = parseEntries(md, cfg);
    var filters = buildFilters(parsed.entries, cfg);
    var field = groupField(cfg, filters);
    var groups = groupEntries(parsed.entries, cfg, filters);
    var initial = findEntry(parsed.entries, parseHash(ctx.prefix).entry);
    var startGroup = groups[0] ? groups[0].key : '';
    if (initial) {
      groups.forEach(function (group) {
        if (findEntry(group.entries, initial.slug)) startGroup = group.key;
      });
    }
    var state = {
      q: '',
      filters: {},
      group: startGroup,
      active: initial ? initial.slug : (groups[0] && groups[0].entries[0] ? groups[0].entries[0].slug : '')
    };
    /* Il filtro che coincide col raggruppamento è già la colonna di
       sinistra: ripeterlo come pillola sarebbe solo rumore. */
    var pills = filters.filter(function (filter) {
      return filter.field !== field && filter.label !== cfg.groupBy;
    });
    var plural = cfg.plural || 'schede';
    var groupPlural = cfg.groupPlural || 'gruppi';
    var html =
      '<div class="exp exp-group-tabs" data-mode="group-tabs">' +
      (parsed.intro ? '<div class="exp-intro">' + renderMd(stripLeadingH1(parsed.intro)) + '</div>' : '') +
      (pills.length ? '<div class="exp-toolbar">' + filterBar(pills, state) + '</div>' : '') +
      '<div class="exp-gt-grid">' +
      '<aside class="exp-gt-side">' +
      '<label class="exp-search exp-gt-search"><span class="exp-search-icon" aria-hidden="true">⌕</span>' +
      '<input type="search" value="" placeholder="Cerca ' + attr(plural) + '…" aria-label="Cerca" data-exp-search></label>' +
      '<div class="exp-sidebar-count" data-exp-count>' +
      groups.length + ' ' + groupPlural + ' · ' + parsed.entries.length + ' ' + plural +
      '</div>' +
      '<div class="exp-gt-classes" role="listbox" aria-label="' + attr(groupPlural) + '" data-exp-groups></div>' +
      '<div class="exp-empty" data-exp-empty hidden>Nessuna scheda corrisponde alla ricerca.</div>' +
      '</aside>' +
      '<section class="exp-gt-main">' +
      '<header class="exp-gt-head">' +
      '<div><span class="exp-eyebrow">' + esc(cfg.groupBy || 'Gruppo') + '</span>' +
      '<h2 class="exp-gt-title" data-exp-group-title></h2></div>' +
      '<span class="exp-gt-meta" data-exp-group-meta></span>' +
      '</header>' +
      '<div class="exp-gt-tabs" role="tablist" data-exp-tabs></div>' +
      '<div class="exp-gt-body" data-exp-detail></div>' +
      '</section></div></div>';
    return {
      mode: 'group-tabs',
      config: cfg,
      prefix: ctx.prefix,
      html: html,
      data: parsed,
      filters: filters,
      state: state
    };
  }

  function mountGroupTabs(root, built) {
    var cfg = built.config;
    var filters = built.filters;
    var entries = built.data.entries;
    var field = groupField(cfg, filters);
    var state = built.state;
    var plural = cfg.plural || 'schede';
    var groupPlural = cfg.groupPlural || 'gruppi';
    var listEl = root.querySelector('[data-exp-groups]');
    var countEl = root.querySelector('[data-exp-count]');
    var empty = root.querySelector('[data-exp-empty]');
    var titleEl = root.querySelector('[data-exp-group-title]');
    var metaEl = root.querySelector('[data-exp-group-meta]');
    var tabsEl = root.querySelector('[data-exp-tabs]');
    var detail = root.querySelector('[data-exp-detail]');
    var search = root.querySelector('[data-exp-search]');

    function visible() {
      return filterEntries(entries, state, filters);
    }

    function currentGroup(groups) {
      var current = null;
      groups.forEach(function (group) {
        if (group.key === state.group) current = group;
      });
      return current;
    }

    function paint() {
      var shown = visible();
      var groups = groupEntries(shown, cfg, filters);
      if (!currentGroup(groups)) state.group = groups[0] ? groups[0].key : '';
      var current = currentGroup(groups);
      var listed = current ? current.entries : [];
      if (!findEntry(listed, state.active)) state.active = listed[0] ? listed[0].slug : '';

      if (listEl) {
        listEl.innerHTML = groups
          .map(function (group) {
            var isActive = group.key === state.group;
            return (
              '<button class="exp-gt-class' + (isActive ? ' is-active' : '') + '" type="button" role="option"' +
              ' aria-selected="' + isActive + '" data-group="' + attr(group.key) + '">' +
              '<span class="exp-gt-class-name">' + esc(group.label) + '</span>' +
              '<span class="exp-gt-class-count">' + group.entries.length + '</span>' +
              '</button>'
            );
          })
          .join('');
      }
      if (countEl) {
        countEl.textContent =
          groups.length + ' ' + (groups.length === 1 ? String(cfg.groupBy || 'gruppo').toLowerCase() : groupPlural) +
          ' · ' +
          shown.length + ' ' + (shown.length === 1 ? String(cfg.label || 'scheda').toLowerCase() : plural);
      }
      if (empty) empty.hidden = groups.length > 0;
      if (titleEl) titleEl.textContent = current ? current.label : '';
      if (metaEl) {
        metaEl.textContent = current
          ? listed.length + ' ' + (listed.length === 1 ? cfg.label || 'scheda' : plural)
          : '';
      }
      if (tabsEl) {
        tabsEl.innerHTML = listed
          .map(function (entry) {
            var isActive = entry.slug === state.active;
            return (
              '<button class="exp-gt-tab' + (isActive ? ' is-active' : '') + '" type="button" role="tab"' +
              ' aria-selected="' + isActive + '" data-entry="' + attr(entry.slug) + '">' +
              esc(entry.title) +
              '</button>'
            );
          })
          .join('');
      }
      if (detail) {
        /* La classe è già il titolo della colonna: i badge qui
           ripeterebbero il contesto (o pescherebbero voci di elenco). */
        detail.innerHTML = detailHtml(findEntry(listed, state.active), cfg, { back: false, badges: false });
      }
    }

    function selectEntry(slug) {
      var entry = findEntry(entries, slug);
      if (!entry) return;
      state.active = entry.slug;
      if (field) {
        var label = metaValue(entry, field);
        if (label) state.group = slugify(label);
      }
      paint();
      writeHash(built.prefix, [entry.slug]);
    }

    function selectGroup(key) {
      var groups = groupEntries(visible(), cfg, filters);
      var group = null;
      groups.forEach(function (item) {
        if (item.key === key) group = item;
      });
      if (!group) return;
      state.group = group.key;
      state.active = group.entries[0] ? group.entries[0].slug : '';
      paint();
      if (state.active) writeHash(built.prefix, [state.active]);
      else clearHash();
    }

    root.addEventListener('click', function (event) {
      var filter = event.target.closest('[data-filter]');
      if (filter) {
        var id = filter.getAttribute('data-filter');
        var value = filter.getAttribute('data-value') || '';
        state.filters[id] = value;
        Array.prototype.forEach.call(root.querySelectorAll('[data-filter="' + id + '"]'), function (button) {
          button.classList.toggle('is-active', (button.getAttribute('data-value') || '') === value);
        });
        paint();
        return;
      }
      var group = event.target.closest('[data-group]');
      if (group) {
        selectGroup(group.getAttribute('data-group'));
        return;
      }
      var tab = event.target.closest('[data-entry]');
      if (tab) selectEntry(tab.getAttribute('data-entry'));
    });

    if (search) {
      search.addEventListener('input', function () {
        state.q = search.value;
        paint();
      });
    }

    var onHash = function () {
      if (!root.isConnected) {
        global.removeEventListener('hashchange', onHash);
        return;
      }
      var entry = findEntry(entries, parseHash(built.prefix).entry);
      if (entry) selectEntry(entry.slug);
    };
    global.addEventListener('hashchange', onHash);

    paint();
  }

  /* ── Tabs + ToC sticky ────────────────────────────────────── */

  function tabDefinitions(sections, cfg) {
    var defs = cfg.tabs.length ? cfg.tabs.map(function (tab, index) {
      return { id: tab.id || slugify(tab.label), label: tab.label, sections: Array.isArray(tab.sections) ? tab.sections : [], index: index };
    }) : [{ id: 'contenuto', label: 'Contenuto', sections: [], index: 0 }];
    var assigned = {};
    sections.forEach(function (section) {
      var owner = null;
      for (var i = 0; i < defs.length; i++) {
        if (defs[i].sections.some(function (name) {
          var a = String(name).toLowerCase();
          var b = section.title.toLowerCase();
          return a === b || b.indexOf(a) === 0;
        })) { owner = defs[i]; break; }
      }
      if (!owner && cfg.unassigned) {
        owner = defs[defs.length - 1];
      }
      if (!owner) return;
      assigned[owner.id] = assigned[owner.id] || [];
      assigned[owner.id].push(section);
    });
    return defs.filter(function (def) { return (assigned[def.id] || []).length > 0; });
  }

  function sectionHtml(section) {
    return (
      '<section class="exp-tab-section" id="' + attr(section.id) + '" data-exp-section="' + attr(section.slug) + '">' +
      '<h2 class="exp-section-title">' + esc(section.title) + '</h2>' +
      '<div class="exp-rich">' + renderMd(section.body) + '</div>' +
      '</section>'
    );
  }

  function tocHtml(sections) {
    if (!sections.length) return '';
    return (
      '<nav class="exp-toc" aria-label="Indice della scheda">' +
      '<div class="exp-toc-title">In questa scheda</div>' +
      sections.map(function (section) {
        return '<a href="#' + attr(section.slug) + '" data-toc="' + attr(section.slug) + '">' + esc(section.title) + '</a>';
      }).join('') +
      '</nav>'
    );
  }

  function buildTabs(md, cfg, ctx) {
    var level = cfg.entryLevel === 1 ? 1 : cfg.entryLevel === 3 ? 3 : 2;
    var parsed = splitSections(md, level);
    var sections = parsed.entries;
    var defs = tabDefinitions(sections, cfg);
    if (!defs.length) defs = [{ id: 'contenuto', label: 'Contenuto', sections: [] }];
    var byTab = {};
    defs.forEach(function (def) { byTab[def.id] = []; });
    sections.forEach(function (section) {
      var owner = defs[defs.length - 1];
      defs.forEach(function (def) {
        if (def.sections.some(function (name) {
          var a = String(name).toLowerCase();
          var b = section.title.toLowerCase();
          return a === b || b.indexOf(a) === 0;
        })) owner = def;
      });
      byTab[owner.id].push(section);
    });
    var hash = parseHash(ctx.prefix);
    var active = defs.find(function (def) { return def.id === hash.tab; }) || defs[0];
    var html =
      '<div class="exp exp-tabs" data-mode="tabs">' +
      (parsed.intro ? '<div class="exp-intro">' + renderMd(stripLeadingH1(parsed.intro)) + '</div>' : '') +
      '<div class="exp-tabbar" role="tablist" aria-label="Sezioni della pagina">' +
      defs.map(function (def) {
        return '<button class="exp-tab' + (def.id === active.id ? ' is-active' : '') + '" type="button" role="tab" data-tab="' + attr(def.id) + '" aria-selected="' + (def.id === active.id ? 'true' : 'false') + '">' + esc(def.label) + '</button>';
      }).join('') +
      '</div>' +
      '<div class="exp-tab-layout">' +
      '<article class="exp-tab-body" data-exp-tab-body></article>' +
      '<aside class="exp-toc-wrap" data-exp-toc></aside>' +
      '</div></div>';
    return { mode: 'tabs', config: cfg, prefix: ctx.prefix, html: html, defs: defs, byTab: byTab, state: { tab: active.id, section: hash.section } };
  }

  function mountTabs(root, built) {
    var state = built.state;
    var body = root.querySelector('[data-exp-tab-body]');
    var toc = root.querySelector('[data-exp-toc]');
    var observer = null;

    function paint() {
      var sections = built.byTab[state.tab] || [];
      if (body) body.innerHTML = sections.map(sectionHtml).join('');
      if (toc) {
        toc.innerHTML = tocHtml(sections);
        Array.prototype.forEach.call(toc.querySelectorAll('[data-toc]'), function (link) {
          link.addEventListener('click', function (event) {
            event.preventDefault();
            var target = root.querySelector('[data-exp-section="' + link.getAttribute('data-toc') + '"]');
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            writeHash(built.prefix, [state.tab, link.getAttribute('data-toc')]);
          });
        });
      }
      Array.prototype.forEach.call(root.querySelectorAll('[data-tab]'), function (button) {
        var active = button.getAttribute('data-tab') === state.tab;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      setupSpy(sections);
      if (state.section) {
        var target = root.querySelector('[data-exp-section="' + state.section + '"]');
        if (target) target.scrollIntoView({ behavior: 'auto', block: 'start' });
        state.section = '';
      }
    }

    function setupSpy(sections) {
      if (observer) observer.disconnect();
      if (!('IntersectionObserver' in global) || !sections.length) return;
      var links = {};
      Array.prototype.forEach.call(root.querySelectorAll('[data-toc]'), function (link) {
        links[link.getAttribute('data-toc')] = link;
      });
      observer = new IntersectionObserver(function (items) {
        items.forEach(function (item) {
          if (!item.isIntersecting) return;
          var slug = item.target.getAttribute('data-exp-section');
          Object.keys(links).forEach(function (key) {
            links[key].classList.toggle('is-active', key === slug);
          });
        });
      }, { rootMargin: '-90px 0px -65% 0px', threshold: 0 });
      sections.forEach(function (section) {
        var el = root.querySelector('[data-exp-section="' + section.slug + '"]');
        if (el) observer.observe(el);
      });
    }

    root.addEventListener('click', function (event) {
      var tab = event.target.closest('[data-tab]');
      if (!tab) return;
      state.tab = tab.getAttribute('data-tab');
      writeHash(built.prefix, [state.tab]);
      paint();
      var active = root.querySelector('[data-tab="' + state.tab + '"]');
      if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });

    var onHash = function () {
      if (!root.isConnected) {
        global.removeEventListener('hashchange', onHash);
        return;
      }
      var hash = parseHash(built.prefix);
      if (hash.tab && built.defs.some(function (def) { return def.id === hash.tab; })) {
        state.tab = hash.tab;
        state.section = hash.section;
        paint();
      }
    };
    global.addEventListener('hashchange', onHash);
    paint();
  }

  /* ── Drawer ───────────────────────────────────────────────── */

  function tileHtml(entry) {
    var position = entry.image && entry.image.position ? ' style="object-position:' + attr(entry.image.position) + '"' : '';
    var image = entry.image && entry.image.src
      ? (global.arcPicture
          ? global.arcPicture(entry.image.src, {
              alt: '',
              className: 'exp-tile-img',
              sizes: '(max-width: 900px) 45vw, 300px',
              attrs: position.trim()
            })
          : '<img src="' + attr(entry.image.src) + '" alt="" loading="lazy" decoding="async"' + position + '>')
      : '<span class="exp-tile-glyph" aria-hidden="true">' + esc((entry.title || '?').charAt(0)) + '</span>';
    /* Le tessere mostrano le stesse etichette (tipo, fonte, classe) che
       il cassetto ripete come badge: si riconosce la voce già dalla griglia. */
    var tags = (entry.meta || [])
      .slice(0, 2)
      .map(function (meta) {
        return '<span class="exp-tile-tag">' + esc(cleanMetaValue(meta.value)) + '</span>';
      })
      .join('');
    return (
      '<button class="exp-tile" type="button" data-entry="' + attr(entry.slug) + '" aria-label="Apri ' + attr(entry.title) + '">' +
      '<span class="exp-tile-media' + (entry.image && entry.image.src ? '' : ' is-empty') + '">' + image + '</span>' +
      '<span class="exp-tile-body"><span class="exp-tile-title">' + esc(entry.title) + '</span>' +
      (tags ? '<span class="exp-tile-tags">' + tags + '</span>' : '') +
      '</span></button>'
    );
  }

  function buildDrawer(md, cfg, ctx) {
    var parsed = cfg.source === 'table' ? parseTableEntries(md) : parseEntries(md, cfg);
    var entries = parsed.entries;
    var chapters = [];
    if (cfg.entityHeading) {
      chapters = entries.filter(function (entry) { return !entry.entity; });
      entries = entries.filter(function (entry) { return entry.entity; });
    }
    var filters = buildFilters(entries, cfg);
    var initial = findEntry(entries, parseHash(ctx.prefix).entry);
    var state = { q: '', filters: {}, active: initial ? initial.slug : '' };
    var html =
      '<div class="exp exp-drawer-mode" data-mode="drawer">' +
      (parsed.intro ? '<div class="exp-intro">' + renderMd(stripLeadingH1(parsed.intro)) + '</div>' : '') +
      (chapters.length
        ? '<div class="exp-chapters">' + chapters.map(function (chapter) {
            return '<details class="exp-chapter"><summary>' + esc(chapter.title) + '</summary><div class="exp-rich">' + renderMd(chapter.body) + '</div></details>';
          }).join('') + '</div>'
        : '') +
      toolbar(cfg, filters, state, 'Cerca nel catalogo…') +
      '<div class="exp-grid" data-exp-grid>' + entries.map(tileHtml).join('') + '</div>' +
      '<div class="exp-empty" data-exp-empty hidden>Nessuna voce corrisponde alla ricerca.</div>' +
      '<div class="exp-drawer-backdrop" data-exp-close hidden></div>' +
      '<aside class="exp-drawer" role="dialog" aria-modal="true" aria-label="Dettaglio" hidden>' +
      '<button class="exp-drawer-close" type="button" data-exp-close aria-label="Chiudi dettaglio">×</button>' +
      '<div class="exp-drawer-content" data-exp-drawer-content></div>' +
      '</aside></div>';
    return { mode: 'drawer', config: cfg, prefix: ctx.prefix, html: html, data: { intro: parsed.intro, entries: entries }, filters: filters, state: state };
  }

  function mountDrawer(root, built) {
    var entries = built.data.entries;
    var state = built.state;
    var grid = root.querySelector('[data-exp-grid]');
    var empty = root.querySelector('[data-exp-empty]');
    var drawer = root.querySelector('.exp-drawer');
    var backdrop = root.querySelector('.exp-drawer-backdrop');
    var content = root.querySelector('[data-exp-drawer-content]');
    var lastFocus = null;
    var closeTimer = null;
    var mount = null;

    /* Il cassetto esce dal contenuto della pagina: #main è uno stacking
       context e un ancestor animato può ritagliare i fixed. Portandolo
       nel body copre davvero la viewport (topbar e bottom nav comprese). */
    if (drawer && backdrop) {
      Array.prototype.forEach.call(
        document.querySelectorAll('body > .exp-drawer-mount'),
        function (stale) { stale.remove(); }
      );
      mount = document.createElement('div');
      mount.className = 'exp-drawer-mount';
      document.body.appendChild(mount);
      mount.appendChild(backdrop);
      mount.appendChild(drawer);
    }

    function paintGrid() {
      var shown = filterEntries(entries, state, built.filters);
      if (grid) grid.innerHTML = shown.map(tileHtml).join('');
      if (empty) empty.hidden = shown.length > 0;
    }

    /* Il cassetto resta nel DOM per la durata dell'animazione di uscita
       (200ms, la stessa del CSS) e solo dopo riceve [hidden]. */
    function finishClose() {
      closeTimer = null;
      if (drawer) {
        drawer.hidden = true;
        drawer.classList.remove('is-closing');
        drawer.setAttribute('aria-hidden', 'true');
      }
      if (backdrop) {
        backdrop.hidden = true;
        backdrop.classList.remove('is-closing');
      }
    }

    function open(slug, updateHash) {
      var entry = findEntry(entries, slug);
      if (!entry) return;
      state.active = entry.slug;
      lastFocus = document.activeElement;
      if (content) content.innerHTML = detailHtml(entry, built.config).replace(' data-exp-action="back"', '');
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
      if (drawer) {
        drawer.classList.remove('is-closing');
        drawer.hidden = false;
        drawer.classList.add('is-open');
        drawer.setAttribute('aria-hidden', 'false');
        var close = drawer.querySelector('[data-exp-close]');
        if (close) close.focus();
      }
      if (backdrop) {
        backdrop.classList.remove('is-closing');
        backdrop.hidden = false;
      }
      root.classList.add('exp-drawer-open');
      if (updateHash) writeHash(built.prefix, [entry.slug]);
    }

    function close(updateHash) {
      state.active = '';
      if (drawer && !drawer.hidden) {
        drawer.classList.remove('is-open');
        drawer.classList.add('is-closing');
        if (backdrop) {
          backdrop.hidden = false;
          backdrop.classList.add('is-closing');
        }
        if (closeTimer) clearTimeout(closeTimer);
        closeTimer = setTimeout(finishClose, 200);
      } else {
        finishClose();
      }
      root.classList.remove('exp-drawer-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
      if (updateHash) clearHash();
    }

    /* Sfondo e × vivono fuori da root: listener diretti. */
    if (backdrop) {
      backdrop.addEventListener('click', function () { close(true); });
    }
    if (drawer) {
      var closeBtn = drawer.querySelector('[data-exp-close]');
      if (closeBtn) closeBtn.addEventListener('click', function () { close(true); });
    }

    root.addEventListener('click', function (event) {
      var closeEl = event.target.closest('[data-exp-close]');
      if (closeEl) {
        close(true);
        return;
      }
      var filter = event.target.closest('[data-filter]');
      if (filter) {
        var id = filter.getAttribute('data-filter');
        var value = filter.getAttribute('data-value') || '';
        state.filters[id] = value;
        Array.prototype.forEach.call(root.querySelectorAll('[data-filter="' + id + '"]'), function (button) {
          button.classList.toggle('is-active', (button.getAttribute('data-value') || '') === value);
        });
        paintGrid();
        return;
      }
      var tile = event.target.closest('[data-entry]');
      if (tile) open(tile.getAttribute('data-entry'), true);
    });

    var search = root.querySelector('[data-exp-search]');
    if (search) {
      search.addEventListener('input', function () {
        state.q = search.value;
        paintGrid();
      });
    }

    var onKeyDown = function (event) {
      if (event.key === 'Escape' && drawer && !drawer.hidden) close(true);
    };
    document.addEventListener('keydown', onKeyDown);

    /* Il cassetto vive nel body: quando la pagina viene sostituita o
       nascosta (torna alla home) va rimosso, altrimenti resterebbe
       sopra la pagina nuova. L'IntersectionObserver scatta sia per un
       nodo staccato sia per un ancestor con display:none. */
    function detach() {
      document.removeEventListener('keydown', onKeyDown);
      if (closeTimer) clearTimeout(closeTimer);
      if (mount) mount.remove();
      mount = null;
    }

    if (mount && typeof IntersectionObserver !== 'undefined') {
      var watcher = new IntersectionObserver(function (entries) {
        var last = entries[entries.length - 1];
        if (!last || last.isIntersecting) return;
        watcher.disconnect();
        detach();
      });
      watcher.observe(root);
    }

    var onHash = function () {
      if (!root.isConnected) {
        global.removeEventListener('hashchange', onHash);
        return;
      }
      var entry = findEntry(entries, parseHash(built.prefix).entry);
      if (entry) open(entry.slug, false);
      else close(false);
    };
    global.addEventListener('hashchange', onHash);
    if (state.active) open(state.active, false);
  }

  /* ── Accordion ────────────────────────────────────────────── */

  function parseAccordion(md, cfg) {
    var groups = [];
    if (cfg.groups.length) {
      var parsed = splitSections(md, 2);
      var assigned = {};
      cfg.groups.forEach(function (group) {
        assigned[group.id || slugify(group.label)] = { id: group.id || slugify(group.label), title: group.label, intro: '', entries: [] };
      });
      parsed.entries.forEach(function (entry) {
        var target = null;
        cfg.groups.forEach(function (group) {
          if ((group.sections || []).some(function (name) {
            var a = String(name).toLowerCase();
            var b = entry.title.toLowerCase();
            return a === b || b.indexOf(a) === 0;
          })) target = group;
        });
        var key = target ? target.id || slugify(target.label) : '__other';
        if (!assigned[key]) assigned[key] = { id: key, title: target ? target.label : 'Altre sezioni', intro: '', entries: [] };
        assigned[key].entries.push(entry);
      });
      groups = Object.keys(assigned).map(function (key) { return assigned[key]; }).filter(function (group) { return group.entries.length; });
      return { intro: parsed.intro, groups: groups };
    }

    var h1 = splitSections(md, 1);
    var list = h1.entries;
    if (!list.length) {
      var h2 = splitSections(md, 2);
      return { intro: h2.intro, groups: [{ id: 'sezioni', title: '', intro: '', entries: h2.entries }] };
    }
    list.forEach(function (group) {
      var inner = splitSections(group.body, 2);
      groups.push({
        id: group.slug,
        title: group.title,
        intro: inner.intro,
        entries: inner.entries.length ? inner.entries : [{
          id: group.id,
          slug: group.slug,
          title: group.title,
          body: inner.intro,
          meta: group.meta,
          image: group.image,
          searchText: group.searchText,
          entity: true
        }]
      });
    });
    return { intro: h1.intro, groups: groups };
  }

  function buildAccordion(md, cfg, ctx) {
    var parsed = parseAccordion(md, cfg);
    var hash = parseHash(ctx.prefix);
    var html =
      '<div class="exp exp-accordion" data-mode="accordion">' +
      (parsed.intro ? '<div class="exp-intro">' + renderMd(stripLeadingH1(parsed.intro)) + '</div>' : '') +
      (cfg.search
        ? '<div class="exp-toolbar"><label class="exp-search"><span class="exp-search-icon" aria-hidden="true">⌕</span><input type="search" placeholder="Cerca una regola…" aria-label="Cerca una regola" data-exp-search></label></div>'
        : '') +
      '<div class="exp-acc" data-exp-acc>' +
      parsed.groups.map(function (group, index) {
        return (
          '<details class="exp-acc-group"' + (index === 0 ? ' open' : '') + ' data-group="' + attr(group.id) + '">' +
          '<summary><span class="exp-acc-title">' + esc(group.title || 'Regole') + '</span><span class="exp-acc-count">' + group.entries.length + '</span></summary>' +
          '<div class="exp-acc-group-body">' +
          (group.intro ? '<div class="exp-rich exp-acc-intro">' + renderMd(group.intro) + '</div>' : '') +
          group.entries.map(function (entry) {
            return (
              '<details class="exp-acc-item" id="' + attr(entry.id) + '" data-entry="' + attr(entry.slug) + '"' + (hash.entry === entry.slug ? ' open' : '') + '>' +
              '<summary><span>' + esc(entry.title) + '</span>' +
              (entry.meta && entry.meta[0] ? '<small>' + esc(cleanMetaValue(entry.meta[0].value)) + '</small>' : '') +
              '</summary><div class="exp-acc-body exp-rich">' + renderMd(entry.body || 'Contenuto in arrivo.') + '</div></details>'
            );
          }).join('') +
          '</div></details>'
        );
      }).join('') +
      '</div></div>';
    return { mode: 'accordion', config: cfg, prefix: ctx.prefix, html: html, groups: parsed.groups, state: { hash: hash } };
  }

  function mountAccordion(root, built) {
    var search = root.querySelector('[data-exp-search]');
    var groups = Array.prototype.slice.call(root.querySelectorAll('.exp-acc-group'));
    var items = Array.prototype.slice.call(root.querySelectorAll('.exp-acc-item'));
    /* Stato dei gruppi prima della ricerca: azzerare il campo riporta
       l'accordion com'era, invece di lasciare aperti solo i gruppi che
       avevano una corrispondenza. */
    var openBefore = null;

    function applySearch() {
      var q = search ? search.value.trim().toLowerCase() : '';
      if (q && !openBefore) openBefore = groups.map(function (group) { return group.open; });
      items.forEach(function (item) {
        var text = (item.textContent || '').toLowerCase();
        var match = !q || text.indexOf(q) >= 0;
        item.hidden = !match;
        if (q && match) item.open = true;
      });
      groups.forEach(function (group, index) {
        var visible = Array.prototype.some.call(group.querySelectorAll('.exp-acc-item'), function (item) { return !item.hidden; });
        group.hidden = !visible;
        if (q) group.open = visible;
        else if (openBefore) group.open = !!openBefore[index];
      });
      if (!q) openBefore = null;
    }
    if (search) search.addEventListener('input', applySearch);

    root.addEventListener('click', function (event) {
      var summary = event.target.closest('.exp-acc-item > summary');
      if (summary) {
        var item = summary.parentElement;
        writeHash(built.prefix, [item.getAttribute('data-entry')]);
      }
    });

    var target = built.state.hash.entry ? root.querySelector('.exp-acc-item[data-entry="' + built.state.hash.entry + '"]') : null;
    if (target) {
      var parent = target.parentElement;
      while (parent && parent !== root) {
        if (parent.tagName === 'DETAILS') parent.open = true;
        parent = parent.parentElement;
      }
      target.open = true;
      setTimeout(function () { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 30);
    }
  }

  /* ── API ──────────────────────────────────────────────────── */

  function build(md, rawConfig, context) {
    var cfg = normalizeConfig(rawConfig);
    var ctx = context || {};
    var prefix = cfg.hash || defaultPrefix(ctx.pageKey || '');
    ctx.prefix = prefix;
    if (cfg.mode === 'tabs') return buildTabs(md, cfg, ctx);
    if (cfg.mode === 'group-tabs') return buildGroupTabs(md, cfg, ctx);
    if (cfg.mode === 'drawer') return buildDrawer(md, cfg, ctx);
    if (cfg.mode === 'accordion') return buildAccordion(md, cfg, ctx);
    return buildMasterDetail(md, cfg, ctx);
  }

  function mount(root, built) {
    if (!root || !built) return;
    var node = root.classList && root.classList.contains('exp') ? root : root.querySelector('.exp');
    if (!node) return;
    if (built.mode === 'tabs') mountTabs(node, built);
    else if (built.mode === 'group-tabs') mountGroupTabs(node, built);
    else if (built.mode === 'drawer') mountDrawer(node, built);
    else if (built.mode === 'accordion') mountAccordion(node, built);
    else mountMasterDetail(node, built);
  }

  global.ArcExplorer = {
    build: build,
    mount: mount,
    normalizeConfig: normalizeConfig,
    parseEntries: parseEntries,
    parseTableEntries: parseTableEntries,
    parseAccordion: parseAccordion,
    splitSections: splitSections,
    buildFilters: buildFilters,
    groupEntries: groupEntries,
    filterEntries: filterEntries,
    metaValue: metaValue,
    slugify: slugify,
    modes: MODES
  };
})(window);
