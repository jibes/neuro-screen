import { t } from '$lib/i18n/index.js';

const i = t();

/**
 * Digit span forward + backward, following the WAIS-IV procedure: two trials per length,
 * discontinue after both trials of a length are failed, 1 digit per second.
 */
export const DIGIT_SPAN_CONFIG = {
	testId: 'digit-span',
	testName: i.tests.digitSpan.name,
	instructions: i.tests.digitSpan.instructions,

	forward: { startSpan: 2, maxSpan: 9 },
	backward: { startSpan: 2, maxSpan: 8 },
	attemptsPerSpan: 2,
	/** Stimulus onset asynchrony 1 s (WAIS: one digit per second) */
	digitDisplayDurationMs: 700,
	interDigitIntervalMs: 300,
	feedbackDurationMs: 1000,
	maxFailuresPerSpan: 2, // discontinue after both trials of a length are failed

	practiceSpan: 3,
	practiceTrials: 2,
	backwardPracticeSpan: 2,
	backwardPracticeTrials: 1
} as const;
