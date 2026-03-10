const NOTION_VERSION = '2022-06-28';

async function notionFetch(path, token, method) {
  var res = await fetch('https://api.notion.com/v1' + path, {
    method: method || 'GET',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: method === 'POST' ? JSON.stringify({ page_size: 100 }) : undefined,
  });
  if (!res.ok) {
    var err = await res.json().catch(function() { return {}; });
    throw new Error(err.message || ('Notion API error ' + res.status));
  }
  return res.json();
}

async function fetchAllBlocks(blockId, token, depth) {
  if (!depth) depth = 0;
  if (depth > 4) return [];
  var blocks = [];
  var cursor;

  do {
    var qs = cursor ? ('?page_size=100&start_cursor=' + cursor) : '?page_size=100';
    var data = await notionFetch('/blocks/' + blockId + '/children' + qs, token);
    blocks = blocks.concat(data.results || []);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  for (var i = 0; i < blocks.length; i++) {
    var block = blocks[i];
    if (block.has_children && block.type !== 'child_page' && block.type !== 'child_database') {
      block.children = await fetchAllBlocks(block.id, token, depth + 1);
    }
  }

  return blocks;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  var token = process.env.NOTION_TOKEN;
  if (!token) return res.status(500).json({ error: 'NOTION_TOKEN non configurato' });

  var pageId = req.query.pageId;
  var dbId   = req.query.dbId;

  try {
    // ── Database query (gallery cards) ──────────────────────────────
    if (dbId) {
      var data = await notionFetch('/databases/' + dbId + '/query', token, 'POST');
      var pages = (data.results || []).map(function(p) {
        // title
        var titleProp = Object.values(p.properties || {}).find(function(v){ return v.type === 'title'; });
        var title = titleProp && titleProp.title ? titleProp.title.map(function(t){ return t.plain_text; }).join('') : 'Senza titolo';
        // cover
        var cover = null;
        if (p.cover) {
          cover = p.cover.type === 'external' ? p.cover.external.url : (p.cover.file && p.cover.file.url);
        }
        // icon
        var icon = p.icon && p.icon.type === 'emoji' ? p.icon.emoji : null;
        return { id: p.id.replace(/-/g,''), title: title, cover: cover, icon: icon };
      });
      return res.status(200).json({ pages: pages });
    }

    // ── Page fetch ───────────────────────────────────────────────────
    if (!pageId) return res.status(400).json({ error: 'pageId o dbId mancante' });
    var results = await Promise.all([
      notionFetch('/pages/' + pageId, token),
      fetchAllBlocks(pageId, token, 0),
    ]);
    return res.status(200).json({ page: results[0], blocks: results[1] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
