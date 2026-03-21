export async function onRequest(context) {
  const url = new URL(context.request.url);
  const key = url.searchParams.get('key');
  const KV = context.env.ARCAMIS_CACHE;
  const TOKEN = context.env.NOTION_TOKEN;
  const PURGE_SECRET = context.env.PURGE_SECRET || 'arcamis-purge';

  const cors = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  if (key !== PURGE_SECRET) {
    return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401, headers: cors });
  }

  const notionHeaders = {
    'Authorization': 'Bearer ' + TOKEN,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json'
  };

  /* ── Pagine di primo livello (da data.js — hardcoded qui per semplicità) ── */
  const ROOT_PAGES = [
    { id: '2f00274fdc1c8065a11ff45192aa5dcb', title: 'Gameplay',               icon: '⚔️' },
    { id: '2f00274fdc1c800b9d8fc366e8e40c5c', title: 'Regole',                 icon: '📜' },
    { id: '3130274fdc1c807eb61fde24e8236659', title: 'Materiale approvato',     icon: '📋' },
    { id: '2dd222f22ef8413f8cb48f03bbb4f4b0', title: 'Come si inizia',          icon: '🌟' },
    { id: '5cea525d149f4acb9c59007bf6b3d5ff', title: 'Andando avanti',          icon: '📈' },
    { id: '2f00274fdc1c8089bfe6c24434d53b67', title: 'Biblioteca',              icon: '📚' },
    { id: '2f00274fdc1c804b9015c72cb6121404', title: 'Bottega farmaceutica',    icon: '🧪' },
    { id: '2f00274fdc1c801b8c13cefd9e15694e', title: 'Gilda degli avventurieri',icon: '🗡️' },
    { id: '2f00274fdc1c80faa99eda064ef0fabc', title: 'Locanda',                 icon: '🍺' },
    { id: '2f00274fdc1c805ca01ec57f18d2ffee', title: 'Forgia',                  icon: '🔥' },
    { id: '2f00274fdc1c8089bfe6c24434d53b67', title: 'Biblioteca',              icon: '📚' },
    { id: '2f00274fdc1c801c9697e75caa8d5f13', title: 'Bottega farmaceutica',    icon: '💊' },
    { id: '2ff0274fdc1c80688dd6c2b293a1f626', title: 'Caserma',                 icon: '🛡️' },
    { id: '2ff0274fdc1c80769a4ae243f22f0582', title: 'Corporazione costruttori', icon: '🔨' },
    { id: '2f00274fdc1c807aa03cc6cbeb3687cc', title: 'Ospedale',                icon: '⚕️' },
    { id: '2ff0274fdc1c8035bad4f0b6ab705192', title: 'Sartoria',                icon: '🧵' },
    { id: '2f00274fdc1c80679bd3c3df8a1fa040', title: 'Pantheon',                icon: '🛐' },
    { id: '3000274fdc1c8033a214c44a1aa7f01f', title: 'Changelog',               icon: '📝' },
    { id: '2f00274fdc1c80259b3bc01b09b5757d', title: 'Maestria / Titoli',       icon: '🏅' },
    { id: '2f00274fdc1c806f8f17dbc6532d2211', title: 'Lore',                    icon: '📖' },
    { id: '2f00274fdc1c80679bd3c3df8a1fa040', title: 'Pantheon',                icon: '🛐' },
    { id: '2f10274fdc1c80489f23c49164747770', title: 'Mappe',                   icon: '🗺️' },
    { id: '2f00274fdc1c80e78ad7ce985007b7c6', title: 'Homebrew',                icon: '⚗️' },
    { id: '2f00274fdc1c802a9babd4239d97a319', title: 'Maestria / Titoli',       icon: '🔨' },
    { id: '3090274fdc1c80e1a365ce1c36873455', title: 'Arcamis',                 icon: '🏰' },
    { id: '30d0274fdc1c800999feeb0ca6669b22', title: 'Selva Fogliabruna',       icon: '🍂' },
    { id: '30d0274fdc1c8016b113d5c2d7662d8f', title: 'Foresta dello Smarrimento', icon: '🌲' },
    { id: '30d0274fdc1c804b9cb7e366f02bd635', title: 'Volonx',                  icon: '🏔️' },
    { id: '31f0274fdc1c8059a923c73da185a0e3', title: 'Vigilius',                icon: '🏛️' },
    { id: '31f0274fdc1c8019945af2b26306462f', title: 'Galeton',                 icon: '🏘️' },
    { id: '30d0274fdc1c803387c4fda013b857e9', title: 'Lago di Gromot',          icon: '🌊' },
    { id: '30d0274fdc1c8090aee7ed0430170414', title: 'Forte Vigilus',           icon: '🛡️' },
    { id: '31f0274fdc1c8075b0dec2e2a6bc359e', title: 'Riva di Ferro',           icon: '⚓' },
    { id: '31f0274fdc1c805b89b8f0678463e615', title: 'Fumofosco',               icon: '🌫️' },
    { id: '31f0274fdc1c808191abe4df86d176e6', title: 'Rovine di Kaldur',        icon: '🏚️' },
  ];

  /* ── Helper: estrai testo plain dai blocchi ── */
  function extractText(blocks) {
    const parts = [];
    for (const b of blocks) {
      const d = b[b.type] || {};
      const rt = d.rich_text || d.title || [];
      if (rt.length) parts.push(rt.map(r => r.plain_text || '').join(''));
      if (b.children && b.children.length) parts.push(extractText(b.children));
    }
    return parts.filter(Boolean).join(' ');
  }

  /* ── Fetch blocchi di una pagina ── */
  async function fetchBlocks(pageId) {
    try {
      const r = await fetch(
        'https://api.notion.com/v1/blocks/' + pageId + '/children?page_size=100',
        { headers: notionHeaders }
      );
      if (!r.ok) return [];
      const data = await r.json();
      return data.results || [];
    } catch (e) { return []; }
  }

  /* ── Fetch figli ricorsivi (solo child_page) ── */
  async function fetchChildPages(pageId) {
    const blocks = await fetchBlocks(pageId);
    return blocks.filter(b => b.type === 'child_page').map(b => ({
      id: b.id.replace(/-/g, ''),
      title: (b.child_page && b.child_page.title) || 'Pagina',
    }));
  }

  /* ── Fetch titolo e icona di una pagina ── */
  async function fetchPageMeta(pageId) {
    try {
      const r = await fetch('https://api.notion.com/v1/pages/' + pageId, { headers: notionHeaders });
      if (!r.ok) return null;
      const p = await r.json();
      const titleProp = p.properties && Object.values(p.properties).find(v => v.type === 'title');
      const title = titleProp ? (titleProp.title || []).map(t => t.plain_text).join('') : '';
      const icon = p.icon && p.icon.emoji ? p.icon.emoji : '📄';
      return { title, icon };
    } catch (e) { return null; }
  }

  /* ════ COSTRUZIONE INDICE ════ */
  const index = [];
  const seen = new Set();

  /* Deduplicazione root pages */
  const rootUnique = [];
  for (const p of ROOT_PAGES) {
    if (!seen.has(p.id)) { seen.add(p.id); rootUnique.push(p); }
  }

  let processed = 0;
  const errors = [];

  for (const rootPage of rootUnique) {
    /* Aggiungi pagina root */
    index.push({
      id: rootPage.id,
      title: rootPage.title,
      icon: rootPage.icon,
      parent: null,
      parentTitle: null
    });

    /* Fetch sottopagine */
    let children = [];
    try {
      children = await fetchChildPages(rootPage.id);
    } catch (e) {
      errors.push(rootPage.id + ': ' + e.message);
      continue;
    }

    for (const child of children) {
      if (seen.has(child.id)) continue;
      seen.add(child.id);

      /* Fetch meta sottopagina per avere icona reale */
      const meta = await fetchPageMeta(child.id);
      const title = (meta && meta.title) || child.title;
      const icon = (meta && meta.icon) || '📄';

      index.push({
        id: child.id,
        title: title,
        icon: icon,
        parent: rootPage.id,
        parentTitle: rootPage.title
      });

      /* Fetch sotto-sottopagine (secondo livello) */
      let grandchildren = [];
      try {
        grandchildren = await fetchChildPages(child.id);
      } catch (e) { continue; }

      for (const gc of grandchildren) {
        if (seen.has(gc.id)) continue;
        seen.add(gc.id);
        const gcMeta = await fetchPageMeta(gc.id);
        index.push({
          id: gc.id,
          title: (gcMeta && gcMeta.title) || gc.title,
          icon: (gcMeta && gcMeta.icon) || '📄',
          parent: child.id,
          parentTitle: title
        });
      }

      processed++;
    }
  }

  /* Salva in KV senza TTL — aggiornato solo manualmente */
  await KV.put('search_index', JSON.stringify(index));

  return new Response(JSON.stringify({
    ok: true,
    indexed: index.length,
    processed,
    errors: errors.length ? errors : undefined
  }), { headers: cors });
}
