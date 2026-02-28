<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { gatherEnvironmentInfo, evaluateEnvironment, type EnvironmentCheck } from '$lib/core/environment-check.js';

	const i = t();
	let checks = $state<EnvironmentCheck[]>([]);
	let loading = $state(false);
	let done = $state(false);

	async function runCheck() {
		loading = true;
		const info = await gatherEnvironmentInfo();
		checks = evaluateEnvironment(info);
		loading = false;
		done = true;
	}

	const hasWarnings = $derived(checks.some((c) => c.status !== 'ok'));
</script>

<div class="max-w-2xl mx-auto px-6 py-10">
	<h1 class="text-2xl font-bold text-slate-900 mb-2">{i.environment.title}</h1>
	<p class="text-slate-500 mb-8">{i.environment.description}</p>

	{#if !done}
		<button
			onclick={runCheck}
			disabled={loading}
			class="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
		>
			{loading ? 'Wird geprueft...' : i.environment.runCheck}
		</button>
	{:else}
		<div class="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
			{#each checks as check}
				<div class="flex items-center justify-between px-5 py-3">
					<div class="flex items-center gap-3">
						<span
							class="w-2.5 h-2.5 rounded-full {check.status === 'ok'
								? 'bg-green-500'
								: check.status === 'warning'
									? 'bg-amber-500'
									: 'bg-red-500'}"
						></span>
						<span class="text-sm text-slate-700">{check.label}</span>
					</div>
					<div class="text-right">
						<span class="text-sm font-medium text-slate-900">{check.value}</span>
						{#if check.detail}
							<p class="text-xs text-slate-400 mt-0.5">{check.detail}</p>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<div class="mt-6">
			{#if !hasWarnings}
				<p class="text-sm text-green-600 mb-4">{i.environment.allGood}</p>
			{:else}
				<p class="text-sm text-amber-600 mb-4">{i.environment.warnings}</p>
			{/if}
			<a
				href="/"
				class="inline-flex px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
			>
				{hasWarnings ? i.environment.startAnyway : i.common.backToOverview}
			</a>
		</div>
	{/if}
</div>
