/*
  ARCAMIS — test degli stati di pubblicazione lato sito/build

  Lo stesso stato è implementato in tre posti, perché servono a tre
  runtime diversi:

    · scripts/js/page-status.js      → il sito, quando mostra o blocca
    · scripts/lib/routes.mjs         → la build (rotte, sitemap, elenco
                                       delle pagine da togliere dal menu)
    · admin/src/features/pages/workflow.ts → il pannello
                                       (admin/…/workflow.parity.test.ts
                                       confronta quest'ultimo con il sito)

  Qui si verifica che sito e build concordino su una matrice di casi, e
  che la build escluda davvero le pagine non pubblicate da rotte e
  sitemap: una divergenza silenziosa vorrebbe dire o un link indicizzato
  a una bozza, o una pagina pubblica che sparisce.
*/
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

import { describe, expect, it, beforeAll } from 'vitest';

import {
  collectRoutes,
  declaredPageStatus,
  hiddenPageKeys,
  isPageDue,
  isPagePublic,
  pageStatusOf,
} from '../lib/routes.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');

/* Il file del sito è uno script classico: si valuta in un contesto vm con
   un finto `window`, esattamente come lo vedrebbe il browser. */
function loadSiteSpec() {
  const code = fs.readFileSync(path.join(root, 'scripts/js/page-status.js'), 'utf8');
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  return sandbox.window.arcPageWorkflow;
}

const NOW = Date.parse('2026-10-17T12:00:00.000Z');
const FUTURE = '2026-11-01T09:00:00.000Z';
const PAST = '2026-10-01T09:00:00.000Z';

const CASES = [
  ['pagina storica senza campi', {}],
  ['bozza storica', { isDraft: true }],
  ['bozza dichiarata', { status: 'draft' }],
  ['in revisione', { status: 'review', isDraft: true }],
  ['programmata futura', { status: 'scheduled', publishAt: FUTURE }],
  ['programmata scaduta', { status: 'scheduled', publishAt: PAST }],
  ['programmata senza data', { status: 'scheduled' }],
  ['programmata con data rotta', { status: 'scheduled', publishAt: 'ieri' }],
  ['pubblicata', { status: 'published' }],
  ['pubblicata con bozza residua', { status: 'published', isDraft: true }],
  ['data futura senza stato', { publishAt: FUTURE }],
  ['dati assenti', null],
];

describe('specifica condivisa fra sito e build', () => {
  let site;

  beforeAll(() => {
    site = loadSiteSpec();
    expect(site, 'scripts/js/page-status.js non espone window.arcPageWorkflow').toBeTruthy();
  });

  it('lo script del sito espone la specifica', () => {
    for (const fn of ['declaredStatus', 'statusOf', 'isPublic', 'isDue', 'gate', 'pruneList']) {
      expect(typeof site[fn], `manca ${fn}`).toBe('function');
    }
    expect(site.STATUSES).toEqual(['draft', 'review', 'scheduled', 'published']);
  });

  it.each(CASES)('sito e build concordano su: %s', (_label, page) => {
    expect(site.declaredStatus(page)).toBe(declaredPageStatus(page));
    expect(site.statusOf(page, NOW)).toBe(pageStatusOf(page, NOW));
    expect(site.isPublic(page, NOW)).toBe(isPagePublic(page, NOW));
    expect(site.isDue(page, NOW)).toBe(isPageDue(page, NOW));
  });

  it('classifica come atteso i casi che contano', () => {
    expect(pageStatusOf({ status: 'scheduled', publishAt: FUTURE }, NOW)).toBe('scheduled');
    expect(pageStatusOf({ status: 'scheduled', publishAt: PAST }, NOW)).toBe('published');
    expect(isPageDue({ status: 'scheduled', publishAt: PAST }, NOW)).toBe(true);
    expect(isPagePublic({ status: 'review' }, NOW)).toBe(false);
    expect(isPagePublic({ isDraft: true }, NOW)).toBe(false);
    expect(isPagePublic({}, NOW)).toBe(true);
  });

  it('il messaggio mostrato al posto del contenuto dice lo stato', () => {
    expect(site.gate({ status: 'published' }, NOW).blocked).toBe(false);
    expect(site.gate({ status: 'draft' }, NOW)).toMatchObject({ blocked: true, title: 'Bozza' });
    expect(site.gate({ status: 'review' }, NOW).title).toBe('In revisione');
    const scheduled = site.gate({ status: 'scheduled', publishAt: FUTURE }, NOW);
    expect(scheduled.title).toBe('In arrivo');
    expect(scheduled.message).toMatch(/2026/);
  });
});

describe('elenco delle pagine nascoste', () => {
  it('senza lista (sviluppo) non nasconde nulla', () => {
    const site = loadSiteSpec();
    expect(site.isListed('qualsiasi')).toBe(true);
    const list = [{ k: 'a' }, { k: 'b' }];
    expect(site.pruneList(list)).toBe(0);
    expect(list).toHaveLength(2);
  });

  it('con la lista della build toglie le pagine non pubbliche', () => {
    const code = fs.readFileSync(path.join(root, 'scripts/js/page-status.js'), 'utf8');
    const sandbox = {
      window: { __ARC_HIDDEN_PAGES__: ['beta'], pages: [{ k: 'alpha' }, { k: 'beta' }] },
      console,
    };
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
    expect(sandbox.window.arcPageWorkflow.isListed('beta')).toBe(false);
    expect(sandbox.window.arcPageWorkflow.isListed('alpha')).toBe(true);
    /* Il globale `pages` di data.js è già stato ripulito. */
    expect(sandbox.window.pages.map((p) => p.k)).toEqual(['alpha']);
  });
});

describe('build: rotte e sitemap solo per le pagine pubblicate', () => {
  let dir;

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcamis-status-'));
    const pagesDir = path.join(dir, 'content', 'pages');
    fs.mkdirSync(pagesDir, { recursive: true });
    const write = (name, value) => fs.writeFileSync(path.join(pagesDir, name), JSON.stringify(value, null, 2));
    write('registry.json', {
      pages: [
        { k: 'alpha', l: 'Alpha', i: '🅰️', id: 'pag-alpha', path: 'alpha' },
        { k: 'beta', l: 'Beta', i: '🅱️', id: 'pag-beta', path: 'beta' },
        { k: 'gamma', l: 'Gamma', i: '🅾️', id: 'pag-gamma', path: 'gamma' },
      ],
      sections: [],
    });
    write('alpha.json', { k: 'alpha', title: 'Alpha', content: '# Alpha\n\nTesto pubblicato.', lastModified: '2026-10-01T00:00:00.000Z' });
    write('beta.json', { k: 'beta', title: 'Beta', content: '# Beta\n\nAncora in lavorazione.', status: 'draft', isDraft: true });
    write('gamma.json', { k: 'gamma', title: 'Gamma', content: '# Gamma\n\nEsce fra un po’.', status: 'scheduled', publishAt: FUTURE });
  });

  it('esclude bozze e programmate dalle rotte prerenderizzate', () => {
    const routes = collectRoutes(dir, NOW).map((route) => route.path);
    expect(routes).toContain('alpha');
    expect(routes).not.toContain('beta');
    expect(routes).not.toContain('gamma');
    /* Le rotte fisse restano. */
    expect(routes).toContain('changelog');
  });

  it('elenca per il sito le chiavi non pubbliche', () => {
    expect(hiddenPageKeys(dir, NOW).sort()).toEqual(['beta', 'gamma']);
  });

  it('una programmata scaduta entra in rotte solo dopo la data', () => {
    const later = Date.parse('2026-12-01T00:00:00.000Z');
    expect(collectRoutes(dir, later).map((route) => route.path)).toContain('gamma');
    expect(hiddenPageKeys(dir, later)).toEqual(['beta']);
  });

  it('il repo reale non nasconde nessuna pagina oggi', () => {
    /* Guardia sul contenuto versionato: se una pagina finisce in bozza o
       viene programmata, questo test lo dice invece di lasciar sparire
       una rotta in silenzio. */
    const published = collectRoutes(root).map((route) => route.path);
    for (const key of hiddenPageKeys(root)) {
      expect(published, `pagina non pubblicata ancora in rotte: ${key}`).not.toContain(key);
    }
  });
});
