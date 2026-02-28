<script lang="ts">
	import { t } from '$lib/i18n/index.js';

	const i = t();

	interface TestInfo {
		id: string;
		name: string;
		shortDesc: string;
		href: string;
	}

	interface Category {
		name: string;
		tests: TestInfo[];
	}

	const categories: Category[] = [
		{
			name: i.categories.attention,
			tests: [
				{ id: 'go-nogo', name: i.tests.goNogo.name, shortDesc: i.tests.goNogo.shortDesc, href: '/tests/go-nogo' },
				{ id: 'flanker', name: i.tests.flanker.name, shortDesc: i.tests.flanker.shortDesc, href: '/tests/flanker' },
				{ id: 'stroop', name: i.tests.stroop.name, shortDesc: i.tests.stroop.shortDesc, href: '/tests/stroop' },
				{ id: 'cpt', name: i.tests.cpt.name, shortDesc: i.tests.cpt.shortDesc, href: '/tests/cpt' }
			]
		},
		{
			name: i.categories.workingMemory,
			tests: [
				{ id: 'n-back', name: i.tests.nBack.name, shortDesc: i.tests.nBack.shortDesc, href: '/tests/n-back' },
				{ id: 'digit-span', name: i.tests.digitSpan.name, shortDesc: i.tests.digitSpan.shortDesc, href: '/tests/digit-span' },
				{ id: 'corsi', name: i.tests.corsi.name, shortDesc: i.tests.corsi.shortDesc, href: '/tests/corsi' }
			]
		},
		{
			name: i.categories.processingSpeed,
			tests: [
				{ id: 'symbol-digit', name: i.tests.symbolDigit.name, shortDesc: i.tests.symbolDigit.shortDesc, href: '/tests/symbol-digit' },
				{ id: 'trail-making-a', name: i.tests.trailMakingA.name, shortDesc: i.tests.trailMakingA.shortDesc, href: '/tests/trail-making-a' },
				{ id: 'trail-making-b', name: i.tests.trailMakingB.name, shortDesc: i.tests.trailMakingB.shortDesc, href: '/tests/trail-making-b' }
			]
		},
		{
			name: i.categories.executive,
			tests: [
				{ id: 'wcst', name: i.tests.wcst.name, shortDesc: i.tests.wcst.shortDesc, href: '/tests/wcst' },
				{ id: 'tower', name: i.tests.tower.name, shortDesc: i.tests.tower.shortDesc, href: '/tests/tower' }
			]
		},
		{
			name: i.categories.memory,
			tests: [
				{ id: 'word-list', name: i.tests.wordList.name, shortDesc: i.tests.wordList.shortDesc, href: '/tests/word-list' },
				{ id: 'delayed-recall', name: i.tests.delayedRecall.name, shortDesc: i.tests.delayedRecall.shortDesc, href: '/tests/delayed-recall' },
				{ id: 'rey-figure', name: i.tests.reyFigure.name, shortDesc: i.tests.reyFigure.shortDesc, href: '/tests/rey-figure' }
			]
		}
	];
</script>

<div class="max-w-5xl mx-auto px-6 py-10">
	<div class="text-center mb-10">
		<h1 class="text-3xl font-bold text-slate-900 mb-2">{i.app.title}</h1>
		<p class="text-lg text-slate-500">{i.app.subtitle}</p>
	</div>

	<div class="mb-8">
		<a
			href="/umgebung"
			class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
		>
			{i.nav.environment}
		</a>
	</div>

	{#each categories as category}
		<div class="mb-8">
			<h2 class="text-lg font-semibold text-slate-800 mb-3">{category.name}</h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
				{#each category.tests as test}
					<a
						href={test.href}
						class="block bg-white rounded-lg border border-slate-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
					>
						<h3 class="font-medium text-slate-900 mb-1">{test.name}</h3>
						<p class="text-sm text-slate-500">{test.shortDesc}</p>
					</a>
				{/each}
			</div>
		</div>
	{/each}
</div>
