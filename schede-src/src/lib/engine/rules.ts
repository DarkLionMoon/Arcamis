// Tabelle e costanti di regola (D&D 5e / homebrew Arcamis)

export const STATI = ['for', 'des', 'cos', 'int', 'sag', 'car'] as const;
export type StatKey = (typeof STATI)[number];

export const NOMI_STATI: Record<StatKey, string> = {
	for: 'Forza',
	des: 'Destrezza',
	cos: 'Costituzione',
	int: 'Intelligenza',
	sag: 'Saggezza',
	car: 'Carisma'
};

export interface AbilitaDef {
	nome: string;
	stat: StatKey;
}

export const ABILITA: AbilitaDef[] = [
	{ nome: 'Acrobazia', stat: 'des' },
	{ nome: 'Addestrare Animali', stat: 'sag' },
	{ nome: 'Arcano', stat: 'int' },
	{ nome: 'Atletica', stat: 'for' },
	{ nome: 'Inganno', stat: 'car' },
	{ nome: 'Intimidire', stat: 'car' },
	{ nome: 'Intuizione', stat: 'sag' },
	{ nome: 'Indagare', stat: 'int' },
	{ nome: 'Intrattenere', stat: 'car' },
	{ nome: 'Medicina', stat: 'sag' },
	{ nome: 'Natura', stat: 'int' },
	{ nome: 'Percezione', stat: 'sag' },
	{ nome: 'Persuasione', stat: 'car' },
	{ nome: 'Religione', stat: 'int' },
	{ nome: 'Rapidità di Mano', stat: 'des' },
	{ nome: 'Furtività', stat: 'des' },
	{ nome: 'Storia', stat: 'int' },
	{ nome: 'Sopravvivenza', stat: 'sag' }
];

export const TIPI_DANNO = [
	'tagliente',
	'contundente',
	'perforante',
	'fuoco',
	'freddo',
	'fulmine',
	'tuono',
	'acido',
	'veleno',
'necrotico',
	'radiante',
	'psichico',
	'force'
] as const;

// Tabella incantesimi incantatore pieno (slot per livello PG-combined)
export const SLOTS_PIENO: number[][] = [
	[2], // liv 1
	[3],
	[4, 2],
	[4, 3],
	[4, 3, 2],
	[4, 3, 3],
	[4, 3, 3, 1],
	[4, 3, 3, 2],
	[4, 3, 3, 3, 1],
	[4, 3, 3, 3, 2],
	[4, 3, 3, 3, 2, 1],
	[4, 3, 3, 3, 2, 1],
	[4, 3, 3, 3, 2, 1, 1],
	[4, 3, 3, 3, 2, 1, 1],
	[4, 3, 3, 3, 2, 1, 1, 1],
	[4, 3, 3, 3, 2, 1, 1, 1],
	[4, 3, 3, 3, 2, 1, 1, 1, 1],
	[4, 3, 3, 3, 3, 1, 1, 1, 1],
	[4, 3, 3, 3, 3, 2, 1, 1, 1],
	[4, 3, 3, 3, 3, 2, 2, 1, 1]
];

export const SLOTS_MEZZO: number[][] = (() => {
	const t: number[][] = [];
	for (let lvl = 1; lvl <= 20; lvl++) {
		const eff = Math.min(20, Math.floor(lvl / 2));
		if (eff < 2) t.push([]);
		else t.push(SLOTS_PIENO[eff - 1]);
	}
	return t;
})();

// Magia del Patto (Warlock): [livello incantesimo, slot]
export const SLOTS_PATTO: [number, number][] = [
	[1, 1], [1, 2], [2, 2], [2, 2], [3, 2], [3, 2], [4, 2], [4, 2],
	[5, 2], [5, 2], [5, 3], [5, 3], [5, 3], [5, 3], [5, 3], [5, 3],
	[5, 4], [5, 4], [5, 4], [5, 4]
];

// Trucchetti noti per classe per livello di classe
export const TRUCCHETTI_NOTI: Record<string, number[]> = {
	Bardo: [2, 3, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6],
	Chierico: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
	Druido: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
	Stregone: [4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
	Warlock: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
	Mago: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
	Artefice: [2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4],
	Paladino: Array(20).fill(0),
	Ranger: Array(20).fill(0)
};

// Incantesimi preparati per classe per livello
export const PREPARATI: Record<string, number[]> = {
	Chierico: [3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22],
	Druido: [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21],
	Paladino: [0,0,0,0,2,3,3,3,4,4,4,5,5,5,6,6,6,7,7,7],
	Ranger: [0,0,0,2,2,3,3,3,4,4,4,5,5,5,6,6,6,7,7,7],
	Artefice: [3,4,4,5,6,6,8,8,9,10,11,11,13,14,14,16,17,18,19,20],
	Mago: [], // spellbook: gestito manualmente
	Bardo: [], // incantesimi notti, non preparati
	Stregone: [], // incantesimi noti
	Warlock: [] // slot patto
};

// Incantesimi noti (Bardo/Stregone) per livello
export const NOTI_BARDO = [4,5,6,6,7,8,9,9,10,11,11,12,13,13,14,15,15,16,17,18];
export const NOTI_STREGONE = [2,3,4,5,6,7,8,9,10,11,12,12,13,13,14,14,15,15,16,16];

export function dadoMedio(dadoVita: string): number {
	const m = /d(\d+)/.exec(dadoVita || '');
	return m ? Math.floor(parseInt(m[1]) / 2) + 1 : 4;
}

// Dadi arti marziali Monaco per livello
export function dadoMonaco(livello: number): string {
	if (livello >= 17) return '1d10';
	if (livello >= 11) return '1d8';
	if (livello >= 5) return '1d6';
	return '1d4';
}
