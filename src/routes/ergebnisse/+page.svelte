<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n/index.js';
	import { getLatestSession, getTestRuns, clearAllData } from '$lib/db/database.js';
	import { exportSessionJSON, downloadFile } from '$lib/db/export.js';
	import { clearSession } from '$lib/db/session-store.svelte.js';
	import { getTestName } from '$lib/tests/registry.js';
	import type { TestRun, Session } from '$lib/db/models.js';

	const i = t();

	let session = $state<Session | null>(null);
	let testRuns = $state<TestRun[]>([]);
	let loading = $state(true);

	onMount(async () => {
		session = (await getLatestSession()) ?? null;
		if (session?.id) {
			testRuns = await getTestRuns(session.id);
		}
		loading = false;
	});

	async function handleExportJSON() {
		if (!session?.id) return;
		const json = await exportSessionJSON(session.id);
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		downloadFile(json, `neuroscreen-${timestamp}.json`, 'application/json');
	}

	async function handleClearAll() {
		if (confirm('Alle Daten unwiderruflich löschen?')) {
			await clearAllData();
			// The deleted session must not be reused; a fresh one is created on the next save
			clearSession();
			testRuns = [];
			session = null;
		}
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getKeyMetric(run: TestRun): string {
		try {
			return formatKeyMetric(run);
		} catch {
			return ''; // record from an older app version with a different summary shape
		}
	}

	function formatKeyMetric(run: TestRun): string {
		const s = run.summary;
		switch (s.type) {
			case 'go-nogo':
				return `d' = ${s.dPrime.toFixed(2)}, Genauigkeit: ${(s.accuracy * 100).toFixed(0)}%`;
			case 'flanker':
				return `Flanker-Effekt: ${s.flankerEffect.toFixed(0)} ms, Genauigkeit: ${(s.accuracy * 100).toFixed(0)}%`;
			case 'digit-span':
				return `Spanne vorwärts ${s.forwardSpan}, rückwärts ${s.backwardSpan}`;
			case 'stroop':
				return `Stroop-Effekt: ${s.stroopEffect.toFixed(0)} ms, Genauigkeit: ${(s.accuracy * 100).toFixed(0)}%`;
			case 'n-back':
				return `d' = ${s.dPrime.toFixed(2)}, Genauigkeit: ${(s.accuracy * 100).toFixed(0)}%`;
			case 'cpt':
				return `d' = ${s.dPrime.toFixed(2)}, RT: ${s.meanRtHits.toFixed(0)} ms`;
			case 'corsi':
				return `Blockspanne vorwärts ${s.forwardSpan}, rückwärts ${s.backwardSpan}`;
			case 'symbol-digit':
				return `Korrekt: ${s.totalCorrect}, Throughput: ${s.throughput.toFixed(2)}/s`;
			case 'trail-making':
				return `${s.variant}: ${(s.completionTimeMs / 1000).toFixed(1)} s, Fehler: ${s.errors}`;
			case 'wcst':
				return `Kategorien: ${s.categoriesCompleted}, Perseverative Fehler: ${s.perseverativeErrors}`;
			case 'tower':
				return `Minimal gelöst: ${s.problemsSolvedOptimally}/${s.totalProblems}, Planungszeit: ${(s.meanPlanningTime / 1000).toFixed(1)} s`;
			case 'word-list':
				return `Σ A1–A5: ${s.totalRecall}, A6: ${s.shortDelayFreeRecall}`;
			case 'delayed-recall':
				return `A7: ${s.delayedRecall}/${s.totalItems}, Behaltensquote ${(s.retentionRate * 100).toFixed(0)} %, Wiedererkennung ${s.recognitionHits}/${s.totalItems}`;
			case 'rey-figure':
				return `d' sofort: ${s.immediateDPrime.toFixed(2)}, verzögert: ${s.delayedDPrime.toFixed(2)}`;
			default:
				return '';
		}
	}
</script>

<svelte:head>
	<title>Ergebnisse · NeuroScreen</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
	<div class="flex flex-wrap items-center justify-between gap-3 mb-8">
		<h1 class="text-2xl font-bold text-slate-900">{i.results.title}</h1>
		{#if testRuns.length > 0}
			<div class="flex flex-wrap gap-2">
				<button
					onclick={handleExportJSON}
					class="px-4 py-2 text-sm whitespace-nowrap text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
				>
					{i.common.exportJSON}
				</button>
				<button
					onclick={handleClearAll}
					class="px-4 py-2 text-sm whitespace-nowrap text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
				>
					{i.common.deleteAll}
				</button>
			</div>
		{/if}
	</div>

	{#if loading}
		<p class="text-slate-400">Laden...</p>
	{:else if testRuns.length === 0}
		<div class="text-center py-16">
			<p class="text-slate-400 text-lg">{i.results.noResults}</p>
			<a
				href="{base}/"
				class="inline-block mt-4 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
			>
				Tests starten
			</a>
		</div>
	{:else}
		{#if session}
			<p class="text-sm text-slate-400 mb-6">
				{i.common.session} vom {formatDate(session.startedAt)}
			</p>
		{/if}

		<div class="space-y-3">
			{#each testRuns as run}
				<a
					href="{base}/ergebnisse/{run.id}"
					class="block bg-surface rounded-lg border border-slate-200 p-4 sm:p-5 hover:border-blue-300 hover:shadow-sm transition-all"
				>
					<div class="flex flex-wrap items-center justify-between gap-x-3 mb-1">
						<h3 class="font-medium text-slate-900">
							{getTestName(run.testId)}
						</h3>
						<span class="text-xs text-slate-400">
							{formatDate(run.completedAt)}
						</span>
					</div>
					<p class="text-sm text-slate-500">{getKeyMetric(run)}</p>
					{#if run.qualityFlags?.length}
						<p class="mt-1 text-xs text-red-600">&#9888; {run.qualityFlags.length} Hinweis{run.qualityFlags.length > 1 ? 'e' : ''} zur Datenqualität</p>
					{/if}
				</a>
			{/each}
		</div>
	{/if}
</div>
