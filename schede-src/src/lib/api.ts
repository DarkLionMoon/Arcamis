// Client API per le Cloudflare Pages Functions (D1)
export const API_BASE = '/api/schede';

function tokenHeaders(token: string | null): HeadersInit {
	return token ? { 'content-type': 'application/json', 'x-edit-token': token } : { 'content-type': 'application/json' };
}

export async function listaPg(): Promise<any[]> {
	const r = await fetch(`${API_BASE}/characters`);
	if (!r.ok) throw new Error('Errore caricamento');
	return r.json();
}

export async function leggiConfig(): Promise<{ abilitata: boolean; intro: string }> {
	const r = await fetch(`${API_BASE}/config`);
	if (!r.ok) return { abilitata: true, intro: '' };
	return r.json();
}

export async function creaPg(dati: unknown): Promise<{ id: string; editToken: string }> {
	const r = await fetch(`${API_BASE}/characters`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(dati)
	});
	if (!r.ok) throw new Error(await r.text());
	return r.json();
}

export async function leggiPg(id: string): Promise<unknown> {
	const r = await fetch(`${API_BASE}/characters/${id}`);
	if (!r.ok) throw new Error('Personaggio non trovato');
	return r.json();
}

export async function salvaPg(id: string, token: string, dati: unknown): Promise<boolean> {
	const r = await fetch(`${API_BASE}/characters/${id}`, {
		method: 'PUT',
		headers: tokenHeaders(token),
		body: JSON.stringify(dati)
	});
	return r.ok;
}

export async function eliminaPg(id: string, token: string): Promise<boolean> {
	const r = await fetch(`${API_BASE}/characters/${id}`, {
		method: 'DELETE',
		headers: tokenHeaders(token)
	});
	return r.ok;
}
