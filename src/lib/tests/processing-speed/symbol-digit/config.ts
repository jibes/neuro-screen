import { t } from '$lib/i18n/index.js';

const i = t();

export const SYMBOL_DIGIT_CONFIG = {
	testId: 'symbol-digit',
	testName: i.tests.symbolDigit.name,
	instructions: i.tests.symbolDigit.instructions,

	timeLimitMs: 90000,
	symbols: ['⊕', '⊗', '△', '□', '◇', '☆', '⬡', '⊞', '⊘'] as const,
	trialPoolSize: 150
} as const;
