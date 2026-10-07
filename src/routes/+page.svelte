<script lang="ts">
	import { base } from '$app/paths';
	import { t } from '$lib/i18n/index.js';
	import { TEST_CATEGORIES } from '$lib/tests/registry.js';
	import { isTestCompleted } from '$lib/db/session-store.svelte.js';

	const i = t();
	const categories = TEST_CATEGORIES;
</script>

<div class="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
	<div class="text-center mb-10">
		<h1 class="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{i.app.title}</h1>
		<p class="text-base sm:text-lg text-slate-500">{i.app.subtitle}</p>
	</div>

	<div class="mb-8">
		<a
			href="{base}/umgebung"
			class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
		>
			{i.nav.environment}
		</a>
	</div>

	{#each categories as category}
		<div class="mb-8">
			<h2 class="text-lg font-semibold text-slate-800 mb-3">{category.name}</h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
				{#each category.tests as test}
					<a
						href={test.href}
						class="block bg-white rounded-lg border border-slate-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
					>
						<div class="flex items-start justify-between gap-2 mb-1">
							<h3 class="font-medium text-slate-900">{test.name}</h3>
							{#if isTestCompleted(test.id)}
								<span class="text-xs text-green-600 whitespace-nowrap">&#10003; durchgefuehrt</span>
							{/if}
						</div>
						<p class="text-sm text-slate-500">{test.shortDesc}</p>
					</a>
				{/each}
			</div>
		</div>
	{/each}
</div>
