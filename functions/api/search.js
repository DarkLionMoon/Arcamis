export async function onRequest(context) {
  const url = new URL(context.request.url);
  const q = url.searchParams.get('q');
  const TOKEN = context.env.NOTION_TOKEN;

  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (!q || q.length < 2) {
    return new Response(JSON.stringify({ results: [] }), { headers: cors });
  }

  try {
    const res = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: q,
        filter: { value: 'page', property: 'object' },
        page_size: 10
      })
    });

    if (!res.ok) throw new Error('Notion search error: ' + res.status);
    const data = await res.json();

    const results = (data.results || []).map(function(p) {
      const titleProp = Object.values(p.properties || {}).find(v => v.type === 'title');
      const title = titleProp
        ? (titleProp.title || []).map(t => t.plain_text).join('')
        : (p.properties?.title?.title || []).map(t => t.plain_text).join('') || 'Senza titolo';

      const icon = p.icon && p.icon.emoji ? p.icon.emoji : '📄';
      const id = p.id.replace(/-/g, '');

      // Recupera il titolo della pagina parent se esiste
      const parentTitle = p.parent && p.parent.type === 'page_id'
        ? null  // potremmo risolverlo ma appesantirebbe
        : null;

      return { id, title, icon, parentTitle };
    }).filter(p => p.title && p.title !== 'Senza titolo');

    return new Response(JSON.stringify({ results }), { headers: cors });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message, results: [] }), {
      status: 500,
      headers: cors
    });
  }
}
