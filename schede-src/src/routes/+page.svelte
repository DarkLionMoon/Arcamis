<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { listaPg, leggiConfig } from '$lib/api';

	interface RigaPG {
		id: string;
		nome: string;
		specie: string;
		livello: number;
		classi: { classe: string; livello: number }[];
		aggiornatoIl: string;
	}

	let pgs: RigaPG[] = $state([]);
	let caricamento = $state(true);
	let erroreCaricamento = $state(false);
	let intro = $state('');

	onMount(async () => {
		try {
			const [lista, cfg] = await Promise.all([listaPg(), leggiConfig()]);
			pgs = lista;
			intro = cfg.intro;
		} catch {
			erroreCaricamento = true;
		}
		caricamento = false;
	});

	const classiLabel = (pg: RigaPG) => (pg.classi || []).map((c) => `${c.classe} ${c.livello}`).join(' / ');
</script>

<svelte:head><title>Schede Arcamis</title></svelte:head>

<div class="mb-6">
	<h1 class="font-display text-3xl font-bold text-[#d4aa4a]" style="text-shadow:0 0 22px rgba(200,155,60,.25)">I tuoi personaggi</h1>
	<p class="mt-1 text-sm text-[#786438]">{intro || 'Schede automatiche — i valori si calcolano da soli.'}</p>
</div>
</div>

{#if caricamento}
	<p class="text-[#786438]">Caricamento…</p>
{:else if erroreCaricamento}
	<div class="card text-center">
		<p class="text-[#dd8877]">Impossibile contattare il server. Riprova più tardi.</p>
	</div>
{:else if pgs.length === 0}
	<div class="card text-center">
		<p class="text-[#c4b58f]">Nessun personaggio ancora.</p>
		<a href="{base}/crea" class="btn-primary mt-4">Crea il primo PG</a>
	</div>
{:else}
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each pgs as pg (pg.id)}
			<a href="{base}/pg/{pg.id}" class="card group transition hover:border-[#8a6d28]/60 hover:bg-[#10141c]">
				<h2 class="font-display text-xl font-bold text-[#f0e6d2] group-hover:text-[#d4aa4a]">{pg.nome}</h2>
				<p class="mt-1 text-sm text-[#a08848]">{pg.specie}</p>
				<p class="mt-1 text-sm font-semibold text-[#b08830]">{classiLabel(pg)}</p>
				<p class="mt-3 text-xs text-[#5a4c28]">Livello {pg.livello} · aggiornato {pg.aggiornatoIl}</p>
			</a>
		{/each}
	</div>
{/if}

<section class="mt-10 card border-[#8a6d28]/30 bg-[#c89b3c]/5">
	<h3 class="font-display text-lg font-bold text-[#d4aa4a]">Come funzionano i link di modifica</h3>
	<p class="mt-2 text-sm leading-relaxed text-[#a08848]">
		Ogni scheda è visibile a chiunque abbia il link <code class="text-[#c89b3c]">/pg/&lt;id&gt;</code>.
		Quando crei o apri in modifica una scheda, il browser conserva un <strong>token segreto</strong> che ti
		permette di salvarla: condividi pure il link della scheda, ma il token resta solo tuo.
	</p>
</section>
