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

}
