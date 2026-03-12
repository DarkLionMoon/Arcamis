#!/usr/bin/env node
/* ════════════════════════════════════
   ARCAMIS — scripts/fetch-notion.js
   Scarica tutte le pagine Notion e le
   salva come JSON statici in public/data/
   
   Uso: node scripts/fetch-notion.js
   Richiede: NOTION_TOKEN nell'ambiente
════════════════════════════════════ */

const fs   = require('fs');
const path = require('path');

const TOKEN   = process.env.NOTION_TOKEN;
const VERSION = '2022-06-28';

if (!TOKEN) {
  console.error('❌  NOTION_TOKEN non impostato');
  process.exit(1);
}

/* ── Cartelle di output ── */
const OUT_PAGES = path.join(__dirname, '../public/data/pages');
const OUT_DB    = path.join(__dirname, '../public/data/db');
[OUT_PAGES, OUT_DB].forEach(function(d){ fs.mkdirSync(d, { recursive: true }); });

/* ── Pagine da scaricare (ID senza trattini) ── */
const PAGE_IDS = [
  '2f00274fdc1c8065a11ff45192aa5dcb', /* Gameplay            */
  '2f00274fdc1c800b9d8fc366e8e40c5c', /* Regole              */
  '3130274fdc1c807eb61fde24e8236659', /* Materiale approvato */
  '2dd222f22ef8413f8cb48f03bbb4f4b0', /* Come si inizia      */
  '5cea525d149f4acb9c59007bf6b3d5ff', /* Andando avanti      */
  '2fd0274fdc1c80d8b948c4133f874f28', /* Galleria PG         */
  '2f00274fdc1c8089bfe6c24434d53b67', /* Biblioteca          */
  '2f00274fdc1c801c9697e75caa8d5f13', /* Bottega farmaceutica*/
  '2ff0274fdc1c80688dd6c2b293a1f626', /* Caserma             */
  '2ff0274fdc1c80769a4ae243f22f0582', /* Corporazione        */
  '2f00274fdc1c805ca01ec57f18d2ffee', /* Forgia              */
  '2f00274fdc1c801b8c13cefd9e15694e', /* Gilda avventurieri  */
  '2f00274fdc1c80faa99eda064ef0fabc', /* Locanda             */
  '2f00274fdc1c807aa03cc6cbeb3687cc', /* Ospedale            */
  '2ff0274fdc1c8035bad4f0b6ab705192', /* Sartoria            */
  '2f00274fdc1c80679bd3c3df8a1fa040', /* Pantheon            */
  '3000274fdc1c8033a214c44a1aa7f01f', /* Changelog           */
  '2f00274fdc1c802a9babd4239d97a319', /* Maestria/Titoli     */
  '2f00274fdc1c806f8f17dbc6532d2211', /* Lore                */
  '2f00274fdc1c80e78ad7ce985007b7c6', /* Homebrew            */
  '2f10274fdc1c80489f23c49164747770', /* Mappe               */
  /* Lore locations */
  '30d0274fdc1c805cbbc2daf73b5f3a66', /* Marche di Arcamis   */
  '3090274fdc1c80e1a365ce1c36873455', /* Arcamis (città)     */
  '30d0274fdc1c8090aee7ed0430170414', /* Forte Vigilus       */
  '30d0274fdc1c804b9cb7e366f02bd635', /* Volonx              */
  '30d0274fdc1c803387c4fda013b857e9', /* Lago di Gromot      */
  '30d0274fdc1c800999feeb0ca6669b22', /* Selva Fogliabruna   */
  '31f0274fdc1c8019945af2b26306462f', /* Galeton             */
  '31f0274fdc1c805b89b8f0678463e615', /* Fumofosco           */
  '31f0274fdc1c8075b0dec2e2a6bc359e', /* Riva di Ferro       */
  '31f0274fdc1c8059a923c73da185a0e3', /* Vigilius            */
  '31f0274fdc1c808191abe4df86d176e6', /* Rovine di Kaldur    */
  '31e0274fdc1c80f3a3cee348f59cede0', /* Rivorosso           */
  '31f0274fdc1c801ab723c7a00672c23c', /* Casate e Compagnie  */
  '31f0274fdc1c804b83e2c877ba0b19d6', /* Compagnie Mercantili*/
];

/* ── Funzioni helper ── */
async function notionFetch(path_) {
  const res = await fetch('https://api.notion.com/v1' + path_, {
    headers: {
      'Authorization': 'Bearer ' + TOKEN,
      'Notion-Version': VERSION,
      'Content-Type': 'application/json',
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(path_ + ' → ' + res.status + ' ' + (err.message || ''));
  }
  return res.json();
}

async function fetchAllBlocks(blockId, depth) {
  if (!depth) depth = 0;
  if (depth > 5) return [];
  let blocks = [], cursor;
  do {
    const qs = cursor ? `?page_size=100&start_cursor=${cursor}` : '?page_size=100';
    const data = await notionFetch('/blocks/' + blockId + '/children' + qs);
    blocks = blocks.concat(data.results || []);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  /* Parallelizza fetch figli */
  const withChildren = blocks.filter(b =>
    b.has_children && b.type !== 'child_page' && b.type !== 'child_database'
  );
  if (withChildren.length) {
    const childResults = await Promise.all(
      withChildren.map(b => fetchAllBlocks(b.id, depth + 1))
    );
    withChildren.forEach((b, i) => { b.children = childResults[i]; });
  }
  return blocks;
}

async function fetchPage(id) {
  const [page, blocks] = await Promise.all([
    notionFetch('/pages/' + id),
    fetchAllBlocks(id, 0),
  ]);
  /* Formato statico: {id, properties, cover, icon, blocks} */
  return {
    id: page.id.replace(/-/g, ''),
    properties: page.properties,
    cover: page.cover || null,
    icon: page.icon || null,
    blocks: blocks,
  };
}

/* ── Loop principale ── */
async function main() {
  console.log(`\n🏰  Arcamis — fetch-notion.js\n   ${PAGE_IDS.length} pagine da scaricare\n`);
  let ok = 0, fail = 0;

  for (const id of PAGE_IDS) {
    const outPath = path.join(OUT_PAGES, id + '.json');
    process.stdout.write(`  → ${id}... `);
    try {
      const data = await fetchPage(id);
      fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
      console.log('✔');
      ok++;
    } catch (e) {
      console.log('✘  ' + e.message);
      fail++;
    }
    /* Rate-limit Notion API: max ~3 req/s */
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\n✅  Completato: ${ok} ok, ${fail} errori`);
  console.log(`   File salvati in: public/data/pages/\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
