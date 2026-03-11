const NOTION_VERSION = '2022-06-28';

async function notionFetch(path, token, method, body) {
  var res = await fetch('https://api.notion.com/v1' + path, {
    method: method || 'GET',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: (method === 'POST') ? JSON.stringify(body || { page_size: 100 }) : undefined,
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
  var q      = req.query.q;

  try {

    // ── Ricerca full-text Notion ─────────────────────────────────────
    if (q) {
      var data = await notionFetch('/search', token, 'POST', {
        query: q,
        filter: { value: 'page', property: 'object' },
        sort: { direction: 'descending', timestamp: 'last_edited_time' },
        page_size: 12,
      });
      var results = (data.results || []).map(function(p) {
        // titolo
        var titleProp = p.properties && Object.values(p.properties).find(function(v){ return v.type === 'title'; });
        var title = titleProp && titleProp.title
          ? titleProp.title.map(function(t){ return t.plain_text; }).join('')
          : (p.title ? p.title.map(function(t){ return t.plain_text; }).join('') : 'Senza titolo');
        // icona
        var icon = p.icon && p.icon.type === 'emoji' ? p.icon.emoji : '📄';
        // ID pulito
        var id = p.id.replace(/-/g, '');
        return { id: id, title: title, icon: icon };
      }).filter(function(r){ return r.title && r.title !== 'Senza titolo'; });
      return res.status(200).json({ results: results });
    }

    // ── Database query (gallery cards) ──────────────────────────────
    if (dbId) {
      var data = await notionFetch('/databases/' + dbId + '/query', token, 'POST');
      var pages = (data.results || []).map(function(p) {
        var titleProp = Object.values(p.properties || {}).find(function(v){ return v.type === 'title'; });
        var title = titleProp && titleProp.title ? titleProp.title.map(function(t){ return t.plain_text; }).join('') : 'Senza titolo';
        var cover = null;
        if (p.cover) {
          cover = p.cover.type === 'external' ? p.cover.external.url : (p.cover.file && p.cover.file.url);
        }
        var icon = p.icon && p.icon.type === 'emoji' ? p.icon.emoji : null;
        return { id: p.id.replace(/-/g,''), title: title, cover: cover, icon: icon };
      });
      return res.status(200).json({ pages: pages });
    }

    // ── Page fetch ───────────────────────────────────────────────────
    if (!pageId) return res.status(400).json({ error: 'pageId, dbId o q mancante' });
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
