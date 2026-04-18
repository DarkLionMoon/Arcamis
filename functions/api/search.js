function getSnippet(text, query, radius = 120) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return null;
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + query.length + radius);
  let snippet = text.slice(start, end).trim();
  if (start > 0) snippet = '…' + snippet;
  if (end < text.length) snippet = snippet + '…';
  const re = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
  snippet = snippet.replace(re, '<mark>$1</mark>');
  return snippet;
}

async function searchKV(q, KV) {
  try {
    const list = await KV.list({ prefix: 'search_idx:' });
    const results = [];
    for (const key of list.keys) {
      const raw = await KV.get(key.name);
      if (!raw) continue;
      const entry = JSON.parse(raw);
      const qLow = q.toLowerCase();
      const titleMatch = entry.title.toLowerCase().includes(qLow);
      const textMatch = entry.text && entry.text.toLowerCase().includes(qLow);
      if (!titleMatch && !textMatch) continue;
      const snippet = textMatch ? getSnippet(entry.text, q) : null;
      results.push({
        id: entry.id,
        title: entry.title,
        icon: entry.icon || '📄',
        snippet,
        score: titleMatch ? 2 : 1,
        source: 'kv'
      });
    }
    return results;
  } catch (e) {
    return [];
  }
}

async function searchNotion(q, TOKEN) {
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
        page_size: 20
      })
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map(function(p) {
      const titleProp = Object.values(p.properties || {}).find(v => v.type === 'title');
      const title = titleProp
        ? (titleProp.title || []).map(t => t.plain_text).join('')
        : (p.properties?.title?.title || []).map(t => t.plain_text).join('') || 'Senza titolo';
      const icon = p.icon && p.icon.emoji ? p.icon.emoji : '📄';
      const id = p.id.replace(/-/g, '');
      if (!title || title === 'Senza titolo') return null;

      // Recupera snippet dal contenuto Notion se disponibile
      let snippet = null;
      const lastEdited = p.last_edited_time || '';

      return { id, title, icon, snippet, score: 1, source: 'notion', lastEdited };
    }).filter(Boolean);
  } catch (e) {
    return [];
  }
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const q = (url.searchParams.get('q') || '').trim();
  const KV = context.env.ARCAMIS_CACHE;
  const TOKEN = context.env.NOTION_TOKEN;
  const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  if (q.length < 2) {
    return new Response(JSON.stringify({ results: [] }), { headers: cors });
  }

  try {
    // Esegui KV search e Notion search in parallelo
    const [kvResults, notionResults] = await Promise.all([
      searchKV(q, KV),
      searchNotion(q, TOKEN)
    ]);

    // Merge: KV ha priorità, Notion riempie il resto
    const seen = new Set(kvResults.map(r => r.id));
    const merged = [...kvResults];

    for (const r of notionResults) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        merged.push(r);
      }
    }

    // Ordina: titolo match > contenuto KV > Notion
    merged.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.source === 'kv' && b.source !== 'kv') return -1;
      if (b.source === 'kv' && a.source !== 'kv') return 1;
      return 0;
    });

    return new Response(JSON.stringify({ results: merged.slice(0, 15) }), { headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message, results: [] }), {
      status: 500, headers: cors
    });
  }
}
