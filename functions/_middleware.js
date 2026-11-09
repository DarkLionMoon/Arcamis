/* ════════════════════════════════════════════════════════════
   ARCAMIS — chiusura del sito

   Questo middleware intercetta OGNI richiesta della wiki e
   risponde con la pagina di scuse, senza servire né le pagine
   né gli asset né /admin né le API. Unica eccezione: robots.txt,
   che resta leggibile e dice ai crawler di non indicizzare nulla.

   Per riaprire il sito basta rimuovere questo file.

   NOTA: NOTION_URL è l'unico punto da modificare per cambiare
   la destinazione del rimando.
════════════════════════════════════════════════════════════ */

export const NOTION_URL = 'https://quickest-sorrel-9a3.notion.site/Arcamis-2f00274fdc1c801a9b39d8d69800f7a8';

const PAGINA = `<!DOCTYPE html>
<html lang="it" dir="ltr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#080a0e">
<title>Arcamis — la wiki è chiusa</title>
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="La wiki di Arcamis non è più disponibile. Il materiale di riferimento continua su Notion.">
<style>
  :root{
    --bg:#080a0e;--gold:#d4af37;--gold3:#e8cf7a;
    --text:#e9e2d0;--text2:#c9c1ad;--line:rgba(212,175,55,.18);
    --font-title:'Cinzel',Georgia,'Times New Roman',serif;
    --font-body:Georgia,'Iowan Old Style','Times New Roman',serif;
  }
  *{box-sizing:border-box}
  body{
    margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:radial-gradient(ellipse 80% 60% at 50% 0%,#141a26 0%,var(--bg) 60%,#05070a 100%);
    color:var(--text);font-family:var(--font-body);font-size:16px;line-height:1.7;
    padding:32px 20px calc(32px + env(safe-area-inset-bottom));text-align:center;
  }
  main{max-width:640px;width:100%}
  .sigil{
    font-family:var(--font-title);font-size:13px;letter-spacing:.42em;text-transform:uppercase;
    color:var(--gold);opacity:.85;margin-bottom:22px;
  }
  h1{
    font-family:var(--font-title);font-size:clamp(26px,6vw,38px);font-weight:700;
    color:var(--gold3);margin:0 0 18px;line-height:1.2;
  }
  p{color:var(--text2);margin:0 auto 20px;max-width:52ch}
  p strong{color:var(--gold3);font-weight:700}
  .actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin:28px 0 0}
  a.btn{
    display:inline-flex;align-items:center;gap:8px;min-height:46px;padding:12px 26px;
    font-family:var(--font-title);font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
    color:#fff;text-decoration:none;border:1px solid rgba(212,175,55,.5);border-radius:3px;
    background:rgba(212,175,55,.18);transition:.18s;
  }
  a.btn:hover,a.btn:focus-visible{background:rgba(212,175,55,.3);border-color:rgba(212,175,55,.8);outline:none}
  .hint{margin-top:30px;font-size:12px;color:#9a927f;letter-spacing:.04em}
</style>
</head>
<body>
<main>
  <div class="sigil">Arcamis</div>
  <h1>Ci scusiamo</h1>
  <p>La wiki di Arcamis non è più online. Ci dispiace per chi cercava una scheda, un luogo o una regola e si è trovato davanti a un link che non porta più da nessuna parte.</p>
  <p>Il materiale di riferimento continua su <strong>Notion</strong>: è lì che trovi la versione aggiornata di tutto.</p>
  <div class="actions">
    <a class="btn" href="${NOTION_URL}" target="_blank" rel="noopener">Vai al Notion →</a>
  </div>
  <div class="hint">Questa pagina sostituisce tutte le altre: il sito resta chiuso.</div>
</main>
</body>
</html>`;

const HEADERS = {
  'content-type': 'text/html; charset=utf-8',
  'cache-control': 'no-store, max-age=0',
  'retry-after': '86400',
  'x-robots-tag': 'noindex, nofollow',
};

export async function onRequest(context) {
  const url = new URL(context.request.url);

  /* I crawler devono poter leggere la regola di chiusura. */
  if (url.pathname === '/robots.txt') {
    return new Response('User-agent: *\nDisallow: /\n', {
      status: 200,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'public, max-age=3600',
      },
    });
  }

  const method = context.request.method;
  if (method === 'HEAD') {
    return new Response(null, { status: 503, headers: HEADERS });
  }

  return new Response(PAGINA, { status: 503, headers: HEADERS });
}
