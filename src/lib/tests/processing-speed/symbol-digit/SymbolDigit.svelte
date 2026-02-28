<script lang="ts">
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
	import { saveTestRun } from '$lib/db/database.js';
	import { waitForSession } from '$lib/db/session-store.svelte.js';

	const i = t();
	const config = SYMBOL_DIGIT_CONFIG;

	let testShell = $state<TestShell>();
	let summary = $state<SymbolDigitSummary | null>(null);

	let currentTrialIndex = $state(0);
	let remainingSeconds = $state(90);
	let flashColor = $state<'green' | 'red' | null>(null);
	let running = $state(false);

	const timer = new HighResTimer();
	const trials = generateTrialPool(config.trialPoolSize);
	const results: SymbolDigitResult[] = [];
	let intervalId: ReturnType<typeof setInterval> | undefined;
	let trialStartTime = 0;

	const currentSymbol = $derived(
		currentTrialIndex < trials.length
			? config.symbols[trials[currentTrialIndex].symbolIndex]
			: ''
	);

	function handleKeydown(e: KeyboardEvent) {
		if (!running) return;
		if (e.key >= '1' && e.key <= '9') {
			e.preventDefault();
			const digit = Number(e.key);
			const trial = trials[currentTrialIndex];
			const rt = timer.now() - trialStartTime;
			const correct = digit === trial.correctDigit;

			results.push({ trial, userResponse: digit, correct, rt });

			// Flash feedback
			flashColor = correct ? 'green' : 'red';
			setTimeout(() => { flashColor = null; }, 150);

			currentTrialIndex++;
			trialStartTime = timer.now();

			// Check if time is up
			if (timer.now() >= config.timeLimitMs) {
				finishTest();
			}
		}
	}

	function startTimer() {
		const startTime = timer.now();
		intervalId = setInterval(() => {
			const elapsed = timer.now() - startTime;
			remainingSeconds = Math.max(0, Math.ceil((config.timeLimitMs - elapsed) / 1000));
			if (elapsed >= config.timeLimitMs) {
				finishTest();
			}
		}, 250);
	}

	async function finishTest() {
		running = false;
		if (intervalId !== undefined) {
			clearInterval(intervalId);
			intervalId = undefined;
		}

		try {
			summary = computeSummary(results);

			const session = await waitForSession();
			const startedAt = new Date(Date.now() - config.timeLimitMs).toISOString();
			if (session?.id) {
				await saveTestRun(
					{
						sessionId: session.id,
						testId: config.testId,
						startedAt,
						completedAt: new Date().toISOString(),
						durationMs: config.timeLimitMs,
						config: { ...config },
						summary,
						environmentWarnings: []
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
			}
		} catch (e) {
			console.error('Fehler beim Speichern:', e);
		} finally {
			testShell?.setPhase('completed');
		}
	}

	function runTest() {
		running = true;
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
		if (intervalId !== undefined) clearInterval(intervalId);
		document.removeEventListener('keydown', handleKeydown);
	});
</script>

<TestShell
	bind:this={testShell}
	testId={config.testId}
	testName={config.testName}
	instructions={[...config.instructions]}
	currentTrial={currentTrialIndex}
	totalTrials={0}
	onStart={() => runTest()}
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
					{results.length} beantwortet
				</div>
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
