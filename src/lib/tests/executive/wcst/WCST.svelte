<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n/index.js';
	import TestShell from '$lib/components/TestShell.svelte';
	import ResultsCard from '$lib/components/ResultsCard.svelte';
	import { HighResTimer } from '$lib/core/timing.js';
	import { WCST_CONFIG } from './config.js';
	import { generateTestCard, getMatchedDimensions, isCorrectMatch, matchesRule, computeSummary } from './logic.js';
	import type { WCSTCard, WCSTRule, WCSTTrialResult } from './types.js';
	import type { WCSTSummary } from '$lib/db/models.js';
	import { saveTestRun } from '$lib/db/database.js';
	import { waitForSession } from '$lib/db/session-store.svelte.js';

	const i = t();
	const config = WCST_CONFIG;

	let testShell = $state<TestShell>();
	let summary = $state<WCSTSummary | null>(null);

	let currentCard = $state<WCSTCard | null>(null);
	let feedbackText = $state('');
	let feedbackCorrect = $state(false);
	let showFeedback = $state(false);
	let trialNumber = $state(0);
	let running = $state(false);

	const timer = new HighResTimer();
	const results: WCSTTrialResult[] = [];
	let currentRuleIndex = 0;
	let previousRule: WCSTRule | null = null;
	let consecutiveCorrect = 0;
	let categoriesCompleted = 0;
	let trialStartTime = 0;

	const currentRule = $derived(config.ruleSequence[currentRuleIndex % 3]);

	function nextTrial() {
		currentCard = generateTestCard();
		trialStartTime = timer.now();
		showFeedback = false;
	}

	async function handleCardClick(refIndex: number) {
		if (!running || showFeedback || !currentCard) return;

		const rt = timer.now() - trialStartTime;
		const correct = isCorrectMatch(currentCard, refIndex, currentRule);
		const matchedDimensions = getMatchedDimensions(currentCard, config.referenceCards[refIndex]);

		// Perseveration check
		let isPerseverative = false;
		if (!correct && previousRule !== null) {
			isPerseverative = matchesRule(currentCard, refIndex, previousRule);
		}

		results.push({
			testCard: currentCard,
			selectedRefIndex: refIndex,
			currentRule,
			matchedDimensions,
			correct,
			isPerseverative,
			trialNumber,
			rt
		});

		// Show feedback
		feedbackCorrect = correct;
		feedbackText = correct ? 'Richtig' : 'Falsch';
		showFeedback = true;

		if (correct) {
			consecutiveCorrect++;
		} else {
			consecutiveCorrect = 0;
		}

		// Check category completion
		if (consecutiveCorrect >= config.correctToSwitch) {
			categoriesCompleted++;
			consecutiveCorrect = 0;
			previousRule = currentRule;
			currentRuleIndex++;
		}

		trialNumber++;

		await timer.delay(config.feedbackDurationMs);

		// Check end conditions
		if (categoriesCompleted >= config.maxCategories || trialNumber >= config.maxTrials) {
			finishTest();
		} else {
			nextTrial();
		}
	}

	async function finishTest() {
		running = false;
		try {
			summary = computeSummary(results);

			const session = await waitForSession();
			if (session?.id) {
				await saveTestRun(
					{
						sessionId: session.id,
						testId: config.testId,
						startedAt: new Date(Date.now() - trialNumber * 2000).toISOString(),
						completedAt: new Date().toISOString(),
						durationMs: timer.now(),
						config: { ...config, referenceCards: undefined },
						summary,
						environmentWarnings: []
					},
					results.map((r, idx) => ({
						trialNumber: idx,
						phase: 'test',
						stimulus: { testCard: r.testCard, currentRule: r.currentRule },
						response: { selectedRefIndex: r.selectedRefIndex },
						rt: r.rt,
						correct: r.correct,
						onsetTimestamp: 0,
						responseTimestamp: r.rt,
						customData: { isPerseverative: r.isPerseverative, matchedDimensions: r.matchedDimensions }
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
		nextTrial();
	}

	function renderCard(card: WCSTCard, size: number = 80): { path: string; color: string; count: number } {
		return {
			path: config.shapePaths[card.shape],
			color: config.colorHex[card.color],
			count: card.count
		};
	}

	function getResultMetrics() {
		if (!summary) return [];
		return [
			{ label: 'Kategorien', value: `${summary.categoriesCompleted}/${config.maxCategories}`, highlight: true },
			{ label: 'Perseverative Fehler', value: summary.perseverativeErrors, highlight: true },
			{ label: 'Gesamtfehler', value: summary.totalErrors },
			{ label: 'Nicht-perseverative Fehler', value: summary.nonPerseverativeErrors },
			{ label: 'Konzeptuelles Niveau', value: summary.conceptualLevelResponses },
			{ label: 'Trials bis 1. Kategorie', value: summary.trialsToFirstCategory },
			{ label: 'Gesamttrials', value: summary.totalTrials }
		];
	}

	onDestroy(() => {
		running = false;
	});
</script>

<TestShell
	bind:this={testShell}
	testId={config.testId}
	testName={config.testName}
	instructions={[...config.instructions]}
	currentTrial={trialNumber}
	totalTrials={config.maxTrials}
	onStart={() => runTest()}
>
	{#snippet children({ phase })}
		{#if phase === 'running'}
			<div class="stimulus-area">
				<!-- Reference cards -->
				<div class="flex gap-4 mb-10">
					{#each config.referenceCards as card, idx}
						<button
							class="w-24 h-32 bg-white rounded-lg border-2 border-slate-300 flex flex-col items-center justify-center gap-1 hover:border-blue-400 hover:shadow-md transition-all {showFeedback ? 'pointer-events-none opacity-60' : 'cursor-pointer'}"
							onclick={() => handleCardClick(idx)}
							disabled={showFeedback}
						>
							{#each Array(card.count) as _, shapeIdx}
								<svg viewBox="0 0 100 100" class="w-5 h-5">
									<path d={config.shapePaths[card.shape]} fill={config.colorHex[card.color]} />
								</svg>
							{/each}
						</button>
					{/each}
				</div>

				<!-- Feedback -->
				{#if showFeedback}
					<div class="mb-4 text-lg font-medium {feedbackCorrect ? 'text-green-600' : 'text-red-600'}">
						{feedbackText}
					</div>
				{/if}

				<!-- Test card -->
				{#if currentCard}
					<div class="w-28 h-36 bg-white rounded-lg border-2 border-slate-400 flex flex-col items-center justify-center gap-1 shadow-lg">
						{#each Array(currentCard.count) as _}
							<svg viewBox="0 0 100 100" class="w-6 h-6">
								<path d={config.shapePaths[currentCard.shape]} fill={config.colorHex[currentCard.color]} />
							</svg>
						{/each}
					</div>
				{/if}

				<div class="mt-6 text-sm text-slate-400">
					Trial {trialNumber + 1} / {config.maxTrials}
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
