import type { Personaggio, StatsBase, ClassePG } from '$lib/types';
import {
	STATI,
	NOMI_STATI,
	ABILITA,
	SLOTS_PIENO,
	SLOTS_MEZZO,
	SLOTS_PATTO,
	TRUCCHETTI_NOTI,
	PREPARATI,
	NOTI_BARDO,
	NOTI_STREGONE,
	dadoMedio,
	dadoMonaco
} from './rules';
import type { StatKey } from './rules';

import attacchiData from '$lib/data/attacks.json';
import indossabiliData from '$lib/data/wearables.json';
import classiData from '$lib/data/classes.json';
import specieData from '$lib/data/species.json';

export interface Arma {
	nome: string;
	dado?: string;
	tipoDanno?: string;
	categoria?: string;
	gittata?: string;
	monaco?: boolean;
	bonusMagico?: string | number;
	dadiBonus?: string;
	tipoDannoBonus?: string;
	caratteristicaSostitutiva?: string;
	proprieta?: string;
	usaModCaratteristica?: boolean;
	maestria?: string;
	testoMaestria?: string;
}

export interface Indossabile {
	nome: string;
	bonusCA?: number;
	maxDes?: number | null;
	categoria?: string;
	forzaRichiesta?: number | null;
	furtivita?: string;
	bonusCAMagico?: string | number;
	privilegi?: string;
	trucchetti?: number | null;
	incantesimiPreparati?: number | null;
}

export interface ClasseDef {
	nome: string;
	difesaSenzaArmatura?: string | null;
	dadoVita?: string | null;
	tsEcompetenze?: string | null;
	competenze1Liv?: string | null;
	competenzeMulticlasse?: string | null;
	tipoIncantatore?: string | null;
	caratteristicaIncantatore?: string | null;
	movimentoExtra?: string | null;
	privilegi: string[];
	sottoclassi: { nome: string; privilegi?: string[]; difesaSenzaArmatura?: string }[];
}

export const ARMATURE: Indossabile[] = indossabiliData as Indossabile[];
export const ARMI: Arma[] = attacchiData as Arma[];
export const CLASSI: ClasseDef[] = classiData as unknown as ClasseDef[];
export const SPECIE = specieData;

export function arma(nome: string): Arma | undefined {
	return ARMI.find((a) => a.nome.toLowerCase() === nome.toLowerCase());
}
export function classeDef(nome: string): ClasseDef | undefined {
	return CLASSI.find((c) => c.nome.toLowerCase() === nome.toLowerCase());
}
export function specieDef(nome: string) {
	return (SPECIE as any[]).find((s) => s.nome === nome);
}
export function indossabileDef(nome: string): Indossabile | undefined {
	return ARMATURE.find((w) => w.nome.toLowerCase() === nome.toLowerCase());
}

// ------------------------------------------------------------------ utility

export function mod(score: number): number {
	if (!score && score !== 0) return NaN;
	return Math.floor((score - 10) / 2);
}

export function fmtBonus(n: number): string {
	if (Number.isNaN(n)) return '-';
	return n >= 0 ? `+${n}` : `${n}`;
}

/** parse "10+des+cos" -> lista token */
function parseFormula(s: string): string[] {
	return s
		.replace(/\s+/g, '')
		.split('+')
		.map((t) => t.toLowerCase());
}

const MAP_STAT: Record<string, StatKey> = {
	des: 'des', destrezza: 'des',
	cos: 'cos', costituzione: 'cos',
	int: 'int', intelligenza: 'int',
	sag: 'sag', saggezza: 'sag',
	car: 'car', carisma: 'car',
	for: 'for', forza: 'for'
};

/** "scegli 3: for +1, des +1..." oppure "for +2, car +1" */
export function parseAumentiRazziali(testo: string): {
	sceltaLibera: number;
	opzioni: StatKey[];
	fissi: Partial<Record<StatKey, number>>;
} {
	const res = { sceltaLibera: 0, opzioni: [] as StatKey[], fissi: {} as Partial<Record<StatKey, number>> };
	if (!testo) return res;
	const t = testo.toLowerCase();
	const mScelta = /scegli\s+(\d+)/.exec(t);
	if (mScelta) {
		res.sceltaLibera = parseInt(mScelta[1]);
		const corpo = t.slice(t.indexOf(':') + 1).replace(/[+]\d+/g, '');
		res.opzioni = Array.from(new Set(
			Object.keys(MAP_STAT).filter((k) => new RegExp(`\\b${k}\\b`).test(corpo))
		)).map((k) => MAP_STAT[k]);
		if (res.opzioni.length === 0) res.opzioni = [...STATI];
		return res;
	}
	for (const m of t.matchAll(/(for|des|cos|int|sag|car|forza|destrezza|costituzione|intelligenza|saggezza|carisma)\s*\+\s*(\d+)/g)) {
		const k = MAP_STAT[m[1]];
		res.fissi[k] = (res.fissi[k] || 0) + parseInt(m[2]);
	}
	return res;
}

// ------------------------------------------------------------------ calcoli

export interface RisultatoAttacco {
	nome: string;
	bonus: string;
	danno: string;
	tipo?: string;
	note?: string;
}

export interface SchedaCalcolata {
	livelloTotale: number;
	bonusCompetenza: number;
	punteggi: StatsBase;
	modificatori: StatsBase;
	ts: Record<StatKey, { totale: number; competente: boolean; maestro: boolean }>;
	abilita: { nome: string; stat: StatKey; totale: number; competente: boolean; maestro: boolean }[];
	percezionePassiva: number;
	ca: number;
	caSenzaArmatura: number;
	caDettaglio: string[];
	armaturaCompetente: boolean;
	pfMassimi: number;
	dadiVita: string;
	iniziativa: number;
	velocita: number;
	velocitaExtra: string[];
	attacchi: RisultatoAttacco[];
	incantesimi: {
		caratteristica?: StatKey;
		cd: number | null;
		bonusAttacco: number | null;
		livelloIncantatore: number;
		slot: number[];
		patto: { livelloIncantesimo: number; slot: number } | null;
		trucchettiNota: number | null;
		preparatiNota: number | null;
		incantesimiNotaBardo: number | null;
		incantesimiNotaStregone: number | null;
	};
	linguaggiTotali: number;
	strumentiTotali: number;
	avvisi: string[];
	privilegi: { livello: number; fonte: string; testo: string }[];
}

function sommaPrivilegi(p: Personaggio): { livello: number; fonte: string; testo: string }[] {
	const out: { livello: number; fonte: string; testo: string }[] = [];
	for (const c of p.classi) {
		const def = classeDef(c.classe);
		if (!def) continue;
		for (const pr of def.privilegi) out.push({ ...parsePrivilegio(pr), fonte: c.classe });
		const sc = def.sottoclassi.find((s) => s.nome === c.sottoclasse);
		if (sc?.privilegi) for (const pr of sc.privilegi) out.push({ ...parsePrivilegio(pr), fonte: `${c.classe} (${sc.nome})` });
	}
	const sp = specieDef(p.specie);
	if (sp?.privilegi)
		for (const f of sp.privilegi)
			out.push({
				livello: f.livello,
				fonte: 'Specie',
				testo: f.dettaglio ? `${f.nome} (${f.dettaglio})` : f.nome
			});
	out.sort((a, b) => a.livello - b.livello);
	return out;
}

function parsePrivilegio(pr: string): { livello: number; testo: string } {
	const m = /^(\d+)°\s*(.*)$/.exec(pr.trim());
	return m ? { livello: parseInt(m[1]), testo: m[2] } : { livello: 1, testo: pr };
}

function livelliClasse(p: Personaggio, nome: string): number {
	return p.classi.filter((c) => c.classe.toLowerCase() === nome.toLowerCase()).reduce((s, c) => s + c.livello, 0);
}
function sottoclasseDi(p: Personaggio, nome: string): string | undefined {
	return p.classi.find((c) => c.classe.toLowerCase() === nome.toLowerCase())?.sottoclasse;
}

export function calcolaScheda(p: Personaggio): SchedaCalcolata {
	const avvisi: string[] = [];
	const talentiLower = p.talenti.map((t) => t.toLowerCase());
	const has = (nome: string) => talentiLower.some((t) => t.includes(nome.toLowerCase()));
	const lvlClass = (n: string) => livelliClasse(p, n);

	const livelloTotale = p.classi.reduce((s, c) => s + c.livello, 0);

	// ---- bonus competenza: floor((level+7)/4)
	let bonusCompetenza = Math.floor((livelloTotale + 7) / 4);

	// ---- punteggi caratteristica
	const sp = specieDef(p.specie);
	const aumenti = sp ? parseAumentiRazziali(sp.aumentoCaratteristiche || '') : { sceltaLibera: 0, opzioni: [], fissi: {} };
	const punteggi: any = { for: 8, des: 8, cos: 8, int: 8, sag: 8, car: 8 };
	for (const k of STATI) punteggi[k] = p.statsBase?.[k] ?? 8;
	for (const [k, v] of Object.entries(aumenti.fissi)) punteggi[k as StatKey] += v!;
	for (const a of p.aumenti ?? []) {
		if (a.tipo === 'stat' && a.stat) punteggi[a.stat] += 1;
	}
	// Monaco 20: +4 a tutti (homebrew foglio)
	if (lvlClass('Monaco') >= 20) for (const k of STATI) punteggi[k] += 4;
	for (const k of STATI) punteggi[k] = Math.min(30, punteggi[k]);

	const modificatori: any = {};
	for (const k of STATI) modificatori[k] = mod(punteggi[k]);

	// ---- competenze armi/armature accumulate
	let compArmi = new Set<string>();
	let compArmature = new Set<string>();
	const aggiungiComp = (testo?: string | null) => {
		if (!testo) return;
		const t = testo.toLowerCase();
		if (t.includes('semplic')) compArmi.add('Armi Semplici');
		if (t.includes('marziali')) compArmi.add('Armi Marziali');
		if (t.includes('legger')) compArmature.add('Armature Leggere');
		if (t.includes('medie')) compArmature.add('Armature Medie');
		if (t.includes('pesanti') && !t.includes('no pesanti')) compArmature.add('Armature Pesanti');
		if (t.includes('scudo')) compArmature.add('Scudo');
	};
	for (const c of p.classi) {
		const def = classeDef(c.classe);
		if (!def) continue;
		// il foglio Arcamis fonde 1°liv e multiclasse: concedo l'unione
		aggiungiComp(def.competenze1Liv);
		aggiungiComp(def.competenzeMulticlasse);
	}
	aggiungiComp(p.competenzeExtraArmiArmature.join(','));
	if (sp?.competenzeArmiArmature) aggiungiComp(sp.competenzeArmiArmature);
	// talenti che danno competenze armature
	if (has('corazze leggere')) { compArmature.add('Armature Leggere'); compArmature.add('Scudo'); }
	if (has('corazze medie')) compArmature.add('Armature Medie');
	if (has('corazze pesanti')) compArmature.add('Armature Pesanti');
	if (has('pistolero')) compArmi.add('Armi da Fuoco');
	if (has('lottatore da taverna')) compArmi.add('Improvvisate');

	// ---- Tiri Salvezza
	const tsCompetenze = new Set<string>();
	for (const c of p.classi) {
		const def = classeDef(c.classe);
		if (!def?.tsEcompetenze || p.classi.indexOf(c) !== 0) continue;
		const parti = def.tsEcompetenze.split(',').map((x) => x.trim().toLowerCase());
		// formato: "Forza, Costituzione, Scegli 2, <lista abilità>"
		const idxScelta = parti.findIndex((x) => x.startsWith('scegli'));
		const statsTs = parti.slice(0, idxScelta === -1 ? parti.length : idxScelta);
		for (const s of statsTs) {
			const st = MAP_STAT[s];
			if (st) tsCompetenze.add(st);
		}
		if (idxScelta !== -1) {
			const n = parseInt((parti[idxScelta].match(/\d+/) || ['0'])[0]);
			for (const s of p.tsScelte.slice(0, n)) tsCompetenze.add(MAP_STAT[s.toLowerCase()] ?? s);
		}
	}
	for (const s of p.tsScelte) if (tsCompetenze.size === 0) tsCompetenze.add(MAP_STAT[s.toLowerCase()] ?? s);

	const ts: any = {};
	for (const k of STATI) {
		const prof = tsCompetenze.has(k);
		ts[k] = { totale: modificatori[k] + (prof ? bonusCompetenza : 0), competente: prof, maestro: false };
	}

	// ---- Abilità
	const abilCompetenze = new Set<string>(p.abilitaScelte ?? []);
	for (const c of p.classi) {
		const def = classeDef(c.classe);
		if (!def?.tsEcompetenze || p.classi.indexOf(c) !== 0) continue;
		const parti = def.tsEcompetenze.split(',').map((x) => x.trim());
		const idxScelta = parti.findIndex((x) => x.toLowerCase().startsWith('scegli'));
		if (idxScelta !== -1) {
			// le opzioni sono le voci successive
			for (const opt of parti.slice(idxScelta + 1)) if (ABILITA.some((a) => a.nome === opt)) abilCompetenze.add(opt);
		}
	}
	// background: abilità scelte già incluse; specie altri privilegi testuali ignorati qui

	const factotum = lvlClass('Bardo') >= 2 ? Math.floor(bonusCompetenza / 2) : 0;
	const ibis = p.specie === 'Aven (Ibis)' ? Math.floor(bonusCompetenza / 2) : 0;

	// bonus da equip/talenti: pattern "N bonus alle prove di X"
	const bonusAbilitaTestuali: Record<string, number> = {};
	const raccogliTesti = [
		sp?.resistenze || '',
		...p.talenti,
		...p.opzioniDowntime
	];
	for (const t of raccogliTesti) {
		for (const m of String(t).toLowerCase().matchAll(/(\d+)\s*bonus alle prove di\s+[a-z]+\??\.\s*([a-zàèéìòù' ]+)/g)) {
			const nomeAbil = m[2].trim();
			if (ABILITA.some((a) => a.nome.toLowerCase() === nomeAbil))
				bonusAbilitaTestuali[nomeAbil] = (bonusAbilitaTestuali[nomeAbil] || 0) + parseInt(m[1]);
		}
	}

	const abilita = ABILITA.map((ab) => {
		const prof = abilCompetenze.has(ab.nome);
		const maestro = false;
		const base = prof ? bonusCompetenza * (maestro ? 2 : 1) : factotum + ibis;
		const extra = bonusAbilitaTestuali[ab.nome] || 0;
		return { ...ab, totale: modificatori[ab.stat] + base + extra, competente: prof, maestro };
	});

	const percezione = abilita.find((a) => a.nome === 'Percezione')!.totale;
	const percezionePassiva = 10 + percezione + (has('osservatore') ? 5 : 0);

	// ---- CA
	let caDettaglio: string[] = [];
	const difesa = (formula: string | undefined | null): { extra: number; noscudo: boolean } => {
		if (!formula) return { extra: 0, noscudo: false };
		const tokens = parseFormula(formula);
		let extra = 0;
		for (const t of tokens) {
			if (/^\d+$/.test(t)) continue;
			const st = MAP_STAT[t];
			if (st) extra += modificatori[st];
		}
		return { extra, noscudo: formula.toLowerCase().includes('noscudo') };
	};

	const armaturaEq = p.equip.armatura ? indossabileDef(p.equip.armatura) : undefined;
	const scudoEq = p.equip.scudo ? indossabileDef(p.equip.scudo) : undefined;

	// senza armatura
	let caNoArm = 10 + modificatori.des;
	caDettaglio.push('Base 10', `Des ${fmtBonus(modificatori.des)}`);
	const difeseClassi: string[] = [];
	for (const c of p.classi) {
		const def = classeDef(c.classe);
		let f = def?.difesaSenzaArmatura;
		const sc = def?.sottoclassi.find((s) => s.nome === c.sottoclasse);
		if (sc?.difesaSenzaArmatura) f = sc.difesaSenzaArmatura;
		if (f) {
			const d = difesa(f);
			if (!(sc?.difesaSenzaArmatura || '').includes('noscudo') || !scudoEq) {
				caNoArm += d.extra;
				difeseClassi.push(`${c.classe}: ${f} (${fmtBonus(d.extra)})`);
			}
		}
	}
	if (difeseClassi.length) caDettaglio.push(...difeseClassi);
	if (sp && typeof sp.armaturaNaturale === 'number') {
		caNoArm += sp.armaturaNaturale;
		caDettaglio.push(`Armatura naturale +${sp.armaturaNaturale}`);
	}
	if (sp && typeof sp.armaturaNaturale === 'string' && /^\d+$/.test(sp.armaturaNaturale)) {
		caNoArm += parseInt(sp.armaturaNaturale);
		caDettaglio.push(`Armatura naturale +${sp.armaturaNaturale}`);
	}

	// con armatura (bonusCA è il bonus sopra 10, es. maglia +3 → CA 13)
	let caConArm: number | null = null;
	if (armaturaEq) {
		const bonus = typeof armaturaEq.bonusCA === 'number' ? armaturaEq.bonusCA : 0;
		const maxDes = armaturaEq.maxDes ?? Infinity;
		const dexEff = Math.min(modificatori.des, maxDes);
		caConArm = 10 + bonus + dexEff;
		caDettaglio.push(`${armaturaEq.nome} 10+${bonus}`, `Des limitato ${fmtBonus(dexEff)}`);
		if (typeof armaturaEq.bonusCAMagico === 'number') {
			caConArm += armaturaEq.bonusCAMagico;
			caDettaglio.push(`Magico +${armaturaEq.bonusCAMagico}`);
		}
		if (scudoEq) {
			const sb = typeof scudoEq.bonusCA === 'number' ? scudoEq.bonusCA : 2;
			caConArm += sb;
			caDettaglio.push(`Scudo +${sb}`);
		}
	} else if (scudoEq) {
		caNoArm += typeof scudoEq.bonusCA === 'number' ? scudoEq.bonusCA : 2;
		caDettaglio.push(`Scudo +${typeof scudoEq.bonusCA === 'number' ? scudoEq.bonusCA : 2}`);
	}

	// competenza armatura -> avviso + penalità
	let armaturaCompetente = true;
	if (armaturaEq && armaturaEq.categoria && !compArmature.has(armaturaEq.categoria)) armaturaCompetente = false;
	if (scudoEq && !compArmature.has('Scudo')) armaturaCompetente = false;
	if (!armaturaCompetente) avvisi.push('Non sei competente con la tua armatura/scudo!');

	const ca = caConArm ?? caNoArm;

	// ---- PF
	let pfDadi = 0;
	let dadiVitaLabel = '';
	for (let i = 0; i < p.classi.length; i++) {
		const c = p.classi[i];
		const def = classeDef(c.classe);
		const die = dadoMedio(def?.dadoVita || 'd8');
		let tot = 0;
		for (let l = 1; l <= c.livello; l++) {
			if (p.hpTirati && p.hpTirati[i * 20 + l] > 0) tot += p.hpTirati[i * 20 + l];
			else tot += die;
		}
		pfDadi += tot;
		dadiVitaLabel += `${c.livello}d${(def?.dadoVita || 'd8').slice(1)}${i < p.classi.length - 1 ? ' + ' : ''}`;
	}
	const hpSpecie = sp && typeof sp.hpBonus === 'number' ? Math.max(1, Math.floor(sp.hpBonus * livelloTotale)) : 0;
	const pfMassimi =
		livelloTotale * (modificatori.cos || 0) +
		pfDadi +
		hpSpecie +
		(has('robusto') ? livelloTotale * 2 : 0);

	// ---- Iniziativa
	let iniziativa = modificatori.des;
	if (has('allerta')) iniziativa += bonusCompetenza;
	if (sottoclasseDi(p, 'Guerriero') === 'Campione' && lvlClass('Guerriero') >= 3) iniziativa += Math.floor(bonusCompetenza / 2);
	if (sottoclasseDi(p, 'Paladino') === 'Sentinelle' && lvlClass('Paladino') >= 7) iniziativa += bonusCompetenza;

	// ---- Velocità
	let velocita = typeof sp?.velocita === 'number' ? sp.velocita : 9;
	const velocitaExtra: string[] = [];
	if (has('mobile')) velocita += 3;
	// privilegi con (+Nm)
	for (const pr of sommaPrivilegi(p)) {
		if (pr.livello > livelloTotale) break;
		const m = /\(\+(\d+)\s*m?\)/.exec(pr.testo);
		if (m && pr.testo.toLowerCase().includes('movimento')) {
			velocita += parseInt(m[1]);
			velocitaExtra.push(pr.testo);
		}
	}

	// ---- Attacchi
	const attacchi: RisultatoAttacco[] = [];
	const stili = new Set(p.stiliCombattimento.map((s) => s.toLowerCase()));
	const duellare = stili.has('duellare') ? 2 : 0;
	const tiro = stili.has('tiro') ? 2 : 0;

	const numArmiEquip = p.attacchiEquipaggiati.filter((n) => !!arma(n));
	const dueMani = (a: Arma) => (a.proprieta || '').toLowerCase().includes('due mani');

	for (const nomeArma of p.attacchiEquipaggiati) {
		const a = arma(nomeArma);
		if (!a) continue;
		const proprieta = (a.proprieta || '').toLowerCase();
		const gittata = proprieta.includes('lancio') || (a.gittata || '').toLowerCase().includes('distanza');
		const distanza = (a.gittata || '').startsWith('Distanza') || gittata;
		const finezza = proprieta.includes('finesse');

		let statUsata: StatKey = 'for';
		if (distanza && !proprieta.includes('lancio')) statUsata = 'des';
		else if (finezza) statUsata = modificatori.des > modificatori.for ? 'des' : 'for';
		if (a.caratteristicaSostitutiva && a.caratteristicaSostitutiva !== '-') {
			statUsata = MAP_STAT[a.caratteristicaSostitutiva.toLowerCase()] ?? statUsata;
		}
		// Monaco: può usare des per armi monaco
		if (a.monaco && lvlClass('Monaco') > 0 && modificatori.des > modificatori[statUsata]) statUsata = 'des';

		const catOk =
			a.categoria &&
			(compArmi.has(a.categoria === 'Marziali' ? 'Armi Marziali' : 'Armi Semplici') ||
				(a.monaco && lvlClass('Monaco') > 0) ||
				numArmiEquip.length === 0);
		const prof = catOk ? bonusCompetenza : 0;
		if (!catOk) avvisi.push(`Non sei competente con ${a.nome}.`);

		let hitMod = modificatori[statUsata] + prof;
		if (distanza && tiro) hitMod += tiro;

		let danno = a.dado || '1';
		let dmgExtra = '';
		let modApplicato = modificatori[statUsata];
		if (dueMani(p) && !dueMani(a)) modApplicato *= 2; // ??? non standard: skip
		modApplicato = modificatori[statUsata];
		if (modApplicato !== 0) danno += fmtBonus(modApplicato);
		if (duellare && !dueMani(a) && !distanza) {
			danno += fmtBonus(duellare);
			dmgExtra = 'Stile Duellare';
		}
		if (a.dadiBonus && a.dadiBonus !== '-') danno += `+${a.dadiBonus}${a.tipoDannoBonus ? `[${a.tipoDannoBonus}]` : ''}`;

		attacchi.push({
			nome: a.nome,
			bonus: fmtBonus(hitMod),
			danno,
			tipo: a.tipoDanno,
			note: [a.maestria && a.maestria !== '-' ? `Maestria: ${a.maestria}` : '', dmgExtra, a.gittata && a.gittata !== '-' ? `Gittata: ${a.gittata}` : '']
				.filter(Boolean)
				.join(' · ')
		});
	}
	// colpo senz'armi se nessuna arma o sempre
	const monacoLvl = lvlClass('Monaco');
	if (numArmiEquip.length === 0 || monacoLvl > 0) {
		const dadoM = monacoLvl > 0 ? dadoMonaco(monacoLvl) : '1';
		attacchi.unshift({
			nome: monacoLvl > 0 ? "Colpo Senz'Armi (Monaco)" : "Colpo Senz'Armi",
			bonus: fmtBonus(Math.max(modificatori.for, monacoLvl > 0 ? modificatori.des : -99) + (numArmiEquip.length === 0 ? bonusCompetenza : 0)),
			danno: `${dadoM}${fmtBonus(Math.max(modificatori.for, monacoLvl > 0 ? modificatori.des : -99))}`,
			tipo: 'contundente'
		});
	}
	// attacchi naturali della specie
	if (sp?.attacchiNaturali && sp.attacchiNaturali !== '-') {
		for (const natNome of String(sp.attacchiNaturali).split(',')) {
			const nat = arma(natNome.trim());
			if (nat) {
				attacchi.push({ nome: nat.nome, bonus: fmtBonus(modificatori.for + bonusCompetenza), danno: nat.dado || '-', tipo: nat.tipoDanno, note: 'Attacco naturale' });
			}
		}
	}

	// ---- Incantesimi
	let caratteristicaInc: StatKey | undefined;
	let tipoMigliore = '';
	let livelloIncantatore = 0;
	const pattoLvl = lvlClass('Warlock');
	for (const c of p.classi) {
		const def = classeDef(c.classe);
		if (!def?.tipoIncantatore || def.tipoIncantatore === '-') continue;
		const car = (def.caratteristicaIncantatore || '').toLowerCase();
		const stat = MAP_STAT[Object.keys(MAP_STAT).find((k) => car.startsWith(k)) || ''] as StatKey | undefined;
		if (def.tipoIncantatore === 'Incantatore Pieno') {
			livelloIncantatore += c.livello;
			if (tipoMigliore === '') tipoMigliore = 'pieno';
		} else if (def.tipoIncantatore === 'Mezzo Incantatore') {
			livelloIncantatore += Math.floor(c.livello / 2);
			if (tipoMigliore === '') tipoMigliore = 'mezzo';
		} else if (def.tipoIncantatore === 'Incantatore Artefice') {
			livelloIncantatore += Math.ceil(c.livello / 2);
			if (tipoMigliore === '') tipoMigliore = 'artefice';
		}
		if (stat) caratteristicaInc = caratteristicaInc ?? stat;
	}
	const slot = livelloIncantatore > 0 ? SLOTS_PIENO[Math.min(20, livelloIncantatore) - 1] : [];
	const patto = pattoLvl > 0 ? { livelloIncantesimo: SLOTS_PATTO[Math.min(20, pattoLvl) - 1][0], slot: SLOTS_PATTO[Math.min(20, pattoLvl) - 1][1] } : null;
	const cd = caratteristicaInc && !Number.isNaN(modificatori[caratteristicaInc]) ? 8 + bonusCompetenza + modificatori[caratteristicaInc] : null;
	const bonusAtkSpell = caratteristicaInc && !Number.isNaN(modificatori[caratteristicaInc]) ? bonusCompetenza + modificatori[caratteristicaInc] : null;

	const trucchettiNota = (() => {
		let tot: number | null = null;
		for (const c of p.classi) {
			const tab = TRUCCHETTI_NOTI[c.classe];
			if (tab) tot = (tot ?? 0) + tab[Math.min(20, c.livello) - 1];
		}
		return tot;
	})();
	const preparatiNota = (() => {
		let tot: number | null = null;
		for (const c of p.classi) {
			const tab = PREPARATI[c.classe];
			if (tab && tab.length) tot = (tot ?? 0) + tab[Math.min(20, c.livello) - 1];
		}
		return tot;
	})();

	// ---- Linguaggi e strumenti
	let linguaggiTotali = 0;
	if (sp) {
		const lt = (sp.linguaggi || '').toLowerCase();
		const mExtra = lt.match(/(\d+)\s*extra/);
		linguaggiTotali = 1 + (mExtra ? parseInt(mExtra[1]) : (lt ? lt.split(',').length : 0));
		if (lt.includes('comune')) linguaggiTotali = 1 + (mExtra ? parseInt(mExtra[1]) : 0);
	}
	if (has('linguista')) linguaggiTotali += 3;
	if (has('prodigio')) linguaggiTotali += 1;
	for (const d of p.opzioniDowntime) {
		const dl = d.toLowerCase();
		if (/falsario|erborista|avvelenatore|navigatore|alchimista/.test(dl)) linguaggiTotali += 0;
	}
	const bgLang: Record<string, number> = { Linguaggi: 2, 'Linguaggio-Strumento': 1, Strumenti: 0 };
	linguaggiTotali += bgLang[p.background] ?? 0;

	let strumentiTotali = 0;
	if (has('prodigio')) strumentiTotali += 1;
	if (has('cuoco')) strumentiTotali += 1;
	if (has('artigiano')) strumentiTotali += 3;
	if (has('musicista')) strumentiTotali += 3;
	strumentiTotali += bgLang[p.background] === undefined ? 0 : ({ Linguaggi: 0, 'Linguaggio-Strumento': 1, Strumenti: 2 } as any)[p.background];

	return {
		livelloTotale,
		bonusCompetenza,
		punteggi,
		modificatori,
		ts,
		abilita,
		percezionePassiva,
		ca,
		caSenzaArmatura: caNoArm,
		caDettaglio,
		armaturaCompetente,
		pfMassimi,
		dadiVita: dadiVitaLabel,
		iniziativa,
		velocita,
		velocitaExtra,
		attacchi,
		incantesimi: {
			caratteristica: caratteristicaInc,
			cd,
			bonusAttacco: bonusAtkSpell,
			livelloIncantatore,
			slot,
			patto,
			trucchettiNota: trucchettiNota,
			preparatiNota: preparatiNota,
			incantesimiNotaBardo: p.classi.some((c) => c.classe === 'Bardo') ? NOTI_BARDO[Math.min(20, lvlClass('Bardo')) - 1] : null,
			incantesimiNotaStregone: p.classi.some((c) => c.classe === 'Stregone') ? NOTI_STREGONE[Math.min(20, lvlClass('Stregone')) - 1] : null
		},
		linguaggiTotali,
		strumentiTotali,
		avvisi,
		privilegi: sommaPrivilegi(p)
			.filter((pr) => pr.livello <= livelloTotale)
			.concat(sommaPrivilegi(p).filter((pr) => pr.livello > livelloTotale))
	};
}
