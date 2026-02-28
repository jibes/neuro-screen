<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n/index.js';
	import TestShell from '$lib/components/TestShell.svelte';
	import ResultsCard from '$lib/components/ResultsCard.svelte';
	import { createTrialRunner } from '$lib/core/trial-runner.svelte.js';
	import { CPT_CONFIG } from './config.js';
	import { generateTrials, evaluateResponse, computeSummary } from './logic.js';
	import type { CPTTrial } from './types.js';
	import type { CPTSummary } from '$lib/db/models.js';
	import type { TrialConfig } from '$lib/core/trial-runner.svelte.js';
	import { saveTestRun } from '$lib/db/database.js';
	import { waitForSession } from '$lib/db/session-store.svelte.js';

	const i = t();
	const config = CPT_CONFIG;

	const runner = createTrialRunner();
	let testShell = $state<TestShell>();
	let summary = $state<CPTSummary | null>(null);
	let testTrials = $state<TrialConfig<CPTTrial>[]>([]);

	const currentStimulus = $derived(runner.currentStimulus as CPTTrial | null);

	function handleStart() {
		runTest();
	}

	async function runTest() {
		testTrials = generateTrials(config.totalTrials, config.targetRatio, false);
		const startedAt = new Date().toISOString();

		const results = await runner.run(testTrials, evaluateResponse);

		try {
			summary = computeSummary(results, testTrials);

			const session = await waitForSession();
			if (session?.id) {
				await saveTestRun(
					{
						sessionId: session.id,
						testId: config.testId,
						startedAt,
						completedAt: new Date().toISOString(),
						durationMs: results.reduce((sum, r) => sum + (r.rt ?? 0), 0),
						config: { ...config, itiDuration: undefined },
						summary,
						environmentWarnings: []
					},
					results.map((r, idx) => ({
						trialNumber: idx,
						phase: 'test',
						stimulus: testTrials[idx].stimulus as unknown as Record<string, unknown>,
						response: { key: r.responseKey },
						rt: r.rt,
						correct: r.correct,
						onsetTimestamp: r.stimulusOnset,
						responseTimestamp: r.responseTimestamp,
						customData: r.customData ?? {}
					}))
				);
			}
		} catch (e) {
			console.error('Fehler beim Speichern:', e);
		} finally {
			testShell?.setPhase('completed');
		}
	}

	function getResultMetrics() {
		if (!summary) return [];
		return [
			{ label: i.results.dPrime, value: summary.dPrime.toFixed(2), highlight: true },
			{ label: i.results.hits, value: `${summary.hits}/${summary.targetTrials}` },
			{ label: i.results.commissionErrors, value: summary.commissionErrors },
			{ label: i.results.omissionErrors, value: summary.omissionErrors },
			{ label: i.common.reactionTime + ' (' + i.common.mean + ')', value: `${summary.meanRtHits.toFixed(0)}`, unit: 'ms' },
			{ label: 'RT-Variabilitaet (CV)', value: summary.variabilityIndex.toFixed(2) }
		];
	}

	onDestroy(() => {
		runner.destroy();
	});
</script>

<TestShell
	bind:this={testShell}
	testId={config.testId}
	testName={config.testName}
	instructions={[...config.instructions]}
	currentTrial={runner.currentTrial}
	totalTrials={runner.totalTrials}
	onStart={handleStart}
>
	{#snippet children({ phase })}
		{#if phase === 'running'}
			<div class="stimulus-area">
				{#if runner.phase === 'stimulus' && currentStimulus}
					<span class="text-8xl font-light text-slate-900 select-none">
						{currentStimulus.letter}
					</span>
				{:else}
					<span class="text-8xl font-light text-transparent select-none">X</span>
				{/if}
			</div>
		{:else if phase === 'completed' && summary}
			<ResultsCard
				testName={config.testName}
				metrics={getResultMetrics()}
				onOverview={() => goto('/')}
			/>
		{/if}
	{/snippet}
</TestShell>
