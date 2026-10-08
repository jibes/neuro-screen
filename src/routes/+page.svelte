<script lang="ts">
	import { base } from '$app/paths';
	import { t } from '$lib/i18n/index.js';
	import { TEST_CATEGORIES, ALL_TESTS } from '$lib/tests/registry.js';
	import { isTestCompleted } from '$lib/db/session-store.svelte.js';
	import InstallButton from '$lib/components/InstallButton.svelte';

	const i = t();
	const categories = TEST_CATEGORIES;

	const completedCount = $derived(ALL_TESTS.filter((test) => isTestCompleted(test.id)).length);
	const nextOpen = $derived(ALL_TESTS.find((test) => !isTestCompleted(test.id)) ?? null);
	const remainingMinutes = $derived(
		ALL_TESTS.filter((test) => !isTestCompleted(test.id)).reduce((sum, test) => sum + test.minutes, 0)
	);
</script>

<svelte:head>
	<title>NeuroScreen – Neuropsychologisches Screening</title>
</svelte:head>

<div class="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
	<div class="text-center mb-8">
		<h1 class="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{i.app.title}</h1>
		<p class="text-base sm:text-lg text-slate-500">{i.app.subtitle}</p>
	</div>

	<!-- Progress / next step: stacked on phones, side by side from md -->
	<section class="mb-10 rounded-xl border border-slate-200 bg-surface p-4 sm:p-5">
		<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
			<div class="min-w-0 md:flex-1">
				<div class="flex items-baseline justify-between gap-3">
					<p class="text-sm text-slate-500">Fortschritt dieser Sitzung</p>
					<p class="text-sm tabular-nums text-slate-500">{Math.round((completedCount / ALL_TESTS.length) * 100)} %</p>
				</div>
				<p class="mt-0.5 text-lg font-semibold text-slate-900">
					{completedCount} von {ALL_TESTS.length} Tests durchgeführt
				</p>
				<div
					class="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100"
					role="progressbar"
					aria-valuemin={0}
					aria-valuemax={ALL_TESTS.length}
					aria-valuenow={completedCount}
					aria-label="Fortschritt"
				>
					<div
						class="h-full rounded-full bg-blue-600 transition-[width] duration-500"
						style="width: {(completedCount / ALL_TESTS.length) * 100}%"
					></div>
				</div>
				{#if nextOpen}
					<p class="mt-2 text-xs text-slate-400">
						Noch ca. {remainingMinutes} Minuten · Tests einzeln und in beliebiger Reihenfolge möglich
					</p>
				{/if}
			</div>
			<!-- DOM order: secondary first; column-reverse puts the primary action on top on phones -->
			<div class="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap md:shrink-0 md:justify-end">
				<InstallButton />
				<a
					href="{base}/umgebung"
					class="px-4 py-2.5 sm:py-2 text-center text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
				>
					{i.nav.environment}
				</a>
				{#if nextOpen}
					<a
						href={nextOpen.href}
						class="px-4 py-2.5 sm:py-2 text-center text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
					>
						{completedCount === 0 ? 'Mit erstem Test beginnen' : `Weiter: ${nextOpen.name}`}
					</a>
				{:else}
					<a
						href="{base}/ergebnisse"
						class="px-4 py-2.5 sm:py-2 text-center text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
					>
						Ergebnisse ansehen
					</a>
				{/if}
			</div>
		</div>
	</section>

	{#each categories as category}
		<section class="mb-8">
			<h2 class="text-lg font-semibold text-slate-800 mb-3">{category.name}</h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
				{#each category.tests as test}
					{@const done = isTestCompleted(test.id)}
					<a
						href={test.href}
						class="group flex flex-col bg-surface rounded-xl border p-4 transition-all hover:shadow-sm hover:-translate-y-px {done
							? 'border-green-200'
							: 'border-slate-200 hover:border-blue-300'}"
					>
						<div class="flex items-start justify-between gap-2 mb-1">
							<h3 class="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{test.name}</h3>
							{#if done}
								<span class="shrink-0 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">
									<svg viewBox="0 0 20 20" class="h-3 w-3" fill="currentColor" aria-hidden="true"><path d="M8.1 14.3 3.8 10l1.4-1.4 2.9 2.9 6.7-6.7 1.4 1.4z" /></svg>
									erledigt
								</span>
							{/if}
						</div>
						<p class="text-sm text-slate-500 flex-1">{test.shortDesc}</p>
						<div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
							<span class="inline-flex items-center gap-1">
								<svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
								ca. {test.minutes} Min.
							</span>
							{#if test.note}
								<span class="text-amber-600">{test.note}</span>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		</section>
	{/each}
</div>
