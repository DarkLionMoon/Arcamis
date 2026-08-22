// API Schede PG — Cloudflare Pages Functions + D1
// GET  /api/schede/characters      → lista sintetica
// POST /api/schede/characters      → crea {dati} → {id, editToken}

const CORS = {
	'content-type': 'application/json; charset=utf-8',
	'access-control-allow-origin': '*'
};

export async function onRequestGet(context) {
	const db = context.env.DB;
	const { results } = await db
		.prepare(`SELECT id, dati, aggiornato_il FROM personaggi ORDER BY aggiornato_il DESC`)
		.all();
	const lista = (results || []).map((row) => {
		let d = {};
		try { d = JSON.parse(row.dati); } catch {}
		return {
			id: row.id,
			nome: d.nome || '(senza nome)',
			specie: d.specie || '',
			livello: Array.isArray(d.classi) ? d.classi.reduce((s, c) => s + (c.livello || 0), 0) : 0,
			classi: d.classi || [],
			aggiornatoIl: row.aggiornato_il
		};
	});
	return new Response(JSON.stringify(lista), { headers: CORS });
}

function nuovoId() {
	return crypto.randomUUID().replace(/-/g, '').slice(0, 8);
}
function nuovoToken() {
	const buf = new Uint8Array(16);
	crypto.getRandomValues(buf);
	return [...buf].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost(context) {
	const db = context.env.DB;
	let dati;
	try {
		dati = await context.request.json();
	} catch {
		return new Response(JSON.stringify({ error: 'JSON non valido' }), { status: 400, headers: CORS });
	}
	if (!dati || !dati.nome) {
		return new Response(JSON.stringify({ error: 'nome richiesto' }), { status: 400, headers: CORS });
	}
	const id = nuovoId();
	const editToken = nuovoToken();
	dati.id = id;
	await db
		.prepare(`INSERT INTO personaggi (id, edit_token, dati) VALUES (?, ?, ?)`)
		.bind(id, editToken, JSON.stringify(dati))
		.run();
	return new Response(JSON.stringify({ id, editToken }), { status: 201, headers: CORS });
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
