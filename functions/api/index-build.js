const PAGES_TO_INDEX = [
  { id:'2f00274fdc1c802a9babd4239d97a319', title:'Maestria / Titoli', icon:'🔨' },
  { id:'2f00274fdc1c8065a11ff45192aa5dcb', title:'Gameplay', icon:'⚔️' },
  { id:'3130274fdc1c807eb61fde24e8236659', title:'Materiale approvato', icon:'📋' },
  { id:'2f00274fdc1c801c9697e75caa8d5f13', title:'Bottega farmaceutica', icon:'💊' },
  { id:'2ff0274fdc1c80688dd6c2b293a1f626', title:'Caserma', icon:'🛡️' },
  { id:'2ff0274fdc1c80769a4ae243f22f0582', title:'Corporazione dei costruttori', icon:'🔨' },
  { id:'3460274fdc1c800c8b3bf9a53d0cbf59', title:'Tribunale', icon:'⚖️' },
  { id:'2f00274fdc1c806f8f17dbc6532d2211', title:'Storia del mondo', icon:'📖' },
  { id:'2f00274fdc1c80679bd3c3df8a1fa040', title:'Pantheon', icon:'🛐' },
  { id:'2f10274fdc1c80489f23c49164747770', title:'Mappe', icon:'🗺️' }
];

const DATABASES_TO_INDEX = [
  { id:'2fd0274fdc1c80038889fc072a360bae', label:'Galleria PG' },
  { id:'2f60274fdc1c80fba671c588ba93b116', label:'Specie HB' },
  { id:'2ff0274fdc1c807ea473db02ac4ae391', label:'Specie HB alt' },
  { id:'2f70274fdc1c80e3bdc7f95f81eb9cc0', label:'Sottoclassi HB' },
  { id:'3350274fdc1c808fba5ed9ad1f3b4bb4', label:'Classi HB' },
  { id:'3040274fdc1c80e0a0dccfa9761bff55', label:'Biblioteca' },
  { id:'2f90274fdc1c8015bf95f52c4e7681b8', label:'NPC' }
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
