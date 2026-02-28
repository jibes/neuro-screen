<script lang="ts">
	import { t } from '$lib/i18n/index.js';

	interface Metric {
		label: string;
		value: string | number;
		unit?: string;
		highlight?: boolean;
	}

	interface Props {
		testName: string;
		metrics: Metric[];
		onNext?: () => void;
		onOverview?: () => void;
	}

	let { testName, metrics, onNext, onOverview }: Props = $props();
	const i = t();
</script>

<div class="flex flex-col items-center justify-center min-h-[60vh] px-8">
	<div class="max-w-lg w-full">
		<h2 class="text-2xl font-semibold text-slate-900 mb-2">{i.common.testComplete}</h2>
		<h3 class="text-lg text-slate-500 mb-6">{testName}</h3>

		<div class="bg-white rounded-lg shadow-sm border border-slate-200 divide-y divide-slate-100">
			{#each metrics as metric}
				<div class="flex justify-between items-center px-5 py-3">
					<span class="text-sm text-slate-600">{metric.label}</span>
					<span
						class="text-sm font-medium {metric.highlight
							? 'text-blue-600'
							: 'text-slate-900'}"
					>
						{metric.value}{metric.unit ? ` ${metric.unit}` : ''}
					</span>
				</div>
			{/each}
		</div>

		<div class="flex gap-3 mt-6 justify-end">
			{#if onOverview}
				<button
					onclick={onOverview}
					class="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
				>
					{i.common.backToOverview}
				</button>
			{/if}
			{#if onNext}
				<button
					onclick={onNext}
					class="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
				>
					{i.common.nextTest}
				</button>
			{/if}
		</div>
	</div>
</div>
