<script lang="ts">
	import { t } from '$lib/i18n/index.js';

	interface Props {
		instructions: string[];
		onComplete: () => void;
	}

	let { instructions, onComplete }: Props = $props();
	let currentPage = $state(0);
	const i = t();
	const isLast = $derived(currentPage === instructions.length - 1);
</script>

<div class="flex flex-col items-center justify-center min-h-[60vh] px-8">
	<div class="max-w-xl w-full">
		<div class="bg-white rounded-lg shadow-sm border border-slate-200 p-8 mb-6">
			<p class="text-lg text-slate-700 leading-relaxed">
				{instructions[currentPage]}
			</p>
		</div>

		<div class="flex items-center justify-between">
			<div class="text-sm text-slate-400">
				{currentPage + 1} / {instructions.length}
			</div>
			<div class="flex gap-3">
				{#if currentPage > 0}
					<button
						onclick={() => currentPage--}
						class="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
					>
						{i.common.back}
					</button>
				{/if}
				{#if isLast}
					<button
						onclick={onComplete}
						class="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
					>
						{i.common.start}
					</button>
				{:else}
					<button
						onclick={() => currentPage++}
						class="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
					>
						{i.common.next}
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>
