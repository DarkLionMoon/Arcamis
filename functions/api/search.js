function getSnippet(text, query, radius = 120) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return null;
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + query.length + radius);
  let snippet = text.slice(start, end).trim();
  if (start > 0) snippet = '…' + snippet;
  if (end < text.length) snippet = snippet + '…';
  // highlight
  const re = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
  snippet = snippet.replace(re, '<mark>$1</mark>');
  return snippet;
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const q = (url.searchParams.get('q') || '').trim();
  const KV = context.env.ARCAMIS_CACHE;
  const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  if (q.length < 2) {
    return new Response(JSON.stringify({ results: [] }), { headers: cors });
  }

  try {
    // Lista tutte le chiavi dell'indice
    const list = await KV.list({ prefix: 'search_idx:' });
    const results = [];

    for (const key of list.keys) {
      const raw = await KV.get(key.name);
      if (!raw) continue;
      const entry = JSON.parse(raw);
      const qLow = q.toLowerCase();
      const titleMatch = entry.title.toLowerCase().includes(qLow);
      const textMatch = entry.text.toLowerCase().includes(qLow);

      if (!titleMatch && !textMatch) continue;

      const snippet = textMatch ? getSnippet(entry.text, q) : null;
      results.push({
        id: entry.id,
        title: entry.title,
        icon: entry.icon,
        snippet,
        score: titleMatch ? 2 : 1
      });
    }

    // Ordina per score (titolo > contenuto)
    results.sort((a, b) => b.score - a.score);

    return new Response(JSON.stringify({ results: results.slice(0, 12) }), { headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message, results: [] }), {
      status: 500, headers: cors
    });
  }
}
