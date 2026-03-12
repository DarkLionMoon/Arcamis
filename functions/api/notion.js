export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pageId = url.searchParams.get('pageId');
  const dbId = url.searchParams.get('dbId');
  const imgUrl = url.searchParams.get('img');
  const TOKEN = context.env.NOTION_TOKEN;

  const headers = {
    'Authorization': 'Bearer ' + TOKEN,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json'
  };

  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
  };

  try {

    /* ── Proxy immagini S3 Notion (URL firmati che scadono) ── */
    if (imgUrl) {
      const img = await fetch(decodeURIComponent(imgUrl));
      const ct = img.headers.get('content-type') || 'image/jpeg';
      return new Response(img.body, {
        headers: { 'Content-Type': ct, ...cors }
      });
    }

    /* ── Carica pagina singola ── */
    if (pageId) {
      const cleanId = pageId.replace(/-/g, '');

      // Dati pagina
      const [pageRes, blocksRes] = await Promise.all([
        fetch('https://api.notion.com/v1/pages/' + cleanId, { headers }),
        fetch('https://api.notion.com/v1/blocks/' + cleanId + '/children?page_size=100', { headers })
      ]);

      if (!pageRes.ok) throw new Error('Notion page error: ' + pageRes.status);
      if (!blocksRes.ok) throw new Error('Notion blocks error: ' + blocksRes.status);

      const page = await pageRes.json();
      const blocksData = await blocksRes.json();

      // Carica i children di ogni blocco che ne ha
      const blocks = await loadChildren(blocksData.results, headers);

      return new Response(JSON.stringify({ page, blocks }), {
        headers: { 'Content-Type': 'application/json', ...cors }
      });
    }

    /* ── Carica database ── */
    if (dbId) {
      const res = await fetch('https://api.notion.com/v1/databases/' + dbId + '/query', {
        method: 'POST',
        headers,
        body: JSON.stringify({ page_size: 50 })
      });
      if (!res.ok) throw new Error('Notion DB error: ' + res.status);
      const data = await res.json();

      const pages = data.results.map(function(p) {
        const titleProp = Object.values(p.properties || {}).find(function(v) {
          return v.type === 'title';
        });
        const title = titleProp
          ? (titleProp.title || []).map(function(t) { return t.plain_text; }).join('')
          : 'Senza titolo';
        const icon = p.icon && p.icon.emoji ? p.icon.emoji : '📄';
        const cover = p.cover
          ? (p.cover.type === 'external' ? p.cover.external.url : (p.cover.file && p.cover.file.url))
          : null;
        return { id: p.id.replace(/-/g, ''), title, icon, cover };
      });

      return new Response(JSON.stringify({ pages }), {
        headers: { 'Content-Type': 'application/json', ...cors }
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

/* ── Carica ricorsivamente i children dei blocchi ── */
async function loadChildren(blocks, headers) {
  const result = [];
  for (const block of blocks) {
    const b = { ...block };
    if (b.has_children) {
      try {
        const res = await fetch(
          'https://api.notion.com/v1/blocks/' + b.id + '/children?page_size=100',
          { headers }
        );
        if (res.ok) {
          const data = await res.json();
          b.children = await loadChildren(data.results, headers);
        }
      } catch (e) {
        b.children = [];
      }
    }
    result.push(b);
  }
  return result;
}
