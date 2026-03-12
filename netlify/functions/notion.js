/* ════════════════════════════════════
   ARCAMIS — netlify/functions/notion.js
   Serverless function — proxy Notion API
   Cache: 3 ore (stale-while-revalidate 6h)
════════════════════════════════════ */

const TOKEN   = process.env.NOTION_TOKEN;
const VERSION = '2022-06-28';
const CACHE   = 'public, s-maxage=10800, stale-while-revalidate=21600';

async function notionFetch(path, method, body) {
  const res = await fetch('https://api.notion.com/v1' + path, {
    method: method || 'GET',
    headers: {
      'Authorization': 'Bearer ' + TOKEN,
      'Notion-Version': VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(res.status + ' ' + (err.message || res.statusText));
  }
  return res.json();
}

async function fetchAllBlocks(blockId, depth) {
  depth = depth || 0;
  if (depth > 5) return [];
  let blocks = [], cursor;
  do {
    const qs = cursor ? `?page_size=100&start_cursor=${cursor}` : '?page_size=100';
    const data = await notionFetch('/blocks/' + blockId + '/children' + qs);
    blocks = blocks.concat(data.results || []);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  const withChildren = blocks.filter(b =>
    b.has_children && b.type !== 'child_page' && b.type !== 'child_database'
  );
  if (withChildren.length) {
    const results = await Promise.all(
      withChildren.map(b => fetchAllBlocks(b.id, depth + 1))
    );
    withChildren.forEach((b, i) => { b.children = results[i]; });
  }
  return blocks;
}

exports.handler = async function(event) {
  if (!TOKEN) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'NOTION_TOKEN non configurato' }),
    };
  }

  const params = event.queryStringParameters || {};
  const { pageId, dbId, img, q } = params;

  try {
    /* ── Proxy immagini S3 Notion ── */
    if (img) {
      const ALLOWED_IMG = ['s3.us-west', 'prod-files-secure', 'secure.notion-static', 'images.unsplash'];
      const isAllowed = ALLOWED_IMG.some(function(d){ return img.indexOf(d) > -1; });
      if (!isAllowed) {
        return { statusCode: 403, body: JSON.stringify({ error: 'URL non consentito' }) };
      }
      const r = await fetch(img);
      if (!r.ok) return { statusCode: r.status, body: '' };
      const contentType = r.headers.get('content-type') || 'image/webp';
      const buf = await r.arrayBuffer();
      return {
        statusCode: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
        body: Buffer.from(buf).toString('base64'),
        isBase64Encoded: true,
      };
    }

    /* ── Pagina singola ── */
    if (pageId) {
      const [page, blocks] = await Promise.all([
        notionFetch('/pages/' + pageId),
        fetchAllBlocks(pageId),
      ]);
      return {
        statusCode: 200,
        headers: { 'Cache-Control': CACHE, 'Content-Type': 'application/json' },
        body: JSON.stringify({ page, blocks }),
      };
    }

    /* ── Database ── */
    if (dbId) {
      const data = await notionFetch('/databases/' + dbId + '/query', 'POST', {
        page_size: 100,
        sorts: [{ timestamp: 'created_time', direction: 'ascending' }],
      });
      const pages = await Promise.all(
        (data.results || []).map(async (p) => {
          const titleProp = Object.values(p.properties || {})
            .find(prop => prop.type === 'title');
          const title = titleProp
            ? (titleProp.title || []).map(t => t.plain_text).join('')
            : 'Senza titolo';
          const icon = p.icon?.emoji || '📄';
          let coverUrl = null;
          if (p.cover) {
            coverUrl = p.cover.type === 'external'
              ? p.cover.external?.url
              : p.cover.file?.url;
          }
          return { id: p.id.replace(/-/g, ''), title, icon, cover: coverUrl };
        })
      );
      return {
        statusCode: 200,
        headers: { 'Cache-Control': CACHE, 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages }),
      };
    }

    /* ── Ricerca ── */
    if (q) {
      const data = await notionFetch('/search', 'POST', {
        query: q,
        filter: { property: 'object', value: 'page' },
        page_size: 8,
      });
      const results = (data.results || []).map(p => {
        const titleProp = Object.values(p.properties || {})
          .find(prop => prop.type === 'title');
        const title = titleProp
          ? (titleProp.title || []).map(t => t.plain_text).join('')
          : 'Senza titolo';
        return { id: p.id.replace(/-/g, ''), title, icon: p.icon?.emoji || '📄' };
      });
      return {
        statusCode: 200,
        headers: { 'Cache-Control': 'public, s-maxage=300', 'Content-Type': 'application/json' },
        body: JSON.stringify({ results }),
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Parametro mancante: pageId, dbId, img o q' }),
    };

  } catch (e) {
    console.error('Notion API error:', e.message);
    return {
      statusCode: 502,
      body: JSON.stringify({ error: e.message }),
    };
  }
};
