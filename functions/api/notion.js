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
  const CACHE_TTL = 3600; /* secondi — 1 ora */

  const notionHeaders = {
    'Authorization': 'Bearer ' + TOKEN,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json'
  };

  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
  };

  try {

    /* ── Purge cache ── */
    if (purge && purgeKey === PURGE_SECRET) {
      const id = pageId || dbId;
      if (id) {
        await KV.delete('pg_' + id.replace(/-/g, ''));
        return new Response(JSON.stringify({ purged: id }), {
          headers: { 'Content-Type': 'application/json', ...cors }
        });
      }
      /* purge tutto */
      const list = await KV.list();
      await Promise.all(list.keys.map(k => KV.delete(k.name)));
      return new Response(JSON.stringify({ purged: 'all', count: list.keys.length }), {
        headers: { 'Content-Type': 'application/json', ...cors }
      });
    }

    /* ── Proxy immagini S3 Notion ── */
    if (imgUrl) {
      const decoded = decodeURIComponent(imgUrl);
      const img = await fetch(decoded);
      const ct = img.headers.get('content-type') || '';

      /* Se S3 risponde con XML = URL scaduto → 404 */
      if (!ct.startsWith('image/')) {
        return new Response('Image expired or unavailable', {
          status: 404,
          headers: { 'Content-Type': 'text/plain', ...cors }
        });
      }

      return new Response(img.body, {
        headers: {
          'Content-Type': ct,
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
          ...cors
        }
      });
    }

    /* ── Carica pagina singola ── */
    if (pageId) {
      const cleanId = pageId.replace(/-/g, '');
      const cacheKey = 'pg_' + cleanId;

      /* 1. Controlla KV cache */
      const cached = await KV.get(cacheKey);
      if (cached) {
        return new Response(cached, {
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'HIT',
            ...cors
          }
        });
      }

      /* 2. Cache miss → chiama Notion */
      const [pageRes, blocksRes] = await Promise.all([
        fetch('https://api.notion.com/v1/pages/' + cleanId, { headers: notionHeaders }),
        fetch('https://api.notion.com/v1/blocks/' + cleanId + '/children?page_size=100', { headers: notionHeaders })
      ]);

      if (!pageRes.ok) throw new Error('Notion page error: ' + pageRes.status);
      if (!blocksRes.ok) throw new Error('Notion blocks error: ' + blocksRes.status);

      const page = await pageRes.json();
      const blocksData = await blocksRes.json();
      const blocks = await loadChildren(blocksData.results, notionHeaders);

      const payload = JSON.stringify({ page, blocks });

      /* 3. Salva in KV */
      await KV.put(cacheKey, payload, { expirationTtl: CACHE_TTL });

      return new Response(payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'MISS',
          ...cors
        }
      });
    }

    /* ── Carica database ── */
    if (dbId) {
      const cleanId = dbId.replace(/-/g, '');
      const cacheKey = 'db_' + cleanId;

      /* 1. Controlla KV cache */
      const cached = await KV.get(cacheKey);
      if (cached) {
        return new Response(cached, {
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'HIT',
            ...cors
          }
        });
      }

      /* 2. Cache miss → chiama Notion */
      const res = await fetch('https://api.notion.com/v1/databases/' + cleanId + '/query', {
        method: 'POST',
        headers: notionHeaders,
        body: JSON.stringify({ page_size: 50 })
      });
      if (!res.ok) throw new Error('Notion DB error: ' + res.status);
      const data = await res.json();

      const pages = data.results.map(function(p) {
        const titleProp = Object.values(p.properties || {}).find(v => v.type === 'title');
        const title = titleProp
          ? (titleProp.title || []).map(t => t.plain_text).join('')
          : 'Senza titolo';
        const icon = p.icon && p.icon.emoji ? p.icon.emoji : '📄';
        const cover = p.cover
          ? (p.cover.type === 'external'
              ? p.cover.external.url
              : (p.cover.file && p.cover.file.url))
          : null;
        return { id: p.id.replace(/-/g, ''), title, icon, cover };
      });

      const payload = JSON.stringify({ pages });

      /* 3. Salva in KV */
      await KV.put(cacheKey, payload, { expirationTtl: CACHE_TTL });

      return new Response(payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'MISS',
          ...cors
        }
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

/* ════ loadChildren — parallelo + ricorsivo ════ */
async function loadChildren(blocks, headers) {
  const childResults = await Promise.all(
    blocks.map(async function(block) {
      if (!block.has_children) return { id: block.id, children: null };
      try {
        const res = await fetch(
          'https://api.notion.com/v1/blocks/' + block.id + '/children?page_size=100',
          { headers }
        );
        if (!res.ok) return { id: block.id, children: [] };
        const data = await res.json();
        const children = await loadChildren(data.results, headers);
        return { id: block.id, children };
      } catch(e) {
        return { id: block.id, children: [] };
      }
    })
  );

  const childMap = {};
  childResults.forEach(function(r) {
    if (r.children !== null) childMap[r.id] = r.children;
  });

  return blocks.map(function(block) {
    if (block.has_children && childMap[block.id] !== undefined) {
      return Object.assign({}, block, { children: childMap[block.id] });
    }
    return block;
  });
}
