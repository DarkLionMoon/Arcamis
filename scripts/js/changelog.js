/* scripts/js/changelog.js */
window.loadChangelog = async function(container) {

  container.innerHTML = '<p class="cl-loading">Caricamento changelog…</p>';

  let entries;
  try {
    const res = await fetch('/api/changelog');
    if (!res.ok) throw new Error('Fetch error ' + res.status);
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
    const v    = String(e.versione      ?? '?');
    const sv   = String(e.sottoversione ?? (v + '.0'));
    const p    = e.patch != null ? String(e.patch) : null;
    const pKey = p ?? '__none__';

    if (!tree[v])        tree[v]         = {};
    if (!tree[v][sv])    tree[v][sv]     = {};
    if (!Array.isArray(tree[v][sv][pKey])) tree[v][sv][pKey] = [];
    tree[v][sv][pKey].push(e);
  }

  const versions = Object.keys(tree).sort((a, b) => parseFloat(a) - parseFloat(b));

  // ── State ─────────────────────────────────────────────────────────────────
  let activeV  = versions[versions.length - 1];
  let activeSV = null;
  let activeP  = null;

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
      .filter(p => p !== '__none__')
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }

  // ── Render ────────────────────────────────────────────────────────────────
  function render() {
    const svList = getSubversions(activeV);
    if (!activeSV || !svList.includes(activeSV)) activeSV = svList[svList.length - 1];

    const patches  = getPatches(activeV, activeSV);
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
      visibleEntries = Array.isArray(bucket) ? bucket : [];
    } else {
      const svBucket = tree[activeV]?.[activeSV] ?? {};
      visibleEntries = Object.values(svBucket).flat().filter(e => e && e.id);
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
        activeV  = v;
        activeSV = null;
        activeP  = null;
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
        activeP  = null;
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
        btn.addEventListener('click', () => {
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
          container.querySelectorAll('.cl-entry-card--open').forEach(c => c.classList.remove('cl-entry-card--open'));
          card.classList.add('cl-entry-card--open');
          const inline = document.createElement('div');
          inline.className = 'cl-inline-content';
          inline.dataset.id = entry.id;
          inline.innerHTML = '<div class="hbsc-loading"><div class="gs-loading-spin"></div></div>';
          card.appendChild(inline);
          fetch('/api/notion?pageId=' + entry.id)
            .then(r => r.json())
            .then(data => {
              if (!data.blocks) throw new Error('no blocks');
              inline.innerHTML = '<div class="n-body">' + renderBlocks(data.blocks, true) + '</div>';
            })
            .catch(() => {
              inline.innerHTML = '<div class="cl-error">Errore caricamento</div>';
            });
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

        if (entry.versione)      badges.appendChild(makeBadge(entry.versione,      'badge-v'));
        if (entry.sottoversione) badges.appendChild(makeBadge(entry.sottoversione, 'badge-sv'));
        if (entry.patch)         badges.appendChild(makeBadge(entry.patch,         'badge-p'));

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
