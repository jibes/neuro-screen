<script lang="ts">
	import { dispatchVirtualResponse } from '$lib/core/response-collector.js';
	import { isTouchDevice } from '$lib/core/device.js';

	interface PadButton {
		/** Key this button emulates (matched like a keyboard key) */
		key: string;
		label: string;
		class?: string;
	}

	interface Props {
		buttons: PadButton[];
		/** Show on all devices instead of touch devices only */
		always?: boolean;
	}

	let { buttons, always = false }: Props = $props();
	const touch = isTouchDevice();
	const visible = $derived(always || touch);

	function press(e: PointerEvent, key: string) {
		// Respond on pointerdown (not click) for accurate timing; suppress focus/ghost clicks
		e.preventDefault();
		dispatchVirtualResponse(key, e.timeStamp);
	}
</script>

{#if visible}
	<div
		class="fixed inset-x-0 bottom-0 z-10 flex justify-center gap-3 px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] select-none"
	>
		{#each buttons as button}
			<button
				type="button"
				class="h-20 flex-1 max-w-xs rounded-xl border-2 border-slate-300 bg-white text-lg font-medium text-slate-700 shadow-sm active:scale-95 active:bg-slate-100 transition-transform touch-manipulation {button.class ?? ''}"
				onpointerdown={(e) => press(e, button.key)}
				oncontextmenu={(e) => e.preventDefault()}
			>
				{button.label}
			</button>
		{/each}
	</div>
{/if}
