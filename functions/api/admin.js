export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const KV = env.ARCAMIS_CACHE;
  const ADMIN_SECRET = env.ADMIN_SECRET;
  const SESSION_TTL        = 86400;          /* 24 ore  (default) */
  const SESSION_TTL_LONG   = 90 * 86400;     /* 90 giorni (ricordami) */

  const cors = {
    'Access-Control-Allow-Origin': url.origin,
    'Content-Type': 'application/json',
    'Vary': 'Cookie'
  };

  /* ── CORS preflight ── */
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }

  /* ── Helper: legge cookie ── */
  function getCookie(name) {
    const header = request.headers.get('Cookie') || '';
    const match = header.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  /* ── Helper: verifica sessione ── */
  async function checkSession() {
    const token = getCookie('arc_admin');
    if (!token) return false;
    try {
      const stored = await KV.get('admin_session_' + token);
      return stored === 'valid';
    } catch (e) { return false; }
  }

  /* ── Helper: genera token casuale ── */
  function genToken() {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /* ── Helper: scrivi log entry ── */
  async function writeAdminLog(action, target, extra) {
    try {
      const LOG_KEY = 'admin_log';
      const MAX_ENTRIES = 50;
      let existing = [];
      try {
        const raw = await KV.get(LOG_KEY, 'text');
        if (raw) existing = JSON.parse(raw);
      } catch(_) {}
      existing.unshift({
        action:    action,
        target:    target || '',
        extra:     extra  || '',
        timestamp: new Date().toISOString()
      });
      existing = existing.slice(0, MAX_ENTRIES);
      await KV.put(LOG_KEY, JSON.stringify(existing), { expirationTtl: 30 * 24 * 3600 });
    } catch(_) {}
  }

  /* ════ LOGIN ════ */
  if (action === 'login' && request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch (e) {
      return new Response(JSON.stringify({ error: 'Body non valido' }), { status: 400, headers: cors });
    }
    if (!body.password || body.password !== ADMIN_SECRET) {
      await new Promise(r => setTimeout(r, 800));
      return new Response(JSON.stringify({ error: 'Password errata' }), { status: 401, headers: cors });
    }

    /* Scegli TTL in base a "ricordami" */
    const remember = !!body.remember;
    const ttl = remember ? SESSION_TTL_LONG : SESSION_TTL;

    const token = genToken();
    await KV.put('admin_session_' + token, 'valid', { expirationTtl: ttl });

    const cookieVal = 'arc_admin=' + token
      + '; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=' + ttl;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, 'Set-Cookie': cookieVal }
    });
  }

  /* ════ LOGOUT ════ */
  if (action === 'logout' && request.method === 'POST') {
    const token = getCookie('arc_admin');
    if (token) {
      try { await KV.delete('admin_session_' + token); } catch (e) {}
    }
    const clearCookie = 'arc_admin=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0';
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, 'Set-Cookie': clearCookie }
    });
  }

  /* ════ CHECK SESSIONE ════ */
  if (action === 'check') {
    const ok = await checkSession();
    return new Response(JSON.stringify({ ok }), { headers: cors });
  }

  /* ════ LEGGI TUTTE LE COVER ADMIN — pubblica ════ */
  if (action === 'get_covers') {
    try {
      const list = await KV.list({ prefix: 'admin_cover_' });
      const covers = {};
      await Promise.all(list.keys.map(async function(k) {
        const pageId = k.name.replace('admin_cover_', '');
        covers[pageId] = await KV.get(k.name);
      }));
      return new Response(JSON.stringify({ covers }), { headers: cors });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
    }
  }

  /* ── Da qui in poi richiede sessione valida ── */
  const authed = await checkSession();
  if (!authed) {
    return new Response(JSON.stringify({ error: 'Non autenticato' }), { status: 401, headers: cors });
  }

  /* ════ GET LOG ════ */
  if (action === 'get_log') {
    const raw = await KV.get('admin_log', 'text');
    const entries = raw ? JSON.parse(raw) : [];
    return new Response(JSON.stringify({ entries }), { headers: cors });
  }

  /* ════ SALVA COVER ════ */
  if (action === 'set_cover' && request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch (e) {
      return new Response(JSON.stringify({ error: 'Body non valido' }), { status: 400, headers: cors });
    }
    const { pageId, coverUrl } = body;
    if (!pageId) {
      return new Response(JSON.stringify({ error: 'pageId mancante' }), { status: 400, headers: cors });
    }
    const key = 'admin_cover_' + pageId.replace(/-/g, '');
    if (!coverUrl) {
      await KV.delete(key);
    } else {
      await KV.put(key, coverUrl);
    }
    try { await KV.delete('gallery_pg_v2'); } catch (e) {}
    await writeAdminLog('cover_page', pageId);
    return new Response(JSON.stringify({ ok: true }), { headers: cors });
  }
}
/* ════ SALVA POSA ════ */
if (action === 'set_posa' && request.method === 'POST') {
  let body;
  try { body = await request.json(); } catch (e) {
    return new Response(JSON.stringify({ error: 'Body non valido' }), { status: 400, headers: cors });
  }
  const { pageId, posaUrl } = body;
  if (!pageId) {
    return new Response(JSON.stringify({ error: 'pageId mancante' }), { status: 400, headers: cors });
  }
  const key = 'admin_posa_' + pageId.replace(/-/g, '');
  if (!posaUrl) {
    await KV.delete(key);
  } else {
    await KV.put(key, posaUrl);
  }
  await writeAdminLog('posa_page', pageId);
  return new Response(JSON.stringify({ ok: true }), { headers: cors });
}
