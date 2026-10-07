import { randomInt } from '$lib/utils/random.js';
import type { DigitSpanTrial, DigitSpanResult, SpanDirection } from './types.js';
import type { DigitSpanSummary } from '$lib/db/models.js';
import { DIGIT_SPAN_CONFIG } from './config.js';

/** Random digits 1–9 without immediate repetitions */
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

/** All trials for one direction, two per span length */
export function generateTrials(direction: SpanDirection): DigitSpanTrial[] {
	const { startSpan, maxSpan } = DIGIT_SPAN_CONFIG[direction];
	const trials: DigitSpanTrial[] = [];
	for (let span = startSpan; span <= maxSpan; span++) {
		for (let attempt = 1; attempt <= DIGIT_SPAN_CONFIG.attemptsPerSpan; attempt++) {
			trials.push({ digits: generateDigitSequence(span), spanLength: span, attemptNumber: attempt, direction });
		}
	}
	return trials;
}

/** Forward: same order; backward: reversed order */
export function checkResponse(trial: DigitSpanTrial, userResponse: number[]): boolean {
	const expected = trial.direction === 'backward' ? [...trial.digits].reverse() : trial.digits;
	if (userResponse.length !== expected.length) return false;
	return expected.every((d, i) => d === userResponse[i]);
}

function scoreDirection(results: DigitSpanResult[]) {
	const correct = results.filter((r) => r.correct);
	return {
		// Longest span: longest length with at least one correct trial (LDSF / LDSB)
		span: correct.reduce((max, r) => Math.max(max, r.trial.spanLength), 0),
		// Raw score: number of correct trials (WAIS scoring)
		trialsCorrect: correct.length,
		total: results.length
	};
}

export function computeSummary(results: DigitSpanResult[]): DigitSpanSummary {
	const fwd = scoreDirection(results.filter((r) => r.trial.direction === 'forward'));
	const bwd = scoreDirection(results.filter((r) => r.trial.direction === 'backward'));
	return {
		type: 'digit-span',
		direction: 'both',
		forwardSpan: fwd.span,
		backwardSpan: bwd.span,
		forwardTrialsCorrect: fwd.trialsCorrect,
		backwardTrialsCorrect: bwd.trialsCorrect,
		forwardTotalTrials: fwd.total,
		backwardTotalTrials: bwd.total,
		forwardScore: fwd.trialsCorrect,
		backwardScore: bwd.trialsCorrect
	};
}
