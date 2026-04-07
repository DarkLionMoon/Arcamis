export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pageId = url.searchParams.get('pageId');
  const dbId = url.searchParams.get('dbId');
  const imgUrl = url.searchParams.get('img');
  const purge = url.searchParams.get('purge');
  const purgeKey = url.searchParams.get('key');
  const TOKEN = context.env.NOTION_TOKEN;
  const KV = context.env.ARCAMIS_CACHE;

  const PURGE_SECRET = context.env.PURGE_SECRET || 'arcamis-purge';
  const CACHE_TTL = 3600;       // secondi fino a stale
  const CACHE_SWR = 86400;      // secondi totali in KV (stale ok per 24h)
  const MAX_DEPTH = 3;          // profondità massima loadChildren

  const notionHeaders = {
    'Authorization': 'Bearer ' + TOKEN,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json'
  };

  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
  };

  /* ── Helper KV con stale-while-revalidate ── */
  async function kvGet(key) {
    try {
      const raw = await KV.get(key, 'text');
      if (!raw) return null;
      // Prova a leggere il wrapper { expiresAt, data }
      try {
        const wrapper = JSON.parse(raw);
        if (wrapper && wrapper.expiresAt && wrapper.data !== undefined) {
          return { value: wrapper.data, stale: Date.now() > wrapper.expiresAt };
        }
      } catch (_) {}
      // Vecchio formato (stringa diretta) — compatibile
      return { value: raw, stale: false };
    } catch (_) {
      return null;
    }
  }

  async function kvPut(key, data) {
    const wrapper = JSON.stringify({
      expiresAt: Date.now() + CACHE_TTL * 1000,
      data
    });
    await KV.put(key, wrapper, { expirationTtl: CACHE_SWR });
  }

  // Aggiorna KV in background senza bloccare la risposta
  function kvRefreshBg(key, fetchFn) {
    context.waitUntil(
      fetchFn().then(data => kvPut(key, data)).catch(() => {})
    );
  }

  try {

    /* ── Purge cache ── */
    if (purge && purgeKey === PURGE_SECRET) {
      const id = pageId || dbId;
      if (id) {
        await KV.delete('pg_' + id.replace(/-/g, ''));
        await KV.delete('db_' + id.replace(/-/g, ''));
        return new Response(JSON.stringify({ purged: id }), {
          headers: { 'Content-Type': 'application/json', ...cors }
        });
      }
      const list = await KV.list();
const toDelete = list.keys.filter(k => !k.name.startsWith('admin_'));
await Promise.all(toDelete.map(k => KV.delete(k.name)));
return new Response(JSON.stringify({ purged: 'all', count: toDelete.length }), {
  headers: { 'Content-Type': 'application/json', ...cors }
});
      return new Response(JSON.stringify({ purged: 'all', count: list.keys.length }), {
        headers: { 'Content-Type': 'application/json', ...cors }
      });
    }

    /* ── Proxy immagini S3 Notion ── */
    if (imgUrl) {
      const decoded = decodeURIComponent(imgUrl);
      const img = await fetch(decoded);
      const ct = img.headers.get('content-type') || '';
      if (!ct.startsWith('image/')) {
        return new Response('Image expired or unavailable', {
          status: 404,
          headers: { 'Content-Type': 'text/plain', ...cors }
        });
      }
      return new Response(img.body, {
        headers: {
          'Content-Type': ct,
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200',
          ...cors
        }
      });
    }

    /* ── Carica pagina singola ── */
    if (pageId) {
      const cleanId = pageId.replace(/-/g, '');
      const cacheKey = 'pg_' + cleanId;

      const cached = await kvGet(cacheKey);
      if (cached) {
        // Se stale: servi subito e aggiorna in background
        if (cached.stale) {
          kvRefreshBg(cacheKey, () => fetchPage(cleanId, notionHeaders, MAX_DEPTH));
        }
        return new Response(cached.value, {
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': cached.stale ? 'STALE' : 'HIT',
            ...cors
          }
        });
      }

      const payload = JSON.stringify(await fetchPage(cleanId, notionHeaders, MAX_DEPTH));
      await kvPut(cacheKey, payload);

      return new Response(payload, {
        headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS', ...cors }
      });
    }

    /* ── Carica database ── */
    if (dbId) {
      const cleanId = dbId.replace(/-/g, '');
      const cacheKey = 'db_' + cleanId;

      const cached = await kvGet(cacheKey);
      if (cached) {
        if (cached.stale) {
          kvRefreshBg(cacheKey, () => fetchDb(cleanId, notionHeaders));
        }
        return new Response(cached.value, {
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': cached.stale ? 'STALE' : 'HIT',
            ...cors
          }
        });
      }

      const payload = JSON.stringify(await fetchDb(cleanId, notionHeaders));
      await kvPut(cacheKey, payload);

      return new Response(payload, {
        headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS', ...cors }
      });
    }

    return new Response(JSON.stringify({ error: 'Parametro mancante' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...cors }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...cors }
    });
  }
}

/* ════ fetchPage ════ */
async function fetchPage(cleanId, headers, maxDepth) {
  const [pageRes, blocksRes] = await Promise.all([
    fetch('https://api.notion.com/v1/pages/' + cleanId, { headers }),
    fetch('https://api.notion.com/v1/blocks/' + cleanId + '/children?page_size=100', { headers })
  ]);
  if (!pageRes.ok) throw new Error('Notion page error: ' + pageRes.status);
  if (!blocksRes.ok) throw new Error('Notion blocks error: ' + blocksRes.status);

  const page = await pageRes.json();
  const blocksData = await blocksRes.json();

  // Paginazione blocchi root
  let allBlocks = blocksData.results;
  let cursor = blocksData.next_cursor;
  while (blocksData.has_more && cursor) {
    const moreRes = await fetch(
      'https://api.notion.com/v1/blocks/' + cleanId + '/children?page_size=100&start_cursor=' + cursor,
      { headers }
    );
    if (!moreRes.ok) break;
    const moreData = await moreRes.json();
    allBlocks = allBlocks.concat(moreData.results);
    cursor = moreData.next_cursor;
    if (!moreData.has_more) break;
  }

  const blocks = await loadChildren(allBlocks, headers, maxDepth);
  return { page, blocks };
}

/* ════ fetchDb — con paginazione ════ */
async function fetchDb(cleanId, headers) {
  const TIMELINE_DB = '2fc0274fdc1c800f8ac0d6d03b255cad';

  const queryBody = cleanId === TIMELINE_DB.replace(/-/g, '')
    ? { page_size: 100, sorts: [{ property: 'Order', direction: 'ascending' }] }
    : { page_size: 100 };

  let allResults = [];
  let cursor = null;

  do {
    const body = cursor ? { ...queryBody, start_cursor: cursor } : queryBody;
    const res = await fetch('https://api.notion.com/v1/databases/' + cleanId + '/query', {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Notion DB error: ' + res.status);
    const data = await res.json();
    allResults = allResults.concat(data.results);
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);

  if (cleanId === TIMELINE_DB.replace(/-/g, '')) {
    allResults.sort(function(a, b) {
      const getOrder = p => {
        const prop = p.properties && (p.properties['Order'] || p.properties['Ordine'] || p.properties['order']);
        return (prop && prop.number != null) ? prop.number : 9999;
      };
      return getOrder(a) - getOrder(b);
    });
  }

  const pages = allResults.map(p => {
    const titleProp = Object.values(p.properties || {}).find(v => v.type === 'title');
    const title = titleProp
      ? (titleProp.title || []).map(t => t.plain_text).join('')
      : 'Senza titolo';

    const icon = p.icon && p.icon.emoji ? p.icon.emoji : '📄';

    const cover = p.cover
      ? (p.cover.type === 'external' ? p.cover.external.url : (p.cover.file && p.cover.file.url))
      : null;

    const getProp = (names) => names.reduce((acc, n) => acc || (p.properties && p.properties[n]), null);

    const classeProp = getProp(['Classe','classe','Class','class']);
    const classe = classeProp
      ? (classeProp.type === 'multi_select' && classeProp.multi_select.length)
        ? classeProp.multi_select.map(s => s.name).join(', ')
        : (classeProp.select ? classeProp.select.name : null)
      : null;

    const doveProp = getProp(['Dove trovarlo','dove_trovarlo','Dove Trovarlo','location']);
    const dove = doveProp
      ? doveProp.type === 'rich_text'
        ? (doveProp.rich_text || []).map(t => t.plain_text).join('')
        : doveProp.type === 'select' && doveProp.select
          ? doveProp.select.name : null
      : null;

    const argProp = getProp(['Macro-argomento','macro_argomento','Argomento','argomento','Tags','tags']);
    const argomenti = argProp && argProp.type === 'multi_select'
      ? (argProp.multi_select || []).map(s => ({ name: s.name, color: s.color }))
      : [];

    const loreProp = getProp(['Lore','lore']);
    const lore = loreProp
      ? loreProp.type === 'select' && loreProp.select
        ? loreProp.select.name
        : loreProp.type === 'multi_select' && loreProp.multi_select.length
          ? loreProp.multi_select.map(s => s.name).join(', ') : null
      : null;

    const importanzaProp = getProp(['Importanza','importanza']);
    const importanza = importanzaProp
      ? importanzaProp.type === 'multi_select' && importanzaProp.multi_select.length
        ? importanzaProp.multi_select[0].name
        : importanzaProp.type === 'select' && importanzaProp.select
          ? importanzaProp.select.name : null
      : null;

    const specieProp = getProp(['Specie','specie']);
    const specie = specieProp
      ? (specieProp.type === 'multi_select' && specieProp.multi_select.length)
        ? specieProp.multi_select.map(s => s.name).join(', ')
        : (specieProp.select ? specieProp.select.name : null)
      : null;

    return { id: p.id.replace(/-/g, ''), title, icon, cover, classe, specie, dove, argomenti, lore, importanza };
  });

  return { pages };
}

/* ════ loadChildren — parallelo + ricorsivo + limite profondità ════ */
async function loadChildren(blocks, headers, depth) {
  if (depth <= 0) return blocks; // limite raggiunto

  const childResults = await Promise.all(
    blocks.map(async block => {
      if (!block.has_children) return { id: block.id, children: null };
      try {
        const res = await fetch(
          'https://api.notion.com/v1/blocks/' + block.id + '/children?page_size=100',
          { headers }
        );
        if (!res.ok) return { id: block.id, children: [] };
        const data = await res.json();
        const children = await loadChildren(data.results, headers, depth - 1);
        return { id: block.id, children };
      } catch (_) {
        return { id: block.id, children: [] };
      }
    })
  );

  const childMap = {};
  childResults.forEach(r => { if (r.children !== null) childMap[r.id] = r.children; });

  return blocks.map(block => {
    if (block.has_children && childMap[block.id] !== undefined) {
      return Object.assign({}, block, { children: childMap[block.id] });
    }
    return block;
  });
}
