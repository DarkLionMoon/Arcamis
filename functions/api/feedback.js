/* ════════════════════════════════════════════════════════════
   ARCAMIS — functions/api/feedback.js

   Raccolta del feedback pubblico (widget in scripts/js/feedback.js).

   Flusso:
   1. POST JSON { category, message, email?, page?, website? }
   2. honeypot + validazione + rate limit per IP (5/ora)
   3. salvataggio in KV sotto `feedback:<id>` (TTL 180 giorni)
   4. inoltro opzionale a FEEDBACK_WEBHOOK_URL, se configurato

   Se manca sia KV sia il webhook risponde 503 con
   { error: "storage_unavailable" }: il client mostra allora il
   messaggio di servizio non disponibile e permette il retry.
   L'IP non viene mai salvato nel record.
   ════════════════════════════════════════════════════════════ */

const CATEGORIES = new Set(['bug', 'feature', 'ux', 'general']);
const MAX_MESSAGE = 2000;
const MIN_MESSAGE = 5;
const MAX_EMAIL = 120;
const MAX_BODY = 8192;
const RATE_LIMIT = 5;
const RATE_WINDOW = 3600;
const FEEDBACK_TTL = 180 * 86400;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  };
}

function reply(status, payload, headers) {
  return new Response(JSON.stringify(payload), { status, headers });
}

function allowedOrigin(url) {
  if (url.origin === 'https://arcamis.pages.dev') return url.origin;
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return url.origin;
  return 'https://arcamis.pages.dev';
}

/* Il path serve solo come contesto: niente query string arbitraria in KV. */
function sanitizePage(value) {
  if (typeof value !== 'string') return '/';
  const path = value.split('?')[0].split('#')[0].slice(0, 200);
  return /^\/[\w\-./]*$/.test(path) ? path : '/';
}

function newId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const origin = allowedOrigin(url);
  const cors = corsHeaders(origin);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  if (request.method !== 'POST') {
    return reply(405, { error: 'method_not_allowed' }, cors);
  }

  /* Difesa CSRF leggera: se il browser manda Origin, deve essere il nostro. */
  const requestOrigin = request.headers.get('Origin');
  if (requestOrigin && requestOrigin !== url.origin && requestOrigin !== origin) {
    return reply(403, { error: 'forbidden_origin' }, cors);
  }

  const declaredLength = Number(request.headers.get('Content-Length') || 0);
  if (declaredLength > MAX_BODY) {
    return reply(413, { error: 'payload_too_large' }, cors);
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return reply(400, { error: 'invalid_json' }, cors);
  }
  if (!body || typeof body !== 'object') {
    return reply(400, { error: 'invalid_json' }, cors);
  }

  /* Honeypot: i bot compilano il campo nascosto. Risposta identica alla
     normale per non dare indizi, ma nessuna scrittura. */
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return reply(200, { ok: true }, cors);
  }

  const category = typeof body.category === 'string' ? body.category.trim() : '';
  if (!CATEGORIES.has(category)) {
    return reply(400, { error: 'invalid_category' }, cors);
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (message.length < MIN_MESSAGE) {
    return reply(400, { error: 'message_required' }, cors);
  }
  if (message.length > MAX_MESSAGE) {
    return reply(400, { error: 'message_too_long' }, cors);
  }

  const emailRaw = typeof body.email === 'string' ? body.email.trim() : '';
  const email = emailRaw.slice(0, MAX_EMAIL);
  if (email && !EMAIL_RE.test(email)) {
    return reply(400, { error: 'invalid_email' }, cors);
  }

  const KV = env.ARCAMIS_CACHE;
  const WEBHOOK_URL = env.FEEDBACK_WEBHOOK_URL;

  if (!KV && !WEBHOOK_URL) {
    return reply(503, { error: 'storage_unavailable' }, cors);
  }

  /* Rate limit per IP: la chiave scade con la finestra, non conserva l'IP
     nel record finale. */
  if (KV) {
    try {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const rlKey = 'rl_feedback_' + ip;
      const raw = await KV.get(rlKey);
      const count = raw ? parseInt(raw, 10) : 0;
      if (count >= RATE_LIMIT) {
        return reply(429, { error: 'rate_limited' }, cors);
      }
      await KV.put(rlKey, String(count + 1), { expirationTtl: RATE_WINDOW });
    } catch (err) {
      /* KV non raggiungibile: si prosegue, il rate limit non è critico. */
    }
  }

  const record = {
    id: newId(),
    category,
    message,
    email: email || null,
    page: sanitizePage(body.page),
    locale: typeof body.locale === 'string' ? body.locale.slice(0, 16) : null,
    country: request.headers.get('CF-IPCountry') || null,
    userAgent: (request.headers.get('User-Agent') || '').slice(0, 200),
    createdAt: new Date().toISOString(),
  };

  if (KV) {
    try {
      await KV.put('feedback:' + record.id, JSON.stringify(record), {
        expirationTtl: FEEDBACK_TTL,
      });
    } catch (err) {
      return reply(503, { error: 'storage_unavailable' }, cors);
    }
  }

  /* Inoltro opzionale: un webhook lento o rotto non deve far perdere il
     feedback già salvato. */
  if (typeof WEBHOOK_URL === 'string' && /^https:\/\//.test(WEBHOOK_URL)) {
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'Nuovo feedback dalla wiki',
          embeds: [
            {
              title: 'Feedback · ' + record.category,
              description: record.message.slice(0, 1800),
              color: 0xc89b3c,
              fields: [
                { name: 'Pagina', value: record.page || '/', inline: true },
                { name: 'Contatto', value: record.email || '(anonimo)', inline: true },
              ],
              footer: { text: 'Arcamis Feedback · ' + record.id },
              timestamp: record.createdAt,
            },
          ],
        }),
      });
    } catch (err) {
      /* silenzioso: il record è già al sicuro in KV */
    }
  }

  return reply(200, { ok: true, id: record.id }, cors);
}
