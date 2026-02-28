import { randomInt } from '$lib/utils/random.js';
import type { DigitSpanTrial, DigitSpanResult } from './types.js';
import type { DigitSpanSummary } from '$lib/db/models.js';
import { DIGIT_SPAN_CONFIG } from './config.js';

/** Generate a sequence of random digits (1-9, no consecutive repeats) */
export function generateDigitSequence(length: number): number[] {
	const digits: number[] = [];
	for (let i = 0; i < length; i++) {
		let digit: number;
		do {
			digit = randomInt(1, 9);
		} while (digits.length > 0 && digit === digits[digits.length - 1]);
		digits.push(digit);
	}
	return digits;
}

/** Generate all trials for a forward digit span test */
export function generateForwardTrials(): DigitSpanTrial[] {
	const trials: DigitSpanTrial[] = [];
	for (let span = DIGIT_SPAN_CONFIG.startSpan; span <= DIGIT_SPAN_CONFIG.maxSpan; span++) {
		for (let attempt = 1; attempt <= DIGIT_SPAN_CONFIG.attemptsPerSpan; attempt++) {
			trials.push({
				digits: generateDigitSequence(span),
				spanLength: span,
				attemptNumber: attempt
			});
		}
	}
	return trials;
}

/** Check if user response matches the target sequence */
export function checkResponse(trial: DigitSpanTrial, userResponse: number[]): boolean {
	if (userResponse.length !== trial.digits.length) return false;
	return trial.digits.every((d, i) => d === userResponse[i]);
}

/** Compute summary from results. Uses adaptive stopping rule. */
export function computeSummary(results: DigitSpanResult[]): DigitSpanSummary {
	let forwardSpan = 0;
	let forwardTrialsCorrect = 0;
	let forwardScore = 0;

	// Group by span length
	const bySpan = new Map<number, DigitSpanResult[]>();
	for (const r of results) {
		const span = r.trial.spanLength;
		if (!bySpan.has(span)) bySpan.set(span, []);
		bySpan.get(span)!.push(r);
	}

	for (const [span, spanResults] of bySpan) {
		const correctCount = spanResults.filter((r) => r.correct).length;
		if (correctCount > 0) {
			forwardSpan = span;
		}
		forwardTrialsCorrect += correctCount;
		forwardScore += correctCount;
	}

	return {
		type: 'digit-span',
		direction: 'forward',
		forwardSpan,
		backwardSpan: 0,
		forwardTrialsCorrect,
		backwardTrialsCorrect: 0,
		forwardTotalTrials: results.length,
		backwardTotalTrials: 0,
		forwardScore,
		backwardScore: 0
	};
}
