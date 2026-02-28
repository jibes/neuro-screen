<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n/index.js';
	import TestShell from '$lib/components/TestShell.svelte';
	import FixationCross from '$lib/components/FixationCross.svelte';
	import ResultsCard from '$lib/components/ResultsCard.svelte';
	import { createTrialRunner } from '$lib/core/trial-runner.svelte.js';
	import { FLANKER_CONFIG } from './config.js';
	import { generateTrials, evaluateResponse, computeSummary } from './logic.js';
	import type { FlankerTrial } from './types.js';
	import type { FlankerSummary } from '$lib/db/models.js';
	import type { TrialConfig } from '$lib/core/trial-runner.svelte.js';
	import { saveTestRun } from '$lib/db/database.js';
	import { waitForSession } from '$lib/db/session-store.svelte.js';

	const i = t();
	const config = FLANKER_CONFIG;

	const runner = createTrialRunner();
	let testShell = $state<TestShell>();
	let summary = $state<FlankerSummary | null>(null);
	let testTrials = $state<TrialConfig<FlankerTrial>[]>([]);

	const currentStimulus = $derived(runner.currentStimulus as FlankerTrial | null);

	function handleStart() {
		runTest();
	}

	async function runTest() {
		testTrials = generateTrials(config.totalTrials, config.congruentRatio, false);
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
			{ label: i.common.accuracy, value: `${(summary.accuracy * 100).toFixed(1)}`, unit: '%', highlight: true },
			{ label: 'RT kongruent (' + i.common.mean + ')', value: `${summary.meanRtCongruent.toFixed(0)}`, unit: 'ms' },
			{ label: 'RT inkongruent (' + i.common.mean + ')', value: `${summary.meanRtIncongruent.toFixed(0)}`, unit: 'ms' },
			{ label: i.results.flankerEffect, value: `${summary.flankerEffect.toFixed(0)}`, unit: 'ms', highlight: true },
			{ label: i.common.errors + ' (kongruent)', value: summary.errorsCongruent },
			{ label: i.common.errors + ' (inkongruent)', value: summary.errorsIncongruent }
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
			{#if runner.phase === 'fixation' || runner.phase === 'iti'}
				<FixationCross />
			{:else if runner.phase === 'stimulus' && currentStimulus}
				<div class="stimulus-area">
					<span class="text-6xl font-mono tracking-widest text-slate-900 select-none">
						{currentStimulus.display}
					</span>
				</div>
			{:else if runner.phase === 'feedback' && runner.lastOutcome}
				<div class="stimulus-area">
					<span class="text-2xl font-medium {runner.lastOutcome.correct ? 'text-green-600' : 'text-red-600'}">
						{runner.lastOutcome.correct ? i.common.correct : i.common.incorrect}
					</span>
				</div>
			{:else}
				<FixationCross />
			{/if}
		{:else if phase === 'completed' && summary}
			<ResultsCard
				testName={config.testName}
				metrics={getResultMetrics()}
				onOverview={() => goto('/')}
			/>
		{/if}
	{/snippet}
</TestShell>
