<script lang="ts">
	interface Props {
		/** Called on pointerdown with the event timestamp (same clock as performance.now()) */
		onDigit: (digit: number, timeStamp: number) => void;
		onBackspace?: () => void;
		onSubmit?: () => void;
		submitDisabled?: boolean;
		backspaceDisabled?: boolean;
		submitLabel?: string;
	}

	let {
		onDigit,
		onBackspace,
		onSubmit,
		submitDisabled = false,
		backspaceDisabled = false,
		submitLabel = 'OK'
	}: Props = $props();

	const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
	const baseClass =
		'h-14 sm:h-12 rounded-xl border text-xl font-medium shadow-sm active:scale-95 transition-transform touch-manipulation select-none disabled:opacity-30';
	const keyClass = `${baseClass} border-slate-300 bg-surface text-slate-800 active:bg-slate-100`;
	const submitClass = `${baseClass} border-blue-600 bg-blue-600 text-white active:bg-blue-700`;
</script>

<div class="grid grid-cols-3 gap-2 w-full max-w-[16rem] mx-auto">
	{#each digits as digit}
		<button
			type="button"
			class={keyClass}
			onpointerdown={(e) => {
				e.preventDefault();
				onDigit(digit, e.timeStamp);
			}}
		>
			{digit}
		</button>
	{/each}
	{#if onBackspace || onSubmit}
		{#if onBackspace}
			<button type="button" class={keyClass} aria-label="Löschen" disabled={backspaceDisabled} onclick={onBackspace}>
				&#9003;
			</button>
		{:else}
			<span></span>
		{/if}
		<span></span>
		{#if onSubmit}
			<button
				type="button"
				class={submitClass}
				disabled={submitDisabled}
				onclick={onSubmit}
			>
				{submitLabel}
			</button>
		{/if}
	{/if}
</div>
