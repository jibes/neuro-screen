<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n/index.js';
	import TestShell from '$lib/components/TestShell.svelte';
	import ResultsCard from '$lib/components/ResultsCard.svelte';
	import { HighResTimer } from '$lib/core/timing.js';
	import { AudioEngine } from '$lib/core/audio-engine.js';
	import { TRAIL_B_CONFIG } from './config.js';
	import { getNodes, getExpectedSequence, computeSummary } from './logic.js';
	import type { TrailMakingResult } from './types.js';
	import type { TrailMakingSummary } from '$lib/db/models.js';
	import { saveTestRun } from '$lib/db/database.js';
	import { waitForSession } from '$lib/db/session-store.svelte.js';

	const i = t();
	const config = TRAIL_B_CONFIG;
	const nodes = getNodes();
	const expectedSequence = getExpectedSequence();

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
	const segmentTimes: number[] = [];
	const clickLog: TrailMakingResult['clickLog'] = [];
	let intervalId: ReturnType<typeof setInterval> | undefined;

	function handleNodeClick(nodeId: number) {
		if (!running) return;

		const now = timer.now();
		const expectedId = expectedSequence[nextExpectedIndex];

		if (nodeId === expectedId) {
			if (lastClickTime > 0) {
				segmentTimes.push(now - lastClickTime);
			}
			lastClickTime = now;
			completedPath = [...completedPath, nodeId];
			clickLog.push({ clickedId: nodeId, expectedId, correct: true, timestamp: now });
			nextExpectedIndex++;

			if (nextExpectedIndex >= expectedSequence.length) {
				finishTest(now - startTime);
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

			const session = await waitForSession();
			const startedAt = new Date(Date.now() - completionTimeMs).toISOString();
			if (session?.id) {
				await saveTestRun(
					{
						sessionId: session.id,
						testId: config.testId,
						startedAt,
						completedAt: new Date().toISOString(),
						durationMs: completionTimeMs,
						config: { ...config, nodePositions: undefined },
						summary,
						environmentWarnings: []
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
			}
		} catch (e) {
			console.error('Fehler beim Speichern:', e);
		} finally {
			testShell?.setPhase('completed');
		}
	}

	function runTest() {
		running = true;
		audio.init();
		timer.reset();
		startTime = timer.now();
		lastClickTime = startTime;
		intervalId = setInterval(() => {
			elapsedSeconds = Math.floor((timer.now() - startTime) / 1000);
		}, 250);
	}

	function getNodeColor(nodeId: number): string {
		const node = nodes.find((n) => n.id === nodeId);
		if (errorFlash === nodeId) return 'fill-red-400 stroke-red-500';
		if (completedPath.includes(nodeId)) return 'fill-blue-400 stroke-blue-500';
		if (expectedSequence[nextExpectedIndex] === nodeId && nextExpectedIndex === 0) return 'fill-green-200 stroke-green-400';
		return 'fill-slate-200 stroke-slate-400';
	}

	function getNodeStroke(nodeId: number): string {
		const node = nodes.find((n) => n.id === nodeId);
		if (!node) return '';
		return node.kind === 'letter' ? 'stroke-dasharray: 1 0.5' : '';
	}

	function getResultMetrics() {
		if (!summary) return [];
		return [
			{ label: 'Gesamtzeit', value: `${(summary.completionTimeMs / 1000).toFixed(1)}`, unit: 's', highlight: true },
			{ label: i.common.errors, value: summary.errors },
			{ label: 'Segmente', value: summary.pathSegmentTimes.length }
		];
	}

	onDestroy(() => {
		running = false;
		if (intervalId !== undefined) clearInterval(intervalId);
		audio.destroy();
	});
</script>

<TestShell
	bind:this={testShell}
	testId={config.testId}
	testName={config.testName}
	instructions={[...config.instructions]}
	currentTrial={nextExpectedIndex}
	totalTrials={expectedSequence.length}
	onStart={() => runTest()}
>
	{#snippet children({ phase })}
		{#if phase === 'running'}
			<div class="stimulus-area relative">
				<div class="absolute top-4 right-4 text-sm tabular-nums text-slate-400">
					{elapsedSeconds}s
				</div>

				<svg viewBox="0 0 100 100" class="w-full max-w-xl aspect-square">
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
							<circle
								cx={node.x} cy={node.y} r="3.5"
								class="{getNodeColor(node.id)} stroke-[0.3]"
								style={getNodeStroke(node.id)}
							/>
							<text
								x={node.x} y={node.y}
								text-anchor="middle" dominant-baseline="central"
								class="text-[2px] font-medium fill-slate-700 select-none pointer-events-none"
							>
								{node.label}
							</text>
						</g>
					{/each}
				</svg>

				<div class="mt-2 text-xs text-slate-400">
					Reihenfolge: 1 → A → 2 → B → 3 → C → ...
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
