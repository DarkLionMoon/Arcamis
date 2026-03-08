const NOTION_VERSION = '2022-06-28';

async function notionFetch(path, token) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Notion API error ${res.status}`);
  }
  return res.json();
}

async function fetchAllBlocks(blockId, token, depth) {
  if (depth === undefined) depth = 0;
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
    if (
      block.has_children &&
      block.type !== 'child_page' &&
      block.type !== 'child_database'
    ) {
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
  if (!token) return res.status(500).json({ error: 'NOTION_TOKEN not configured' });

  var pageId = req.query.pageId;
  if (!pageId) return res.status(400).json({ error: 'pageId is required' });

  try {
    var results = await Promise.all([
      notionFetch('/pages/' + pageId, token),
      fetchAllBlocks(pageId, token, 0),
    ]);
    var page = results[0];
    var blocks = results[1];
    return res.status(200).json({ page: page, blocks: blocks });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
