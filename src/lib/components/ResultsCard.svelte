<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { base } from '$app/paths';
	import { getLastQualityFlags } from '$lib/db/session-store.svelte.js';

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

<div class="flex flex-col items-center justify-center min-h-[60vh] px-4 sm:px-8 py-8">
	<div class="max-w-lg w-full">
		<h2 class="text-2xl font-semibold text-slate-900 mb-2">{i.common.testComplete}</h2>
		<h3 class="text-lg text-slate-500 mb-6">{testName}</h3>

		<div class="bg-surface rounded-lg shadow-sm border border-slate-200 divide-y divide-slate-100">
			{#each metrics as metric}
				<div class="flex justify-between items-center gap-4 px-4 sm:px-5 py-3">
					<span class="text-sm text-slate-600">{metric.label}</span>
					<span
						class="text-sm font-medium text-right {metric.highlight
							? 'text-blue-600'
							: 'text-slate-900'}"
					>
						{metric.value}{metric.unit ? ` ${metric.unit}` : ''}
					</span>
				</div>
			{/each}
		</div>

		{#if getLastQualityFlags().length > 0}
			<div class="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
				<p class="font-medium mb-1">Hinweise zur Datenqualität</p>
				<ul class="list-disc pl-5">
					{#each getLastQualityFlags() as flag}
						<li>{flag}</li>
					{/each}
				</ul>
			</div>
		{/if}

		<p class="mt-4 text-xs text-slate-400">
			Rohwerte ohne Normvergleich – keine Diagnose. <a href="{base}/methodik" class="underline hover:text-slate-600">Zur Methodik</a>
		</p>

		<div class="flex flex-wrap gap-3 mt-6 justify-end">
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
