// functions/api/changelog.js
export async function onRequest(context) {
  const { env } = context;
  const KV = env.ARCAMIS_KV;
  const NOTION_KEY = env.NOTION_KEY;
  const DB_ID = '3400274fdc1c80178db3dcf6ba7098aa';
  const CACHE_KEY = 'db_changelog_v1';

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

  // Cache check
  const cached = await KV.get(CACHE_KEY);
  if (cached) {
    return new Response(cached, { headers });
  }

  // Fetch all pages from DB (paginated)
  let entries = [];
  let cursor = undefined;
  let hasMore = true;

  while (hasMore) {
    const body = {
      sorts: [{ property: 'Data', direction: 'descending' }],
      page_size: 100,
    };
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

    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ error: err }), { status: 500, headers });
    }

    const data = await res.json();
    hasMore = data.has_more;
    cursor = data.next_cursor;

    for (const page of data.results) {
      const props = page.properties;

      const title = props['Titolo']?.title?.[0]?.plain_text ?? '(senza titolo)';
      const versione = props['Versione']?.select?.name ?? null;
      const sottoversione = props['Sottoversione']?.select?.name ?? null;
      const patch = props['Patch']?.select?.name ?? null;
      const data_raw = props['Data']?.date?.start ?? null;

      entries.push({
        id: page.id,
        title,
        versione,
        sottoversione,
        patch,
        date: data_raw,
      });
    }
  }

  // Sort ascending for display (oldest first within groups)
  entries.sort((a, b) => {
    if (a.date && b.date) return a.date.localeCompare(b.date);
    return 0;
  });

  const result = JSON.stringify(entries);
  await KV.put(CACHE_KEY, result, { expirationTtl: 3600 });
  return new Response(result, { headers });
}
