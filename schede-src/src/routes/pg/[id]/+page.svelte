<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { calcolaScheda } from '$lib/engine/calc';
	import { NOMI_STATI, STATI } from '$lib/engine/rules';
	import type { StatKey } from '$lib/engine/rules';
	import type { Personaggio } from '$lib/types';
	import { leggiToken, rimuoviToken } from '$lib/tokenStore';
	import { leggiPg, salvaPg, eliminaPg } from '$lib/api';

	const id = page.params.id as string;

	let pg = $state<Personaggio | null>(null);
	let nonTrovato = $state(false);
	let token = $state<string | null>(null);
let copiato = $state(false);

	// campi di sessione
	let pfAttuali = $state<number | null>(null);
	let pfTemporanei = $state<number | null>(null);

	onMount(async () => {
		token = leggiToken(id);
		try {
			const dati = (await leggiPg(id)) as Personaggio;
			pg = dati;
			if (typeof dati.pfAttuali === 'number') pfAttuali = dati.pfAttuali;
			if (typeof dati.pfTemporanei === 'number') pfTemporanei = dati.pfTemporanei;
		} catch {
			nonTrovato = true;
		}
	});

	const scheda = $derived(pg ? calcolaScheda(pg) : null);
	const classiLabel = $derived(pg?.classi?.map((c) => `${c.classe}${c.sottoclasse ? ` (${c.sottoclasse})` : ''} ${c.livello}`).join(' · ') ?? '');

	async function salvaSessione() {
		if (!pg || !token) return;
		const ok = await salvaPg(id, token, { ...pg, pfAttuali, pfTemporanei });
		if (ok) {
			pg = { ...pg, pfAttuali, pfTemporanei };
		}
	}

	function copiaLink() {
		navigator.clipboard.writeText(`${window.location.origin}${base}/pg/${id}`);
		copiato = true;
		setTimeout(() => (copiato = false), 1500);
	}

	async function elimina() {
		if (!token || !confirm('Eliminare definitivamente questo personaggio?')) return;
		const ok = await eliminaPg(id, token);
		if (ok) {
			rimuoviToken(id);
			window.location.href = `${base}/`;
		}
	}

	function scaricaAvrae() {
		if (!scheda) return;
		const stats: Record<string, unknown> = {};
		for (const k of Object.keys(NOMI_STATI) as StatKey[]) {
			stats[k] = {
				name: NOMI_STATI[k],
				short: k.toUpperCase(),
				base: scheda.punteggi[k],
				mod: scheda.modificatori[k],
				save: scheda.ts[k].totale,
				saveProf: scheda.ts[k].competente,
				bonus: null,
				adv: false,
				dis: false
			};
		}
		const avrae = {
			type: 'avrae-character',
			version: 1,
			name: pg!.nome,
			description: `${pg!.specie} · ${(pg!.classi || []).map((c) => `${c.classe} ${c.livello}`).join('/')}`,
			stats,
			skills: scheda.abilita.map((a) => ({
				name: a.nome, stat: a.stat.toUpperCase(), value: a.totale, prof: a.competente ? 1 : 0, bonus: null
			})),
			attacks: scheda.attacchi.map((a) => ({
				name: a.nome, bonus: a.bonus.replace('+', ''), damage: a.danno.split('|')[0], details: [a.tipo, a.note].filter(Boolean).join(' · ')
			})),
			ac: scheda.ca,
			hpMax: scheda.pfMassimi,
			initiative: scheda.iniziativa,
			speed: `${scheda.velocita}m`,
			level: scheda.livelloTotale,
			profBonus: scheda.bonusCompetenza,
			spellcasting: {
				ability: scheda.incantesimi.caratteristica?.toUpperCase() || null,
				dc: scheda.incantesimi.cd,
				attackBonus: scheda.incantesimi.bonusAttacco,
				casterLevel: scheda.incantesimi.livelloIncantatore,
				slots: scheda.incantesimi.slot,
				pact: scheda.incantesimi.patto
			},
			languages: scheda.linguaggiTotali,
			consumables: [],
			note: 'Generato da Schede Arcamis.'
		};
		const blob = new Blob([JSON.stringify(avrae, null, 2)], { type: 'application/json' });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = `${(pg!.nome || 'pg').replace(/[^a-z0-9]/gi, '_')}-avrae.json`;
		a.click();
		URL.revokeObjectURL(a.href);
	}

	const fmt = (n: number) => (Number.isNaN(n) ? '–' : n >= 0 ? `+${n}` : `${n}`);
</script>

<svelte:head><title>{pg?.nome ?? 'Personaggio'} · Schede Arcamis</title></svelte:head>

{#if nonTrovato}
	<div class="card text-center"><p class="text-[#c4b58f]">Personaggio non trovato.</p><a href="{base}/" class="btn-primary mt-4">Torna alla lista</a></div>
{:else if !pg || !scheda}
	<p class="animate-pulse text-[#786438]">Caricamento…</p>
{:else}
	<!-- intestazione -->
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div>
			<h1 class="font-display text-4xl font-bold text-[#c89b3c]">{pg.nome}</h1>
			<p class="mt-1 text-[#c4b58f]">{pg.specie} · <span class="text-[#d4aa4a]">{classiLabel}</span></p>
			<p class="text-sm text-[#786438]">{pg.player} {pg.allineamento ? `· ${pg.allineamento}` : ''} {pg.background ? `· ${pg.background}` : ''}</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<button class="btn-ghost" onclick={copiaLink}>{copiato ? '✓ Copiato' : '🔗 Condividi'}</button>
			<button class="btn-ghost" onclick={scaricaAvrae}>🤖 Export Avrae</button>
			{#if token}
				<a class="btn-ghost" href="{base}/crea?modifica={id}">✏️ Modifica completo</a>
				<button class="btn border border-[#552222] text-[#cc7766] hover:bg-[#2a1210]/60" onclick={elimina}>🗑</button>
			{/if}
		</div>
	</div>

	{#if !token}
		<p class="mt-3 rounded-lg border border-[#2c2210] bg-[#0e121a]/70 px-3 py-2 text-xs text-[#786438]">
			Stai visualizzando questa scheda in sola lettura. Solo chi ha creato il personaggio può modificarlo.
		</p>
	{/if}

	{#if scheda.avvisi.length}
		<div class="mt-4 rounded-lg border border-[#552222]/70 bg-[#2a1210]/50 p-3 text-sm text-[#dd8877]">
			{#each scheda.avvisi as av}<p>⚠ {av}</p>{/each}
		</div>
	{/if}

	<!-- riga statistiche combattimento -->
	<div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
		<div class="card !p-3 text-center">
			<p class="label !mb-0">CA</p>
			<p class="text-3xl font-bold text-[#d4aa4a]">{scheda.ca}</p>
		</div>
		<div class="card !p-3 text-center sm:col-span-2">
			<p class="label !mb-0">Punti Ferita</p>
			<div class="flex items-center justify-center gap-2">
				<input
					type="number"
					class="field w-20 text-center text-xl font-bold"
					disabled={!token}
					value={pfAttuali ?? ''}
					placeholder={String(scheda.pfMassimi)}
					onchange={() => salvaSessione()}
				/>
				<span class="text-[#786438]">/ {scheda.pfMassimi}</span>
				<span class="text-xs text-[#786438]">+{pfTemporanei ?? 0} temp</span>
			</div>
			{#if token}
				<input type="number" class="field mt-2 w-20 text-center" placeholder="temp" value={pfTemporanei ?? ''} onchange={(e) => { pfTemporanei = parseInt((e.target as HTMLInputElement).value) || null; salvaSessione(); }} />
			{/if}
		</div>
		<div class="card !p-3 text-center">
			<p class="label !mb-0">Iniziativa</p>
			<p class="text-3xl font-bold text-[#f0e6d2]">{fmt(scheda.iniziativa)}</p>
		</div>
		<div class="card !p-3 text-center">
			<p class="label !mb-0">Velocità</p>
			<p class="text-3xl font-bold text-[#f0e6d2]">{scheda.velocita}<span class="text-sm text-[#786438]">m</span></p>
		</div>
	</div>

	<div class="mt-6 grid gap-6 lg:grid-cols-3">
		<!-- colonne sinistra: stats + TS + abilità -->
		<div class="space-y-6">
			<div class="grid grid-cols-3 gap-2">
				{#each STATI as k}
					{@const m = scheda.modificatori[k]}
					<div class="card !p-3 text-center">
						<p class="text-[10px] font-semibold uppercase tracking-wider text-[#786438]">{NOMI_STATI[k]}</p>
						<p class="text-2xl font-bold text-[#f0e6d2]">{Number.isNaN(scheda.punteggi[k]) ? '–' : scheda.punteggi[k]}</p>
						<p class="font-mono text-sm {m >= 0 ? 'text-[#7dbba0]' : 'text-[#cc7766]'}">{fmt(m)}</p>
					</div>
				{/each}
			</div>

			<div class="card">
				<h3 class="font-display mb-2 font-bold text-[#e5dcc3]">Tiri Salvezza</h3>
				<table class="w-full text-sm">
					<tbody>
						{#each STATI as k}
							<tr class="border-b border-[#1e1808]/50 last:border-0">
								<td class="py-1.5">
									<span class="mr-2 inline-block size-2.5 rounded-full align-middle {scheda.ts[k].competente ? 'bg-amber-500' : 'bg-stone-700'}"></span>
									<span class:text-[#f0e6d2]={scheda.ts[k].competente} class:text-[#a08848]={!scheda.ts[k].competente}>{NOMI_STATI[k]}</span>
								</td>
								<td class="py-1.5 text-right font-mono text-[#f0e6d2]">{fmt(scheda.ts[k].totale)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div class="card">
				<h3 class="font-display mb-2 flex items-center justify-between font-bold text-[#e5dcc3]">
					Abilità
					<span class="text-xs font-normal normal-case text-[#786438]">Passiva Percezione {scheda.percezionePassiva}</span>
				</h3>
				<table class="w-full text-sm">
					<tbody>
						{#each scheda.abilita as ab}
							<tr class="border-b border-[#1e1808]/50 last:border-0">
								<td class="py-1">
									<span class="mr-2 inline-block size-2.5 rounded-full align-middle {ab.competente ? 'bg-amber-500' : 'bg-stone-700'}"></span>
									<span class:text-[#f0e6d2]={ab.competente} class:text-[#a08848]={!ab.competente}>{ab.nome}</span>
									<span class="ml-1 text-[10px] uppercase text-[#5a4c28]">({NOMI_STATI[ab.stat].slice(0, 3)})</span>
								</td>
								<td class="py-1 text-right font-mono text-[#f0e6d2]">{fmt(ab.totale)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<!-- colonna centrale: attacchi -->
		<div class="space-y-6 lg:col-span-2">
			<div class="card overflow-x-auto">
				<h3 class="font-display mb-3 font-bold text-[#e5dcc3]">Attacchi</h3>
				{#if scheda.attacchi.length === 0}
					<p class="text-sm text-[#786438]">Nessuna arma equipaggiata.</p>
				{:else}
					<table class="w-full min-w-[480px] text-sm">
						<thead>
							<tr class="text-left text-[10px] uppercase tracking-wider text-[#786438]">
								<th class="pb-2">Nome</th>
								<th class="pb-2 text-right">Bonus</th>
								<th class="pb-2 text-left">Danno / Tipo</th>
							</tr>
						</thead>
						<tbody>
							{#each scheda.attacchi as a}
								<tr class="border-t border-[#1e1808]/50">
									<td class="py-2 pr-2">
										<strong class="text-[#f0e6d2]">{a.nome}</strong>
										{#if a.note}<p class="text-[11px] leading-tight text-[#786438]">{a.note}</p>{/if}
									</td>
									<td class="py-2 pl-2 text-right font-mono text-[#d4aa4a]">{a.bonus}</td>
									<td class="py-2 pl-4 font-mono text-[#e5dcc3]">
										{a.danno}{#if a.tipo}<span class="text-[10px] uppercase text-[#786438]"> [{a.tipo}]</span>{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
				<p class="mt-3 text-xs text-[#5a4c28]">Proficienza bonus +{scheda.bonusCompetenza} · Dadi vita: {scheda.dadiVita || '—'}</p>
			</div>

			{#if scheda.incantesimi.cd !== null}
				<div class="card">
					<h3 class="font-display mb-3 font-bold text-[#e5dcc3]">Incantesimi</h3>
					<div class="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
						<div class="rounded-lg bg-[#080a0e]/70 p-3"><p class="text-[10px] uppercase text-[#786438]">CD TS</p><p class="text-xl font-bold text-[#aa88ee]">{scheda.incantesimi.cd}</p></div>
						<div class="rounded-lg bg-[#080a0e]/70 p-3"><p class="text-[10px] uppercase text-[#786438]">Bonus Attacco</p><p class="text-xl font-bold text-[#aa88ee]">{fmt(scheda.incantesimi.bonusAttacco ?? 0)}</p></div>
						<div class="rounded-lg bg-[#080a0e]/70 p-3"><p class="text-[10px] uppercase text-[#786438]">Caratteristica</p><p class="text-xl font-bold text-[#aa88ee]">{scheda.incantesimi.caratteristica ? NOMI_STATI[scheda.incantesimi.caratteristica] : '—'}</p></div>
						<div class="rounded-lg bg-[#080a0e]/70 p-3"><p class="text-[10px] uppercase text-[#786438]">Liv. Incantatore</p><p class="text-xl font-bold text-[#aa88ee]">{scheda.incantesimi.livelloIncantatore}</p></div>
					</div>
					{#if scheda.incantesimi.slot.length}
						<p class="mt-3 text-sm text-[#a08848]">
							<span class="text-[#786438]">Slot:</span>
							{#each scheda.incantesimi.slot as n, i}
								<span class="mx-1 inline-flex items-center gap-1 rounded-full border border-[#442a77] bg-[#2a1a4d]/40 px-2 py-0.5 text-xs text-[#aa88ee]">
									{i + 1}° × {n}
								</span>
							{/each}
						</p>
					{/if}
					{#if scheda.incantesimi.patto}
						<p class="mt-2 text-sm text-[#a08848]">
							<span class="text-[#786438]">Magia del Patto:</span> slot di {scheda.incantesimi.patto.livelloIncantesimo}° livello × {scheda.incantesimi.patto.slot}
						</p>
					{/if}
					<p class="mt-2 text-xs text-[#786438]">
						{#if scheda.incantesimi.trucchettiNota}Trucchetti noti: {scheda.incantesimi.trucchettiNota}. {/if}
						{#if scheda.incantesimi.preparatiNota}Preparati: {scheda.incantesimi.preparatiNota}. {/if}
						{#if scheda.incantesimi.incantesimiNotaBardo}Bardo — incantesimi noti: {scheda.incantesimi.incantesimiNotaBardo}. {/if}
						{#if scheda.incantesimi.incantesimiNotaStregone}Stregone — incantesimi noti: {scheda.incantesimi.incantesimiNotaStregone}.{/if}
					</p>
				</div>
			{/if}

			<div class="card">
				<h3 class="font-display mb-3 font-bold text-[#e5dcc3]">Privilegi & Tratti</h3>
				<ul class="max-h-96 space-y-1 overflow-y-auto pr-1 text-sm">
					{#each scheda.privilegi as pr}
						<li class="flex gap-2 border-b border-[#1e1808]/40 py-1 last:border-0">
							<span class="shrink-0 rounded bg-stone-800 px-1.5 py-0.5 text-[10px] font-bold text-[#c89b3c]">{pr.livello}°</span>
							<span class="text-[#c4b58f]">{pr.testo}</span>
							<span class="ml-auto shrink-0 text-[10px] text-[#5a4c28]">{pr.fonte}</span>
						</li>
					{/each}
				</ul>
			</div>

			{#if pg.note || scheda.caDettaglio.length}
				<div class="card">
					{#if scheda.caDettaglio.length}
						<p class="text-xs text-[#786438]">CA dettaglio: {scheda.caDettaglio.join(' · ')} (senza armatura: {scheda.caSenzaArmatura})</p>
					{/if}
					{#if pg.note}<p class="mt-2 whitespace-pre-line text-sm text-[#c4b58f]">{pg.note}</p>{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}
