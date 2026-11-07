/* ════════════════════════════════════════════════════════════
   Le schede dei luoghi di Arcamis.

   Perché esiste: la pagina della città nominava biblioteca, forgia,
   caserma e gli altri luoghi senza una scheda, e perf.js ne prefetchava
   gli id — aperture a vuoto a ogni visita. Qui si controlla che ogni
   scheda esista nel registro, che la rotta sia mappata e che i link
   interni al markdown non aprano una scheda nuova.
   ════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const root = path.join(import.meta.dirname, '..', '..');
const registry = JSON.parse(fs.readFileSync(path.join(root, 'content/pages/registry.json'), 'utf8'));
const places = registry.pages.filter(p => typeof p.path === 'string' && p.path.startsWith('lore/arcamis/'));

describe('schede dei luoghi di Arcamis', () => {
  it('ogni scheda ha file, titolo e icona', () => {
    expect(places.length).toBe(13);
    for (const p of places) {
      const file = path.join(root, 'content/pages', p.k + '.json');
      expect(fs.existsSync(file), p.k + ' senza file').toBe(true);
      const page = JSON.parse(fs.readFileSync(file, 'utf8'));
      expect(page.title, p.k).toBe(p.l);
      expect(page.content.length, p.k).toBeGreaterThan(300);
    }
  });

  it('la pagina della città rimanda alle schede', () => {
    const city = JSON.parse(fs.readFileSync(path.join(root, 'content/pages/arcamis.json'), 'utf8'));
    for (const p of places.filter(x => x.k !== 'gilda-degli-avventurieri')) {
      expect(city.content, p.k).toContain('](/lore/arcamis/' + p.k + ')');
    }
  });

  it('ogni rotta del registro ha la sua voce in _pathMap', () => {
    const app = fs.readFileSync(path.join(root, 'scripts/js/app.js'), 'utf8');
    for (const p of places) {
      expect(app, p.path).toContain("'" + p.path + "'");
    }
  });

  it('i link interni non aprono una scheda nuova, gli esterni sì', () => {
    const sandbox = { window: {}, console };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(root, 'scripts/js/md-render.js'), 'utf8'), sandbox);
    const html = vm.runInContext('window.mdRender', sandbox)(
      '[Scheda](/lore/arcamis/biblioteca) e [fonte](https://example.com)'
    );
    expect(html.match(/<a href="\/lore\/arcamis\/biblioteca"[^>]*>/)[0]).not.toContain('target=');
    expect(html.match(/<a href="https:\/\/example\.com"[^>]*>/)[0]).toContain('target="_blank"');
  });
});
