/* ════════════════════════════════════════════════════════════
   Regressione: il sito non deve tornare in manutenzione globale.

   Durante la chiusura un `functions/_middleware.js` rispondeva 503 a
   ogni richiesta, e `_routes.json` con `include: ["/*"]` lo rendeva
   attivo su tutto. Questi test falliscono se una delle due cose
   ricompare, o se robots.txt torna a bloccare l'intero sito.
════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { SITE_URL } from '../../scripts/lib/routes.mjs';

const root = process.cwd();
const functionsDir = path.join(root, 'functions');

function middlewareFiles(dir) {
  const found = [];
  if (!fs.existsSync(dir)) return found;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      found.push(...middlewareFiles(absolute));
    } else if (entry.name === '_middleware.js') {
      found.push(path.relative(root, absolute));
    }
  }
  return found;
}

describe('sito aperto', () => {
  it('non ha un middleware globale di manutenzione', () => {
    expect(middlewareFiles(functionsDir)).toEqual([]);
  });

  it('instrada alle Functions solo le API, non tutto il sito', () => {
    const routes = JSON.parse(fs.readFileSync(path.join(root, '_routes.json'), 'utf8'));
    expect(routes.include).toEqual(['/api/*']);
    expect(routes.include).not.toContain('/*');
  });

  it('robots.txt consente la scansione e dichiara la sitemap', () => {
    const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).not.toMatch(/^Disallow: \/$/m);
    expect(robots).toContain('Disallow: /admin');
    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
  });
});
