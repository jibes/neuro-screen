<script lang="ts">
	import { onMount, onDestroy, type Snippet } from 'svelte';
	import { t } from '$lib/i18n/index.js';
	import InstructionScreen from './InstructionScreen.svelte';
	import CountdownTimer from './CountdownTimer.svelte';
	import ProgressBar from './ProgressBar.svelte';
	import { requestFullscreen, exitFullscreen } from '$lib/core/fullscreen.js';
	import { isTouchDevice } from '$lib/core/device.js';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';

	export type TestPhase = 'instructions' | 'countdown' | 'running' | 'completed';

	interface Props {
		testName: string;
		instructions: string[];
		/** Extra instruction page shown on touch devices (how to respond without a keyboard) */
		touchHint?: string;
		children: Snippet<[{ phase: TestPhase }]>;
		currentTrial?: number;
		totalTrials?: number;
		useFullscreen?: boolean;
		onStart?: () => void;
		/** Called when the test is paused (window/tab left) or resumed; tests must freeze their timing */
		onPauseChange?: (paused: boolean) => void;
	}

	let {
		testName,
		instructions,
		touchHint,
		children,
		currentTrial = 0,
		totalTrials = 0,
		useFullscreen = true,
		onStart,
		onPauseChange
	}: Props = $props();

	let phase = $state<TestPhase>('instructions');
	const shownInstructions = $derived(touchHint && isTouchDevice() ? [...instructions, touchHint] : instructions);
	let paused = $state(false);
	/** Why the test is paused: window/tab left, or the user opened the pause menu */
	let pauseReason = $state<'hidden' | 'user'>('hidden');

	function pause(reason: 'hidden' | 'user') {
		if (phase !== 'running' || paused) return;
		pauseReason = reason;
		paused = true;
		onPauseChange?.(true);
	}

	function onVisibilityChange() {
		if (document.hidden) pause('hidden');
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && phase === 'running') {
			e.preventDefault();
			if (paused) resumeFromPause();
			else pause('user');
		}
	}

	function exitTest() {
		goto(`${base}/`);
	}

	onMount(() => {
		document.addEventListener('visibilitychange', onVisibilityChange);
		document.addEventListener('keydown', onKeydown);
	});

	onDestroy(() => {
		document.removeEventListener('visibilitychange', onVisibilityChange);
		document.removeEventListener('keydown', onKeydown);
		exitFullscreen().catch(() => {});
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
		onPauseChange?.(false);
	}

	export function setPhase(newPhase: TestPhase) {
		if (newPhase !== 'running' && paused) {
			paused = false;
			onPauseChange?.(false);
		}
		phase = newPhase;
	}
</script>

<svelte:head>
	<title>{testName} · NeuroScreen</title>
</svelte:head>

<div class="relative min-h-dvh bg-slate-50">
	{#if phase === 'instructions'}
		<div class="pt-4 sm:pt-8">
			<div class="max-w-xl mx-auto px-4 sm:px-8 mb-4">
				<a href="{base}/" class="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 py-1">
					<span aria-hidden="true">&larr;</span> Zur Übersicht
				</a>
			</div>
			<h1 class="text-center text-2xl font-semibold text-slate-900 mb-6">{testName}</h1>
			<InstructionScreen instructions={shownInstructions} onComplete={onInstructionsComplete} />
		</div>
	{:else if phase === 'countdown'}
		<button
			type="button"
			onclick={exitTest}
			class="fixed top-3 right-3 z-30 flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
			aria-label="Test abbrechen"
			title="Test abbrechen"
		>
			<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
		</button>
		<CountdownTimer onComplete={onCountdownComplete} />
	{:else if phase === 'running'}
		{#if paused}
			<div class="stimulus-area px-4">
				<div class="w-full max-w-sm rounded-xl border border-slate-200 bg-surface p-6 text-center shadow-sm">
					<p class="text-lg font-medium text-slate-800 mb-2">Test pausiert</p>
					<p class="text-sm text-slate-500 mb-6">
						{#if pauseReason === 'hidden'}
							Sie haben das Fenster verlassen. Der unterbrochene Durchgang wird wiederholt.
						{:else}
							Die Zeitmessung ist angehalten. Beim Abbrechen wird nichts gespeichert.
						{/if}
					</p>
					<div class="flex flex-col gap-2">
						<button
							onclick={resumeFromPause}
							class="px-6 py-3 sm:py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
						>
							Fortfahren
						</button>
						<button
							onclick={exitTest}
							class="px-6 py-3 sm:py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors"
						>
							Test abbrechen
						</button>
					</div>
				</div>
			</div>
		{:else}
			<button
				type="button"
				onclick={() => pause('user')}
				class="fixed top-3 right-3 z-30 flex h-10 w-10 items-center justify-center rounded-full text-slate-300 hover:bg-slate-100 hover:text-slate-600"
				aria-label="Test pausieren (Esc)"
				title="Pausieren (Esc)"
			>
				<svg viewBox="0 0 24 24" class="h-5 w-5" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
			</button>
			{@render children({ phase })}
			{#if totalTrials > 0}
				<ProgressBar current={currentTrial} total={totalTrials} />
			{/if}
		{/if}
	{:else if phase === 'completed'}
		{@render children({ phase })}
	{/if}
</div>
