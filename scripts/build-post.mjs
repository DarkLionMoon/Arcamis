/* ════════════════════════════════════════════════════════════
   ARCAMIS — build-post.mjs
   Eseguito dopo `vite build` (npm run build:site).

   - minifica i JS classici e aggiunge l'hash al nome (cache-busting)
   - riscrive index.html con i nuovi riferimenti
   - copia _headers / _redirects / _routes.json nel dist
   - copia il pannello admin già compilato (export/admin)
   - genera sw.js con versione di build e precache reale

   I JS restano file separati (script classici con scope globale):
   concatenarli cambierebbe l'hoisting delle funzioni e l'ordine
   di inizializzazione. Minificati + hashati restano cacheabili
   per sempre e non richiedono un refactor a moduli.
════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { transform } from 'esbuild';
import {
  collectRoutes,
  hiddenPageKeys,
  renderSitemap,
  renderRobots,
  writePages,
  routeFile,
  SITE_URL,
} from './lib/routes.mjs';
import {
  HOMEPAGE_MAP_MARKER_END,
  HOMEPAGE_MAP_MARKER_START,
  HOMEPAGE_MARKER_END,
  HOMEPAGE_MARKER_START,
  HOMEPAGE_PATH,
  defaultHomepage,
  normalizeHomepage,
  renderHomepageSections,
} from './lib/homepage.mjs';

const root = process.cwd();
const dist = path.join(root, 'dist');

function fail(message) {
  console.error('\n✖ build-post: ' + message + '\n');
  process.exit(1);
}

const distPath = (relative) => path.join(dist, relative);
const readDist = (relative) => fs.readFileSync(distPath(relative), 'utf8');
const writeDist = (relative, content) => {
  fs.mkdirSync(path.dirname(distPath(relative)), { recursive: true });
  fs.writeFileSync(distPath(relative), content);
};
const shortHash = (value) => crypto.createHash('sha256').update(value).digest('hex').slice(0, 10);

if (!fs.existsSync(distPath('index.html'))) {
  fail('dist/index.html mancante: esegui prima `vite build`.');
}

/* ── 1. JS: minify + content hash ─────────────────────────── */
const jsDir = distPath('scripts/js');
const jsMap = new Map();

/* Le pagine non pubbliche (bozza, in revisione, programmate) vengono
   tolte da menu, home e ricerca del sito: l'elenco vive nel file di
   stato, generato qui dalla stessa fonte che decide rotte e sitemap.
   Prima della minificazione, così anche la lista finisce nell'hash. */
const statusFile = path.join(jsDir, 'page-status.js');
if (fs.existsSync(statusFile)) {
  const hidden = hiddenPageKeys(root);
  const source = fs.readFileSync(statusFile, 'utf8');
  fs.writeFileSync(
    statusFile,
    `/* Generato da scripts/build-post.mjs — elenco delle pagine non pubbliche. */\nwindow.__ARC_HIDDEN_PAGES__ = ${JSON.stringify(hidden)};\n` +
      source
  );
  if (hidden.length) console.log('  Pagine non pubbliche tolte dal sito: ' + hidden.join(', '));
}
let jsBefore = 0;
let jsAfter = 0;

for (const name of fs.readdirSync(jsDir).filter((n) => n.endsWith('.js'))) {
  const source = fs.readFileSync(path.join(jsDir, name), 'utf8');
  let code;
  try {
    const result = await transform(source, {
      loader: 'js',
      minify: true,
      legalComments: 'none',
      target: 'es2019',
    });
    code = result.code;
  } catch (error) {
    fail(`minificazione di ${name} fallita: ${error.message}`);
  }
  const hashed = name.replace(/\.js$/, `.${shortHash(code)}.js`);
  fs.writeFileSync(path.join(jsDir, hashed), code);
  fs.unlinkSync(path.join(jsDir, name));
  jsMap.set(`/scripts/js/${name}`, `/scripts/js/${hashed}`);
  jsBefore += Buffer.byteLength(source);
  jsAfter += Buffer.byteLength(code);
}

/* ── 2. index.html: riferimenti hashati ───────────────────── */
let html = readDist('index.html');
/* Vite rewrites static references to /assets/, while runtime overrides use
   root URLs. Keep one address per image to avoid downloading both copies. */
for (const image of ['cover.webp', 'mappa.webp']) {
  html = html.split(`/assets/${image}`).join(`/${image}`);
}
for (const [from, to] of jsMap) {
  html = html.split(`"${from}"`).join(`"${to}"`);
}

/* LCP: preload dell'immagine della prima slide. Inserito qui perché Vite
   riscriverebbe l'href verso assets/ mentre lo slide usa /cover.webp. */
const preloadTag = '<link rel="preload" as="image" href="/cover.webp" fetchpriority="high"/>';
if (html.includes('/cover.webp') && !html.includes(preloadTag)) {
  html = html.replace('</head>', preloadTag + '\n</head>');
}

/* Font principali: preload dei due volti usati above-the-fold.
   I nomi contengono l'hash del contenuto (scripts/fetch-fonts.mjs), quindi
   li leggiamo dal CSS generato invece di scriverli a mano qui. */
const fontsCss = fs.existsSync(path.join(root, 'scripts/css/fonts.css'))
  ? fs.readFileSync(path.join(root, 'scripts/css/fonts.css'), 'utf8')
  : '';
const fontFiles = [...fontsCss.matchAll(/src:url\('(\/fonts\/[^']+)'\)/g)].map((m) => m[1]);
const fontPreloads = fontFiles
  .filter((file) => /(cinzel|crimson-pro)-normal-latin\./.test(file))
  .map((file) => `<link rel="preload" href="${file}" as="font" type="font/woff2" crossorigin/>`)
  .join('\n');
if (fontPreloads && !html.includes('rel="preload" href="/fonts/')) {
  html = html.replace('</head>', fontPreloads + '\n</head>');
}
/* ── 2b. Homepage: sezioni da content/homepage.json ────────────
   Le sezioni vengono scolpite nell'HTML, così la home pubblica si
   legge anche senza JavaScript. La hero/carousel resta fuori: la
   gestisce il manifest KV del Carousel (una sola configurazione).
   La mappa è un partial di index.html: viene estratta e reinserita
   nella sezione generata, così i suoi ID restano quelli del sito. */
function homepageConfig() {
  const file = path.join(root, HOMEPAGE_PATH);
  if (!fs.existsSync(file)) {
    console.warn('⚠ homepage: ' + HOMEPAGE_PATH + ' assente, uso i valori predefiniti');
    return defaultHomepage();
  }
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    fail(HOMEPAGE_PATH + ' non è JSON valido: ' + error.message);
  }
  const { config, errors, warnings } = normalizeHomepage(parsed);
  for (const message of [...warnings, ...errors]) console.warn('⚠ homepage: ' + message);
  return config;
}

function homepagePagePaths() {
  try {
    const registry = JSON.parse(fs.readFileSync(path.join(root, 'content/pages/registry.json'), 'utf8'));
    const map = {};
    for (const page of registry.pages || []) {
      if (page && page.id && page.path) map[page.id] = String(page.path).replace(/^\/+/, '');
    }
    return map;
  } catch (error) {
    console.warn('⚠ homepage: registry.json non leggibile, i card wiki restano senza link');
    return {};
  }
}

const mapStart = html.indexOf(HOMEPAGE_MAP_MARKER_START);
const mapEnd = html.indexOf(HOMEPAGE_MAP_MARKER_END);
const mapHtml = mapStart >= 0 && mapEnd > mapStart
    ? html.slice(mapStart + HOMEPAGE_MAP_MARKER_START.length, mapEnd).trim()
    : '';

const homeStart = html.indexOf(HOMEPAGE_MARKER_START);
const homeEnd = html.indexOf(HOMEPAGE_MARKER_END);
if (homeStart < 0 || homeEnd < homeStart) {
  /* Una shell senza home (fixture di test, pagina standalone) non deve
     rompere il build: i marcatori sono verificati anche dai test su
     index.html del progetto. */
  console.warn('⚠ homepage: marcatori HOMEPAGE:SECTIONS assenti, sezioni non rigenerate');
} else {
  const sectionsHtml = renderHomepageSections(homepageConfig(), {
    mapHtml,
    pagePaths: homepagePagePaths(),
  });
  html =
    html.slice(0, homeStart + HOMEPAGE_MARKER_START.length) +
    '\n' +
    sectionsHtml +
    '\n    ' +
    html.slice(homeEnd);
}

writeDist('index.html', html);

const cssMatch = html.match(/\/scripts\/css\/[^"']+\.css/);
if (!cssMatch) fail('riferimento al CSS non trovato in dist/index.html');
const cssHref = cssMatch[0];

/* ── 3. file di configurazione Pages ──────────────────────── */
for (const file of ['_headers', '_routes.json']) {
  const source = path.join(root, file);
  if (fs.existsSync(source)) fs.copyFileSync(source, distPath(file));
}
/* Pages joins every matching rule. Exact paths avoid conflicting wildcard
   policies and only give immutable caching to content-fingerprinted files. */
const assetHeaders = [...jsMap.values(), cssHref]
  .map((url) => `${url}\n  Cache-Control: public, max-age=31536000, immutable`)
  .join('\n\n');
const baseHeaders = fs.existsSync(distPath('_headers')) ? readDist('_headers') : '';
writeDist('_headers', baseHeaders.trimEnd() + '\n\n' + assetHeaders + '\n');

/* Redirect specifici per il deploy da dist (admin compilato).
   NIENTE catch-all su /index.html: ogni rotta pubblica è prerenderizzata
   in una cartella dedicata, quindi una URL inesistente arriva a 404.html
   con status 404 invece di restituire la home con 200 (soft-404).

   L'entry point dell'admin è `/admin/app`: Cloudflare Pages toglie
   l'estensione .html (308 da /admin/app.html → /admin/app), quindi
   redirigere verso /admin/app.html creava un ciclo infinito di
   redirect e l'admin non si apriva più. */
writeDist(
  '_redirects',
  [
    '/admin/         /admin/app    302',
    '/admin          /admin/app    302',
    '/admin/*        /admin/:splat 200',
    '/p/:id          /index.html   200',
    '/content/*      /content/:splat 200',
    '',
  ].join('\n')
);

/* ── 4. admin già compilato ───────────────────────────────── */
function copyDir(from, to, { skipSourceMaps = false } = {}) {
  if (!fs.existsSync(from)) return 0;
  fs.mkdirSync(to, { recursive: true });
  let copied = 0;
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copied += copyDir(source, target, { skipSourceMaps });
    } else {
      if (skipSourceMaps && entry.name.endsWith('.map')) continue;
      fs.copyFileSync(source, target);
      copied++;
    }
  }
  return copied;
}

const adminSource = path.join(root, 'export/admin');
if (fs.existsSync(path.join(adminSource, 'app.html'))) {
  fs.rmSync(distPath('admin'), { recursive: true, force: true });
  copyDir(adminSource, distPath('admin'), { skipSourceMaps: true });
} else {
  console.warn('⚠ build-post: export/admin non trovato, /admin non sarà disponibile nel dist');
}

/* ── 5. prerender + sitemap + robots ─────────────────────── */
const routes = collectRoutes(root);
writeDist('sitemap.xml', renderSitemap(routes));
writeDist('robots.txt', renderRobots());
for (const page of ['404.html', 'offline.html']) {
  if (fs.existsSync(path.join(root, page))) fs.copyFileSync(path.join(root, page), distPath(page));
}
const prerendered = writePages(dist, html, routes);
const missing = routes.filter((route) => route.path && !fs.existsSync(distPath(routeFile(route.path))));
if (missing.length) fail('prerender incompleto: ' + missing.map((r) => r.path).join(', '));

/* ── 6. service worker versionato ────────────────────────── */
const precache = [
  '/index.html',
  '/Artboard_1.png',
  '/cover.webp',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.webmanifest',
  '/offline.html',
  /* Contenuti dati per l'uso offline: ricerca e mappa. */
  '/content/search-index.json',
  '/content/recent.json',
  '/content/mappins.json',
  cssHref,
];
for (const target of jsMap.values()) precache.push(target);
const existing = precache.filter((url) => fs.existsSync(distPath(url.replace(/^\//, ''))));
/* La versione del service worker è l'impronta dei file che finiscono davvero
   in precache: ogni modifica a contenuti, CSS, immagini o JS cambia il nome
   della cache e invalida quella precedente all'attivazione. Deterministico:
   due build dello stesso commit producono lo stesso valore. */
const versionHash = crypto.createHash('sha256');
for (const url of existing) {
  versionHash.update(url);
  versionHash.update(fs.readFileSync(distPath(url.replace(/^\//, ''))));
}
const buildVersion = versionHash.digest('hex').slice(0, 12);

const swTemplate = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const sw = [
  '/* Generato da scripts/build-post.mjs — non modificare a mano. */',
  'self.__ARC_BUILD_VERSION__ = ' + JSON.stringify(buildVersion) + ';',
  'self.__ARC_PRECACHE__ = ' + JSON.stringify(existing) + ';',
  '',
  swTemplate,
].join('\n');
writeDist('sw.js', sw);
if (fs.existsSync(path.join(root, 'sw.js'))) {
  /* il template resta nella root per il dev server */
}

/* ── 7. riepilogo ────────────────────────────────────────── */
const kb = (bytes) => (bytes / 1024).toFixed(1) + ' KB';
console.log('\n✔ Build di produzione pronta in dist/');
console.log('  JS minificati : ' + kb(jsBefore) + ' → ' + kb(jsAfter) + ' (' + jsMap.size + ' file, hashati)');
console.log('  CSS bundlato  : ' + cssHref);
console.log('  Prerender     : ' + prerendered + ' rotte con meta dedicati (' + routes.length + ' in sitemap)');
console.log('  Sitemap/Robots: ' + SITE_URL + '/sitemap.xml');
console.log('  Service worker: cache arcamis-' + buildVersion + ' (' + existing.length + ' file precache)');
console.log(
  '  Admin         : ' + (fs.existsSync(distPath('admin/app.html')) ? 'incluso in /admin' : 'assente') + '\n'
);
