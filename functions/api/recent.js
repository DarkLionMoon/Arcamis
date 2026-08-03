/* ════════════════════════════════════
   functions/api/recent.js
   Ultime N pagine modificate in Notion
════════════════════════════════════ */
export async function onRequest(context) {
  const TOKEN = context.env.NOTION_TOKEN;
  const KV    = context.env.ARCAMIS_CACHE;
  const cors = {
    'Access-Control-Allow-Origin': 'https://arcamis.pages.dev',
    'Cache-Control': 'public, max-age=300'
  };
  const CACHE_KEY = 'recent_pages';
  const CACHE_TTL = 300; // 5 min
  // Titoli da escludere (pagine di sistema, DB root, ecc.)
  const EXCLUDE_TITLES = [
    '', 'Untitled', 'Senza titolo',
    'Regole Homebrew per specie e classi già esistenti',
    'Il Calendario di Aetherion',
  ];
  // ID da escludere (root pages, DB pages, ecc.)
  const EXCLUDE_IDS = new Set([
    '2f0027', // aggiungi prefissi ID da escludere
  ]);
  try {
    // Cache KV
    if (KV) {
      try {
        const cached = await KV.get(CACHE_KEY, 'text');
        if (cached) {
          const wrapper = JSON.parse(cached);
          if (wrapper && wrapper.expiresAt && Date.now() < wrapper.expiresAt) {
            return new Response(wrapper.data, {
              headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT', ...cors }
            });
          }
        }
      } catch(_) {}
    }
    const res = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sort: { direction: 'descending', timestamp: 'last_edited_time' },
        filter: { value: 'page', property: 'object' },
        page_size: 50
      })
    });
    if (!res.ok) throw new Error('Notion search error: ' + res.status);
    const data = await res.json();
    const pages = (data.results || [])
      .map(p => {
        const titleProp = Object.values(p.properties || {}).find(v => v.type === 'title');
        const title = titleProp
          ? (titleProp.title || []).map(t => t.plain_text).join('')
          : (p.properties?.title?.title?.[0]?.plain_text || '');
        const icon = p.icon?.emoji || '📄';
        const id   = p.id.replace(/-/g, '');
        return {
          id,
          title: title || 'Senza titolo',
          icon,
          lastEdited: p.last_edited_time,
          // parentTitle per contesto
          parentTitle: p.parent?.type === 'page_id' ? null : null
        };
      })
      .filter(p =>
        p.title &&
        !EXCLUDE_TITLES.includes(p.title) &&
        p.title !== 'Senza titolo'
      )
      .slice(0, 24);
    const payload = JSON.stringify({ pages });
    // Salva in KV
    if (KV) {
      try {
        await KV.put(CACHE_KEY, JSON.stringify({
          expiresAt: Date.now() + CACHE_TTL * 1000,
          data: payload
        }), { expirationTtl: 3600 });
      } catch(_) {}
    }
    return new Response(payload, {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS', ...cors }
    });
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message, pages: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...cors }
    });
  }
}
