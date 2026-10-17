/* ════════════════════════════════════════════════════════════
   ARCAMIS — routes.mjs
   Fonte unica delle rotte pubbliche del sito.

   Da qui derivano, durante `npm run build:site`:
     - il prerender statico (una cartella per rotta con <head> dedicato)
     - dist/sitemap.xml
     - dist/robots.txt

   Le rotte sono ricavate dai contenuti versionati (registry.json,
   pantheon.json, lavori.json): nessun elenco da tenere allineato
   a mano. Se una pagina o un'entità viene aggiunta ai contenuti,
   compare automaticamente in sitemap e nel prerender.
════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';

export const SITE_URL = (process.env.SITE_URL || 'https://arcamis.pages.dev').replace(/\/+$/, '');
export const SITE_NAME = 'Arcamis Wiki';

/* ── utility testo ────────────────────────────────────────── */

export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};

export function stripMarkdown(md) {
  return String(md || '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') /* immagini */
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') /* link */
    .replace(/<[^>]+>/g, ' ') /* html */
    .replace(/^\s*#{1,6}\s+/gm, '') /* titoli */
    .replace(/^\s*[-*+]\s+/gm, ' ') /* liste */
    .replace(/^\s*>\s?/gm, '') /* citazioni */
    .replace(/[*_`~]{1,3}/g, '')
    .replace(/[–—]{1,2}/g, ' ')
    .replace(/\|/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, (m) => ENTITIES[m] || ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Le pagine ancora vuote dicono solo "Contenuto in arrivo": come
   description non serve a nessuno (né a un motore di ricerca né a chi
   condivide il link). In quel caso si usa un testo costruito dal titolo. */
const STUB_PATTERNS = [/contenuto in arrivo/i, /in allestimento/i, /da scrivere/i, /^identità\s/i];
function isStub(text) {
  return !text || text.length < 60 || STUB_PATTERNS.some((pattern) => pattern.test(text));
}

/* Taglia a un limite di caratteri senza spezzare le parole. */
function clip(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return (space > 40 ? cut.slice(0, space) : cut).replace(/[\s,.;:–—-]+$/, '') + '…';
}

function fallbackDescription(label, section) {
  const suffix = section ? ` nella sezione ${section}` : '';
  return `Pagina della wiki di Arcamis dedicata a ${label}${suffix}: materiale della campagna, regole della casa e riferimenti utili ai giocatori.`;
}

/* Corpo senza il titolo iniziale: la description non deve iniziare
   ripetendo l'H1 della pagina. */
export function contentBody(md) {
  return String(md || '')
    .replace(/^\s*#\s+.*(\r?\n|$)/, '')
    .trim();
}

export function excerpt(md, max = 155) {
  const text = stripMarkdown(md);
  if (text.length <= max) return text;
  const cut = text.slice(0, max + 1);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 60 ? cut.slice(0, lastSpace) : cut.slice(0, max)).replace(/[,.;:–—-]+$/, '') + '…';
}

export function absolutize(url) {
  if (!url) return null;
  const clean = String(url).split('#')[0].trim();
  if (!clean) return null;
  if (/^https?:\/\//i.test(clean)) return clean;
  if (clean.startsWith('/')) return SITE_URL + clean;
  return SITE_URL + '/' + clean;
}

/* Prima immagine (non icona) del markdown, in URL relativo. */
export function firstImage(md) {
  const match = String(md || '').match(/!\[[^\]]*\]\(([^)\s]+)/);
  return match ? match[1] : null;
}

export function humanize(segment) {
  const words = String(segment || '')
    .replace(/-/g, ' ')
    .trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/* ── parsing collezioni (stesso formato del client) ───────── */

export function parseCollection(md) {
  let source = String(md || '').replace(/^\s*---\s*\n/, '');
  const blocks = source.split(/\n---\n/);
  blocks.shift(); /* intro */
  const items = [];
  for (const block of blocks) {
    const lines = block.split('\n');
    let name = null;
    let img = '';
    const rest = [];
    for (const line of lines) {
      if (name === null && /^#\s+(.+)/.test(line)) {
        name = line.replace(/^#\s+/, '').trim();
        continue;
      }
      const im = line.match(/^!\[[^\]]*\]\(([^)]+)\)/);
      if (im && !img) {
        img = im[1];
        continue;
      }
      rest.push(line);
    }
    if (!name) continue;
    items.push({
      name,
      slug: slugify(name),
      img: img ? img.split('#')[0] : '',
      body: rest.join('\n').replace(/^\s+/, '').trim(),
    });
  }
  return items;
}

/* ── raccolta rotte ───────────────────────────────────────── */

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/**
 * @param {string} root cartella del progetto
 * @returns {Array<{path:string,title:string,description:string,label:string,
 *                  image:string|null,type:string,section:string|null,
 *                  updated:string|null,changefreq:string,priority:string}>}
 */
export function collectRoutes(root = process.cwd()) {
  const pagesDir = path.join(root, 'content', 'pages');
  const registry = readJson(path.join(pagesDir, 'registry.json'));
  const routes = [];

  /* Home */
  routes.push({
    path: '',
    title: `${SITE_NAME} — Il mondo di Arcamis`,
    label: 'Home',
    description:
      'Wiki ufficiale del server D&D Arcamis: regole della campagna, lore delle Marche di Arcamis, pantheon, mestieri e creazione del personaggio.',
    image: '/Artboard_1.png',
    type: 'website',
    section: null,
    updated: null,
    changefreq: 'weekly',
    priority: '1.0',
  });

  for (const page of registry.pages || []) {
    if (!page.path) continue;
    const file = path.join(pagesDir, `${page.k}.json`);
    const doc = fs.existsSync(file) ? readJson(file) : {};
    const content = contentBody(doc.content || '');
    const sectionLabel = page.sec ? (registry.sections || []).find((s) => s.v === page.sec)?.l || page.sec : null;
    const summary = excerpt(content, 155);
    const description = isStub(summary) ? fallbackDescription(page.l, sectionLabel) : summary;
    routes.push({
      path: page.path.replace(/^\/+/, ''),
      title: `${page.l} — ${SITE_NAME}`,
      label: page.l,
      description,
      image: firstImage(content),
      type: 'article',
      section: sectionLabel,
      updated: doc.lastModified || null,
      stub: isStub(summary),
      changefreq: page.sec === 'regole' ? 'weekly' : 'monthly',
      priority: page.sec === 'regole' || page.sec === 'lore' ? '0.8' : '0.6',
    });
  }

  /* Entità a collezione: Pantheon + Lavori (sottopagine <padre>/<slug>) */
  const collections = [
    { key: 'pantheon', base: 'lore/pantheon', label: 'Pantheon', prefix: 'Divinità', icon: '🛐' },
    { key: 'lavori', base: 'personaggio/lavori', label: 'Lavori', prefix: 'Mestiere', icon: '💼' },
  ];
  for (const coll of collections) {
    const file = path.join(pagesDir, `${coll.key}.json`);
    if (!fs.existsSync(file)) continue;
    const doc = readJson(file);
    for (const item of parseCollection(doc.content || '')) {
      /* Le sezioni senza immagine sono blocchi introduttivi, non entità. */
      if (!item.img) continue;
      const body = contentBody(item.body);
      const summary = excerpt(body, 150);
      /* Il nome dell'entità apre sempre la description: le schede della
         stessa collezione condividono testi di servizio (stipendio, turni)
         e senza prefisso finirebbero con description identiche. */
      const description = isStub(summary)
        ? `${item.name}: scheda del ${coll.prefix.toLowerCase()} di Arcamis con storia, dettagli e riferimenti per la campagna.`
        : clip(`${item.name} — ${coll.prefix.toLowerCase()} di Arcamis: ${summary}`, 168);
      routes.push({
        path: `${coll.base}/${item.slug}`,
        title: `${item.name} — ${coll.label} di Arcamis`,
        label: item.name,
        description,
        image: item.img,
        type: 'article',
        section: coll.label,
        updated: doc.lastModified || null,
        changefreq: 'monthly',
        priority: '0.6',
      });
    }
  }

  /* Rotte fisse (non gestite dal registry) */
  routes.push({
    path: 'changelog',
    title: `Changelog — ${SITE_NAME}`,
    label: 'Changelog',
    description:
      'Cronologia degli aggiornamenti della wiki di Arcamis: nuove pagine, correzioni e modifiche ai contenuti.',
    image: null,
    type: 'article',
    section: null,
    updated: null,
    changefreq: 'weekly',
    priority: '0.4',
  });

  /* Deduplica mantenendo l'ordine; la home resta prima. */
  const seen = new Set();
  return routes.filter((route) => {
    if (seen.has(route.path)) return false;
    seen.add(route.path);
    return true;
  });
}

/* Percorso del file prerenderizzato per una rotta ('' = index.html). */
export function routeFile(routePath) {
  return routePath ? `${routePath}.html` : 'index.html';
}

export function routeUrl(routePath) {
  return routePath ? `${SITE_URL}/${routePath}` : SITE_URL + '/';
}

/* ── generazione artefatti ────────────────────────────────── */

export function renderSitemap(routes) {
  const latest = routes
    .map((r) => r.updated)
    .filter(Boolean)
    .sort()
    .pop();
  const rows = routes.map((route) => {
    const parts = [
      `    <loc>${escapeXml(routeUrl(route.path))}</loc>`,
      route.updated ? `    <lastmod>${route.updated.slice(0, 10)}</lastmod>` : null,
      `    <changefreq>${route.changefreq}</changefreq>`,
      `    <priority>${route.priority}</priority>`,
    ].filter(Boolean);
    return `  <url>\n${parts.join('\n')}\n  </url>`;
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    latest ? `  <!-- ultimo aggiornamento contenuti: ${latest.slice(0, 10)} -->` : null,
    rows.join('\n'),
    '</urlset>',
    '',
  ]
    .filter((line) => line !== null)
    .join('\n');
}

export function renderRobots() {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    'Disallow: /api/',
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    '',
  ].join('\n');
}

export function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function jsonLd(route) {
  const graph = [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL + '/',
      inLanguage: 'it',
    },
    {
      '@type': route.type === 'article' ? 'Article' : 'WebPage',
      '@id': routeUrl(route.path) + '#page',
      name: route.title,
      headline: route.title,
      description: route.description,
      url: routeUrl(route.path),
      inLanguage: 'it',
      isPartOf: { '@id': `${SITE_URL}/#website` },
      ...(route.image ? { image: absolutize(route.image) } : {}),
      ...(route.updated ? { dateModified: route.updated } : {}),
      ...(route.type === 'article' ? { publisher: { '@type': 'Organization', name: 'Arcamis' } } : {}),
    },
  ];
  if (route.path) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL + '/' },
        { '@type': 'ListItem', position: 2, name: route.label, item: routeUrl(route.path) },
      ],
    });
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
}

export function renderHead(route) {
  const url = routeUrl(route.path);
  const image = absolutize(route.image || '/Artboard_1.png');
  const title = escapeHtml(route.title);
  const description = escapeHtml(route.description);
  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}"/>`,
    `<link rel="canonical" href="${url}"/>`,
    `<meta property="og:title" content="${title}"/>`,
    `<meta property="og:description" content="${description}"/>`,
    `<meta property="og:image" content="${escapeHtml(image)}"/>`,
    `<meta property="og:type" content="${route.type === 'article' ? 'article' : 'website'}"/>`,
    `<meta property="og:url" content="${url}"/>`,
    `<meta property="og:site_name" content="${SITE_NAME}"/>`,
    `<meta property="og:locale" content="it_IT"/>`,
    `<meta name="twitter:card" content="summary_large_image"/>`,
    `<meta name="twitter:title" content="${title}"/>`,
    `<meta name="twitter:description" content="${description}"/>`,
    `<meta name="twitter:image" content="${escapeHtml(image)}"/>`,
    `<script type="application/ld+json">${jsonLd(route)}</script>`,
  ].join('\n');
}

/**
 * Inietta i meta della rotta nella shell HTML.
 * Rimuove prima i tag SEO globali (che descrivono la home), poi inserisce
 * il blocco dedicato: il crawler non vede mai due title o due canonical.
 */
export function injectHead(shell, route) {
  let html = shell;
  html = html.replace(/<title>[\s\S]*?<\/title>\s*/i, '');
  html = html.replace(/<meta\s+name="description"[^>]*>\s*/gi, '');
  html = html.replace(/<link\s+rel="canonical"[^>]*>\s*/gi, '');
  html = html.replace(/<meta\s+property="og:[^"]*"[^>]*>\s*/gi, '');
  html = html.replace(/<meta\s+name="twitter:[^"]*"[^>]*>\s*/gi, '');
  html = html.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi, '');
  html = html.replace(/<!--\s*Open Graph\s*-->\s*/i, '');
  html = html.replace(/<!--\s*Twitter Card\s*-->\s*/i, '');
  return html.replace(/<\/head>/i, () => renderHead(route) + '\n</head>');
}

/** Contenuto per crawler/lettori senza JS: titolo, estratto e link. */
export function injectNoscript(shell, route) {
  if (!route.path) return shell;
  const block = [
    `<noscript id="prerender-fallback">`,
    `<div style="max-width:720px;margin:24px auto;padding:0 20px;font-family:Georgia,serif;color:#d9cfb8">`,
    `<h1 style="font-family:Cinzel,Georgia,serif;font-size:26px;color:#d4af37">${escapeHtml(route.label)}</h1>`,
    `<p style="line-height:1.7">${escapeHtml(route.description)}</p>`,
    `<p><a href="/" style="color:#d4af37">← Torna alla home di Arcamis</a></p>`,
    `</div>`,
    `</noscript>`,
  ].join('');
  return shell.replace(/(<a\s+href="#main"[^>]*>)/i, block + '\n$1');
}

/**
 * Scrive un file per rotta: dist/<path>.html
 *
 * Cloudflare Pages serve `foo.html` su `/foo` senza redirect ("pretty URLs")
 * e reindirizza `/foo.html` su `/foo`: così l'URL canonico dichiarato nei
 * meta è esattamente quello servito, senza passare da un 308.
 * Con `<path>/index.html` invece `/foo` risponderebbe 308 → `/foo/`.
 */
export function writePages(dist, shell, routes) {
  let written = 0;
  for (const route of routes) {
    if (!route.path) continue;
    const html = injectNoscript(injectHead(shell, route), route);
    const file = path.join(dist, `${route.path}.html`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, html);
    written++;
  }
  return written;
}
