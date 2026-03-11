/* ════════════════════════════════════
   ARCAMIS — api/notion.js
   Versione ottimizzata per performance
   - Concurrency limiter (max 4 req paralleli verso Notion)
   - Cache s-maxage più aggressiva sulle pagine
   - Timeout per singola fetch ridotto a 8s
   - Depth limit ridotto a 3 (era 4)
════════════════════════════════════ */
const NOTION_VERSION = '2022-06-28';

/* ── Concurrency limiter: evita di bombardare Notion con 20+ req parallele ──
   Notion ha rate limit di ~3 req/s per integrazione — senza questo,
   fetchAllBlocks può lanciare 10-20 richieste parallele causando 429 e retry */
function makeLimiter(maxConcurrent) {
  var running = 0;
  var queue = [];
  function run() {
    if (running >= maxConcurrent || !queue.length) return;
    running++;
    var task = queue.shift();
    task.fn().then(function(v) {
      running--;
      task.resolve(v);
      run();
    }).catch(function(e) {
      running--;
      task.reject(e);
      run();
    });
  }
  return function limit(fn) {
    return new Promise(function(resolve, reject) {
      queue.push({ fn: fn, resolve: resolve, reject: reject });
      run();
    });
  };
}
var _limit = makeLimiter(4);

/* ── Fetch singola verso Notion con timeout 8s ── */
async function notionFetch(path, token, method, body) {
  var controller = new AbortController();
  var timer = setTimeout(function() { controller.abort(); }, 8000);
  try {
    var res = await fetch('https://api.notion.com/v1' + path, {
      method: method || 'GET',
      signal: controller.signal,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: (method === 'POST') ? JSON.stringify(body || { page_size: 100 }) : undefined,
    });
    clearTimeout(timer);
    if (!res.ok) {
      var err = await res.json().catch(function() { return {}; });
      throw new Error(err.message || ('Notion API error ' + res.status));
    }
    return res.json();
  } catch(e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') throw new Error('Timeout Notion API');
    throw e;
  }
}

/* ── fetchAllBlocks con concurrency limiter e depth max 3 ──
   Depth 3 invece di 4: riduce esponenzialmente il numero di richieste
   sulle pagine con molti blocchi annidati */
async function fetchAllBlocks(blockId, token, depth) {
  if (!depth) depth = 0;
  if (depth > 3) return [];
  var blocks = [];
  var cursor;

  do {
    var qs = cursor ? ('?page_size=100&start_cursor=' + cursor) : '?page_size=100';
    var bid = blockId;
    var bqs = qs;
    var data = await _limit(function() {
      return notionFetch('/blocks/' + bid + '/children' + bqs, token);
    });
    blocks = blocks.concat(data.results || []);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  var withChildren = blocks.filter(function(b) {
    return b.has_children && b.type !== 'child_page' && b.type !== 'child_database';
  });
  if (withChildren.length > 0) {
    var childResults = await Promise.all(
      withChildren.map(function(b) {
        return fetchAllBlocks(b.id, token, depth + 1);
      })
    );
    withChildren.forEach(function(b, i) { b.children = childResults[i]; });
  }

  return blocks;
}

/* ── Proxy immagine ── */
async function proxyImage(url, res) {
  try {
    var r = await fetch(url, { headers: { 'User-Agent': 'Arcamis/1.0' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    var ct = r.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', ct);
    /* immagini: cache molto lunga lato CDN */
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    res.setHeader('Access-Control-Allow-Origin', '*');
    var buf = Buffer.from(await r.arrayBuffer());
    return res.status(200).send(buf);
  } catch(e) {
    return res.status(502).json({ error: 'proxy error: ' + e.message });
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  var token = process.env.NOTION_TOKEN;
  if (!token) return res.status(500).json({ error: 'NOTION_TOKEN non configurato' });

  var pageId = req.query.pageId;
  var dbId   = req.query.dbId;
  var q      = req.query.q;
  var imgUrl = req.query.img;

  /* ── Proxy immagini ── */
  if (imgUrl) {
    if (!imgUrl.startsWith('https://prod-files-secure.s3') &&
        !imgUrl.startsWith('https://s3.us-west') &&
        !imgUrl.startsWith('https://notion.so') &&
        !imgUrl.startsWith('https://www.notion.so')) {
      return res.status(400).json({ error: 'URL non permesso' });
    }
    return proxyImage(imgUrl, res);
  }

  try {

    /* ── Ricerca full-text ── */
    if (q) {
      res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
      var data = await notionFetch('/search', token, 'POST', {
        query: q,
        filter: { value: 'page', property: 'object' },
        sort: { direction: 'descending', timestamp: 'last_edited_time' },
        page_size: 12,
      });
      var results = (data.results || []).map(function(p) {
        var titleProp = p.properties && Object.values(p.properties).find(function(v){ return v.type === 'title'; });
        var title = titleProp && titleProp.title
          ? titleProp.title.map(function(t){ return t.plain_text; }).join('')
          : (p.title ? p.title.map(function(t){ return t.plain_text; }).join('') : 'Senza titolo');
        var icon = p.icon && p.icon.type === 'emoji' ? p.icon.emoji : '📄';
        var id = p.id.replace(/-/g, '');
        return { id: id, title: title, icon: icon };
      }).filter(function(r){ return r.title && r.title !== 'Senza titolo'; });
      return res.status(200).json({ results: results });
    }

    /* ── Database query ── */
    if (dbId) {
      res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
      var data = await notionFetch('/databases/' + dbId + '/query', token, 'POST');
      var pages = (data.results || []).map(function(p) {
        var titleProp = Object.values(p.properties || {}).find(function(v){ return v.type === 'title'; });
        var title = titleProp && titleProp.title ? titleProp.title.map(function(t){ return t.plain_text; }).join('') : 'Senza titolo';
        var cover = null;
        if (p.cover) {
          cover = p.cover.type === 'external' ? p.cover.external.url : (p.cover.file && p.cover.file.url);
        }
        if (!cover) {
          var fileProp = Object.values(p.properties || {}).find(function(v){ return v.type === 'files' && v.files && v.files.length; });
          if (fileProp) {
            var f = fileProp.files[0];
            cover = f.type === 'external' ? f.external.url : (f.file && f.file.url);
          }
        }
        var icon = p.icon && p.icon.type === 'emoji' ? p.icon.emoji : null;
        return { id: p.id.replace(/-/g,''), title: title, cover: cover, icon: icon };
      });
      return res.status(200).json({ pages: pages });
    }

    /* ── Page fetch ── */
    if (!pageId) return res.status(400).json({ error: 'pageId, dbId o q mancante' });

    /* Cache aggressiva: 1 ora su edge Vercel CDN + 2 ore stale-while-revalidate
       Il client usa già sessionStorage/memCache per navigazioni successive */
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');

    var results = await Promise.all([
      _limit(function() { return notionFetch('/pages/' + pageId, token); }),
      fetchAllBlocks(pageId, token, 0),
    ]);
    return res.status(200).json({ page: results[0], blocks: results[1] });

  } catch (err) {
    console.error(err);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).json({ error: err.message });
  }
};
