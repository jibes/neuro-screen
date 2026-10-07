<script lang="ts">
	import { base } from '$app/paths';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n/index.js';
	import TestShell from '$lib/components/TestShell.svelte';
	import FixationCross from '$lib/components/FixationCross.svelte';
	import NumericKeypad from '$lib/components/NumericKeypad.svelte';
	import ResultsCard from '$lib/components/ResultsCard.svelte';
	import { HighResTimer } from '$lib/core/timing.js';
	import { AudioEngine } from '$lib/core/audio-engine.js';
	import { DIGIT_SPAN_CONFIG } from './config.js';
	import { generateForwardTrials, generateDigitSequence, checkResponse, computeSummary } from './logic.js';
	import type { DigitSpanTrial, DigitSpanResult } from './types.js';
	import type { DigitSpanSummary } from '$lib/db/models.js';
	import { saveRunToSession } from '$lib/db/session-store.svelte.js';
	import { getNextTest } from '$lib/tests/registry.js';

	const i = t();
	const config = DIGIT_SPAN_CONFIG;
	const nextTest = getNextTest(config.testId);

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
	let practicing = $state(false);

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
			if (!running) return;
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
		if (phase !== 'input' || e.repeat || timer.paused) return;

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
		timer.reset();
		await audio.init();
		// Practice trials with feedback (not scored)
		practicing = true;
		for (let p = 0; p < config.practiceTrials; p++) {
			if (!running) return;
			const digits = generateDigitSequence(config.practiceSpan);
			await presentDigits(digits);
			if (!running) return;
			const response = await waitForInput();
			if (!running) return;
			const ok = checkResponse({ digits, spanLength: digits.length, attemptNumber: p + 1 }, response);
			phase = 'feedback';
			feedbackCorrect = ok;
			feedbackText = ok ? i.common.correct : i.common.incorrect;
			await timer.delay(config.digitDisplayDurationMs);
			phase = 'idle';
			await timer.delay(500);
		}
		if (!running) return;
		practicing = false;
		phase = 'feedback';
		feedbackCorrect = true;
		feedbackText = i.common.practiceComplete;
		await timer.delay(3000);
		phase = 'idle';
		await timer.delay(500);

		const testStart = timer.now();
		const startedAt = new Date().toISOString();
		const allTrials = generateForwardTrials();
		totalTrials = allTrials.length;
		const results: DigitSpanResult[] = [];
		let failuresAtSpan = 0;
		let lastSpan = -1;

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

			if (!running) return;

			// Evaluate
			const correct = checkResponse(trial, userResponse);

			// Show feedback
			phase = 'feedback';
			feedbackCorrect = correct;
			feedbackText = correct ? i.common.correct : i.common.incorrect;
			await timer.delay(config.digitDisplayDurationMs);

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

			// Brief pause between trials
			phase = 'idle';
			await timer.delay(500);
		}

		// Left the page mid-test: never save a partial run
		if (!running) return;
		const durationMs = timer.now() - testStart;

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
					stimulus: { digits: r.trial.digits, spanLength: r.trial.spanLength },
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
			{ label: 'Korrekte Durchgänge', value: summary.forwardTrialsCorrect },
			{ label: 'Gesamt-Durchgänge', value: summary.forwardTotalTrials },
			{ label: 'Score', value: summary.forwardScore, highlight: true }
		];
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
	});

	onDestroy(() => {
		running = false;
		resolveInput?.([]);
		resolveInput = null;
		document.removeEventListener('keydown', handleKeydown);
		audio.destroy();
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
			{#if practicing}
				<div class="fixed top-4 left-4 text-sm font-medium text-amber-600">{i.common.practice}</div>
			{/if}
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
						<p class="text-sm text-slate-500 mb-4 px-4">Geben Sie die Zahlen ein (Tastatur oder Ziffernfeld) und bestätigen Sie mit Enter bzw. OK</p>
						<div class="text-4xl sm:text-5xl font-light text-slate-900 tracking-[0.3em] sm:tracking-[0.5em] min-h-[1.5em] tabular-nums mb-6 break-all px-4">
							{userInput || '\u00A0'}
						</div>
						<NumericKeypad
							onDigit={(d) => {
								if (!timer.paused) userInput += String(d);
							}}
							onBackspace={() => (userInput = userInput.slice(0, -1))}
							onSubmit={submitResponse}
							backspaceDisabled={userInput.length === 0}
							submitDisabled={userInput.length === 0}
							submitLabel="OK"
						/>
					</div>
				</div>
			{:else if phase === 'feedback'}
				<div class="stimulus-area">
					<span class="text-2xl font-medium {feedbackText === i.common.practiceComplete ? 'text-slate-600' : feedbackCorrect ? 'text-green-600' : 'text-red-600'}">
						{feedbackText}
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
