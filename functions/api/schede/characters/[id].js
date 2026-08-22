// GET    /api/schede/characters/:id  → personaggio completo
// PUT    /api/schede/characters/:id  → salva (x-edit-token oppure sessione admin)
// DELETE /api/schede/characters/:id  → elimina (x-edit-token oppure sessione admin)

const CORS = {
	'content-type': 'application/json; charset=utf-8',
	'access-control-allow-origin': '*'
};

/* Verifica sessione admin (stesso schema di functions/api/admin.js) */
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

async function autorizzato(request, env, id) {
	if (await isAdmin(request, env)) return true;
	const token =
		request.headers.get('x-edit-token') ||
		new URL(request.url).searchParams.get('token');
	if (!token) return false;
	const row = await env.DB.prepare(`SELECT 1 FROM personaggi WHERE id = ? AND edit_token = ?`)
		.bind(id, token)
		.first();
	return !!row;
}

export async function onRequestGet(context) {
	const { params, env } = context;
	const row = await env.DB.prepare(`SELECT dati FROM personaggi WHERE id = ?`)
		.bind(params.id)
		.first();
	if (!row) return new Response(JSON.stringify({ error: 'non trovato' }), { status: 404, headers: CORS });
	const d = JSON.parse(row.dati);
	delete d.editToken;
	return new Response(JSON.stringify(d), { headers: CORS });
}

export async function onRequestPut(context) {
	const { request, params, env } = context;
	if (!(await autorizzato(request, env, params.id)))
		return new Response(JSON.stringify({ error: 'non autorizzato' }), { status: 403, headers: CORS });
	let dati;
	try {
		dati = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: 'JSON non valido' }), { status: 400, headers: CORS });
	}
	dati.id = params.id;
	await env.DB
		.prepare(`UPDATE personaggi SET dati = ?, aggiornato_il = datetime('now') WHERE id = ?`)
		.bind(JSON.stringify(dati), params.id)
		.run();
	return new Response(JSON.stringify({ ok: true }), { headers: CORS });
}

export async function onRequestDelete(context) {
	const { request, params, env } = context;
	if (!(await autorizzato(request, env, params.id)))
		return new Response(JSON.stringify({ error: 'token non valido' }), { status: 403, headers: CORS });
	await env.DB.prepare(`DELETE FROM personaggi WHERE id = ?`).bind(params.id).run();
	return new Response(JSON.stringify({ ok: true }), { headers: CORS });
}

export async function onRequestOptions() {
	return new Response(null, {
		headers: {
			'access-control-allow-origin': '*',
			'access-control-allow-methods': 'GET, POST, PUT, DELETE',
			'access-control-allow-headers': 'content-type, x-edit-token'
		}
	});
}
