export async function onRequest(context) {
  const { request, env } = context;
  const cors = {
    'Access-Control-Allow-Origin': 'https://arcamis.pages.dev',
    'Content-Type': 'application/json'
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

  let body;
  try { body = await request.json(); } catch (e) {
    return new Response(JSON.stringify({ error: 'Body non valido' }), { status: 400, headers: cors });
  }

  const name = (body.name || '').trim().slice(0, 60);
  const msg = (body.message || '').trim().slice(0, 500);
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
        embeds: [{
          title: 'Messaggio al DM',
          color: 0xC89B3C,
          fields: [
            { name: 'Mittente', value: name || '(anonimo)', inline: true },
            { name: 'Messaggio', value: msg }
          ],
          footer: { text: 'Arcamis Help Widget' },
          timestamp: new Date().toISOString()
        }]
      })
    });

    if (!res.ok) throw new Error('Webhook error: ' + res.status);
    return new Response(JSON.stringify({ ok: true }), { headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Errore invio' }), { status: 502, headers: cors });
  }
}
