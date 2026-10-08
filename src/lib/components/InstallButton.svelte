<script lang="ts">
	import { pwa, promptInstall } from '$lib/pwa.svelte.js';

	let showIosHint = $state(false);
</script>

{#if pwa.canPrompt}
	<button
		type="button"
		onclick={promptInstall}
		class="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
	>
		<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>
		App installieren
	</button>
{:else if pwa.needsManualIos}
	<div class="relative w-full sm:w-auto">
		<button
			type="button"
			onclick={() => (showIosHint = !showIosHint)}
			aria-expanded={showIosHint}
			class="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
		>
			<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>
			App installieren
		</button>
		{#if showIosHint}
			<div
				class="absolute right-0 z-30 mt-2 w-64 rounded-lg border border-slate-200 bg-surface p-3 text-sm text-slate-600 shadow-lg"
				role="dialog"
				aria-label="Installationsanleitung"
			>
				Tippen Sie in Safari auf
				<svg viewBox="0 0 24 24" class="inline h-4 w-4 align-text-bottom" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="Teilen"><path d="M12 15V3M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg>
				<strong>Teilen</strong> und dann auf <strong>„Zum Home-Bildschirm“</strong>.
			</div>
		{/if}
	</div>
{/if}
