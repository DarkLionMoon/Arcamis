/*
  ARCAMIS — stato e rotazione del token GitHub.

  Il pannello deve verificare davvero il token (non solo la sua presenza)
  e usare quello appena salvato in KV, anche quando esiste GH_TOKEN
  d'ambiente. Questi test coprono il contratto di /api/admin.
*/
import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequest } from '../api/admin.js';

function makeKV(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
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

const originalFetch = global.fetch;

function makeRequest(action, { method = 'GET', body, csrf } = {}) {
  const headers = {
    'Content-Type': 'application/json',
    Cookie: 'arc_admin=test-token',
  };
  if (csrf) headers['X-CSRF-Token'] = csrf;
  const init = { method, headers };
  if (method === 'POST') init.body = JSON.stringify(body ?? {});
  return new Request('https://arcamis.pages.dev/api/admin?action=' + action, init);
}

function sessionKV(extra = {}) {
  return makeKV({
    'admin_session_test-token': JSON.stringify({
      role: 'admin',
      user: 'admin-user',
      csrf: 'csrf-value',
    }),
    ...extra,
  });
}

function respond(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => {
  global.fetch = originalFetch;
});

describe('/api/admin — stato del token GitHub', () => {
  it('verifica il token e usa quello salvato in KV prima di GH_TOKEN', async () => {
    const kv = sessionKV({ gh_token: 'kv-token' });
    global.fetch = vi.fn(async () => respond({ full_name: 'DarkLionMoon/Arcamis' }));

    const res = await onRequest({
      request: makeRequest('gh_token_status'),
      env: { ARCAMIS_CACHE: kv, ADMIN_SECRET: 'secret', GH_TOKEN: 'env-token' },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ configured: true, ok: true, source: 'kv' });
    expect(global.fetch.mock.calls[0][1].headers.Authorization).toBe('token kv-token');
  });

  it('riporta il motivo reale quando GitHub rifiuta il token', async () => {
    const kv = sessionKV();
    global.fetch = vi.fn(async () => respond({ message: 'Bad credentials' }, 401));

    const res = await onRequest({
      request: makeRequest('gh_token_status'),
      env: { ARCAMIS_CACHE: kv, ADMIN_SECRET: 'secret', GH_TOKEN: 'bad-token' },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ configured: true, ok: false, source: 'env' });
    expect(body.message).toContain('401');
    expect(body.message).toContain('Bad credentials');
  });

  it('valida il token prima di salvarlo in KV', async () => {
    const kv = sessionKV();
    global.fetch = vi.fn(async () => respond({ full_name: 'DarkLionMoon/Arcamis' }));

    const res = await onRequest({
      request: makeRequest('set_gh_token', {
        method: 'POST',
        csrf: 'csrf-value',
        body: { token: 'kv-new' },
      }),
      env: { ARCAMIS_CACHE: kv, ADMIN_SECRET: 'secret', GH_TOKEN: 'env-old' },
    });

    expect(res.status).toBe(200);
    expect(await kv.get('gh_token')).toBe('kv-new');
  });

  it('non salva un token che GitHub rifiuta', async () => {
    const kv = sessionKV();
    global.fetch = vi.fn(async () => respond({ message: 'Bad credentials' }, 401));

    const res = await onRequest({
      request: makeRequest('set_gh_token', {
        method: 'POST',
        csrf: 'csrf-value',
        body: { token: 'invalid' },
      }),
      env: { ARCAMIS_CACHE: kv, ADMIN_SECRET: 'secret' },
    });

    expect(res.status).toBe(400);
    expect(await kv.get('gh_token')).toBeNull();
  });
});
