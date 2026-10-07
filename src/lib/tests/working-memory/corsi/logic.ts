import { shuffled } from '$lib/utils/random.js';
import type { CorsiTrial, CorsiResult, CorsiDirection } from './types.js';
import type { CorsiSummary } from '$lib/db/models.js';
import { CORSI_CONFIG } from './config.js';
import { mean } from '$lib/utils/statistics.js';

/** Random sequence of distinct blocks (no block is shown twice, as in the original Corsi task) */
export function generateSequence(length: number, blockCount: number = CORSI_CONFIG.blockPositions.length): number[] {
	const blocks = Array.from({ length: blockCount }, (_, i) => i);
	return shuffled(blocks).slice(0, Math.min(length, blockCount));
}

/** Two trials per length for one direction (Kessels et al., 2000) */
export function generateTrials(direction: CorsiDirection): CorsiTrial[] {
	const trials: CorsiTrial[] = [];
	for (let span = CORSI_CONFIG.startSpan; span <= CORSI_CONFIG.maxSpan; span++) {
		for (let attempt = 1; attempt <= CORSI_CONFIG.attemptsPerSpan; attempt++) {
			trials.push({ sequence: generateSequence(span), spanLength: span, attemptNumber: attempt, direction });
		}
	}
	return trials;
}

/** Forward: same order; backward: reversed order */
export function checkResponse(trial: CorsiTrial, userResponse: number[]): boolean {
	const expected = trial.direction === 'backward' ? [...trial.sequence].reverse() : trial.sequence;
	if (userResponse.length !== expected.length) return false;
	return expected.every((id, i) => id === userResponse[i]);
}

function scoreDirection(results: CorsiResult[]) {
	const correct = results.filter((r) => r.correct);
	const span = correct.reduce((max, r) => Math.max(max, r.trial.spanLength), 0);
	// Kessels et al. (2000): total score = block span × number of correctly reproduced sequences
	return { span, correctTrials: correct.length, totalScore: span * correct.length };
}

export function computeSummary(results: CorsiResult[]): CorsiSummary {
	const fwd = scoreDirection(results.filter((r) => r.trial.direction === 'forward'));
	const bwd = scoreDirection(results.filter((r) => r.trial.direction === 'backward'));
	const responseTimes = results.map((r) => r.responseTimeMs).filter((t) => t > 0);

	return {
		type: 'corsi',
		forwardSpan: fwd.span,
		backwardSpan: bwd.span,
		forwardScore: fwd.totalScore,
		backwardScore: bwd.totalScore,
		totalScore: fwd.totalScore + bwd.totalScore,
		meanResponseTime: mean(responseTimes)
	};
}
