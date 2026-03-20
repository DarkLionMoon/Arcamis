export async function onRequest(context) {
  const TOKEN = context.env.NOTION_TOKEN;
  const KV = context.env.ARCAMIS_CACHE;
  const DB_ID = '2fd0274fdc1c80038889fc072a360bae';
  const CACHE_TTL = 3600;

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
    const cacheKey = 'gallery_pg';

    /* 1. Controlla KV cache */
    if (KV) {
      const cached = await KV.get(cacheKey);
      if (cached) {
        return new Response(cached, {
          headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT', ...cors }
        });
      }
    }

    /* 2. Chiama Notion */
    const res = await fetch('https://api.notion.com/v1/databases/' + DB_ID + '/query', {
      method: 'POST',
      headers: notionHeaders,
      body: JSON.stringify({ page_size: 100, sorts: [{ property: 'title', direction: 'ascending' }] })
    });

    if (!res.ok) throw new Error('Notion DB error: ' + res.status);
    const data = await res.json();

    const pages = data.results.map(function(p) {
      /* Titolo */
      const titleProp = Object.values(p.properties || {}).find(v => v.type === 'title');
      const title = titleProp
        ? (titleProp.title || []).map(t => t.plain_text).join('')
        : 'Senza titolo';

      /* Icona */
      const icon = p.icon && p.icon.emoji ? p.icon.emoji : '📄';

      /* Cover */
      const cover = p.cover
        ? (p.cover.type === 'external' ? p.cover.external.url : (p.cover.file && p.cover.file.url))
        : null;

      /* Tags (classe) */
      const tagProp = p.properties && (p.properties['Tags'] || p.properties['tags'] || p.properties['Classe'] || p.properties['classe']);
      let tags = [];
      if (tagProp && tagProp.type === 'multi_select') {
        tags = tagProp.multi_select.map(t => t.name);
      } else if (tagProp && tagProp.type === 'select' && tagProp.select) {
        tags = [tagProp.select.name];
      }

      return {
        id: p.id.replace(/-/g, ''),
        title,
        icon,
        cover,
        tags
      };
    });

    const payload = JSON.stringify({ pages });

    /* 3. Salva in KV */
    if (KV) {
      await KV.put(cacheKey, payload, { expirationTtl: CACHE_TTL });
    }

    return new Response(payload, {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS', ...cors }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...cors }
    });
  }
}
