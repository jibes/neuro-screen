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
	const home = normalize(`${base}/`);
	/** Home matches exactly; other sections also match their sub-pages (e.g. a result detail) */
	const isActive = (href: string) => {
		const current = normalize(page.url.pathname);
		const target = normalize(href);
		return target === home ? current === home : current === target || current.startsWith(`${target}/`);
	};
</script>

<nav class="bg-white border-b border-slate-200 px-4 sm:px-6 py-3">
	<div class="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
		<a href="{base}/" class="text-lg font-semibold text-slate-900 hover:text-blue-600 transition-colors">
			{i.app.title}
		</a>
		<div class="flex gap-4 sm:gap-6">
			{#each links as link}
				<a
					href={link.href}
					class="text-sm transition-colors {isActive(link.href)
						? 'text-blue-600 font-medium'
						: 'text-slate-600 hover:text-slate-900'}"
				>
					{link.label}
				</a>
			{/each}
		</div>
	</div>
</nav>
