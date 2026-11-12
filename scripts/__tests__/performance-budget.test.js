/* ════════════════════════════════════════════════════════════════
   Guardrail di prestazioni.

   Non misurano Lighthouse (richiede un browser e un server), ma
   bloccano le due regressioni più costose viste nel repo:
     · una feature pesante rimessa nella shell globale;
     · un'immagine di contenuto fuori dalla pipeline responsive.

   Se un test fallisce, la correzione giusta è caricare la feature on
   demand o rigenerare le varianti con `npm run images:opt`, non
   alzare il budget.
   ════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const notionNav = fs.readFileSync(path.join(root, 'scripts/js/notion-nav.js'), 'utf8');
const buildPost = fs.readFileSync(path.join(root, 'scripts/build-post.mjs'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'images/opt/manifest.json'), 'utf8'));

describe('prestazioni · script della shell', () => {
  it('non carica builder e imprese su ogni pagina', () => {
    expect(index).not.toMatch(/<script[^>]+crea-pg\.js/);
    expect(index).not.toMatch(/<script[^>]+imprese\.js/);
  });

  it('li carica on demand dalla rotta corretta', () => {
    expect(notionNav).toContain("_withFeature('_creaPgInit', '/scripts/js/crea-pg.js'");
    expect(notionNav).toContain("_withFeature('_impreseInit', '/scripts/js/imprese.js'");
    expect(buildPost).toContain('window.__ARC_JS');
    expect(buildPost).toContain("from === '/scripts/js/crea-pg.js'");
    expect(buildPost).toContain("from === '/scripts/js/imprese.js'");
  });
});

describe('prestazioni · immagini di contenuto', () => {
  it('ogni immagine raster markdown passa dalla pipeline responsive', () => {
    const refs = new Set();
    const pagesDir = path.join(root, 'content/pages');
    for (const name of fs.readdirSync(pagesDir)) {
      if (!name.endsWith('.json') || name === 'registry.json') continue;
      const source = fs.readFileSync(path.join(pagesDir, name), 'utf8');
      for (const match of source.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
        const src = match[1].trim().split('#')[0].split('?')[0];
        if (/^\/images\/.*\.(?:jpe?g|png|webp)$/i.test(src)) refs.add(src);
      }
    }
    const missing = [...refs].filter((src) => !manifest.sources[src]);
    expect(missing, `immagini senza varianti: ${missing.join(', ')}`).toEqual([]);
    expect(refs.size).toBeGreaterThan(80);
  });
});
