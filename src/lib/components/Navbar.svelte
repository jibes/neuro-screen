<script lang="ts">
	import { t } from '$lib/i18n/index.js';
	import { page } from '$app/state';
	const i = t();

	const links = [
		{ href: '/', label: i.nav.home },
		{ href: '/umgebung', label: i.nav.environment },
		{ href: '/ergebnisse', label: i.nav.results }
	];
</script>

<nav class="bg-white border-b border-slate-200 px-6 py-3">
	<div class="max-w-5xl mx-auto flex items-center justify-between">
		<a href="/" class="text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors">
			{i.app.title}
		</a>
		<div class="flex gap-6">
			{#each links as link}
				<a
					href={link.href}
					class="text-sm transition-colors {page.url.pathname === link.href
						? 'text-blue-600 font-medium'
						: 'text-slate-600 hover:text-slate-900'}"
				>
					{link.label}
				</a>
			{/each}
		</div>
	</div>
</nav>
