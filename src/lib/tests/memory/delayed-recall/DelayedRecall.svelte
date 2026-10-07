<script lang="ts">
	import { base } from '$app/paths';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n/index.js';
	import TestShell from '$lib/components/TestShell.svelte';
	import ResultsCard from '$lib/components/ResultsCard.svelte';
	import { HighResTimer } from '$lib/core/timing.js';
	import { DELAYED_RECALL_CONFIG } from './config.js';
	import { computeSummary } from './logic.js';
	import type { DelayedRecallSummary, TestRun } from '$lib/db/models.js';
	import { getLatestTestRun } from '$lib/db/database.js';
	import { saveRunToSession, waitForSession } from '$lib/db/session-store.svelte.js';
	import { getNextTest } from '$lib/tests/registry.js';

	const i = t();
	const config = DELAYED_RECALL_CONFIG;
	const nextTest = getNextTest(config.testId);

	let testShell = $state<TestShell>();
	let summary = $state<DelayedRecallSummary | null>(null);

	let inputWord = $state('');
	let recalledWords = $state<string[]>([]);
	let remainingSeconds = $state(Math.ceil(config.timeLimitMs / 1000));
	let running = $state(false);

	// Prerequisite: a completed word-list run in this session, ideally >= minDelayMinutes ago
	let prereq = $state<'loading' | 'missing' | 'tooEarly' | 'ok'>('loading');
	let wordListRun: TestRun | null = null;
	let minutesSinceWordList = $state(0);

	const timer = new HighResTimer();
	let countdownInterval: ReturnType<typeof setInterval> | null = null;
	let startedAt = '';

	onMount(async () => {
		const session = await waitForSession();
		wordListRun = session?.id ? ((await getLatestTestRun(session.id, config.wordListTestId)) ?? null) : null;
		if (!wordListRun) {
			prereq = 'missing';
			return;
		}
		minutesSinceWordList = (Date.now() - new Date(wordListRun.completedAt).getTime()) / 60000;
		prereq = minutesSinceWordList >= config.minDelayMinutes ? 'ok' : 'tooEarly';
	});

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

	function handleKeydown(e: KeyboardEvent) {
		if (running && e.key === 'Enter' && !timer.paused) {
			e.preventDefault();
			if (inputWord.trim()) {
				addWord();
			}
		}
	}

	async function finishTest() {
		if (!running) return;
		running = false;
		if (countdownInterval) {
			clearInterval(countdownInterval);
			countdownInterval = null;
		}
		// Don't lose a word that was typed but not yet added
		if (inputWord.trim()) addWord();

		const responseTime = timer.now();

		// Immediate recall = last learning trial of the word-list test
		let immediateRecall = 0;
		let delayMinutes = 0;
		if (wordListRun) {
			const wlSummary = wordListRun.summary;
			if (wlSummary.type === 'word-list') {
				immediateRecall = wlSummary.totalLearned;
			}
			delayMinutes = Math.round((Date.now() - new Date(wordListRun.completedAt).getTime()) / 60000);
		}

		try {
			summary = computeSummary(recalledWords, config.targetWords, immediateRecall, delayMinutes);

			await saveRunToSession(
				{
					testId: config.testId,
					startedAt,
					completedAt: new Date().toISOString(),
					durationMs: responseTime,
					config: { ...config },
					summary
				},
				[{
					trialNumber: 0,
					phase: 'delayedRecall',
					stimulus: { targetWords: [...config.targetWords] },
					response: { recalledWords: [...recalledWords] },
					rt: responseTime,
					correct: null,
					onsetTimestamp: 0,
					responseTimestamp: responseTime,
					customData: {
						correctCount: summary.delayedRecall,
						intrusionCount: summary.intrusionErrors,
						wordListRunId: wordListRun?.id ?? null,
						belowMinimumDelay: delayMinutes < config.minDelayMinutes
					}
				}]
			);
		} catch (e) {
			console.error('Fehler beim Speichern:', e);
		} finally {
			testShell?.setPhase('completed');
		}
	}

	function handleStart() {
		running = true;
		startedAt = new Date().toISOString();
		timer.reset();
		remainingSeconds = Math.ceil(config.timeLimitMs / 1000);

		countdownInterval = setInterval(() => {
			const elapsed = timer.now();
			remainingSeconds = Math.max(0, Math.ceil((config.timeLimitMs - elapsed) / 1000));
			if (elapsed >= config.timeLimitMs) {
				finishTest();
			}
		}, 250);
	}

	function getResultMetrics() {
		if (!summary) return [];
		return [
			{ label: 'Verzögerter Abruf', value: `${summary.delayedRecall}/${summary.totalItems}`, highlight: true },
			{ label: 'Unmittelbarer Abruf (Trial 5)', value: `${summary.immediateRecall}/${summary.totalItems}` },
			{ label: 'Behaltenrate', value: `${(summary.retentionRate * 100).toFixed(0)}`, unit: '%', highlight: true },
			{ label: 'Verzögerung', value: `${summary.delayMinutes}`, unit: 'min' },
			{ label: 'Intrusionsfehler', value: summary.intrusionErrors }
		];
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
	});

	onDestroy(() => {
		running = false;
		if (countdownInterval) clearInterval(countdownInterval);
		document.removeEventListener('keydown', handleKeydown);
	});
</script>

{#if prereq === 'loading'}
	<div class="stimulus-area"><span class="text-slate-400">Laden...</span></div>
{:else if prereq === 'missing'}
	<div class="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
		<h1 class="text-2xl font-semibold text-slate-900 mb-4">{config.testName}</h1>
		<p class="text-slate-600 mb-6 max-w-md">
			Dieser Test setzt voraus, dass zuvor der Wortlisten-Test durchgeführt wurde.
		</p>
		<div class="flex gap-3">
			<a href="{base}/" class="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">{i.common.backToOverview}</a>
			<a href="{base}/tests/word-list" class="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
				{i.tests.wordList.name} starten
			</a>
		</div>
	</div>
{:else if prereq === 'tooEarly'}
	<div class="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
		<h1 class="text-2xl font-semibold text-slate-900 mb-4">{config.testName}</h1>
		<p class="text-slate-600 mb-2 max-w-md">
			Der Wortlisten-Test liegt erst {Math.floor(minutesSinceWordList)} Minuten zurück.
			Empfohlen ist eine Verzögerung von mindestens {config.minDelayMinutes} Minuten.
		</p>
		<p class="text-sm text-slate-400 mb-6 max-w-md">
			Bitte noch ca. {Math.ceil(config.minDelayMinutes - minutesSinceWordList)} Minuten warten (z. B. andere Tests durchführen).
		</p>
		<div class="flex gap-3">
			<a href="{base}/" class="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">{i.common.backToOverview}</a>
			<button onclick={() => (prereq = 'ok')} class="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">
				Trotzdem starten
			</button>
		</div>
	</div>
{:else}
<TestShell
	bind:this={testShell}
	testName={config.testName}
	instructions={[...config.instructions]}
	currentTrial={0}
	totalTrials={1}
	onStart={handleStart}
	onPauseChange={(p) => (p ? timer.pause() : timer.resume())}
>
	{#snippet children({ phase })}
		{#if phase === 'running'}
			<div class="stimulus-area">
				<div class="absolute top-5 right-16 text-lg font-mono tabular-nums" class:text-red-500={remainingSeconds <= 10} class:text-slate-400={remainingSeconds > 10}>
					{Math.floor(remainingSeconds / 60)}:{(remainingSeconds % 60).toString().padStart(2, '0')}
				</div>

				<div class="w-full max-w-md text-center">
					<p class="text-sm text-slate-500 mb-2">Erinnern Sie sich an die Wörter der ersten Liste</p>
					<p class="text-sm text-slate-400 mb-4">Geben Sie Wörter ein (Enter zum Hinzufügen)</p>

					<div class="flex gap-2 mb-4">
						<input
							type="text"
							bind:value={inputWord}
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

					<div class="text-sm text-slate-400 mb-4">{recalledWords.length} Wörter</div>

					<button
						onclick={finishTest}
						class="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
					>
						Fertig
					</button>
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
{/if}
