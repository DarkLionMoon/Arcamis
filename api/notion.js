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
  if (!res.ok) throw new Error('Notion API error ' + res.status);
  return res.json();
}

export default async function handler(req, res) {
  const token = process.env.NOTION_TOKEN;
  const { pageId, dbId } = req.query;

  try {
    if (dbId) {
      const data = await notionFetch('/databases/' + dbId + '/query', token, 'POST');
      const pages = data.results.map(p => {
        const titleProp = Object.values(p.properties).find(v => v.type === 'title');
        const title = titleProp ? titleProp.title.map(t => t.plain_text).join('') : 'Senza titolo';
        let cover = null;
        const fileProp = Object.values(p.properties).find(v => v.type === 'files' && v.files.length > 0);
        if (fileProp) {
          const f = fileProp.files[0];
          cover = f.type === 'external' ? f.external.url : f.file.url;
        } else if (p.cover) {
          cover = p.cover.type === 'external' ? p.cover.external.url : p.cover.file.url;
        }
        return { id: p.id.replace(/-/g, ''), title, cover, icon: p.icon?.emoji || null };
      });
      return res.status(200).json({ pages });
    }

    if (pageId) {
      const page = await notionFetch('/pages/' + pageId, token);
      const blocksData = await notionFetch('/blocks/' + pageId + '/children', token);
      for (let b of blocksData.results) {
        if (b.has_children) {
          const children = await notionFetch('/blocks/' + b.id + '/children', token);
          b.children = children.results;
        }
      }
      return res.status(200).json({ page, blocks: blocksData.results });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
