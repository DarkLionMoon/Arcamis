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

/* ── Recupera tutti i blocchi (con paginazione + figli in parallelo) ── */
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

/* ── Helper risposta JSON ── */
function json(statusCode, data, extraHeaders) {
  return {
    statusCode,
    headers: Object.assign({ 'Content-Type': 'application/json' }, extraHeaders || {}),
    body: JSON.stringify(data),
  };
}

exports.handler = async function(event) {
  if (!TOKEN) {
    return json(500, { error: 'NOTION_TOKEN non configurato' });
  }

  const params = event.queryStringParameters || {};
  const { pageId, dbId, img, q } = params;

  try {
    /* ── Proxy immagini S3 Notion (URL firmati scadono) ── */
    if (img) {
      const ALLOWED_IMG = ['s3.us-west', 'prod-files-secure', 'secure.notion-static', 'images.unsplash'];
      const isAllowed = ALLOWED_IMG.some(function(d){ return img.indexOf(d) > -1; });
      if (!isAllowed) return json(403, { error: 'URL non consentito' });
      const r = await fetch(img);
      if (!r.ok) return { statusCode: r.status, body: '' };
      const buf = await r.arrayBuffer();
      return {
        statusCode: 200,
        headers: {
          'Content-Type': r.headers.get('content-type') || 'image/webp',
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
      return json(200, { page, blocks }, { 'Cache-Control': CACHE });
    }

    /* ── Database (gallerie, locazioni) ── */
    if (dbId) {
      const data = await notionFetch('/databases/' + dbId + '/query', 'POST', {
        page_size: 100,
        sorts: [{ timestamp: 'created_time', direction: 'ascending' }],
      });
      const pages = (data.results || []).map(function(p) {
        const titleProp = Object.values(p.properties || {})
          .find(function(prop){ return prop.type === 'title'; });
        const title = titleProp
          ? (titleProp.title || []).map(function(t){ return t.plain_text; }).join('')
          : 'Senza titolo';
        const icon = (p.icon && p.icon.emoji) || '📄';
        let coverUrl = null;
        if (p.cover) {
          coverUrl = p.cover.type === 'external'
            ? (p.cover.external && p.cover.external.url)
            : (p.cover.file && p.cover.file.url);
        }
        return { id: p.id.replace(/-/g, ''), title, icon, cover: coverUrl };
      });
      return json(200, { pages }, { 'Cache-Control': CACHE });
    }

    /* ── Ricerca ── */
    if (q) {
      const data = await notionFetch('/search', 'POST', {
        query: q,
        filter: { property: 'object', value: 'page' },
        page_size: 8,
      });
      const results = (data.results || []).map(function(p) {
        const titleProp = Object.values(p.properties || {})
          .find(function(prop){ return prop.type === 'title'; });
        const title = titleProp
          ? (titleProp.title || []).map(function(t){ return t.plain_text; }).join('')
          : 'Senza titolo';
        return { id: p.id.replace(/-/g, ''), title, icon: (p.icon && p.icon.emoji) || '📄' };
      });
      return json(200, { results }, { 'Cache-Control': 'public, s-maxage=300' });
    }

    return json(400, { error: 'Parametro mancante: pageId, dbId, img o q' });

  } catch (e) {
    console.error('Notion API error:', e.message);
    return json(502, { error: e.message });
  }
};
