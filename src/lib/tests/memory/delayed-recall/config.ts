import { t } from '$lib/i18n/index.js';
import { WORD_LIST_CONFIG } from '../word-list/config.js';

const i = t();

export const DELAYED_RECALL_CONFIG = {
	testId: 'delayed-recall',
	testName: i.tests.delayedRecall.name,
	instructions: i.tests.delayedRecall.instructions,

	timeLimitMs: 90000,
	/** Recommended minimum delay after the word-list test (RAVLT: 20–30 min) */
	minDelayMinutes: 20,
	targetWords: WORD_LIST_CONFIG.targetWords,
	wordListTestId: 'word-list'
} as const;
