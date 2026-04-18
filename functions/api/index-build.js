const PAGES_TO_INDEX = [
  { id:'2f00274fdc1c8065a11ff45192aa5dcb', title:'Gameplay',                    icon:'⚔️' },
  { id:'2f00274fdc1c800b9d8fc366e8e40c5c', title:'Regole generali',             icon:'📜' },
  { id:'3130274fdc1c807eb61fde24e8236659', title:'Materiale approvato',         icon:'📋' },
  { id:'2dd222f22ef8413f8cb48f03bbb4f4b0', title:'Come si inizia',              icon:'🌟' },
  { id:'5cea525d149f4acb9c59007bf6b3d5ff', title:'Andando avanti',              icon:'📈' },
  { id:'2f00274fdc1c801b8c13cefd9e15694e', title:'Gilda avventurieri',          icon:'🗡️' },
  { id:'2f00274fdc1c80faa99eda064ef0fabc', title:'Locanda',                     icon:'🍺' },
  { id:'2f00274fdc1c805ca01ec57f18d2ffee', title:'Forgia',                      icon:'🔥' },
  { id:'2f00274fdc1c8089bfe6c24434d53b67', title:'Biblioteca',                  icon:'📚' },
  { id:'2f00274fdc1c801c9697e75caa8d5f13', title:'Bottega farmaceutica',        icon:'💊' },
  { id:'2ff0274fdc1c80688dd6c2b293a1f626', title:'Caserma',                     icon:'🛡️' },
  { id:'2ff0274fdc1c80769a4ae243f22f0582', title:'Corporazione dei costruttori',icon:'🔨' },
  { id:'2f00274fdc1c807aa03cc6cbeb3687cc', title:'Ospedale',                    icon:'⚕️' },
  { id:'2ff0274fdc1c8035bad4f0b6ab705192', title:'Sartoria',                    icon:'🧵' },
  { id:'3460274fdc1c800c8b3bf9a53d0cbf59', title:'Tribunale',                   icon:'⚖️' },
  { id:'2f00274fdc1c806f8f17dbc6532d2211', title:'Storia del mondo',            icon:'📖' },
  { id:'2f00274fdc1c80679bd3c3df8a1fa040', title:'Pantheon',                    icon:'🛐' },
  { id:'2f10274fdc1c80489f23c49164747770', title:'Mappe',                       icon:'🗺️' },
  { id:'2f00274fdc1c802a9babd4239d97a319', title:'Maestria / Titoli',           icon:'🏅' },
  { id:'2f00274fdc1c80e78ad7ce985007b7c6', title:'Homebrew',                    icon:'⚗️' },
  { id:'2f00274fdc1c8065a11ff45192aa5dcb', title:'Gameplay',                    icon:'⚔️' },
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

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const key = url.searchParams.get('key');
  const TOKEN = context.env.NOTION_TOKEN;
  const SECRET = context.env.PURGE_SECRET;
  const KV = context.env.ARCAMIS_CACHE;

  const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  if (key !== SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
  }

  const results = [];
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

  return new Response(JSON.stringify({ indexed: results.length, results }), { headers: cors });
}
