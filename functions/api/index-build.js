const PAGES_TO_INDEX = [

];

const DATABASES_TO_INDEX = [

];

async function fetchBlocks(pageId, token) {
  const blocks = [];
  let cursor = undefined;
  do {
    const url = 'https://api.notion.com/v1/blocks/' + pageId + '/children?page_size=100'
      + (cursor ? '&start_cursor=' + cursor : '');
    const res = await fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + token,
        'Notion-Version': '2022-06-28'
      }
    });
    if (!res.ok) break;
    const data = await res.json();
    blocks.push(...(data.results || []));
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return blocks;
}

function extractText(blocks) {
  const lines = [];
  for (const b of blocks) {
    const type = b.type;
    const content = b[type];
    if (!content) continue;
    const rich = content.rich_text || content.text || [];
    const text = rich.map(t => t.plain_text || '').join('').trim();
    if (text) lines.push(text);
  }
  return lines.join(' ');
}

async function fetchDatabasePages(dbId, token) {
  const pages = [];
  let cursor = undefined;
  do {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const res = await fetch('https://api.notion.com/v1/databases/' + dbId + '/query', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) break;
    const data = await res.json();
    pages.push(...(data.results || []));
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return pages;
}

function extractPageTitle(page) {
  const titleProp = Object.values(page.properties || {}).find(v => v.type === 'title');
  if (titleProp) return (titleProp.title || []).map(t => t.plain_text).join('').trim();
  return '';
}

function extractPageIcon(page) {
  return page.icon && page.icon.emoji ? page.icon.emoji : '📄';
}
function extractProperties(page) {
  const parts = [];
  for (const prop of Object.values(page.properties || {})) {
    if (prop.type === 'select' && prop.select) {
      parts.push(prop.select.name || '');
    } else if (prop.type === 'multi_select') {
      (prop.multi_select || []).forEach(s => parts.push(s.name || ''));
    } else if (prop.type === 'rich_text') {
      (prop.rich_text || []).forEach(t => parts.push(t.plain_text || ''));
    } else if (prop.type === 'title') {
      (prop.title || []).forEach(t => parts.push(t.plain_text || ''));
    }
  }
  return parts.filter(Boolean).join(' ');
}
  export async function onRequest(context) {
  const url = new URL(context.request.url);
  const key = url.searchParams.get('key');
  const dbParam = url.searchParams.get('db'); // es. ?db=specie
  const TOKEN = context.env.NOTION_TOKEN;
  const SECRET = context.env.PURGE_SECRET;
  const KV = context.env.ARCAMIS_CACHE;

  const cors = { 'Access-Control-Allow-Origin': 'https://arcamis.pages.dev', 'Content-Type': 'application/json' };

  if (key !== SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
  }
  if (url.searchParams.get('action') === 'clear') {
    const list = await KV.list({ prefix: 'search_idx:' });
    for (const k of list.keys) {
      await KV.delete(k.name);
    }
    return new Response(JSON.stringify({ ok: true, deleted: list.keys.length }), { headers: cors });
  }
  const results = [];

  if (!dbParam) {
    // Solo pagine note, nessun database
    for (const page of PAGES_TO_INDEX) {
      try {
        const blocks = await fetchBlocks(page.id, TOKEN);
        const text = extractText(blocks);
        const entry = { id: page.id, title: page.title, icon: page.icon, text };
        await KV.put('search_idx:' + page.id, JSON.stringify(entry), { expirationTtl: 60 * 60 * 24 * 7 });
        results.push({ id: page.id, title: page.title, ok: true, chars: text.length });
      } catch (e) {
        results.push({ id: page.id, title: page.title, ok: false, error: e.message });
      }
    }
  } else {
    // Indicizza solo il database richiesto
    const db = DATABASES_TO_INDEX.find(d => d.label.toLowerCase().replace(/\s+/g, '-') === dbParam);
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database non trovato: ' + dbParam }), { headers: cors });
    }
    try {
      const pages = await fetchDatabasePages(db.id, TOKEN);
      let dbCount = 0;
      for (const page of pages) {
        try {
          const title = extractPageTitle(page);
          if (!title) continue;
          const icon = extractPageIcon(page);
          const id = page.id.replace(/-/g, '');
          const blocks = await fetchBlocks(id, TOKEN);
const bodyText = extractText(blocks);
const propsText = extractProperties(page);
const text = (propsText + ' ' + bodyText).trim();
const entry = { id, title, icon, text };
          await KV.put('search_idx:' + id, JSON.stringify(entry), { expirationTtl: 60 * 60 * 24 * 7 });
          dbCount++;
        } catch (e) {}
      }
      results.push({ db: db.label, ok: true, pages: dbCount });
    } catch (e) {
      results.push({ db: db.label, ok: false, error: e.message });
    }
  }

  return new Response(JSON.stringify({ indexed: results.length, results }), { headers: cors });
}
