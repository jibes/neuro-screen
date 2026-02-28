<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n/index.js';
	import TestShell from '$lib/components/TestShell.svelte';
	import ResultsCard from '$lib/components/ResultsCard.svelte';
	import { HighResTimer } from '$lib/core/timing.js';
	import { REY_FIGURE_CONFIG, REY_ELEMENTS } from './config.js';
	import { computeSummary } from './logic.js';
	import type { ReyElementResponse } from './types.js';
	import type { ReyFigureSummary } from '$lib/db/models.js';
	import { saveTestRun } from '$lib/db/database.js';
	import { waitForSession } from '$lib/db/session-store.svelte.js';
	import { shuffled } from '$lib/utils/random.js';

	const i = t();
	const config = REY_FIGURE_CONFIG;

	let testShell = $state<TestShell>();
	let summary = $state<ReyFigureSummary | null>(null);

	type Phase = 'idle' | 'study' | 'copy' | 'delay' | 'recall';
	let phase = $state<Phase>('idle');
	let phaseLabel = $state('');
	let currentElement = $state<typeof REY_ELEMENTS[0] | null>(null);
	let elementIndex = $state(0);
	let totalElements = $state(0);
	let studyRemaining = $state(30);
	let running = $state(false);

	const timer = new HighResTimer();
	let studyInterval: ReturnType<typeof setInterval> | null = null;

	const copyResponses: ReyElementResponse[] = [];
	const recallResponses: ReyElementResponse[] = [];
	let copyTimeMs = 0;
	let recallTimeMs = 0;
	let phaseStartTime = 0;

	let resolveAnswer: ((yes: boolean) => void) | null = null;

	function handleAnswer(yes: boolean) {
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

	async function runElementPhase(
		phaseName: 'copy' | 'recall',
		responses: ReyElementResponse[]
	): Promise<number> {
		const elements = shuffled([...REY_ELEMENTS]);
		totalElements = elements.length;
		const phaseStart = timer.now();

		for (let i = 0; i < elements.length; i++) {
			if (!running) return timer.now() - phaseStart;
			elementIndex = i;
			currentElement = elements[i];

			const rtStart = timer.now();
			const answer = await waitForAnswer();
			if (!running) return timer.now() - phaseStart;
			const rt = timer.now() - rtStart;

			responses.push({
				elementId: elements[i].id,
				isReal: elements[i].isReal,
				userSaidYes: answer,
				correct: (answer && elements[i].isReal) || (!answer && !elements[i].isReal),
				rt
			});
		}

		return timer.now() - phaseStart;
	}

	async function runTest() {
		running = true;
		timer.reset();
		const startedAt = new Date().toISOString();

		// Phase 1: Study the figure
		phase = 'study';
		phaseLabel = 'Figur einpraegen';
		studyRemaining = Math.round(config.studyTimeMs / 1000);

		studyInterval = setInterval(() => {
			const elapsed = timer.now();
			studyRemaining = Math.max(0, Math.round((config.studyTimeMs - elapsed) / 1000));
		}, 250);

		await timer.delay(config.studyTimeMs);
		if (studyInterval) {
			clearInterval(studyInterval);
			studyInterval = null;
		}
		if (!running) return;

		// Phase 2: Copy recognition (immediate)
		phase = 'copy';
		phaseLabel = 'Kopie-Erkennung';
		copyTimeMs = await runElementPhase('copy', copyResponses);
		if (!running) return;

		// Phase 3: Short delay
		phase = 'delay';
		phaseLabel = 'Kurze Pause';
		currentElement = null;
		await timer.delay(5000);
		if (!running) return;

		// Phase 4: Recall recognition (from memory)
		phase = 'recall';
		phaseLabel = 'Abruf aus dem Gedaechtnis';
		recallTimeMs = await runElementPhase('recall', recallResponses);
		if (!running) return;

		try {
			const delayMinutes = Math.round(5000 / 60000 * 10) / 10; // ~0.1 min delay
			summary = computeSummary(copyResponses, copyTimeMs, recallResponses, recallTimeMs, delayMinutes);

			const session = await waitForSession();
			if (session?.id) {
				const trialData = [
					...copyResponses.map((r, idx) => ({
						trialNumber: idx,
						phase: 'copy' as string,
						stimulus: { elementId: r.elementId, isReal: r.isReal },
						response: { saidYes: r.userSaidYes },
						rt: r.rt,
						correct: r.correct,
						onsetTimestamp: 0,
						responseTimestamp: r.rt,
						customData: {}
					})),
					...recallResponses.map((r, idx) => ({
						trialNumber: copyResponses.length + idx,
						phase: 'recall' as string,
						stimulus: { elementId: r.elementId, isReal: r.isReal },
						response: { saidYes: r.userSaidYes },
						rt: r.rt,
						correct: r.correct,
						onsetTimestamp: 0,
						responseTimestamp: r.rt,
						customData: {}
					}))
				];

				await saveTestRun(
					{
						sessionId: session.id,
						testId: config.testId,
						startedAt,
						completedAt: new Date().toISOString(),
						durationMs: timer.now(),
						config: { ...config },
						summary,
						environmentWarnings: []
					},
					trialData
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
			{ label: 'Kopie-Score', value: `${summary.copyScore}/${config.elementsTotal}`, highlight: true },
			{ label: 'Kopie-Zeit', value: `${(summary.copyTimeMs / 1000).toFixed(1)}`, unit: 's' },
			{ label: 'Abruf-Score', value: `${summary.recallScore}/${config.elementsTotal}`, highlight: true },
			{ label: 'Abruf-Zeit', value: `${(summary.recallTimeMs / 1000).toFixed(1)}`, unit: 's' },
			{ label: 'Behaltenrate', value: `${(summary.retentionRate * 100).toFixed(0)}`, unit: '%' }
		];
	}

	onDestroy(() => {
		running = false;
		if (studyInterval) clearInterval(studyInterval);
	});
</script>

<TestShell
	bind:this={testShell}
	testId={config.testId}
	testName={config.testName}
	instructions={[...config.instructions]}
	currentTrial={elementIndex}
	totalTrials={totalElements}
	onStart={() => runTest()}
>
	{#snippet children({ phase: testPhase })}
		{#if testPhase === 'running'}
			<div class="stimulus-area">
				{#if phaseLabel}
					<div class="absolute top-4 left-4 text-sm text-slate-400">
						{phaseLabel}
						{#if phase === 'copy' || phase === 'recall'}
							({elementIndex + 1} / {totalElements})
						{/if}
					</div>
				{/if}

				{#if phase === 'study'}
					<div class="text-center">
						<div class="absolute top-4 right-4 text-lg font-mono tabular-nums" class:text-red-500={studyRemaining <= 5} class:text-slate-400={studyRemaining > 5}>
							{studyRemaining}s
						</div>
						<p class="text-sm text-slate-500 mb-4">Praeegen Sie sich diese Figur ein</p>
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

				{:else if (phase === 'copy' || phase === 'recall') && currentElement}
					<div class="text-center">
						<p class="text-sm text-slate-500 mb-4">
							{#if phase === 'copy'}
								War dieses Element in der Figur?
							{:else}
								Erinnern Sie sich: War dieses Element in der Figur?
							{/if}
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
						<p class="text-xs text-slate-400 mb-6">{currentElement.label}</p>
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
						<span class="text-xl text-slate-500">Kurze Pause...</span>
						<p class="text-sm text-slate-400 mt-2">Gleich werden die Elemente erneut gezeigt — diesmal aus dem Gedaechtnis</p>
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
			/>
		{/if}
	{/snippet}
</TestShell>
