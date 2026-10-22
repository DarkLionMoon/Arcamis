#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════
   ARCAMIS — notion-migrate.mjs
   Converte l'export HTML di Notion nel markdown che il sito
   renderizza (md-render.js / notion-nav.js) e copia le immagini
   referenziate dentro `images/`.

   Uso:
     node scripts/notion-migrate.mjs --print <file.html>
     node scripts/notion-migrate.mjs --run

   La modalità `--run` applica le migrazioni definite in
   `scripts/notion-mapping.mjs`. `--print` serve per controllare la
   resa di una singola pagina prima di importarla.
   ════════════════════════════════════════════════════════════ */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_SOURCE = path.resolve(ROOT, '..', 'Arcamis-Notion', 'Private & Shared', 'Arcamis');
const IMAGES_DIR = path.join(ROOT, 'images', 'notion');
const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr'
]);

/* ── HTML: entità e attributi ─────────────────────────────── */

const ENTITIES = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  middot: '·',
  bull: '•',
  times: '×',
  rarr: '→',
  larr: '←'
};

export function decodeEntities(value = '') {
  return String(value)
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z][a-z0-9]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match);
}

function parseAttrs(source) {
  const attrs = {};
  const rx = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let match;
  while ((match = rx.exec(source)) !== null) {
    attrs[match[1].toLowerCase()] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attrs;
}

function findTagEnd(html, from) {
  let quote = null;
  for (let i = from; i < html.length; i += 1) {
    const char = html[i];
    if (quote) {
      if (char === quote) quote = null;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '>') {
      return i;
    }
  }
  return html.length;
}

/** Parser tollerante: l'export Notion è HTML ben annidato ma pieno di
    attributi e mark decorativi che non ci servono. */
export function parseHTML(html) {
  const root = { tag: '#root', attrs: {}, children: [] };
  const stack = [root];
  let index = 0;

  const addText = (text) => {
    if (!text) return;
    stack[stack.length - 1].children.push(decodeEntities(text));
  };

  while (index < html.length) {
    const lt = html.indexOf('<', index);
    if (lt === -1) {
      addText(html.slice(index));
      break;
    }
    if (lt > index) addText(html.slice(index, lt));
    if (html.startsWith('<!--', lt)) {
      const end = html.indexOf('-->', lt + 4);
      index = end === -1 ? html.length : end + 3;
      continue;
    }
    const gt = findTagEnd(html, lt + 1);
    const raw = html.slice(lt + 1, gt).trim();
    index = gt + 1;
    if (!raw || raw[0] === '!' || raw[0] === '?') continue;

    if (raw[0] === '/') {
      const closing = raw.slice(1).trim().toLowerCase();
      for (let i = stack.length - 1; i > 0; i -= 1) {
        if (stack[i].tag === closing) {
          stack.length = i;
          break;
        }
      }
      continue;
    }

    const selfClosing = raw.endsWith('/');
    const nameMatch = raw.match(/^([a-zA-Z0-9-]+)/);
    if (!nameMatch) continue;
    const tag = nameMatch[1].toLowerCase();
    const node = {
      tag,
      attrs: parseAttrs(raw.slice(nameMatch[0].length).replace(/\/$/, '')),
      children: []
    };
    stack[stack.length - 1].children.push(node);
    if (!selfClosing && !VOID_TAGS.has(tag)) stack.push(node);
  }
  return root;
}

/* ── Rendering markdown ──────────────────────────────────── */

const collapse = (text) => String(text).replace(/[ \t\r\n]+/g, ' ').trim();
const textContent = (node) => {
  if (typeof node === 'string') return node;
  if (!node || !node.children) return '';
  if (node.tag === 'br') return '\n';
  if (node.tag === 'img') return '';
  if (node.tag === 'script' || node.tag === 'style') return '';
  return node.children.map(textContent).join('');
};

function inline(node) {
  if (typeof node === 'string') return node.replace(/\s+/g, ' ');
  if (!node) return '';
  const kids = () => (node.children || []).map(inline).join('');
  switch (node.tag) {
    case 'br':
      return '\n';
    case 'strong':
    case 'b': {
      const raw = kids();
      const body = raw.trim();
      return body ? `${/^\s/.test(raw) ? ' ' : ''}**${body}**${/\s$/.test(raw) ? ' ' : ''}` : '';
    }
    case 'em':
    case 'i': {
      const raw = kids();
      const body = raw.trim();
      return body ? `${/^\s/.test(raw) ? ' ' : ''}*${body}*${/\s$/.test(raw) ? ' ' : ''}` : '';
    }
    case 'del':
    case 's':
    case 'strike': {
      const raw = kids();
      const body = raw.trim();
      return body ? `${/^\s/.test(raw) ? ' ' : ''}~~${body}~~${/\s$/.test(raw) ? ' ' : ''}` : '';
    }
    case 'code': {
      const body = textContent(node).replace(/\s+/g, ' ').trim();
      return body ? `\`${body}\`` : '';
    }
    case 'a': {
      const body = kids().trim() || collapse(textContent(node));
      const href = node.attrs?.href || '';
      if (!body) return '';
      /* I link interni dell'export puntano a file .html che il sito non
         serve: restano testo, evitando rotte morte. I link esterni e le
         ancore restano cliccabili. */
      if (/^(https?:|mailto:|#)/i.test(href)) return `[${body}](${href})`;
      return body;
    }
    case 'img': {
      const src = node.attrs?.src || '';
      const alt = node.attrs?.alt || '';
      return src ? `![${alt}](${src})` : '';
    }
    case 'mark':
    case 'span':
    case 'u':
    case 'sup':
    case 'sub':
    case 'small':
    case 'time':
    case 'abbr':
    case 'font':
    case 'div':
      return kids();
    case 'script':
    case 'style':
    case 'svg':
    case 'button':
    case 'input':
      return '';
    default:
      return kids();
  }
}

function renderList(node, ordered = false, depth = 0) {
  const items = [];
  let number = 1;
  for (const child of node.children || []) {
    if (typeof child === 'string' || child.tag !== 'li') continue;
    const main = [];
    const nested = [];
    for (const itemChild of child.children || []) {
      if (typeof itemChild !== 'string' && (itemChild.tag === 'ul' || itemChild.tag === 'ol')) {
        nested.push({ node: itemChild, ordered: itemChild.tag === 'ol' });
      } else {
        main.push(inline(itemChild));
      }
    }
    const text = collapse(main.join(''));
    if (!text && !nested.length) continue;
    const indent = '  '.repeat(depth);
    const bullet = ordered ? `${number}.` : '-';
    if (text) items.push(`${indent}${bullet} ${text}`);
    number += 1;
    for (const sub of nested) {
      const rendered = renderList(sub.node, sub.ordered, depth + 1);
      if (rendered) items.push(rendered);
    }
  }
  return items.join('\n');
}

function renderTable(node) {
  const rows = [];
  const collect = (current) => {
    for (const child of current.children || []) {
      if (typeof child === 'string') continue;
      if (child.tag === 'tr') {
        const cells = (child.children || [])
          .filter((cell) => typeof cell !== 'string' && (cell.tag === 'td' || cell.tag === 'th'))
          .map((cell) => collapse(inline(cell)).replace(/\|/g, '\\|'));
        if (cells.length) rows.push(cells);
      } else if (child.children) {
        collect(child);
      }
    }
  };
  collect(node);
  if (!rows.length) return '';
  const width = Math.max(...rows.map((row) => row.length));
  const padded = rows.map((row) => [...row, ...Array(width - row.length).fill('')]);
  const header = padded[0];
  const body = padded.slice(1);
  return [
    `| ${header.join(' | ')} |`,
    `| ${header.map(() => '---').join(' | ')} |`,
    ...body.map((row) => `| ${row.join(' | ')} |`)
  ].join('\n');
}

function renderBlock(node, ctx = { headingOffset: 0 }) {
  if (typeof node === 'string') return node;
  if (!node || !node.children) return '';
  const cls = node.attrs?.class || '';
  if (node.tag === 'script' || node.tag === 'style' || node.tag === 'svg') return '';

  const blocks = () => (node.children || []).map((child) => renderBlock(child, ctx)).filter(Boolean).join('\n\n');

  switch (node.tag) {
    case 'header':
      return '';
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6': {
      const level = Math.min(6, Math.max(1, Number(node.tag[1]) + (ctx.headingOffset || 0)));
      const text = collapse(inline(node)).replace(/\*\*/g, '');
      return text ? `${'#'.repeat(level)} ${text}` : '';
    }
    case 'p': {
      const text = inline(node).replace(/\s+/g, ' ').trim();
      return text ? text : '';
    }
    case 'ul':
      return renderList(node, false);
    case 'ol':
      return renderList(node, true);
    case 'hr':
      return '---';
    case 'pre': {
      const code = textContent(node).replace(/^\n+|\n+$/g, '');
      return code ? '```\n' + code + '\n```' : '';
    }
    case 'blockquote': {
      const text = blocks();
      if (!text) return '';
      return text
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n');
    }
    case 'aside': {
      const text = blocks();
      if (!text) return '';
      return text
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n');
    }
    case 'details': {
      const summary = (node.children || []).find((child) => child.tag === 'summary');
      const innerHeading = summary
        ? (summary.children || []).find((child) => /^h[1-6]$/.test(child.tag))
        : null;
      const level = Math.min(6, Math.max(2, Number(innerHeading?.tag?.[1] || 3) + (ctx.headingOffset || 0)));
      const heading = summary ? collapse(inline(summary)).replace(/\*\*/g, '') : '';
      const rest = (node.children || [])
        .filter((child) => child.tag !== 'summary')
        .map((child) => renderBlock(child, ctx))
        .filter(Boolean)
        .join('\n\n');
      return [heading ? `${'#'.repeat(level)} ${heading}` : '', rest].filter(Boolean).join('\n\n');
    }
    case 'summary':
      return '';
    case 'figure': {
      if (/link-to-page/.test(cls)) {
        const link = (node.children || []).find((child) => child.tag === 'a');
        return link ? inline(link) : '';
      }
      const img = (node.children || []).find((child) => child.tag === 'img' || child.tag === 'a');
      const caption = (node.children || []).find((child) => child.tag === 'figcaption');
      let markdown = '';
      if (img?.tag === 'img') markdown = inline(img);
      else if (img?.tag === 'a') {
        const inner = (img.children || []).find((child) => child.tag === 'img');
        markdown = inner ? inline(inner) : '';
      }
      if (caption) {
        const text = collapse(inline(caption));
        if (text) markdown += `\n\n*${text}*`;
      }
      return markdown;
    }
    case 'img':
      return inline(node);
    case 'table':
      if (/properties/.test(cls)) return '';
      return renderTable(node);
    case 'div': {
      if (/collection-content/.test(cls)) return '';
      return blocks();
    }
    case 'span':
    case 'mark':
    case 'strong':
    case 'em':
    case 'a':
    case 'code':
      return inline(node).trim();
    default:
      return blocks();
  }
}

/* ── Immagini: copia e riscrittura dei percorsi ───────────── */

function imageName(src) {
  const base = decodeURIComponent(path.basename(src.split('?')[0]))
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    /* Gli export Notion infilano hash esadecimali nel nome del file: non
       servono al sito e sembrano ID interni. Il prefisso corto aggiunto
       da copyImage basta come chiave di deduplica. */
    .replace(/[a-f0-9]{24,}/gi, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return base || 'immagine.png';
}

function copyImage(src, pageFile, used) {
  const clean = src.split('?')[0].split('#')[0];
  if (!clean || /^(https?:|data:|\/)/i.test(clean)) return src;
  const absolute = path.resolve(path.dirname(pageFile), decodeURIComponent(clean));
  if (!fs.existsSync(absolute)) return src;

  const hash = crypto.createHash('sha1').update(fs.readFileSync(absolute)).digest('hex').slice(0, 12);
  /* Stessa immagine su più pagine = stesso file: l'hash è la chiave. */
  if (used.has(hash)) return used.get(hash);

  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  const ext = path.extname(imageName(clean));
  const name = `${hash}-${imageName(clean).slice(0, -ext.length)}${ext}`;
  const target = path.join(IMAGES_DIR, name);
  if (!fs.existsSync(target)) fs.copyFileSync(absolute, target);
  const publicPath = `/images/notion/${name}`;
  used.set(hash, publicPath);
  return publicPath;
}

/* ── API pagina ──────────────────────────────────────────── */

export function readPage(file, { slug, copyAssets = false, imageMap = new Map(), headingOffset = 0 } = {}) {
  const html = fs.readFileSync(file, 'utf8');
  const articleMatch = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  if (!articleMatch) throw new Error(`Nessun <article> in ${file}`);
  const article = parseHTML(articleMatch[1]);

  const titleNode = article.children.find((child) => child.tag === 'header');
  const title = titleNode
    ? collapse(textContent(titleNode.children.find((child) => child.tag === 'h1') || ''))
    : '';
  const coverMatch =
    articleMatch[1].match(/<img[^>]*class="[^"]*page-cover-image[^"]*"[^>]*src="([^"]+)"/i) ||
    articleMatch[1].match(/<img[^>]*src="([^"]+)"[^>]*class="[^"]*page-cover-image[^"]*"/i);
  const cover = coverMatch ? (copyAssets ? copyImage(coverMatch[1], file, imageMap) : coverMatch[1]) : '';
  const body = article.children.find((child) => child.tag === 'div' && /page-body/.test(child.attrs?.class || ''));
  if (!body) return { title, icon: '📄', markdown: '', properties, cover };

  const properties = {};
  const headerTable = titleNode
    ? (titleNode.children || []).find((child) => child.tag === 'table' && /properties/.test(child.attrs?.class || ''))
    : null;
  const propertyRows = [];
  const collectRows = (current) => {
    for (const child of current?.children || []) {
      if (typeof child === 'string') continue;
      if (child.tag === 'tr') propertyRows.push(child);
      else collectRows(child);
    }
  };
  collectRows(headerTable);
  for (const tr of propertyRows) {
    const cells = (tr.children || []).filter((cell) => typeof cell !== 'string' && (cell.tag === 'th' || cell.tag === 'td'));
    if (cells.length < 2) continue;
    const key = collapse(textContent(cells[0])).replace(/\s+/g, ' ').trim();
    const value = collapse(inline(cells[1])).trim();
    if (key) properties[key] = value;
  }

  /* Alcune pagine ripetono il titolo come H1 nel corpo: lo togliamo, il
     titolo viene aggiunto dal chiamante nella gerarchia giusta. */
  const children = (body.children || []).filter((child, position) => {
    if (position !== 0 || child.tag !== 'h1') return true;
    return collapse(inline(child)) !== title.trim();
  });
  let markdown = children.map((child) => renderBlock(child, { headingOffset })).filter(Boolean).join('\n\n');

  if (copyAssets) {
    /* I nomi immagine di Notion possono contenere parentesi: il percorso
       va riconosciuto dall'estensione, non dal primo `)` incontrato. */
    markdown = markdown.replace(
      /!\[([^\]]*)\]\((.+?\.(?:png|jpe?g|webp|gif|svg|avif)(?:[?#][^)]*)?)\)/gi,
      (match, alt, src) => {
        const marker = (src.match(/#.*$/) || [''])[0];
        const local = copyImage(src.replace(/#.*$/, ''), file, imageMap);
        return `![${alt}](${local}${marker})`;
      }
    );
  }

  markdown = markdown
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+|\n+$/g, '');

  const articleIcon = html.match(/<article\b[^>]*data-notion-page-icon="([^"]+)"/i);
  const iconNode = titleNode?.children?.find?.((child) => /page-header-icon/.test(child.attrs?.class || ''));
  const icon =
    articleIcon?.[1] ||
    (iconNode ? collapse(textContent(iconNode)) : '') ||
    (html.match(/<span class="icon" data-emoji="([^"]+)"/i)?.[1] ?? '') ||
    '📄';

  return { title, icon: decodeEntities(icon), markdown, properties, cover };
}

/* ── CLI ─────────────────────────────────────────────────── */

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--print') {
    if (!args[1]) {
      console.error('Uso: node scripts/notion-migrate.mjs --print <file.html>');
      process.exit(1);
    }
    const file = path.isAbsolute(args[1]) ? args[1] : path.resolve(ROOT, args[1]);
    const page = readPage(file, { copyAssets: false });
    console.log(`# ${page.title}\n\n${page.markdown}`);
    return;
  }
  if (args[0] === '--run') {
    const { runMigrations } = await import('./notion-mapping.mjs');
    await runMigrations({ root: ROOT, source: args[1] ? path.resolve(args[1]) : DEFAULT_SOURCE });
    return;
  }
  console.log('Uso: node scripts/notion-migrate.mjs --print <file.html> | --run [export-dir]');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exit(1);
  });
}
