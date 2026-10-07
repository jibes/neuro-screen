<script lang="ts">
	import { base } from '$app/paths';
	import { t } from '$lib/i18n/index.js';
	import { page } from '$app/state';
	const i = t();

	const links = [
		{ href: `${base}/`, label: i.nav.home },
		{ href: `${base}/umgebung`, label: i.nav.environment },
		{ href: `${base}/ergebnisse`, label: i.nav.results }
	];

	/** Compare paths ignoring a trailing slash (the base root may be served as /repo or /repo/) */
	const normalize = (path: string) => path.replace(/\/+$/, '') || '/';
</script>

<nav class="bg-white border-b border-slate-200 px-6 py-3">
	<div class="max-w-5xl mx-auto flex items-center justify-between">
		<a href="{base}/" class="text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors">
			{i.app.title}
		</a>
		<div class="flex gap-6">
			{#each links as link}
				<a
					href={link.href}
					class="text-sm transition-colors {normalize(page.url.pathname) === normalize(link.href)
						? 'text-blue-600 font-medium'
						: 'text-slate-600 hover:text-slate-900'}"
				>
					{link.label}
				</a>
			{/each}
		</div>
	</div>
</nav>
