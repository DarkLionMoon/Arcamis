/*
  ARCAMIS — /api/deploy
  Stato dell'ultimo deploy Cloudflare Pages.
  Richiede sessione admin valida. Le env var CF_API_TOKEN e CF_ACCOUNT_ID
  devono essere configurate in Cloudflare Pages. Se non configurato
  risponde {configured:false} e l'admin usa il countdown di fallback.
*/
export async function onRequest(context) {
  const { env, request } = context;
  const CF_TOKEN = env.CF_API_TOKEN || '';
  const CF_ACCOUNT = env.CF_ACCOUNT_ID || '';
  const CF_PROJECT = env.CF_PAGES_PROJECT || 'arcamis';

  const origin = new URL(request.url).origin;
  const cors = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origin, 'Vary': 'Cookie' };

  /* ── Verifica sessione admin ── */
  const KV = env.ARCAMIS_CACHE;
  function getCookie(name) {
    const header = request.headers.get('Cookie') || '';
    const match = header.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[1]) : null;
  }
  const token = getCookie('arc_admin');
  let authed = false;
  if (token && KV) {
    try {
      const stored = await KV.get('admin_session_' + token);
      if (stored === 'valid') {
        authed = true;
      } else {
        const session = JSON.parse(stored);
        authed = !!(session && session.role);
      }
    } catch (_) {}
  }
  if (!authed) {
    return new Response(JSON.stringify({ error: 'Non autenticato' }), { status: 401, headers: cors });
  }

  if (!CF_TOKEN || !CF_ACCOUNT) {
    return new Response(JSON.stringify({ configured: false }), { headers: cors });
  }

  try {
    const url = 'https://api.cloudflare.com/client/v4/accounts/' + CF_ACCOUNT
      + '/pages/projects/' + CF_PROJECT + '/deployments?per_page=1';
    const r = await fetch(url, {
      headers: { 'Authorization': 'Bearer ' + CF_TOKEN, 'Content-Type': 'application/json' }
    });
    if (!r.ok) {
      return new Response(JSON.stringify({ configured: false, error: 'CF ' + r.status }), { headers: cors });
    }
    const j = await r.json();
    const d = Array.isArray(j.result) && j.result[0] ? j.result[0] : null;
    return new Response(JSON.stringify({
      configured: true,
      status: d ? d.status : 'unknown',
      created_on: d && d.created_on ? d.created_on : null,
      url: d && d.url ? d.url : null,
      latest_commit: d && d.latest_commit ? d.latest_commit : null
    }), { headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ configured: false, error: e.message }), { headers: cors });
  }
}
