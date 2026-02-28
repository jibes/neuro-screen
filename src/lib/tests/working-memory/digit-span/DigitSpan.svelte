<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n/index.js';
	import TestShell from '$lib/components/TestShell.svelte';
	import FixationCross from '$lib/components/FixationCross.svelte';
	import ResultsCard from '$lib/components/ResultsCard.svelte';
	import { HighResTimer } from '$lib/core/timing.js';
	import { AudioEngine } from '$lib/core/audio-engine.js';
	import { DIGIT_SPAN_CONFIG } from './config.js';
	import { generateForwardTrials, checkResponse, computeSummary } from './logic.js';
	import type { DigitSpanTrial, DigitSpanResult } from './types.js';
	import type { DigitSpanSummary } from '$lib/db/models.js';
	import { saveTestRun } from '$lib/db/database.js';
	import { waitForSession } from '$lib/db/session-store.svelte.js';

	const i = t();
	const config = DIGIT_SPAN_CONFIG;

	let testShell = $state<TestShell>();
	let summary = $state<DigitSpanSummary | null>(null);

	type Phase = 'idle' | 'presenting' | 'input' | 'feedback';
	let phase = $state<Phase>('idle');
	let currentDigit = $state<string>('');
	let userInput = $state<string>('');
	let feedbackText = $state<string>('');
	let feedbackCorrect = $state(false);
	let currentTrialIndex = $state(0);
	let totalTrials = $state(0);

	const timer = new HighResTimer();
	const audio = new AudioEngine();
	let running = $state(false);

	// Digit tones: each digit maps to a different frequency
	const digitFrequencies: Record<number, number> = {
		1: 261, 2: 293, 3: 329, 4: 349, 5: 392,
		6: 440, 7: 493, 8: 523, 9: 587
	};

	async function presentDigits(digits: number[]) {
		phase = 'presenting';
		for (let i = 0; i < digits.length; i++) {
			currentDigit = digits[i].toString();
			audio.playTone(digitFrequencies[digits[i]], 0.4);
			await timer.delay(config.digitDisplayDurationMs);
			currentDigit = '';
			if (i < digits.length - 1) {
				await timer.delay(config.interDigitIntervalMs);
			}
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (phase !== 'input') return;

		if (e.key >= '1' && e.key <= '9') {
			userInput += e.key;
		} else if (e.key === 'Backspace') {
			userInput = userInput.slice(0, -1);
		} else if (e.key === 'Enter' && userInput.length > 0) {
			submitResponse();
		}
	}

	let resolveInput: ((response: number[]) => void) | null = null;

	function submitResponse() {
		const response = userInput.split('').map(Number);
		userInput = '';
		if (resolveInput) {
			resolveInput(response);
			resolveInput = null;
		}
	}

	function waitForInput(): Promise<number[]> {
		phase = 'input';
		userInput = '';
		return new Promise((resolve) => {
			resolveInput = resolve;
		});
	}

	async function runTest() {
		running = true;
		await audio.init();
		const allTrials = generateForwardTrials();
		totalTrials = allTrials.length;
		const results: DigitSpanResult[] = [];
		let consecutiveFailures = 0;
		const startedAt = new Date().toISOString();

		for (let idx = 0; idx < allTrials.length; idx++) {
			if (!running) break;

			currentTrialIndex = idx;
			const trial = allTrials[idx];

			// Present digits
			await presentDigits(trial.digits);

			// Wait for user input
			const startTime = timer.now();
			const userResponse = await waitForInput();
			const responseTime = timer.now() - startTime;

			if (!running) break;

			// Evaluate
			const correct = checkResponse(trial, userResponse);

			// Show feedback
			phase = 'feedback';
			feedbackCorrect = correct;
			feedbackText = correct ? i.common.correct : i.common.incorrect;
			await timer.delay(config.digitDisplayDurationMs);

			results.push({ trial, userResponse, correct, responseTimeMs: responseTime });

			// Adaptive stopping: track consecutive failures at same span
			if (!correct) {
				consecutiveFailures++;
			} else {
				consecutiveFailures = 0;
			}

			if (consecutiveFailures >= config.maxConsecutiveFailures) {
				break;
			}

			// Brief pause between trials
			phase = 'idle';
			await timer.delay(500);
		}

		try {
			summary = computeSummary(results);

			const session = await waitForSession();
			if (session?.id) {
				await saveTestRun(
					{
						sessionId: session.id,
						testId: config.testId,
						startedAt,
						completedAt: new Date().toISOString(),
						durationMs: results.reduce((sum, r) => sum + r.responseTimeMs, 0),
						config: { ...config },
						summary,
						environmentWarnings: []
					},
					results.map((r, idx) => ({
						trialNumber: idx,
						phase: 'test',
						stimulus: { digits: r.trial.digits, spanLength: r.trial.spanLength },
						response: { userResponse: r.userResponse },
						rt: r.responseTimeMs,
						correct: r.correct,
						onsetTimestamp: 0,
						responseTimestamp: r.responseTimeMs,
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

	function getResultMetrics() {
		if (!summary) return [];
		return [
			{ label: i.results.forwardSpan, value: summary.forwardSpan, highlight: true },
			{ label: 'Korrekte Durchgaenge', value: summary.forwardTrialsCorrect },
			{ label: 'Gesamt-Durchgaenge', value: summary.forwardTotalTrials },
			{ label: 'Score', value: summary.forwardScore, highlight: true }
		];
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
	});

	onDestroy(() => {
		running = false;
		document.removeEventListener('keydown', handleKeydown);
		audio.destroy();
	});
</script>

<TestShell
	bind:this={testShell}
	testId={config.testId}
	testName={config.testName}
	instructions={[...config.instructions]}
	currentTrial={currentTrialIndex}
	totalTrials={totalTrials}
	onStart={() => runTest()}
>
	{#snippet children({ phase: testPhase })}
		{#if testPhase === 'running'}
			{#if phase === 'idle'}
				<FixationCross />
			{:else if phase === 'presenting'}
				<div class="stimulus-area">
					{#if currentDigit}
						<span class="text-8xl font-light text-slate-900 tabular-nums select-none">
							{currentDigit}
						</span>
					{:else}
						<span class="fixation-cross">+</span>
					{/if}
				</div>
			{:else if phase === 'input'}
				<div class="stimulus-area">
					<div class="text-center">
						<p class="text-sm text-slate-500 mb-4">Geben Sie die Zahlen ein und druecken Sie Enter</p>
						<div class="text-5xl font-light text-slate-900 tracking-[0.5em] min-h-[1.5em] tabular-nums mb-6">
							{userInput || '\u00A0'}
						</div>
						<div class="flex gap-2 justify-center">
							<button
								onclick={() => { userInput = userInput.slice(0, -1); }}
								disabled={userInput.length === 0}
								class="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-30 transition-colors"
							>
								{i.common.back}
							</button>
							<button
								onclick={submitResponse}
								disabled={userInput.length === 0}
								class="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-30 transition-colors"
							>
								Bestaetigen
							</button>
						</div>
					</div>
				</div>
			{:else if phase === 'feedback'}
				<div class="stimulus-area">
					<span class="text-2xl font-medium {feedbackCorrect ? 'text-green-600' : 'text-red-600'}">
						{feedbackText}
					</span>
				</div>
			{/if}
		{:else if testPhase === 'completed' && summary}
			<ResultsCard
				testName={config.testName}
				metrics={getResultMetrics()}
				onOverview={() => goto('/')}
			/>
		{/if}
	{/snippet}
</TestShell>
