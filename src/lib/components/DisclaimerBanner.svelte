<script lang="ts">
	import { t } from '$lib/i18n/index.js';

	const KEY = 'neuroscreen-disclaimer-dismissed';
	let dismissed = $state(false);
	try {
		dismissed = sessionStorage.getItem(KEY) === '1';
	} catch {
		// storage unavailable
	}

	function dismiss() {
		dismissed = true;
		try {
			sessionStorage.setItem(KEY, '1');
		} catch {
			// ignore
		}
	}
</script>

{#if !dismissed}
	<div class="bg-amber-50 border-b border-amber-200 px-4 py-2 text-amber-800" role="note">
		<div class="max-w-5xl mx-auto flex items-start gap-3">
			<p class="flex-1 text-xs sm:text-sm text-center">
				<span class="sm:hidden">Nur ein Screening – ersetzt keine professionelle Diagnostik.</span>
				<span class="hidden sm:inline">{t().app.disclaimer}</span>
			</p>
			<button
				type="button"
				onclick={dismiss}
				class="-my-1 shrink-0 rounded p-1 text-amber-700 hover:bg-amber-100"
				aria-label="Hinweis ausblenden"
				title="Hinweis ausblenden"
			>
				<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
			</button>
		</div>
	</div>
{/if}
