<script lang="ts">
	interface Props {
		current: number;
		total: number;
	}

	let { current, total }: Props = $props();
	let progress = $derived(total > 0 ? ((current + 1) / total) * 100 : 0);
</script>

<div class="fixed bottom-0 left-0 right-0 h-1 bg-slate-200">
	<div
		class="h-full bg-blue-500 transition-[width] duration-200"
		style="width: {progress}%"
	></div>
</div>
