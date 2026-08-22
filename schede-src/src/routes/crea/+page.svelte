<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { calcolaScheda, CLASSI, ARMI, ARMATURE, specieDef, classeDef } from '$lib/engine/calc';
	import { ABILITA, NOMI_STATI, STATI } from '$lib/engine/rules';
	import type { StatKey } from '$lib/engine/rules';
	import type { Personaggio, ClassePG, AumentoStat } from '$lib/types';
	import specieData from '$lib/data/species.json';
	import featsData from '$lib/data/feats.json';
	import { salvaToken, leggiToken } from '$lib/tokenStore';
	import { creaPg, leggiPg } from '$lib/api';

const SPECIE = specieData as any[];
const TALENTI = featsData as string[];

// ---------------------------------------------------------------- stato bozza
let step = $state(1);
let salvataggio = $state(false);
let errore = $state('');

let nome = $state('');
let player = $state('');
let background = $state('Strumenti');
let allineamento = $state('Neutrale Puro');
let specieSelezionata = $state('');
let scelteStatRazziale = $state<StatKey[]>([]);

let classi = $state<ClassePG[]>([{ classe: '', sottoclasse: undefined, livello: 1 }]);
let statsBase = $state({ for: 8, des: 8, cos: 8, int: 8, sag: 8, car: 8 });
let aumentiAsi = $state<AumentoStat[]>([]);
let tsScelte = $state<string[]>([]);
let abilitaScelte = $state<string[]>([]);
let equipArmatura = $state('');
let equipScudo = $state('');
let attacchiEquip = $state<string[]>([]);
let talenti = $state<string[]>([]);
let stiliCombattimento = $state<string[]>([]);
let linguaggiScelti = $state<string[]>([]);
let note = $state('');
let filtroArma = $state('');

// ---------------------------------------------------------------- dati derivati
const specieInfo = $derived(specieSelezionata ? SPECIE.find((s) => s.nome === specieSelezionata) : null);

function parseAumenti(testo: string) {
	const res = { sceltaLibera: 0, fissi: {} as Partial<Record<StatKey, number>> };
	if (!testo) return res;
	const t = testo.toLowerCase();
	const m = /scegli\s+(\d+)/.exec(t);
	if (m) {
		res.sceltaLibera = parseInt(m[1]);
		return res;
	}
	for (const mm of t.matchAll(/(for|des|cos|int|sag|car)\w*\s*\+\s*(\d+)/g)) {
		const k = mm[1].slice(0, 3) as StatKey;
		res.fissi[k] = (res.fissi[k] || 0) + parseInt(mm[2]);
	}
	return res;
}

const aumentiRazziali = $derived(specieInfo ? parseAumenti(specieInfo.aumentoCaratteristiche || '') : { sceltaLibera: 0, fissi: {} });

// opzioni abilità dalla prima classe
const opzioniAbilita = $derived.by<{ n: number; opzioni: string[] }>(() => {
	const c0 = classi[0];
	if (!c0?.classe) return { n: 0, opzioni: [] as string[] };
	const def = classeDef(c0.classe);
	if (!def?.tsEcompetenze) return { n: 0, opzioni: [] };
	const parti = def.tsEcompetenze.split(',').map((x) => x.trim());
	const i = parti.findIndex((p) => p.toLowerCase().startsWith('scegli'));
	if (i === -1) return { n: 0, opzioni: [] };
	const n = parseInt((parti[i].match(/\d+/) || ['0'])[0]);
	return { n, opzioni: parti.slice(i + 1).filter((o) => ABILITA.some((a) => a.nome === o)) };
});

const numSlotAsi = $derived(
	classi.reduce((somma, c) => {
		let n = 0;
		for (const soglia of [4, 8, 12, 16, 19]) if (c.livello >= soglia) n++;
		return somma + n;
	}, 0)
);

// costo point-buy
const COSTO: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
const puntiSpesi = $derived(STATI.reduce((s, k) => s + (COSTO[statsBase[k]] ?? 0), 0));
const puntiRimasti = $derived(27 - puntiSpesi);

const haClasseMarziale = $derived(classi.some((c) => ['Guerriero', 'Paladino', 'Ranger', 'Barbaro'].includes(c.classe)));

// ---------------------------------------------------------------- bozza PG -> motore
const bozza = $derived<Personaggio>({
	nome: nome || '(bozza)',
	player,
	background,
	allineamento,
	specie: specieSelezionata,
	classi: classi.filter((c) => c.classe),
	statsBase,
	aumenti: [
		...scelteStatRazziale.map((stat): AumentoStat => ({ tipo: 'stat', stat })),
		...aumentiAsi
	],
	tsScelte,
	abilitaScelte,
	competenzeExtraArmiArmature: [],
	equip: {
		armatura: equipArmatura || undefined,
		scudo: equipScudo || undefined
	},
	attacchiEquipaggiati: attacchiEquip,
	talenti,
	stiliCombattimento,
	opzioniDowntime: [],
	linguaggiScelti,
	strumentiScelti: [],
	hpTirati: null,
	note
});
const scheda = $derived(calcolaScheda(bozza));

// ---------------------------------------------------------------- azioni
function toggleAbilita(a: string) {
	if (abilitaScelte.includes(a)) abilitaScelte = abilitaScelte.filter((x) => x !== a);
	else if (abilitaScelte.length < opzioniAbilita.n) abilitaScelte = [...abilitaScelte, a];
}

function slotAsiUsati() {
	// ogni entry aumentiAsi consuma metà slot (+2 = un intero, due +1 = un intero)
	let statTot = aumentiAsi.length; // numero di +1
	return Math.ceil(statTot / 2);
}
const asiRimasti = $derived(numSlotAsi - slotAsiUsati() - talenti.length);

function aggiungiAumento(stat: StatKey, valore: number) {
	for (let i = 0; i < valore; i++) aumentiAsi = [...aumentiAsi, { tipo: 'stat', stat }];
}
function rimuoviAumento(stat: StatKey) {
	const idx = aumentiAsi.findLastIndex((a) => a.tipo === 'stat' && a.stat === stat);
	if (idx !== -1) aumentiAsi = [...aumentiAsi.slice(0, idx), ...aumentiAsi.slice(idx + 1)];
}
function contaAumenti(stat: StatKey) {
	return aumentiAsi.filter((a) => a.tipo === 'stat' && a.stat === stat).length;
}

function toggleArma(n: string) {
	if (attacchiEquip.includes(n)) attacchiEquip = attacchiEquip.filter((x) => x !== n);
	else if (attacchiEquip.length < 2) attacchiEquip = [...attacchiEquip, n];
}

async function caricaPerModifica(id: string, token: string | null) {
	const pg = (await leggiPg(id)) as Personaggio;
	nome = pg.nome ?? '';
	player = pg.player ?? '';
	background = pg.background ?? 'Strumenti';
	allineamento = pg.allineamento ?? '';
	specieSelezionata = pg.specie ?? '';
	classi = pg.classi?.length ? pg.classi : [{ classe: '', sottoclasse: undefined, livello: 1 }];
	statsBase = pg.statsBase ?? statsBase;
	aumentiAsi = (pg.aumenti ?? []).filter((a: AumentoStat) => a.tipo === 'stat');
	tsScelte = pg.tsScelte ?? [];
	abilitaScelte = pg.abilitaScelte ?? [];
	equipArmatura = pg.equip?.armatura ?? '';
	equipScudo = pg.equip?.scudo ?? '';
	attacchiEquip = pg.attacchiEquipaggiati ?? [];
	talenti = pg.talenti ?? [];
	stiliCombattimento = pg.stiliCombattimento ?? [];
	linguaggiScelti = pg.linguaggiScelti ?? [];
	note = pg.note ?? '';
	modificaId = id;
	modificaToken = token ?? leggiToken(id);
}

let modificaId = $state<string | null>(null);
let modificaToken = $state<string | null>(null);
$effect(() => {
	const id = page.url.searchParams.get('modifica');
	if (id && !modificaId) caricaPerModifica(id, leggiToken(id));
});

async function salva() {
	errore = '';
	salvataggio = true;
	try {
		if (modificaId && modificaToken) {
			const { salvaPg } = await import('$lib/api');
			const ok = await salvaPg(modificaId, modificaToken, bozza);
			if (ok) goto(`${base}/pg/${modificaId}`);
			else errore = 'Salvataggio fallito: token non valido.';
			return;
		}
		const { id, editToken } = await creaPg(bozza);
		salvaToken(id, editToken);
		goto(`${base}/pg/${id}`);
	} catch (e) {
		errore = 'Errore durante il salvataggio.';
		console.error(e);
	} finally {
		salvataggio = false;
	}
}

const passi = ['Identità', 'Specie', 'Classi', 'Statistiche', 'Competenze', 'Equip & Talent', 'Riepilogo'];
</script>

<svelte:head><title>{modificaId ? 'Modifica' : 'Crea'} personaggio · Schede Arcamis</title></svelte:head>

<h1 class="font-display text-3xl font-bold text-[#c89b3c]">{modificaId ? `Modifica: ${nome || '…'}` : 'Nuovo personaggio'}</h1>

<!-- stepper -->
<nav class="mt-6 flex flex-wrap gap-2">
	{#each passi as p, i}
		<button
			class="rounded-full px-3 py-1.5 text-xs font-semibold transition {step === i + 1
				? 'bg-[#241c0a] border border-[#8a6d28] text-white'
				: 'border border-[#3a2e14] text-[#a08848] hover:bg-[#161c26]'}"
			onclick={() => (step = i + 1)}
		>
			{i + 1}. {p}
		</button>
	{/each}
</nav>

<div class="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
	<!-- colonna form -->
	<div>
		{#if step === 1}
			<div class="card space-y-4">
				<div>
					<label class="label" for="nome">Nome del personaggio</label>
					<input id="nome" class="field" bind:value={nome} placeholder="Es. Aldric il Vagabondo" />
				</div>
				<div>
					<label class="label" for="player">Nome player</label>
					<input id="player" class="field" bind:value={player} />
				</div>
				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<label class="label" for="bg">Background</label>
						<select id="bg" class="field" bind:value={background}>
							<option>Linguaggi</option>
							<option>Linguaggio-Strumento</option>
							<option>Strumenti</option>
						</select>
					</div>
					<div>
						<label class="label" for="all">Allineamento</label>
						<select id="all" class="field" bind:value={allineamento}>
							{#each ['Legale Buono','Neutrale Buono','Caotico Buono','Legale Neutrale','Neutrale Puro','Caotico Neutrale','Legale Malvagio','Neutrale Malvagio','Caotico Malvagio'] as a}
								<option>{a}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>

		{:else if step === 2}
			<div class="card">
				<label class="label">Specie ({SPECIE.length} disponibili)</label>
				<select class="field" bind:value={specieSelezionata}>
					<option value="">— scegli —</option>
					{#each SPECIE as s}
						<option value={s.nome}>{s.nome}</option>
					{/each}
				</select>
				{#if specieInfo}
					<div class="mt-4 space-y-2 text-sm text-[#c4b58f]">
						<p><span class="text-[#786438]">Aumenti:</span> {specieInfo.aumentoCaratteristiche}</p>
						<p><span class="text-[#786438]">Velocità:</span> {specieInfo.velocita} m</p>
						{#if specieInfo.resistenze}<p class="whitespace-pre-line"><span class="text-[#786438]">Resistenze:</span> {specieInfo.resistenze}</p>{/if}
						<p><span class="text-[#786438]">Linguaggi:</span> {specieInfo.linguaggi}</p>
						{#if specieInfo.privilegi?.length}
							<ul class="list-disc pl-5">
								{#each specieInfo.privilegi as f}<li><strong>{f.nome}</strong>{#if f.dettaglio} — {f.dettaglio}{/if}</li>{/each}
							</ul>
						{/if}
						{#if aumentiRazziali.sceltaLibera > 0}
							<div class="mt-3 rounded-lg border border-[#8a6d28]/50 bg-[#c89b3c]/8 p-3">
								<p class="mb-2 font-semibold text-[#d4aa4a]">Scegli {aumentiRazziali.sceltaLibera} aumenti caratteristica:</p>
								<div class="flex flex-wrap gap-3">
									{#each Array(aumentiRazziali.sceltaLibera) as _, idx}
										<select
											class="field w-auto"
											bind:value={scelteStatRazziale[idx]}
											onchange={() => (scelteStatRazziale = [...scelteStatRazziale])}
										>
											<option value="">—</option>
											{#each STATI as k}<option value={k}>{NOMI_STATI[k]} +1</option>{/each}
										</select>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>

		{:else if step === 3}
			<div class="card space-y-4">
				{#each classi as c, i}
						<div class="flex flex-wrap items-end gap-3 rounded-lg border border-[#2c2210] p-3">
						<div class="min-w-40 grow">
							<label class="label">Classe {i + 1}</label>
							<select class="field" bind:value={c.classe} onchange={() => (c.sottoclasse = undefined)}>
								<option value="">— scegli —</option>
								{#each CLASSI as cl}<option value={cl.nome}>{cl.nome}</option>{/each}
							</select>
						</div>
						{#if c.classe && classeDef(c.classe)?.sottoclassi.length}
							{@const def = classeDef(c.classe)!}
							<div class="min-w-44 grow">
								<label class="label">Sottoclasse</label>
								<select class="field" bind:value={c.sottoclasse}>
									<option value="">— scegli —</option>
									{#each def.sottoclassi as sc}<option value={sc.nome}>{sc.nome}</option>{/each}
								</select>
							</div>
						{/if}
						<div>
							<label class="label">Livello</label>
							<input type="number" min="1" max="20" class="field w-20" bind:value={c.livello} />
						</div>
						<button
							class="btn-ghost mb-0.5 px-2 py-1 text-xs"
							onclick={() => (classi = classi.filter((_, j) => j !== i))}
							disabled={classi.length === 1}>✕</button
						>
					</div>
				{/each}
				<button class="btn-ghost" onclick={() => classi = [...classi, { classe: '', sottoclasse: undefined, livello: 1 }]}>
					+ Aggiungi classe
				</button>
			</div>

		{:else if step === 4}
			<div class="space-y-4">
				<div class="card">
					<div class="mb-3 flex items-center justify-between">
						<h3 class="font-display font-bold text-[#f0e6d2]">Point Buy</h3>
						<span class="text-sm {puntiRimasti === 0 ? 'text-[#7dbba0]' : puntiRimasti < 0 ? 'text-[#cc7766]' : 'text-[#c89b3c]'}">
							Punti rimasti: <strong>{puntiRimasti}</strong>/27
						</span>
					</div>
					<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
						{#each STATI as k}
							<div class="rounded-lg border border-[#2c2210] p-3 text-center">
								<p class="label !mb-2">{NOMI_STATI[k]}</p>
								<div class="flex items-center justify-center gap-2">
									<button class="btn-ghost size-8 !p-0" onclick={() => (statsBase[k] = Math.max(8, statsBase[k] - 1))}>−</button>
									<span class="w-10 text-center text-xl font-bold text-[#f0e6d2]">{statsBase[k]}</span>
									<button class="btn-ghost size-8 !p-0" onclick={() => (statsBase[k] = Math.min(15, statsBase[k] + 1))}>+</button>
								</div>
								<p class="mt-2 text-xs text-[#786438]">
									base {statsBase[k]}
									{#if aumentiRazziali.fissi[k]}<span class="text-[#c89b3c]"> +{aumentiRazziali.fissi[k]}</span>{/if}
									{#if scelteStatRazziale.filter((s) => s === k).length}
										<span class="text-[#c89b3c]"> +{scelteStatRazziale.filter((s) => s === k).length}</span>{/if}
									{#if contaAumenti(k)}<span class="text-[#66bbdd]"> +{contaAumenti(k)}</span>{/if}
									→ <strong class="text-[#e5dcc3]">{statsBase[k] + (aumentiRazziali.fissi[k] ?? 0) + scelteStatRazziale.filter((s) => s === k).length + contaAumenti(k)}</strong>
								</p>
							</div>
						{/each}
					</div>
					{#if aumentiRazziali.sceltaLibera > 0}
						<p class="mt-3 text-xs text-[#786438]">Gli aumenti di specie si scelgono nel passo 2.</p>
					{/if}
				</div>

				<div class="card">
					<h3 class="font-display font-bold text-[#f0e6d2]">
						Aumenti caratteristica & Talenti
						<span class="ml-2 text-sm font-normal {asiRimasti === 0 ? 'text-[#7dbba0]' : 'text-[#c89b3c]'}">{asiRimasti} slot disponibili</span>
					</h3>
					<p class="mt-1 text-xs text-[#786438]">Uno slot = +2 su una statistica, oppure +1 su due, oppure un talento.</p>
					<div class="mt-4 space-y-3">
						{#each STATI as k}
							<div class="flex items-center gap-3">
								<span class="w-28 text-sm text-[#c4b58f]">{NOMI_STATI[k]}</span>
								<button class="btn-ghost size-7 !p-0" onclick={() => rimuoviAumento(k)}>−</button>
								<span class="w-6 text-center font-bold text-[#66bbdd]">+{contaAumenti(k)}</span>
								<button class="btn-ghost size-7 !p-0" disabled={asiRimasti <= 0 && contaAumenti(k) % 2 === 0} onclick={() => aggiungiAumento(k, 1)}>+1</button>
								<button class="btn-ghost size-7 !p-0" disabled={asiRimasti <= 0} onclick={() => aggiungiAumento(k, 2)}>+2</button>
							</div>
						{/each}
					</div>
					<div class="mt-4">
						<label class="label">Talenti presi al posto degli ASI ({talenti.length}/{numSlotAsi})</label>
						<select
							class="field"
							onchange={(e) => {
								const v = (e.currentTarget as HTMLSelectElement).value;
								if (v && !talenti.includes(v) && asiRimasti > 0) talenti = [...talenti, v];
								(e.currentTarget as HTMLSelectElement).value = '';
							}}
						>
							<option value="">— aggiungi talento —</option>
							{#each TALENTI as t}<option value={t}>{t}</option>{/each}
						</select>
						{#if talenti.length}
							<div class="mt-2 flex flex-wrap gap-2">
								{#each talenti as t}
									<span class="inline-flex items-center gap-1 rounded-full border border-[#1a4455] bg-[#1a4455]/25 px-3 py-1 text-xs text-emerald-300">
										{t}
										<button class="text-[#4d99aa] hover:text-[#cc7766]" onclick={() => (talenti = talenti.filter((x) => x !== t))}>✕</button>
									</span>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>

		{:else if step === 5}
			<div class="card">
				{#if opzioniAbilita.n > 0}
					<h3 class="font-display font-bold text-[#f0e6d2]">
						Abilità da classe: scegli {opzioniAbilita.n}
						<span class="ml-2 text-sm font-normal text-[#c89b3c]">({abilitaScelte.length} selezionate)</span>
					</h3>
					<div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
						{#each opzioniAbilita.opzioni as opt}
							<button
								class="rounded-md border px-3 py-2 text-left text-sm transition {abilitaScelte.includes(opt)
									? 'border-[#8a6d28] bg-[#c89b3c]/10 text-[#e8c86a]'
									: 'border-[#3a2e14] text-[#c4b58f] hover:bg-[#161c26]'}"
								onclick={() => toggleAbilita(opt)}
							>
								{opt}
							</button>
						{/each}
					</div>
				{:else}
					<p class="text-[#a08848]">La prima classe non richiede scelte di abilità.</p>
				{/if}
				<p class="mt-4 text-xs text-[#786438]">
					Le competenze armi/armature arrivano automaticamente dalle tue classi e dalla specie.
				</p>
			</div>

		{:else if step === 6}
			<div class="space-y-4">
				<div class="card grid gap-4 sm:grid-cols-2">
					<div>
						<label class="label">Armatura indossata</label>
						<select class="field" bind:value={equipArmatura}>
							<option value="">— nessuna —</option>
							{#each ARMATURE.filter((w) => w.categoria?.toLowerCase().includes('armature')) as w}
								<option value={w.nome}>{w.nome} (CA +{w.bonusCA}, max Des {w.maxDes ?? '∞'})</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="label">Scudo</label>
						<select class="field" bind:value={equipScudo}>
							<option value="">— nessuno —</option>
							{#each ARMATURE.filter((w) => w.categoria?.toLowerCase().includes('scudo')) as w}
								<option value={w.nome}>{w.nome} (CA +{w.bonusCA})</option>
							{/each}
						</select>
					</div>
				</div>
				<div class="card">
					<label class="label">Armi equipaggiate ({attacchiEquip.length}/2)</label>
					<input class="field mb-3" placeholder="Cerca arma…" bind:value={filtroArma} />
					<div class="max-h-56 space-y-1 overflow-y-auto pr-1">
						{#each ARMI.filter((a) => !filtroArma || a.nome.toLowerCase().includes(filtroArma.toLowerCase())) as a}
							<button
								class="block w-full rounded border px-3 py-1.5 text-left text-sm transition {attacchiEquip.includes(a.nome)
									? 'border-[#8a6d28] bg-[#c89b3c]/10 text-[#e8c86a]'
									: 'border-[#2c2210] text-[#c4b58f] hover:bg-[#161c26]'}"
								onclick={() => toggleArma(a.nome)}
							>
								<strong>{a.nome}</strong>
								<span class="text-xs text-[#786438]">
									{a.dado} {a.tipoDanno} · {a.categoria}{a.proprieta ? ` · ${a.proprieta}` : ''}
								</span>
							</button>
						{/each}
					</div>
				</div>
				{#if haClasseMarziale}
					<div class="card">
						<label class="label">Stili di combattimento</label>
						<div class="flex flex-wrap gap-2">
							{#each ['Tiro', 'Difesa', 'Duellare', 'Armi Possenti', 'Due Armi', 'Lancio', 'Disarmato'] as stile}
								<button
									class="rounded-full border px-3 py-1.5 text-xs transition {stiliCombattimento.includes(stile)
										? 'border-[#8a6d28] bg-[#241c0a] border border-[#8a6d28]/30 text-[#e8c86a]'
										: 'border-[#3a2e14] text-[#a08848] hover:bg-[#161c26]'}"
									onclick={() =>
										(stiliCombattimento = stiliCombattimento.includes(stile)
											? stiliCombattimento.filter((s) => s !== stile)
											: [...stiliCombattimento, stile])}
								>
									{stile}
								</button>
							{/each}
						</div>
					</div>
				{/if}
				<div class="card">
					<label class="label">Note</label>
					<textarea class="field min-h-24" bind:value={note} placeholder="Storia, tratti, legami…"></textarea>
				</div>
			</div>

		{:else if step === 7}
			<div class="card space-y-4">
				<h3 class="font-display text-xl font-bold text-[#c89b3c]">Riepilogo</h3>
				<div class="grid gap-2 text-sm sm:grid-cols-2">
					<p><span class="text-[#786438]">Nome:</span> {nome || '—'}</p>
					<p><span class="text-[#786438]">Specie:</span> {specieSelezionata || '—'}</p>
					<p><span class="text-[#786438]">Classi:</span> {classi.filter((c) => c.classe).map((c) => `${c.classe}${c.sottoclasse ? ` (${c.sottoclasse})` : ''} ${c.livello}`).join(', ') || '—'}</p>
					<p><span class="text-[#786438]">Livello totale:</span> {scheda.livelloTotale} · Prof {scheda.bonusCompetenza >= 0 ? '+' : ''}{scheda.bonusCompetenza}</p>
					<p><span class="text-[#786438]">PF:</span> {scheda.pfMassimi} · <span class="text-[#786438]">CA:</span> {scheda.ca}</p>
					<p><span class="text-[#786438]">Velocità:</span> {scheda.velocita} m · <span class="text-[#786438]">Iniziativa:</span> {scheda.iniziativa >= 0 ? '+' : ''}{scheda.iniziativa}</p>
				</div>
				{#if scheda.avvisi.length}
					<div class="rounded-lg border border-[#552222]/70 bg-[#2a1210]/50 p-3 text-sm text-[#dd8877]">
						{#each scheda.avvisi as av}<p>⚠ {av}</p>{/each}
					</div>
				{/if}
				{#if errore}<p class="text-sm text-[#cc7766]">{errore}</p>{/if}
				<button class="btn-primary w-full py-3 text-base" onclick={salva} disabled={salvataggio}>
					{salvataggio ? 'Salvataggio…' : modificaId ? 'Salva modifiche' : 'Crea personaggio ✓'}
				</button>
			</div>
		{/if}

		<div class="mt-4 flex justify-between">
			<button class="btn-ghost" onclick={() => (step = Math.max(1, step - 1))} disabled={step === 1}>← Indietro</button>
			<button class="btn-primary" onclick={() => (step = Math.min(passi.length, step + 1))} disabled={step === passi.length}>Avanti →</button>
		</div>
	</div>

	<!-- anteprima live -->
	<aside class="lg:sticky lg:top-6 lg:self-start">
		<div class="card">
			<h3 class="font-display font-bold text-[#c89b3c]">Anteprima live</h3>
			<div class="mt-3 grid grid-cols-3 gap-2 text-center">
				<div class="rounded-lg bg-[#080a0e]/70 p-2"><p class="text-[10px] uppercase text-[#786438]">CA</p><p class="text-2xl font-bold text-[#f0e6d2]">{scheda.ca}</p></div>
				<div class="rounded-lg bg-[#080a0e]/70 p-2"><p class="text-[10px] uppercase text-[#786438]">PF</p><p class="text-2xl font-bold text-[#f0e6d2]">{Number.isNaN(scheda.pfMassimi) ? '–' : scheda.pfMassimi}</p></div>
				<div class="rounded-lg bg-[#080a0e]/70 p-2"><p class="text-[10px] uppercase text-[#786438]">Prof</p><p class="text-2xl font-bold text-[#f0e6d2]">{scheda.bonusCompetenza >= 0 ? '+' : ''}{scheda.bonusCompetenza}</p></div>
			</div>
			<table class="mt-4 w-full text-sm">
				<tbody>
					{#each STATI as k}
						<tr class="border-b border-[#1e1808]/60">
							<td class="py-1 text-[#a08848]">{NOMI_STATI[k].slice(0, 3).toUpperCase()}</td>
							<td class="py-1 text-right font-mono text-[#e5dcc3]">{Number.isNaN(scheda.punteggi[k]) ? '–' : scheda.punteggi[k]}</td>
							<td class="py-1 text-right font-mono {scheda.modificatori[k] >= 0 ? 'text-[#7dbba0]' : 'text-[#cc7766]'}">
								{Number.isNaN(scheda.modificatori[k]) ? '–' : (scheda.modificatori[k] >= 0 ? '+' : '') + scheda.modificatori[k]}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
			<p class="mt-3 text-xs text-[#786438]">Iniziativa {scheda.iniziativa >= 0 ? '+' : ''}{scheda.iniziativa} · Movimento {scheda.velocita} m</p>
		</div>
	</aside>
</div>
