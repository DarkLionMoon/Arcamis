export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const KV = env.ARCAMIS_CACHE;
  const ADMIN_SECRET = env.ADMIN_SECRET;
  const SESSION_TTL        = 86400;          /* 24 ore  (default) */
  const SESSION_TTL_LONG   = 90 * 86400;     /* 90 giorni (ricordami) */
  /* Hash SHA-256 della password locale hardcoded in admin/index.html
     (fallback documentato). Viene accettato anche se ADMIN_SECRET è
     configurato, così la vecchia password continua a funzionare e il
     login fallback ottiene una sessione server-side reale (necessaria
     per la gestione utenti in KV). */
  const FALLBACK_ADMIN_HASH = 'b0b9dd19ef971d0b25d73afa6c1b1a1a52aff81b4c6259e067aa305e187119f5';

  async function sha256hex(text) {
    const data = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

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
      if (!stored) return false;
      if (stored === 'valid') return true; // compatibilità con vecchie sessioni
      const session = JSON.parse(stored);
      return session && (session === true || session.role);
    } catch (e) { return false; }
  }

  /* ── Helper: ruolo della sessione corrente (o null) ── */
  async function sessionRole() {
    const token = getCookie('arc_admin');
    if (!token) return null;
    try {
      const stored = await KV.get('admin_session_' + token);
      if (!stored) return null;
      if (stored === 'valid') return 'admin';
      const session = JSON.parse(stored);
      return (session && session.role) || null;
    } catch (e) { return null; }
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

  /* ── Helper: rate limit per IP (brute force) ── */
  async function rateLimitReached() {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const key = 'rl_admin_login_' + ip;
    try {
      const raw = await KV.get(key);
      const count = raw ? parseInt(raw, 10) : 0;
      if (count >= 5) return true;
      await KV.put(key, String(count + 1), { expirationTtl: 15 * 60 });
    } catch (_) {}
    return false;
  }

  async function resetRateLimit() {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    try { await KV.delete('rl_admin_login_' + ip); } catch (_) {}
  }

  /* ════ LOGIN ════ */
  if (action === 'login' && request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch (e) {
      return new Response(JSON.stringify({ error: 'Body non valido' }), { status: 400, headers: cors });
    }
    if (await rateLimitReached()) {
      return new Response(JSON.stringify({ error: 'Troppi tentativi, riprova più tardi' }), { status: 429, headers: cors });
    }
    /* Supporta sia login con ADMIN_SECRET (single-user) che multi-user da KV */
    let ok = false, role = 'editor';
    if (body.password === ADMIN_SECRET) {
      ok = true; role = 'admin';
    } else {
      /* Multi-user: verifica utenti in KV */
      try {
        const usersRaw = await KV.get('admin_users');
        if (usersRaw) {
          const users = JSON.parse(usersRaw);
          const u = users.find(x => x.username === body.username);
          if (u) {
            const hash = await sha256hex(body.password);
            if (hash === u.passwordHash) {
              ok = true; role = u.role || 'editor';
            }
          }
        }
      } catch (_) {}
      /* Fallback: accetta la password locale hardcoded anche se
         ADMIN_SECRET è configurato, così la vecchia password continua
         a funzionare e la sessione server-side viene creata davvero. */
      if (!ok) {
        const hash = await sha256hex(body.password);
        if (hash === FALLBACK_ADMIN_HASH) {
          ok = true; role = 'admin';
        }
      }
    }
    if (!ok) {
      await new Promise(r => setTimeout(r, 800));
      return new Response(JSON.stringify({ error: 'Credenziali errate' }), { status: 401, headers: cors });
    }
    await resetRateLimit();

    /* Scegli TTL in base a "ricordami" */
    const remember = !!body.remember;
    const ttl = remember ? SESSION_TTL_LONG : SESSION_TTL;

    const token = genToken();
    await KV.put('admin_session_' + token, JSON.stringify({ role }), { expirationTtl: ttl });

    const cookieVal = 'arc_admin=' + token
      + '; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=' + ttl;

    return new Response(JSON.stringify({ ok: true, role }), {
      headers: { ...cors, 'Set-Cookie': cookieVal }
    });
  }

  /* ════ GET USERS (multi-user) ════ */
  if (action === 'get_users') {
    const authed = await checkSession();
    if (!authed) return new Response(JSON.stringify({ error: 'Non autenticato' }), { status: 401, headers: cors });
    try {
      const raw = await KV.get('admin_users');
      const users = raw ? JSON.parse(raw) : [];
      /* Non restituire gli hash delle password */
      const safeUsers = users.map(u => ({ username: u.username, role: u.role, created: u.created, updated: u.updated }));
      return new Response(JSON.stringify({ users: safeUsers }), { headers: cors });
    } catch (e) {
      return new Response(JSON.stringify({ users: [] }), { headers: cors });
    }
  }

  /* ════ SET USERS (multi-user) ════ */
  if (action === 'set_users' && request.method === 'POST') {
    const authed = await checkSession();
    if (!authed) return new Response(JSON.stringify({ error: 'Non autenticato' }), { status: 401, headers: cors });
    let body;
    try { body = await request.json(); } catch (e) {
      return new Response(JSON.stringify({ error: 'Body non valido' }), { status: 400, headers: cors });
    }
    if (!Array.isArray(body.users)) {
      return new Response(JSON.stringify({ error: 'users array richiesto' }), { status: 400, headers: cors });
    }
    /* Validazione base */
    for (const u of body.users) {
      if (!u.username || !u.role) return new Response(JSON.stringify({ error: 'username e role richiesti' }), { status: 400, headers: cors });
    }
    await KV.put('admin_users', JSON.stringify(body.users));
    return new Response(JSON.stringify({ ok: true }), { headers: cors });
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

  /* ════ STATO GITHUB TOKEN ════ */
  if (action === 'gh_token_status') {
    const stored = KV ? await KV.get('gh_token') : null;
    const configured = !!(env.GH_TOKEN || stored);
    return new Response(JSON.stringify({
      configured: configured,
      source: env.GH_TOKEN ? 'env' : (stored ? 'kv' : 'none'),
      canAdmin: (await sessionRole()) === 'admin'
    }), { headers: cors });
  }

  /* ════ CONFIGURA GITHUB TOKEN (solo admin) ════ */
  if (action === 'set_gh_token' && request.method === 'POST') {
    if ((await sessionRole()) !== 'admin') {
      return new Response(JSON.stringify({ error: 'Richiede ruolo admin' }), { status: 403, headers: cors });
    }
    let body;
    try { body = await request.json(); } catch (e) {
      return new Response(JSON.stringify({ error: 'Body non valido' }), { status: 400, headers: cors });
    }
    const ghToken = (body.token || '').trim();
    if (!ghToken) {
      return new Response(JSON.stringify({ error: 'token mancante' }), { status: 400, headers: cors });
    }
    await KV.put('gh_token', ghToken);
    await writeAdminLog('set_gh_token', 'gh_token', 'configurato');
    return new Response(JSON.stringify({ ok: true }), { headers: cors });
  }

  /* ════ GET LOG ════ */
  if (action === 'get_log') {
    const raw = await KV.get('admin_log', 'text');
    const entries = raw ? JSON.parse(raw) : [];
    return new Response(JSON.stringify({ entries }), { headers: cors });
  }

  /* ════ AUDIT LOG (scrittura da client admin) ════ */
  if (action === 'audit' && request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch (e) {
      return new Response(JSON.stringify({ error: 'Body non valido' }), { status: 400, headers: cors });
    }
    const { action: act, target, extra, user, role } = body;
    if (!act || !target) {
      return new Response(JSON.stringify({ error: 'action e target richiesti' }), { status: 400, headers: cors });
    }
    await writeAdminLog(act, target, extra ? JSON.stringify(extra) : '');
    return new Response(JSON.stringify({ ok: true }), { headers: cors });
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

}
