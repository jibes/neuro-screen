<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { isTouchDevice } from '$lib/core/device.js';

	interface Props {
		instructions: string[];
		onComplete: () => void;
	}

	let { instructions, onComplete }: Props = $props();
	let currentPage = $state(0);
	const i = t();
	const touch = isTouchDevice();
	const isLast = $derived(currentPage === instructions.length - 1);

	function next() {
		if (isLast) onComplete();
		else currentPage++;
	}

	function back() {
		if (currentPage > 0) currentPage--;
	}

	/** Enter / → advances, ← goes back (buttons keep their native Enter/Space handling) */
	function onKeydown(e: KeyboardEvent) {
		if (e.repeat || e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement) return;
		if (e.key === 'Enter' || e.key === 'ArrowRight') {
			e.preventDefault();
			next();
		} else if (e.key === 'ArrowLeft') {
			e.preventDefault();
			back();
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

<div class="flex flex-col items-center justify-center min-h-[60vh] px-4 sm:px-8">
	<div class="max-w-xl w-full">
		<div class="bg-surface rounded-xl shadow-sm border border-slate-200 p-5 sm:p-8 mb-6 min-h-[8rem] flex items-center">
			<p class="text-base sm:text-lg text-slate-700 leading-relaxed" aria-live="polite">
				{instructions[currentPage]}
			</p>
		</div>

		<div class="flex items-center justify-between gap-4">
			<div class="flex items-center gap-1.5" aria-label="Seite {currentPage + 1} von {instructions.length}">
				{#each instructions as _, idx}
					<span
						class="h-1.5 rounded-full transition-all {idx === currentPage
							? 'w-5 bg-blue-600'
							: idx < currentPage
								? 'w-1.5 bg-blue-300'
								: 'w-1.5 bg-slate-300'}"
					></span>
				{/each}
			</div>
			<div class="flex gap-3">
				{#if currentPage > 0}
					<button
						onclick={back}
						class="px-4 py-3 sm:py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
					>
						{i.common.back}
					</button>
				{/if}
				<button
					onclick={next}
					class="px-6 py-3 sm:py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
				>
					{isLast ? i.common.start : i.common.next}
				</button>
			</div>
		</div>

		{#if !touch}
			<p class="mt-4 text-right text-xs text-slate-400">
				<kbd class="rounded border border-slate-300 px-1">Enter</kbd> weiter ·
				<kbd class="rounded border border-slate-300 px-1">←</kbd> zurück
			</p>
		{/if}
	</div>
</div>
