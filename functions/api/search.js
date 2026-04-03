export async function onRequest(context) {
  const url = new URL(context.request.url);
  const q = (url.searchParams.get('q') || '').toLowerCase().trim();
  const KV = context.env.ARCAMIS_CACHE;

  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store'
  };

  if (!q || q.length < 2) {
    return new Response(JSON.stringify({ results: [] }), { headers: cors });
  }

  try {
    const raw = await KV.get('search_index');
    if (!raw) {
      return new Response(JSON.stringify({ results: [], stale: true }), { headers: cors });
    }

    const index = JSON.parse(raw);
    const results = [];

    for (const entry of index) {
      /* Cerca in titolo e keywords */
      const haystack = (entry.title + ' ' + (entry.keywords || '')).toLowerCase();
      if (haystack.indexOf(q) > -1) {
        results.push(entry);
        if (results.length >= 20) break;
      }
    }

    return new Response(JSON.stringify({ results }), { headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
  }
}
