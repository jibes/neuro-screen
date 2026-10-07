<script lang="ts">
	import { base } from '$app/paths';
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n/index.js';
	import TestShell from '$lib/components/TestShell.svelte';
	import ResultsCard from '$lib/components/ResultsCard.svelte';
	import { HighResTimer } from '$lib/core/timing.js';
	import { AudioEngine } from '$lib/core/audio-engine.js';
	import { TRAIL_A_CONFIG } from './config.js';
	import { getNodes, getExpectedSequence, computeSummary } from './logic.js';
	import type { TrailMakingResult } from './types.js';
	import type { TrailMakingSummary } from '$lib/db/models.js';
	import { saveRunToSession } from '$lib/db/session-store.svelte.js';
	import { getNextTest } from '$lib/tests/registry.js';

	const i = t();
	const config = TRAIL_A_CONFIG;
	const nextTest = getNextTest(config.testId);
	const testNodes = getNodes();
	const testSequence = getExpectedSequence();
	const sampleSequence = config.sampleNodes.map((n) => n.id);

	// Unscored sample first (original TMT procedure), then the test
	let stage = $state<'sample' | 'transition' | 'test'>('sample');
	let nodes = $state(config.sampleNodes);
	let expectedSequence = $state(sampleSequence);

	let testShell = $state<TestShell>();
	let summary = $state<TrailMakingSummary | null>(null);

	let nextExpectedIndex = $state(0);
	let completedPath = $state<number[]>([]);
	let errors = $state(0);
	let errorFlash = $state<number | null>(null);
	let running = $state(false);
	let elapsedSeconds = $state(0);

	const timer = new HighResTimer();
	const audio = new AudioEngine();
	let startTime = 0;
	let lastClickTime = 0;
	let startedAt = '';
	const segmentTimes: number[] = [];
	const clickLog: TrailMakingResult['clickLog'] = [];
	let intervalId: ReturnType<typeof setInterval> | undefined;

	function handleNodeClick(nodeId: number) {
		if (!running || timer.paused) return;

		const now = timer.now();
		const expectedId = expectedSequence[nextExpectedIndex];

		if (nodeId === expectedId) {
			// First segment = start → first node, so there is one segment per node
			segmentTimes.push(now - lastClickTime);
			lastClickTime = now;
			completedPath = [...completedPath, nodeId];
			clickLog.push({ clickedId: nodeId, expectedId, correct: true, timestamp: now });
			nextExpectedIndex++;

			if (nextExpectedIndex >= expectedSequence.length) {
				if (stage === 'sample') startMainTest();
				else finishTest(now - startTime);
			}
		} else {
			errors++;
			errorFlash = nodeId;
			audio.playError();
			clickLog.push({ clickedId: nodeId, expectedId, correct: false, timestamp: now });
			setTimeout(() => { errorFlash = null; }, 300);
		}
	}

	async function finishTest(completionTimeMs: number) {
		running = false;
		if (intervalId !== undefined) {
			clearInterval(intervalId);
			intervalId = undefined;
		}

		const result: TrailMakingResult = {
			completionTimeMs,
			errors,
			pathSegmentTimes: segmentTimes,
			clickLog
		};

		try {
			summary = computeSummary(result);

			await saveRunToSession(
				{
					testId: config.testId,
					startedAt,
					completedAt: new Date().toISOString(),
					durationMs: completionTimeMs,
					config: { ...config, nodePositions: undefined },
					summary
				},
				clickLog.map((cl, idx) => ({
					trialNumber: idx,
					phase: 'test',
					stimulus: { expectedId: cl.expectedId },
					response: { clickedId: cl.clickedId },
					rt: cl.timestamp - startTime,
					correct: cl.correct,
					onsetTimestamp: startTime,
					responseTimestamp: cl.timestamp,
					customData: {}
				}))
			);
		} catch (e) {
			console.error('Fehler beim Speichern:', e);
		} finally {
			testShell?.setPhase('completed');
		}
	}

	function resetPath() {
		nextExpectedIndex = 0;
		completedPath = [];
		errors = 0;
		segmentTimes.length = 0;
		clickLog.length = 0;
		timer.reset();
		startTime = timer.now();
		lastClickTime = startTime;
		elapsedSeconds = 0;
	}

	function runTest() {
		running = true;
		audio.init();
		resetPath();
		intervalId = setInterval(() => {
			elapsedSeconds = Math.floor((timer.now() - startTime) / 1000);
		}, 250);
	}

	async function startMainTest() {
		running = false;
		stage = 'transition';
		await timer.delay(2500);
		if (destroyed) return;
		nodes = testNodes;
		expectedSequence = testSequence;
		stage = 'test';
		startedAt = new Date().toISOString();
		resetPath();
		running = true;
	}

	function getNodeColor(nodeId: number): string {
		if (errorFlash === nodeId) return 'fill-red-400 stroke-red-500';
		if (completedPath.includes(nodeId)) return 'fill-blue-400 stroke-blue-500';
		if (expectedSequence[nextExpectedIndex] === nodeId && nextExpectedIndex === 0) return 'fill-green-200 stroke-green-400';
		return 'fill-slate-200 stroke-slate-400';
	}

	function getResultMetrics() {
		if (!summary) return [];
		return [
			{ label: 'Gesamtzeit', value: `${(summary.completionTimeMs / 1000).toFixed(1)}`, unit: 's', highlight: true },
			{ label: i.common.errors, value: summary.errors },
			{ label: 'Segmente', value: summary.pathSegmentTimes.length }
		];
	}

	let destroyed = false;

	onDestroy(() => {
		destroyed = true;
		running = false;
		if (intervalId !== undefined) clearInterval(intervalId);
		audio.destroy();
	});
</script>

<TestShell
	bind:this={testShell}
	testName={config.testName}
	instructions={[...config.instructions]}
	currentTrial={stage === 'test' ? nextExpectedIndex : 0}
	totalTrials={stage === 'test' ? expectedSequence.length : 0}
	onStart={() => runTest()}
	onPauseChange={(p) => (p ? timer.pause() : timer.resume())}
>
	{#snippet children({ phase })}
		{#if phase === 'running' && stage === 'transition'}
			<div class="stimulus-area px-6">
				<p class="text-xl text-center text-slate-600">Übung beendet. Jetzt beginnt der eigentliche Test – so schnell wie möglich!</p>
			</div>
		{:else if phase === 'running'}
			<div class="stimulus-area relative">
				{#if stage === 'sample'}
					<div class="absolute top-4 left-4 text-sm font-medium text-amber-600">{i.common.practice}</div>
				{/if}
				<div class="absolute top-5 right-16 text-sm tabular-nums text-slate-400">
					{elapsedSeconds}s
				</div>

				<svg viewBox="0 0 100 100" class="w-full max-w-xl aspect-square touch-manipulation">
					<!-- Connection lines -->
					{#each completedPath as nodeId, idx}
						{#if idx > 0}
							{@const from = nodes.find((n) => n.id === completedPath[idx - 1])}
							{@const to = nodes.find((n) => n.id === nodeId)}
							{#if from && to}
								<line
									x1={from.x} y1={from.y}
									x2={to.x} y2={to.y}
									stroke="#3b82f6" stroke-width="0.5" stroke-linecap="round"
								/>
							{/if}
						{/if}
					{/each}

					<!-- Nodes -->
					{#each nodes as node}
						<g
							class="cursor-pointer"
							onclick={() => handleNodeClick(node.id)}
							role="button"
							tabindex="0"
							onkeydown={(e) => { if (e.key === 'Enter') handleNodeClick(node.id); }}
						>
							<!-- Larger invisible hit area for touch -->
							<circle cx={node.x} cy={node.y} r="4.3" fill="transparent" />
							<circle
								cx={node.x} cy={node.y} r="4"
								class="{getNodeColor(node.id)} stroke-[0.3]"
							/>
							<text
								x={node.x} y={node.y}
								text-anchor="middle" dominant-baseline="central"
								class="text-[2.6px] font-medium fill-slate-700 select-none pointer-events-none"
							>
								{node.label}
							</text>
							{#if node.id === expectedSequence[0] || node.id === expectedSequence[expectedSequence.length - 1]}
								<text
									x={node.x} y={node.y + 6.2}
									text-anchor="middle"
									class="text-[2.2px] fill-slate-500 select-none pointer-events-none"
								>
									{node.id === expectedSequence[0] ? 'Anfang' : 'Ende'}
								</text>
							{/if}
						</g>
					{/each}
				</svg>
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
