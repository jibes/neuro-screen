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
	import { getGermanVoice, speak, stopSpeaking } from '$lib/core/speech.js';
	import { DIGIT_SPAN_CONFIG } from './config.js';
	import { generateTrials, generateDigitSequence, checkResponse, computeSummary } from './logic.js';
	import type { DigitSpanResult, SpanDirection } from './types.js';
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
	let running = $state(false);
	let direction = $state<SpanDirection>('forward');
	/** Auditory presentation (spoken digits, as in the WAIS) when a German voice exists, else visual */
	let voice: SpeechSynthesisVoice | null = null;
	let presentationMode = $state<'auditory' | 'visual'>('visual');

	async function presentDigits(digits: number[]) {
		phase = 'presenting';
		for (let idx = 0; idx < digits.length; idx++) {
			if (!running) return;
			if (voice) speak(String(digits[idx]), voice);
			currentDigit = digits[idx].toString();
			await timer.delay(config.digitDisplayDurationMs);
			currentDigit = '';
			if (idx < digits.length - 1) {
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

	async function showMessage(text: string, correct: boolean | null, ms: number) {
		phase = 'feedback';
		feedbackCorrect = correct ?? true;
		feedbackText = text;
		neutralFeedback = correct === null;
		await timer.delay(ms);
		phase = 'idle';
		await timer.delay(500);
	}
	let neutralFeedback = $state(false);

	/** Practice trials with feedback (not scored) */
	async function runPractice(dir: SpanDirection, span: number, count: number): Promise<boolean> {
		practicing = true;
		direction = dir;
		for (let p = 0; p < count; p++) {
			if (!running) return false;
			const digits = generateDigitSequence(span);
			await presentDigits(digits);
			if (!running) return false;
			const response = await waitForInput();
			if (!running) return false;
			const ok = checkResponse({ digits, spanLength: span, attemptNumber: p + 1, direction: dir }, response);
			const expected = dir === 'backward' ? [...digits].reverse() : digits;
			await showMessage(ok ? i.common.correct : `Richtig wäre: ${expected.join(' ')}`, ok, ok ? 1000 : 2500);
		}
		practicing = false;
		return running;
	}

	/** Test block for one direction: no feedback, discontinue after both trials of a length fail */
	async function runBlock(dir: SpanDirection, results: DigitSpanResult[]): Promise<boolean> {
		direction = dir;
		const trials = generateTrials(dir);
		totalTrials = trials.length;
		let failuresAtSpan = 0;
		let lastSpan = -1;

		for (let idx = 0; idx < trials.length; idx++) {
			if (!running) return false;
			currentTrialIndex = idx;
			const trial = trials[idx];

			await presentDigits(trial.digits);
			const startTime = timer.now();
			const userResponse = await waitForInput();
			const responseTime = timer.now() - startTime;
			if (!running) return false;

			const correct = checkResponse(trial, userResponse);
			results.push({ trial, userResponse, correct, responseTimeMs: responseTime });

			if (trial.spanLength !== lastSpan) {
				lastSpan = trial.spanLength;
				failuresAtSpan = 0;
			}
			if (!correct) failuresAtSpan++;
			if (failuresAtSpan >= config.maxFailuresPerSpan) break;

			phase = 'idle';
			await timer.delay(1000);
		}
		currentTrialIndex = totalTrials;
		return running;
	}

	async function runTest() {
		running = true;
		timer.reset();
		voice = await getGermanVoice();
		presentationMode = voice ? 'auditory' : 'visual';

		const testStart = timer.now();
		const startedAt = new Date().toISOString();
		const results: DigitSpanResult[] = [];

		// Forward
		if (!(await runPractice('forward', config.practiceSpan, config.practiceTrials))) return;
		await showMessage('Jetzt beginnt der Test (vorwärts).', null, 2500);
		if (!(await runBlock('forward', results))) return;

		// Backward
		await showMessage('Nun rückwärts: Geben Sie die Zahlen in UMGEKEHRTER Reihenfolge ein.', null, 4000);
		if (!(await runPractice('backward', config.backwardPracticeSpan, config.backwardPracticeTrials))) return;
		await showMessage('Jetzt beginnt der Test (rückwärts).', null, 2500);
		if (!(await runBlock('backward', results))) return;

		const durationMs = timer.now() - testStart;

		try {
			summary = computeSummary(results);

			await saveRunToSession(
				{
					testId: config.testId,
					startedAt,
					completedAt: new Date().toISOString(),
					durationMs,
					config: { ...config, presentationMode },
					summary
				},
				results.map((r, idx) => ({
					trialNumber: idx,
					phase: r.trial.direction,
					stimulus: { digits: r.trial.digits, spanLength: r.trial.spanLength, attempt: r.trial.attemptNumber },
					response: { userResponse: r.userResponse },
					rt: r.responseTimeMs,
					correct: r.correct,
					onsetTimestamp: 0,
					responseTimestamp: r.responseTimeMs,
					customData: { presentationMode }
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
			{ label: 'Längste Spanne vorwärts', value: summary.forwardSpan, highlight: true },
			{ label: 'Längste Spanne rückwärts', value: summary.backwardSpan, highlight: true },
			{ label: 'Rohwert vorwärts (korrekte Durchgänge)', value: `${summary.forwardScore}/${summary.forwardTotalTrials}` },
			{ label: 'Rohwert rückwärts (korrekte Durchgänge)', value: `${summary.backwardScore}/${summary.backwardTotalTrials}` },
			{ label: 'Gesamtrohwert', value: summary.forwardScore + summary.backwardScore },
			{ label: 'Darbietung', value: presentationMode === 'auditory' ? 'gesprochen' : 'visuell' }
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
		stopSpeaking();
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
					{#if presentationMode === 'auditory'}
						<!-- Auditory presentation: digits are only heard -->
						<svg viewBox="0 0 24 24" class="h-16 w-16 text-slate-400 {currentDigit ? 'opacity-100' : 'opacity-40'} transition-opacity" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-label="Zuhören">
							<path d="M11 5 6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
						</svg>
						<p class="mt-4 text-sm text-slate-400">Hören Sie gut zu …</p>
					{:else if currentDigit}
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
						<p class="text-base font-medium mb-1 px-4 {direction === 'backward' ? 'text-amber-600' : 'text-slate-700'}">
							{direction === 'backward' ? 'Rückwärts: in umgekehrter Reihenfolge' : 'Vorwärts: in derselben Reihenfolge'}
						</p>
						<p class="text-sm text-slate-500 mb-4 px-4">Eingabe per Tastatur oder Ziffernfeld, bestätigen mit Enter bzw. OK</p>
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
					<span class="px-6 text-center text-2xl font-medium {neutralFeedback ? 'text-slate-600' : feedbackCorrect ? 'text-green-600' : 'text-red-600'}">
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
