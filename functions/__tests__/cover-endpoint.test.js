import { describe, it, expect } from 'vitest';
import { onRequest } from '../api/cover/[id].js';

const GIF_BASE64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const COVER = 'data:image/gif;base64,' + GIF_BASE64;

function makeContext(id, { value = COVER, method = 'GET', headers = {} } = {}) {
  return {
    request: new Request('https://arcamis.pages.dev/api/cover/' + id, { method, headers }),
    env: {
      ARCAMIS_CACHE: {
        async get(key) {
          if (key === 'admin_cover_' + id) return value;
          return null;
        },
      },
    },
    params: { id },
  };
}

describe('GET /api/cover/:id', () => {
  it('serve l’immagine decodificata con content-type e cache', async () => {
    const response = await onRequest(makeContext('carousel_0'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/gif');
    expect(response.headers.get('cache-control')).toContain('max-age=600');
    const body = new Uint8Array(await response.arrayBuffer());
    expect(body[0]).toBe(0x47); // 'G'
  });

  it('risponde 304 quando l’ETag coincide', async () => {
    const first = await onRequest(makeContext('carousel_0'));
    const etag = first.headers.get('etag');
    const second = await onRequest(makeContext('carousel_0', { headers: { 'If-None-Match': etag } }));
    expect(second.status).toBe(304);
    expect(second.headers.get('etag')).toBe(etag);
  });

  it('redirige i valori che sono già URL', async () => {
    const response = await onRequest(makeContext('pag-x', { value: '/images/forgia.webp' }));
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://arcamis.pages.dev/images/forgia.webp');
  });

  it('rifiuta id non validi e cover mancanti', async () => {
    const invalid = await onRequest(makeContext('../admin_session_x'));
    expect(invalid.status).toBe(404);
    const missing = await onRequest(makeContext('pag-missing', { value: null }));
    expect(missing.status).toBe(404);
  });

  it('rifiuta metodi diversi da GET/HEAD', async () => {
    const response = await onRequest(makeContext('carousel_0', { method: 'POST' }));
    expect(response.status).toBe(405);
  });

  it('risponde 415 per data URL non immagine', async () => {
    const response = await onRequest(makeContext('pag-bad', { value: 'data:text/plain;base64,SGVsbG8=' }));
    expect(response.status).toBe(415);
  });
});
