import { randomInt } from '$lib/utils/random.js';
import type { SymbolDigitTrial, SymbolDigitResult } from './types.js';
import type { SymbolDigitSummary } from '$lib/db/models.js';
import { SYMBOL_DIGIT_CONFIG } from './config.js';

/**
 * Generate `count` items, appended after `existing` (trial numbers continue).
 * The same symbol never appears twice in a row, so every response visibly advances.
 */
export function generateTrialPool(count: number, existing: SymbolDigitTrial[] = []): SymbolDigitTrial[] {
	const trials: SymbolDigitTrial[] = [];
	let previous = existing.length > 0 ? existing[existing.length - 1].symbolIndex : -1;
	for (let i = 0; i < count; i++) {
		let symbolIndex: number;
		do {
			symbolIndex = randomInt(0, SYMBOL_DIGIT_CONFIG.symbols.length - 1);
		} while (symbolIndex === previous);
		previous = symbolIndex;
		trials.push({
			symbolIndex,
			correctDigit: symbolIndex + 1,
			trialNumber: existing.length + i
		});
	}
	return trials;
}

export function computeSummary(results: SymbolDigitResult[]): SymbolDigitSummary {
	const totalAttempted = results.length;
	const totalCorrect = results.filter((r) => r.correct).length;
	const totalErrors = totalAttempted - totalCorrect;
	const timeLimitSec = SYMBOL_DIGIT_CONFIG.timeLimitMs / 1000;

	return {
		type: 'symbol-digit',
		totalCorrect,
		totalAttempted,
		totalErrors,
		timeLimit: timeLimitSec,
		throughput: totalCorrect / timeLimitSec
	};
}
