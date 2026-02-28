import { t } from '$lib/i18n/index.js';

const i = t();

export const CORSI_CONFIG = {
	testId: 'corsi',
	testName: i.tests.corsi.name,
	instructions: i.tests.corsi.instructions,

	startSpan: 2,
	maxSpan: 9,
	attemptsPerSpan: 2,
	maxConsecutiveFailures: 2,
	blockHighlightDurationMs: 800,
	interBlockIntervalMs: 300,
	feedbackDurationMs: 1000,

	blockPositions: [
		{ id: 0, x: 20, y: 30 },
		{ id: 1, x: 50, y: 15 },
		{ id: 2, x: 75, y: 25 },
		{ id: 3, x: 10, y: 55 },
		{ id: 4, x: 40, y: 50 },
		{ id: 5, x: 65, y: 60 },
		{ id: 6, x: 30, y: 75 },
		{ id: 7, x: 55, y: 80 },
		{ id: 8, x: 85, y: 70 }
	]
} as const;
