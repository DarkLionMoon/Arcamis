// Gestione token di modifica nel localStorage (per-device, senza account)

const KEY = 'arcamis_tokens';

type TokenMap = Record<string, string>;

function leggi(): TokenMap {
	if (typeof localStorage === 'undefined') return {};
	try {
		return JSON.parse(localStorage.getItem(KEY) || '{}');
	} catch {
		return {};
	}
}

export function salvaToken(id: string, token: string) {
	const m = leggi();
	m[id] = token;
	localStorage.setItem(KEY, JSON.stringify(m));
}

export function leggiToken(id: string): string | null {
	return leggi()[id] ?? null;
}

export function rimuoviToken(id: string) {
	const m = leggi();
	delete m[id];
	localStorage.setItem(KEY, JSON.stringify(m));
}
