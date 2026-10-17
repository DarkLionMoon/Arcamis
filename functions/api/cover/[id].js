/* ════════════════════════════════════════════════════════
   ARCAMIS — GET /api/cover/:id
   Serve una copertina salvata in KV come data URL come vera
   immagine (content-type corretto, cache, ETag), così il JSON
   di /api/admin?action=get_covers resta di pochi KB e il
   browser può scaricare/lazy-caricare solo ciò che serve.
════════════════════════════════════════════════════════ */
import { sha256hex } from '../_lib/auth.js';
import { isValidCoverId, parseImageDataUrl } from '../_lib/covers.js';

const CACHE_CONTROL = 'public, max-age=600, stale-while-revalidate=86400';

export async function onRequest(context) {
  const { request, env, params } = context;

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'GET, HEAD' },
    });
  }

  const pageId = params && params.id ? decodeURIComponent(params.id) : '';
  if (!isValidCoverId(pageId)) return new Response('Not found', { status: 404 });

  const KV = env.ARCAMIS_CACHE;
  if (!KV) return new Response('Not available', { status: 503 });

  let raw = null;
  try {
    raw = await KV.get('admin_cover_' + pageId);
  } catch (e) {
    return new Response('Not available', { status: 503 });
  }
  if (!raw) return new Response('Not found', { status: 404 });

  /* Valori già sotto forma di URL: redirect al file statico. */
  if (!raw.startsWith('data:')) {
    if (/^https?:\/\//i.test(raw)) return Response.redirect(raw, 302);
    if (raw.startsWith('/')) return Response.redirect(new URL(raw, request.url).toString(), 302);
    return new Response('Not found', { status: 404 });
  }

  const image = parseImageDataUrl(raw);
  if (!image) return new Response('Unsupported image', { status: 415 });

  /* ETag stabile: cambia solo quando cambia la copertina in KV. */
  const etag = '"' + (await sha256hex(raw)).slice(0, 32) + '"';
  const headers = {
    'Content-Type': image.contentType,
    'Content-Length': String(image.bytes.length),
    'Cache-Control': CACHE_CONTROL,
    ETag: etag,
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': new URL(request.url).origin,
  };

  if (request.headers.get('If-None-Match') === etag) {
    return new Response(null, { status: 304, headers });
  }
  if (request.method === 'HEAD') {
    return new Response(null, { status: 200, headers });
  }
  return new Response(image.bytes, { status: 200, headers });
}
