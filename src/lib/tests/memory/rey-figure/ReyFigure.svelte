<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n/index.js';
	import TestShell from '$lib/components/TestShell.svelte';
	import ResultsCard from '$lib/components/ResultsCard.svelte';
	import { HighResTimer } from '$lib/core/timing.js';
	import { REY_FIGURE_CONFIG, REY_ELEMENTS } from './config.js';
	import { computeSummary, createPhaseItemSets } from './logic.js';
	import type { ReyElement, ReyElementResponse } from './types.js';
	import type { ReyFigureSummary } from '$lib/db/models.js';
	import { saveRunToSession } from '$lib/db/session-store.svelte.js';
	import { getNextTest } from '$lib/tests/registry.js';

	const i = t();
	const config = REY_FIGURE_CONFIG;
	const nextTest = getNextTest(config.testId);

	let testShell = $state<TestShell>();
	let summary = $state<ReyFigureSummary | null>(null);

	type Phase = 'idle' | 'study' | 'immediate' | 'delay' | 'delayed';
	let phase = $state<Phase>('idle');
	let phaseLabel = $state('');
	let currentElement = $state<ReyElement | null>(null);
	let elementIndex = $state(0);
	let totalElements = $state(0);
	let countdownRemaining = $state(0);
	let running = $state(false);

	const timer = new HighResTimer();
	let countdownInterval: ReturnType<typeof setInterval> | null = null;

	const immediateResponses: ReyElementResponse[] = [];
	const delayedResponses: ReyElementResponse[] = [];

	let resolveAnswer: ((yes: boolean) => void) | null = null;

	function handleAnswer(yes: boolean) {
		if (timer.paused) return;
		if (resolveAnswer) {
			resolveAnswer(yes);
			resolveAnswer = null;
		}
	}

	async function waitForAnswer(): Promise<boolean> {
		return new Promise((resolve) => {
			resolveAnswer = resolve;
		});
	}

	/** Show a countdown for `ms` of active time */
	async function countdown(ms: number) {
		const start = timer.now();
		countdownRemaining = Math.ceil(ms / 1000);
		countdownInterval = setInterval(() => {
			countdownRemaining = Math.max(0, Math.ceil((ms - (timer.now() - start)) / 1000));
		}, 250);
		await timer.delay(ms);
		if (countdownInterval) {
			clearInterval(countdownInterval);
			countdownInterval = null;
		}
	}

	async function runRecognitionPhase(elements: ReyElement[], responses: ReyElementResponse[]): Promise<number> {
		totalElements = elements.length;
		const phaseStart = timer.now();

		for (let idx = 0; idx < elements.length; idx++) {
			if (!running) break;
			elementIndex = idx;
			currentElement = elements[idx];

			const rtStart = timer.now();
			const answer = await waitForAnswer();
			if (!running) break;
			const rt = timer.now() - rtStart;

			responses.push({
				elementId: elements[idx].id,
				isReal: elements[idx].isReal,
				userSaidYes: answer,
				correct: answer === elements[idx].isReal,
				rt
			});
		}
		elementIndex = elements.length;

		return timer.now() - phaseStart;
	}

	async function runTest() {
		running = true;
		timer.reset();
		const startedAt = new Date().toISOString();
		const sets = createPhaseItemSets();

		// Phase 1: Study the figure
		phase = 'study';
		phaseLabel = 'Figur einpraegen';
		await countdown(config.studyTimeMs);
		if (!running) return;

		// Phase 2: Immediate recognition (figure no longer visible)
		phase = 'immediate';
		phaseLabel = 'Sofortige Wiedererkennung';
		const studyEnd = timer.now();
		const immediateTimeMs = await runRecognitionPhase(sets.immediate, immediateResponses);
		if (!running) return;

		// Phase 3: Retention interval
		phase = 'delay';
		phaseLabel = 'Pause';
		currentElement = null;
		await countdown(config.delayMs);
		if (!running) return;

		// Phase 4: Delayed recognition with new items
		phase = 'delayed';
		phaseLabel = 'Verzoegerte Wiedererkennung';
		const delayMinutes = Math.round(((timer.now() - studyEnd) / 60000) * 10) / 10;
		const delayedTimeMs = await runRecognitionPhase(sets.delayed, delayedResponses);
		if (!running) return;

		try {
			summary = computeSummary(immediateResponses, immediateTimeMs, delayedResponses, delayedTimeMs, delayMinutes);

			const toTrial = (r: ReyElementResponse, trialNumber: number, trialPhase: string) => ({
				trialNumber,
				phase: trialPhase,
				stimulus: { elementId: r.elementId, isReal: r.isReal } as Record<string, unknown>,
				response: { saidYes: r.userSaidYes } as Record<string, unknown>,
				rt: r.rt as number | null,
				correct: r.correct as boolean | null,
				onsetTimestamp: 0,
				responseTimestamp: r.rt as number | null,
				customData: {} as Record<string, unknown>
			});

			await saveRunToSession(
				{
					testId: config.testId,
					startedAt,
					completedAt: new Date().toISOString(),
					durationMs: timer.now(),
					config: { ...config },
					summary
				},
				[
					...immediateResponses.map((r, idx) => toTrial(r, idx, 'immediate')),
					...delayedResponses.map((r, idx) => toTrial(r, immediateResponses.length + idx, 'delayed'))
				]
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
			{ label: "d' sofort", value: summary.immediateDPrime.toFixed(2), highlight: true },
			{ label: 'Treffer / Falsche Alarme (sofort)', value: `${summary.immediateHits}/${summary.immediateTargets} · ${summary.immediateFalseAlarms}/${summary.immediateDistractors}` },
			{ label: "d' verzoegert", value: summary.delayedDPrime.toFixed(2), highlight: true },
			{ label: 'Treffer / Falsche Alarme (verzoegert)', value: `${summary.delayedHits}/${summary.delayedTargets} · ${summary.delayedFalseAlarms}/${summary.delayedDistractors}` },
			{ label: 'Verzoegerung', value: `${summary.delayMinutes}`, unit: 'min' }
		];
	}

	onDestroy(() => {
		running = false;
		resolveAnswer?.(false);
		resolveAnswer = null;
		if (countdownInterval) clearInterval(countdownInterval);
	});
</script>

<TestShell
	bind:this={testShell}
	testName={config.testName}
	instructions={[...config.instructions]}
	currentTrial={elementIndex}
	totalTrials={totalElements}
	onStart={() => runTest()}
	onPauseChange={(p) => (p ? timer.pause() : timer.resume())}
>
	{#snippet children({ phase: testPhase })}
		{#if testPhase === 'running'}
			<div class="stimulus-area">
				{#if phaseLabel}
					<div class="absolute top-4 left-4 text-sm text-slate-400">
						{phaseLabel}
						{#if phase === 'immediate' || phase === 'delayed'}
							({elementIndex + 1} / {totalElements})
						{/if}
					</div>
				{/if}

				{#if phase === 'study'}
					<div class="text-center">
						<div class="absolute top-4 right-4 text-lg font-mono tabular-nums" class:text-red-500={countdownRemaining <= 5} class:text-slate-400={countdownRemaining > 5}>
							{countdownRemaining}s
						</div>
						<p class="text-sm text-slate-500 mb-4">Praegen Sie sich diese Figur ein</p>
						<svg viewBox="0 0 300 200" class="w-full max-w-lg border border-slate-200 rounded-lg bg-white p-2">
							{#each REY_ELEMENTS.filter(e => e.isReal) as element}
								<path
									d={element.svgPath}
									fill="none"
									stroke="#1e293b"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							{/each}
						</svg>
					</div>

				{:else if (phase === 'immediate' || phase === 'delayed') && currentElement}
					<div class="text-center">
						<p class="text-sm text-slate-500 mb-4">
							War dieses Element in der Figur enthalten?
						</p>
						<svg viewBox="0 0 300 200" class="w-64 h-48 border border-slate-200 rounded-lg bg-white p-2 mx-auto mb-6">
							<path
								d={currentElement.svgPath}
								fill="none"
								stroke="#1e293b"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
						<div class="flex gap-4 justify-center">
							<button
								onclick={() => handleAnswer(true)}
								class="px-8 py-3 text-lg font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
							>
								Ja
							</button>
							<button
								onclick={() => handleAnswer(false)}
								class="px-8 py-3 text-lg font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
							>
								Nein
							</button>
						</div>
					</div>

				{:else if phase === 'delay'}
					<div class="text-center">
						<span class="text-xl text-slate-500">Pause ({countdownRemaining}s)</span>
						<p class="text-sm text-slate-400 mt-2">Gleich werden weitere Elemente gezeigt. Entscheiden Sie wieder, ob sie zur Figur gehoerten.</p>
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
