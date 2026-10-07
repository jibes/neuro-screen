<script lang="ts">
	import { theme, setThemePreference, type ThemePreference } from '$lib/theme.svelte.js';

	const options: { value: ThemePreference; label: string }[] = [
		{ value: 'light', label: 'Hell' },
		{ value: 'dark', label: 'Dunkel' },
		{ value: 'system', label: 'System' }
	];
</script>

<div
	class="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5"
	role="radiogroup"
	aria-label="Farbschema"
>
	{#each options as option}
		<button
			type="button"
			role="radio"
			aria-checked={theme.preference === option.value}
			title={option.label}
			aria-label={option.label}
			onclick={() => setThemePreference(option.value)}
			class="flex h-7 w-8 items-center justify-center rounded-md transition-colors {theme.preference === option.value
				? 'bg-surface text-slate-900 shadow-sm'
				: 'text-slate-500 hover:text-slate-800'}"
		>
			{#if option.value === 'light'}
				<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
					<circle cx="12" cy="12" r="4" />
					<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
				</svg>
			{:else if option.value === 'dark'}
				<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
				</svg>
			{:else}
				<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<rect x="3" y="4" width="18" height="12" rx="2" />
					<path d="M8 20h8M12 16v4" />
				</svg>
			{/if}
		</button>
	{/each}
</div>
