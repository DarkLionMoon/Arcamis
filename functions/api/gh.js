/*
  ARCAMIS — /api/gh
  Proxy delle operazioni GitHub del pannello admin.
  Richiede una sessione admin valida (cookie arc_admin) e il token
  server-side GH_TOKEN: in questo modo il Personal Access Token
  non viene mai esposto nel browser.

  Azioni (POST, body: {action, payload}):
    get     {path, ref?}                    → contenuto file (GitHub contents obj)
    commits {path, per_page?}               → lista commit del file
    put     {path, message, content, sha?}  → scrive/aggiorna file
    binary  {path, message, content, sha?}  → scrive file binario (content = base64)
    delete  {path, message, sha}            → elimina file
*/
export async function onRequest(context) {
  const { request, env } = context;
  const KV = env.ARCAMIS_CACHE;
  /* Token GitHub: prioritario l'env GH_TOKEN (segreto di Cloudflare Pages),
     altrimenti il token salvato dall'admin in KV (azione set_gh_token). */
  let GH_TOKEN = env.GH_TOKEN || '';
  if (!GH_TOKEN && KV) {
    try { GH_TOKEN = (await KV.get('gh_token')) || ''; } catch (_) {}
  }
  const GH_REPO = env.GH_REPO || 'DarkLionMoon/Arcamis';
  const GH_BRANCH = env.GH_BRANCH || 'main';

  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Vary': 'Cookie'
  };

  if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST richiesto' }), { status: 405, headers: cors });
  }

  let body;
  try { body = await request.json(); } catch (e) {
    return new Response(JSON.stringify({ error: 'Body non valido' }), { status: 400, headers: cors });
  }

  /* ── Verifica sessione admin ── */
  function getCookie(name) {
    const header = request.headers.get('Cookie') || '';
    const match = header.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[1]) : null;
  }
  const token = getCookie('arc_admin');
  let authed = false;
  if (token) {
    try {
      const stored = await KV.get('admin_session_' + token);
      if (stored === 'valid') {
        authed = true; // compatibilità con vecchie sessioni
      } else {
        const session = JSON.parse(stored);
        authed = !!(session && (session === true || session.role));
      }
    } catch (_) {}
  }
  if (!authed) {
    return new Response(JSON.stringify({ error: 'Non autenticato' }), { status: 401, headers: cors });
  }
  if (!GH_TOKEN) {
    return new Response(JSON.stringify({ error: 'GH_TOKEN non configurato: imposta la variabile d\'ambiente GH_TOKEN in Cloudflare Pages oppure configuralo da Admin → Impostazioni → Repository → GitHub token' }), { status: 501, headers: cors });
  }

  const action = body.action;
  const p = body.payload || {};
  const api = 'https://api.github.com/repos/' + GH_REPO;
  const headers = {
    'Authorization': 'token ' + GH_TOKEN,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'ArcamisAdmin'
  };

  async function ghFetch(url, opts) {
    const r = await fetch(url, opts);
    if (!r.ok) {
      let msg = 'GitHub ' + r.status;
      try {
        const j = await r.json();
        if (j && (j.message || j.error)) msg = (j.message || j.error) + ' (' + r.status + ')';
      } catch (_) {}
      throw new Error(msg);
    }
    return r.json();
  }

  try {
    if (action === 'get') {
      const ref = p.ref || GH_BRANCH;
      const data = await ghFetch(api + '/contents/' + p.path + '?ref=' + encodeURIComponent(ref), { headers });
      return new Response(JSON.stringify({ ok: true, data }), { headers: cors });
    }

    if (action === 'commits') {
      const per = Math.min(parseInt(p.per_page, 10) || 25, 100);
      const url = api + '/commits?path=' + encodeURIComponent(p.path) + '&per_page=' + per + '&sha=' + encodeURIComponent(GH_BRANCH);
      const data = await ghFetch(url, { headers });
      return new Response(JSON.stringify({ ok: true, data }), { headers: cors });
    }

    if (action === 'put' || action === 'binary') {
      const bodyObj = { message: p.message, branch: GH_BRANCH, content: p.content };
      if (p.sha) bodyObj.sha = p.sha;
      const data = await ghFetch(api + '/contents/' + p.path, {
        method: 'PUT', headers, body: JSON.stringify(bodyObj)
      });
      return new Response(JSON.stringify({ ok: true, data }), { headers: cors });
    }

    if (action === 'delete') {
      const data = await ghFetch(api + '/contents/' + p.path, {
        method: 'DELETE', headers,
        body: JSON.stringify({ message: p.message, branch: GH_BRANCH, sha: p.sha })
      });
      return new Response(JSON.stringify({ ok: true, data }), { headers: cors });
    }

    return new Response(JSON.stringify({ error: 'Azione non valida' }), { status: 400, headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
  }
}
