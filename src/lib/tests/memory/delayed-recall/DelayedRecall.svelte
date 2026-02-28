<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n/index.js';
	import TestShell from '$lib/components/TestShell.svelte';
	import ResultsCard from '$lib/components/ResultsCard.svelte';
	import { HighResTimer } from '$lib/core/timing.js';
	import { DELAYED_RECALL_CONFIG } from './config.js';
	import { computeSummary } from './logic.js';
	import type { DelayedRecallSummary } from '$lib/db/models.js';
	import { saveTestRun, getLatestTestRun } from '$lib/db/database.js';
	import { waitForSession } from '$lib/db/session-store.svelte.js';

	const i = t();
	const config = DELAYED_RECALL_CONFIG;

	let testShell = $state<TestShell>();
	let summary = $state<DelayedRecallSummary | null>(null);

	let inputWord = $state('');
	let recalledWords = $state<string[]>([]);
	let remainingSeconds = $state(90);
	let running = $state(false);

	const timer = new HighResTimer();
	let countdownInterval: ReturnType<typeof setInterval> | null = null;

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
		if (running && e.key === 'Enter') {
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

		const responseTime = timer.now();

		// Get immediate recall from word-list test (trial 5)
		let immediateRecall = 0;
		let delayMinutes = 0;
		const session = await waitForSession();
		if (session?.id) {
			const wordListRun = await getLatestTestRun(session.id, config.wordListTestId);
			if (wordListRun) {
				const wlSummary = wordListRun.summary;
				if ('totalLearned' in wlSummary) {
					immediateRecall = wlSummary.totalLearned as number;
				}
				// Calculate delay in minutes
				const wordListTime = new Date(wordListRun.completedAt).getTime();
				delayMinutes = Math.round((Date.now() - wordListTime) / 60000);
			}
		}

		try {
			summary = computeSummary(
				recalledWords,
				config.targetWords,
				immediateRecall,
				delayMinutes
			);

			if (session?.id) {
				const startedAt = new Date(Date.now() - responseTime).toISOString();
				await saveTestRun(
					{
						sessionId: session.id,
						testId: config.testId,
						startedAt,
						completedAt: new Date().toISOString(),
						durationMs: responseTime,
						config: { ...config },
						summary,
						environmentWarnings: []
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
							intrusionCount: summary.intrusionErrors
						}
					}]
				);
			}
		} catch (e) {
			console.error('Fehler beim Speichern:', e);
		} finally {
			testShell?.setPhase('completed');
		}
	}

	function handleStart() {
		running = true;
		timer.reset();
		remainingSeconds = Math.round(config.timeLimitMs / 1000);

		countdownInterval = setInterval(() => {
			const elapsed = timer.now();
			remainingSeconds = Math.max(0, Math.round((config.timeLimitMs - elapsed) / 1000));
			if (remainingSeconds <= 0) {
				finishTest();
			}
		}, 250);
	}

	function getResultMetrics() {
		if (!summary) return [];
		return [
			{ label: 'Verzoegerter Abruf', value: `${summary.delayedRecall}/${summary.totalItems}`, highlight: true },
			{ label: 'Unmittelbarer Abruf (Trial 5)', value: `${summary.immediateRecall}/${summary.totalItems}` },
			{ label: 'Behaltenrate', value: `${(summary.retentionRate * 100).toFixed(0)}`, unit: '%', highlight: true },
			{ label: 'Verzoegerung', value: `${summary.delayMinutes}`, unit: 'min' },
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

<TestShell
	bind:this={testShell}
	testId={config.testId}
	testName={config.testName}
	instructions={[...config.instructions]}
	currentTrial={0}
	totalTrials={1}
	onStart={handleStart}
>
	{#snippet children({ phase })}
		{#if phase === 'running'}
			<div class="stimulus-area">
				<div class="absolute top-4 right-4 text-lg font-mono tabular-nums" class:text-red-500={remainingSeconds <= 10} class:text-slate-400={remainingSeconds > 10}>
					{Math.floor(remainingSeconds / 60)}:{(remainingSeconds % 60).toString().padStart(2, '0')}
				</div>

				<div class="w-full max-w-md text-center">
					<p class="text-sm text-slate-500 mb-2">Erinnern Sie sich an die Woerter der ersten Liste</p>
					<p class="text-sm text-slate-400 mb-4">Geben Sie Woerter ein (Enter zum Hinzufuegen)</p>

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

					<div class="text-sm text-slate-400 mb-4">{recalledWords.length} Woerter</div>

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
				onOverview={() => goto('/')}
			/>
		{/if}
	{/snippet}
</TestShell>
