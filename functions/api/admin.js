export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const KV = env.ARCAMIS_CACHE;
  const ADMIN_SECRET = env.ADMIN_SECRET;
   const SESSION_TTL        = 86400;          /* 24 ore  (default) */
  const SESSION_TTL_LONG   = 90 * 86400;     /* 90 giorni (ricordami) */

  async function sha256hex(text) {
    const data = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /* Password hashing con salt casuale (PBKDF2-SHA256) */
  async function hashPassword(password, existingSalt) {
    const salt = existingSalt || (() => {
      const arr = new Uint8Array(16);
      crypto.getRandomValues(arr);
      return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    })();
    const data = new TextEncoder().encode(password + salt);
    const keyMaterial = await crypto.subtle.importKey(
      'raw', data, { name: 'PBKDF2' }, false, ['deriveBits']
    );
    const derivedBits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' },
      keyMaterial, 256
    );
    const hash = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
    return { hash, salt };
  }

  async function verifyPassword(password, storedHash, salt) {
    const { hash } = await hashPassword(password, salt);
    // Constant-time comparison to prevent timing attacks
    if (hash.length !== storedHash.length) return false;
    let result = 0;
    for (let i = 0; i < hash.length; i++) {
      result |= hash.charCodeAt(i) ^ storedHash.charCodeAt(i);
    }
    return result === 0;
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

  /* ── Helper: utente della sessione corrente ── */
  async function sessionUser() {
    const token = getCookie('arc_admin');
    if (!token) return null;
    try {
      const stored = await KV.get('admin_session_' + token);
      if (!stored) return null;
      if (stored === 'valid') return 'admin';
      const session = JSON.parse(stored);
      return (session && session.user) || 'admin';
    } catch (e) { return null; }
  }

  /* ── Helper: genera token casuale ── */
  function genToken() {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /* ── Helper: scrivi log entry ── */
  async function writeAdminLog(action, target, extra, user) {
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
        user:      user   || '',
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

  /* ── Helper: ottieni session token dal cookie ── */
  function getSessionToken() {
    return getCookie('arc_admin');
  }

  /* ── Helper: verifica CSRF token ── */
  async function verifyCsrf(req) {
    const sessionToken = getSessionToken();
    if (!sessionToken) return false;
    const csrfHeader = req.headers.get('X-CSRF-Token');
    if (!csrfHeader) return false;
    try {
      const stored = await KV.get('admin_session_' + sessionToken);
      if (!stored || stored === 'valid') return false;
      const session = JSON.parse(stored);
      return session && session.csrf === csrfHeader;
    } catch (e) { return false; }
  }

  /* ── Helper: rate limit generico per action ── */
  async function genericRateLimit(action, maxRequests, windowSec) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const key = 'rl_' + action + '_' + ip;
    try {
      const raw = await KV.get(key);
      const count = raw ? parseInt(raw, 10) : 0;
      if (count >= maxRequests) return true;
      await KV.put(key, String(count + 1), { expirationTtl: windowSec });
    } catch (_) {}
    return false;
  }

  /* ── Helper: notifica webhook Discord (fire & forget) ── */
  async function notifyWebhook(message) {
    try {
      const webhookUrl = await KV.get('webhook_url');
      if (!webhookUrl) return;
      const whEnabled = await KV.get('webhook_enabled');
      if (whEnabled === '0') return;
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{ description: message, color: 14336744 }]
        })
      });
    } catch (_) {}
  }

  /* ── Helper: ottieni GitHub token ── */
  async function getGhToken() {
    if (env.GH_TOKEN) return env.GH_TOKEN;
    try {
      const stored = await KV.get('gh_token');
      if (stored) return stored;
    } catch (_) {}
    return null;
  }

  /* ── Helper: simple line-by-line diff ── */
  function simpleDiff(oldText, newText) {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const diff = [];
    const maxLen = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < maxLen; i++) {
      if (i >= oldLines.length) {
        diff.push('+ ' + newLines[i]);
      } else if (i >= newLines.length) {
        diff.push('- ' + oldLines[i]);
      } else if (oldLines[i] !== newLines[i]) {
        diff.push('- ' + oldLines[i]);
        diff.push('+ ' + newLines[i]);
      }
    }
    return diff.join('\n');
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
      /* Multi-user: verifica utenti in KV con PBKDF2 salted */
      try {
        const usersRaw = await KV.get('admin_users');
        if (usersRaw) {
          const users = JSON.parse(usersRaw);
          const u = users.find(x => x.username === body.username);
          if (u) {
            /* Supporta sia il vecchio hash SHA-256 (legacy) che il nuovo PBKDF2 salted */
            if (u.salt && u.passwordHash) {
              const valid = await verifyPassword(body.password, u.passwordHash, u.salt);
              if (valid) { ok = true; role = u.role || 'editor'; }
            } else if (u.passwordHash) {
              /* Legacy: SHA-256 senza salt (backward compat) */
              const hash = await sha256hex(body.password);
              /* Constant-time comparison to prevent timing attacks */
              let legacyMatch = false;
              if (hash.length === u.passwordHash.length) {
                let result = 0;
                for (let i = 0; i < hash.length; i++) {
                  result |= hash.charCodeAt(i) ^ u.passwordHash.charCodeAt(i);
                }
                legacyMatch = result === 0;
              }
              if (legacyMatch) {
                ok = true; role = u.role || 'editor';
                /* Migra automaticamente al nuovo formato PBKDF2 salted */
                const { hash: newHash, salt } = await hashPassword(body.password);
                u.passwordHash = newHash;
                u.salt = salt;
                try {
                  const updatedUsersRaw = await KV.get('admin_users');
                  if (updatedUsersRaw) {
                    const updatedUsers = JSON.parse(updatedUsersRaw);
                    const idx = updatedUsers.findIndex(x => x.username === body.username);
                    if (idx !== -1) {
                      updatedUsers[idx].passwordHash = newHash;
                      updatedUsers[idx].salt = salt;
                      await KV.put('admin_users', JSON.stringify(updatedUsers));
                    }
                  }
                } catch (_) {}
              }
            }
          }
        }
      } catch (_) {}
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
    const csrfToken = genToken();
    await KV.put('admin_session_' + token, JSON.stringify({ role, user: body.username || 'admin', csrf: csrfToken }), { expirationTtl: ttl });

    const cookieVal = 'arc_admin=' + token
      + '; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=' + ttl;

    return new Response(JSON.stringify({ ok: true, role, csrf: csrfToken }), {
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
    const role = await sessionRole();
    if (role !== 'admin') return new Response(JSON.stringify({ error: 'Solo admin possono gestire gli utenti' }), { status: 403, headers: cors });
    const csrfOk = await verifyCsrf(request);
    if (!csrfOk) return new Response(JSON.stringify({ error: 'CSRF token non valido' }), { status: 403, headers: cors });
    if (await genericRateLimit('set_users', 3, 300)) {
      return new Response(JSON.stringify({ error: 'Troppe richieste, riprova più tardi' }), { status: 429, headers: cors });
    }
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
    await writeAdminLog('set_users', 'admin_users', 'aggiornati ' + body.users.length + ' utenti', await sessionUser());
    notifyWebhook('👥 Utenti aggiornati da ' + (await sessionUser()) + ': ' + body.users.length + ' utenti');
    return new Response(JSON.stringify({ ok: true }), { headers: cors });
  }

  /* ════ LOGOUT ════ */
  if (action === 'logout' && request.method === 'POST') {
    const csrfOk = await verifyCsrf(request);
    if (!csrfOk) return new Response(JSON.stringify({ error: 'CSRF token non valido' }), { status: 403, headers: cors });
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

  /* ════ SITE SETTINGS — scrittura admin (merge) ════ */
  if (action === 'set_site_settings' && request.method === 'POST') {
    if ((await sessionRole()) !== 'admin') {
      return new Response(JSON.stringify({ error: 'Solo admin' }), { status: 403, headers: cors });
    }
    const csrfOk = await verifyCsrf(request);
    if (!csrfOk) return new Response(JSON.stringify({ error: 'CSRF token non valido' }), { status: 403, headers: cors });
    if (await genericRateLimit('set_site_settings', 5, 60)) {
      return new Response(JSON.stringify({ error: 'Troppe richieste, riprova più tardi' }), { status: 429, headers: cors });
    }
    let body;
    try { body = await request.json(); } catch (e) {
      return new Response(JSON.stringify({ error: 'Body non valido' }), { status: 400, headers: cors });
    }
    let existing = {};
    try {
      const raw = await KV.get('site_settings');
      if (raw) existing = JSON.parse(raw);
    } catch (e) {}
    const merged = Object.assign(existing, body.settings || {});
    await KV.put('site_settings', JSON.stringify(merged));
    await writeAdminLog('set_site_settings', 'site_settings', JSON.stringify(body.settings));
    notifyWebhook('⚙️ Impostazioni sito aggiornate da ' + (await sessionUser()));
    return new Response(JSON.stringify({ ok: true }), { headers: cors });
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

  /* ════ SITE SETTINGS — lettura pubblica ════ */
  if (action === 'get_site_settings') {
    try {
      const raw = await KV.get('site_settings');
      const settings = raw ? JSON.parse(raw) : {};
      return new Response(JSON.stringify({ settings }), { headers: cors });
    } catch (e) {
      return new Response(JSON.stringify({ settings: {} }), { headers: cors });
    }
  }

  /* ════ TRACK VIEW — pubblico: registra le visualizzazioni dei visitatori ════ */
  if (action === 'track_view' && request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch (e) {
      return new Response(JSON.stringify({ error: 'Body non valido' }), { status: 400, headers: cors });
    }
    const pageKey = String(body.pageKey || '').slice(0, 120);
    if (!pageKey || !/^[a-z0-9-]+$/i.test(pageKey)) {
      return new Response(JSON.stringify({ error: 'pageKey mancante o non valida' }), { status: 400, headers: cors });
    }
    if (await genericRateLimit('track_view', 60, 60)) {
      return new Response(JSON.stringify({ error: 'Troppe richieste' }), { status: 429, headers: cors });
    }
    try {
      const raw = await KV.get('views_' + pageKey);
      const count = raw ? parseInt(raw, 10) + 1 : 1;
      await KV.put('views_' + pageKey, String(count));
      const rawTotal = await KV.get('views_total');
      const totalCount = rawTotal ? parseInt(rawTotal, 10) + 1 : 1;
      await KV.put('views_total', String(totalCount));
      // Time series: store daily count
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const dailyKey = 'views_' + pageKey + '_' + today;
      const rawDaily = await KV.get(dailyKey);
      const dailyCount = rawDaily ? parseInt(rawDaily, 10) + 1 : 1;
      await KV.put(dailyKey, String(dailyCount));
      // Also store daily total
      const dailyTotalKey = 'views_total_' + today;
      const rawDailyTotal = await KV.get(dailyTotalKey);
      const dailyTotal = rawDailyTotal ? parseInt(rawDailyTotal, 10) + 1 : 1;
      await KV.put(dailyTotalKey, String(dailyTotal));
      return new Response(JSON.stringify({ ok: true, views: count, total: totalCount }), { headers: cors });
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
    const csrfOk = await verifyCsrf(request);
    if (!csrfOk) return new Response(JSON.stringify({ error: 'CSRF token non valido' }), { status: 403, headers: cors });
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
    let entries = [];
    try {
      const raw = await KV.get('admin_log', 'text');
      entries = raw ? JSON.parse(raw) : [];
    } catch (e) {}
    /* gli editor vedono il registro senza i nomi utente */
    if ((await sessionRole()) !== 'admin') {
      entries = entries.map(function(e2) { const c = Object.assign({}, e2); delete c.user; return c; });
    }
    return new Response(JSON.stringify({ entries }), { headers: cors });
  }

  /* ════ AUDIT LOG (scrittura da client admin) ════ */
  if (action === 'audit' && request.method === 'POST') {
    const csrfOk = await verifyCsrf(request);
    if (!csrfOk) return new Response(JSON.stringify({ error: 'CSRF token non valido' }), { status: 403, headers: cors });
    if (await genericRateLimit('audit', 20, 60)) {
      return new Response(JSON.stringify({ error: 'Troppe richieste, riprova più tardi' }), { status: 429, headers: cors });
    }
    let body;
    try { body = await request.json(); } catch (e) {
      return new Response(JSON.stringify({ error: 'Body non valido' }), { status: 400, headers: cors });
    }
    const { action: act, target, extra } = body;
    if (!act || !target) {
      return new Response(JSON.stringify({ error: 'action e target richiesti' }), { status: 400, headers: cors });
    }
    const sessUser = await sessionUser();
    await writeAdminLog(act, target, extra ? JSON.stringify(extra) : '', sessUser);
    return new Response(JSON.stringify({ ok: true }), { headers: cors });
  }

  /* ════ SALVA COVER ════ */
  if (action === 'set_cover' && request.method === 'POST') {
    const csrfOk = await verifyCsrf(request);
    if (!csrfOk) return new Response(JSON.stringify({ error: 'CSRF token non valido' }), { status: 403, headers: cors });
    if (await genericRateLimit('set_cover', 10, 60)) {
      return new Response(JSON.stringify({ error: 'Troppe richieste, riprova più tardi' }), { status: 429, headers: cors });
    }
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
    notifyWebhook('🖼️ Cover aggiornata per pagina `' + pageId + '` da ' + (await sessionUser()));
    return new Response(JSON.stringify({ ok: true }), { headers: cors });
  }
  /* ════ SALVA POSA ════ */
if (action === 'set_posa' && request.method === 'POST') {
  const csrfOk = await verifyCsrf(request);
  if (!csrfOk) return new Response(JSON.stringify({ error: 'CSRF token non valido' }), { status: 403, headers: cors });
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

  /* ════ GET CSRF TOKEN ════ */
  if (action === 'get_csrf') {
    const sessionToken = getSessionToken();
    if (!sessionToken) return new Response(JSON.stringify({ error: 'Non autenticato' }), { status: 401, headers: cors });
    try {
      const stored = await KV.get('admin_session_' + sessionToken);
      if (!stored || stored === 'valid') return new Response(JSON.stringify({ error: 'Sessione non valida' }), { status: 401, headers: cors });
      const session = JSON.parse(stored);
      return new Response(JSON.stringify({ csrf: session.csrf || null }), { headers: cors });
    } catch (e) {
      return new Response(JSON.stringify({ csrf: null }), { headers: cors });
    }
  }

  /* ════ VALIDATE PAGE ════ */
  if (action === 'validate_page' && request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch (e) {
      return new Response(JSON.stringify({ error: 'Body non valido' }), { status: 400, headers: cors });
    }
    const errors = [];
    if (!body.k || typeof body.k !== 'string' || !/^[a-z0-9-]+$/.test(body.k)) {
      errors.push('k deve essere una stringa che corrisponde al pattern ^[a-z0-9-]+$');
    }
    if (!body.title || typeof body.title !== 'string' || body.title.length < 1) {
      errors.push('title è obbligatorio e deve essere una stringa con almeno 1 carattere');
    }
    if (!body.content || typeof body.content !== 'string') {
      errors.push('content è obbligatorio e deve essere una stringa');
    }
    const allowedLayouts = ['default', 'wide', 'full', 'sidebar', 'hero'];
    if (!body.layout || typeof body.layout !== 'string' || !allowedLayouts.includes(body.layout)) {
      errors.push('layout deve essere uno tra: ' + allowedLayouts.join(', '));
    }
    if (errors.length > 0) {
      return new Response(JSON.stringify({ valid: false, errors }), { headers: cors });
    }
    return new Response(JSON.stringify({ valid: true }), { headers: cors });
  }

  /* ════ SAVE DRAFT ════ */
  if (action === 'save_draft' && request.method === 'POST') {
    const csrfOk = await verifyCsrf(request);
    if (!csrfOk) return new Response(JSON.stringify({ error: 'CSRF token non valido' }), { status: 403, headers: cors });
    let body;
    try { body = await request.json(); } catch (e) {
      return new Response(JSON.stringify({ error: 'Body non valido' }), { status: 400, headers: cors });
    }
    const { pageKey, content, title, icon, layout } = body;
    if (!pageKey) {
      return new Response(JSON.stringify({ error: 'pageKey mancante' }), { status: 400, headers: cors });
    }
    const draft = {
      content: content || '',
      title: title || '',
      icon: icon || '',
      layout: layout || 'default',
      savedAt: new Date().toISOString(),
      user: await sessionUser()
    };
    await KV.put('draft_' + pageKey, JSON.stringify(draft));
    return new Response(JSON.stringify({ ok: true }), { headers: cors });
  }

  /* ════ GET DRAFT ════ */
  if (action === 'get_draft') {
    const url2 = new URL(request.url);
    const pageKey = url2.searchParams.get('pageKey');
    if (!pageKey) {
      return new Response(JSON.stringify({ error: 'pageKey mancante' }), { status: 400, headers: cors });
    }
    const raw = await KV.get('draft_' + pageKey);
    if (!raw) {
      return new Response(JSON.stringify({ draft: null }), { headers: cors });
    }
    return new Response(JSON.stringify({ draft: JSON.parse(raw) }), { headers: cors });
  }

  /* ════ DELETE DRAFT ════ */
  if (action === 'delete_draft' && request.method === 'POST') {
    const csrfOk = await verifyCsrf(request);
    if (!csrfOk) return new Response(JSON.stringify({ error: 'CSRF token non valido' }), { status: 403, headers: cors });
    let body;
    try { body = await request.json(); } catch (e) {
      return new Response(JSON.stringify({ error: 'Body non valido' }), { status: 400, headers: cors });
    }
    const { pageKey } = body;
    if (!pageKey) {
      return new Response(JSON.stringify({ error: 'pageKey mancante' }), { status: 400, headers: cors });
    }
    await KV.delete('draft_' + pageKey);
    return new Response(JSON.stringify({ ok: true }), { headers: cors });
  }

  /* ════ LIST DRAFTS ════ */
  if (action === 'list_drafts') {
    const list = await KV.list({ prefix: 'draft_' });
    const drafts = [];
    for (const key of list.keys) {
      const pageKey = key.name.replace('draft_', '');
      const raw = await KV.get(key.name);
      if (raw) {
        const draft = JSON.parse(raw);
        drafts.push({ pageKey, savedAt: draft.savedAt, user: draft.user, title: draft.title });
      }
    }
    return new Response(JSON.stringify({ drafts }), { headers: cors });
  }

  /* ════ PUBLISH DRAFT ════ */
  if (action === 'publish_draft' && request.method === 'POST') {
    const csrfOk = await verifyCsrf(request);
    if (!csrfOk) return new Response(JSON.stringify({ error: 'CSRF token non valido' }), { status: 403, headers: cors });
    const sessRole = await sessionRole();
    if (sessRole !== 'admin') {
      return new Response(JSON.stringify({ error: 'Solo admin possono pubblicare' }), { status: 403, headers: cors });
    }
    let body;
    try { body = await request.json(); } catch (e) {
      return new Response(JSON.stringify({ error: 'Body non valido' }), { status: 400, headers: cors });
    }
    const { pageKey } = body;
    if (!pageKey) {
      return new Response(JSON.stringify({ error: 'pageKey mancante' }), { status: 400, headers: cors });
    }
    const draftRaw = await KV.get('draft_' + pageKey);
    if (!draftRaw) {
      return new Response(JSON.stringify({ error: 'Draft non trovato' }), { status: 404, headers: cors });
    }
    const draft = JSON.parse(draftRaw);
    const ghToken = await getGhToken();
    if (!ghToken) {
      return new Response(JSON.stringify({ error: 'GH_TOKEN non configurato' }), { status: 501, headers: cors });
    }
    const GH_REPO = env.GH_REPO || 'DarkLionMoon/Arcamis';
    const GH_BRANCH = env.GH_BRANCH || 'main';
    const apiBase = 'https://api.github.com/repos/' + GH_REPO;
    const ghHeaders = {
      'Authorization': 'token ' + ghToken,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'ArcamisAdmin'
    };
    const filePath = 'content/pages/' + pageKey + '.json';
    const pageData = {
      title: draft.title,
      content: draft.content,
      icon: draft.icon,
      layout: draft.layout
    };
    const fileContent = btoa(unescape(encodeURIComponent(JSON.stringify(pageData, null, 2))));
    try {
      let existingSha = null;
      try {
        const getRes = await fetch(apiBase + '/contents/' + filePath + '?ref=' + GH_BRANCH, { headers: ghHeaders });
        if (getRes.ok) {
          const existing = await getRes.json();
          existingSha = existing.sha;
        }
      } catch (_) {}
      const putBody = { message: 'Aggiorna pagina ' + pageKey + ' (da bozza)', branch: GH_BRANCH, content: fileContent };
      if (existingSha) putBody.sha = existingSha;
      const putRes = await fetch(apiBase + '/contents/' + filePath, {
        method: 'PUT', headers: ghHeaders, body: JSON.stringify(putBody)
      });
      if (!putRes.ok) {
        let errMsg = 'GitHub ' + putRes.status;
        try { const j = await putRes.json(); if (j.message) errMsg = j.message; } catch (_) {}
        return new Response(JSON.stringify({ error: errMsg }), { status: 502, headers: cors });
      }
      await KV.delete('draft_' + pageKey);
      await writeAdminLog('publish_draft', pageKey, 'bozza pubblicata', await sessionUser());
      notifyWebhook('🚀 Pagina `' + pageKey + '` pubblicata da ' + (await sessionUser()));
      return new Response(JSON.stringify({ ok: true }), { headers: cors });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
    }
  }

  /* ════ SET WEBHOOK ════ */
  if (action === 'set_webhook' && request.method === 'POST') {
    const sessRole = await sessionRole();
    if (sessRole !== 'admin') {
      return new Response(JSON.stringify({ error: 'Solo admin' }), { status: 403, headers: cors });
    }
    const csrfOk = await verifyCsrf(request);
    if (!csrfOk) return new Response(JSON.stringify({ error: 'CSRF token non valido' }), { status: 403, headers: cors });
    let body;
    try { body = await request.json(); } catch (e) {
      return new Response(JSON.stringify({ error: 'Body non valido' }), { status: 400, headers: cors });
    }
    const { webhookUrl, enabled } = body;
    if (!webhookUrl) {
      return new Response(JSON.stringify({ error: 'webhookUrl mancante' }), { status: 400, headers: cors });
    }
    await KV.put('webhook_url', webhookUrl);
    await KV.put('webhook_enabled', enabled === false ? '0' : '1');
    await writeAdminLog('set_webhook', 'webhook_url', 'webhook configurato', await sessionUser());
    return new Response(JSON.stringify({ ok: true }), { headers: cors });
  }

  /* ════ GET WEBHOOK ════ */
  if (action === 'get_webhook') {
    const sessRole = await sessionRole();
    if (sessRole !== 'admin') {
      return new Response(JSON.stringify({ error: 'Solo admin' }), { status: 403, headers: cors });
    }
    const url2 = await KV.get('webhook_url');
    const whEnabled = await KV.get('webhook_enabled');
    return new Response(JSON.stringify({ configured: !!url2, enabled: whEnabled !== '0', url: url2 || '' }), { headers: cors });
  }

  /* ════ TEST WEBHOOK ════ */
  if (action === 'test_webhook' && request.method === 'POST') {
    const sessRole = await sessionRole();
    if (sessRole !== 'admin') {
      return new Response(JSON.stringify({ error: 'Solo admin' }), { status: 403, headers: cors });
    }
    const csrfOk = await verifyCsrf(request);
    if (!csrfOk) return new Response(JSON.stringify({ error: 'CSRF token non valido' }), { status: 403, headers: cors });
    const webhookUrl = await KV.get('webhook_url');
    if (!webhookUrl) {
      return new Response(JSON.stringify({ error: 'Webhook non configurato' }), { status: 400, headers: cors });
    }
    const whEnabled = await KV.get('webhook_enabled');
    if (whEnabled === '0') {
      return new Response(JSON.stringify({ error: 'Webhook disabilitato' }), { status: 400, headers: cors });
    }
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{ description: '✅ Test webhook da ARCAMIS Admin — ' + new Date().toISOString(), color: 14336744 }]
        })
      });
      if (!res.ok) {
        return new Response(JSON.stringify({ error: 'Webhook fallito: ' + res.status }), { status: 502, headers: cors });
      }
      return new Response(JSON.stringify({ ok: true }), { headers: cors });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
    }
  }

  /* ════ GET PAGE VIEWS ════ */
  if (action === 'get_page_views' && request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch (e) {
      return new Response(JSON.stringify({ error: 'Body non valido' }), { status: 400, headers: cors });
    }
    const { pageKey } = body;
    if (!pageKey) {
      return new Response(JSON.stringify({ error: 'pageKey mancante' }), { status: 400, headers: cors });
    }
    const raw = await KV.get('views_' + pageKey);
    return new Response(JSON.stringify({ pageKey, views: raw ? parseInt(raw, 10) : 0 }), { headers: cors });
  }

  /* ════ GET ANALYTICS ════ */
  if (action === 'get_analytics') {
    const list = await KV.list({ prefix: 'views_' });
    const pages = [];
    for (const key of list.keys) {
      if (key.name === 'views_total') continue;
      const raw = await KV.get(key.name);
      if (raw) {
        pages.push({ pageKey: key.name.replace('views_', ''), views: parseInt(raw, 10) || 0 });
      }
    }
    pages.sort((a, b) => b.views - a.views);
    const rawTotal = await KV.get('views_total');
    return new Response(JSON.stringify({ total: rawTotal ? parseInt(rawTotal, 10) : 0, pages }), { headers: cors });
  }

  /* ════ TIME SERIES ANALYTICS ════ */
  if (action === 'get_analytics_timeseries') {
    const days = parseInt(url.searchParams.get('days') || '30', 10);
    const limit = Math.min(Math.max(days, 1), 90);
    const series = [];
    const now = new Date();
    for (let i = limit - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const raw = await KV.get('views_total_' + dateStr);
      series.push({ date: dateStr, views: raw ? parseInt(raw, 10) : 0 });
    }
    return new Response(JSON.stringify({ series, days: limit }), { headers: cors });
  }

  /* ════ FIND ORPHAN MEDIA ════ */
  if (action === 'find_orphan_media') {
    const sessRole = await sessionRole();
    if (sessRole !== 'admin') {
      return new Response(JSON.stringify({ error: 'Solo admin' }), { status: 403, headers: cors });
    }
    const ghToken = await getGhToken();
    if (!ghToken) {
      return new Response(JSON.stringify({ error: 'GH_TOKEN non configurato' }), { status: 501, headers: cors });
    }
    const GH_REPO = env.GH_REPO || 'DarkLionMoon/Arcamis';
    const GH_BRANCH = env.GH_BRANCH || 'main';
    const apiBase = 'https://api.github.com/repos/' + GH_REPO;
    const ghHeaders = {
      'Authorization': 'token ' + ghToken,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'ArcamisAdmin'
    };
    try {
      /* 1. Get all images */
      const imgRes = await fetch(apiBase + '/contents/images?ref=' + GH_BRANCH, { headers: ghHeaders });
      if (!imgRes.ok) return new Response(JSON.stringify({ error: 'Impossibile elencare immagini' }), { status: 502, headers: cors });
      const imgFiles = (await imgRes.json()).filter(f => f.type === 'file').map(f => f.name);

      /* 2. Get all page content to search for references */
      const pagesRes = await fetch(apiBase + '/contents/content/pages?ref=' + GH_BRANCH, { headers: ghHeaders });
      const pageFiles = pagesRes.ok ? (await pagesRes.json()).filter(f => f.type === 'file' && f.name.endsWith('.json')) : [];

      let allContent = '';
      for (const pf of pageFiles) {
        try {
          const cr = await fetch(apiBase + '/contents/content/pages/' + pf.name + '?ref=' + GH_BRANCH, { headers: ghHeaders });
          if (cr.ok) {
            const cd = await cr.json();
            allContent += decodeURIComponent(escape(atob(cd.content))) + ' ';
          }
        } catch (_) {}
      }

      /* Also check index.html and other files */
      const otherFiles = ['index.html', 'admin/index.html', 'scripts/js/data.js'];
      for (const of2 of otherFiles) {
        try {
          const cr = await fetch(apiBase + '/contents/' + of2 + '?ref=' + GH_BRANCH, { headers: ghHeaders });
          if (cr.ok) {
            const cd = await cr.json();
            allContent += decodeURIComponent(escape(atob(cd.content))) + ' ';
          }
        } catch (_) {}
      }

      /* 3. Find orphans */
      const orphans = imgFiles.filter(name => !allContent.includes(name));

      return new Response(JSON.stringify({ 
        total: imgFiles.length, 
        orphans, 
        referenced: imgFiles.length - orphans.length 
      }), { headers: cors });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
    }
  }

  /* ════ DELETE ORPHAN MEDIA ════ */
  if (action === 'delete_orphan_media' && request.method === 'POST') {
    const sessRole = await sessionRole();
    if (sessRole !== 'admin') {
      return new Response(JSON.stringify({ error: 'Solo admin' }), { status: 403, headers: cors });
    }
    const csrfOk = await verifyCsrf(request);
    if (!csrfOk) return new Response(JSON.stringify({ error: 'CSRF token non valido' }), { status: 403, headers: cors });
    if (await genericRateLimit('delete_orphan_media', 3, 300)) {
      return new Response(JSON.stringify({ error: 'Troppe richieste' }), { status: 429, headers: cors });
    }
    let body;
    try { body = await request.json(); } catch (e) {
      return new Response(JSON.stringify({ error: 'Body non valido' }), { status: 400, headers: cors });
    }
    const { filenames } = body;
    if (!Array.isArray(filenames) || filenames.length === 0) {
      return new Response(JSON.stringify({ error: 'filenames array richiesto' }), { status: 400, headers: cors });
    }
    const ghToken = await getGhToken();
    if (!ghToken) {
      return new Response(JSON.stringify({ error: 'GH_TOKEN non configurato' }), { status: 501, headers: cors });
    }
    const GH_REPO = env.GH_REPO || 'DarkLionMoon/Arcamis';
    const GH_BRANCH = env.GH_BRANCH || 'main';
    const apiBase = 'https://api.github.com/repos/' + GH_REPO;
    const ghHeaders = {
      'Authorization': 'token ' + ghToken,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'ArcamisAdmin'
    };
    const deleted = [];
    for (const name of filenames.slice(0, 10)) {
      try {
        const getFile = await fetch(apiBase + '/contents/images/' + name + '?ref=' + GH_BRANCH, { headers: ghHeaders });
        if (getFile.ok) {
          const fileData = await getFile.json();
          const delRes = await fetch(apiBase + '/contents/images/' + name, {
            method: 'DELETE',
            headers: ghHeaders,
            body: JSON.stringify({ message: 'admin: delete orphan media ' + name, sha: fileData.sha, branch: GH_BRANCH })
          });
          if (delRes.ok) deleted.push(name);
        }
      } catch (_) {}
    }
    await writeAdminLog('delete_orphan_media', deleted.join(', '), 'eliminati ' + deleted.length + ' file orfani', await sessionUser());
    notifyWebhook('🗑️ ' + deleted.length + ' file orfani eliminati da ' + (await sessionUser()));
    return new Response(JSON.stringify({ ok: true, deleted }), { headers: cors });
  }

  /* ════ GLOBAL LINK SCANNER ════ */
  if (action === 'scan_links') {
    const sessRole = await sessionRole();
    if (!sessRole) {
      return new Response(JSON.stringify({ error: 'Non autenticato' }), { status: 401, headers: cors });
    }
    const ghToken = await getGhToken();
    if (!ghToken) {
      return new Response(JSON.stringify({ error: 'GH_TOKEN non configurato' }), { status: 501, headers: cors });
    }
    const GH_REPO = env.GH_REPO || 'DarkLionMoon/Arcamis';
    const GH_BRANCH = env.GH_BRANCH || 'main';
    const apiBase = 'https://api.github.com/repos/' + GH_REPO;
    const ghHeaders = {
      'Authorization': 'token ' + ghToken,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'ArcamisAdmin'
    };
    try {
      /* 1. Get registry for valid page keys */
      const regRes = await fetch(apiBase + '/contents/content/pages/registry.json?ref=' + GH_BRANCH, { headers: ghHeaders });
      let validKeys = [];
      let validSlugs = [];
      if (regRes.ok) {
        const regData = await regRes.json();
        const reg = JSON.parse(decodeURIComponent(escape(atob(regData.content))));
        if (reg.pages) {
          validKeys = reg.pages.map(p => p.k);
          validSlugs = reg.pages.map(p => p.k);
        }
      }

      /* 2. Get all page files */
      const pagesRes = await fetch(apiBase + '/contents/content/pages?ref=' + GH_BRANCH, { headers: ghHeaders });
      if (!pagesRes.ok) return new Response(JSON.stringify({ error: 'Impossibile elencare pagine' }), { status: 502, headers: cors });
      const pageFiles = (await pagesRes.json()).filter(f => f.type === 'file' && f.name.endsWith('.json') && f.name !== 'registry.json');

      /* 3. Get image list */
      const imgRes = await fetch(apiBase + '/contents/images?ref=' + GH_BRANCH, { headers: ghHeaders });
      const validImages = imgRes.ok ? (await imgRes.json()).filter(f => f.type === 'file').map(f => f.name) : [];

      const broken = [];
      const warnings = [];
      const checked = [];

      for (const pf of pageFiles) {
        try {
          const cr = await fetch(apiBase + '/contents/content/pages/' + pf.name + '?ref=' + GH_BRANCH, { headers: ghHeaders });
          if (!cr.ok) continue;
          const cd = await cr.json();
          const content = decodeURIComponent(escape(atob(cd.content)));
          const pageKey = pf.name.replace('.json', '');

          /* Check internal page links: [text](/section/slug) or [text](slug) */
          const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
          let match;
          while ((match = linkRegex.exec(content)) !== null) {
            const href = match[2];
            if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) continue;
            const cleanHref = href.replace(/^\//, '').split('#')[0].split('?')[0];
            /* Check if it's a valid page slug */
            if (cleanHref && !validSlugs.some(s => cleanHref === s || cleanHref.endsWith('/' + s))) {
              /* Check if it's a valid image */
              const imgName = cleanHref.replace('images/', '');
              if (!validImages.includes(imgName)) {
                broken.push({ page: pageKey, type: 'link', target: href, line: content.substring(0, match.index).split('\n').length });
              }
            }
          }

          /* Check image references: ![alt](/images/filename) */
          const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
          while ((match = imgRegex.exec(content)) !== null) {
            const src = match[2];
            if (src.startsWith('http') || src.startsWith('data:')) continue;
            const imgName = src.replace(/^\/?images\//, '').split('?')[0];
            if (imgName && !validImages.includes(imgName)) {
              broken.push({ page: pageKey, type: 'image', target: src, alt: match[1], line: content.substring(0, match.index).split('\n').length });
            }
          }

          /* Check HTML img tags */
          const htmlImgRegex = /<img[^>]+src=["']([^"']+)["']/g;
          while ((match = htmlImgRegex.exec(content)) !== null) {
            const src = match[1];
            if (src.startsWith('http') || src.startsWith('data:')) continue;
            const imgName = src.replace(/^\/?images\//, '').split('?')[0];
            if (imgName && !validImages.includes(imgName)) {
              broken.push({ page: pageKey, type: 'image', target: src, line: content.substring(0, match.index).split('\n').length });
            }
          }

          /* Check for images without alt text */
          const noAltRegex = /!\[\]\([^)]+\)/g;
          while ((match = noAltRegex.exec(content)) !== null) {
            warnings.push({ page: pageKey, type: 'missing_alt', target: match[0].substring(0, 60), line: content.substring(0, match.index).split('\n').length });
          }

          checked.push(pageKey);
        } catch (e) {}
      }

      return new Response(JSON.stringify({
        checked: checked.length,
        broken,
        warnings,
        summary: {
          totalBroken: broken.length,
          brokenLinks: broken.filter(b => b.type === 'link').length,
          brokenImages: broken.filter(b => b.type === 'image').length,
          missingAlt: warnings.length
        }
      }), { headers: cors });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
    }
  }

  /* ════ TRASH: MOVE TO TRASH ════ */
  if (action === 'trash_page' && request.method === 'POST') {
    const sessRole = await sessionRole();
    if (sessRole !== 'admin') {
      return new Response(JSON.stringify({ error: 'Solo admin' }), { status: 403, headers: cors });
    }
    const csrfOk = await verifyCsrf(request);
    if (!csrfOk) return new Response(JSON.stringify({ error: 'CSRF token non valido' }), { status: 403, headers: cors });
    let body;
    try { body = await request.json(); } catch (e) {
      return new Response(JSON.stringify({ error: 'Body non valido' }), { status: 400, headers: cors });
    }
    const { pageKey, pageData, registryData } = body;
    if (!pageKey) {
      return new Response(JSON.stringify({ error: 'pageKey richiesto' }), { status: 400, headers: cors });
    }
    // Save to KV trash with 30-day expiry
    const trashKey = 'trash_' + pageKey;
    const trashEntry = {
      pageKey,
      pageData: pageData || null,
      registryData: registryData || null,
      deletedAt: new Date().toISOString(),
      deletedBy: await sessionUser() || 'admin'
    };
    // KV doesn't support native TTL, but we store timestamp and filter client-side
    await KV.put(trashKey, JSON.stringify(trashEntry));
    
    // Update trash index
    const trashIndexRaw = await KV.get('trash_index');
    let trashIndex = [];
    if (trashIndexRaw) {
      try { trashIndex = JSON.parse(trashIndexRaw); } catch (e) { trashIndex = []; }
    }
    if (!trashIndex.find(t => t.pageKey === pageKey)) {
      trashIndex.unshift({ pageKey, deletedAt: trashEntry.deletedAt, deletedBy: trashEntry.deletedBy });
      // Keep max 50 items in trash index
      if (trashIndex.length > 50) trashIndex = trashIndex.slice(0, 50);
    }
    await KV.put('trash_index', JSON.stringify(trashIndex));
    
    await writeAdminLog('trash_page', pageKey, {}, await sessionUser());
    return new Response(JSON.stringify({ ok: true }), { headers: cors });
  }

  /* ════ TRASH: LIST ════ */
  if (action === 'list_trash') {
    const sessRole = await sessionRole();
    if (sessRole !== 'admin') {
      return new Response(JSON.stringify({ error: 'Solo admin' }), { status: 403, headers: cors });
    }
    const trashIndexRaw = await KV.get('trash_index');
    let trashIndex = [];
    if (trashIndexRaw) {
      try { trashIndex = JSON.parse(trashIndexRaw); } catch (e) { trashIndex = []; }
    }
    // Filter out expired (>30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const valid = trashIndex.filter(t => new Date(t.deletedAt).getTime() > thirtyDaysAgo);
    
    // Fetch details for each
    const items = [];
    for (const entry of valid) {
      const raw = await KV.get('trash_' + entry.pageKey);
      if (raw) {
        try {
          const data = JSON.parse(raw);
          items.push({
            pageKey: data.pageKey,
            deletedAt: data.deletedAt,
            deletedBy: data.deletedBy,
            pageTitle: data.pageData ? JSON.parse(data.pageData).title : entry.pageKey,
            pageIcon: data.pageData ? JSON.parse(data.pageData).icon : '📄'
          });
        } catch (e) {}
      }
    }
    return new Response(JSON.stringify({ items, maxAge: '30 giorni' }), { headers: cors });
  }

  /* ════ TRASH: RESTORE ════ */
  if (action === 'restore_trash' && request.method === 'POST') {
    const sessRole = await sessionRole();
    if (sessRole !== 'admin') {
      return new Response(JSON.stringify({ error: 'Solo admin' }), { status: 403, headers: cors });
    }
    const csrfOk = await verifyCsrf(request);
    if (!csrfOk) return new Response(JSON.stringify({ error: 'CSRF token non valido' }), { status: 403, headers: cors });
    const ghToken = await getGhToken();
    if (!ghToken) {
      return new Response(JSON.stringify({ error: 'GH_TOKEN non configurato' }), { status: 501, headers: cors });
    }
    let body;
    try { body = await request.json(); } catch (e) {
      return new Response(JSON.stringify({ error: 'Body non valido' }), { status: 400, headers: cors });
    }
    const { pageKey } = body;
    if (!pageKey) {
      return new Response(JSON.stringify({ error: 'pageKey richiesto' }), { status: 400, headers: cors });
    }
    const trashKey = 'trash_' + pageKey;
    const raw = await KV.get(trashKey);
    if (!raw) {
      return new Response(JSON.stringify({ error: 'Pagina non trovata nel cestino' }), { status: 404, headers: cors });
    }
    const trashData = JSON.parse(raw);
    const GH_REPO = env.GH_REPO || 'DarkLionMoon/Arcamis';
    const GH_BRANCH = env.GH_BRANCH || 'main';
    const apiBase = 'https://api.github.com/repos/' + GH_REPO;
    const ghHeaders = {
      'Authorization': 'token ' + ghToken,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'ArcamisAdmin'
    };
    try {
      const files = [];
      if (trashData.pageData) {
        files.push({ path: 'content/pages/' + pageKey + '.json', content: btoa(unescape(encodeURIComponent(trashData.pageData))) });
      }
      if (trashData.registryData) {
        // Get current registry and merge the page back
        const regRes = await fetch(apiBase + '/contents/content/pages/registry.json?ref=' + GH_BRANCH, { headers: ghHeaders });
        if (regRes.ok) {
          const regFile = await regRes.json();
          const currentReg = JSON.parse(decodeURIComponent(escape(atob(regFile.content))));
          const trashedReg = JSON.parse(trashData.registryData);
          // Add the page back to registry
          const pageEntry = (trashedReg.pages || []).find(p => p.k === pageKey);
          if (pageEntry && !currentReg.pages.find(p => p.k === pageKey)) {
            currentReg.pages.push(pageEntry);
          }
          files.push({ path: 'content/pages/registry.json', content: btoa(unescape(encodeURIComponent(JSON.stringify(currentReg, null, 2) + '\n'))), sha: regFile.sha });
        }
      }
      if (files.length === 0) {
        return new Response(JSON.stringify({ error: 'Nessun dato da ripristinare' }), { status: 400, headers: cors });
      }
      // Commit restored files
      if (files.length === 1) {
        const f = files[0];
        const getRes = await fetch(apiBase + '/contents/' + f.path + '?ref=' + GH_BRANCH, { headers: ghHeaders });
        if (getRes.ok) {
          const fileData = await getRes.json();
          f.sha = fileData.sha;
        }
      }
      const commitRes = await fetch(apiBase + '/contents/' + files[0].path, {
        method: 'PUT',
        headers: ghHeaders,
        body: JSON.stringify({
          message: 'admin: restore from trash ' + pageKey,
          content: files[0].content,
          sha: files[0].sha || undefined,
          branch: GH_BRANCH
        })
      });
      // If multiple files, commit them one by one
      if (files.length > 1) {
        for (const f of files) {
          let sha = f.sha;
          if (!sha) {
            const getRes = await fetch(apiBase + '/contents/' + f.path + '?ref=' + GH_BRANCH, { headers: ghHeaders });
            if (getRes.ok) {
              const fileData = await getRes.json();
              sha = fileData.sha;
            }
          }
          await fetch(apiBase + '/contents/' + f.path, {
            method: 'PUT',
            headers: ghHeaders,
            body: JSON.stringify({
              message: 'admin: restore from trash ' + pageKey,
              content: f.content,
              sha: sha || undefined,
              branch: GH_BRANCH
            })
          });
        }
      }
      // Remove from trash
      await KV.delete(trashKey);
      const trashIndexRaw = await KV.get('trash_index');
      if (trashIndexRaw) {
        let idx = JSON.parse(trashIndexRaw);
        idx = idx.filter(t => t.pageKey !== pageKey);
        await KV.put('trash_index', JSON.stringify(idx));
      }
      notifyWebhook('♻️ Ripristinata dal cestino: ' + pageKey);
      await writeAdminLog('restore_trash', pageKey, {}, await sessionUser());
      return new Response(JSON.stringify({ ok: true }), { headers: cors });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
    }
  }

  /* ════ TRASH: PERMANENT DELETE ════ */
  if (action === 'empty_trash' && request.method === 'POST') {
    const sessRole = await sessionRole();
    if (sessRole !== 'admin') {
      return new Response(JSON.stringify({ error: 'Solo admin' }), { status: 403, headers: cors });
    }
    const csrfOk = await verifyCsrf(request);
    if (!csrfOk) return new Response(JSON.stringify({ error: 'CSRF token non valido' }), { status: 403, headers: cors });
    let body;
    try { body = await request.json(); } catch (e) {}
    const pageKey = body && body.pageKey;
    if (pageKey) {
      // Delete single item
      await KV.delete('trash_' + pageKey);
      const trashIndexRaw = await KV.get('trash_index');
      if (trashIndexRaw) {
        let idx = JSON.parse(trashIndexRaw);
        idx = idx.filter(t => t.pageKey !== pageKey);
        await KV.put('trash_index', JSON.stringify(idx));
      }
      await writeAdminLog('empty_trash', pageKey, {}, await sessionUser());
      return new Response(JSON.stringify({ ok: true }), { headers: cors });
    }
    // Empty all expired (>30 days)
    const trashIndexRaw = await KV.get('trash_index');
    if (!trashIndexRaw) return new Response(JSON.stringify({ ok: true, deleted: 0 }), { headers: cors });
    let idx = JSON.parse(trashIndexRaw);
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const expired = idx.filter(t => new Date(t.deletedAt).getTime() <= thirtyDaysAgo);
    for (const entry of expired) {
      await KV.delete('trash_' + entry.pageKey);
    }
    idx = idx.filter(t => new Date(t.deletedAt).getTime() > thirtyDaysAgo);
    await KV.put('trash_index', JSON.stringify(idx));
    await writeAdminLog('empty_trash', 'auto', { deleted: expired.length }, await sessionUser());
    return new Response(JSON.stringify({ ok: true, deleted: expired.length }), { headers: cors });
  }

  /* ════ BACKUP CONTENT ════ */
  if (action === 'backup_content') {
    const sessRole = await sessionRole();
    if (!sessRole) {
      return new Response(JSON.stringify({ error: 'Non autenticato' }), { status: 401, headers: cors });
    }
    const ghToken = await getGhToken();
    if (!ghToken) {
      return new Response(JSON.stringify({ error: 'GH_TOKEN non configurato' }), { status: 501, headers: cors });
    }
    const GH_REPO = env.GH_REPO || 'DarkLionMoon/Arcamis';
    const GH_BRANCH = env.GH_BRANCH || 'main';
    const apiBase = 'https://api.github.com/repos/' + GH_REPO;
    const ghHeaders = {
      'Authorization': 'token ' + ghToken,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'ArcamisAdmin'
    };
    try {
      const listRes = await fetch(apiBase + '/contents/content/pages?ref=' + GH_BRANCH, { headers: ghHeaders });
      if (!listRes.ok) {
        return new Response(JSON.stringify({ error: 'Impossibile elencare le pagine: ' + listRes.status }), { status: 502, headers: cors });
      }
      const files = await listRes.json();
      const result = [];
      for (const file of files) {
        if (file.type !== 'file') continue;
        try {
          const contentRes = await fetch(file.url, { headers: ghHeaders });
          if (contentRes.ok) {
            const data = await contentRes.json();
            const decoded = decodeURIComponent(escape(atob(data.content)));
            result.push({ name: file.name, content: decoded });
          }
        } catch (_) {}
      }
      return new Response(JSON.stringify(result), { headers: cors });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
    }
  }

  /* ════ GET DIFF ════ */
  if (action === 'get_diff' && request.method === 'POST') {
    const csrfOk = await verifyCsrf(request);
    if (!csrfOk) return new Response(JSON.stringify({ error: 'CSRF token non valido' }), { status: 403, headers: cors });
    let body;
    try { body = await request.json(); } catch (e) {
      return new Response(JSON.stringify({ error: 'Body non valido' }), { status: 400, headers: cors });
    }
    const { pageKey, sha1, sha2 } = body;
    if (!pageKey || !sha1 || !sha2) {
      return new Response(JSON.stringify({ error: 'pageKey, sha1 e sha2 richiesti' }), { status: 400, headers: cors });
    }
    const ghToken = await getGhToken();
    if (!ghToken) {
      return new Response(JSON.stringify({ error: 'GH_TOKEN non configurato' }), { status: 501, headers: cors });
    }
    const GH_REPO = env.GH_REPO || 'DarkLionMoon/Arcamis';
    const apiBase = 'https://api.github.com/repos/' + GH_REPO;
    const ghHeaders = {
      'Authorization': 'token ' + ghToken,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'ArcamisAdmin'
    };
    try {
      const filePath = 'content/pages/' + pageKey + '.json';
      const [res1, res2] = await Promise.all([
        fetch(apiBase + '/contents/' + filePath + '?ref=' + sha1, { headers: ghHeaders }),
        fetch(apiBase + '/contents/' + filePath + '?ref=' + sha2, { headers: ghHeaders })
      ]);
      if (!res1.ok) return new Response(JSON.stringify({ error: 'Commit 1 non trovato: ' + res1.status }), { status: 404, headers: cors });
      if (!res2.ok) return new Response(JSON.stringify({ error: 'Commit 2 non trovato: ' + res2.status }), { status: 404, headers: cors });
      const data1 = await res1.json();
      const data2 = await res2.json();
      const oldContent = decodeURIComponent(escape(atob(data1.content)));
      const newContent = decodeURIComponent(escape(atob(data2.content)));
      return new Response(JSON.stringify({
        old: JSON.parse(oldContent),
        new: JSON.parse(newContent),
        diff: simpleDiff(oldContent, newContent)
      }), { headers: cors });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
    }
  }

  /* ════ SAVE PAGE VERSION (backup to KV) ════ */
  if (action === 'save_version' && request.method === 'POST') {
    const sessRole = await sessionRole();
    if (sessRole !== 'admin') {
      return new Response(JSON.stringify({ error: 'Solo admin' }), { status: 403, headers: cors });
    }
    const csrfOk = await verifyCsrf(request);
    if (!csrfOk) return new Response(JSON.stringify({ error: 'CSRF token non valido' }), { status: 403, headers: cors });
    let body;
    try { body = await request.json(); } catch (e) {
      return new Response(JSON.stringify({ error: 'Body non valido' }), { status: 400, headers: cors });
    }
    const { pageKey, content } = body;
    if (!pageKey || !content) {
      return new Response(JSON.stringify({ error: 'pageKey e content richiesti' }), { status: 400, headers: cors });
    }
    // Get existing versions
    const versionKey = 'versions_' + pageKey;
    const existing = await KV.get(versionKey);
    let versions = [];
    if (existing) {
      try { versions = JSON.parse(existing); } catch (e) { versions = []; }
    }
    // Add new version (max 20 per page)
    versions.unshift({
      timestamp: new Date().toISOString(),
      user: await sessionUser() || 'admin',
      content: typeof content === 'string' ? content : JSON.stringify(content)
    });
    if (versions.length > 20) versions = versions.slice(0, 20);
    await KV.put(versionKey, JSON.stringify(versions));
    return new Response(JSON.stringify({ ok: true, count: versions.length }), { headers: cors });
  }

  /* ════ GET PAGE VERSIONS ════ */
  if (action === 'get_versions') {
    const sessRole = await sessionRole();
    if (!sessRole) {
      return new Response(JSON.stringify({ error: 'Non autenticato' }), { status: 401, headers: cors });
    }
    const pageKey = url.searchParams.get('pageKey');
    if (!pageKey) {
      return new Response(JSON.stringify({ error: 'pageKey richiesto' }), { status: 400, headers: cors });
    }
    const versionKey = 'versions_' + pageKey;
    const existing = await KV.get(versionKey);
    let versions = [];
    if (existing) {
      try {
        versions = JSON.parse(existing).map(v => ({
          timestamp: v.timestamp,
          user: v.user,
          preview: (v.content || '').substring(0, 200)
        }));
      } catch (e) { versions = []; }
    }
    return new Response(JSON.stringify({ versions }), { headers: cors });
  }

  /* ════ RESTORE PAGE VERSION ════ */
  if (action === 'restore_version' && request.method === 'POST') {
    const sessRole = await sessionRole();
    if (sessRole !== 'admin') {
      return new Response(JSON.stringify({ error: 'Solo admin' }), { status: 403, headers: cors });
    }
    const csrfOk = await verifyCsrf(request);
    if (!csrfOk) return new Response(JSON.stringify({ error: 'CSRF token non valido' }), { status: 403, headers: cors });
    const ghToken = await getGhToken();
    if (!ghToken) {
      return new Response(JSON.stringify({ error: 'GH_TOKEN non configurato' }), { status: 501, headers: cors });
    }
    let body;
    try { body = await request.json(); } catch (e) {
      return new Response(JSON.stringify({ error: 'Body non valido' }), { status: 400, headers: cors });
    }
    const { pageKey, versionIndex } = body;
    if (!pageKey || versionIndex === undefined) {
      return new Response(JSON.stringify({ error: 'pageKey e versionIndex richiesti' }), { status: 400, headers: cors });
    }
    const versionKey = 'versions_' + pageKey;
    const existing = await KV.get(versionKey);
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Nessuna versione trovata' }), { status: 404, headers: cors });
    }
    let versions;
    try { versions = JSON.parse(existing); } catch (e) {
      return new Response(JSON.stringify({ error: 'Dati versioni corrotti' }), { status: 500, headers: cors });
    }
    if (!versions[versionIndex]) {
      return new Response(JSON.stringify({ error: 'Versione non trovata' }), { status: 404, headers: cors });
    }
    const restoredContent = versions[versionIndex].content;
    // Save current as a version before restoring
    const GH_REPO = env.GH_REPO || 'DarkLionMoon/Arcamis';
    const GH_BRANCH = env.GH_BRANCH || 'main';
    const apiBase = 'https://api.github.com/repos/' + GH_REPO;
    const ghHeaders = {
      'Authorization': 'token ' + ghToken,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'ArcamisAdmin'
    };
    try {
      const path = 'content/pages/' + pageKey + '.json';
      const getFile = await fetch(apiBase + '/contents/' + path + '?ref=' + GH_BRANCH, { headers: ghHeaders });
      if (!getFile.ok) {
        return new Response(JSON.stringify({ error: 'Pagina non trovata su GitHub' }), { status: 404, headers: cors });
      }
      const fileData = await getFile.json();
      // Auto-backup current version
      const currentContent = decodeURIComponent(escape(atob(fileData.content)));
      versions.unshift({
        timestamp: new Date().toISOString(),
        user: (await sessionUser()) || 'admin',
        content: currentContent,
        note: 'auto-backup before restore'
      });
      if (versions.length > 20) versions = versions.slice(0, 20);
      await KV.put(versionKey, JSON.stringify(versions));
      // Commit restored content
      const commitMsg = 'admin: restore ' + pageKey + ' to version ' + versionIndex;
      const putRes = await fetch(apiBase + '/contents/' + path, {
        method: 'PUT',
        headers: ghHeaders,
        body: JSON.stringify({
          message: commitMsg,
          content: btoa(unescape(encodeURIComponent(restoredContent))),
          sha: fileData.sha,
          branch: GH_BRANCH
        })
      });
      if (!putRes.ok) {
        const errBody = await putRes.json().catch(() => ({}));
        return new Response(JSON.stringify({ error: 'GitHub push fallito: ' + putRes.status, detail: errBody.message }), { status: 502, headers: cors });
      }
      // Invalidate KV cache
      if (typeof pageKV !== 'undefined' && pageKV) {
        try { pageKV.delete('content/pages/' + pageKey + '.json'); } catch (e) {}
      }
      notifyWebhook('♻️ Restore versione: ' + pageKey + ' (v' + versionIndex + ')');
      await writeAdminLog('restore_version', pageKey, { versionIndex }, await sessionUser());
      return new Response(JSON.stringify({ ok: true, versions: versions.length }), { headers: cors });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
    }
  }

}
