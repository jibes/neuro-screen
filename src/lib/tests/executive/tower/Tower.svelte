<script lang="ts">
	import { base } from '$app/paths';
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n/index.js';
	import TestShell from '$lib/components/TestShell.svelte';
	import ResultsCard from '$lib/components/ResultsCard.svelte';
	import { HighResTimer } from '$lib/core/timing.js';
	import { AudioEngine } from '$lib/core/audio-engine.js';
	import { TOWER_CONFIG } from './config.js';
	import { cloneState, isValidMove, applyMove, isGoalReached, computeSummary } from './logic.js';
	import type { TowerState, TowerProblemResult, DiscColor } from './types.js';
	import type { TowerSummary } from '$lib/db/models.js';
	import { saveRunToSession } from '$lib/db/session-store.svelte.js';
	import { getNextTest } from '$lib/tests/registry.js';

	const i = t();
	const config = TOWER_CONFIG;
	const nextTest = getNextTest(config.testId);

	let testShell = $state<TestShell>();
	let summary = $state<TowerSummary | null>(null);

	let currentProblemIndex = $state(0);
	let currentState = $state<TowerState>({ pegs: [[], [], []] });
	let selectedPeg = $state<number | null>(null);
	let moves = $state(0);
	let ruleViolations = $state(0);
	let running = $state(false);
	let firstMoveMade = $state(false);
	let errorMessage = $state('');

	const timer = new HighResTimer();
	const audio = new AudioEngine();
	const results: TowerProblemResult[] = [];
	let problemStartTime = 0;
	let firstMoveTime = 0;
	let startedAt = '';

	const currentProblem = $derived(
		currentProblemIndex < config.problems.length ? config.problems[currentProblemIndex] : null
	);

	function handlePegClick(pegIndex: number) {
		if (!running || !currentProblem || timer.paused) return;

		if (selectedPeg === null) {
			// Select peg (only if it has discs)
			if (currentState.pegs[pegIndex].length > 0) {
				selectedPeg = pegIndex;
			}
		} else {
			// Try to move
			if (pegIndex === selectedPeg) {
				selectedPeg = null;
				return;
			}

			if (isValidMove(currentState, selectedPeg, pegIndex)) {
				if (!firstMoveMade) {
					firstMoveTime = timer.now();
					firstMoveMade = true;
				}
				currentState = applyMove(currentState, selectedPeg, pegIndex);
				moves++;
				errorMessage = '';

				// Check if solved
				if (isGoalReached(currentState, currentProblem.goal)) {
					completeProblem(true);
				} else if (moves >= currentProblem.maxMoves) {
					completeProblem(false);
				}
			} else {
				ruleViolations++;
				audio.playError();
				errorMessage = 'Ungültiger Zug!';
				setTimeout(() => { errorMessage = ''; }, 1000);
			}

			selectedPeg = null;
		}
	}

	function completeProblem(solved: boolean) {
		const now = timer.now();
		const planningTime = firstMoveMade ? firstMoveTime - problemStartTime : now - problemStartTime;
		const executionTime = firstMoveMade ? now - firstMoveTime : 0;

		results.push({
			problem: currentProblem!,
			moves,
			planningTimeMs: planningTime,
			executionTimeMs: executionTime,
			solved,
			ruleViolations
		});

		currentProblemIndex++;

		if (currentProblemIndex >= config.problems.length) {
			finishTest();
		} else {
			startProblem();
		}
	}

	function startProblem() {
		const problem = config.problems[currentProblemIndex];
		currentState = cloneState(problem.initial);
		selectedPeg = null;
		moves = 0;
		ruleViolations = 0;
		firstMoveMade = false;
		errorMessage = '';
		problemStartTime = timer.now();
	}

	async function finishTest() {
		running = false;
		try {
			summary = computeSummary(results);

			await saveRunToSession(
				{
					testId: config.testId,
					startedAt,
					completedAt: new Date().toISOString(),
					durationMs: timer.now(),
					config: { ...config, problems: undefined },
					summary
				},
				results.map((r, idx) => ({
					trialNumber: idx,
					phase: 'test',
					stimulus: { problemId: r.problem.id, optimalMoves: r.problem.optimalMoves },
					response: { moves: r.moves, solved: r.solved },
					rt: r.planningTimeMs + r.executionTimeMs,
					correct: r.solved,
					onsetTimestamp: 0,
					responseTimestamp: r.planningTimeMs + r.executionTimeMs,
					customData: { planningTime: r.planningTimeMs, ruleViolations: r.ruleViolations }
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
		audio.init();
		timer.reset();
		startProblem();
	}

	function getResultMetrics() {
		if (!summary) return [];
		return [
			{ label: 'Gelöst', value: `${summary.problemsSolved}/${summary.totalProblems}`, highlight: true },
			{ label: 'Überzüge', value: summary.excessMoves, highlight: true },
			{ label: 'Planungszeit (Mittel)', value: `${summary.meanPlanningTime.toFixed(0)}`, unit: 'ms' },
			{ label: 'Ausführungszeit (Mittel)', value: `${summary.meanExecutionTime.toFixed(0)}`, unit: 'ms' },
			{ label: 'Regelverstöße', value: summary.ruleViolations }
		];
	}

	onDestroy(() => {
		running = false;
		audio.destroy();
	});
</script>

<TestShell
	bind:this={testShell}
	testName={config.testName}
	instructions={[...config.instructions]}
	currentTrial={currentProblemIndex}
	totalTrials={config.problems.length}
	onStart={() => runTest()}
	onPauseChange={(p) => (p ? timer.pause() : timer.resume())}
>
	{#snippet children({ phase })}
		{#if phase === 'running' && currentProblem}
			<div class="stimulus-area">
				<!-- Goal state -->
				<div class="mb-6">
					<p class="text-sm text-slate-400 mb-2">Zielzustand (Problem {currentProblemIndex + 1}/{config.problems.length}):</p>
					<div class="flex gap-3 sm:gap-8 justify-center">
						{#each currentProblem.goal.pegs as peg, pegIdx}
							<div class="flex flex-col items-center">
								<div class="flex flex-col-reverse items-center gap-1 h-20 justify-start">
									{#each peg as disc}
										<div
											class="rounded h-5"
											style="width: {40 + 10}px; background-color: {config.colorHex[disc]}; opacity: 0.6;"
										></div>
									{/each}
								</div>
								<div class="w-16 h-1 bg-slate-300 rounded mt-1"></div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Current state -->
				<div class="mb-4">
					<p class="text-sm text-slate-400 mb-2">Aktuell (Zug {moves}/{currentProblem.maxMoves}):</p>
					<div class="flex gap-3 sm:gap-8 justify-center">
						{#each currentState.pegs as peg, pegIdx}
							<button
								class="flex flex-col items-center cursor-pointer group px-1 py-2 rounded-lg touch-manipulation"
								onclick={() => handlePegClick(pegIdx)}
							>
								<div class="flex flex-col-reverse items-center gap-1 h-28 justify-start">
									{#each peg as disc, discIdx}
										<div
											class="rounded h-6 transition-all
												{selectedPeg === pegIdx && discIdx === peg.length - 1
													? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-50 scale-110'
													: ''}"
											style="width: {50 + 10}px; background-color: {config.colorHex[disc]};"
										></div>
									{/each}
								</div>
								<div class="w-20 h-1.5 bg-slate-400 rounded mt-1 group-hover:bg-blue-400 transition-colors"></div>
								<span class="text-xs text-slate-400 mt-1">Max {config.pegCapacities[pegIdx]}</span>
							</button>
						{/each}
					</div>
				</div>

				{#if errorMessage}
					<p class="text-red-500 text-sm font-medium">{errorMessage}</p>
				{/if}

				{#if selectedPeg !== null}
					<p class="text-sm text-blue-500 mt-2 px-4 text-center">Klicken bzw. tippen Sie auf den Zielstab</p>
				{:else}
					<p class="text-sm text-slate-400 mt-2 px-4 text-center">Klicken bzw. tippen Sie auf einen Stab, um die oberste Scheibe auszuwählen</p>
				{/if}
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
