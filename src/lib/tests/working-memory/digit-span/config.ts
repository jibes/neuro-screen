import { t } from '$lib/i18n/index.js';

const i = t();

export const DIGIT_SPAN_CONFIG = {
	testId: 'digit-span',
	testName: i.tests.digitSpan.name,
	instructions: i.tests.digitSpan.instructions,

	startSpan: 3,
	maxSpan: 9,
	attemptsPerSpan: 2,
	digitDisplayDurationMs: 1000,
	interDigitIntervalMs: 300,
	maxConsecutiveFailures: 2, // stop after 2 failures at same span

	practiceSpan: 3,
	practiceTrials: 2
} as const;
