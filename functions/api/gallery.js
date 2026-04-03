export async function onRequest(context) {
  const TOKEN = context.env.NOTION_TOKEN;
  const KV = context.env.ARCAMIS_CACHE;
  const DB_ID = '2fd0274fdc1c80038889fc072a360bae';
  const CACHE_TTL = 1800; /* 30 minuti */

  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
  };

  const notionHeaders = {
    'Authorization': 'Bearer ' + TOKEN,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json'
  };

  try {
    const cacheKey = 'gallery_pg_v2';

    /* 1. Cache KV */
    if (KV) {
      const cached = await KV.get(cacheKey);
      if (cached) {
        /* Inietta cover custom fresche sopra la cache */
        const data = JSON.parse(cached);
        await injectCustomCovers(data.pages, KV);
        return new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT', ...cors }
        });
      }
    }

    /* 2. Lista PG da Notion */
    const res = await fetch('https://api.notion.com/v1/databases/' + DB_ID + '/query', {
      method: 'POST',
      headers: notionHeaders,
      body: JSON.stringify({ page_size: 100, sorts: [{ property: 'title', direction: 'ascending' }] })
    });
    if (!res.ok) throw new Error('Notion DB error: ' + res.status);
    const data = await res.json();

    /* 3. Estrae metadati — niente URL S3 che scadono */
    const pages = data.results.map(function(p) {
      const titleProp = Object.values(p.properties || {}).find(v => v.type === 'title');
      const title = titleProp
        ? (titleProp.title || []).map(t => t.plain_text).join('')
        : 'Senza titolo';

      const icon = p.icon && p.icon.emoji ? p.icon.emoji : '📄';

      const tagProp = p.properties && (
        p.properties['Tags'] || p.properties['tags'] ||
        p.properties['Classe'] || p.properties['classe']
      );
      let tags = [];
      if (tagProp && tagProp.type === 'multi_select') {
        tags = tagProp.multi_select.map(t => t.name);
      } else if (tagProp && tagProp.type === 'select' && tagProp.select) {
        tags = [tagProp.select.name];
      }

      /* cover null — viene sovrascritta dalle cover admin se presenti */
      return { id: p.id.replace(/-/g, ''), title, icon, cover: null, tags };
    });

    /* 4. Inietta cover custom admin */
    await injectCustomCovers(pages, KV);

    const payload = { pages };

    /* 5. Salva in KV (senza cover, quelle vengono iniettate live) */
    const cachePayload = { pages: pages.map(p => Object.assign({}, p, { cover: null })) };
    if (KV) {
      await KV.put(cacheKey, JSON.stringify(cachePayload), { expirationTtl: CACHE_TTL });
    }

    return new Response(JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS', ...cors }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...cors }
    });
  }
}

/* ── Inietta cover custom da KV sulle pagine ── */
async function injectCustomCovers(pages, KV) {
  if (!KV || !pages || !pages.length) return;
  await Promise.all(pages.map(async function(p) {
    try {
      const customCover = await KV.get('admin_cover_' + p.id);
      if (customCover) p.cover = customCover;
    } catch (e) {}
  }));
}
