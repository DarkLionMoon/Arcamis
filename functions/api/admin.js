export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const KV = env.ARCAMIS_CACHE;
  const ADMIN_SECRET = env.ADMIN_SECRET;
  const SESSION_TTL = 86400; /* 24 ore */

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

  /* ════ LOGIN ════ */
  if (action === 'login' && request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch (e) {
      return new Response(JSON.stringify({ error: 'Body non valido' }), { status: 400, headers: cors });
    }
    if (!body.password || body.password !== ADMIN_SECRET) {
      /* Piccolo delay anti-brute-force */
      await new Promise(r => setTimeout(r, 800));
      return new Response(JSON.stringify({ error: 'Password errata' }), { status: 401, headers: cors });
    }
    /* Crea sessione */
    const token = genToken();
    await KV.put('admin_session_' + token, 'valid', { expirationTtl: SESSION_TTL });
    const cookieVal = 'arc_admin=' + token
      + '; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=' + SESSION_TTL;
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

  /* ── Da qui in poi richiede sessione valida ── */
  const authed = await checkSession();
  if (!authed) {
    return new Response(JSON.stringify({ error: 'Non autenticato' }), { status: 401, headers: cors });
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
      /* coverUrl vuoto = rimuovi override */
      await KV.delete(key);
    } else {
      /* Salva senza TTL — le cover admin sono permanenti */
      await KV.put(key, coverUrl);
    }
    /* Invalida cache galleria */
    try { await KV.delete('gallery_pg_v2'); } catch (e) {}
    return new Response(JSON.stringify({ ok: true }), { headers: cors });
  }

  /* ════ LEGGI TUTTE LE COVER ADMIN ════ */
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

  return new Response(JSON.stringify({ error: 'Azione non valida' }), { status: 400, headers: cors });
}
