import type { RecallResult, RecognitionItem } from './types.js';
import type { WordListSummary } from '$lib/db/models.js';
import { WORD_LIST_CONFIG } from './config.js';
import { dPrime } from '$lib/utils/statistics.js';

export function scoreRecall(
	recalledWords: string[],
	targetWords: readonly string[]
): { correctCount: number; intrusionCount: number } {
	const targetSet = new Set(targetWords.map((w) => w.toUpperCase().trim()));
	let correctCount = 0;
	let intrusionCount = 0;
	const counted = new Set<string>();

	for (const word of recalledWords) {
		const normalized = word.toUpperCase().trim();
		if (!normalized) continue;
		if (counted.has(normalized)) continue;
		counted.add(normalized);

		if (targetSet.has(normalized)) {
			correctCount++;
		} else {
			intrusionCount++;
		}
	}

	return { correctCount, intrusionCount };
}

export function computeLearningSlope(wordsPerTrial: number[]): number {
	if (wordsPerTrial.length < 2) return 0;
	const n = wordsPerTrial.length;
	let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
	for (let i = 0; i < n; i++) {
		sumX += i + 1;
		sumY += wordsPerTrial[i];
		sumXY += (i + 1) * wordsPerTrial[i];
		sumX2 += (i + 1) * (i + 1);
	}
	return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}

export function computeSummary(
	learningResults: RecallResult[],
	shortDelayResult: RecallResult | null,
	recognitionItems: RecognitionItem[]
): WordListSummary {
	const wordsPerTrial = learningResults.map((r) => r.correctCount);
	const totalLearned = wordsPerTrial.length > 0 ? wordsPerTrial[wordsPerTrial.length - 1] : 0;

	const recogHits = recognitionItems.filter((r) => r.isTarget && r.userSaidYes).length;
	const recogFA = recognitionItems.filter((r) => !r.isTarget && r.userSaidYes).length;
	const totalTargets = recognitionItems.filter((r) => r.isTarget).length;
	const totalDistractors = recognitionItems.filter((r) => !r.isTarget).length;

	return {
		type: 'word-list',
		learningTrials: learningResults.length,
		wordsPerTrial,
		totalLearned,
		learningSlope: computeLearningSlope(wordsPerTrial),
		shortDelayFreeRecall: shortDelayResult?.correctCount ?? 0,
		longDelayFreeRecall: 0,
		recognitionHits: recogHits,
		recognitionFalseAlarms: recogFA,
		dPrimeRecognition: totalTargets > 0 ? dPrime(recogHits, totalTargets, recogFA, totalDistractors) : 0
	};
}
