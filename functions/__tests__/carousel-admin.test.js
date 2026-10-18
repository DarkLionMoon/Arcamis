/*
  ARCAMIS — test dell'editor del carousel

  Il carousel della home vive in KV come tre chiavi per slide
  (immagine, testi, bottoni). L'editor admin ora le scrive con una sola
  action: qui si verifica che la validazione rifiuti link eseguibili,
  che i campi vuoti cancellino la chiave invece di salvare stringhe
  vuote e che una slide legacy (immagine in data URL) non venga
  sovrascritta quando si salvano solo i testi.
*/
import { describe, expect, it, beforeAll } from 'vitest';

function makeKV(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    map,
    async get(key) {
      return map.has(key) ? map.get(key) : null;
    },
    async put(key, value) {
      map.set(key, value);
    },
    async delete(key) {
      map.delete(key);
    },
    async list({ prefix = '' } = {}) {
      const keys = [...map.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name }));
      return { keys, list_complete: true };
    },
  };
}

const TOKEN = 'c'.repeat(48);
const SESSION = { role: 'editor', user: 'brian', csrf: 'csrf-carousel' };

let onRequest;

beforeAll(async () => {
  ({ onRequest } = await import('../api/admin.js'));
});

function call(kv, action, { method = 'GET', body, csrf = 'csrf-carousel' } = {}) {
  const headers = { 'Content-Type': 'application/json', Cookie: 'arc_admin=' + TOKEN };
  if (csrf) headers['X-CSRF-Token'] = csrf;
  const init = { method, headers };
  if (method === 'POST') init.body = JSON.stringify(body ?? {});
  const request = new Request('https://arcamis.pages.dev/api/admin?action=' + action, init);
  return onRequest({ request, env: { ARCAMIS_CACHE: kv, ADMIN_SECRET: 'secret' } });
}

function seedKV(extra = {}) {
  return makeKV({
    ['admin_session_' + TOKEN]: JSON.stringify(SESSION),
    ...extra,
  });
}

describe("carousel · lettura per l'editor", () => {
  it('restituisce sempre le tre slide, anche senza configurazione', async () => {
    const res = await call(seedKV(), 'get_carousel');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.slides.map((s) => s.key)).toEqual(['carousel_0', 'carousel_1', 'carousel_2']);
    expect(data.slides[0]).toMatchObject({ img: '', meta: {}, btns: [] });
  });

  it('converte le immagini legacy in URL servibili e legge testi e bottoni', async () => {
    const kv = seedKV({
      admin_cover_carousel_0: 'data:image/png;base64,AAAA',
      admin_cover_carousel_0_meta: JSON.stringify({ tag: 'Città', tit: 'ARCAMIS' }),
      admin_cover_carousel_0_btns: JSON.stringify([{ label: 'Discord', href: 'https://discord.gg/x' }]),
    });
    const data = await (await call(kv, 'get_carousel')).json();
    expect(data.slides[0].img).toBe('/api/cover/carousel_0');
    expect(data.slides[0].meta.tit).toBe('ARCAMIS');
    expect(data.slides[0].btns).toEqual([{ label: 'Discord', href: 'https://discord.gg/x' }]);
  });

  it('non è pubblica', async () => {
    const request = new Request('https://arcamis.pages.dev/api/admin?action=get_carousel');
    const res = await onRequest({ request, env: { ARCAMIS_CACHE: makeKV(), ADMIN_SECRET: 's' } });
    expect(res.status).toBe(401);
  });
});

describe('carousel · salvataggio di una slide', () => {
  it('richiede il token CSRF', async () => {
    const res = await call(seedKV(), 'set_carousel', {
      method: 'POST',
      csrf: null,
      body: { key: 'carousel_0', meta: { tit: 'X' } },
    });
    expect(res.status).toBe(403);
  });

  it('rifiuta chiavi che non sono slide', async () => {
    const res = await call(seedKV(), 'set_carousel', {
      method: 'POST',
      body: { key: 'carousel_9', meta: { tit: 'X' } },
    });
    expect(res.status).toBe(400);
  });

  it('scrive sfondo, testi e bottoni in un colpo solo', async () => {
    const kv = seedKV();
    const res = await call(kv, 'set_carousel', {
      method: 'POST',
      body: {
        key: 'carousel_1',
        img: '/images/home-pantheon.webp',
        meta: { tag: 'Pantheon', tit: 'LE DIVINITÀ', desc: 'Ogni dio ha lasciato il segno.' },
        btns: [
          { label: 'Scopri il Pantheon', href: '/pantheon' },
          { label: 'Discord', href: 'https://discord.gg/x' },
        ],
      },
    });
    expect(res.status).toBe(200);
    expect(kv.map.get('admin_cover_carousel_1')).toBe('/images/home-pantheon.webp');
    expect(JSON.parse(kv.map.get('admin_cover_carousel_1_meta'))).toEqual({
      tag: 'Pantheon',
      tit: 'LE DIVINITÀ',
      desc: 'Ogni dio ha lasciato il segno.',
    });
    expect(JSON.parse(kv.map.get('admin_cover_carousel_1_btns'))).toEqual([
      { label: 'Scopri il Pantheon', href: '/pantheon' },
      { label: 'Discord', href: 'https://discord.gg/x' },
    ]);
  });

  it('accetta il percorso restituito dal Media Manager', async () => {
    const kv = seedKV();
    const res = await call(kv, 'set_carousel', {
      method: 'POST',
      body: { key: 'carousel_0', img: '/images/nuova-123.webp' },
    });
    expect(res.status).toBe(200);
    expect(kv.map.get('admin_cover_carousel_0')).toBe('/images/nuova-123.webp');
  });

  it('rifiuta immagini e link fuori posto senza scrivere nulla', async () => {
    const kv = seedKV();
    for (const body of [
      { key: 'carousel_0', img: '//evil.example/x.png' },
      { key: 'carousel_0', img: '/images/../../etc/passwd' },
      { key: 'carousel_0', btns: [{ label: 'X', href: 'javascript:alert(1)' }] },
      { key: 'carousel_0', btns: [{ label: 'X', href: 'onclick=alert(1)' }] },
      { key: 'carousel_0', btns: [{ label: '', href: 'https://x.dev' }] },
    ]) {
      const res = await call(kv, 'set_carousel', { method: 'POST', body });
      expect(res.status, JSON.stringify(body)).toBe(400);
    }
    expect([...kv.map.keys()].filter((k) => k.startsWith('admin_cover_carousel'))).toEqual([]);
  });

  it('svuotare un campo cancella la chiave, non salva stringhe vuote', async () => {
    const kv = seedKV({
      admin_cover_carousel_2: '/images/old.webp',
      admin_cover_carousel_2_meta: JSON.stringify({ tit: 'VECCHIO' }),
      admin_cover_carousel_2_btns: JSON.stringify([{ label: 'Vecchio', href: '' }]),
    });
    const res = await call(kv, 'set_carousel', {
      method: 'POST',
      body: { key: 'carousel_2', img: '', meta: { tag: '', tit: '', desc: '' }, btns: [] },
    });
    expect(res.status).toBe(200);
    expect(kv.map.has('admin_cover_carousel_2')).toBe(false);
    expect(kv.map.has('admin_cover_carousel_2_meta')).toBe(false);
    expect(kv.map.has('admin_cover_carousel_2_btns')).toBe(false);
  });

  it("omettere img non tocca un'immagine legacy in data URL", async () => {
    const legacy = 'data:image/png;base64,AAAA';
    const kv = seedKV({ admin_cover_carousel_0: legacy });
    const res = await call(kv, 'set_carousel', {
      method: 'POST',
      body: { key: 'carousel_0', meta: { tit: 'NUOVO' } },
    });
    expect(res.status).toBe(200);
    expect(kv.map.get('admin_cover_carousel_0')).toBe(legacy);
  });
});

describe("cover legacy scritte dall'overlay del sito", () => {
  it('accetta percorsi interni per le immagini', async () => {
    const kv = seedKV();
    const res = await call(kv, 'set_cover', {
      method: 'POST',
      body: { pageId: 'pag-arcamis', coverUrl: '/images/arcamis.webp' },
    });
    expect(res.status).toBe(200);
    expect(kv.map.get('admin_cover_pagarcamis')).toBe('/images/arcamis.webp');
  });

  it('salva testi e bottoni del carousel come JSON', async () => {
    const kv = seedKV();
    const meta = JSON.stringify({ tag: 'Tag', tit: 'Titolo', desc: 'Testo' });
    const res = await call(kv, 'set_cover', {
      method: 'POST',
      body: { pageId: 'carousel_0_meta', coverUrl: meta },
    });
    expect(res.status).toBe(200);
    expect(kv.map.get('admin_cover_carousel_0_meta')).toBe(meta);
  });
});
