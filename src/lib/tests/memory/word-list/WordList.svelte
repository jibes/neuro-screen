<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n/index.js';
	import TestShell from '$lib/components/TestShell.svelte';
	import ResultsCard from '$lib/components/ResultsCard.svelte';
	import { HighResTimer } from '$lib/core/timing.js';
	import { WORD_LIST_CONFIG } from './config.js';
	import { scoreRecall, computeSummary } from './logic.js';
	import type { RecallResult, RecognitionItem } from './types.js';
	import type { WordListSummary } from '$lib/db/models.js';
	import { saveRunToSession } from '$lib/db/session-store.svelte.js';
	import { getNextTest } from '$lib/tests/registry.js';
	import { shuffled } from '$lib/utils/random.js';

	const i = t();
	const config = WORD_LIST_CONFIG;
	const nextTest = getNextTest(config.testId);

	let testShell = $state<TestShell>();
	let summary = $state<WordListSummary | null>(null);

	type Phase = 'idle' | 'presenting' | 'recall' | 'feedback' | 'recognition' | 'interlude';
	let phase = $state<Phase>('idle');
	let currentWord = $state('');
	let phaseLabel = $state('');
	let trialLabel = $state('');
	let inputWord = $state('');
	let recalledWords = $state<string[]>([]);
	let feedbackText = $state('');
	let recognitionWord = $state('');
	let currentTrialIndex = $state(0);
	let totalTrials = $state(0);
	let recallRemaining = $state(0);

	const timer = new HighResTimer();
	let running = $state(false);

	const learningResults: RecallResult[] = [];
	let interferenceResult: RecallResult | null = null;
	let shortDelayResult: RecallResult | null = null;
	const recognitionItems: RecognitionItem[] = [];

	let resolveRecall: ((words: string[]) => void) | null = null;
	let resolveRecognition: ((answer: boolean) => void) | null = null;

	function addWord() {
		const word = inputWord.trim().toUpperCase();
		if (word && !recalledWords.includes(word)) {
			recalledWords = [...recalledWords, word];
		}
		inputWord = '';
	}

	function removeWord(idx: number) {
		recalledWords = recalledWords.filter((_, i) => i !== idx);
	}

	function submitRecall() {
		// Don't lose a word that was typed but not yet added
		if (inputWord.trim()) addWord();
		if (resolveRecall) {
			resolveRecall([...recalledWords]);
			resolveRecall = null;
		}
	}

	function handleRecognition(answer: boolean) {
		if (resolveRecognition) {
			resolveRecognition(answer);
			resolveRecognition = null;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (phase === 'recall' && e.key === 'Enter' && !timer.paused) {
			e.preventDefault();
			if (inputWord.trim()) {
				addWord();
			}
		}
	}

	async function presentWords(words: readonly string[]) {
		phase = 'presenting';
		for (let i = 0; i < words.length; i++) {
			if (!running) return;
			currentWord = words[i];
			await timer.delay(config.wordDisplayDurationMs);
			currentWord = '';
			if (i < words.length - 1) {
				await timer.delay(config.interWordIntervalMs);
			}
		}
	}

	/** Free recall with time limit (config.recallTimeLimitMs, paused time excluded) */
	async function waitForRecall(): Promise<string[]> {
		phase = 'recall';
		recalledWords = [];
		inputWord = '';
		const limitCtrl = new AbortController();
		const start = timer.now();
		recallRemaining = Math.ceil(config.recallTimeLimitMs / 1000);
		const countdown = setInterval(() => {
			recallRemaining = Math.max(0, Math.ceil((config.recallTimeLimitMs - (timer.now() - start)) / 1000));
		}, 250);
		timer.delay(config.recallTimeLimitMs, limitCtrl.signal).then(() => {
			if (!limitCtrl.signal.aborted) submitRecall();
		});
		try {
			return await new Promise((resolve) => {
				resolveRecall = resolve;
			});
		} finally {
			limitCtrl.abort();
			clearInterval(countdown);
		}
	}

	async function waitForRecognitionAnswer(): Promise<boolean> {
		return new Promise((resolve) => {
			resolveRecognition = resolve;
		});
	}

	async function runTest() {
		running = true;
		timer.reset();
		const startedAt = new Date().toISOString();
		totalTrials = config.learningTrials + 3; // learning + interference + short delay + recognition

		// Phase 1: 5 learning trials
		for (let trial = 0; trial < config.learningTrials; trial++) {
			if (!running) return;
			currentTrialIndex = trial;
			phaseLabel = 'Lerndurchgang';
			trialLabel = `${trial + 1} von ${config.learningTrials}`;

			await presentWords(config.targetWords);

			phaseLabel = 'Freier Abruf';
			const startTime = timer.now();
			const words = await waitForRecall();
			const responseTime = timer.now() - startTime;

			if (!running) return;

			const { correctCount, intrusionCount } = scoreRecall(words, config.targetWords);
			learningResults.push({
				phase: 'learning',
				trialNumber: trial,
				recalledWords: words,
				correctCount,
				intrusionCount,
				responseTimeMs: responseTime
			});

			phase = 'feedback';
			feedbackText = `${correctCount} von ${config.targetWords.length} richtig`;
			await timer.delay(2000);
		}

		// Phase 2: Interference list
		if (!running) return;
		currentTrialIndex = config.learningTrials;
		phaseLabel = 'Interferenzliste';
		trialLabel = '';

		phase = 'interlude';
		feedbackText = 'Jetzt kommt eine neue Wortliste.';
		await timer.delay(2000);

		await presentWords(config.interferenceWords);

		phaseLabel = 'Freier Abruf (Interferenz)';
		const intStart = timer.now();
		const intWords = await waitForRecall();
		if (!running) return;

		phase = 'feedback';
		const intScore = scoreRecall(intWords, config.interferenceWords);
		interferenceResult = {
			phase: 'interference',
			trialNumber: 0,
			recalledWords: intWords,
			correctCount: intScore.correctCount,
			intrusionCount: intScore.intrusionCount,
			responseTimeMs: timer.now() - intStart
		};
		feedbackText = `${intScore.correctCount} von ${config.interferenceWords.length} richtig`;
		await timer.delay(2000);

		// Phase 3: Short-delay free recall of original list
		if (!running) return;
		currentTrialIndex = config.learningTrials + 1;
		phaseLabel = 'Kurzabruf';
		trialLabel = '';

		phase = 'interlude';
		feedbackText = 'Erinnern Sie sich jetzt an die ERSTE Wortliste.';
		await timer.delay(3000);

		const sdStart = timer.now();
		const sdWords = await waitForRecall();
		if (!running) return;

		const sdScore = scoreRecall(sdWords, config.targetWords);
		shortDelayResult = {
			phase: 'shortDelay',
			trialNumber: 0,
			recalledWords: sdWords,
			correctCount: sdScore.correctCount,
			intrusionCount: sdScore.intrusionCount,
			responseTimeMs: timer.now() - sdStart
		};

		phase = 'feedback';
		feedbackText = `${sdScore.correctCount} von ${config.targetWords.length} richtig`;
		await timer.delay(2000);

		// Phase 4: Recognition
		if (!running) return;
		currentTrialIndex = config.learningTrials + 2;
		phaseLabel = 'Rekognition';
		trialLabel = '';

		phase = 'interlude';
		feedbackText = 'War das folgende Wort in der ersten Liste? Ja / Nein';
		await timer.delay(3000);

		const allRecogWords = shuffled([...config.targetWords, ...config.distractorWords]);
		const targetSet = new Set<string>(config.targetWords);

		phase = 'recognition';
		for (let ri = 0; ri < allRecogWords.length; ri++) {
			if (!running) return;
			const word = allRecogWords[ri];
			recognitionWord = word;
			trialLabel = `${ri + 1} von ${allRecogWords.length}`;

			const rtStart = timer.now();
			const answer = await waitForRecognitionAnswer();
			if (!running) return;
			const rt = timer.now() - rtStart;

			const isTarget = targetSet.has(word);
			recognitionItems.push({
				word,
				isTarget,
				userSaidYes: answer,
				correct: (answer && isTarget) || (!answer && !isTarget),
				rt
			});
		}

		try {
			summary = computeSummary(learningResults, shortDelayResult, recognitionItems);

			const recallTrial = (r: RecallResult, trialNumber: number, words: readonly string[]) => ({
				trialNumber,
				phase: r.phase as string,
				stimulus: { words: [...words] },
				response: { recalledWords: r.recalledWords },
				rt: r.responseTimeMs,
				correct: null as boolean | null,
				onsetTimestamp: 0,
				responseTimestamp: r.responseTimeMs,
				customData: { correctCount: r.correctCount, intrusionCount: r.intrusionCount } as Record<string, unknown>
			});
			const recallTrials = [
				...learningResults.map((r) => ({ r, words: config.targetWords })),
				...(interferenceResult ? [{ r: interferenceResult, words: config.interferenceWords }] : []),
				...(shortDelayResult ? [{ r: shortDelayResult, words: config.targetWords }] : [])
			].map(({ r, words }, idx) => recallTrial(r, idx, words));

			const trialData = [
				...recallTrials,
				...recognitionItems.map((r, idx) => ({
					trialNumber: recallTrials.length + idx,
					phase: 'recognition',
					stimulus: { word: r.word, isTarget: r.isTarget } as Record<string, unknown>,
					response: { saidYes: r.userSaidYes } as Record<string, unknown>,
					rt: r.rt as number | null,
					correct: r.correct as boolean | null,
					onsetTimestamp: 0,
					responseTimestamp: r.rt as number | null,
					customData: {} as Record<string, unknown>
				}))
			];

			await saveRunToSession(
				{
					testId: config.testId,
					startedAt,
					completedAt: new Date().toISOString(),
					durationMs: timer.now(),
					config: { ...config },
					summary
				},
				trialData
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
			{ label: `Gelernt (Trial ${summary.learningTrials})`, value: `${summary.totalLearned}/${config.targetWords.length}`, highlight: true },
			{ label: 'Lernsteigung', value: summary.learningSlope.toFixed(2), highlight: true },
			{ label: 'Kurzabruf', value: `${summary.shortDelayFreeRecall}/${config.targetWords.length}` },
			{ label: 'Rekognition (Treffer)', value: `${summary.recognitionHits}/${config.targetWords.length}` },
			{ label: 'Rekognition (Falsche)', value: summary.recognitionFalseAlarms },
			{ label: "d' Rekognition", value: summary.dPrimeRecognition.toFixed(2) },
			{ label: 'Woerter pro Trial', value: summary.wordsPerTrial.join(', ') }
		];
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
	});

	onDestroy(() => {
		running = false;
		resolveRecall?.([]);
		resolveRecall = null;
		resolveRecognition?.(false);
		resolveRecognition = null;
		document.removeEventListener('keydown', handleKeydown);
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
			<div class="stimulus-area">
				{#if phaseLabel}
					<div class="absolute top-4 left-4 text-sm text-slate-400">
						{phaseLabel} {trialLabel ? `(${trialLabel})` : ''}
					</div>
				{/if}

				{#if phase === 'presenting'}
					{#if currentWord}
						<span class="text-6xl font-light text-slate-900 select-none">{currentWord}</span>
					{:else}
						<span class="text-6xl font-light text-transparent select-none">WORT</span>
					{/if}

				{:else if phase === 'recall'}
					<div class="w-full max-w-md text-center">
						<p class="text-sm text-slate-500 mb-1">Geben Sie erinnerte Woerter ein (Enter zum Hinzufuegen)</p>
						<p class="text-xs tabular-nums mb-4 {recallRemaining <= 10 ? 'text-red-500' : 'text-slate-400'}">Noch {recallRemaining} s</p>

						<div class="flex gap-2 mb-4">
							<!-- svelte-ignore a11y_autofocus -->
							<input
								type="text"
								bind:value={inputWord}
								autofocus
								autocomplete="off"
								spellcheck="false"
								placeholder="Wort eingeben..."
								class="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<button
								onclick={addWord}
								disabled={!inputWord.trim()}
								class="px-4 py-2 text-sm bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-30 transition-colors"
							>
								+
							</button>
						</div>

						{#if recalledWords.length > 0}
							<div class="flex flex-wrap gap-2 mb-6 justify-center">
								{#each recalledWords as word, idx}
									<span class="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
										{word}
										<button onclick={() => removeWord(idx)} class="text-blue-400 hover:text-blue-600 ml-1">&times;</button>
									</span>
								{/each}
							</div>
						{/if}

						<div class="text-sm text-slate-400 mb-4">{recalledWords.length} Woerter</div>

						<button
							onclick={submitRecall}
							class="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
						>
							Fertig
						</button>
					</div>

				{:else if phase === 'feedback' || phase === 'interlude'}
					<span class="text-xl text-slate-600">{feedbackText}</span>

				{:else if phase === 'recognition'}
					<div class="text-center">
						<p class="text-sm text-slate-400 mb-6">War dieses Wort in der ersten Liste?</p>
						<span class="text-5xl font-light text-slate-900 select-none mb-8 block">{recognitionWord}</span>
						<div class="flex gap-4 justify-center mt-8">
							<button
								onclick={() => handleRecognition(true)}
								class="px-8 py-3 text-lg font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
							>
								Ja
							</button>
							<button
								onclick={() => handleRecognition(false)}
								class="px-8 py-3 text-lg font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
							>
								Nein
							</button>
						</div>
					</div>

				{:else}
					<span class="text-slate-400">Bereit...</span>
				{/if}
			</div>
		{:else if testPhase === 'completed' && summary}
			<ResultsCard
				testName={config.testName}
				metrics={getResultMetrics()}
				onOverview={() => goto('/')}
				onNext={nextTest ? () => goto(nextTest.href) : undefined}
			/>
		{/if}
	{/snippet}
</TestShell>
