#!/usr/bin/env node
/* ════════════════════════════════════
   ARCAMIS — export-all.js
   Export completo di tutti i contenuti
   da Notion, Google Sheets e Google Docs
   in JSON locali.
   
   Uso: node export-all.js [--token=NOTION_TOKEN]
   
   Richiede:
   - NOTION_TOKEN: Integration token da notion.so/my-integrations
   - Google Sheets/Docs pubblici (no auth needed per export CSV/HTML)
════════════════════════════════════ */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ── CONFIG ──
const NOTION_TOKEN = process.argv.find(a => a.startsWith('--token='))?.split('=')[1]
  || process.env.NOTION_TOKEN || '';
const OUT_DIR = path.join(__dirname, 'content');
const DELAY = 350; // ms between API calls (rate limit)

// ── PAGE REGISTRY ──
const PAGES = [
  {k:'gameplay',l:'Gameplay',i:'⚔️',id:'2f00274fdc1c8065a11ff45192aa5dcb'},
  {k:'regole',l:'Regole',i:'📜',id:'2f00274fdc1c800b9d8fc366e8e40c5c'},
  {k:'materiale',l:'Materiale approvato',i:'📋',id:'3130274fdc1c807eb61fde24e8236659'},
  {k:'inizia',l:'Come si inizia',i:'🌟',id:'2dd222f22ef8413f8cb48f03bbb4f4b0'},
  {k:'avanti',l:'Andando avanti',i:'📈',id:'5cea525d149f4acb9c59007bf6b3d5ff'},
  {k:'galleria',l:'Galleria PG',i:'🖼️',id:'2fd0274fdc1c80d8b948c4133f874f28'},
  {k:'biblioteca',l:'Biblioteca',i:'📚',id:'2f00274fdc1c8089bfe6c24434d53b67'},
  {k:'farmacia',l:'Bottega farmaceutica',i:'🧪',id:'3090274fdc1c8013a183dfc31297c477'},
  {k:'arcamis',l:'Arcamis',i:'🏰',id:'3090274fdc1c80e1a365ce1c36873455'},
  {k:'selva',l:'Selva Fogliabruna',i:'🍂',id:'30d0274fdc1c800999feeb0ca6669b22'},
  {k:'foresta',l:'Foresta Smarrimento',i:'🌲',id:'30d0274fdc1c8016b113d5c2d7662d8f'},
  {k:'volonx',l:'Volonx',i:'🏔️',id:'30d0274fdc1c804b9cb7e366f02bd635'},
  {k:'arpax',l:'Arpax',i:'🦅',id:'30d0274fdc1c807eb443f55071f00844'},
  {k:'deserto',l:'Deserto del Crepuscolo',i:'🔥',id:'2f00274fdc1c805ca01ec57f18d2ffee'},
  {k:'gilda',l:'Gilda degli avventurieri',i:'🗡️',id:'2f00274fdc1c801b8c13cefd9e15694e'},
  {k:'locanda',l:'Locanda',i:'🍺',id:'2f00274fdc1c80faa99eda064ef0fabc'},
  {k:'ospedale',l:'Ospedale',i:'⚕️',id:'2f00274fdc1c807aa03cc6cbeb3687cc'},
  {k:'sartoria',l:'Sartoria',i:'🧵',id:'2ff0274fdc1c8035bad4f0b6ab705192'},
  {k:'pantheon',l:'Pantheon',i:'🛐',id:'2f00274fdc1c80679bd3c3df8a1fa040'},
  {k:'maestria',l:'Maestria / Titoli',i:'🔨',id:'2f00274fdc1c802a9babd4239d97a319'},
];

// ── DATABASES ──
const DBS = [
  {name:'gallery',label:'Galleria PG',dbId:'2fd0274fdc1c80038889fc072a360bae'},
  {name:'npc',label:'NPC',dbId:'3320274fdc1c805090becb2a5a0414e1'},
  {name:'biblioteca',label:'Biblioteca',dbId:'3040274fdc1c80e0a0dccfa9761bff55'},
  {name:'timeline',label:'Timeline',dbId:'2fc0274fdc1c800f8ac0d6d03b255cad'},
  {name:'subclasses',label:'Subclass',dbId:'2f70274fdc1c80e3bdc7f95f81eb9cc0'},
  {name:'species',label:'Specie',dbId:'3350274fdc1c808fba5ed9ad1f3b4bb4'},
  {name:'changelog',label:'Changelog',dbId:'3400274fdc1c80178db3dcf6ba7098aa'},
];

// ── MESTIERI (Google Sheets) ──
const MESTIERI_SHEETS = [
  {key:'alchimista',sheetId:'1uhrl26JgLv3pkqkqUwJITeVRC66sDsEn_7iRna9bk4Q'},
  {key:'architetto',sheetId:'1lqgabVPdkmxCgAyTS9FJlarpk6kaVUoDEMXd6hF5mps'},
  {key:'artigiano',sheetId:'1pcNTvNKOzV3dl-cwAFcm-r4gxVN-F8_G2tdkvSl_Oss'},
  {key:'artista',sheetId:'14wN27A8m6_dLCwrqFDRhgt_OsVdOGd0on8s6iuGpkv4'},
  {key:'falegname',sheetId:'1TY1jBO27VNy_czEfeLtgJr8f2KQLDospO85sIgLM3Xo'},
  {key:'metallurgo',sheetId:'193EbLwI0nkFDhLA4WSeLympCEKtQIXtIuEbrC2fTNLc'},
  {key:'oste',sheetId:'1jMCKim7y6Z730I92VJdyMBK_JFMdh7PkuALBxOAmHcM'},
  {key:'sarto',sheetId:'1Q-YNWmRyIjCO0ReQ8KoYa_bHRxQLJ-DOU7QyDPqJBHU'},
  {key:'reputation',sheetId:'1196WfeJFp4C9QIKnwAR2O3exz3AkfRDvwcBAiIBHV0M',gid:'1406195911'},
];

// ── GOOGLE DOCS ──
const DOCS = [
  {key:'patenti',docId:'1VHhDaYADbsVu9yq00ESBcVzat2kqWa3NMkPV1tb_ccc',format:'html'},
  {key:'codice',docId:'1vht_pvOzfvNDLaibetb3bdXOxWwYCugq_Km_s9xmmAQ',format:'html'},
  {key:'come-funzionano',docId:'1alXhUBS7xRFduBjlN6fwuilIgQDznsOehe4nTiCsIK0',format:'txt'},
];

// ── HELPERS ──
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function log(msg, cls) {
  const c = cls === 'err' ? '\x1b[31m' : cls === 'ok' ? '\x1b[32m' : cls === 'info' ? '\x1b[36m' : '';
  console.log(c + msg + '\x1b[0m');
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function fetch(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { headers }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location, headers).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// ── NOTION API ──
async function notionBlocks(blockId, depth = 0) {
  if (depth > 5) return [];
  const blocks = [];
  let cursor = undefined;
  do {
    const url = `https://api.notion.com/v1/blocks/${blockId}/children?page_size=100${cursor ? '&start_cursor=' + cursor : ''}`;
    const res = await fetch(url, {
      'Authorization': 'Bearer ' + NOTION_TOKEN,
      'Notion-Version': '2022-06-28'
    });
    const data = JSON.parse(res.data);
    if (data.results) {
      for (const block of data.results) {
        if (block.has_children) {
          block.children = await notionBlocks(block.id, depth + 1);
        }
        blocks.push(block);
      }
    }
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return blocks;
}

async function notionPage(pageId) {
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    'Authorization': 'Bearer ' + NOTION_TOKEN,
    'Notion-Version': '2022-06-28'
  });
  return JSON.parse(res.data);
}

async function notionDb(dbId) {
  const pages = [];
  let cursor = undefined;
  do {
    const body = JSON.stringify({ start_cursor: cursor });
    const url = `https://api.notion.com/v1/databases/${dbId}/query?page_size=100`;
    const res = await fetch(url, {
      'Authorization': 'Bearer ' + NOTION_TOKEN,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    });
    // For POST we need a different approach with http module
    // Simplified: use the existing proxy endpoint
    const data = JSON.parse(res.data);
    if (data.results) {
      for (const page of data.results) {
        const props = page.properties || {};
        const title = props.title?.title?.map(t => t.plain_text).join('') || '';
        pages.push({
          id: page.id,
          title,
          icon: page.icon?.emoji || '',
          cover: page.cover?.type === 'external' ? page.cover.external.url : (page.cover?.file?.url || null),
          classe: props.classe?.select?.name || null,
          specie: props.specie?.select?.name || null,
          dove: props.dove?.rich_text?.map(t => t.plain_text).join('') || null,
        });
      }
    }
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return pages;
}

// ── BLOCKS → MARKDOWN ──
function blocksToMd(blocks) {
  if (!blocks || !blocks.length) return '';
  let md = '';
  for (const b of blocks) {
    let content = '';
    if (b.rich_text?.length) {
      content = b.rich_text.map(rt => {
        let t = rt.plain_text || '';
        if (rt.annotations) {
          if (rt.annotations.bold) t = '**' + t + '**';
          if (rt.annotations.italic) t = '*' + t + '*';
          if (rt.annotations.code) t = '`' + t + '`';
        }
        if (rt.href) t = '[' + t + '](' + rt.href + ')';
        return t;
      }).join('');
    }
    switch (b.type) {
      case 'paragraph': md += content + '\n\n'; break;
      case 'heading_1': md += '# ' + content + '\n\n'; break;
      case 'heading_2': md += '## ' + content + '\n\n'; break;
      case 'heading_3': md += '### ' + content + '\n\n'; break;
      case 'bulleted_list_item': md += '- ' + content + '\n'; break;
      case 'numbered_list_item': md += '1. ' + content + '\n'; break;
      case 'quote': md += '> ' + content + '\n\n'; break;
      case 'divider': md += '---\n\n'; break;
      case 'code': md += '```\n' + content + '\n```\n\n'; break;
      case 'callout': md += '> ' + (b.icon?.emoji || '') + ' ' + content + '\n\n'; break;
      case 'image':
        const imgUrl = b.image?.file?.url || b.image?.external?.url || '';
        if (imgUrl) md += '![](' + imgUrl + ')\n\n';
        break;
      case 'bookmark':
        if (b.bookmark?.url) md += '[Bookmark](' + b.bookmark.url + ')\n\n';
        break;
      case 'table':
        if (b.table?.children) {
          b.table.children.forEach(row => {
            if (row.table?.cells) {
              md += '| ' + row.table.cells.map(c => c.map(rt => rt.plain_text).join('')).join(' | ') + ' |\n';
            }
          });
          md += '\n';
        }
        break;
      case 'child_page':
        md += '[📄 ' + (b.child_page?.title || 'Page') + ']\n\n';
        break;
      default:
        if (content) md += content + '\n\n';
    }
    if (b.children?.length) md += blocksToMd(b.children);
  }
  return md;
}

// ── CSV PARSER ──
function parseCsv(text) {
  return text.trim().split('\n').map(line => {
    const cells = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { cells.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    cells.push(current.trim());
    return cells;
  });
}

// ── MAIN ──
async function main() {
  console.log('\n⚔  ARCAMIS — Export Completo Contenuti\n');
  
  ensureDir(path.join(OUT_DIR, 'pages'));
  ensureDir(path.join(OUT_DIR, 'db'));
  ensureDir(path.join(OUT_DIR, 'mestieri'));
  ensureDir(path.join(OUT_DIR, 'docs'));

  const stats = { pages: 0, dbs: 0, sheets: 0, docs: 0, errors: 0 };

  // ═══ 1. NOTION PAGES ═══
  log('\n📄 FASE 1: Pagine Wiki (' + PAGES.length + ')', 'info');
  for (const p of PAGES) {
    try {
      log('  → ' + p.l + '...');
      const page = await notionPage(p.id);
      const blocks = await notionBlocks(p.id);
      const md = blocksToMd(blocks);
      const json = { k: p.k, title: p.l, icon: p.i, content: md, lastModified: new Date().toISOString() };
      fs.writeFileSync(path.join(OUT_DIR, 'pages', p.k + '.json'), JSON.stringify(json, null, 2));
      log('  ✅ ' + p.l + ' (' + md.length + ' chars)', 'ok');
      stats.pages++;
    } catch (e) {
      log('  ❌ ' + p.l + ': ' + e.message, 'err');
      stats.errors++;
    }
    await sleep(DELAY);
  }

  // ═══ 2. NOTION DATABASES ═══
  log('\n🗄️  FASE 2: Database (' + DBS.length + ')', 'info');
  for (const db of DBS) {
    try {
      log('  → ' + db.label + '...');
      const pages = await notionDb(db.dbId);
      fs.writeFileSync(path.join(OUT_DIR, 'db', db.name + '.json'), JSON.stringify(pages, null, 2));
      log('  ✅ ' + db.label + ' (' + pages.length + ' items)', 'ok');
      stats.dbs++;
    } catch (e) {
      log('  ❌ ' + db.label + ': ' + e.message, 'err');
      stats.errors++;
    }
    await sleep(DELAY);
  }

  // ═══ 3. GOOGLE SHEETS ═══
  log('\n📊 FASE 3: Google Sheets (' + MESTIERI_SHEETS.length + ')', 'info');
  for (const sheet of MESTIERI_SHEETS) {
    try {
      log('  → ' + sheet.key + '...');
      let csvUrl = `https://docs.google.com/spreadsheets/d/${sheet.sheetId}/export?format=csv`;
      if (sheet.gid) csvUrl += '&gid=' + sheet.gid;
      
      // Try to fetch CSV (public sheets only)
      const res = await fetch(csvUrl);
      if (res.status === 200) {
        const rows = parseCsv(res.data);
        const filename = sheet.key === 'reputation' ? 'reputation.json' : sheet.key + '.json';
        fs.writeFileSync(path.join(OUT_DIR, 'mestieri', filename), JSON.stringify(rows, null, 2));
        log('  ✅ ' + sheet.key + ' (' + rows.length + ' rows)', 'ok');
        stats.sheets++;
      } else {
        log('  ⚠️  ' + sheet.key + ': Sheet non pubblico o non accessibile (HTTP ' + res.status + ')', 'err');
        stats.errors++;
      }
    } catch (e) {
      log('  ❌ ' + sheet.key + ': ' + e.message, 'err');
      stats.errors++;
    }
    await sleep(DELAY);
  }

  // ═══ 4. GOOGLE DOCS ═══
  log('\n📝 FASE 4: Google Docs (' + DOCS.length + ')', 'info');
  for (const doc of DOCS) {
    try {
      log('  → ' + doc.key + '...');
      const format = doc.format === 'html' ? 'html' : 'txt';
      const url = `https://docs.google.com/document/d/${doc.docId}/export?format=${format}`;
      const res = await fetch(url);
      if (res.status === 200) {
        const json = { key: doc.key, content: res.data, lastModified: new Date().toISOString() };
        fs.writeFileSync(path.join(OUT_DIR, 'docs', doc.key + '.json'), JSON.stringify(json, null, 2));
        log('  ✅ ' + doc.key + ' (' + res.data.length + ' chars)', 'ok');
        stats.docs++;
      } else {
        log('  ⚠️  ' + doc.key + ': Doc non pubblico (HTTP ' + res.status + ')', 'err');
        stats.errors++;
      }
    } catch (e) {
      log('  ❌ ' + doc.key + ': ' + e.message, 'err');
      stats.errors++;
    }
    await sleep(DELAY);
  }

  // ═══ SUMMARY ═══
  console.log('\n' + '═'.repeat(50));
  console.log('📊 RIEPILOGO EXPORT');
  console.log('═'.repeat(50));
  console.log(`  Pagine Wiki:    ${stats.pages}/${PAGES.length}`);
  console.log(`  Database:       ${stats.dbs}/${DBS.length}`);
  console.log(`  Google Sheets:  ${stats.sheets}/${MESTIERI_SHEETS.length}`);
  console.log(`  Google Docs:    ${stats.docs}/${DOCS.length}`);
  console.log(`  Errori:         ${stats.errors}`);
  console.log(`  Output:         ${OUT_DIR}/`);
  console.log('═'.repeat(50));
  
  if (stats.errors === 0) {
    log('\n✅ Export completato! Tutti i file sono in content/', 'ok');
  } else {
    log('\n⚠️  Export completato con ' + stats.errors + ' errori. Controlla i log sopra.', 'err');
  }
}

main().catch(e => {
  log('\n❌ Errore fatale: ' + e.message, 'err');
  process.exit(1);
});
