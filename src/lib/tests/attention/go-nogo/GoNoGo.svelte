<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n/index.js';
	import TestShell from '$lib/components/TestShell.svelte';
	import FixationCross from '$lib/components/FixationCross.svelte';
	import ResultsCard from '$lib/components/ResultsCard.svelte';
	import { createTrialRunner } from '$lib/core/trial-runner.svelte.js';
	import { GO_NOGO_CONFIG } from './config.js';
	import { generateTrials, evaluateResponse, computeSummary } from './logic.js';
	import type { GoNoGoTrial } from './types.js';
	import type { GoNoGoSummary } from '$lib/db/models.js';
	import type { TrialConfig } from '$lib/core/trial-runner.svelte.js';
	import { saveRunToSession } from '$lib/db/session-store.svelte.js';
	import { getNextTest } from '$lib/tests/registry.js';

	const i = t();
	const config = GO_NOGO_CONFIG;
	const nextTest = getNextTest(config.testId);

	const runner = createTrialRunner();
	let testShell = $state<TestShell>();
	let stage = $state<'practice' | 'transition' | 'test'>('practice');
	let summary = $state<GoNoGoSummary | null>(null);
	let testTrials = $state<TrialConfig<GoNoGoTrial>[]>([]);

	const currentStimulus = $derived(runner.currentStimulus as GoNoGoTrial | null);

	function handleStart() {
		runTest();
	}

	async function runTest() {
		// Practice block with feedback; repeated until the accuracy threshold is met (max attempts)
		stage = 'practice';
		for (let attempt = 0; attempt < config.maxPracticeAttempts; attempt++) {
			const practice = await runner.run(generateTrials(config.practiceTrials, config.practiceGoRatio, true), evaluateResponse);
			if (!practice) return;
			const accuracy = practice.filter((r) => r.correct).length / practice.length;
			if (accuracy >= config.practiceAccuracyThreshold) break;
		}
		stage = 'transition';
		await runner.timer.delay(3000);
		if (runner.destroyed) return;
		stage = 'test';

		testTrials = generateTrials(config.totalTrials, config.goRatio, false);
		const startedAt = new Date().toISOString();

		const results = await runner.run(testTrials, evaluateResponse);
		if (!results) return; // aborted (page left) — never save partial runs
		const durationMs = runner.timer.now();

		try {
			summary = computeSummary(results, testTrials);

			await saveRunToSession(
				{
					testId: config.testId,
					startedAt,
					completedAt: new Date().toISOString(),
					durationMs,
					config: { ...config, itiDuration: undefined },
					summary
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
			{ label: i.common.reactionTime + ' (' + i.common.mean + ')', value: `${summary.meanRtHits.toFixed(0)}`, unit: 'ms' },
			{ label: i.common.reactionTime + ' (' + i.common.median + ')', value: `${summary.medianRtHits.toFixed(0)}`, unit: 'ms' },
			{ label: i.common.reactionTime + ' (' + i.common.sd + ')', value: `${summary.sdRtHits.toFixed(0)}`, unit: 'ms' },
			{ label: i.results.commissionErrors, value: summary.commissionErrors },
			{ label: i.results.omissionErrors, value: summary.omissionErrors },
			{ label: i.results.dPrime, value: summary.dPrime.toFixed(2), highlight: true }
		];
	}

	onDestroy(() => {
		runner.destroy();
	});
</script>

<TestShell
	bind:this={testShell}
	testName={config.testName}
	instructions={[...config.instructions]}
	currentTrial={runner.currentTrial}
	totalTrials={runner.totalTrials}
	onStart={handleStart}
	onPauseChange={(p) => (p ? runner.pause() : runner.resume())}
>
	{#snippet children({ phase })}
		{#if phase === 'running' && stage === 'transition'}
			<div class="stimulus-area">
				<p class="text-xl text-slate-600">{i.common.practiceComplete}</p>
			</div>
		{:else if phase === 'running'}
			{#if stage === 'practice'}
				<div class="fixed top-4 left-4 text-sm font-medium text-amber-600">{i.common.practice}</div>
			{/if}
			{#if runner.phase === 'fixation' || runner.phase === 'iti'}
				<FixationCross />
			{:else if runner.phase === 'stimulus' && currentStimulus}
				<div class="stimulus-area">
					<div
						class="rounded-full"
						style="width: {config.stimulusSizePx}px; height: {config.stimulusSizePx}px; background-color: {currentStimulus.color};"
					></div>
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
				onNext={nextTest ? () => goto(nextTest.href) : undefined}
			/>
		{/if}
	{/snippet}
</TestShell>
