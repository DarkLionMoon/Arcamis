export interface ClassePG {
	classe: string;
	sottoclasse?: string;
	livello: number;
}

export interface StatsBase {
	for: number;
	des: number;
	cos: number;
	int: number;
	sag: number;
	car: number;
}

export interface AumentoStat {
	tipo: 'stat' | 'talento';
	stat?: keyof StatsBase; // per tipo stat
	talento?: string; // nome feat (da feats.json)
}

export interface Personaggio {
	id?: string;
	editToken?: string;
	nome: string;
	player: string;
	background: string;
	allineamento: string;
	specie: string;
	classi: ClassePG[];
	statsBase: StatsBase;
	aumenti: AumentoStat[];
	tsScelte: string[];
	abilitaScelte: string[];
	competenzeExtraArmiArmature: string[];
	equip: {
		armatura?: string;
		scudo?: string;
	};
	attacchiEquipaggiati: string[];
	talenti: string[];
	stiliCombattimento: string[];
	opzioniDowntime: string[];
	linguaggiScelti: string[];
	strumentiScelti: string[];
	hpTirati: number[] | null; // dadi vita tirati in ordine di livello (null = medi)
	pfAttuali?: number | null;
	pfTemporanei?: number | null;
	note?: string;
	creatoIl?: string;
	aggiornatoIl?: string;
}
