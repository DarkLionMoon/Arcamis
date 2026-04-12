// functions/api/changelog.js
export async function onRequest(context) {
  const { env } = context;
  const KV = env.ARCAMIS_CACHE;
  const NOTION_KEY = env.NOTION_TOKEN;
  const DB_ID = '3400274fdc1c80178db3dcf6ba7098aa';
  const CACHE_KEY = 'db_changelog_v1';
  const CACHE_TTL = 3600;
  const CACHE_SWR = 86400;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  // Purge
  const url = new URL(context.request.url);
  if (url.searchParams.get('purge') === 'true') {
    const key = url.searchParams.get('key');
    if (key !== env.PURGE_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }
    await KV.delete(CACHE_KEY);
    return new Response(JSON.stringify({ ok: true, purged: CACHE_KEY }), { headers });
  }

  // SWR cache helpers — stesso pattern di notion.js
  async function kvGet(k) {
    try {
      const raw = await KV.get(k, 'text');
      if (!raw) return null;
      try {
        const wrapper = JSON.parse(raw);
        if (wrapper && wrapper.expiresAt && wrapper.data !== undefined) {
          return { value: wrapper.data, stale: Date.now() > wrapper.expiresAt };
        }
      } catch (_) {}
      return { value: raw, stale: false };
    } catch (_) { return null; }
  }

  async function kvPut(k, data) {
    const wrapper = JSON.stringify({ expiresAt: Date.now() + CACHE_TTL * 1000, data });
    await KV.put(k, wrapper, { expirationTtl: CACHE_SWR });
  }

  async function fetchEntries() {
    let entries = [];
    let cursor = undefined;
    let hasMore = true;

    while (hasMore) {
      const body = { sorts: [{ property: 'Data', direction: 'ascending' }], page_size: 100 };
      if (cursor) body.start_cursor = cursor;

      const res = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${NOTION_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Notion ${res.status}: ${await res.text()}`);

      const data = await res.json();
      hasMore = data.has_more;
      cursor = data.next_cursor;

      for (const page of data.results) {
        const props = page.properties;
        entries.push({
          id: page.id.replace(/-/g, ''),
          title:        props['Titolo']?.title?.[0]?.plain_text ?? '(senza titolo)',
          versione:     props['Versione']?.select?.name ?? null,
          sottoversione:props['Sottoversione']?.select?.name ?? null,
          patch:        props['Patch']?.select?.name ?? null,
          date:         props['Data']?.date?.start ?? null,
        });
      }
    }
    return entries;
  }

  try {
    const cached = await kvGet(CACHE_KEY);

    if (cached) {
      // Stale: servi subito e aggiorna in background
      if (cached.stale) {
        context.waitUntil(
          fetchEntries()
            .then(e => kvPut(CACHE_KEY, e))
            .catch(() => {})
        );
      }
      return new Response(JSON.stringify(cached.value), { headers });
    }

    // Cache miss: fetch e salva
    const entries = await fetchEntries();
await kvPut(CACHE_KEY, entries);
return new Response(JSON.stringify(entries), { headers });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
}
