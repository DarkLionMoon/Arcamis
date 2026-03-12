/* ════════════════════════════════════
   ARCAMIS — functions/api/notion.js
   Cloudflare Pages Function
   Cache: 3 ore (stale-while-revalidate 6h)
════════════════════════════════════ */

const VERSION = '2022-06-28';
const CACHE   = 'public, s-maxage=10800, stale-while-revalidate=21600';

async function notionFetch(path, method, body, token) {
  const res = await fetch('https://api.notion.com/v1' + path, {
    method: method || 'GET',
    headers: {
      'Authorization': 'Bearer ' + token,
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

async function fetchAllBlocks(blockId, depth, token) {
  depth = depth || 0;
  if (depth > 5) return [];
  let blocks = [], cursor;
  do {
    const qs = cursor ? '?page_size=100&start_cursor=' + cursor : '?page_size=100';
    const data = await notionFetch('/blocks/' + blockId + '/children' + qs, 'GET', null, token);
    blocks = blocks.concat(data.results || []);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  const withChildren = blocks.filter(function(b) {
    return b.has_children && b.type !== 'child_page' && b.type !== 'child_database';
  });
  if (withChildren.length) {
    const results = await Promise.all(
      withChildren.map(function(b) { return fetchAllBlocks(b.id, depth + 1, token); })
    );
    withChildren.forEach(function(b, i) { b.children = results[i]; });
  }
  return blocks;
}

function jsonResponse(data, status, extraHeaders) {
  const headers = Object.assign({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  }, extraHeaders || {});
  return new Response(JSON.stringify(data), { status: status || 200, headers });
}

export async function onRequest(context) {
  const TOKEN = context.env.NOTION_TOKEN;
  if (!TOKEN) {
    return jsonResponse({ error: 'NOTION_TOKEN non configurato' }, 500);
  }

  const url = new URL(context.request.url);
  const pageId = url.searchParams.get('pageId');
  const dbId   = url.searchParams.get('dbId');
  const img    = url.searchParams.get('img');
  const q      = url.searchParams.get('q');

  try {
    /* ── Proxy immagini S3 Notion ── */
    if (img) {
      const ALLOWED_IMG = ['s3.us-west', 'prod-files-secure', 'secure.notion-static', 'images.unsplash'];
      const isAllowed = ALLOWED_IMG.some(function(d) { return img.indexOf(d) > -1; });
      if (!isAllowed) return jsonResponse({ error: 'URL non consentito' }, 403);
      const r = await fetch(img);
      if (!r.ok) return new Response('', { status: r.status });
      const buf = await r.arrayBuffer();
      return new Response(buf, {
        status: 200,
        headers: {
          'Content-Type': r.headers.get('content-type') || 'image/webp',
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      });
    }

    /* ── Pagina singola ── */
    if (pageId) {
      const [page, blocks] = await Promise.all([
        notionFetch('/pages/' + pageId, 'GET', null, TOKEN),
        fetchAllBlocks(pageId, 0, TOKEN),
      ]);
      return jsonResponse({ page, blocks }, 200, { 'Cache-Control': CACHE });
    }

    /* ── Database ── */
    if (dbId) {
      const data = await notionFetch('/databases/' + dbId + '/query', 'POST', {
        page_size: 100,
        sorts: [{ timestamp: 'created_time', direction: 'ascending' }],
      }, TOKEN);
      const pages = (data.results || []).map(function(p) {
        const titleProp = Object.values(p.properties || {})
          .find(function(prop) { return prop.type === 'title'; });
        const title = titleProp
          ? (titleProp.title || []).map(function(t) { return t.plain_text; }).join('')
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
      return jsonResponse({ pages }, 200, { 'Cache-Control': CACHE });
    }

    /* ── Ricerca ── */
    if (q) {
      const data = await notionFetch('/search', 'POST', {
        query: q,
        filter: { property: 'object', value: 'page' },
        page_size: 8,
      }, TOKEN);
      const results = (data.results || []).map(function(p) {
        const titleProp = Object.values(p.properties || {})
          .find(function(prop) { return prop.type === 'title'; });
        const title = titleProp
          ? (titleProp.title || []).map(function(t) { return t.plain_text; }).join('')
          : 'Senza titolo';
        return { id: p.id.replace(/-/g, ''), title, icon: (p.icon && p.icon.emoji) || '📄' };
      });
      return jsonResponse({ results }, 200, { 'Cache-Control': 'public, s-maxage=300' });
    }

    return jsonResponse({ error: 'Parametro mancante: pageId, dbId, img o q' }, 400);

  } catch (e) {
    console.error('Notion API error:', e.message);
    return jsonResponse({ error: e.message }, 502);
  }
}
