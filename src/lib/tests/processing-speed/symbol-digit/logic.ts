import { randomInt } from '$lib/utils/random.js';
import type { SymbolDigitTrial, SymbolDigitResult } from './types.js';
import type { SymbolDigitSummary } from '$lib/db/models.js';
import { SYMBOL_DIGIT_CONFIG } from './config.js';

export function generateTrialPool(count: number): SymbolDigitTrial[] {
	const trials: SymbolDigitTrial[] = [];
	for (let i = 0; i < count; i++) {
		const symbolIndex = randomInt(0, SYMBOL_DIGIT_CONFIG.symbols.length - 1);
		trials.push({
			symbolIndex,
			correctDigit: symbolIndex + 1,
			trialNumber: i
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
