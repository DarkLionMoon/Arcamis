/* ════════════════════════════════════════════════════════════
   Test di integrità delle rotte pubbliche.

   Due livelli:
   1) sorgente — il collettore (scripts/lib/routes.mjs) deve elencare
      ogni pagina del registry, con URL unici, titoli e description
      dedicati, e una sitemap coerente al 100%.
   2) build    — se dist/ esiste, ogni rotta deve avere la sua
      cartella con <head> dedicato, un solo <title>/<link canonical>,
      fallback <noscript> non vuoto e #pbody presente nella shell.
      È la regressione da cui nasceva il bug _urlForId: una rotta
      servita ma incapace di renderizzare il contenuto.

   `npm run test:routes` esegue la build e poi questo file.
════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { collectRoutes, renderSitemap, renderRobots, routeFile, SITE_URL } from '../lib/routes.mjs';

const root = process.cwd();
const registry = JSON.parse(fs.readFileSync(path.join(root, 'content/pages/registry.json'), 'utf8'));
const routes = collectRoutes(root);
const dist = path.join(root, 'dist');
const hasDist = fs.existsSync(path.join(dist, 'index.html'));

describe('rotte pubbliche (sorgente)', () => {
  it('include ogni pagina del registry con un path', () => {
    const paths = new Set(routes.map((route) => route.path));
    for (const page of registry.pages.filter((item) => item.path)) {
      expect(paths.has(page.path), `rotta mancante per "${page.k}" (${page.path})`).toBe(true);
    }
  });

  it('include le sottopagine delle collezioni e le pagine fisse', () => {
    const paths = routes.map((route) => route.path);
    expect(paths).toContain('lore/pantheon/anivia');
    expect(paths.some((p) => p.startsWith('personaggio/lavori/'))).toBe(true);
    expect(paths).toContain('changelog');
    expect(paths).toContain('credits');
  });

  it('non ha URL duplicati, spazi o maiuscole', () => {
    const seen = new Set();
    for (const route of routes) {
      expect(route.path).toBe(route.path.toLowerCase().replace(/\s+/g, '-'));
      if (seen.has(route.path)) throw new Error(`rotta duplicata: ${route.path}`);
      seen.add(route.path);
    }
  });

  it('ha title e description specifici per rotta', () => {
    const titles = new Set();
    const descriptions = new Set();
    for (const route of routes) {
      expect(route.title.length).toBeGreaterThan(6);
      expect(route.description.length).toBeGreaterThan(20);
      expect(route.description.length).toBeLessThanOrEqual(170);
      if (route.path) {
        /* la home può coincidere con il titolo del sito, le altre no */
        expect(titles.has(route.title), `title duplicato: ${route.title}`).toBe(false);
        expect(descriptions.has(route.description), `description duplicata su ${route.path}`).toBe(false);
      }
      titles.add(route.title);
      descriptions.add(route.description);
    }
  });

  it('genera una sitemap con tutte le rotte e la dichiara in robots.txt', () => {
    const xml = renderSitemap(routes);
    expect((xml.match(/<loc>/g) || []).length).toBe(routes.length);
    expect(xml).toContain(`<loc>${SITE_URL}/</loc>`);
    for (const route of routes) {
      expect(xml).toContain(`<loc>${SITE_URL}/${route.path}</loc>`);
    }
    expect(renderRobots()).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
  });
});

describe.skipIf(!hasDist)('artefatti di build (dist)', () => {
  /* Le letture avvengono dentro gli `it`, mai nel corpo della suite: il
     factory di describe viene eseguito anche quando la suite è skippata,
     quindi un readFileSync qui faceva fallire `npm test` (che non builda)
     con ENOENT su dist/index.html. */
  const read = (rel) => fs.readFileSync(path.join(dist, rel), 'utf8');

  it('prerenderizza ogni rotta con un head dedicato', () => {
    for (const route of routes.filter((item) => item.path)) {
      const file = path.join(dist, routeFile(route.path));
      expect(fs.existsSync(file), `manca dist/${routeFile(route.path)}`).toBe(true);
      const html = fs.readFileSync(file, 'utf8');
      expect(html.match(/<title>/g) || []).toHaveLength(1);
      expect(html.match(/rel="canonical"/g) || []).toHaveLength(1);
      expect(html).toContain(`<title>${escapeHtml(route.title)}</title>`);
      expect(html).toContain(`href="${SITE_URL}/${route.path}"`);
      expect(html.match(/property="og:url"/g) || []).toHaveLength(1);
      /* fallback per crawler senza JS: deve avere testo, non un guscio vuoto */
      const noscript = (html.match(/<noscript id="prerender-fallback">([\s\S]*?)<\/noscript>/) || [])[1];
      expect(noscript, `noscript mancante su /${route.path}`).toBeTruthy();
      expect(noscript.replace(/<[^>]+>/g, ' ').trim().length).toBeGreaterThan(40);
      /* la shell SPA deve poter rendere il contenuto */
      expect(html).toContain('id="pbody"');
    }
  });

  it('ogni rotta ha contenuto renderizzabile nella build', () => {
    /* Guardia sul bug _urlForId: una rotta può rispondere 200 e restare
       vuota se il JSON che la SPA carica non è nel build o non contiene
       l'entità. Qui verifichiamo il dato, non solo la pagina. */
    for (const page of registry.pages) {
      const file = path.join(dist, 'content/pages', `${page.k}.json`);
      expect(fs.existsSync(file), `manca dist/content/pages/${page.k}.json`).toBe(true);
      const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
      /* layout "imprese" è un'app iframe: il markdown può restare vuoto */
      if (doc.layout === 'imprese') continue;
      expect((doc.content || '').trim().length, `contenuto vuoto in ${page.k}.json`).toBeGreaterThan(0);
    }

    for (const [key, base] of [
      ['pantheon', 'lore/pantheon'],
      ['lavori', 'personaggio/lavori'],
    ]) {
      const doc = JSON.parse(fs.readFileSync(path.join(dist, 'content/pages', `${key}.json`), 'utf8'));
      for (const route of routes.filter((item) => item.path.startsWith(base + '/'))) {
        expect(doc.content, `${route.label} non è in ${key}.json`).toContain(route.label);
      }
    }
  });

  it('serve 404 reali e nessun catch-all che le maschera', () => {
    expect(fs.existsSync(path.join(dist, '404.html'))).toBe(true);
    const redirects = fs.readFileSync(path.join(dist, '_redirects'), 'utf8');
    expect(redirects).not.toMatch(/^\s*\/\*\s+\/index\.html/m);
  });

  it('pubblica sitemap, robots, manifest e icone PWA', () => {
    expect(fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8')).toBe(renderSitemap(routes));
    expect(fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8')).toBe(renderRobots());
    const manifest = JSON.parse(fs.readFileSync(path.join(dist, 'manifest.webmanifest'), 'utf8'));
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.icons.some((icon) => icon.purpose === 'maskable' && icon.sizes === '512x512')).toBe(true);
    for (const icon of manifest.icons) {
      expect(fs.existsSync(path.join(dist, icon.src.replace(/^\//, ''))), `icona mancante: ${icon.src}`).toBe(true);
    }
    expect(fs.existsSync(path.join(dist, 'favicon.ico'))).toBe(true);
    expect(fs.existsSync(path.join(dist, 'apple-touch-icon.png'))).toBe(true);
  });

  it('serve i font dal proprio dominio', () => {
    const shell = read('index.html');
    expect(shell).not.toContain('fonts.googleapis.com');
    expect(shell).not.toContain('fonts.gstatic.com');
    expect(shell).toContain('/scripts/css/');
    const css = fs.readdirSync(path.join(dist, 'scripts/css')).find((file) => file.startsWith('main.'));
    expect(css).toBeTruthy();
    const bundle = fs.readFileSync(path.join(dist, 'scripts/css', css), 'utf8');
    expect(bundle).toMatch(/\/fonts\/cinzel-[^"')]+\.woff2/);
    const referenced = [...bundle.matchAll(/\/fonts\/([^"')]+\.woff2)/g)].map((m) => m[1]);
    expect(referenced.length).toBeGreaterThan(0);
    for (const font of new Set(referenced)) {
      expect(fs.existsSync(path.join(dist, 'fonts', font)), `font mancante: ${font}`).toBe(true);
    }
  });
});

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
