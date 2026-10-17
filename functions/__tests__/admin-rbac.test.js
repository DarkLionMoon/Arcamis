/*
  ARCAMIS — test della matrice di accesso di /api/admin

  Regola: ogni action che non è esplicitamente pubblica deve rispondere
  401 (o 403) quando la richiesta arriva senza cookie di sessione.
  Questo test esiste perché i guard sono riga per riga: un `if` dimenticato
  esponeva log di audit, bozze e analytics a chiunque.
*/
import { describe, expect, it, beforeAll } from 'vitest';

/* ── Stub minimale del KV di Cloudflare ── */
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

/* Action dichiarate pubbliche in functions/api/admin.js. */
const PUBLIC_ACTIONS = ['login', 'logout', 'check', 'get_csrf', 'track_view', 'get_covers', 'get_site_settings'];

/* Tutte le action gestite dal router dell'endpoint. */
const ALL_ACTIONS = [
  'login',
  'logout',
  'check',
  'get_csrf',
  'get_users',
  'set_users',
  'track_view',
  'get_covers',
  'get_site_settings',
  'set_site_settings',
  'gh_token_status',
  'set_gh_token',
  'get_log',
  'audit',
  'set_cover',
  'set_posa',
  'validate_page',
  'save_draft',
  'get_draft',
  'delete_draft',
  'list_drafts',
  'publish_draft',
  'set_webhook',
  'get_webhook',
  'test_webhook',
  'get_page_views',
  'get_analytics',
  'get_analytics_timeseries',
  'find_orphan_media',
  'delete_orphan_media',
  'scan_links',
  'trash_page',
  'list_trash',
  'restore_trash',
  'empty_trash',
  'backup_content',
  'get_diff',
  'save_version',
  'get_versions',
  'restore_version',
];

const POST_ACTIONS = new Set([
  'login',
  'logout',
  'set_users',
  'set_site_settings',
  'set_gh_token',
  'audit',
  'set_cover',
  'set_posa',
  'validate_page',
  'save_draft',
  'delete_draft',
  'publish_draft',
  'set_webhook',
  'test_webhook',
  'get_page_views',
  'delete_orphan_media',
  'trash_page',
  'restore_trash',
  'empty_trash',
  'get_diff',
  'save_version',
  'restore_version',
]);

let onRequest;

beforeAll(async () => {
  ({ onRequest } = await import('../api/admin.js'));
});

function call(action, { method = POST_ACTIONS.has(action) ? 'POST' : 'GET', cookie, csrf, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers['Cookie'] = cookie;
  if (csrf) headers['X-CSRF-Token'] = csrf;
  const init = { method, headers };
  if (method === 'POST') init.body = JSON.stringify(body ?? {});
  const request = new Request('https://arcamis.pages.dev/api/admin?action=' + action, init);
  const env = {
    ARCAMIS_CACHE: makeKV({
      ['admin_session_' + 'validtoken'.repeat(3)]: JSON.stringify({
        role: 'admin',
        user: 'brian',
        csrf: 'csrf-value',
      }),
    }),
    ADMIN_SECRET: 'super-secret',
  };
  return onRequest({ request, env });
}

describe('matrice di accesso di /api/admin', () => {
  it('copre tutte le action pubbliche dichiarate', () => {
    for (const action of PUBLIC_ACTIONS) {
      expect(ALL_ACTIONS, 'action pubblica non elencata: ' + action).toContain(action);
    }
  });

  it.each(ALL_ACTIONS.filter((a) => !PUBLIC_ACTIONS.includes(a)))(
    '%s richiede una sessione (401/403 senza cookie)',
    async (action) => {
      const res = await call(action);
      expect([401, 403], action + ' ha risposto ' + res.status).toContain(res.status);
    }
  );

  it.each(PUBLIC_ACTIONS)('%s viene gestita (non 404/500) senza sessione', async (action) => {
    const res = await call(action, { body: { pageKey: 'home' } });
    expect([404, 500], action + ' ha risposto ' + res.status).not.toContain(res.status);
  });

  it.each(['get_covers', 'get_site_settings', 'check'])('%s risponde 200 senza sessione', async (action) => {
    const res = await call(action, { method: action === 'check' ? 'GET' : 'GET' });
    expect(res.status).toBe(200);
  });
});

describe('identità nei log di audit', () => {
  it('usa utente e ruolo della sessione, non quelli inviati dal client', async () => {
    const kv = makeKV({
      ['admin_session_' + 'validtoken'.repeat(3)]: JSON.stringify({
        role: 'editor',
        user: 'editor-user',
        csrf: 'csrf-value',
      }),
    });
    const request = new Request('https://arcamis.pages.dev/api/admin?action=audit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'arc_admin=' + 'validtoken'.repeat(3),
        'X-CSRF-Token': 'csrf-value',
      },
      body: JSON.stringify({
        action: 'save_page',
        target: 'pag-x',
        extra: {},
        user: 'admin-falso',
        role: 'admin',
      }),
    });
    const res = await onRequest({ request, env: { ARCAMIS_CACHE: kv, ADMIN_SECRET: 's' } });
    expect(res.status).toBe(200);

    const logged = JSON.parse(await kv.get('admin_log'));
    expect(logged).toHaveLength(1);
    expect(logged[0].user).toBe('editor-user');
    expect(logged[0].user).not.toBe('admin-falso');
  });
});

describe('scritture senza token CSRF', () => {
  it('rifiuta set_site_settings con sessione valida ma senza CSRF', async () => {
    const res = await call('set_site_settings', {
      cookie: 'arc_admin=' + 'validtoken'.repeat(3),
      body: { settings: {} },
    });
    expect(res.status).toBe(403);
  });

  it('accetta set_site_settings con sessione e CSRF corretti', async () => {
    const res = await call('set_site_settings', {
      cookie: 'arc_admin=' + 'validtoken'.repeat(3),
      csrf: 'csrf-value',
      body: { settings: { banner_enabled: false } },
    });
    expect(res.status).toBe(200);
  });
});
