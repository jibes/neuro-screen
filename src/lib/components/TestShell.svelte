<script lang="ts">
	import { onMount, onDestroy, type Snippet } from 'svelte';
	import { t } from '$lib/i18n/index.js';
	import InstructionScreen from './InstructionScreen.svelte';
	import CountdownTimer from './CountdownTimer.svelte';
	import ProgressBar from './ProgressBar.svelte';
	import { requestFullscreen, exitFullscreen } from '$lib/core/fullscreen.js';

	export type TestPhase = 'instructions' | 'countdown' | 'running' | 'completed';

	interface Props {
		testId: string;
		testName: string;
		instructions: string[];
		children: Snippet<[{ phase: TestPhase }]>;
		currentTrial?: number;
		totalTrials?: number;
		useFullscreen?: boolean;
		onStart?: () => void;
	}

	let {
		testId,
		testName,
		instructions,
		children,
		currentTrial = 0,
		totalTrials = 0,
		useFullscreen = true,
		onStart
	}: Props = $props();

	let phase = $state<TestPhase>('instructions');
	let paused = $state(false);

	function onVisibilityChange() {
		if (document.hidden && phase === 'running') {
			paused = true;
		}
	}

	onMount(() => {
		document.addEventListener('visibilitychange', onVisibilityChange);
	});

	onDestroy(() => {
		document.removeEventListener('visibilitychange', onVisibilityChange);
		exitFullscreen();
	});

	function onInstructionsComplete() {
		if (useFullscreen) {
			requestFullscreen();
		}
		phase = 'countdown';
	}

	function onCountdownComplete() {
		phase = 'running';
		onStart?.();
	}

	function resumeFromPause() {
		paused = false;
	}

	export function setPhase(newPhase: TestPhase) {
		phase = newPhase;
	}
</script>

<div class="relative min-h-screen bg-slate-50">
	{#if phase === 'instructions'}
		<div class="pt-8">
			<h1 class="text-center text-2xl font-semibold text-slate-900 mb-6">{testName}</h1>
			<InstructionScreen {instructions} onComplete={onInstructionsComplete} />
		</div>
	{:else if phase === 'countdown'}
		<CountdownTimer onComplete={onCountdownComplete} />
	{:else if phase === 'running'}
		{#if paused}
			<div class="stimulus-area">
				<div class="text-center">
					<p class="text-lg text-slate-600 mb-4">Test pausiert</p>
					<p class="text-sm text-slate-400 mb-6">Sie haben das Fenster verlassen. Klicken Sie um fortzufahren.</p>
					<button
						onclick={resumeFromPause}
						class="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
					>
						Fortfahren
					</button>
				</div>
			</div>
		{:else}
			{@render children({ phase })}
			{#if totalTrials > 0}
				<ProgressBar current={currentTrial} total={totalTrials} />
			{/if}
		{/if}
	{:else if phase === 'completed'}
		{@render children({ phase })}
	{/if}
</div>
