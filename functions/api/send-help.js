export async function onRequest(context) {
  const { request, env } = context;
  const requestOrigin = new URL(request.url).origin;
  const allowedOrigin =
    requestOrigin === 'https://arcamis.pages.dev' || requestOrigin === 'http://localhost:5173'
      ? requestOrigin
      : 'https://arcamis.pages.dev';
  const cors = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    Vary: 'Origin',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: cors });
  }

  const WEBHOOK_URL = env.DISCORD_WEBHOOK_URL;
  if (!WEBHOOK_URL) {
    return new Response(JSON.stringify({ error: 'Webhook non configurato' }), { status: 500, headers: cors });
  }

  /* ── Rate limit per IP: max 3 messaggi / ora ── */
  const KV = env.ARCAMIS_CACHE;
  if (KV) {
    try {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const rlKey = 'rl_help_' + ip;
      const raw = await KV.get(rlKey);
      const count = raw ? parseInt(raw, 10) : 0;
      if (count >= 3) {
        return new Response(JSON.stringify({ error: 'Hai già inviato più messaggi. Riprova più tardi.' }), {
          status: 429,
          headers: cors,
        });
      }
      await KV.put(rlKey, String(count + 1), { expirationTtl: 3600 });
    } catch (_) {}
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Body non valido' }), { status: 400, headers: cors });
  }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 60) : '';
  const msg = typeof body.message === 'string' ? body.message.trim().slice(0, 500) : '';
  if (!msg) {
    return new Response(JSON.stringify({ error: 'Messaggio mancante' }), { status: 400, headers: cors });
  }

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Oracolo di Arcamis',
        avatar_url: 'https://arcamis.pages.dev/favicon.png',
        embeds: [
          {
            title: 'Messaggio al DM',
            color: 0xc89b3c,
            fields: [
              { name: 'Mittente', value: name || '(anonimo)', inline: true },
              { name: 'Messaggio', value: msg },
            ],
            footer: { text: 'Arcamis Help Widget' },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    if (!res.ok) throw new Error('Webhook error: ' + res.status);
    return new Response(JSON.stringify({ ok: true }), { headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Errore invio' }), { status: 502, headers: cors });
  }
}
