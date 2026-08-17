/* ════════════════════════════════════════════════════════════════
   MAP PINS API — Cloudflare Function
   GET  (pubblico)  → restituisce tutte le puntine della mappa
   POST (admin auth)→ salva/aggiunge/rimuove puntine in KV
   ════════════════════════════════════════════════════════════════ */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const KV = env.ARCAMIS_CACHE;

  const cors = {
    'Access-Control-Allow-Origin': url.origin,
    'Content-Type': 'application/json',
    'Vary': 'Cookie'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }

  const KV_KEY = 'map_pins';

  /* ── Fallback pins (hardcoded, usati se KV è vuoto) ── */
  const FALLBACK_PINS = [
    { id:'mpin-arcamis', left:'87.76%', top:'28.53%', type:'city', name:'Arcamis', desc:'Città portuale delle Marche. Porto, commercio, avventura.', explored:true, sub:'', pageId:'3090274fdc1c80e1a365ce1c36873455' },
    { id:'mpin-selvafoglia', left:'78.58%', top:'24.05%', type:'forest', name:'Selva Fogliabruna', desc:'Alberi troppo vecchi. Chi entra non sempre torna.', explored:true, sub:'foglia', pageId:'30d0274fdc1c800999feeb0ca6669b22' },
    { id:'mpin-forestasmari', left:'86.74%', top:'41.99%', type:'fog', name:'Foresta dello Smarrimento', desc:'Non ci sono mappe. I sentieri cambiano. Rune violacee compaiono di notte.', explored:false, sub:'smari', pageId:'30d0274fdc1c8016b113d5c2d7662d8f' },
    { id:'mpin-volonx', left:'93.13%', top:'35.69%', type:'village', name:'Volonx', desc:'Insediamento ai margini. Chi ci abita, raramente se ne va.', explored:true, sub:'', pageId:'30d0274fdc1c804b9cb7e366f02bd635' },
    { id:'mpin-vigilius', left:'78.74%', top:'51.15%', type:'city', name:'Vigilius', desc:'Città interna delle Marche. Centro politico e militare.', explored:true, sub:'', pageId:'31f0274fdc1c8059a923c73da185a0e3' },
    { id:'mpin-galeton', left:'86.21%', top:'69.47%', type:'village', name:'Galeton', desc:'Crocevia commerciale. Molte strade si incontrano qui.', explored:true, sub:'', pageId:'31f0274fdc1c8019945af2b26306462f' },
    { id:'mpin-lagogromot', left:'92.65%', top:'51.72%', type:'water', name:'Lago di Gromot', desc:'Acque scure e profonde. Nessuno sa quanto è fondo.', explored:true, sub:'', pageId:'30d0274fdc1c803387c4fda013b857e9' },
    { id:'mpin-fortevigilius', left:'20.99%', top:'33.02%', type:'fort', name:'Forte Vigilus', desc:'Avamposto militare sulle alture. Controlla i passi verso est.', explored:true, sub:'', pageId:'30d0274fdc1c8090aee7ed0430170414' },
    { id:'mpin-rivadifero', left:'20.45%', top:'66.99%', type:'village', name:'Riva di Ferro', desc:'Porto minore. Pescatori, contrabbandieri, qualche avventuriero di passaggio.', explored:true, sub:'', pageId:'31f0274fdc1c8075b0dec2e2a6bc359e' },
    { id:'mpin-fumofosco', left:'43.48%', top:'52.48%', type:'village', name:'Fumofosco', desc:'Un villaggio avvolto da strane nebbie. I locali non parlano molto.', explored:true, sub:'', pageId:'31f0274fdc1c805b89b8f0678463e615' },
    { id:'mpin-kaldur', left:'48.09%', top:'69.85%', type:'ruin', name:'Rovine di Kaldur', desc:'Una civiltà è finita qui. Le pietre bruciano ancora.', explored:true, sub:'', pageId:'31f0274fdc1c808191abe4df86d176e6' }
  ];

  /* ── Helper: verifica sessione admin ── */
  async function checkSession() {
    const header = request.headers.get('Cookie') || '';
    const match = header.match(/(?:^|;\s*)arc_admin=([^;]+)/);
    if (!match) return false;
    try {
      const stored = await KV.get('admin_session_' + match[1]);
      if (!stored) return false;
      if (stored === 'valid') return true;
      const session = JSON.parse(stored);
      return session && (session === true || session.role);
    } catch (e) { return false; }
  }

  /* ── GET: restituisce le puntine ── */
  if (request.method === 'GET') {
    try {
      const raw = await KV.get(KV_KEY, 'text');
      if (raw) {
        const pins = JSON.parse(raw);
        return new Response(JSON.stringify({ pins, source: 'kv' }), { headers: cors });
      }
    } catch (e) {}

    /* Fallback: puntine hardcoded */
    return new Response(JSON.stringify({ pins: FALLBACK_PINS, source: 'fallback' }), { headers: cors });
  }

  /* ── POST: salva le puntine (admin only) ── */
  if (request.method === 'POST') {
    const authed = await checkSession();
    if (!authed) {
      return new Response(JSON.stringify({ error: 'Non autenticato' }), { status: 401, headers: cors });
    }

    let body;
    try { body = await request.json(); } catch (e) {
      return new Response(JSON.stringify({ error: 'Body non valido' }), { status: 400, headers: cors });
    }

    const { pins } = body;
    if (!Array.isArray(pins)) {
      return new Response(JSON.stringify({ error: 'pins array richiesto' }), { status: 400, headers: cors });
    }

    /* Validazione base */
    for (const p of pins) {
      if (!p.id || !p.name || p.left == null || p.top == null) {
        return new Response(JSON.stringify({ error: 'Ogni pin deve avere id, name, left, top' }), { status: 400, headers: cors });
      }
    }

    try {
      await KV.put(KV_KEY, JSON.stringify(pins));
      return new Response(JSON.stringify({ ok: true, count: pins.length }), { headers: cors });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Errore salvataggio KV: ' + e.message }), { status: 500, headers: cors });
    }
  }

  return new Response(JSON.stringify({ error: 'Metodo non supportato' }), { status: 405, headers: cors });
}
