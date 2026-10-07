import { t } from '$lib/i18n/index.js';

const i = t();

export interface TestInfo {
	id: string;
	name: string;
	shortDesc: string;
	href: string;
}

export interface TestCategory {
	name: string;
	tests: TestInfo[];
}

function info(id: string, key: keyof typeof i.tests): TestInfo {
	return { id, name: i.tests[key].name, shortDesc: i.tests[key].shortDesc, href: `/tests/${id}` };
}

/** All tests, grouped by domain, in recommended order */
export const TEST_CATEGORIES: TestCategory[] = [
	{
		name: i.categories.attention,
		tests: [info('go-nogo', 'goNogo'), info('flanker', 'flanker'), info('stroop', 'stroop'), info('cpt', 'cpt')]
	},
	{
		name: i.categories.workingMemory,
		tests: [info('n-back', 'nBack'), info('digit-span', 'digitSpan'), info('corsi', 'corsi')]
	},
	{
		name: i.categories.processingSpeed,
		tests: [info('symbol-digit', 'symbolDigit'), info('trail-making-a', 'trailMakingA'), info('trail-making-b', 'trailMakingB')]
	},
	{
		name: i.categories.executive,
		tests: [info('wcst', 'wcst'), info('tower', 'tower')]
	},
	{
		name: i.categories.memory,
		tests: [info('word-list', 'wordList'), info('delayed-recall', 'delayedRecall'), info('rey-figure', 'reyFigure')]
	}
];

export const ALL_TESTS: TestInfo[] = TEST_CATEGORIES.flatMap((c) => c.tests);

export function getTestName(testId: string): string {
	return ALL_TESTS.find((t) => t.id === testId)?.name ?? testId;
}

/** The test following `testId` in recommended order, or null for the last one */
export function getNextTest(testId: string): TestInfo | null {
	const idx = ALL_TESTS.findIndex((t) => t.id === testId);
	return idx >= 0 && idx < ALL_TESTS.length - 1 ? ALL_TESTS[idx + 1] : null;
}
