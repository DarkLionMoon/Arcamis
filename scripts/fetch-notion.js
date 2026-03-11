#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════
   ARCAMIS — scripts/fetch-notion.js
   Script di build: scarica tutto il contenuto da Notion una volta
   sola e salva file JSON statici in public/data/

   USO:
     NOTION_TOKEN=secret_xxx node scripts/fetch-notion.js

   OUTPUT:
     public/data/pages/<id>.json     → contenuto di ogni pagina
     public/data/db/<id>.json        → contenuto di ogni database
     public/data/manifest.json       → lista pagine + timestamp build

   Come integrare su Vercel:
     In vercel.json aggiungi:
       "buildCommand": "node scripts/fetch-notion.js && <tuo build>"
     Oppure mettilo come script npm:
       "build": "node scripts/fetch-notion.js"
════════════════════════════════════════════════════════════════ */

const fs   = require('fs');
const path = require('path');

const NOTION_VERSION = '2022-06-28';
const TOKEN = process.env.NOTION_TOKEN;
const OUT_PAGES = path.join(__dirname, '..', 'public', 'data', 'pages');
const OUT_DB    = path.join(__dirname, '..', 'public', 'data', 'db');
const OUT_ROOT  = path.join(__dirname, '..', 'public', 'data');

if (!TOKEN) {
  console.error('❌  NOTION_TOKEN non impostato. Usa: NOTION_TOKEN=secret_xxx node scripts/fetch-notion.js');
  process.exit(1);
}

/* ── ID di tutte le pagine principali (da data.js) ── */
const PAGES = [
  { k:'gameplay',   l:'Gameplay',                 i:'⚔️',  id:'2f00274fdc1c8065a11ff45192aa5dcb' },
  { k:'regole',     l:'Regole',                   i:'📜',  id:'2f00274fdc1c800b9d8fc366e8e40c5c' },
  { k:'materiale',  l:'Materiale approvato',       i:'📋',  id:'3130274fdc1c807eb61fde24e8236659' },
  { k:'inizia',     l:'Come si inizia',            i:'🌟',  id:'2dd222f22ef8413f8cb48f03bbb4f4b0' },
  { k:'avanti',     l:'Andando avanti',            i:'📈',  id:'5cea525d149f4acb9c59007bf6b3d5ff' },
  { k:'galleria',   l:'Galleria PG',              i:'🖼️', id:'2fd0274fdc1c80d8b948c4133f874f28' },
  { k:'biblioteca', l:'Biblioteca',               i:'📚',  id:'2f00274fdc1c8089bfe6c24434d53b67' },
  { k:'bottega',    l:'Bottega farmaceutica',     i:'💊',  id:'2f00274fdc1c801c9697e75caa8d5f13' },
  { k:'caserma',    l:'Caserma',                  i:'🛡️', id:'2ff0274fdc1c80688dd6c2b293a1f626' },
  { k:'corp',       l:'Corporazione costruttori', i:'🔨',  id:'2ff0274fdc1c80769a4ae243f22f0582' },
  { k:'forgia',     l:'Forgia',                   i:'🔥',  id:'2f00274fdc1c805ca01ec57f18d2ffee' },
  { k:'gilda',      l:'Gilda degli avventurieri', i:'🗡️', id:'2f00274fdc1c801b8c13cefd9e15694e' },
  { k:'locanda',    l:'Locanda',                  i:'🍺',  id:'2f00274fdc1c80faa99eda064ef0fabc' },
  { k:'ospedale',   l:'Ospedale',                 i:'⚕️', id:'2f00274fdc1c807aa03cc6cbeb3687cc' },
  { k:'sartoria',   l:'Sartoria',                 i:'🧵',  id:'2ff0274fdc1c8035bad4f0b6ab705192' },
  { k:'pantheon',   l:'Pantheon',                 i:'🛐',  id:'2f00274fdc1c80679bd3c3df8a1fa040' },
  { k:'changelog',  l:'Changelog',                i:'📝',  id:'3000274fdc1c8033a214c44a1aa7f01f' },
  { k:'maestria',   l:'Maestria / Titoli',        i:'🔨',  id:'2f00274fdc1c802a9babd4239d97a319' },
  { k:'lore',       l:'Lore',                     i:'📚',  id:'2f00274fdc1c806f8f17dbc6532d2211' },
  { k:'homebrew',   l:'Homebrew',                 i:'❓',  id:'2f00274fdc1c80e78ad7ce985007b7c6' },
  { k:'mappe',      l:'Mappe',                    i:'🗺️', id:'2f10274fdc1c80489f23c49164747770' },
];

/* ID root (logo) */
const ROOT_ID = '2f00274fdc1c801a9b39d8d69800f7a8';

/* ────────────────────────────────────────────────────────────
   Concurrency limiter — max 3 richieste parallele verso Notion
   (rate limit ~3 req/s)
─────────────────────────────────────────────────────────────*/
function makeLimiter(max) {
  let running = 0, queue = [];
  const run = () => {
    if (running >= max || !queue.length) return;
    running++;
    const { fn, resolve, reject } = queue.shift();
    fn().then(v => { running--; resolve(v); run(); })
        .catch(e => { running--; reject(e);  run(); });
  };
  return fn => new Promise((resolve, reject) => { queue.push({ fn, resolve, reject }); run(); });
}
const limit = makeLimiter(3);

/* ────────────────────────────────────────────────────────────
   notionFetch con retry su 429 / timeout 15s
─────────────────────────────────────────────────────────────*/
async function notionFetch(pathStr, method, body, attempt = 0) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch('https://api.notion.com/v1' + pathStr, {
      method: method || 'GET',
      signal: ctrl.signal,
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: method === 'POST' ? JSON.stringify(body || { page_size: 100 }) : undefined,
    });
    clearTimeout(timer);

    /* rate limit → aspetta e riprova */
    if (res.status === 429) {
      const retry = parseInt(res.headers.get('retry-after') || '2', 10);
      if (attempt < 4) {
        console.log(`  ⏳ Rate limit, aspetto ${retry}s…`);
        await sleep((retry + 0.5) * 1000);
        return notionFetch(pathStr, method, body, attempt + 1);
      }
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Notion ${res.status}`);
    }
    return res.json();
  } catch(e) {
    clearTimeout(timer);
    if (e.name === 'AbortError' && attempt < 2) {
      console.log(`  ⚠️  Timeout, riprovo…`);
      await sleep(1500);
      return notionFetch(pathStr, method, body, attempt + 1);
    }
    throw e;
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ────────────────────────────────────────────────────────────
   fetchAllBlocks — uguale al runtime ma con concurrency limiter
─────────────────────────────────────────────────────────────*/
async function fetchAllBlocks(blockId, depth = 0) {
  if (depth > 4) return [];
  let blocks = [], cursor;

  do {
    const qs = cursor ? `?page_size=100&start_cursor=${cursor}` : '?page_size=100';
    const data = await limit(() => notionFetch(`/blocks/${blockId}/children${qs}`));
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

/* ────────────────────────────────────────────────────────────
   Raccoglie tutti gli ID child_page ricorsivamente
─────────────────────────────────────────────────────────────*/
function collectChildPageIds(blocks, found = new Set()) {
  for (const b of blocks) {
    if (b.type === 'child_page') {
      found.add(b.id.replace(/-/g, ''));
    }
    if (b.children) collectChildPageIds(b.children, found);
  }
  return found;
}

/* ────────────────────────────────────────────────────────────
   Raccoglie tutti gli ID child_database ricorsivamente
─────────────────────────────────────────────────────────────*/
function collectDbIds(blocks, found = new Set()) {
  for (const b of blocks) {
    if (b.type === 'child_database') {
      found.add(b.id.replace(/-/g, ''));
    }
    if (b.children) collectDbIds(b.children, found);
  }
  return found;
}

/* ────────────────────────────────────────────────────────────
   Fetch di un singolo DB (gallery)
─────────────────────────────────────────────────────────────*/
async function fetchDb(dbId) {
  const data = await limit(() => notionFetch(`/databases/${dbId}/query`, 'POST'));
  return (data.results || []).map(p => {
    const titleProp = Object.values(p.properties || {}).find(v => v.type === 'title');
    const title = titleProp?.title ? titleProp.title.map(t => t.plain_text).join('') : 'Senza titolo';
    let cover = null;
    if (p.cover) cover = p.cover.type === 'external' ? p.cover.external.url : p.cover.file?.url;
    if (!cover) {
      const fp = Object.values(p.properties || {}).find(v => v.type === 'files' && v.files?.length);
      if (fp) { const f = fp.files[0]; cover = f.type === 'external' ? f.external.url : f.file?.url; }
    }
    const icon = p.icon?.type === 'emoji' ? p.icon.emoji : null;
    return { id: p.id.replace(/-/g,''), title, cover, icon };
  });
}

/* ────────────────────────────────────────────────────────────
   MAIN
─────────────────────────────────────────────────────────────*/
(async () => {
  console.log('\n🏰  ARCAMIS — Build statico Notion\n' + '─'.repeat(44));

  /* crea directory output */
  fs.mkdirSync(OUT_PAGES, { recursive: true });
  fs.mkdirSync(OUT_DB,    { recursive: true });

  const allChildPageIds = new Set();
  const allDbIds        = new Set();
  const manifest        = { buildAt: new Date().toISOString(), pages: [] };

  /* ── 1. Scarica pagine principali ── */
  console.log('\n📄 Pagine principali…');
  for (const pg of PAGES) {
    process.stdout.write(`  ${pg.i}  ${pg.l}… `);
    try {
      const [page, blocks] = await Promise.all([
        limit(() => notionFetch(`/pages/${pg.id}`)),
        fetchAllBlocks(pg.id),
      ]);
      const out = { page, blocks };
      fs.writeFileSync(path.join(OUT_PAGES, `${pg.id}.json`), JSON.stringify(out));

      /* raccogli child_page e DB trovati dentro i blocchi */
      collectChildPageIds(blocks, allChildPageIds);
      collectDbIds(blocks, allDbIds);

      manifest.pages.push({ k: pg.k, l: pg.l, i: pg.i, id: pg.id });
      console.log('✓');
    } catch(e) {
      console.log(`✗  ${e.message}`);
    }
  }

  /* ── 2. Scarica root (logo) ── */
  console.log('\n🔑 Root page (logo)…');
  try {
    const page = await limit(() => notionFetch(`/pages/${ROOT_ID}`));
    fs.writeFileSync(path.join(OUT_PAGES, `${ROOT_ID}.json`), JSON.stringify({ page, blocks: [] }));
    console.log('  ✓ root');
  } catch(e) { console.log('  ✗ root:', e.message); }

  /* ── 3. Scarica child_page trovate dentro le pagine principali ── */
  /* rimuovi quelle già scaricate */
  PAGES.forEach(p => allChildPageIds.delete(p.id));
  allChildPageIds.delete(ROOT_ID);

  if (allChildPageIds.size > 0) {
    console.log(`\n📑 Child pages (${allChildPageIds.size})…`);
    for (const cid of allChildPageIds) {
      process.stdout.write(`  📄 ${cid}… `);
      try {
        const [page, blocks] = await Promise.all([
          limit(() => notionFetch(`/pages/${cid}`)),
          fetchAllBlocks(cid),
        ]);
        fs.writeFileSync(path.join(OUT_PAGES, `${cid}.json`), JSON.stringify({ page, blocks }));
        /* child_page possono avere ulteriori child_page annidate */
        collectChildPageIds(blocks, allChildPageIds);
        collectDbIds(blocks, allDbIds);
        console.log('✓');
      } catch(e) { console.log(`✗  ${e.message}`); }
    }
  }

  /* ── 4. Scarica tutti i database trovati ── */
  if (allDbIds.size > 0) {
    console.log(`\n🗄️  Database (${allDbIds.size})…`);
    for (const dbId of allDbIds) {
      process.stdout.write(`  🗄️  ${dbId}… `);
      try {
        const pages = await fetchDb(dbId);
        fs.writeFileSync(path.join(OUT_DB, `${dbId}.json`), JSON.stringify({ pages }));
        console.log(`✓ (${pages.length} voci)`);
      } catch(e) { console.log(`✗  ${e.message}`); }
    }
  }

  /* ── 5. Scrivi manifest ── */
  fs.writeFileSync(path.join(OUT_ROOT, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log('\n✅  Build completato!');
  console.log(`   Pagine:    ${fs.readdirSync(OUT_PAGES).length}`);
  console.log(`   Database:  ${fs.readdirSync(OUT_DB).length}`);
  console.log(`   Output:    public/data/\n`);
})();
