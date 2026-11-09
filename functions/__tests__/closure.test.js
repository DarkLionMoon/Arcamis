import { describe, expect, it } from 'vitest';

import { NOTION_URL, onRequest } from '../_middleware.js';

function call(path = '/', method = 'GET') {
  return onRequest({ request: new Request('https://arcamis.pages.dev' + path, { method }) });
}

describe('chiusura del sito', () => {
  it.each(['/', '/lore/arcamis', '/admin', '/api/feedback', '/scripts/js/app.js', '/sitemap.xml'])(
    'risponde 503 su %s',
    async (path) => {
      const res = await call(path);
      expect(res.status).toBe(503);
      expect(res.headers.get('content-type')).toContain('text/html');
      expect(res.headers.get('cache-control')).toContain('no-store');
      expect(res.headers.get('x-robots-tag')).toContain('noindex');
    }
  );

  it('mostra le scuse e il rimando a Notion', async () => {
    const body = await (await call('/')).text();
    expect(body).toContain('Ci scusiamo');
    expect(body).toContain('Notion');
    expect(body).toContain(NOTION_URL);
    expect(body).toContain('noindex');
  });

  it('non espone contenuti della wiki', async () => {
    const body = await (await call('/lore/arcamis')).text();
    expect(body).not.toContain('ARCAMIS');
    expect(body).not.toContain('tnav');
    expect(body).not.toContain('showHome');
  });

  it('lascia leggibile robots.txt con divieto totale', async () => {
    const res = await call('/robots.txt');
    const body = await res.text();
    expect(res.status).toBe(200);
    expect(body).toContain('Disallow: /');
    expect(body).not.toContain('Allow: /');
  });

  it('risponde 503 senza corpo a HEAD', async () => {
    const res = await call('/', 'HEAD');
    expect(res.status).toBe(503);
    expect(await res.text()).toBe('');
  });
});
