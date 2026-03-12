#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════
   ARCAMIS — import-notion.js
   Converte l'export HTML di Notion in JSON statici compatibili
   con il renderer del sito.

   COME USARLO:
   1. In Notion: Export → HTML (senza sottopagine, o con)
   2. Estrai lo zip in una cartella, es: ./notion-export/
   3. Lancia: node scripts/import-notion.js ./notion-export/

   Output: public/data/pages/<id>.json
════════════════════════════════════════════════════════════ */

'use strict';
const fs   = require('fs');
const path = require('path');

/* ── Config ── */
const EXPORT_DIR = process.argv[2] || './notion-export';
const OUT_DIR    = path.join(__dirname,'..','public','data','pages');

if(!fs.existsSync(EXPORT_DIR)){
  console.error('❌  Cartella export non trovata: '+EXPORT_DIR);
  console.error('    Uso: node scripts/import-notion.js <cartella-export-notion>');
  process.exit(1);
}
fs.mkdirSync(OUT_DIR,{recursive:true});

/* ── ID mapping: legge data.js per sapere quali ID aspettarsi ── */
const dataJs = fs.readFileSync(path.join(__dirname,'..','data.js'),'utf8');
const idMap  = {};
const idRx   = /id:'([a-f0-9]{32})'/g;
let m;
while((m=idRx.exec(dataJs))!==null) idMap[m[1]]=true;

/* ── Trova tutti i file HTML nell'export ── */
function walk(dir){
  let out=[];
  for(const f of fs.readdirSync(dir)){
    const full=path.join(dir,f);
    const st=fs.statSync(full);
    if(st.isDirectory()) out=out.concat(walk(full));
    else if(f.endsWith('.html')) out.push(full);
  }
  return out;
}

const htmlFiles = walk(EXPORT_DIR);
console.log(`\n📂 Trovati ${htmlFiles.length} file HTML nell'export\n`);

/* ── Estrai ID Notion dal nome file ──
   Notion esporta come "Titolo pagina <id32char>.html"
   oppure "Titolo pagina <id-con-trattini>.html"         */
function extractIdFromFilename(filename){
  const base = path.basename(filename, '.html');
  // cerca 32 hex chars contigui
  const m32 = base.match(/([a-f0-9]{32})/i);
  if(m32) return m32[1].toLowerCase();
  // cerca UUID con trattini
  const mUUID = base.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
  if(mUUID) return mUUID[1].replace(/-/g,'').toLowerCase();
  return null;
}

/* ── Parser HTML → blocchi Notion-compatibili ── */
function parseHtmlToBlocks(html, title){
  // Rimuovi header/footer Notion
  html = html.replace(/<html[^>]*>[\s\S]*?<body[^>]*>/i,'')
             .replace(/<\/body>[\s\S]*?<\/html>/i,'')
             .replace(/<article[^>]*>/i,'')
             .replace(/<\/article>/i,'');

  const blocks = [];

  // Funzione per estrarre testo con annotazioni base
  function parseInline(html){
    if(!html) return [];
    // Strip tags e crea rich_text semplice
    const plain = html.replace(/<[^>]+>/g,'')
                      .replace(/&amp;/g,'&')
                      .replace(/&lt;/g,'<')
                      .replace(/&gt;/g,'>')
                      .replace(/&nbsp;/g,' ')
                      .replace(/&#39;/g,"'")
                      .replace(/&quot;/g,'"');
    if(!plain.trim()) return [];
    return [{type:'text',text:{content:plain},plain_text:plain,annotations:{bold:false,italic:false,strikethrough:false,underline:false,code:false,color:'default'},href:null}];
  }

  // Split per tag principali
  const tagRx = /<(h1|h2|h3|p|ul|ol|blockquote|pre|figure|hr|table|details)[^>]*>([\s\S]*?)<\/\1>/gi;
  const liRx  = /<li[^>]*>([\s\S]*?)<\/li>/gi;

  let lastIdx = 0;
  let tagMatch;

  // Rimuovi script/style
  html = html.replace(/<script[\s\S]*?<\/script>/gi,'')
             .replace(/<style[\s\S]*?<\/style>/gi,'');

  const lines = html.split(/\n/);
  for(const line of lines){
    const l = line.trim();
    if(!l) continue;

    // Heading 1
    if(/^<h1/i.test(l)){
      const txt = l.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').trim();
      if(txt) blocks.push({type:'heading_1',heading_1:{rich_text:parseInline(txt)},children:[]});
      continue;
    }
    // Heading 2
    if(/^<h2/i.test(l)){
      const txt = l.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').trim();
      if(txt) blocks.push({type:'heading_2',heading_2:{rich_text:parseInline(txt)},children:[]});
      continue;
    }
    // Heading 3
    if(/^<h3/i.test(l)){
      const txt = l.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').trim();
      if(txt) blocks.push({type:'heading_3',heading_3:{rich_text:parseInline(txt)},children:[]});
      continue;
    }
    // Divider
    if(/^<hr/i.test(l)){
      blocks.push({type:'divider',divider:{}});
      continue;
    }
    // Paragraph
    if(/^<p/i.test(l)){
      const inner = l.replace(/^<p[^>]*>/i,'').replace(/<\/p>$/i,'');
      const txt = inner.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').trim();
      if(txt) blocks.push({type:'paragraph',paragraph:{rich_text:parseInline(txt)}});
      continue;
    }
    // Blockquote
    if(/^<blockquote/i.test(l)){
      const txt = l.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').trim();
      if(txt) blocks.push({type:'quote',quote:{rich_text:parseInline(txt)}});
      continue;
    }
    // List item
    if(/^<li/i.test(l)){
      const txt = l.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').trim();
      if(txt) blocks.push({type:'bulleted_list_item',bulleted_list_item:{rich_text:parseInline(txt)}});
      continue;
    }
    // Image
    const imgM = l.match(/<img[^>]+src="([^"]+)"/i);
    if(imgM){
      const src = imgM[1];
      const altM = l.match(/alt="([^"]*)"/i);
      const alt = altM?altM[1]:'';
      blocks.push({
        type:'image',
        image:{type:'external',external:{url:src},caption:alt?[{plain_text:alt,annotations:{},href:null}]:[]}
      });
      continue;
    }
    // Pre/code
    if(/^<pre/i.test(l)){
      const txt = l.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();
      if(txt) blocks.push({type:'code',code:{rich_text:[{plain_text:txt,annotations:{},href:null}],language:'plain text'}});
      continue;
    }
  }

  // Se non abbiamo trovato nulla, crea un blocco vuoto
  if(blocks.length===0){
    blocks.push({
      type:'callout',
      callout:{
        icon:{emoji:'📄'},
        rich_text:[{type:'text',text:{content:'Contenuto in arrivo.'},plain_text:'Contenuto in arrivo.',annotations:{bold:false,italic:false,strikethrough:false,underline:false,code:false,color:'default'},href:null}]
      }
    });
  }

  return blocks;
}

/* ── Processa ogni file ── */
let converted = 0;
let skipped   = 0;

for(const file of htmlFiles){
  const id = extractIdFromFilename(file);
  if(!id){
    console.log(`⚠️  Skipped (no ID): ${path.basename(file)}`);
    skipped++;
    continue;
  }

  let html;
  try{ html = fs.readFileSync(file,'utf8'); }
  catch(e){ console.log(`⚠️  Errore lettura: ${file}`); skipped++; continue; }

  // Estrai titolo dalla pagina
  const titleM = html.match(/<title>([^<]+)<\/title>/i);
  const rawTitle = titleM ? titleM[1].replace(/\s*\|.*$/,'').trim() : path.basename(file,'.html');
  // Rimuovi eventuale ID dal titolo
  const title = rawTitle.replace(/\s+[a-f0-9]{32}$/i,'').replace(/\s+[a-f0-9-]{36}$/i,'').trim();

  // Estrai emoji icona (Notion la mette come testo prima del titolo h1)
  const emojiM = html.match(/class="page-icon[^"]*"[^>]*>([^<]+)</i);
  const icon   = emojiM ? emojiM[1].trim() : '📄';

  // Estrai cover
  const coverM = html.match(/class="page-cover[^"]*"[^>]*>\s*<img[^>]+src="([^"]+)"/i);
  const cover  = coverM ? {type:'external',external:{url:coverM[1]}} : null;

  // Estrai corpo principale
  const bodyM = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
              || html.match(/<div[^>]+class="[^"]*page-body[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  const body  = bodyM ? bodyM[1] : html;

  const blocks = parseHtmlToBlocks(body, title);

  // Costruisci struttura compatibile con notion-render.js
  const pageData = {
    page: {
      id: id,
      icon: { emoji: icon },
      cover: cover,
      properties: {
        title: {
          title: [{
            type: 'text',
            text: { content: title },
            plain_text: title,
            annotations: { bold:false,italic:false,strikethrough:false,underline:false,code:false,color:'default' },
            href: null
          }]
        }
      }
    },
    blocks: blocks
  };

  const outPath = path.join(OUT_DIR, id+'.json');
  fs.writeFileSync(outPath, JSON.stringify(pageData, null, 2), 'utf8');
  console.log(`✅  ${title.padEnd(40)} → ${id}.json`);
  converted++;
}

console.log(`\n════════════════════════════════`);
console.log(`✅  Convertiti: ${converted} file`);
console.log(`⚠️  Saltati:    ${skipped} file`);
console.log(`📁  Output:     ${OUT_DIR}`);
console.log(`════════════════════════════════\n`);
console.log('Prossimo passo: copia i file JSON nella cartella public/data/pages/ della repo\n');
