import { t } from '$lib/i18n/index.js';
import { WORD_LIST_CONFIG } from '../word-list/config.js';

const i = t();

export const DELAYED_RECALL_CONFIG = {
	testId: 'delayed-recall',
	testName: i.tests.delayedRecall.name,
	instructions: [
		'Im Wortlisten-Test haben Sie eine Liste von 15 Woertern gelernt.',
		'Versuchen Sie jetzt, sich an so viele dieser Woerter wie moeglich zu erinnern.',
		'Geben Sie die Woerter ein und druecken Sie Enter.',
		'Klicken Sie auf "Fertig", wenn Sie keine weiteren Woerter mehr erinnern.'
	],

	timeLimitMs: 90000,
	targetWords: WORD_LIST_CONFIG.targetWords,
	wordListTestId: 'word-list'
} as const;
