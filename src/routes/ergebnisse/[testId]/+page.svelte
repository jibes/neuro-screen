<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { t } from '$lib/i18n/index.js';
	import { getTestRun, getTrials } from '$lib/db/database.js';
	import { trialsToCSV, downloadFile } from '$lib/db/export.js';
	import type { TestRun, TrialData } from '$lib/db/models.js';

	const i = t();

	let testRun = $state<TestRun | null>(null);
	let trials = $state<TrialData[]>([]);
	let loading = $state(true);

	const testId = $derived(Number(page.params.testId));

	onMount(async () => {
		if (!isNaN(testId)) {
			testRun = (await getTestRun(testId)) ?? null;
			if (testRun?.id) {
				trials = await getTrials(testRun.id);
			}
		}
		loading = false;
	});

	function handleExportCSV() {
		if (trials.length === 0) return;
		const csv = trialsToCSV(trials);
		downloadFile(csv, `${testRun?.testId ?? 'test'}-trials.csv`, 'text/csv');
	}

	function getSummaryEntries(): Array<{ label: string; value: string }> {
		if (!testRun) return [];
		const s = testRun.summary;
		const entries: Array<{ label: string; value: string }> = [];

		switch (s.type) {
			case 'go-nogo':
				entries.push(
					{ label: 'Gesamtdurchgaenge', value: `${s.totalTrials}` },
					{ label: 'Go-Durchgaenge', value: `${s.goTrials}` },
					{ label: 'No-Go-Durchgaenge', value: `${s.noGoTrials}` },
					{ label: 'Treffer', value: `${s.hits}` },
					{ label: 'Korrekte Zurueckweisungen', value: `${s.correctRejections}` },
					{ label: i.results.commissionErrors, value: `${s.commissionErrors}` },
					{ label: i.results.omissionErrors, value: `${s.omissionErrors}` },
					{ label: `RT ${i.common.mean}`, value: `${s.meanRtHits.toFixed(0)} ms` },
					{ label: `RT ${i.common.median}`, value: `${s.medianRtHits.toFixed(0)} ms` },
					{ label: `RT ${i.common.sd}`, value: `${s.sdRtHits.toFixed(0)} ms` },
					{ label: i.common.accuracy, value: `${(s.accuracy * 100).toFixed(1)}%` },
					{ label: i.results.dPrime, value: s.dPrime.toFixed(2) },
					{ label: 'Response Bias (c)', value: s.responseBias.toFixed(2) }
				);
				break;
			case 'flanker':
				entries.push(
					{ label: 'Gesamtdurchgaenge', value: `${s.totalTrials}` },
					{ label: 'RT kongruent', value: `${s.meanRtCongruent.toFixed(0)} ms` },
					{ label: 'RT inkongruent', value: `${s.meanRtIncongruent.toFixed(0)} ms` },
					{ label: i.results.flankerEffect, value: `${s.flankerEffect.toFixed(0)} ms` },
					{ label: 'Fehler (kongruent)', value: `${s.errorsCongruent}` },
					{ label: 'Fehler (inkongruent)', value: `${s.errorsIncongruent}` },
					{ label: i.common.accuracy, value: `${(s.accuracy * 100).toFixed(1)}%` }
				);
				break;
			case 'digit-span':
				entries.push(
					{ label: i.results.forwardSpan, value: `${s.forwardSpan}` },
					{ label: 'Korrekte Durchgaenge', value: `${s.forwardTrialsCorrect}` },
					{ label: 'Gesamtdurchgaenge', value: `${s.forwardTotalTrials}` },
					{ label: 'Score', value: `${s.forwardScore}` }
				);
				break;
			case 'stroop':
				entries.push(
					{ label: 'RT kongruent', value: `${s.meanRtCongruent.toFixed(0)} ms` },
					{ label: 'RT inkongruent', value: `${s.meanRtIncongruent.toFixed(0)} ms` },
					{ label: 'RT neutral', value: `${s.meanRtNeutral.toFixed(0)} ms` },
					{ label: i.results.stroopEffect, value: `${s.stroopEffect.toFixed(0)} ms` },
					{ label: 'Interferenz', value: `${s.stroopInterference.toFixed(0)} ms` },
					{ label: 'Fazilitation', value: `${s.stroopFacilitation.toFixed(0)} ms` },
					{ label: 'Fehler (kongruent)', value: `${s.errorsCongruent}` },
					{ label: 'Fehler (inkongruent)', value: `${s.errorsIncongruent}` },
					{ label: 'Fehler (neutral)', value: `${s.errorsNeutral}` },
					{ label: i.common.accuracy, value: `${(s.accuracy * 100).toFixed(1)}%` }
				);
				break;
			case 'n-back':
				entries.push(
					{ label: 'N-Level', value: `${s.nLevel}` },
					{ label: 'Gesamtdurchgaenge', value: `${s.totalTrials}` },
					{ label: i.results.hits, value: `${s.hits}` },
					{ label: i.results.falseAlarms, value: `${s.falseAlarms}` },
					{ label: i.results.misses, value: `${s.misses}` },
					{ label: `RT ${i.common.mean}`, value: `${s.meanRtHits.toFixed(0)} ms` },
					{ label: i.results.dPrime, value: s.dPrime.toFixed(2) },
					{ label: i.common.accuracy, value: `${(s.accuracy * 100).toFixed(1)}%` }
				);
				break;
			case 'cpt':
				entries.push(
					{ label: 'Gesamtdurchgaenge', value: `${s.totalTrials}` },
					{ label: 'Target-Durchgaenge', value: `${s.targetTrials}` },
					{ label: i.results.hits, value: `${s.hits}` },
					{ label: i.results.commissionErrors, value: `${s.commissionErrors}` },
					{ label: i.results.omissionErrors, value: `${s.omissionErrors}` },
					{ label: `RT ${i.common.mean}`, value: `${s.meanRtHits.toFixed(0)} ms` },
					{ label: `RT ${i.common.sd}`, value: `${s.sdRtHits.toFixed(0)} ms` },
					{ label: i.results.dPrime, value: s.dPrime.toFixed(2) },
					{ label: 'Variabilitaetsindex (CV)', value: s.variabilityIndex.toFixed(2) },
					{ label: 'RT pro Block', value: s.rtByBlock.map(r => r.toFixed(0)).join(', ') + ' ms' }
				);
				break;
			case 'corsi':
				entries.push(
					{ label: 'Vorwaertsspanne', value: `${s.forwardSpan}` },
					{ label: 'Vorwaerts-Score', value: `${s.forwardScore}` },
					{ label: 'Gesamt-Score', value: `${s.totalScore}` },
					{ label: 'Mittlere Antwortzeit', value: `${s.meanResponseTime.toFixed(0)} ms` }
				);
				break;
			case 'symbol-digit':
				entries.push(
					{ label: 'Korrekt', value: `${s.totalCorrect}` },
					{ label: 'Versucht', value: `${s.totalAttempted}` },
					{ label: 'Fehler', value: `${s.totalErrors}` },
					{ label: 'Zeitlimit', value: `${s.timeLimit} s` },
					{ label: 'Throughput', value: `${s.throughput.toFixed(2)} / s` }
				);
				break;
			case 'trail-making':
				entries.push(
					{ label: 'Variante', value: `Trail Making ${s.variant}` },
					{ label: 'Gesamtzeit', value: `${(s.completionTimeMs / 1000).toFixed(1)} s` },
					{ label: 'Fehler', value: `${s.errors}` },
					{ label: 'Segmentzeiten', value: s.pathSegmentTimes.map(t => (t / 1000).toFixed(1)).join(', ') + ' s' }
				);
				break;
			case 'wcst':
				entries.push(
					{ label: 'Gesamtdurchgaenge', value: `${s.totalTrials}` },
					{ label: 'Kategorien', value: `${s.categoriesCompleted}` },
					{ label: 'Gesamtfehler', value: `${s.totalErrors}` },
					{ label: 'Perseverative Antworten', value: `${s.perseverativeResponses}` },
					{ label: 'Perseverative Fehler', value: `${s.perseverativeErrors}` },
					{ label: 'Nicht-perseverative Fehler', value: `${s.nonPerseverativeErrors}` },
					{ label: 'Konzeptuelle Antworten', value: `${s.conceptualLevelResponses}` },
					{ label: 'Failure to Maintain Set', value: `${s.failureToMaintainSet}` },
					{ label: 'Trials bis 1. Kategorie', value: `${s.trialsToFirstCategory}` }
				);
				break;
			case 'tower':
				entries.push(
					{ label: 'Geloest', value: `${s.problemsSolved} / ${s.totalProblems}` },
					{ label: 'Gesamtzuege', value: `${s.totalMoves}` },
					{ label: 'Optimale Zuege', value: `${s.optimalMoves}` },
					{ label: 'Ueberzaehlige Zuege', value: `${s.excessMoves}` },
					{ label: 'Mittlere Planungszeit', value: `${(s.meanPlanningTime / 1000).toFixed(1)} s` },
					{ label: 'Mittlere Ausfuehrungszeit', value: `${(s.meanExecutionTime / 1000).toFixed(1)} s` },
					{ label: 'Regelverstoesse', value: `${s.ruleViolations}` }
				);
				break;
			case 'word-list':
				entries.push(
					{ label: 'Lerndurchgaenge', value: `${s.learningTrials}` },
					{ label: 'Woerter pro Trial', value: s.wordsPerTrial.join(', ') },
					{ label: 'Gelernt (letzter Trial)', value: `${s.totalLearned} / 15` },
					{ label: 'Lernsteigung', value: s.learningSlope.toFixed(2) },
					{ label: 'Kurzabruf', value: `${s.shortDelayFreeRecall} / 15` },
					{ label: 'Rekognition Treffer', value: `${s.recognitionHits} / 15` },
					{ label: 'Rekognition Falsche Alarme', value: `${s.recognitionFalseAlarms}` },
					{ label: "d' Rekognition", value: s.dPrimeRecognition.toFixed(2) }
				);
				break;
			case 'delayed-recall':
				entries.push(
					{ label: 'Verzoegerter Abruf', value: `${s.delayedRecall} / ${s.totalItems}` },
					{ label: 'Unmittelbarer Abruf (Trial 5)', value: `${s.immediateRecall} / ${s.totalItems}` },
					{ label: 'Behaltenrate', value: `${(s.retentionRate * 100).toFixed(0)}%` },
					{ label: 'Verzoegerung', value: `${s.delayMinutes} min` },
					{ label: 'Intrusionsfehler', value: `${s.intrusionErrors}` }
				);
				break;
			case 'rey-figure':
				entries.push(
					{ label: 'Kopie-Score', value: `${s.copyScore} / 24` },
					{ label: 'Kopie-Zeit', value: `${(s.copyTimeMs / 1000).toFixed(1)} s` },
					{ label: 'Abruf-Score', value: `${s.recallScore} / 24` },
					{ label: 'Abruf-Zeit', value: `${(s.recallTimeMs / 1000).toFixed(1)} s` },
					{ label: 'Behaltenrate', value: `${(s.retentionRate * 100).toFixed(0)}%` }
				);
				break;
			default:
				// Generic fallback: show all properties
				for (const [key, value] of Object.entries(s)) {
					if (key !== 'type') {
						entries.push({ label: key, value: String(value) });
					}
				}
		}

		return entries;
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
</script>

<div class="max-w-3xl mx-auto px-6 py-10">
	{#if loading}
		<p class="text-slate-400">Laden...</p>
	{:else if !testRun}
		<p class="text-slate-400">Test nicht gefunden.</p>
		<a href="/ergebnisse" class="text-blue-600 text-sm hover:underline mt-2 inline-block">
			{i.common.backToOverview}
		</a>
	{:else}
		<div class="flex items-center justify-between mb-6">
			<div>
				<a href="/ergebnisse" class="text-sm text-blue-600 hover:underline mb-2 inline-block">
					&larr; {i.common.backToOverview}
				</a>
				<h1 class="text-2xl font-bold text-slate-900">{testRun.testId}</h1>
				<p class="text-sm text-slate-400">{i.results.completedAt}: {formatDate(testRun.completedAt)}</p>
			</div>
			{#if trials.length > 0}
				<button
					onclick={handleExportCSV}
					class="px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
				>
					{i.common.exportCSV}
				</button>
			{/if}
		</div>

		<div class="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100 mb-8">
			{#each getSummaryEntries() as entry}
				<div class="flex justify-between items-center px-5 py-3">
					<span class="text-sm text-slate-600">{entry.label}</span>
					<span class="text-sm font-medium text-slate-900">{entry.value}</span>
				</div>
			{/each}
		</div>

		{#if trials.length > 0}
			<h2 class="text-lg font-semibold text-slate-800 mb-3">Einzelne Durchgaenge ({trials.length})</h2>
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-slate-200 text-left">
							<th class="py-2 px-3 text-slate-500 font-medium">#</th>
							<th class="py-2 px-3 text-slate-500 font-medium">RT (ms)</th>
							<th class="py-2 px-3 text-slate-500 font-medium">Korrekt</th>
						</tr>
					</thead>
					<tbody>
						{#each trials as trial}
							<tr class="border-b border-slate-100">
								<td class="py-1.5 px-3 text-slate-400">{trial.trialNumber + 1}</td>
								<td class="py-1.5 px-3 tabular-nums">{trial.rt !== null ? trial.rt.toFixed(0) : '-'}</td>
								<td class="py-1.5 px-3">
									{#if trial.correct === true}
										<span class="text-green-600">Ja</span>
									{:else if trial.correct === false}
										<span class="text-red-600">Nein</span>
									{:else}
										<span class="text-slate-400">-</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{/if}
</div>
