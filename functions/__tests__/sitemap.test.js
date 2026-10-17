import { describe, expect, it } from 'vitest';
import { onRequest, onRequestGet } from '../api/sitemap.js';

function context(path) {
  return { request: new Request('https://arcamis.pages.dev' + path) };
}

describe('/api/sitemap', () => {
  it('reindirizza in modo permanente alla sitemap generata dalla build', async () => {
    const res = await onRequest(context('/api/sitemap'));
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('https://arcamis.pages.dev/sitemap.xml');
  });

  it('si comporta allo stesso modo su GET (alias)', async () => {
    const res = await onRequestGet(context('/api/sitemap?x=1'));
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe('https://arcamis.pages.dev/sitemap.xml');
  });
});
