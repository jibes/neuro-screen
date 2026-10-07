<script lang="ts">
	import { base } from '$app/paths';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n/index.js';
	import TestShell from '$lib/components/TestShell.svelte';
	import ResultsCard from '$lib/components/ResultsCard.svelte';
	import { HighResTimer } from '$lib/core/timing.js';
	import { SYMBOL_DIGIT_CONFIG } from './config.js';
	import { generateTrialPool, computeSummary } from './logic.js';
	import type { SymbolDigitResult } from './types.js';
	import type { SymbolDigitSummary } from '$lib/db/models.js';
	import { saveRunToSession } from '$lib/db/session-store.svelte.js';
	import { getNextTest } from '$lib/tests/registry.js';

	const i = t();
	const config = SYMBOL_DIGIT_CONFIG;
	const nextTest = getNextTest(config.testId);

	let testShell = $state<TestShell>();
	let summary = $state<SymbolDigitSummary | null>(null);

	let currentTrialIndex = $state(0);
	let remainingSeconds = $state(Math.ceil(config.timeLimitMs / 1000));
	let flashColor = $state<'green' | 'red' | null>(null);
	let running = $state(false);
	let answeredCount = $state(0);

	const timer = new HighResTimer();
	// Grown on demand so fast responders never run out of items
	const trials = generateTrialPool(config.trialPoolSize);
	const results: SymbolDigitResult[] = [];
	let intervalId: ReturnType<typeof setInterval> | undefined;
	let trialStartTime = 0;
	let startedAt = '';
	let finished = false;

	// `trials` is extended before currentTrialIndex advances, so the index change triggers the update
	const currentSymbol = $derived(config.symbols[trials[currentTrialIndex].symbolIndex]);

	function handleKeydown(e: KeyboardEvent) {
		if (!running || e.repeat || timer.paused) return;
		if (e.key >= '1' && e.key <= '9') {
			e.preventDefault();
			if (timer.now() >= config.timeLimitMs) {
				finishTest();
				return;
			}
			const digit = Number(e.key);
			const trial = trials[currentTrialIndex];
			const rt = timer.now() - trialStartTime;
			const correct = digit === trial.correctDigit;

			results.push({ trial, userResponse: digit, correct, rt });
			answeredCount = results.length;

			// Flash feedback
			flashColor = correct ? 'green' : 'red';
			setTimeout(() => { flashColor = null; }, 150);

			if (currentTrialIndex + 2 >= trials.length) {
				trials.push(...generateTrialPool(config.trialPoolSize, trials));
			}
			currentTrialIndex++;
			trialStartTime = timer.now();
		}
	}

	function startTimer() {
		intervalId = setInterval(() => {
			const elapsed = timer.now();
			remainingSeconds = Math.max(0, Math.ceil((config.timeLimitMs - elapsed) / 1000));
			if (elapsed >= config.timeLimitMs) {
				finishTest();
			}
		}, 250);
	}

	async function finishTest() {
		if (finished) return;
		finished = true;
		running = false;
		if (intervalId !== undefined) {
			clearInterval(intervalId);
			intervalId = undefined;
		}

		try {
			summary = computeSummary(results);

			await saveRunToSession(
				{
					testId: config.testId,
					startedAt,
					completedAt: new Date().toISOString(),
					durationMs: config.timeLimitMs,
					config: { ...config },
					summary
				},
				results.map((r, idx) => ({
					trialNumber: idx,
					phase: 'test',
					stimulus: { symbolIndex: r.trial.symbolIndex, correctDigit: r.trial.correctDigit },
					response: { digit: r.userResponse },
					rt: r.rt,
					correct: r.correct,
					onsetTimestamp: 0,
					responseTimestamp: r.rt,
					customData: {}
				}))
			);
		} catch (e) {
			console.error('Fehler beim Speichern:', e);
		} finally {
			testShell?.setPhase('completed');
		}
	}

	function runTest() {
		running = true;
		startedAt = new Date().toISOString();
		timer.reset();
		trialStartTime = timer.now();
		startTimer();
	}

	function getResultMetrics() {
		if (!summary) return [];
		return [
			{ label: 'Korrekt', value: summary.totalCorrect, highlight: true },
			{ label: 'Versucht', value: summary.totalAttempted },
			{ label: i.common.errors, value: summary.totalErrors },
			{ label: 'Durchsatz', value: `${summary.throughput.toFixed(2)}`, unit: '/s', highlight: true },
			{ label: 'Zeitlimit', value: `${summary.timeLimit}`, unit: 's' }
		];
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
	});

	onDestroy(() => {
		running = false;
		finished = true;
		if (intervalId !== undefined) clearInterval(intervalId);
		document.removeEventListener('keydown', handleKeydown);
	});
</script>

<TestShell
	bind:this={testShell}
	testName={config.testName}
	instructions={[...config.instructions]}
	currentTrial={currentTrialIndex}
	totalTrials={0}
	onStart={() => runTest()}
	onPauseChange={(p) => (p ? timer.pause() : timer.resume())}
>
	{#snippet children({ phase })}
		{#if phase === 'running'}
			<div class="stimulus-area">
				<!-- Legend bar -->
				<div class="w-full max-w-2xl mb-10">
					<div class="flex justify-between bg-white rounded-lg border border-slate-200 p-3">
						{#each config.symbols as symbol, idx}
							<div class="flex flex-col items-center gap-1">
								<span class="text-2xl select-none">{symbol}</span>
								<span class="text-sm font-medium text-slate-600">{idx + 1}</span>
							</div>
						{/each}
					</div>
				</div>

				<!-- Current symbol -->
				<div
					class="text-9xl select-none transition-colors duration-100
						{flashColor === 'green' ? 'text-green-500' : flashColor === 'red' ? 'text-red-500' : 'text-slate-900'}"
				>
					{currentSymbol}
				</div>

				<!-- Timer -->
				<div class="mt-8 text-lg tabular-nums {remainingSeconds <= 10 ? 'text-red-500 font-medium' : 'text-slate-400'}">
					{remainingSeconds}s
				</div>

				<!-- Counter -->
				<div class="mt-2 text-sm text-slate-400">
					{answeredCount} beantwortet
				</div>
			</div>
		{:else if phase === 'completed' && summary}
			<ResultsCard
				testName={config.testName}
				metrics={getResultMetrics()}
				onOverview={() => goto(`${base}/`)}
				onNext={nextTest ? () => goto(nextTest.href) : undefined}
			/>
		{/if}
	{/snippet}
</TestShell>
