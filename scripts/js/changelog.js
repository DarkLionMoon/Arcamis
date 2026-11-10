/* scripts/js/changelog.js */
window.loadChangelog = async function (container) {
  container.innerHTML = '<p class="cl-loading">Caricamento changelog…</p>';

  let entries;
  try {
    const res = await fetch('/content/changelog.json');
    if (!res.ok) throw new Error('Fetch error: ' + res.status);
    entries = await res.json();
  } catch (e) {
    container.innerHTML = `<p class="cl-error">Errore nel caricamento del changelog: ${e.message}</p>`;
    return;
  }

  if (!entries.length) {
    container.innerHTML = '<p class="cl-empty">Nessuna entry nel changelog.</p>';
    return;
  }

  // ── Build hierarchical structure ──────────────────────────────────────────
  const tree = {};

  for (const e of entries) {
    const v = String(e.versione ?? '?');
    const sv = String(e.sottoversione ?? v + '.0');
    const p = e.patch != null ? String(e.patch) : null;
    const pKey = p ?? '__none__';

    if (!tree[v]) tree[v] = {};
    if (!tree[v][sv]) tree[v][sv] = {};
    if (!Array.isArray(tree[v][sv][pKey])) tree[v][sv][pKey] = [];
    tree[v][sv][pKey].push(e);
  }

  const versions = Object.keys(tree).sort((a, b) => parseFloat(a) - parseFloat(b));

  // ── State ─────────────────────────────────────────────────────────────────
  let activeV = versions[versions.length - 1];
  let activeSV = null;
  let activeP = null;

  function getSubversions(v) {
    return Object.keys(tree[v] ?? {}).sort((a, b) => {
      const pa = a.split('.').map(Number);
      const pb = b.split('.').map(Number);
      for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
        if (diff !== 0) return diff;
      }
      return 0;
    });
  }

  function getPatches(v, sv) {
    return Object.keys(tree[v]?.[sv] ?? {})
      .filter((p) => p !== '__none__')
      .sort((a, b) => {
        const partsA = a.split(' ');
        const partsB = b.split(' ');
        const numCmp = partsA[0].localeCompare(partsB[0], undefined, { numeric: true });
        if (numCmp !== 0) return numCmp;
        return (partsA[1] ?? '').localeCompare(partsB[1] ?? '');
      });
  }

  // ── Render ────────────────────────────────────────────────────────────────
  function render() {
    const svList = getSubversions(activeV);
    if (!activeSV || !svList.includes(activeSV)) activeSV = svList[svList.length - 1];

    const patches = getPatches(activeV, activeSV);

    const hasPatch = patches.length > 0;

    if (hasPatch) {
      if (!activeP || !patches.includes(activeP)) activeP = patches[patches.length - 1];
    } else {
      activeP = null;
    }

    // Entries to show
    let visibleEntries;
    if (hasPatch && activeP) {
      const bucket = tree[activeV]?.[activeSV]?.[activeP];
      if (Array.isArray(bucket) && bucket.length) {
        visibleEntries = bucket;
      } else {
        visibleEntries = [];
        for (const sv of Object.values(tree[activeV] ?? {})) {
          const b = sv[activeP];
          if (Array.isArray(b)) visibleEntries.push(...b);
        }
      }
    } else {
      const svBucket = tree[activeV]?.[activeSV] ?? {};
      visibleEntries = Object.values(svBucket)
        .flat()
        .filter((e) => e && e.id);
    }

    container.innerHTML = '';

    // ── Layout wrapper ────────────────────────────────────────────────────────
    const layout = document.createElement('div');
    layout.className = 'cl-layout';

    // ── Sidebar ───────────────────────────────────────────────────────────────
    const sidebar = document.createElement('nav');
    sidebar.className = 'cl-sidebar';

    const sideTitle = document.createElement('div');
    sideTitle.className = 'cl-sidebar-title';
    sideTitle.textContent = 'Versione';
    sidebar.appendChild(sideTitle);

    for (const v of versions) {
      const btn = document.createElement('button');
      btn.className = 'cl-ver-btn' + (v === activeV ? ' active' : '');
      btn.textContent = 'Versione ' + v;
      btn.addEventListener('click', () => {
        activeV = v;
        activeSV = null;
        activeP = null;
        render();
      });
      sidebar.appendChild(btn);
    }

    layout.appendChild(sidebar);

    // ── Main panel ────────────────────────────────────────────────────────────
    const main = document.createElement('div');
    main.className = 'cl-main';

    // Subversion tabs
    const svTabs = document.createElement('div');
    svTabs.className = 'cl-tabs cl-tabs-sv';

    for (const sv of svList) {
      const btn = document.createElement('button');
      btn.className = 'cl-tab-btn' + (sv === activeSV ? ' active' : '');
      btn.textContent = sv;
      btn.addEventListener('click', () => {
        activeSV = sv;
        activeP = null;
        render();
      });
      svTabs.appendChild(btn);
    }
    main.appendChild(svTabs);

    // Patch tabs (second row, only if patches exist)
    if (hasPatch) {
      const pTabs = document.createElement('div');
      pTabs.className = 'cl-tabs cl-tabs-patch';

      for (const p of patches) {
        const btn = document.createElement('button');
        btn.className = 'cl-tab-btn cl-patch-btn' + (p === activeP ? ' active' : '');
        btn.textContent = p;
        btn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          activeP = p;
          render();
        });
        pTabs.appendChild(btn);
      }
      main.appendChild(pTabs);
    }

    // Entries
    const entriesWrap = document.createElement('div');
    entriesWrap.className = 'cl-entries';

    if (!visibleEntries.length) {
      const empty = document.createElement('p');
      empty.className = 'cl-empty';
      empty.textContent = 'Nessuna entry per questa versione.';
      entriesWrap.appendChild(empty);
    } else {
      for (const entry of visibleEntries) {
        const card = document.createElement('div');
        card.className = 'cl-entry-card';

        const cardHeader = document.createElement('div');
        cardHeader.className = 'cl-entry-header';

        const titleEl = document.createElement('a');
        titleEl.className = 'cl-entry-title';
        titleEl.textContent = entry.title;
        titleEl.href = '#';
        titleEl.addEventListener('click', (ev) => {
          ev.preventDefault();
          const existing = container.querySelector('.cl-inline-content');
          if (existing && existing.dataset.id === entry.id) {
            existing.remove();
            card.classList.remove('cl-entry-card--open');
            return;
          }
          if (existing) existing.remove();
          container.querySelectorAll('.cl-entry-card--open').forEach((c) => c.classList.remove('cl-entry-card--open'));
          card.classList.add('cl-entry-card--open');
          const inline = document.createElement('div');
          inline.className = 'cl-inline-content';
          inline.dataset.id = entry.id;
          card.appendChild(inline);
          try {
            const html =
              entry.content && window.mdRender
                ? window.mdRender(entry.content)
                : '<p class="cl-error">Contenuto non disponibile</p>';
            inline.innerHTML = '<div class="n-body">' + html + '</div>';
          } catch (e) {
            inline.innerHTML = '<div class="cl-error">Errore caricamento</div>';
          }
        });

        cardHeader.appendChild(titleEl);

        if (entry.date) {
          const dateEl = document.createElement('span');
          dateEl.className = 'cl-entry-date';
          dateEl.textContent = formatDate(entry.date);
          cardHeader.appendChild(dateEl);
        }

        card.appendChild(cardHeader);

        // Version badges
        const badges = document.createElement('div');
        badges.className = 'cl-entry-badges';

        if (entry.versione) badges.appendChild(makeBadge(entry.versione, 'badge-v'));
        if (entry.sottoversione) badges.appendChild(makeBadge(entry.sottoversione, 'badge-sv'));
        if (entry.patch) badges.appendChild(makeBadge(entry.patch, 'badge-p'));

        card.appendChild(badges);
        entriesWrap.appendChild(card);
      }
    }

    main.appendChild(entriesWrap);
    layout.appendChild(main);
    container.appendChild(layout);
  }

  function makeBadge(text, cls) {
    const span = document.createElement('span');
    span.className = 'cl-badge ' + cls;
    span.textContent = text;
    return span;
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  render();
};

/* Pagina Novità: tutte le patch in un unico feed, filtrabili per versione. */
window.loadNovita = async function (container) {
  container.innerHTML = '<p class="cl-loading">Caricamento novità…</p>';

  let entries;
  try {
    const res = await fetch('/content/changelog.json');
    if (!res.ok) throw new Error('Fetch error: ' + res.status);
    entries = await res.json();
  } catch (e) {
    container.innerHTML = `<p class="cl-error">Errore nel caricamento delle novità: ${e.message}</p>`;
    return;
  }

  if (!Array.isArray(entries) || !entries.length) {
    container.innerHTML = '<p class="cl-empty">Nessuna novità disponibile.</p>';
    return;
  }

  const versionOf = function (entry) {
    const patch = entry.patch !== null && entry.patch !== undefined ? String(entry.patch) : '';
    if (/^\d/.test(patch)) return patch;
    if (entry.sottoversione !== null && entry.sottoversione !== undefined && entry.sottoversione !== '')
      return String(entry.sottoversione);
    return String(entry.versione || patch || '?');
  };

  const yearOf = function (entry) {
    const match = String(entry.date || '').match(/^(\d{4})/);
    return match ? match[1] : '';
  };

  const sorted = entries.slice().sort(function (a, b) {
    const byDate = String(b.date || '').localeCompare(String(a.date || ''));
    if (byDate !== 0) return byDate;
    const byVersion = versionOf(b).localeCompare(versionOf(a), undefined, { numeric: true });
    if (byVersion !== 0) return byVersion;
    return Number(b._i || 0) - Number(a._i || 0);
  });

  const versions = [];
  sorted.forEach(function (entry) {
    const version = versionOf(entry);
    if (!versions.includes(version)) versions.push(version);
  });
  versions.sort(function (a, b) {
    return b.localeCompare(a, undefined, { numeric: true });
  });

  const years = [];
  sorted.forEach(function (entry) {
    const year = yearOf(entry);
    if (year && !years.includes(year)) years.push(year);
  });
  years.sort(function (a, b) {
    return b.localeCompare(a);
  });

  const recentIds = new Set(
    sorted
      .filter(function (entry) {
        return (
          !/cancellat/i.test(String(entry.title || '')) &&
          !/^(evento|comunicazione)$/i.test(String(entry.patch || ''))
        );
      })
      .slice(0, 3)
      .map(function (entry) {
        return entry.id;
      })
  );

  const page = document.createElement('div');
  page.className = 'nv-page';

  const toolbar = document.createElement('div');
  toolbar.className = 'nv-toolbar';

  const versionGroup = document.createElement('div');
  versionGroup.className = 'nv-filter';

  const label = document.createElement('label');
  label.htmlFor = 'nv-version-filter';
  label.textContent = 'Filtra per versione';

  const select = document.createElement('select');
  select.id = 'nv-version-filter';
  select.className = 'nv-select';

  const allOption = document.createElement('option');
  allOption.value = '';
  allOption.textContent = 'Tutte le versioni';
  select.appendChild(allOption);

  versions.forEach(function (version) {
    const option = document.createElement('option');
    option.value = version;
    option.textContent = 'Versione ' + version;
    select.appendChild(option);
  });

  versionGroup.appendChild(label);
  versionGroup.appendChild(select);

  const yearGroup = document.createElement('div');
  yearGroup.className = 'nv-filter';

  const yearLabel = document.createElement('label');
  yearLabel.htmlFor = 'nv-year-filter';
  yearLabel.textContent = 'Anno';

  const yearSelect = document.createElement('select');
  yearSelect.id = 'nv-year-filter';
  yearSelect.className = 'nv-select';

  const allYears = document.createElement('option');
  allYears.value = '';
  allYears.textContent = 'Tutti gli anni';
  yearSelect.appendChild(allYears);

  years.forEach(function (year) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  });

  yearGroup.appendChild(yearLabel);
  yearGroup.appendChild(yearSelect);

  const count = document.createElement('span');
  count.className = 'nv-count';
  count.setAttribute('aria-live', 'polite');

  toolbar.appendChild(versionGroup);
  toolbar.appendChild(yearGroup);
  toolbar.appendChild(count);

  const list = document.createElement('div');
  list.className = 'cl-entries nv-entries';

  page.appendChild(toolbar);
  page.appendChild(list);
  container.innerHTML = '';
  container.appendChild(page);

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function makeBadge(text, cls) {
    const span = document.createElement('span');
    span.className = 'cl-badge ' + cls;
    span.textContent = text;
    return span;
  }

  function renderList() {
    const versionFilter = select.value;
    const yearFilter = yearSelect.value;
    const visible = sorted.filter(function (entry) {
      return (
        (!versionFilter || versionOf(entry) === versionFilter) &&
        (!yearFilter || yearOf(entry) === yearFilter)
      );
    });

    count.textContent = visible.length + ' voci';
    list.innerHTML = '';

    if (!visible.length) {
      const empty = document.createElement('p');
      empty.className = 'cl-empty';
      empty.textContent =
        versionFilter || yearFilter ? 'Nessuna patch per questi filtri.' : 'Nessuna patch disponibile.';
      list.appendChild(empty);
      return;
    }

    visible.forEach(function (entry) {
      const card = document.createElement('article');
      card.className = 'cl-entry-card nv-entry';
      if (/cancellat/i.test(entry.title || '')) card.classList.add('nv-entry--cancelled');

      const header = document.createElement('div');
      header.className = 'cl-entry-header';

      const title = document.createElement('button');
      title.type = 'button';
      title.className = 'cl-entry-title nv-entry-title';
      title.textContent = entry.title;
      title.addEventListener('click', function () {
        const existing = card.querySelector('.cl-inline-content');
        if (existing) {
          existing.remove();
          card.classList.remove('cl-entry-card--open');
          return;
        }
        card.querySelectorAll('.cl-inline-content').forEach(function (node) {
          node.remove();
        });
        card.classList.add('cl-entry-card--open');

        const inline = document.createElement('div');
        inline.className = 'cl-inline-content';
        inline.dataset.id = entry.id;
        card.appendChild(inline);
        try {
          const html =
            entry.content && window.mdRender
              ? window.mdRender(entry.content)
              : '<p class="cl-error">Contenuto non disponibile</p>';
          inline.innerHTML = '<div class="n-body">' + html + '</div>';
        } catch (_e) {
          inline.innerHTML = '<div class="cl-error">Errore caricamento</div>';
        }
      });

      header.appendChild(title);

      if (entry.date) {
        const dateEl = document.createElement('span');
        dateEl.className = 'cl-entry-date';
        dateEl.textContent = formatDate(entry.date);
        header.appendChild(dateEl);
      }

      card.appendChild(header);

      const badges = document.createElement('div');
      badges.className = 'cl-entry-badges';
      if (recentIds.has(entry.id)) badges.appendChild(makeBadge('Nuova', 'badge-new'));
      badges.appendChild(makeBadge('v' + versionOf(entry), 'badge-p'));
      card.appendChild(badges);
      list.appendChild(card);
    });
  }

  select.addEventListener('change', renderList);
  yearSelect.addEventListener('change', renderList);
  renderList();
};

/* Home: le tre patch più recenti, lette dallo stesso changelog della pagina Novità. */
window.loadHomeNovita = async function (container) {
  if (!container) return;
  container.setAttribute('aria-busy', 'true');
  container.innerHTML = '<p class="news-loading">Caricamento novità…</p>';

  let entries;
  try {
    const res = await fetch('/content/changelog.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Fetch error: ' + res.status);
    entries = await res.json();
    if (!Array.isArray(entries)) throw new Error('Formato changelog non valido');
  } catch (e) {
    container.setAttribute('aria-busy', 'false');
    container.innerHTML =
      '<p class="news-loading">Impossibile caricare le novità. <a href="/novita">Apri tutte le patch</a>.</p>';
    return;
  }

  function versionOf(entry) {
    const patch = entry.patch !== null && entry.patch !== undefined ? String(entry.patch) : '';
    if (/^\d/.test(patch)) return patch;
    if (entry.sottoversione !== null && entry.sottoversione !== undefined && entry.sottoversione !== '')
      return String(entry.sottoversione);
    return String(entry.versione || patch || '?');
  }

  function isCancelled(entry) {
    return /cancellat/i.test(String(entry.title || ''));
  }

  function plainText(markdown) {
    return String(markdown || '')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/[#>*_`~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function excerpt(entry) {
    const text = plainText(entry.content);
    if (text.length <= 150) return text;
    const cut = text.slice(0, 150);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > 90 ? cut.slice(0, lastSpace) : cut).trim() + '…';
  }

  function cleanTitle(entry) {
    const title = String(entry.title || 'Aggiornamento')
      .replace(/^update\s+/i, '')
      .replace(/\s*\(cancellato\)\s*$/i, '')
      .trim();
    return title.charAt(0).toUpperCase() + title.slice(1);
  }

  function emojiFor(entry) {
    const title = String(entry.title || '').toLowerCase();
    if (title.includes('mappa')) return '🗺️';
    if (title.includes('succub') || title.includes('incub')) return '🦇';
    if (title.includes('meteo') || title.includes('itinerario') || title.includes('viaggio')) return '🌦️';
    return '📜';
  }

  function dateFor(entry) {
    if (!entry.date) return '';
    return new Date(entry.date)
      .toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })
      .toUpperCase();
  }

  const latest = entries
    .filter(function (entry) {
      return (
        entry &&
        entry.id &&
        !isCancelled(entry) &&
        !/^(evento|comunicazione)$/i.test(String(entry.patch || ''))
      );
    })
    .sort(function (a, b) {
      const byDate = String(b.date || '').localeCompare(String(a.date || ''));
      if (byDate !== 0) return byDate;
      const byVersion = versionOf(b).localeCompare(versionOf(a), undefined, { numeric: true });
      if (byVersion !== 0) return byVersion;
      return Number(b._i || 0) - Number(a._i || 0);
    })
    .slice(0, 3);

  container.innerHTML = '';
  container.setAttribute('aria-busy', 'false');

  if (!latest.length) {
    container.innerHTML = '<p class="news-loading">Nessuna patch disponibile.</p>';
    return;
  }

  const accents = ['news-latest', 'news-rework', 'news-map'];

  latest.forEach(function (entry, index) {
    const card = document.createElement('a');
    card.className = 'news-card ' + accents[index % accents.length];
    card.href = '/novita';
    card.setAttribute('onclick', "gp('pag-novita','Novità','📰');return false");

    const top = document.createElement('span');
    top.className = 'news-top';

    const emblem = document.createElement('span');
    emblem.className = 'news-emblem';
    emblem.setAttribute('aria-hidden', 'true');
    emblem.textContent = emojiFor(entry);

    const date = document.createElement('time');
    date.className = 'news-date';
    if (entry.date) date.dateTime = entry.date;
    date.textContent = dateFor(entry);

    top.appendChild(emblem);
    top.appendChild(date);

    const kicker = document.createElement('span');
    kicker.className = 'news-kicker';
    kicker.textContent = 'Patch ' + versionOf(entry);

    const title = document.createElement('strong');
    title.className = 'news-title';
    title.textContent = cleanTitle(entry);

    const desc = document.createElement('span');
    desc.className = 'news-desc';
    desc.textContent = excerpt(entry);

    const cta = document.createElement('span');
    cta.className = 'news-cta';
    cta.textContent = 'Leggi la patch ';
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';
    cta.appendChild(arrow);

    card.appendChild(top);
    card.appendChild(kicker);
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(cta);
    container.appendChild(card);
  });
};

(function () {
  function mount() {
    const container = document.getElementById('news-home-grid');
    if (!container || container.dataset.loaded === 'true') return;
    container.dataset.loaded = 'true';
    window.loadHomeNovita(container);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
