<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { t } from '$lib/i18n/index.js';
	import { getTestRun, getTrials, getLatestTestRun } from '$lib/db/database.js';
	import { trialsToCSV, downloadFile } from '$lib/db/export.js';
	import type { TestRun, TrialData } from '$lib/db/models.js';
	import { getTestName } from '$lib/tests/registry.js';

	const i = t();

	let testRun = $state<TestRun | null>(null);
	let trials = $state<TrialData[]>([]);
	let loading = $state(true);
	/** Completion time of the latest Trail Making A in the same session (for B − A, B/A) */
	let trailA = $state<number | null>(null);

	const testId = $derived(Number(page.params.testId));

	onMount(async () => {
		if (!isNaN(testId)) {
			testRun = (await getTestRun(testId)) ?? null;
			if (testRun?.id) {
				trials = await getTrials(testRun.id);
				if (testRun.testId === 'trail-making-b') {
					const a = await getLatestTestRun(testRun.sessionId, 'trail-making-a');
					if (a?.summary.type === 'trail-making') trailA = a.summary.completionTimeMs;
				}
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
		try {
			return formatSummaryEntries(testRun);
		} catch {
			// Record from an older app version with a different summary shape: show raw values
			return genericEntries(testRun.summary as unknown as Record<string, unknown>);
		}
	}

	function genericEntries(s: Record<string, unknown>): Array<{ label: string; value: string }> {
		return Object.entries(s)
			.filter(([key]) => key !== 'type')
			.map(([key, value]) => ({ label: key, value: typeof value === 'object' ? JSON.stringify(value) : String(value) }));
	}

	function formatSummaryEntries(run: TestRun): Array<{ label: string; value: string }> {
		const s = run.summary;
		const entries: Array<{ label: string; value: string }> = [];
		const ms = (x: number) => `${x.toFixed(0)} ms`;
		const pct = (x: number) => `${(x * 100).toFixed(1)} %`;
		const add = (label: string, value: string | number) => entries.push({ label, value: String(value) });

		switch (s.type) {
			case 'go-nogo':
				add('Durchgänge (Go / No-Go)', `${s.goTrials} / ${s.noGoTrials}`);
				add('Treffer', `${s.hits} / ${s.goTrials}`);
				add(i.results.omissionErrors, s.omissionErrors);
				add(i.results.commissionErrors, `${s.commissionErrors} / ${s.noGoTrials}`);
				add(i.common.accuracy, pct(s.accuracy));
				add(`RT Treffer ${i.common.mean} ± SD`, `${ms(s.meanRtHits)} ± ${s.sdRtHits.toFixed(0)}`);
				add(`RT Treffer ${i.common.median}`, ms(s.medianRtHits));
				add(i.results.dPrime, s.dPrime.toFixed(2));
				add('Antworttendenz (c)', s.responseBias.toFixed(2));
				add('Ausgeschlossen (Antizipationen / Ausreißer)', `${s.anticipations} / ${s.rtOutliersExcluded}`);
				break;
			case 'flanker':
				add(i.results.flankerEffect + ' (Mittelwert)', ms(s.flankerEffect));
				add(i.results.flankerEffect + ' (Median)', ms(s.flankerEffectMedian));
				add('RT kongruent (M / Md)', `${ms(s.meanRtCongruent)} / ${ms(s.medianRtCongruent)}`);
				add('RT inkongruent (M / Md)', `${ms(s.meanRtIncongruent)} / ${ms(s.medianRtIncongruent)}`);
				add('Fehler kongruent / inkongruent', `${s.errorsCongruent} / ${s.errorsIncongruent}`);
				add('Keine Antwort', s.misses);
				add(i.common.accuracy, pct(s.accuracy));
				add('Ausgeschlossen (Antizipationen / Ausreißer)', `${s.anticipations} / ${s.rtOutliersExcluded}`);
				break;
			case 'stroop':
				add(i.results.stroopEffect + ' (inkongruent − kongruent)', ms(s.stroopEffect));
				add('Interferenz (inkongruent − neutral)', ms(s.stroopInterference));
				add('Fazilitation (neutral − kongruent)', ms(s.stroopFacilitation));
				add('RT kongruent (M / Md)', `${ms(s.meanRtCongruent)} / ${ms(s.medianRtCongruent)}`);
				add('RT inkongruent (M / Md)', `${ms(s.meanRtIncongruent)} / ${ms(s.medianRtIncongruent)}`);
				add('RT neutral (M / Md)', `${ms(s.meanRtNeutral)} / ${ms(s.medianRtNeutral)}`);
				add('Fehler kongr. / inkongr. / neutral', `${s.errorsCongruent} / ${s.errorsIncongruent} / ${s.errorsNeutral}`);
				add('Keine Antwort', s.misses);
				add(i.common.accuracy, pct(s.accuracy));
				add('Ausgeschlossen (Antizipationen / Ausreißer)', `${s.anticipations} / ${s.rtOutliersExcluded}`);
				break;
			case 'n-back':
				add('Stufe', `${s.nLevel}-Back`);
				add(i.results.hits, `${s.hits} / ${s.hits + s.misses}`);
				add(i.results.falseAlarms, s.falseAlarms);
				add(i.results.dPrime, s.dPrime.toFixed(2));
				add(i.common.accuracy, pct(s.accuracy));
				add(`RT Treffer (M / Md)`, `${ms(s.meanRtHits)} / ${ms(s.medianRtHits)}`);
				break;
			case 'cpt':
				add(i.results.hits, `${s.hits} / ${s.targetTrials}`);
				add(i.results.omissionErrors, s.omissionErrors);
				add(i.results.commissionErrors, s.commissionErrors);
				add(i.results.dPrime, s.dPrime.toFixed(2));
				add('Antworttendenz (c)', s.responseBias.toFixed(2));
				add(`RT Treffer ${i.common.mean} ± SD`, `${ms(s.meanRtHits)} ± ${s.sdRtHits.toFixed(0)}`);
				add('Variabilität (CV = SD/M)', s.variabilityIndex.toFixed(3));
				add('RT pro Block', s.rtByBlock.map((r) => r.toFixed(0)).join(' · ') + ' ms');
				add('Auslassungen pro Block', s.omissionsByBlock.join(' · '));
				add('Kommissionen pro Block', s.commissionsByBlock.join(' · '));
				add('Ausgeschlossen (Antizipationen / Ausreißer)', `${s.anticipations} / ${s.rtOutliersExcluded}`);
				break;
			case 'digit-span':
				add('Längste Spanne vorwärts / rückwärts', `${s.forwardSpan} / ${s.backwardSpan}`);
				add('Rohwert vorwärts', `${s.forwardScore} / ${s.forwardTotalTrials}`);
				add('Rohwert rückwärts', `${s.backwardScore} / ${s.backwardTotalTrials}`);
				add('Gesamtrohwert', s.forwardScore + s.backwardScore);
				break;
			case 'corsi':
				add('Blockspanne vorwärts / rückwärts', `${s.forwardSpan} / ${s.backwardSpan}`);
				add('Gesamtscore vorwärts / rückwärts (Spanne × korrekte Folgen)', `${s.forwardScore} / ${s.backwardScore}`);
				add('Mittlere Antwortzeit', ms(s.meanResponseTime));
				break;
			case 'symbol-digit':
				add('Korrekt', s.totalCorrect);
				add('Bearbeitet', s.totalAttempted);
				add('Fehler', s.totalErrors);
				add('Zeitlimit', `${s.timeLimit} s`);
				add('Korrekte pro Sekunde', s.throughput.toFixed(2));
				break;
			case 'trail-making':
				add('Variante', `Trail Making ${s.variant}`);
				add('Gesamtzeit', `${(s.completionTimeMs / 1000).toFixed(1)} s`);
				add('Fehler', s.errors);
				if (s.variant === 'B' && trailA) {
					add('B − A (Differenz)', `${((s.completionTimeMs - trailA) / 1000).toFixed(1)} s`);
					add('B / A (Quotient)', (s.completionTimeMs / trailA).toFixed(2));
				}
				add('Segmentzeiten', s.pathSegmentTimes.map((t) => (t / 1000).toFixed(1)).join(' · ') + ' s');
				break;
			case 'wcst':
				add('Kategorien', s.categoriesCompleted);
				add('Durchgänge', s.totalTrials);
				add('Fehler gesamt', `${s.totalErrors} (${pct(s.totalTrials ? s.totalErrors / s.totalTrials : 0)})`);
				add('Perseverative Fehler', `${s.perseverativeErrors} (${pct(s.totalTrials ? s.perseverativeErrors / s.totalTrials : 0)})`);
				add('Perseverative Antworten', s.perseverativeResponses);
				add('Nicht-perseverative Fehler', s.nonPerseverativeErrors);
				add('Konzeptuelle Antworten', `${s.conceptualLevelResponses} (${pct(s.totalTrials ? s.conceptualLevelResponses / s.totalTrials : 0)})`);
				add('Failure to Maintain Set', s.failureToMaintainSet);
				add('Durchgänge bis 1. Kategorie', s.trialsToFirstCategory);
				break;
			case 'tower':
				add('Mit Minimalzügen gelöst', `${s.problemsSolvedOptimally} / ${s.totalProblems}`);
				add('Gelöst', `${s.problemsSolved} / ${s.totalProblems}`);
				add('Züge (gesamt / minimal)', `${s.totalMoves} / ${s.optimalMoves}`);
				add('Überzählige Züge', s.excessMoves);
				add('Planungszeit (alle / gelöste)', `${(s.meanPlanningTime / 1000).toFixed(1)} s / ${(s.meanPlanningTimeSolved / 1000).toFixed(1)} s`);
				add('Ausführungszeit', `${(s.meanExecutionTime / 1000).toFixed(1)} s`);
				add('Regelverstöße', s.ruleViolations);
				add('Zeitüberschreitungen', s.timeouts);
				break;
			case 'word-list':
				add('Summe A1–A5', s.totalRecall);
				add('Wörter pro Durchgang (A1–A5)', s.wordsPerTrial.join(' – '));
				add('Lernzuwachs (Σ − 5 × A1)', s.learningOverTrials);
				add('Lernsteigung', s.learningSlope.toFixed(2));
				add('Liste B', s.interferenceRecall);
				add('A6 (nach Interferenz)', s.shortDelayFreeRecall);
				add('Proaktive Interferenz (B/A1)', pct(s.proactiveInterference));
				add('Retroaktive Interferenz (A6/A5)', pct(s.retroactiveInterference));
				add('Intrusionen', s.intrusions);
				add('Primacy / Recency', `${pct(s.primacy)} / ${pct(s.recency)}`);
				add('Darbietung', s.presentationMode === 'auditory' ? 'gesprochen' : 'visuell');
				break;
			case 'delayed-recall':
				add('Verzögerter Abruf (A7)', `${s.delayedRecall} / ${s.totalItems}`);
				add('A5 / A6 (Wortliste)', `${s.immediateRecall} / ${s.shortDelayRecall}`);
				add('Behaltensquote (A7/A5)', pct(s.retentionRate));
				add('Verzögerung', `${s.delayMinutes} min`);
				add('Intrusionen', s.intrusionErrors);
				add('Wiedererkennung: Treffer', `${s.recognitionHits} / ${s.totalItems}`);
				add('Wiedererkennung: Falsch-Positive (davon Liste B)', `${s.recognitionFalseAlarms} (${s.recognitionListBErrors})`);
				add('Diskrimination (Treffer − FP)', s.recognitionDiscriminability);
				add("d' Wiedererkennung", s.dPrimeRecognition.toFixed(2));
				break;
			case 'rey-figure':
				add("d' sofort", s.immediateDPrime.toFixed(2));
				add('Treffer / Falsch-Positive sofort', `${s.immediateHits}/${s.immediateTargets} · ${s.immediateFalseAlarms}/${s.immediateDistractors}`);
				add("d' verzögert", s.delayedDPrime.toFixed(2));
				add('Treffer / Falsch-Positive verzögert', `${s.delayedHits}/${s.delayedTargets} · ${s.delayedFalseAlarms}/${s.delayedDistractors}`);
				add('Verzögerung', `${s.delayMinutes} min`);
				break;
			default:
				entries.push(...genericEntries(s as unknown as Record<string, unknown>));
		}
		if (entries.some((e) => e.value.includes('undefined') || e.value.includes('NaN'))) {
			throw new Error('legacy summary');
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

<svelte:head>
	<title>{testRun ? getTestName(testRun.testId) : 'Ergebnis'} · Ergebnisse · NeuroScreen</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
	{#if loading}
		<p class="text-slate-400">Laden...</p>
	{:else if !testRun}
		<p class="text-slate-400">Test nicht gefunden.</p>
		<a href="{base}/ergebnisse" class="text-blue-600 text-sm hover:underline mt-2 inline-block">
			{i.common.backToOverview}
		</a>
	{:else}
		<div class="flex flex-wrap items-end justify-between gap-3 mb-6">
			<div>
				<a href="{base}/ergebnisse" class="text-sm text-blue-600 hover:underline mb-2 inline-block">
					&larr; {i.common.backToOverview}
				</a>
				<h1 class="text-2xl font-bold text-slate-900">{getTestName(testRun.testId)}</h1>
				<p class="text-sm text-slate-400">{i.results.completedAt}: {formatDate(testRun.completedAt)}</p>
				{#if testRun.durationMs}
					<p class="text-sm text-slate-400">{i.results.duration}: {(testRun.durationMs / 1000).toFixed(0)} s</p>
				{/if}
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

		{#if testRun.qualityFlags?.length}
			<div class="bg-red-50 border border-red-100 rounded-lg px-5 py-3 mb-4 text-sm text-red-600">
				<p class="font-medium mb-1">Hinweise zur Datenqualität – mit Vorsicht interpretieren</p>
				<ul class="list-disc pl-5">
					{#each testRun.qualityFlags as flag}
						<li>{flag}</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if testRun.environmentWarnings?.length}
			<div class="bg-amber-50 border border-amber-200 rounded-lg px-5 py-3 mb-6 text-sm text-amber-800">
				<p class="font-medium mb-1">Hinweise zur Testumgebung</p>
				<ul class="list-disc pl-5">
					{#each testRun.environmentWarnings as warning}
						<li>{warning}</li>
					{/each}
				</ul>
			</div>
		{/if}

		<div class="bg-surface rounded-lg border border-slate-200 divide-y divide-slate-100 mb-8">
			{#each getSummaryEntries() as entry}
				<div class="flex justify-between items-center gap-4 px-4 sm:px-5 py-3">
					<span class="text-sm text-slate-600">{entry.label}</span>
					<span class="text-sm font-medium text-slate-900 text-right break-words min-w-0">{entry.value}</span>
				</div>
			{/each}
		</div>

		{#if trials.length > 0}
			<h2 class="text-lg font-semibold text-slate-800 mb-3">Einzelne Durchgänge ({trials.length})</h2>
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
