export async function onRequest(context) {
  const TOKEN = context.env.NOTION_TOKEN;
  const KV = context.env.ARCAMIS_CACHE;
  const DB_ID = '2fd0274fdc1c80038889fc072a360bae';
  const CACHE_TTL = 1800;

  const cors = {
    'Access-Control-Allow-Origin': 'https://arcamis.pages.dev',
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
  };

  const notionHeaders = {
    'Authorization': 'Bearer ' + TOKEN,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json'
  };

  try {
    const cacheKey = 'gallery_pg_v3';

    if (KV) {
      const cached = await KV.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        await injectCustomCovers(data.pages, KV);
        return new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT', ...cors }
        });
      }
    }

    const res = await fetch('https://api.notion.com/v1/databases/' + DB_ID + '/query', {
      method: 'POST',
      headers: notionHeaders,
      body: JSON.stringify({ page_size: 100, sorts: [{ property: 'title', direction: 'ascending' }] })
    });
    if (!res.ok) throw new Error('Notion DB error: ' + res.status);
    const data = await res.json();

    const pages = data.results.map(function(p) {
      const titleProp = Object.values(p.properties || {}).find(function(v) { return v.type === 'title'; });
      const title = titleProp
        ? (titleProp.title || []).map(function(t) { return t.plain_text; }).join('')
        : 'Senza titolo';

      const icon = p.icon && p.icon.emoji ? p.icon.emoji : '📄';

      const tagProp = p.properties && (
        p.properties['Tags'] || p.properties['tags'] ||
        p.properties['Classe'] || p.properties['classe']
      );
      var tags = [];
      if (tagProp && tagProp.type === 'multi_select') {
        tags = tagProp.multi_select.map(function(t) { return t.name; });
      } else if (tagProp && tagProp.type === 'select' && tagProp.select) {
        tags = [tagProp.select.name];
      }

      const posaProp = p.properties && (
        p.properties['Immagine posa'] || p.properties['immagine posa'] ||
        p.properties['Posa'] || p.properties['posa']
      );
      var posa = null;
      if (posaProp && posaProp.type === 'files' && posaProp.files && posaProp.files.length) {
        const f = posaProp.files[0];
        posa = f.type === 'external' ? f.external.url
             : f.type === 'file'     ? f.file.url
             : null;
      }

      return { id: p.id.replace(/-/g, ''), title, icon, cover: null, tags, posa };
    });

    await injectCustomCovers(pages, KV);

    const payload = { pages };

    const cachePayload = { pages: pages.map(function(pg) { return Object.assign({}, pg, { cover: null, posa: null }); }) };
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

async function injectCustomCovers(pages, KV) {
  if (!KV || !pages || !pages.length) return;
  await Promise.all(pages.map(async function(p) {
    try {
      const customCover = await KV.get('admin_cover_' + p.id);
      if (customCover) p.cover = customCover;
      const customPos = await KV.get('admin_cover_' + p.id + '_pos');
      if (customPos) p.coverPos = customPos;
      const customPosa = await KV.get('admin_posa_' + p.id);
      if (customPosa) p.posa = customPosa;
    } catch (e) {}
  }));
}
