<script lang="ts">
	import { base } from '$app/paths';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n/index.js';
	import TestShell from '$lib/components/TestShell.svelte';
	import ResultsCard from '$lib/components/ResultsCard.svelte';
	import { HighResTimer } from '$lib/core/timing.js';
	import { CORSI_CONFIG } from './config.js';
	import { generateForwardTrials, checkResponse, computeSummary } from './logic.js';
	import type { CorsiResult } from './types.js';
	import type { CorsiSummary } from '$lib/db/models.js';
	import { saveRunToSession } from '$lib/db/session-store.svelte.js';
	import { getNextTest } from '$lib/tests/registry.js';

	const i = t();
	const config = CORSI_CONFIG;
	const nextTest = getNextTest(config.testId);

	let testShell = $state<TestShell>();
	let summary = $state<CorsiSummary | null>(null);

	type Phase = 'idle' | 'presenting' | 'input' | 'feedback';
	let phase = $state<Phase>('idle');
	let highlightedBlock = $state<number | null>(null);
	let userSequence = $state<number[]>([]);
	let feedbackCorrect = $state(false);
	let currentTrialIndex = $state(0);
	let totalTrials = $state(0);

	const timer = new HighResTimer();
	let running = $state(false);

	let resolveInput: ((response: number[]) => void) | null = null;

	async function presentSequence(sequence: number[]) {
		phase = 'presenting';
		highlightedBlock = null;
		await timer.delay(500);

		for (let i = 0; i < sequence.length; i++) {
			if (!running) return;
			highlightedBlock = sequence[i];
			await timer.delay(config.blockHighlightDurationMs);
			highlightedBlock = null;
			if (i < sequence.length - 1) {
				await timer.delay(config.interBlockIntervalMs);
			}
		}
	}

	function handleBlockClick(blockId: number) {
		if (phase !== 'input' || userSequence.includes(blockId)) return;
		userSequence = [...userSequence, blockId];
	}

	function resetInput() {
		userSequence = [];
	}

	function submitResponse() {
		if (resolveInput) {
			resolveInput([...userSequence]);
			resolveInput = null;
		}
	}

	function waitForInput(): Promise<number[]> {
		phase = 'input';
		userSequence = [];
		return new Promise((resolve) => {
			resolveInput = resolve;
		});
	}

	async function runTest() {
		running = true;
		timer.reset();
		const allTrials = generateForwardTrials();
		totalTrials = allTrials.length;
		const results: CorsiResult[] = [];
		let failuresAtSpan = 0;
		let lastSpan = -1;
		const startedAt = new Date().toISOString();

		for (let idx = 0; idx < allTrials.length; idx++) {
			if (!running) break;

			currentTrialIndex = idx;
			const trial = allTrials[idx];

			await presentSequence(trial.sequence);

			const startTime = timer.now();
			const userResponse = await waitForInput();
			const responseTime = timer.now() - startTime;

			if (!running) return;

			const correct = checkResponse(trial, userResponse);

			phase = 'feedback';
			feedbackCorrect = correct;
			await timer.delay(config.feedbackDurationMs);

			results.push({ trial, userResponse, correct, responseTimeMs: responseTime });

			// Adaptive stopping: failures are counted per span length
			if (trial.spanLength !== lastSpan) {
				lastSpan = trial.spanLength;
				failuresAtSpan = 0;
			}
			if (!correct) failuresAtSpan++;

			if (failuresAtSpan >= config.maxFailuresPerSpan) {
				break;
			}

			phase = 'idle';
			await timer.delay(500);
		}

		// Left the page mid-test: never save a partial run
		if (!running) return;
		const durationMs = timer.now();

		try {
			summary = computeSummary(results);

			await saveRunToSession(
				{
					testId: config.testId,
					startedAt,
					completedAt: new Date().toISOString(),
					durationMs,
					config: { ...config },
					summary
				},
				results.map((r, idx) => ({
					trialNumber: idx,
					phase: 'test',
					stimulus: { sequence: r.trial.sequence, spanLength: r.trial.spanLength },
					response: { userResponse: r.userResponse },
					rt: r.responseTimeMs,
					correct: r.correct,
					onsetTimestamp: 0,
					responseTimestamp: r.responseTimeMs,
					customData: {}
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
			{ label: i.results.forwardSpan, value: summary.forwardSpan, highlight: true },
			{ label: 'Score', value: summary.forwardScore, highlight: true },
			{ label: 'Mittlere Antwortzeit', value: `${summary.meanResponseTime.toFixed(0)}`, unit: 'ms' }
		];
	}

	onDestroy(() => {
		running = false;
		resolveInput?.([]);
		resolveInput = null;
	});
</script>

<TestShell
	bind:this={testShell}
	testName={config.testName}
	instructions={[...config.instructions]}
	currentTrial={currentTrialIndex}
	totalTrials={totalTrials}
	onStart={() => runTest()}
	onPauseChange={(p) => (p ? timer.pause() : timer.resume())}
>
	{#snippet children({ phase: testPhase })}
		{#if testPhase === 'running'}
			{#if phase === 'idle'}
				<div class="stimulus-area">
					<span class="text-slate-400">Bereit...</span>
				</div>
			{:else if phase === 'presenting' || phase === 'input'}
				<div class="stimulus-area">
					<div class="relative w-[calc(100%-2rem)] max-w-lg aspect-square mx-auto">
						{#each config.blockPositions as block}
							<button
								class="absolute w-12 h-12 sm:w-14 sm:h-14 -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 touch-manipulation transition-all duration-150 flex items-center justify-center text-sm font-medium
									{highlightedBlock === block.id
										? 'bg-yellow-400 border-yellow-500 scale-110'
										: phase === 'input' && userSequence.includes(block.id)
											? 'bg-blue-100 border-blue-400 text-blue-700'
											: 'bg-slate-200 border-slate-300 text-transparent hover:bg-slate-300'}"
								style="left: {block.x}%; top: {block.y}%;"
								onclick={() => handleBlockClick(block.id)}
								disabled={phase !== 'input'}
							>
								{#if phase === 'input' && userSequence.includes(block.id)}
									{userSequence.indexOf(block.id) + 1}
								{:else}
									·
								{/if}
							</button>
						{/each}
					</div>

					{#if phase === 'input'}
						<div class="mt-6 flex gap-3 justify-center">
							<button
								onclick={resetInput}
								disabled={userSequence.length === 0}
								class="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-30 transition-colors"
							>
								Zurücksetzen
							</button>
							<button
								onclick={submitResponse}
								disabled={userSequence.length === 0}
								class="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-30 transition-colors"
							>
								Bestätigen
							</button>
						</div>
					{:else}
						<p class="mt-6 text-sm text-slate-400">Beobachten Sie die Reihenfolge...</p>
					{/if}
				</div>
			{:else if phase === 'feedback'}
				<div class="stimulus-area">
					<span class="text-2xl font-medium {feedbackCorrect ? 'text-green-600' : 'text-red-600'}">
						{feedbackCorrect ? i.common.correct : i.common.incorrect}
					</span>
				</div>
			{/if}
		{:else if testPhase === 'completed' && summary}
			<ResultsCard
				testName={config.testName}
				metrics={getResultMetrics()}
				onOverview={() => goto(`${base}/`)}
				onNext={nextTest ? () => goto(nextTest.href) : undefined}
			/>
		{/if}
	{/snippet}
</TestShell>
