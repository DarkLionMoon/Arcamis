export async function onRequest(context) {
  const TOKEN = context.env.NOTION_TOKEN;
  const KV = context.env.ARCAMIS_CACHE;
  const DB_ID = '2fd0274fdc1c80038889fc072a360bae';
  const CACHE_TTL = 1500; /* 25 minuti */

  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
  };

  const notionHeaders = {
    'Authorization': 'Bearer ' + TOKEN,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json'
  };

  function isS3(url) {
    return url && (url.indexOf('s3.us-west') > -1 || url.indexOf('prod-files-secure') > -1);
  }

  /* Prende la prima immagine dai blocchi di una pagina */
  async function getFirstPageImage(pageId) {
    try {
      const res = await fetch(
        'https://api.notion.com/v1/blocks/' + pageId + '/children?page_size=50',
        { headers: notionHeaders }
      );
      if (!res.ok) return null;
      const data = await res.json();

      for (const block of data.results) {
        /* Immagine diretta */
        if (block.type === 'image') {
          const img = block.image;
          if (img.type === 'external') return img.external.url;
          if (img.type === 'file') return img.file.url;
        }
        /* Cerca un livello dentro (callout, column, toggle...) */
        if (block.has_children) {
          const childRes = await fetch(
            'https://api.notion.com/v1/blocks/' + block.id + '/children?page_size=20',
            { headers: notionHeaders }
          );
          if (childRes.ok) {
            const childData = await childRes.json();
            for (const child of childData.results) {
              if (child.type === 'image') {
                const img = child.image;
                if (img.type === 'external') return img.external.url;
                if (img.type === 'file') return img.file.url;
              }
            }
          }
        }
      }
    } catch (e) {}
    return null;
  }

  try {
    const cacheKey = 'gallery_pg';

    /* 1. Cache KV */
    if (KV) {
      const cached = await KV.get(cacheKey);
      if (cached) {
        return new Response(cached, {
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

    /* 3. Risolve cover per ogni PG in parallelo */
    const pages = await Promise.all(data.results.map(async function(p) {
      const titleProp = Object.values(p.properties || {}).find(v => v.type === 'title');
      const title = titleProp
        ? (titleProp.title || []).map(t => t.plain_text).join('')
        : 'Senza titolo';

      const icon = p.icon && p.icon.emoji ? p.icon.emoji : '📄';

      /* Cover: preferisce URL esterni stabili, altrimenti cerca nella pagina */
      let cover = null;
      if (p.cover && p.cover.type === 'external') {
        cover = p.cover.external.url;
      }
      /* Se cover è S3 o assente, prende la prima immagine della pagina */
      if (!cover) {
        const pageId = p.id.replace(/-/g, '');
        cover = await getFirstPageImage(pageId);
      }

      /* Tags */
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

      return { id: p.id.replace(/-/g, ''), title, icon, cover, tags };
    }));

    const payload = JSON.stringify({ pages });

    /* 4. Salva in KV */
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
