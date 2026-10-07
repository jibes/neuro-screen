import { shuffled } from '$lib/utils/random.js';
import type { CorsiTrial, CorsiResult } from './types.js';
import type { CorsiSummary } from '$lib/db/models.js';
import { CORSI_CONFIG } from './config.js';
import { mean } from '$lib/utils/statistics.js';

/** Random sequence of distinct blocks (no block is shown twice, as in the original Corsi task) */
export function generateSequence(length: number, blockCount: number = CORSI_CONFIG.blockPositions.length): number[] {
	const blocks = Array.from({ length: blockCount }, (_, i) => i);
	return shuffled(blocks).slice(0, Math.min(length, blockCount));
}

export function generateForwardTrials(): CorsiTrial[] {
	const trials: CorsiTrial[] = [];
	for (let span = CORSI_CONFIG.startSpan; span <= CORSI_CONFIG.maxSpan; span++) {
		for (let attempt = 1; attempt <= CORSI_CONFIG.attemptsPerSpan; attempt++) {
			trials.push({
				sequence: generateSequence(span),
				spanLength: span,
				attemptNumber: attempt
			});
		}
	}
	return trials;
}

export function checkResponse(trial: CorsiTrial, userResponse: number[]): boolean {
	if (userResponse.length !== trial.sequence.length) return false;
	return trial.sequence.every((id, i) => id === userResponse[i]);
}

export function computeSummary(results: CorsiResult[]): CorsiSummary {
	let forwardSpan = 0;
	let forwardScore = 0;
	const responseTimes: number[] = [];

	const bySpan = new Map<number, CorsiResult[]>();
	for (const r of results) {
		const span = r.trial.spanLength;
		if (!bySpan.has(span)) bySpan.set(span, []);
		bySpan.get(span)!.push(r);
		if (r.responseTimeMs > 0) responseTimes.push(r.responseTimeMs);
	}

	for (const [span, spanResults] of bySpan) {
		const correctCount = spanResults.filter((r) => r.correct).length;
		if (correctCount > 0) {
			forwardSpan = span;
		}
		forwardScore += correctCount;
	}

	return {
		type: 'corsi',
		forwardSpan,
		backwardSpan: 0,
		forwardScore,
		backwardScore: 0,
		totalScore: forwardScore,
		meanResponseTime: mean(responseTimes)
	};
}
