<script lang="ts">
	import { onMount } from 'svelte';
	import { COUNTDOWN_SECONDS } from '$lib/core/constants.js';

	interface Props {
		onComplete: () => void;
		seconds?: number;
	}

	const { onComplete, seconds = COUNTDOWN_SECONDS }: Props = $props();
	let count = $state(seconds);

	onMount(() => {
		const interval = setInterval(() => {
			count--;
			if (count <= 0) {
				clearInterval(interval);
				onComplete();
			}
		}, 1000);

		return () => clearInterval(interval);
	});
</script>

<div class="stimulus-area">
	<span class="text-8xl font-light text-slate-400 tabular-nums">{count}</span>
</div>
