<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n/index.js';
	import { getLatestSession } from '$lib/db/database.js';
	import { getTestRuns } from '$lib/db/database.js';
	import { exportSessionJSON, downloadFile } from '$lib/db/export.js';
	import { clearAllData } from '$lib/db/database.js';
	import type { TestRun, Session } from '$lib/db/models.js';

	const i = t();

	let session = $state<Session | null>(null);
	let testRuns = $state<TestRun[]>([]);
	let loading = $state(true);

	const testNameMap: Record<string, string> = {
		'go-nogo': i.tests.goNogo.name,
		'flanker': i.tests.flanker.name,
		'digit-span': i.tests.digitSpan.name,
		'stroop': i.tests.stroop.name,
		'n-back': i.tests.nBack.name,
		'cpt': i.tests.cpt.name,
		'corsi': i.tests.corsi.name,
		'symbol-digit': i.tests.symbolDigit.name,
		'trail-making-a': i.tests.trailMakingA.name,
		'trail-making-b': i.tests.trailMakingB.name,
		'wcst': i.tests.wcst.name,
		'tower': i.tests.tower.name,
		'word-list': i.tests.wordList.name,
		'delayed-recall': i.tests.delayedRecall.name,
		'rey-figure': i.tests.reyFigure.name
	};

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
		if (confirm('Alle Daten unwiderruflich loeschen?')) {
			await clearAllData();
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
		const s = run.summary;
		switch (s.type) {
			case 'go-nogo':
				return `d' = ${s.dPrime.toFixed(2)}, Genauigkeit: ${(s.accuracy * 100).toFixed(0)}%`;
			case 'flanker':
				return `Flanker-Effekt: ${s.flankerEffect.toFixed(0)} ms, Genauigkeit: ${(s.accuracy * 100).toFixed(0)}%`;
			case 'digit-span':
				return `Spanne: ${s.forwardSpan}`;
			case 'stroop':
				return `Stroop-Effekt: ${s.stroopEffect.toFixed(0)} ms, Genauigkeit: ${(s.accuracy * 100).toFixed(0)}%`;
			case 'n-back':
				return `d' = ${s.dPrime.toFixed(2)}, Genauigkeit: ${(s.accuracy * 100).toFixed(0)}%`;
			case 'cpt':
				return `d' = ${s.dPrime.toFixed(2)}, RT: ${s.meanRtHits.toFixed(0)} ms`;
			case 'corsi':
				return `Spanne: ${s.forwardSpan}, Score: ${s.totalScore}`;
			case 'symbol-digit':
				return `Korrekt: ${s.totalCorrect}, Throughput: ${s.throughput.toFixed(2)}/s`;
			case 'trail-making':
				return `${s.variant}: ${(s.completionTimeMs / 1000).toFixed(1)} s, Fehler: ${s.errors}`;
			case 'wcst':
				return `Kategorien: ${s.categoriesCompleted}, Perseverative Fehler: ${s.perseverativeErrors}`;
			case 'tower':
				return `Geloest: ${s.problemsSolved}/${s.totalProblems}, Planungszeit: ${(s.meanPlanningTime / 1000).toFixed(1)} s`;
			case 'word-list':
				return `Gelernt: ${s.totalLearned}/15, d' = ${s.dPrimeRecognition.toFixed(2)}`;
			case 'delayed-recall':
				return `Abruf: ${s.delayedRecall}/${s.totalItems}, Behaltenrate: ${(s.retentionRate * 100).toFixed(0)}%`;
			case 'rey-figure':
				return `Kopie: ${s.copyScore}/24, Abruf: ${s.recallScore}/24`;
			default:
				return '';
		}
	}
</script>

<div class="max-w-3xl mx-auto px-6 py-10">
	<div class="flex items-center justify-between mb-8">
		<h1 class="text-2xl font-bold text-slate-900">{i.results.title}</h1>
		{#if testRuns.length > 0}
			<div class="flex gap-2">
				<button
					onclick={handleExportJSON}
					class="px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
				>
					{i.common.exportJSON}
				</button>
				<button
					onclick={handleClearAll}
					class="px-4 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
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
				href="/"
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
					href="/ergebnisse/{run.id}"
					class="block bg-white rounded-lg border border-slate-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all"
				>
					<div class="flex items-center justify-between mb-1">
						<h3 class="font-medium text-slate-900">
							{testNameMap[run.testId] ?? run.testId}
						</h3>
						<span class="text-xs text-slate-400">
							{formatDate(run.completedAt)}
						</span>
					</div>
					<p class="text-sm text-slate-500">{getKeyMetric(run)}</p>
				</a>
			{/each}
		</div>
	{/if}
</div>
