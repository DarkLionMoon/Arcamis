import { describe, expect, it } from 'vitest';

import { onRequest } from '../api/feedback.js';

const ENDPOINT = 'https://arcamis.pages.dev/api/feedback';

function makeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    async get(key) {
      return store.has(key) ? store.get(key) : null;
    },
    async put(key, value) {
      store.set(key, value);
    },
    async delete(key) {
      store.delete(key);
    },
  };
}

function jsonRequest(body, options = {}) {
  const method = options.method || 'POST';
  const headers = {
    'Content-Type': 'application/json',
    'CF-Connecting-IP': '203.0.113.7',
    ...(options.headers || {}),
  };
  const init = { method, headers };
  if (method !== 'GET' && method !== 'HEAD') {
    init.body = options.raw !== undefined ? options.raw : JSON.stringify(body);
  }
  return new Request(ENDPOINT, init);
}

async function call(request, env = {}) {
  const res = await onRequest({ request, env });
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }
  return { res, data };
}

const validBody = {
  category: 'bug',
  message: 'Il link della scheda Arena porta alla pagina sbagliata',
  email: 'avventuriero@example.com',
  page: '/lore/arcamis',
};

describe('API feedback', () => {
  it('accetta solo POST e risponde al preflight', async () => {
    const get = await call(jsonRequest(null, { method: 'GET' }), { ARCAMIS_CACHE: makeKV() });
    expect(get.res.status).toBe(405);
    expect(get.data.error).toBe('method_not_allowed');
    expect(get.res.headers.get('Access-Control-Allow-Origin')).toBe('https://arcamis.pages.dev');

    const options = await call(jsonRequest(null, { method: 'OPTIONS' }), {
      ARCAMIS_CACHE: makeKV(),
    });
    expect(options.res.status).toBe(204);
  });

  it('rifiuta categorie, messaggi ed email non validi', async () => {
    const env = { ARCAMIS_CACHE: makeKV() };

    const noCategory = await call(jsonRequest({ ...validBody, category: 'altro' }), env);
    expect(noCategory.res.status).toBe(400);
    expect(noCategory.data.error).toBe('invalid_category');

    const empty = await call(jsonRequest({ ...validBody, message: '   ' }), env);
    expect(empty.res.status).toBe(400);
    expect(empty.data.error).toBe('message_required');

    const tooLong = await call(jsonRequest({ ...validBody, message: 'x'.repeat(2001) }), env);
    expect(tooLong.res.status).toBe(400);
    expect(tooLong.data.error).toBe('message_too_long');

    const badEmail = await call(jsonRequest({ ...validBody, email: 'non-una-email' }), env);
    expect(badEmail.res.status).toBe(400);
    expect(badEmail.data.error).toBe('invalid_email');
  });

  it('rifiuta un body che non è JSON', async () => {
    const { res, data } = await call(jsonRequest(null, { raw: '{non json' }), {
      ARCAMIS_CACHE: makeKV(),
    });
    expect(res.status).toBe(400);
    expect(data.error).toBe('invalid_json');
  });

  it('salva il feedback in KV senza conservare l’IP', async () => {
    const kv = makeKV();
    const { res, data } = await call(jsonRequest(validBody), { ARCAMIS_CACHE: kv });
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(typeof data.id).toBe('string');

    const key = Array.from(kv.store.keys()).find((k) => k.startsWith('feedback:'));
    expect(key).toBeTruthy();
    const stored = JSON.parse(kv.store.get(key));
    expect(stored.message).toBe(validBody.message);
    expect(stored.category).toBe('bug');
    expect(stored.email).toBe(validBody.email);
    expect(stored.page).toBe('/lore/arcamis');
    expect(kv.store.get(key)).not.toContain('203.0.113.7');
  });

  it('normalizza un path sospetto e ignora i campi extra', async () => {
    const kv = makeKV();
    const { res } = await call(jsonRequest({ ...validBody, page: '/lore/<script>alert(1)</script>' }), {
      ARCAMIS_CACHE: kv,
    });
    expect(res.status).toBe(200);
    const key = Array.from(kv.store.keys()).find((k) => k.startsWith('feedback:'));
    expect(JSON.parse(kv.store.get(key)).page).toBe('/');
  });

  it('non salva nulla quando il honeypot è compilato', async () => {
    const kv = makeKV();
    const { res, data } = await call(jsonRequest({ ...validBody, website: 'spam' }), {
      ARCAMIS_CACHE: kv,
    });
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(Array.from(kv.store.keys()).filter((k) => k.startsWith('feedback:'))).toHaveLength(0);
  });

  it('applica il rate limit per IP', async () => {
    const kv = makeKV({ 'rl_feedback_203.0.113.7': '5' });
    const { res, data } = await call(jsonRequest(validBody), { ARCAMIS_CACHE: kv });
    expect(res.status).toBe(429);
    expect(data.error).toBe('rate_limited');
  });

  it('risponde 503 quando manca ogni storage', async () => {
    const { res, data } = await call(jsonRequest(validBody), {});
    expect(res.status).toBe(503);
    expect(data.error).toBe('storage_unavailable');
  });

  it('blocca le richieste con Origin estraneo', async () => {
    const { res, data } = await call(jsonRequest(validBody, { headers: { Origin: 'https://evil.example' } }), {
      ARCAMIS_CACHE: makeKV(),
    });
    expect(res.status).toBe(403);
    expect(data.error).toBe('forbidden_origin');
  });
});
