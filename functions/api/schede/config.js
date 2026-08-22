// GET  /api/schede/config → { abilitata: bool, intro: string }   (pubblico)
// POST /api/schede/config → aggiorna { abilitata?, intro? }       (solo admin)

const CORS = {
	'content-type': 'application/json; charset=utf-8',
	'access-control-allow-origin': '*'
};

const DEFAULTS = { abilitata: true, intro: 'Crea e gestisci i tuoi personaggi con la scheda automatica di Arcamis.' };

async function leggiConfig(env) {
	if (!env.ARCAMIS_CACHE) return { ...DEFAULTS };
	try {
		const raw = await env.ARCAMIS_CACHE.get('schede_config');
		return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
	} catch {
		return { ...DEFAULTS };
	}
}

async function isAdmin(request, env) {
	const cookie = request.headers.get('Cookie') || '';
	const m = cookie.match(/(?:^|;\s*)arc_admin=([^;]+)/);
	if (!m || !env.ARCAMIS_CACHE) return false;
	try {
		const stored = await env.ARCAMIS_CACHE.get('admin_session_' + m[1]);
		if (!stored) return false;
		if (stored === 'valid') return true;
		const session = JSON.parse(stored);
		return !!(session && (session === true || session.role));
	} catch {
		return false;
	}
}

export async function onRequestGet(context) {
	const cfg = await leggiConfig(context.env);
	return new Response(JSON.stringify(cfg), { headers: CORS });
}

export async function onRequestPost(context) {
	const { request, env } = context;
	if (!(await isAdmin(request, env)))
		return new Response(JSON.stringify({ error: 'solo admin' }), { status: 403, headers: CORS });
	let body;
	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: 'JSON non valido' }), { status: 400, headers: CORS });
	}
	const cfg = await leggiConfig(env);
	if (typeof body.abilitata === 'boolean') cfg.abilitata = body.abilitata;
	if (typeof body.intro === 'string') cfg.intro = body.intro.slice(0, 500);
	await env.ARCAMIS_CACHE.put('schede_config', JSON.stringify(cfg));
	return new Response(JSON.stringify({ ok: true, ...cfg }), { headers: CORS });
}
