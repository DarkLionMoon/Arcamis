import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onRequest } from '../api/gh.js';

function makeKV(sessions = {}) {
  const map = new Map(Object.entries(sessions));
  return {
    async get(key) { return map.has(key) ? map.get(key) : null; },
    async put(key, value) { map.set(key, value); },
    async delete(key) { map.delete(key); },
    _map: map
  };
}

function sessionJSON() {
  return JSON.stringify({ role: 'admin', user: 'admin', csrf: 'csrf' });
}

function makeRequest(action, payload, cookie) {
  return new Request('http://arcamis.example/api/gh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: 'arc_admin=' + cookie } : {})
    },
    body: JSON.stringify({ action, payload })
  });
}

function toJSON(response) {
  return response.json();
}

describe('/api/gh — autenticazione e ruoli', () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    );
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 401 without a session cookie', async () => {
    const ctx = { request: makeRequest('get', { path: 'content/pages/x.json' }), env: { ARCAMIS_CACHE: makeKV(), GH_TOKEN: 'gh_test' } };
    const res = await onRequest(ctx);
    expect(res.status).toBe(401);
  });

  it('returns 401 with an unknown session token', async () => {
    const ctx = { request: makeRequest('put', { path: 'a.json' }, 'bogus'), env: { ARCAMIS_CACHE: makeKV(), GH_TOKEN: 'gh_test' } };
    const res = await onRequest(ctx);
    expect(res.status).toBe(401);
  });

  it('allows viewer role to perform read operations (get)', async () => {
    const kv = makeKV({ admin_session_viewer: JSON.stringify({ role: 'viewer', user: 'v' }) });
    const ctx = { request: makeRequest('get', { path: 'content/registry.json' }, 'viewer'), env: { ARCAMIS_CACHE: kv, GH_TOKEN: 'gh_test' } };
    const res = await onRequest(ctx);
    expect(res.status).toBe(200);
    const body = await toJSON(res);
    expect(body.ok).toBe(true);
  });

  it('blocks viewer role from write operations (put) with 403', async () => {
    const kv = makeKV({ admin_session_viewer: JSON.stringify({ role: 'viewer', user: 'v' }) });
    const ctx = { request: makeRequest('put', { path: 'content/pages/x.json', content: 'eA==', message: 'x' }, 'viewer'), env: { ARCAMIS_CACHE: kv, GH_TOKEN: 'gh_test' } };
    const res = await onRequest(ctx);
    expect(res.status).toBe(403);
    const body = await toJSON(res);
    expect(body.error).toMatch(/Permessi insufficienti/);
  });

  it('blocks viewer role from delete with 403', async () => {
    const kv = makeKV({ admin_session_viewer: JSON.stringify({ role: 'viewer', user: 'v' }) });
    const ctx = { request: makeRequest('delete', { path: 'a.json', sha: 'abc', message: 'x' }, 'viewer'), env: { ARCAMIS_CACHE: kv, GH_TOKEN: 'gh_test' } };
    const res = await onRequest(ctx);
    expect(res.status).toBe(403);
  });

  it('blocks viewer role from commit_multi with 403', async () => {
    const kv = makeKV({ admin_session_viewer: JSON.stringify({ role: 'viewer', user: 'v' }) });
    const ctx = { request: makeRequest('commit_multi', { files: [{ path: 'a.json', content: 'eA==' }], message: 'x' }, 'viewer'), env: { ARCAMIS_CACHE: kv, GH_TOKEN: 'gh_test' } };
    const res = await onRequest(ctx);
    expect(res.status).toBe(403);
  });

  it('allows editor role to write (put) using the durable role gate', async () => {
    const kv = makeKV({ admin_session_editor: JSON.stringify({ role: 'editor', user: 'e' }) });
    global.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ content: {} }), { status: 200 }))
    );
    const ctx = { request: makeRequest('put', { path: 'content/pages/x.json', content: 'eA==', message: 'edit' }, 'editor'), env: { ARCAMIS_CACHE: kv, GH_TOKEN: 'gh_test' } };
    const res = await onRequest(ctx);
    expect(res.status).toBe(200);
    const args = global.fetch.mock.calls[0];
    expect(args[0]).toBe('https://api.github.com/repos/DarkLionMoon/Arcamis/contents/content/pages/x.json');
    expect(args[1].headers.Authorization).toBe('token gh_test');
  });

  it('allows admin write operations', async () => {
    const kv = makeKV({ admin_session_admin: sessionJSON() });
    const ctx = { request: makeRequest('put', { path: 'content/pages/x.json', content: 'eA==', message: 'edit' }, 'admin'), env: { ARCAMIS_CACHE: kv, GH_TOKEN: 'gh_test' } };
    const res = await onRequest(ctx);
    expect(res.status).toBe(200);
  });

  it('rejects path traversal on write for admin', async () => {
    const kv = makeKV({ admin_session_admin: sessionJSON() });
    const ctx = { request: makeRequest('put', { path: '../secret.json', content: 'eA==', message: 'x' }, 'admin'), env: { ARCAMIS_CACHE: kv, GH_TOKEN: 'gh_test' } };
    const res = await onRequest(ctx);
    expect(res.status).toBe(400);
    const body = await toJSON(res);
    expect(body.error).toMatch(/Path non valido/);
  });

  it('rejects absolute and backslash paths', async () => {
    for (const path of ['/etc/passwd', '..\\win', 'content\\..\\x']) {
      const kv = makeKV({ admin_session_admin: sessionJSON() });
      const ctx = { request: makeRequest('delete', { path, sha: 'a', message: 'x' }, 'admin'), env: { ARCAMIS_CACHE: kv, GH_TOKEN: 'gh_test' } };
      const res = await onRequest(ctx);
      expect(res.status).toBe(400);
    }
  });

  it('returns 501 when GH_TOKEN is not configured', async () => {
    const kv = makeKV({ admin_session_admin: sessionJSON() });
    const ctx = { request: makeRequest('get', { path: 'content/registry.json' }, 'admin'), env: { ARCAMIS_CACHE: kv, GH_TOKEN: '' } };
    const res = await onRequest(ctx);
    expect(res.status).toBe(501);
  });

  it('supports legacy "valid" sessions as admin', async () => {
    const kv = makeKV({ admin_session_old: 'valid' });
    const ctx = { request: makeRequest('put', { path: 'content/pages/x.json', content: 'eA==', message: 'x' }, 'old'), env: { ARCAMIS_CACHE: kv, GH_TOKEN: 'gh_test' } };
    const res = await onRequest(ctx);
    expect(res.status).toBe(200);
  });
});