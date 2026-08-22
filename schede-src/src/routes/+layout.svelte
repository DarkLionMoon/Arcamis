<script lang="ts">
	import '../app.css';
	import { base } from '$app/paths';
	let { children } = $props();
</script>

<header class="border-b border-[#2c2210] bg-[#0c0f15]/80 backdrop-blur">
	<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
		<a href="{base}/" class="flex items-center gap-3 hover:opacity-90">
			<div
				class="flex size-9 items-center justify-center rounded-md border border-[#8a6d28] font-display text-lg font-bold text-[#f5e4a8]"
				style="background:linear-gradient(180deg,#3a2e14,#241c0a);text-shadow:0 0 10px rgba(200,155,60,.4)"
			>
				A
			</div>
			<div style="line-height:1.05">
				<div class="font-display text-base font-bold tracking-wide text-[#d4aa4a]">SCHEDA PG</div>
				<div class="text-[10px] uppercase tracking-[0.2em] text-[#786438]">Arcamis</div>
			</div>
		</a>
		<a href="{base}/crea" class="btn-primary !py-1.5">+ Nuovo PG</a>
	</div>
</header>

<main class="mx-auto max-w-6xl px-4 py-8">
	{@render children()}
</main>

<footer class="border-t border-[#1e1808]/60 py-6 text-center text-xs text-[#483c1c]">
	Arcamis · Scheda PG automatica — <span class="text-[#786438]" style="font-family:'Cinzel',serif">D&amp;D 5e homebrew</span>
</footer>
